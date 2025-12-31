/**
 * fetch-parcels-geojson Edge Function
 * 
 * Returns GeoJSON FeatureCollection of parcels for map visualization.
 * Implements hybrid fallback:
 * 1. First queries canonical_parcels table (SiteIntel infrastructure)
 * 2. Falls back to external APIs via fetch-parcels if coverage gap detected
 * 3. Logs coverage gaps to gis_coverage_events for ETL prioritization
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BboxRequest {
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  zoom: number;
}

interface ParcelFeature {
  type: "Feature";
  geometry: unknown;
  properties: {
    parcel_id: string;
    owner_name: string | null;
    situs_address: string | null;
    acreage: number | null;
    land_use_desc: string | null;
    jurisdiction: string | null;
    source: "canonical" | "external";
    source_agency: string | null;
  };
}

interface GeoJSONResponse {
  type: "FeatureCollection";
  features: ParcelFeature[];
  metadata: {
    source: "canonical" | "external" | "mixed";
    canonical_count: number;
    external_count: number;
    coverage_gap: boolean;
    bbox: [number, number, number, number];
    zoom: number;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const body: BboxRequest = await req.json();
    const { bbox, zoom } = body;
    
    console.log("[fetch-parcels-geojson] === Request ===");
    console.log(`[fetch-parcels-geojson] bbox: [${bbox.join(", ")}], zoom: ${zoom}`);

    // Validate bbox
    if (!Array.isArray(bbox) || bbox.length !== 4) {
      return new Response(
        JSON.stringify({ error: "Invalid bbox format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only fetch at zoom 14+ to avoid too many parcels
    if (zoom < 14) {
      const emptyResponse: GeoJSONResponse = {
        type: "FeatureCollection",
        features: [],
        metadata: {
          source: "canonical",
          canonical_count: 0,
          external_count: 0,
          coverage_gap: false,
          bbox,
          zoom,
        },
      };
      return new Response(JSON.stringify(emptyResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [minLng, minLat, maxLng, maxLat] = bbox;
    
    // Step 1: Query canonical_parcels using ST_Intersects with bbox
    console.log("[fetch-parcels-geojson] Querying canonical_parcels...");
    
    const { data: canonicalParcels, error: canonicalError } = await supabase.rpc(
      "find_parcels_in_bbox",
      {
        min_lng: minLng,
        min_lat: minLat,
        max_lng: maxLng,
        max_lat: maxLat,
        max_results: 200, // Limit for performance
      }
    );

    if (canonicalError) {
      console.error("[fetch-parcels-geojson] RPC error:", canonicalError.message);
    }

    const canonicalCount = canonicalParcels?.length || 0;
    console.log(`[fetch-parcels-geojson] Canonical parcels found: ${canonicalCount}`);

    // Convert canonical parcels to GeoJSON features
    const canonicalFeatures: ParcelFeature[] = (canonicalParcels || []).map((p: any) => ({
      type: "Feature" as const,
      geometry: p.geom_json || p.geom,
      properties: {
        parcel_id: p.source_parcel_id || p.id?.toString() || "",
        owner_name: p.owner_name || null,
        situs_address: p.situs_address || null,
        acreage: p.acreage || null,
        land_use_desc: p.land_use_desc || null,
        jurisdiction: p.jurisdiction || null,
        source: "canonical" as const,
        source_agency: p.source_agency || "SiteIntel",
      },
    }));

    // Step 2: Check if we need external fallback (coverage gap)
    const COVERAGE_THRESHOLD = 5; // If fewer than 5 canonical parcels, try external
    let externalFeatures: ParcelFeature[] = [];
    let coverageGap = false;

    if (canonicalCount < COVERAGE_THRESHOLD) {
      // Detect which counties are in this bbox
      const countiesInView = findCountiesInBbox(bbox);
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      const primaryCounty = detectJurisdiction(centerLat, centerLng);
      
      console.log(`[fetch-parcels-geojson] Coverage gap detected (${canonicalCount} < ${COVERAGE_THRESHOLD})`);
      console.log(`[fetch-parcels-geojson] Counties in view: ${countiesInView.join(', ') || 'none'}`);
      console.log(`[fetch-parcels-geojson] Primary county (center): ${primaryCounty}`);
      
      coverageGap = true;

      // Only fetch from external if we have a known county
      if (primaryCounty !== 'unknown' || countiesInView.length > 0) {
        try {
          // Call fetch-parcels with explicit county for better routing
          const targetCounty = primaryCounty !== 'unknown' ? primaryCounty : countiesInView[0];
          
          const { data: externalData, error: externalError } = await supabase.functions.invoke(
            "fetch-parcels",
            {
              body: { 
                bbox, 
                zoom,
                county: targetCounty, // Pass explicit county to avoid detection issues
              },
            }
          );

          if (externalError) {
            console.error("[fetch-parcels-geojson] External fetch error:", externalError.message);
          } else if (externalData?.features) {
            externalFeatures = externalData.features.map((f: any) => ({
              type: "Feature" as const,
              geometry: f.geometry,
              properties: {
                parcel_id: f.properties?.parcel_id || "",
                owner_name: f.properties?.owner_name || null,
                situs_address: f.properties?.situs_address || null,
                acreage: f.properties?.acreage || null,
                land_use_desc: null,
                jurisdiction: f.properties?.county || targetCounty,
                source: "external" as const,
                source_agency: f.properties?.source || "External API",
              },
            }));
            console.log(`[fetch-parcels-geojson] External parcels fetched: ${externalFeatures.length} from ${targetCounty}`);
          }
        } catch (err) {
          console.error("[fetch-parcels-geojson] Failed to fetch external:", err);
        }
      } else {
        console.log("[fetch-parcels-geojson] No known county in viewport, skipping external fetch");
      }

      // Log coverage gap event for ETL prioritization
      try {
        await supabase.from("gis_coverage_events").insert({
          event_type: "bbox_coverage_gap",
          jurisdiction: detectJurisdiction(minLat, minLng),
          layer_type: "parcels",
          bbox: bbox,
          metadata: {
            canonical_count: canonicalCount,
            external_count: externalFeatures.length,
            zoom,
            timestamp: new Date().toISOString(),
          },
        });
        console.log("[fetch-parcels-geojson] Coverage gap logged to gis_coverage_events");
      } catch (logErr) {
        console.warn("[fetch-parcels-geojson] Failed to log coverage gap:", logErr);
      }
    }

    // Step 3: Merge features (prefer canonical, add external for gaps)
    // Deduplicate by parcel_id if both sources have same parcel
    const seenIds = new Set(canonicalFeatures.map((f) => f.properties.parcel_id));
    const uniqueExternalFeatures = externalFeatures.filter(
      (f) => !seenIds.has(f.properties.parcel_id)
    );

    const allFeatures = [...canonicalFeatures, ...uniqueExternalFeatures];

    // Determine overall source
    let source: "canonical" | "external" | "mixed" = "canonical";
    if (canonicalCount === 0 && uniqueExternalFeatures.length > 0) {
      source = "external";
    } else if (canonicalCount > 0 && uniqueExternalFeatures.length > 0) {
      source = "mixed";
    }

    const response: GeoJSONResponse = {
      type: "FeatureCollection",
      features: allFeatures,
      metadata: {
        source,
        canonical_count: canonicalCount,
        external_count: uniqueExternalFeatures.length,
        coverage_gap: coverageGap,
        bbox,
        zoom,
      },
    };

    const duration = Date.now() - startTime;
    console.log(`[fetch-parcels-geojson] Response: ${allFeatures.length} features (${source}) in ${duration}ms`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[fetch-parcels-geojson] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * County bounds for jurisdiction detection - matches fetch-parcels COUNTY_BOUNDS
 */
