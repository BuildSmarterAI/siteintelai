import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lng, radius_ft = 500 } = await req.json();
    
    if (!lat || !lng) {
      throw new Error("Missing lat/lng coordinates");
    }
    
    const radius_m = Math.round(radius_ft * 0.3048);
    console.log(`OSM Fallback: Searching ${radius_m}m around ${lat}, ${lng}`);

    // Overpass API query for utility pipelines
    const query = `
      [out:json][timeout:10];
      (
        way["man_made"="pipeline"]["substance"="water"](around:${radius_m},${lat},${lng});
        way["man_made"="pipeline"]["substance"="sewage"](around:${radius_m},${lat},${lng});
        way["man_made"="water_well"](around:${radius_m},${lat},${lng});
        way["waterway"="drain"](around:${radius_m},${lat},${lng});
        way["waterway"="ditch"](around:${radius_m},${lat},${lng});
      );
      out geom;
    `;

    const osmResponse = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(10000)
    });

    if (!osmResponse.ok) {
      throw new Error(`OSM API error: ${osmResponse.status}`);
    }

    const osmData = await osmResponse.json();
    console.log(`OSM elements found: ${osmData.elements?.length || 0}`);

    // Parse OSM elements
    const hasWater = osmData.elements?.some((e: any) => 
      (e.tags?.["man_made"] === "pipeline" && e.tags?.substance === "water") ||
      e.tags?.["man_made"] === "water_well"
    ) || false;
    
    const hasSewer = osmData.elements?.some((e: any) => 
      e.tags?.["man_made"] === "pipeline" && e.tags?.substance === "sewage"
    ) || false;
    
    const hasStorm = osmData.elements?.some((e: any) => 
      e.tags?.waterway === "drain" || e.tags?.waterway === "ditch"
    ) || false;

    const timestamp = new Date().toISOString();

    return new Response(JSON.stringify({
      water: { 
        has_service: hasWater, 
        min_distance_ft: null, 
        service_url: "OpenStreetMap (Overpass API)",
        last_verified: timestamp,
        source: "OSM"
      },
      sewer: { 
        has_service: hasSewer, 
        min_distance_ft: null, 
        service_url: "OpenStreetMap (Overpass API)",
        last_verified: timestamp,
        source: "OSM"
      },
      storm: { 
        has_service: hasStorm, 
        min_distance_ft: null, 
        service_url: "OpenStreetMap (Overpass API)",
        last_verified: timestamp,
        source: "OSM"
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("OSM fallback error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : String(error),
      water: { has_service: false, source: "OSM_ERROR" },
      sewer: { has_service: false, source: "OSM_ERROR" },
      storm: { has_service: false, source: "OSM_ERROR" }
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
