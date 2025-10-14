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
      types = ['hospital', 'school', 'transit_station', 'shopping_mall'] 
    } = await req.json();

    console.log(`[fetch-places-context] Finding nearby places for ${lat}, ${lng}`);

    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleApiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY not configured');
    }

    const allPlaces: Array<{
      name: string;
      type: string;
      distance_ft: number;
      address?: string;
    }> = [];

    for (const type of types) {
      const placesUrl = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
      placesUrl.searchParams.set('location', `${lat},${lng}`);
      placesUrl.searchParams.set('radius', radius_meters.toString());
      placesUrl.searchParams.set('type', type);
      placesUrl.searchParams.set('key', googleApiKey);

      console.log(`[fetch-places-context] Searching for ${type}`);
      const placesStartTime = Date.now();
      
      const response = await fetch(placesUrl.toString());
      await logExternalCall(
        supabase,
        'google_places_nearby',
        placesUrl.toString(),
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
        
        for (const place of topResults) {
          const distanceFt = calculateDistance(
            lat,
            lng,
            place.geometry.location.lat,
            place.geometry.location.lng
          );

          allPlaces.push({
            name: place.name,
            type: type.replace(/_/g, ' '),
            distance_ft: Math.round(distanceFt),
            address: place.vicinity,
          });
        }
      }
    }

    // Sort by distance and take top 10
    allPlaces.sort((a, b) => a.distance_ft - b.distance_ft);
    const topPlaces = allPlaces.slice(0, 10);

    // Write to applications.nearby_places
    await supabase
      .from('applications')
      .update({ nearby_places: topPlaces })
      .eq('id', application_id);

    console.log(`[fetch-places-context] Success! Found ${topPlaces.length} places in ${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify(topPlaces),
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
