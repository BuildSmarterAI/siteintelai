import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Load endpoint catalog
import endpointCatalog from "./endpoint_catalog.json" assert { type: "json" };

// Distance calculator (ft) between lat/lng
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // meters
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 3.28084; // meters → feet
}

// Compute min distance from point to polyline
function minDistanceToLine(lat: number, lng: number, paths: any[][]) {
  let minDist = Infinity;
  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const [x1, y1] = path[i]; // lon, lat
      const [x2, y2] = path[i + 1];
      const d1 = haversineDistance(lat, lng, y1, x1);
      const d2 = haversineDistance(lat, lng, y2, x2);
      minDist = Math.min(minDist, d1, d2);
    }
  }
  return Math.round(minDist);
}

// Format ArcGIS features → JSON with distance
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

// Generic ArcGIS query for polylines
const queryArcGIS = async (url: string, fields: string[], geo_lat: number, geo_lng: number, utilityType: string) => {
  try {
    const params = new URLSearchParams({
      f: "json",
      geometry: `${geo_lng},${geo_lat}`,
      geometryType: "esriGeometryPoint",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: fields.join(","),
      returnGeometry: "true",
      distance: "1000",
      units: "esriSRUnit_Foot"
    });
    
    const queryUrl = `${url}?${params.toString()}`;
    console.log(`Querying ${utilityType}:`, queryUrl);
    
    const resp = await fetch(queryUrl, {
      signal: AbortSignal.timeout(15000)
    });
    
    if (!resp.ok) {
      console.error(`${utilityType} API returned status:`, resp.status);
      throw new Error(`HTTP ${resp.status}`);
    }
    
    const json = await resp.json();
    console.log(`${utilityType} features found:`, json.features?.length || 0);
    
    if (json.error) {
      console.error(`${utilityType} API error:`, json.error);
      throw new Error(json.error.message || "ArcGIS API error");
    }
    
    return json.features ?? [];
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`${utilityType} query failed:`, errorMsg);
    
    // Check if API is unreachable
    if (errorMsg.includes('dns error') || 
        errorMsg.includes('failed to lookup') ||
        errorMsg.includes('Connection refused') ||
        errorMsg.includes('timeout')) {
      throw new Error("api_unreachable");
    }
    
    throw err;
  }
};

