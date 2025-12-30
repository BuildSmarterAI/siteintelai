import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Texas center coordinates for location bias
const TEXAS_CENTER = { lat: 31.0, lng: -100.0 };
const TEXAS_RADIUS = 500000; // 500km radius

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now();
  
  try {
    const { input, sessionToken } = await req.json()
    
    console.log('[google-places] Request received:', { 
      input, 
      sessionToken: sessionToken ? 'provided' : 'none',
      timestamp: new Date().toISOString()
    });
    
    if (!input) {
      console.warn('[google-places] Missing input parameter');
      return new Response(
        JSON.stringify({ error: 'Input parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    
    if (!apiKey) {
      console.error('[google-places] GOOGLE_PLACES_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Google Places API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Build the Google Places Autocomplete API URL with Texas bias
    const params = new URLSearchParams({
      input: input,
      key: apiKey,
      types: 'address',
      // Texas-specific bias
      components: 'country:us',
      location: `${TEXAS_CENTER.lat},${TEXAS_CENTER.lng}`,
      radius: TEXAS_RADIUS.toString(),
      // Prefer results closer to Texas
      strictbounds: 'false'
    })

    if (sessionToken) {
      params.append('sessiontoken', sessionToken)
    }

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`
    
    console.log('[google-places] Calling Google Places API...');
    const response = await fetch(url)
    const data = await response.json()
    
    const duration = Date.now() - startTime;
    
    // Log response status and details
    console.log('[google-places] Google API response:', {
      status: data.status,
      predictions_count: data.predictions?.length || 0,
      error_message: data.error_message || null,
      duration_ms: duration
    });

    // Handle specific Google API errors
    if (data.status === 'REQUEST_DENIED') {
      console.error('[google-places] REQUEST_DENIED:', data.error_message);
      return new Response(
        JSON.stringify({ 
          error: 'Google Places API access denied',
          details: data.error_message,
          status: 'REQUEST_DENIED'
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      console.error('[google-places] OVER_QUERY_LIMIT - quota exceeded');
      return new Response(
        JSON.stringify({ 
          error: 'API quota exceeded',
          status: 'OVER_QUERY_LIMIT'
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (data.status === 'INVALID_REQUEST') {
      console.error('[google-places] INVALID_REQUEST:', data.error_message);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request to Google API',
          details: data.error_message,
          status: 'INVALID_REQUEST'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Log first few predictions for debugging
    if (data.predictions?.length > 0) {
      console.log('[google-places] Sample predictions:', 
        data.predictions.slice(0, 2).map((p: any) => ({
          description: p.description,
          place_id: p.place_id
        }))
      );
    }

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[google-places] Error:', {
      message: error.message,
      stack: error.stack,
      duration_ms: duration
    });
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})