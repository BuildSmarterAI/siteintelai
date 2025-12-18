import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { logExternalCall } from "../_shared/observability.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Haversine formula to calculate distance in feet
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const meters = R * c;
  return meters * 3.28084; // Convert to feet
}

// Generate cache key for places query
function generateCacheKey(lat: number, lng: number, type: string, radius: number): string {
  return `places_nearby_${lat.toFixed(4)}_${lng.toFixed(4)}_${type}_${radius}`;
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
      console.log(`[fetch-places] Cache miss for ${cacheKey}`);
      return null;
    }
    if (data) {
      console.log(`[fetch-places] Cache HIT for ${cacheKey}`);
      return data;
    }
    return null;
  } catch (e) {
    console.log(`[fetch-places] Cache check error: ${e}`);
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
  ttlHours: number = 168 // 7 days default
): Promise<void> {
  try {
    await supabase.rpc('store_cached_api_response', {
      p_cache_key: cacheKey,
      p_provider: provider,
      p_endpoint: endpoint,
      p_response: response,
      p_ttl_hours: ttlHours
    });
    console.log(`[fetch-places] Cached response for ${cacheKey}`);
  } catch (e) {
    console.error(`[fetch-places] Failed to cache: ${e}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { 
      lat, 
      lng, 
      application_id,
      radius_meters = 3000,
      types = ['hospital', 'school', 'transit_station', 'shopping_mall'],
      force_refresh = false
    } = await req.json();

    console.log(`[fetch-places-context] Finding nearby places for ${lat}, ${lng}`);

    // Check emergency mode - use cache only if active
    const emergencyMode = await isEmergencyMode(supabase);
    if (emergencyMode) {
      console.log('[fetch-places] Emergency cost mode active - cache only');
    }

    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleApiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY not configured');
    }

    const allPlaces: Array<{
      name: string;
      type: string;
      distance_ft: number;
      address?: string;
      from_cache?: boolean;
    }> = [];

    let cacheHits = 0;
    let apiCalls = 0;

    for (const type of types) {
      const cacheKey = generateCacheKey(lat, lng, type, radius_meters);

      // Try cache first (unless force_refresh)
      if (!force_refresh) {
        const cached = await getCachedResponse(supabase, cacheKey);
        if (cached) {
          cacheHits++;
          const cachedResults = cached.results || cached;
          if (Array.isArray(cachedResults)) {
            for (const place of cachedResults) {
              allPlaces.push({
                ...place,
                from_cache: true
              });
            }
          }
          continue;
        }
      }

      // In emergency mode, skip API calls for uncached types
      if (emergencyMode) {
        console.log(`[fetch-places] Skipping API call for ${type} due to emergency mode`);
        continue;
      }

      const placesUrl = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
      placesUrl.searchParams.set('location', `${lat},${lng}`);
      placesUrl.searchParams.set('radius', radius_meters.toString());
      placesUrl.searchParams.set('type', type);
      placesUrl.searchParams.set('key', googleApiKey);

      console.log(`[fetch-places-context] Searching for ${type}`);
      const placesStartTime = Date.now();
      
      const response = await fetch(placesUrl.toString());
      apiCalls++;
      
      await logExternalCall(
        supabase,
        'google_places_nearby',
        placesUrl.toString().replace(googleApiKey, 'REDACTED'),
        Date.now() - placesStartTime,
        response.ok,
        application_id
      );

      if (!response.ok) {
        console.warn(`[fetch-places-context] Failed to fetch ${type}:`, response.status);
        continue;
      }

      const data = await response.json();
      
      if (data.status === 'OK' && data.results) {
        // Get top 3 results for this type
        const topResults = data.results.slice(0, 3);
        const processedResults: any[] = [];
        
        for (const place of topResults) {
          const distanceFt = calculateDistance(
            lat,
            lng,
            place.geometry.location.lat,
            place.geometry.location.lng
          );

          const processedPlace = {
            name: place.name,
            type: type.replace(/_/g, ' '),
            distance_ft: Math.round(distanceFt),
            address: place.vicinity,
            from_cache: false
          };

          allPlaces.push(processedPlace);
          processedResults.push(processedPlace);
        }

        // Cache the results for 7 days
        await storeInCache(
          supabase,
          cacheKey,
          { results: processedResults },
          'google_places',
          'nearbysearch',
          168
        );
      }
    }

    // Sort by distance and take top 10
    allPlaces.sort((a, b) => a.distance_ft - b.distance_ft);
    const topPlaces = allPlaces.slice(0, 10);

    // Write to applications.nearby_places
    if (application_id) {
      await supabase
        .from('applications')
        .update({ nearby_places: topPlaces })
        .eq('id', application_id);
    }

    console.log(`[fetch-places-context] Success! Found ${topPlaces.length} places in ${Date.now() - startTime}ms (${cacheHits} cache hits, ${apiCalls} API calls)`);

    return new Response(
      JSON.stringify({
        places: topPlaces,
        meta: {
          total_found: allPlaces.length,
          cache_hits: cacheHits,
          api_calls: apiCalls,
          emergency_mode: emergencyMode
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[fetch-places-context] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