const COUNTY_BOUNDS: Record<string, { minLng: number; maxLng: number; minLat: number; maxLat: number }> = {
  harris: { minLng: -95.91, maxLng: -94.91, minLat: 29.49, maxLat: 30.17 },
  montgomery: { minLng: -95.86, maxLng: -95.07, minLat: 30.07, maxLat: 30.67 },
  travis: { minLng: -98.17, maxLng: -97.37, minLat: 30.07, maxLat: 30.63 },
  bexar: { minLng: -98.81, maxLng: -98.09, minLat: 29.17, maxLat: 29.73 },
  dallas: { minLng: -97.05, maxLng: -96.52, minLat: 32.55, maxLat: 33.02 },
  tarrant: { minLng: -97.55, maxLng: -96.98, minLat: 32.55, maxLat: 33.00 },
  williamson: { minLng: -98.05, maxLng: -97.28, minLat: 30.48, maxLat: 30.91 },
  fortbend: { minLng: -96.01, maxLng: -95.45, minLat: 29.35, maxLat: 29.82 },
  brazoria: { minLng: -95.85, maxLng: -95.05, minLat: 28.85, maxLat: 29.55 },
  collin: { minLng: -96.90, maxLng: -96.30, minLat: 33.00, maxLat: 33.50 },
};

/**
 * Detect jurisdiction from coordinates - checks all configured counties
 */
function detectJurisdiction(lat: number, lng: number): string {
  for (const [county, bounds] of Object.entries(COUNTY_BOUNDS)) {
    if (lng >= bounds.minLng && lng <= bounds.maxLng && 
        lat >= bounds.minLat && lat <= bounds.maxLat) {
      return county;
    }
  }
  return "unknown";
}

/**
 * Find all counties that intersect with a bounding box
 */
function findCountiesInBbox(bbox: [number, number, number, number]): string[] {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const counties: string[] = [];
  
  for (const [county, bounds] of Object.entries(COUNTY_BOUNDS)) {
    // Check if bboxes overlap
    const overlaps = !(bounds.maxLng < minLng || bounds.minLng > maxLng || 
                       bounds.maxLat < minLat || bounds.minLat > maxLat);
    if (overlaps) {
      counties.push(county);
    }
  }
  
  return counties;
}
