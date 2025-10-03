// supabase/functions/enrich-utilities/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Haversine formula for distance (ft) between two lat/lng points
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // meters
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 3.28084; // meters → feet
}

// Compute minimum distance from point → polyline
function minDistanceToLine(lat: number, lng: number, paths: any[][]) {
  let minDist = Infinity;

  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const [x1, y1] = path[i];       // lon, lat
      const [x2, y2] = path[i + 1];
      const d1 = haversineDistance(lat, lng, y1, x1);
      const d2 = haversineDistance(lat, lng, y2, x2);
      minDist = Math.min(minDist, d1, d2);
    }
  }
  return Math.round(minDist);
}

// Format ArcGIS features → JSON for Supabase
function formatLines(features: any[], geo_lat: number, geo_lng: number) {
  return features.map((f) => {
    const attrs = f.attributes || {};
    const geom = f.geometry || {};
    const distance_ft = geom.paths
      ? minDistanceToLine(geo_lat, geo_lng, geom.paths)
      : null;

    return {
      diameter: attrs.DIAMETER || null,
      material: attrs.MATERIAL || null,
      status: attrs.STATUS || null,
      distance_ft
    };
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { application_id } = await req.json();
    console.log('Enriching utilities for application:', application_id);

    // 1. Get parcel lat/lng + city
    const { data: app, error: fetchError } = await supabase
      .from("applications")
      .select("geo_lat, geo_lng, city")
      .eq("id", application_id)
      .maybeSingle();

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      throw new Error("Error fetching application");
    }

    if (!app) {
      console.error('Application not found:', application_id);
      throw new Error("Application not found");
    }

    const { geo_lat, geo_lng, city } = app;

    if (!geo_lat || !geo_lng) {
      console.error('Missing coordinates for application:', application_id);
      throw new Error("Missing coordinates");
    }

    // 2. Decide city → endpoint set
    const UTILITY_ENDPOINTS: Record<string, any> = {
      houston: {
        water: {
          name: "COH Water Distribution Mains",
          url: "https://cohgis.houstontx.gov/arcgis/rest/services/COH_Public/COH_WaterDistributionMains/MapServer/0",
          outFields: ["DIAMETER", "MATERIAL", "STATUS"],
          geometryType: "esriGeometryPolyline"
        },
        sewer: {
          name: "COH Sanitary Sewer Lines",
          url: "https://cohgis.houstontx.gov/arcgis/rest/services/COH_Public/COH_SanitarySewerLines/MapServer/0",
          outFields: ["DIAMETER", "MATERIAL", "STATUS"],
          geometryType: "esriGeometryPolyline"
        },
        storm: {
          name: "COH Storm Sewer Lines",
          url: "https://cohgis.houstontx.gov/arcgis/rest/services/COH_Public/COH_StormSewerLines/MapServer/0",
          outFields: ["DIAMETER", "MATERIAL", "STATUS"],
          geometryType: "esriGeometryPolyline"
        }
      },
      austin: {
        water: {
          name: "AWU Waterlines",
          url: "https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/AWU_Waterlines/FeatureServer/0",
          outFields: ["DIAMETER", "MATERIAL", "STATUS", "INSTALL_YEAR"],
          geometryType: "esriGeometryPolyline"
        },
        sewer: {
          name: "AWU Wastewaterlines",
          url: "https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/AWU_Wastewaterlines/FeatureServer/0",
          outFields: ["DIAMETER", "MATERIAL", "STATUS", "INSTALL_YEAR"],
          geometryType: "esriGeometryPolyline"
        },
        storm: {
          name: "AWU Reclaimed Waterlines",
          url: "https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/AWU_ReclaimedWaterlines/FeatureServer/0",
          outFields: ["DIAMETER", "MATERIAL", "STATUS"],
          geometryType: "esriGeometryPolyline"
        }
      }
    };

    let endpoints: Record<string, any> = {};
    const cityLower = city?.toLowerCase() || '';
    
    if (cityLower.includes("houston")) {
      console.log('Using Houston endpoints');
      endpoints = UTILITY_ENDPOINTS.houston;
    } else if (cityLower.includes("austin")) {
      console.log('Using Austin endpoints');
      endpoints = UTILITY_ENDPOINTS.austin;
    } else {
      // No supported city
      console.log('City not supported for utilities:', city);
      await supabase.from("applications")
        .update({ data_flags: ["utilities_not_supported"] })
        .eq("id", application_id);
      return new Response(
        JSON.stringify({ status: "skipped", message: "City not supported" }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Helper function for ArcGIS query with better error handling
    const queryArcGIS = async (endpointConfig: any, utilityType: string): Promise<{ features: any[], unreachable: boolean }> => {
      if (!endpointConfig || !endpointConfig.url) return { features: [], unreachable: false };
      
      const params = new URLSearchParams({
        f: "json",
        geometry: `${geo_lng},${geo_lat}`,
        geometryType: "esriGeometryPoint",
        inSR: "4326",
        spatialRel: "esriSpatialRelIntersects",
        outFields: endpointConfig.outFields.join(","),
        returnGeometry: "true",
        distance: "1000",
        units: "esriSRUnit_Foot",
      });
      
      const queryUrl = `${endpointConfig.url}/query?${params.toString()}`;
      console.log(`ArcGIS Query URL (${utilityType}):`, queryUrl);
      
      try {
        const resp = await fetch(queryUrl, {
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });
        
        if (!resp.ok) {
          console.error(`${utilityType} API returned status:`, resp.status);
          return { features: [], unreachable: false };
        }
        
        const json = await resp.json();
        
        // Diagnostic logging: see raw response in Supabase logs
        console.log(`ArcGIS Response (${utilityType}):`, JSON.stringify(json, null, 2));
        
        if (json.error) {
          console.error(`${utilityType} API error:`, json.error);
          return { features: [], unreachable: false };
        }
        
        console.log(`${utilityType} features found:`, json.features?.length || 0);
        return { features: json.features ?? [], unreachable: false };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`${utilityType} query failed:`, errorMsg);
        
        // Check if it's a network/DNS error (API unreachable)
        const isUnreachable = errorMsg.includes('dns error') || 
                             errorMsg.includes('failed to lookup') ||
                             errorMsg.includes('Connection refused') ||
                             errorMsg.includes('timeout');
        
        return { features: [], unreachable: isUnreachable };
      }
    };

    // 3. Run queries with error handling
    const [waterResult, sewerResult, stormResult] = await Promise.all([
      queryArcGIS(endpoints.water, "water"),
      queryArcGIS(endpoints.sewer, "sewer"),
      endpoints.storm ? queryArcGIS(endpoints.storm, "storm") : Promise.resolve({ features: [], unreachable: false })
    ]);

    const waterResults = waterResult.features;
    const sewerResults = sewerResult.features;
    const stormResults = stormResult.features;

    // Check if any APIs were unreachable
    const apiUnreachable = waterResult.unreachable || sewerResult.unreachable || stormResult.unreachable;
    
    // Determine data flags
    let flags: string[] = [];
    if (apiUnreachable) {
      flags.push("utilities_api_unreachable");
      console.log("⚠️ Utility APIs are unreachable (DNS/network error)");
    } else if (!waterResults.length && !sewerResults.length && !stormResults.length) {
      flags.push("utilities_not_found");
      console.log("⚠️ No utility lines found in API response");
    }

    // 4. Update row with formatted lines including distance
    const { error: updateError } = await supabase.from("applications").update({
      water_lines: formatLines(waterResults, geo_lat, geo_lng),
      sewer_lines: formatLines(sewerResults, geo_lat, geo_lng),
      storm_lines: formatLines(stormResults, geo_lat, geo_lng),
      data_flags: flags
    }).eq("id", application_id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error(`Failed to update application: ${updateError.message}`);
    }

    console.log('Utilities enriched successfully:', {
      water: waterResults.length,
      sewer: sewerResults.length,
      storm: stormResults.length
    });

    return new Response(
      JSON.stringify({ 
        status: "ok",
        data: {
          water_lines: waterResults.length,
          sewer_lines: sewerResults.length,
          storm_lines: stormResults.length
        }
      }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error in enrich-utilities:', err);
    return new Response(
      JSON.stringify({ error: err.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
