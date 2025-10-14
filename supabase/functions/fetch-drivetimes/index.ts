import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { logExternalCall } from "../_shared/observability.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { application_id, origin, destinations } = await req.json();
    console.log(`[fetch-drivetimes] Calculating drive times for application ${application_id}`);

    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleApiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY not configured');
    }

    // Build destinations string: "lat1,lng1|lat2,lng2|lat3,lng3"
    const destinationsStr = destinations.map((d: any) => `${d.lat},${d.lng}`).join('|');
    
    const distanceMatrixUrl = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    distanceMatrixUrl.searchParams.set('origins', `${origin.lat},${origin.lng}`);
    distanceMatrixUrl.searchParams.set('destinations', destinationsStr);
    distanceMatrixUrl.searchParams.set('mode', 'driving');
    distanceMatrixUrl.searchParams.set('departure_time', 'now');
    distanceMatrixUrl.searchParams.set('key', googleApiKey);

    console.log('[fetch-drivetimes] Calling Distance Matrix API');
    const dmStartTime = Date.now();
    const response = await fetch(distanceMatrixUrl.toString());
    await logExternalCall(
      supabase,
      'google_distance_matrix',
      distanceMatrixUrl.toString(),
      Date.now() - dmStartTime,
      response.ok,
      application_id
    );

    if (!response.ok) {
      throw new Error(`Distance Matrix API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`Distance Matrix API returned status: ${data.status}`);
    }

    // Parse results
    const results = destinations.map((dest: any, index: number) => {
      const element = data.rows[0]?.elements[index];
      
      if (element?.status !== 'OK') {
        return {
          destination: dest.name,
          duration_min: null,
          distance_mi: null,
          status: element?.status || 'UNKNOWN',
        };
      }

      return {
        destination: dest.name,
        duration_min: Math.round(element.duration.value / 60), // seconds to minutes
        distance_mi: parseFloat((element.distance.value / 1609.34).toFixed(1)), // meters to miles
        status: 'OK',
      };
    });

    // Filter successful results
    const successfulResults = results.filter(r => r.status === 'OK');

    // Write to applications.drivetimes
    await supabase
      .from('applications')
      .update({ drivetimes: successfulResults })
      .eq('id', application_id);

    console.log(`[fetch-drivetimes] Success! Calculated ${successfulResults.length} drive times in ${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify(successfulResults),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[fetch-drivetimes] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
