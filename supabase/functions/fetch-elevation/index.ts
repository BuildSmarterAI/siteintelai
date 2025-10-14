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

    const { lat, lng, application_id } = await req.json();
    console.log(`[fetch-elevation] Getting elevation for ${lat}, ${lng}`);

    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleApiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY not configured');
    }

    // Try Google Elevation API
    const googleUrl = `https://maps.googleapis.com/maps/api/elevation/json?locations=${lat},${lng}&key=${googleApiKey}`;
    
    console.log('[fetch-elevation] Calling Google Elevation API');
    const googleStartTime = Date.now();
    const googleResponse = await fetch(googleUrl);
    await logExternalCall(
      supabase,
      'google_elevation_api',
      googleUrl,
      Date.now() - googleStartTime,
      googleResponse.ok,
      application_id
    );

    if (googleResponse.ok) {
      const data = await googleResponse.json();
      
      if (data.status === 'OK' && data.results?.[0]?.elevation !== undefined) {
        const elevationMeters = data.results[0].elevation;
        const elevationFeet = elevationMeters * 3.28084; // Convert to feet
        
        console.log(`[fetch-elevation] Success! Elevation: ${elevationFeet.toFixed(2)} ft`);
        
        return new Response(
          JSON.stringify({
            elevation_ft: parseFloat(elevationFeet.toFixed(2)),
            source: 'google_elevation_api',
            resolution: '10m',
            queried_at: new Date().toISOString(),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fallback to USGS EPQS (if Google fails)
    console.log('[fetch-elevation] Google failed, trying USGS EPQS');
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
        console.log(`[fetch-elevation] USGS Success! Elevation: ${elevationFeet} ft`);
        
        return new Response(
          JSON.stringify({
            elevation_ft: parseFloat(elevationFeet.toFixed(2)),
            source: 'usgs_epqs',
            resolution: '30m',
            queried_at: new Date().toISOString(),
          }),
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
