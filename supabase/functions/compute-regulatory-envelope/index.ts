import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnvelopeRequest {
  application_id: string;
  constraints_version?: string;
}

interface ZoningConstraints {
  far_cap: number;
  height_cap_ft: number;
  coverage_cap_pct: number;
  setbacks: {
    front: number;
    rear: number;
    left: number;
    right: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { application_id, constraints_version = "v1.0" }: EnvelopeRequest = await req.json();

    if (!application_id) {
      return new Response(
        JSON.stringify({ error: "application_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if envelope already exists
    const { data: existingEnvelope } = await supabase
      .from("regulatory_envelopes")
      .select("*")
      .eq("application_id", application_id)
      .eq("constraints_version", constraints_version)
      .single();

    if (existingEnvelope) {
      return new Response(
        JSON.stringify({ 
          envelope: existingEnvelope,
          cached: true,
          message: "Envelope already computed for this application"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch application data
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        id,
        user_id,
        geo_lat,
        geo_lng,
        acreage_cad,
        zoning_code,
        floodplain_zone,
        wetlands_type,
        governing_path,
        buildability_output_id
      `)
      .eq("id", application_id)
      .single();

    if (appError || !application) {
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user owns this application
    if (application.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - you don't own this application" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get buildability output if exists (contains computed constraints)
    let constraints: ZoningConstraints = {
      far_cap: 2.0, // Default FAR
      height_cap_ft: 45, // Default height
      coverage_cap_pct: 60, // Default coverage
      setbacks: { front: 25, rear: 15, left: 10, right: 10 }
    };

    if (application.buildability_output_id) {
      const { data: buildability } = await supabase
        .from("buildability_outputs")
        .select("buildable_envelope, constraints")
        .eq("id", application.buildability_output_id)
        .single();

      if (buildability?.constraints) {
        const bc = buildability.constraints as Record<string, unknown>;
        constraints = {
          far_cap: (bc.far_cap as number) || constraints.far_cap,
          height_cap_ft: (bc.height_cap_ft as number) || constraints.height_cap_ft,
          coverage_cap_pct: (bc.coverage_cap_pct as number) || constraints.coverage_cap_pct,
          setbacks: (bc.setbacks as typeof constraints.setbacks) || constraints.setbacks
        };
      }
    }

    // Try to get ruleset from buildability_rulesets if governing_path exists
    if (application.governing_path) {
      const { data: ruleset } = await supabase
        .from("buildability_rulesets")
        .select("default_setbacks, development_controls")
        .eq("governing_path", application.governing_path)
        .eq("is_active", true)
        .single();

      if (ruleset) {
        if (ruleset.default_setbacks) {
          constraints.setbacks = ruleset.default_setbacks as typeof constraints.setbacks;
        }
        if (ruleset.development_controls) {
          const dc = ruleset.development_controls as Record<string, unknown>;
          if (dc.max_far) constraints.far_cap = dc.max_far as number;
          if (dc.max_height_ft) constraints.height_cap_ft = dc.max_height_ft as number;
          if (dc.max_coverage_pct) constraints.coverage_cap_pct = dc.max_coverage_pct as number;
        }
      }
    }

    // Get parcel geometry - first try drawn_parcels, then try to construct from lat/lng
    let parcelGeometry: unknown = null;
    let buildableFootprint: unknown = null;
    let geometrySource: 'drawn' | 'api' | 'synthetic' = 'synthetic';

    // Try to get from drawn_parcels via applications_draft
    const { data: draft } = await supabase
      .from("applications_draft")
      .select("drawn_parcel_id")
      .eq("application_id", application_id)
      .single();

    if (draft?.drawn_parcel_id) {
      const { data: drawnParcel } = await supabase
        .from("drawn_parcels")
        .select("geometry")
        .eq("id", draft.drawn_parcel_id)
        .single();

      if (drawnParcel?.geometry) {
        parcelGeometry = drawnParcel.geometry;
        geometrySource = 'drawn';
        console.log("Using parcel geometry from applications_draft.drawn_parcel_id");
      }
    }

    // Fallback: try drawn_parcels directly by application_id (new flow)
    if (!parcelGeometry) {
      const { data: drawnParcel } = await supabase
        .from("drawn_parcels")
        .select("geometry")
        .eq("application_id", application_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (drawnParcel?.geometry) {
        parcelGeometry = drawnParcel.geometry;
        geometrySource = 'drawn';
        console.log("Using parcel geometry from drawn_parcels.application_id");
      }
    }

    // If no drawn parcel, try to get from parcels table or construct approximate
    if (!parcelGeometry && application.geo_lat && application.geo_lng) {
      console.log("No drawn parcel found, creating synthetic geometry from lat/lng and acreage");
      // Create an approximate parcel based on acreage (square for simplicity)
      // 1 acre = 43,560 sq ft
      const acreage = application.acreage_cad || 1; // Default 1 acre if unknown
      const sqft = acreage * 43560;
      const sideLength = Math.sqrt(sqft); // feet
      
      // Convert to degrees (approximate for Texas ~29.7° latitude)
      // 1 degree latitude ≈ 364,000 feet
      // 1 degree longitude ≈ 318,000 feet at 29.7°
      const latDelta = (sideLength / 2) / 364000;
      const lngDelta = (sideLength / 2) / 318000;

      const lat = application.geo_lat;
      const lng = application.geo_lng;

      // Create a simple square polygon
      parcelGeometry = {
        type: "Polygon",
        coordinates: [[
          [lng - lngDelta, lat - latDelta],
          [lng + lngDelta, lat - latDelta],
          [lng + lngDelta, lat + latDelta],
          [lng - lngDelta, lat + latDelta],
          [lng - lngDelta, lat - latDelta]
        ]]
      };
    }

    if (!parcelGeometry) {
      return new Response(
        JSON.stringify({ error: "Could not determine parcel geometry" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compute buildable footprint using PostGIS
    const avgSetback = Math.max(
      constraints.setbacks.front,
      constraints.setbacks.rear,
      constraints.setbacks.left,
      constraints.setbacks.right
    );

    const { data: footprintResult, error: footprintError } = await supabase
      .rpc("compute_buildable_footprint", {
        parcel_geom: parcelGeometry,
        setback_front_ft: constraints.setbacks.front,
        setback_rear_ft: constraints.setbacks.rear,
        setback_side_ft: Math.max(constraints.setbacks.left, constraints.setbacks.right)
      });

    if (footprintError) {
      console.error("Footprint computation error:", footprintError);
      // Fallback: use parcel geometry as buildable footprint (no setbacks applied)
      buildableFootprint = parcelGeometry;
    } else {
      buildableFootprint = footprintResult;
    }

    // Determine exclusion zones (flood, wetlands)
    const exclusionZones: unknown[] = [];
    
    if (application.floodplain_zone && !["X", "NONE", ""].includes(application.floodplain_zone.toUpperCase())) {
      exclusionZones.push({
        type: "flood",
        zone: application.floodplain_zone,
        severity: application.floodplain_zone.startsWith("A") ? "high" : "moderate"
      });
    }

    if (application.wetlands_type) {
      exclusionZones.push({
        type: "wetlands",
        classification: application.wetlands_type
      });
    }

    // Store the regulatory envelope
    const { data: envelope, error: insertError } = await supabase
      .from("regulatory_envelopes")
      .insert({
        application_id,
        parcel_geometry: parcelGeometry,
        buildable_footprint_2d: buildableFootprint || parcelGeometry,
        far_cap: constraints.far_cap,
        height_cap_ft: constraints.height_cap_ft,
        coverage_cap_pct: constraints.coverage_cap_pct,
        setbacks: constraints.setbacks,
        exclusion_zones: exclusionZones,
        constraints_source: {
          governing_path: application.governing_path,
          buildability_output_id: application.buildability_output_id,
          computed_from: application.buildability_output_id ? "buildability_output" : "defaults",
          geometry_source: geometrySource,
        },
        constraints_version
      })
      .select()
      .single();

    if (insertError) {
      console.error("Envelope insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to store regulatory envelope", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        envelope,
        cached: false,
        message: "Regulatory envelope computed successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Envelope computation error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
