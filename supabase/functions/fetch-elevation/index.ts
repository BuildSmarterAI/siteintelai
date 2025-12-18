import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { logExternalCall } from "../_shared/observability.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate cache key for elevation query
function generateCacheKey(lat: number, lng: number): string {
  return `elevation_${lat.toFixed(5)}_${lng.toFixed(5)}`;
}

// Check if emergency cost mode is active
async function isEmergencyMode(supabase: any): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'emergency_cost_mode')
      .single();
    return data?.value === 'true';
  } catch {
    return false;
  }
}

// Get cached response
async function getCachedResponse(supabase: any, cacheKey: string): Promise<any | null> {
  try {
    const { data, error } = await supabase.rpc('get_cached_api_response', {
      p_cache_key: cacheKey
    });
    if (error) {
      console.log(`[fetch-elevation] Cache miss for ${cacheKey}: ${error.message}`);
      return null;
    }
    if (data) {
      console.log(`[fetch-elevation] Cache HIT for ${cacheKey}`);
      return data;
    }
    return null;
  } catch (e) {
    console.log(`[fetch-elevation] Cache check error: ${e}`);
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
  ttlHours: number = 720 // 30 days default for elevation
): Promise<void> {
  try {
    await supabase.rpc('store_cached_api_response', {
      p_cache_key: cacheKey,
      p_provider: provider,
      p_endpoint: endpoint,
      p_response: response,
      p_ttl_hours: ttlHours
    });
    console.log(`[fetch-elevation] Cached response for ${cacheKey}`);
  } catch (e) {
    console.error(`[fetch-elevation] Failed to cache: ${e}`);
  }
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

    const { lat, lng, application_id, force_refresh = false } = await req.json();
    console.log(`[fetch-elevation] Getting elevation for ${lat}, ${lng}`);

    const cacheKey = generateCacheKey(lat, lng);

    // Try cache first (unless force_refresh)
    if (!force_refresh) {
      const cached = await getCachedResponse(supabase, cacheKey);
      if (cached) {
        console.log(`[fetch-elevation] Returning cached elevation: ${cached.elevation_ft} ft`);
        return new Response(
          JSON.stringify({
            ...cached,
            from_cache: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check emergency mode
    const emergencyMode = await isEmergencyMode(supabase);
    
    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleApiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY not configured');
    }

    // Try Google Elevation API (unless emergency mode)
    if (!emergencyMode) {
      const googleUrl = `https://maps.googleapis.com/maps/api/elevation/json?locations=${lat},${lng}&key=${googleApiKey}`;
      
      console.log('[fetch-elevation] Calling Google Elevation API');
      const googleStartTime = Date.now();
      const googleResponse = await fetch(googleUrl);
      await logExternalCall(
        supabase,
        'google_elevation_api',
        googleUrl.replace(googleApiKey, 'REDACTED'),
        Date.now() - googleStartTime,
        googleResponse.ok,
        application_id
      );

      if (googleResponse.ok) {
        const data = await googleResponse.json();
        
        if (data.status === 'OK' && data.results?.[0]?.elevation !== undefined) {
          const elevationMeters = data.results[0].elevation;
          const elevationFeet = elevationMeters * 3.28084;
          
          const result = {
            elevation_ft: parseFloat(elevationFeet.toFixed(2)),
            source: 'google_elevation_api',
            resolution: '10m',
            queried_at: new Date().toISOString(),
          };

          // Cache the result for 30 days
          await storeInCache(supabase, cacheKey, result, 'google_elevation', 'elevation', 720);
          
          console.log(`[fetch-elevation] Success! Elevation: ${result.elevation_ft} ft`);
          
          return new Response(
            JSON.stringify({ ...result, from_cache: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } else {
      console.log('[fetch-elevation] Emergency mode - skipping Google API');
    }

    // Fallback to USGS EPQS (free, no cost)
    console.log('[fetch-elevation] Trying USGS EPQS fallback');
    const usgsUrl = `https://epqs.nationalmap.gov/v1/json?x=${lng}&y=${lat}&units=Feet&wkid=4326`;
    const usgsStartTime = Date.now();
    const usgsResponse = await fetch(usgsUrl);
    await logExternalCall(
      supabase,
      'usgs_epqs',
      usgsUrl,
      Date.now() - usgsStartTime,
      usgsResponse.ok,
      application_id
    );

    if (usgsResponse.ok) {
      const usgsData = await usgsResponse.json();
      const elevationFeet = usgsData?.value;
      
      if (elevationFeet !== undefined && elevationFeet !== null) {
        const result = {
          elevation_ft: parseFloat(Number(elevationFeet).toFixed(2)),
          source: 'usgs_epqs',
          resolution: '30m',
          queried_at: new Date().toISOString(),
        };

        // Cache USGS result too
        await storeInCache(supabase, cacheKey, result, 'usgs', 'epqs', 720);
        
        console.log(`[fetch-elevation] USGS Success! Elevation: ${result.elevation_ft} ft`);
        
        return new Response(
          JSON.stringify({ ...result, from_cache: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    throw new Error('Both Google and USGS elevation services failed');
  } catch (error) {
    console.error('[fetch-elevation] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