// Query for polygon features (MUD boundaries, ETJ, etc.)
const queryPolygon = async (url: string, fields: string[], geo_lat: number, geo_lng: number) => {
  const params = new URLSearchParams({
    f: "json",
    geometry: `${geo_lng},${geo_lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: fields.join(","),
    returnGeometry: "false"
  });
  
  const queryUrl = `${url}?${params.toString()}`;
  console.log('Querying polygon:', queryUrl);
  
  const resp = await fetch(queryUrl, {
    signal: AbortSignal.timeout(15000)
  });
  
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}`);
  }
  
  const json = await resp.json();
  console.log('Polygon features found:', json.features?.length || 0);
  
  return json.features ?? [];
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { application_id } = await req.json();
    console.log('Enriching utilities for application:', application_id);

    // 1. Get application info
    const { data: app, error: fetchErr } = await supabase
      .from("applications")
      .select("geo_lat, geo_lng, county, city")
      .eq("id", application_id)
      .maybeSingle();

    if (fetchErr) {
      console.error('Fetch error:', fetchErr);
      throw new Error("Error fetching application");
    }

    if (!app) {
      console.error('Application not found:', application_id);
      throw new Error("Application not found");
    }

    const { geo_lat, geo_lng, county, city } = app;

    if (!geo_lat || !geo_lng) {
      console.error('Missing coordinates for application:', application_id);
      throw new Error("Missing coordinates");
    }

    let water: any[] = [];
    let sewer: any[] = [];
    let storm: any[] = [];
    let flags: string[] = [];
    let apiUnreachable = false;

    // 2. Decide which catalog entry to use
    const cityLower = city?.toLowerCase() || '';
    
    try {
      if (cityLower.includes("houston")) {
        console.log('Using Houston endpoints');
        const eps = endpointCatalog.houston;
        water = await queryArcGIS(eps.water.url, eps.water.outFields, geo_lat, geo_lng, "water");
        sewer = await queryArcGIS(eps.sewer.url, eps.sewer.outFields, geo_lat, geo_lng, "sewer");
        storm = await queryArcGIS(eps.storm.url, eps.storm.outFields, geo_lat, geo_lng, "storm");
      } else if (cityLower.includes("austin")) {
        console.log('Using Austin endpoints');
        const eps = endpointCatalog.austin;
        water = await queryArcGIS(eps.water.url, eps.water.outFields, geo_lat, geo_lng, "water");
        sewer = await queryArcGIS(eps.sewer.url, eps.sewer.outFields, geo_lat, geo_lng, "sewer");
        if (eps.reclaimed) {
          storm = await queryArcGIS(eps.reclaimed.url, eps.reclaimed.outFields, geo_lat, geo_lng, "reclaimed");
        }
      } else if (county?.toLowerCase().includes("harris")) {
        console.log('Harris County - checking MUD districts');
        
        // Try to find MUD district
        const mudEp = endpointCatalog.harris_county_etj.mud;
        let mudFound = false;
        
        try {
          const mudHits = await queryPolygon(mudEp.url, mudEp.outFields, geo_lat, geo_lng);
          
          if (mudHits.length > 0) {
            const mudAttrs = mudHits[0].attributes;
            const mudDistrict = mudAttrs.DISTRICT_NA || mudAttrs.DISTRICT_NO || null;
            console.log('MUD district found:', mudDistrict);
            
            // Update with MUD info
            await supabase.from("applications").update({
              mud_district: mudDistrict,
              etj_provider: mudAttrs.AGENCY || "MUD"
            }).eq("id", application_id);
            
            mudFound = true;
            flags.push("etj_provider_boundary_only");
          }
        } catch (mudErr) {
          console.error("MUD lookup failed:", mudErr instanceof Error ? mudErr.message : String(mudErr));
        }
        
        // If no MUD found, mark as Harris ETJ
        if (!mudFound) {
          console.log('No MUD district found - marking as Harris ETJ');
          await supabase.from("applications").update({
            mud_district: null,
            etj_provider: "Harris_ETJ"
          }).eq("id", application_id);
          
          flags.push("etj_provider_boundary_only");
        }
      } else {
        console.log('No city-specific endpoints, using statewide fallback');
        flags.push("texas_statewide_tceq");
      }
    } catch (err) {
      if (err instanceof Error && err.message === "api_unreachable") {
        console.log('⚠️ Utility APIs are unreachable (DNS/network error)');
        apiUnreachable = true;
        flags.push("utilities_api_unreachable");
      } else {
        throw err;
      }
    }

    // 3. Determine final flags
    if (apiUnreachable) {
      flags = ["utilities_api_unreachable"];
    } else if (!water.length && !sewer.length && !storm.length && !flags.length) {
      flags.push("utilities_not_found");
    }

    // 4. Save results
    const { error: updateError } = await supabase.from("applications").update({
      water_lines: formatLines(water, geo_lat, geo_lng),
      sewer_lines: formatLines(sewer, geo_lat, geo_lng),
      storm_lines: formatLines(storm, geo_lat, geo_lng),
      data_flags: flags
    }).eq("id", application_id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error(`Failed to update application: ${updateError.message}`);
    }

    console.log('Utilities enriched successfully:', {
      water: water.length,
      sewer: sewer.length,
      storm: storm.length,
      flags
    });

    return new Response(
      JSON.stringify({ 
        status: "ok",
        data: {
          water_lines: water.length,
          sewer_lines: sewer.length,
          storm_lines: storm.length
        }
      }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error in enrich-utilities:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
