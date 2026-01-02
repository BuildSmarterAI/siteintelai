/**
 * google-place-details - A-08: Enhanced Place Details
 * 
 * Fetches full place details after user selects from autocomplete.
 * Includes caching, traceId, and cost tracking.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlaceDetailsRequest {
  placeId: string;
  sessionToken?: string;
  fields?: string[];
}

interface PlaceDetailsResponse {
  lat: number;
  lng: number;
  formattedAddress: string;
  addressComponents: any[];
  placeTypes: string[];
  viewport?: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } };
  name?: string;
  plusCode?: string;
  url?: string;
  traceId: string;
  cost: number;
  cacheHit: boolean;
}

// Generate 8-char trace ID
function generateTraceId(): string {
  return crypto.randomUUID().substring(0, 8);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  const traceId = generateTraceId();

  try {
    const { placeId, sessionToken, fields }: PlaceDetailsRequest = await req.json();
    
    console.log(`[${traceId}] google-place-details: placeId=${placeId?.substring(0, 20)}...`);
    
    if (!placeId) {
      console.warn(`[${traceId}] Missing placeId parameter`);
      return new Response(
        JSON.stringify({ error: 'Place ID parameter is required', traceId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first (30-day TTL)
    const cacheKey = `place:v1:${placeId}`;
    const { data: cached } = await supabase
      .from('api_cache_universal')
      .select('response')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cached?.response) {
      const cachedResponse = cached.response as PlaceDetailsResponse;
      cachedResponse.traceId = traceId;
      cachedResponse.cacheHit = true;
      cachedResponse.cost = 0;

      console.log(`[${traceId}] Cache hit for place details`);

      await supabase.from('api_logs').insert({
        source: 'google-place-details',
        endpoint: 'cache',
        duration_ms: Date.now() - startTime,
        success: true,
        cache_key: cacheKey,
      }).catch(() => {});

      return new Response(JSON.stringify(cachedResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.error(`[${traceId}] GOOGLE_PLACES_API_KEY not configured`);
      return new Response(
        JSON.stringify({ error: 'Google Places API key not configured', traceId }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check emergency mode
    const { data: emergencyMode } = await supabase
      .from('api_budget_config')
      .select('is_active')
      .eq('budget_type', 'emergency_mode')
      .eq('source', 'google')
      .maybeSingle();

    if (emergencyMode?.is_active) {
      console.log(`[${traceId}] Emergency mode active, blocking Google calls`);
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable', traceId }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the Google Place Details API URL
    const requestFields = fields?.join(',') || 
      'formatted_address,geometry,address_components,types,name,plus_code,url,utc_offset,business_status';
    
    const params = new URLSearchParams({
      place_id: placeId,
      key: apiKey,
      fields: requestFields,
    });

    if (sessionToken) {
      params.append('sessiontoken', sessionToken);
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`;
    
    console.log(`[${traceId}] Calling Google Places Details API...`);
    const googleResponse = await fetch(url);
    const data = await googleResponse.json();
    
    const duration = Date.now() - startTime;

    // Handle Google API errors
    if (data.status === 'REQUEST_DENIED') {
      console.error(`[${traceId}] REQUEST_DENIED:`, data.error_message);
      await supabase.from('api_logs').insert({
        source: 'google-place-details',
        endpoint: 'google-places-api',
        duration_ms: duration,
        success: false,
        error_message: data.error_message,
      }).catch(() => {});

      return new Response(
        JSON.stringify({ error: 'Google Places API access denied', details: data.error_message, traceId }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (data.status === 'NOT_FOUND') {
      console.warn(`[${traceId}] Place not found: ${placeId}`);
      return new Response(
        JSON.stringify({ error: 'Place not found', status: 'NOT_FOUND', traceId }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (data.status === 'INVALID_REQUEST') {
      console.error(`[${traceId}] INVALID_REQUEST:`, data.error_message);
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: data.error_message, traceId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build response
    const result = data.result;
    const geometry = result?.geometry;
    
    const response: PlaceDetailsResponse = {
      lat: geometry?.location?.lat || 0,
      lng: geometry?.location?.lng || 0,
      formattedAddress: result?.formatted_address || '',
      addressComponents: result?.address_components || [],
      placeTypes: result?.types || [],
      viewport: geometry?.viewport ? {
        ne: { lat: geometry.viewport.northeast?.lat, lng: geometry.viewport.northeast?.lng },
        sw: { lat: geometry.viewport.southwest?.lat, lng: geometry.viewport.southwest?.lng },
      } : undefined,
      name: result?.name,
      plusCode: result?.plus_code?.global_code,
      url: result?.url,
      traceId,
      cost: 0.017, // Google Place Details cost with session
      cacheHit: false,
    };

    console.log(`[${traceId}] Place details fetched: ${response.formattedAddress} in ${duration}ms`);

    // Cache the result (30 days)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('api_cache_universal').upsert({
      cache_key: cacheKey,
      provider: 'google',
      endpoint: 'place-details',
      response: response,
      expires_at: expiresAt,
    }, { onConflict: 'cache_key' }).catch(() => {});

    // Log API call
    await supabase.from('api_logs').insert({
      source: 'google-place-details',
      endpoint: 'google-places-api',
      duration_ms: duration,
      success: true,
      cache_key: cacheKey,
    }).catch(() => {});

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${traceId}] Error:`, error.message);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message, traceId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
