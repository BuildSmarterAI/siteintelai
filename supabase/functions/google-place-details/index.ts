import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now();

  try {
    const { placeId, sessionToken } = await req.json()
    
    console.log('[google-place-details] Request received:', {
      placeId,
      sessionToken: sessionToken ? 'provided' : 'none',
      timestamp: new Date().toISOString()
    });
    
    if (!placeId) {
      console.warn('[google-place-details] Missing placeId parameter');
      return new Response(
        JSON.stringify({ error: 'Place ID parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    
    if (!apiKey) {
      console.error('[google-place-details] GOOGLE_PLACES_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Google Places API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Build the Google Place Details API URL with expanded fields
    const params = new URLSearchParams({
      place_id: placeId,
      key: apiKey,
      // Request all useful fields for address validation and parcel matching
      fields: 'formatted_address,geometry,address_components,types,name,plus_code,url,utc_offset,business_status'
    })

    if (sessionToken) {
      params.append('sessiontoken', sessionToken)
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`
    
    console.log('[google-place-details] Calling Google Places Details API...');
    const response = await fetch(url)
    const data = await response.json()
    
    const duration = Date.now() - startTime;
    
    // Log response status and details
    console.log('[google-place-details] Google API response:', {
      status: data.status,
      has_result: !!data.result,
      error_message: data.error_message || null,
      duration_ms: duration
    });

    // Handle specific Google API errors
    if (data.status === 'REQUEST_DENIED') {
      console.error('[google-place-details] REQUEST_DENIED:', data.error_message);
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

    if (data.status === 'NOT_FOUND') {
      console.warn('[google-place-details] Place not found:', placeId);
      return new Response(
        JSON.stringify({ 
          error: 'Place not found',
          status: 'NOT_FOUND'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (data.status === 'INVALID_REQUEST') {
      console.error('[google-place-details] INVALID_REQUEST:', data.error_message);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request',
          details: data.error_message,
          status: 'INVALID_REQUEST'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Log result details for debugging
    if (data.result) {
      console.log('[google-place-details] Result details:', {
        formatted_address: data.result.formatted_address,
        location: data.result.geometry?.location,
        location_type: data.result.geometry?.location_type,
        types: data.result.types,
        components_count: data.result.address_components?.length || 0,
        plus_code: data.result.plus_code,
        url: data.result.url ? 'present' : 'none'
      });
    }

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[google-place-details] Error:', {
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