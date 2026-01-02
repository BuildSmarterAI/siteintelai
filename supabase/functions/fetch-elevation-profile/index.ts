import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { logExternalCall } from "../_shared/observability.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate cache key for elevation profile
function generateCacheKey(coordinates: number[][], samples: number): string {
  const coordHash = coordinates.slice(0, 2).flat().map(n => n.toFixed(4)).join('_');
  return `elevation_profile_${coordHash}_s${samples}`;
}

// Get cached response
async function getCachedResponse(supabase: any, cacheKey: string): Promise<any | null> {
  try {
    const { data, error } = await supabase.rpc('get_cached_api_response', {
      p_cache_key: cacheKey
    });
    if (error || !data) return null;
    console.log(`[fetch-elevation-profile] Cache HIT for ${cacheKey}`);
    return data;
  } catch {
    return null;
  }
}

// Store response in cache
async function storeInCache(
  supabase: any, 
  cacheKey: string, 
  response: any, 
  provider: string,
  endpoint: string,
  ttlHours: number = 720
): Promise<void> {
  try {
    await supabase.rpc('store_cached_api_response', {
      p_cache_key: cacheKey,
      p_provider: provider,
      p_endpoint: endpoint,
      p_response: response,
      p_ttl_hours: ttlHours
    });
    console.log(`[fetch-elevation-profile] Cached response for ${cacheKey}`);
  } catch (e) {
    console.error(`[fetch-elevation-profile] Failed to cache: ${e}`);
  }
}

// Calculate distance in feet between two lat/lng points
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 20902231; // Earth's radius in feet
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Extract transect line (diagonal across parcel) from polygon
function getTransectFromPolygon(coordinates: number[][]): { start: [number, number]; end: [number, number] } {
  // coordinates are [lng, lat] pairs
  const lats = coordinates.map(c => c[1]);
  const lngs = coordinates.map(c => c[0]);
  
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  // Diagonal from SW corner to NE corner
  return {
    start: [minLng, minLat],
    end: [maxLng, maxLat]
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { coordinates, samples = 16, application_id, force_refresh = false } = await req.json();
    
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Invalid coordinates - need polygon with at least 3 points' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[fetch-elevation-profile] Getting profile for polygon with ${coordinates.length} points, ${samples} samples`);

    const cacheKey = generateCacheKey(coordinates, samples);

    // Try cache first
    if (!force_refresh) {
      const cached = await getCachedResponse(supabase, cacheKey);
      if (cached) {
        console.log(`[fetch-elevation-profile] Returning cached profile`);
        return new Response(
          JSON.stringify({ ...cached, from_cache: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleApiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY not configured');
    }

    // Get transect line across the parcel
    const transect = getTransectFromPolygon(coordinates);
    const path = `${transect.start[1]},${transect.start[0]}|${transect.end[1]},${transect.end[0]}`;
    
    // Use Google's path sampling feature
    const googleUrl = `https://maps.googleapis.com/maps/api/elevation/json?path=${path}&samples=${samples}&key=${googleApiKey}`;
    
    console.log('[fetch-elevation-profile] Calling Google Elevation API with path sampling');
    const startTime = Date.now();
    const response = await fetch(googleUrl);
    
    await logExternalCall(
      supabase,
      'google_elevation_api',
      googleUrl.replace(googleApiKey, 'REDACTED'),
      Date.now() - startTime,
      response.ok,
      application_id
    );

    if (!response.ok) {
      throw new Error(`Google Elevation API failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results?.length) {
      throw new Error(`Google API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    // Calculate cumulative distance and build profile
    const profile: Array<{
      distance_ft: number;
      elevation_ft: number;
      lat: number;
      lng: number;
    }> = [];

    let cumulativeDistance = 0;
    let minElevation = Infinity;
    let maxElevation = -Infinity;
    let sumElevation = 0;

    for (let i = 0; i < data.results.length; i++) {
      const point = data.results[i];
      const elevationFeet = point.elevation * 3.28084; // Convert meters to feet
      
      if (i > 0) {
        const prevPoint = data.results[i - 1];
        const dist = haversineDistance(
          prevPoint.location.lat, prevPoint.location.lng,
          point.location.lat, point.location.lng
        );
        cumulativeDistance += dist;
      }

      profile.push({
        distance_ft: Math.round(cumulativeDistance),
        elevation_ft: parseFloat(elevationFeet.toFixed(2)),
        lat: point.location.lat,
        lng: point.location.lng
      });

      minElevation = Math.min(minElevation, elevationFeet);
      maxElevation = Math.max(maxElevation, elevationFeet);
      sumElevation += elevationFeet;
    }

    const result = {
      profile,
      metadata: {
        samples: profile.length,
        total_distance_ft: Math.round(cumulativeDistance),
        min_elevation_ft: parseFloat(minElevation.toFixed(2)),
        max_elevation_ft: parseFloat(maxElevation.toFixed(2)),
        avg_elevation_ft: parseFloat((sumElevation / profile.length).toFixed(2)),
        elevation_range_ft: parseFloat((maxElevation - minElevation).toFixed(2)),
        source: 'google_elevation_api',
        resolution: '10m',
        queried_at: new Date().toISOString()
      }
    };

    // Cache for 30 days
    await storeInCache(supabase, cacheKey, result, 'google_elevation', 'path', 720);

    console.log(`[fetch-elevation-profile] Success! ${profile.length} points, range: ${result.metadata.elevation_range_ft} ft`);

    return new Response(
      JSON.stringify({ ...result, from_cache: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[fetch-elevation-profile] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
