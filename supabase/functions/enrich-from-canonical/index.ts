import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CanonicalResult {
  zoning: any;
  flood: any;
  utilities: any;
  wetlands: any;
  transportation: any;
  all_constraints: any;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const traceId = crypto.randomUUID().slice(0, 8);
  console.log(`[${traceId}] enrich-from-canonical: START`);

  try {
    const { application_id, fallback_enabled = true } = await req.json();

    if (!application_id) {
      return new Response(
        JSON.stringify({ error: "application_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[${traceId}] Processing application: ${application_id}, fallback_enabled: ${fallback_enabled}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch application to get coordinates
    const { data: app, error: appError } = await supabase
      .from("applications")
      .select("id, geo_lat, geo_lng, formatted_address, county")
      .eq("id", application_id)
      .single();

    if (appError || !app) {
      console.error(`[${traceId}] Application not found:`, appError);
      return new Response(
        JSON.stringify({ error: "Application not found", details: appError }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!app.geo_lat || !app.geo_lng) {
      console.error(`[${traceId}] Application missing coordinates`);
      return new Response(
        JSON.stringify({ error: "Application missing geo_lat/geo_lng coordinates" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[${traceId}] Coordinates: ${app.geo_lat}, ${app.geo_lng}`);

    // Build point geometry as GeoJSON
    const pointGeometry = {
      type: "Point",
      coordinates: [app.geo_lng, app.geo_lat]
    };
    const geometryParam = JSON.stringify(pointGeometry);

    // Call all 6 canonical spatial RPCs in parallel
    const [zoningResult, floodResult, utilitiesResult, wetlandsResult, transportationResult, allConstraintsResult] = 
      await Promise.all([
        supabase.rpc("get_zoning_for_parcel", { parcel_geom: geometryParam }),
        supabase.rpc("get_flood_for_parcel", { parcel_geom: geometryParam }),
        supabase.rpc("get_utilities_for_parcel", { parcel_geom: geometryParam, search_radius_m: 500 }),
        supabase.rpc("get_wetlands_for_parcel", { parcel_geom: geometryParam }),
        supabase.rpc("get_transportation_for_parcel", { parcel_geom: geometryParam, search_radius_m: 500 }),
        supabase.rpc("get_all_constraints_for_parcel", { 
          parcel_geom: geometryParam, 
          utility_radius_m: 500, 
          transport_radius_m: 500 
        }),
      ]);

    // Log RPC results
    console.log(`[${traceId}] Zoning result:`, zoningResult.error ? zoningResult.error : (zoningResult.data ? "has data" : "empty"));
    console.log(`[${traceId}] Flood result:`, floodResult.error ? floodResult.error : (floodResult.data ? "has data" : "empty"));
    console.log(`[${traceId}] Utilities result:`, utilitiesResult.error ? utilitiesResult.error : (utilitiesResult.data ? "has data" : "empty"));
    console.log(`[${traceId}] Wetlands result:`, wetlandsResult.error ? wetlandsResult.error : (wetlandsResult.data ? "has data" : "empty"));
    console.log(`[${traceId}] Transportation result:`, transportationResult.error ? transportationResult.error : (transportationResult.data ? "has data" : "empty"));
    console.log(`[${traceId}] All constraints result:`, allConstraintsResult.error ? allConstraintsResult.error : (allConstraintsResult.data ? "has data" : "empty"));

    const canonicalData: CanonicalResult = {
      zoning: zoningResult.data,
      flood: floodResult.data,
      utilities: utilitiesResult.data,
      wetlands: wetlandsResult.data,
      transportation: transportationResult.data,
      all_constraints: allConstraintsResult.data,
    };

    // Check if canonical data is empty (all null or empty arrays)
    const hasZoning = canonicalData.zoning && Object.keys(canonicalData.zoning).length > 0 && canonicalData.zoning.zoning_code;
    const hasFlood = canonicalData.flood && Object.keys(canonicalData.flood).length > 0 && canonicalData.flood.flood_zone;
    const hasUtilities = canonicalData.utilities && Object.keys(canonicalData.utilities).length > 0;
    const hasWetlands = canonicalData.wetlands && Object.keys(canonicalData.wetlands).length > 0;
    const hasTransportation = canonicalData.transportation && Object.keys(canonicalData.transportation).length > 0;

    const hasCanonicalData = hasZoning || hasFlood || hasUtilities || hasWetlands || hasTransportation;

    console.log(`[${traceId}] Canonical data check - zoning: ${hasZoning}, flood: ${hasFlood}, utilities: ${hasUtilities}, wetlands: ${hasWetlands}, transport: ${hasTransportation}`);

    let updatePayload: Record<string, any> = {};
    let dataSource = "canonical";
    let usedFallback = false;

    if (hasCanonicalData) {
      console.log(`[${traceId}] Using canonical data for enrichment`);

      // Map canonical data to application fields
      if (hasZoning && canonicalData.zoning) {
        updatePayload.zoning_code = canonicalData.zoning.zoning_code;
        updatePayload.land_use_code = canonicalData.zoning.land_use_code;
        updatePayload.land_use_description = canonicalData.zoning.land_use_description;
        updatePayload.overlay_district = canonicalData.zoning.overlay_district;
      }

      if (hasFlood && canonicalData.flood) {
        updatePayload.floodplain_zone = canonicalData.flood.flood_zone;
        updatePayload.base_flood_elevation = canonicalData.flood.bfe;
        updatePayload.fema_panel_id = canonicalData.flood.panel_id;
      }

      if (hasUtilities && canonicalData.utilities) {
        updatePayload.water_lines = canonicalData.utilities.water;
        updatePayload.sewer_lines = canonicalData.utilities.sewer;
        updatePayload.storm_lines = canonicalData.utilities.storm;
        updatePayload.fiber_available = canonicalData.utilities.fiber?.length > 0 || false;
      }

      if (hasWetlands && canonicalData.wetlands) {
        updatePayload.wetlands_type = canonicalData.wetlands.wetland_types?.join(", ") || null;
        updatePayload.wetlands_area_pct = canonicalData.wetlands.total_wetland_pct;
      }

      if (hasTransportation && canonicalData.transportation) {
        updatePayload.traffic_aadt = canonicalData.transportation.nearest_road?.aadt;
        updatePayload.traffic_road_name = canonicalData.transportation.nearest_road?.road_name;
        updatePayload.traffic_distance_ft = canonicalData.transportation.nearest_road?.distance_ft;
      }

      // Store complete canonical constraints in ai_context for AI report generation
      updatePayload.ai_context = {
        ...(app as any).ai_context,
        canonical_constraints: canonicalData.all_constraints,
        data_source: "canonical_tables",
        enriched_at: new Date().toISOString(),
      };

    } else if (fallback_enabled) {
      console.log(`[${traceId}] Canonical tables empty, triggering fallback to external APIs`);
      usedFallback = true;
      dataSource = "external_fallback";

      // Call the existing enrich-feasibility function as fallback
      const { data: fallbackResult, error: fallbackError } = await supabase.functions.invoke(
        "enrich-feasibility",
        { body: { application_id } }
      );

      if (fallbackError) {
        console.error(`[${traceId}] Fallback enrichment failed:`, fallbackError);
        return new Response(
          JSON.stringify({ 
            error: "Fallback enrichment failed", 
            details: fallbackError,
            canonical_attempted: true,
            canonical_empty: true 
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[${traceId}] Fallback enrichment completed`);

      // Update ai_context to note fallback was used
      updatePayload.ai_context = {
        ...(app as any).ai_context,
        data_source: "external_api_fallback",
        canonical_empty: true,
        enriched_at: new Date().toISOString(),
      };
    } else {
      console.log(`[${traceId}] Canonical tables empty and fallback disabled`);
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "Canonical tables are empty and fallback is disabled",
          canonical_data: canonicalData 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update application with enriched data
    if (Object.keys(updatePayload).length > 0) {
      updatePayload.updated_at = new Date().toISOString();
      updatePayload.enrichment_metadata = {
        ...(app as any).enrichment_metadata,
        canonical_enrichment: {
          attempted_at: new Date().toISOString(),
          data_source: dataSource,
          used_fallback: usedFallback,
          fields_updated: Object.keys(updatePayload).filter(k => k !== "updated_at" && k !== "enrichment_metadata"),
        }
      };

      const { error: updateError } = await supabase
        .from("applications")
        .update(updatePayload)
        .eq("id", application_id);

      if (updateError) {
        console.error(`[${traceId}] Failed to update application:`, updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update application", details: updateError }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[${traceId}] Application updated with ${Object.keys(updatePayload).length} fields`);
    }

    const duration = Date.now() - startTime;
    console.log(`[${traceId}] enrich-from-canonical: COMPLETE in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        application_id,
        data_source: dataSource,
        used_fallback: usedFallback,
        canonical_data_available: hasCanonicalData,
        fields_updated: Object.keys(updatePayload).filter(k => k !== "updated_at" && k !== "enrichment_metadata"),
        duration_ms: duration,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error(`[${traceId}] Unexpected error:`, error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
