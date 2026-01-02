import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Texas center coordinates for location bias
const TEXAS_CENTER = { lat: 31.0, lng: -100.0 };
const TEXAS_RADIUS = 500000; // 500km radius
const CACHE_TTL_HOURS = 1; // Cache results for 1 hour

// Generate cache key from normalized input
function generateCacheKey(input: string): string {
  const normalized = input.toLowerCase().trim().replace(/\s+/g, ' ');
  return `places_autocomplete_${normalized}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now();
  
  // Initialize Supabase client for caching
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
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

    // Check emergency cost mode - if active, return empty to force Nominatim fallback
    const { data: emergencyConfig } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'emergency_cost_mode')
      .single();
    
    if (emergencyConfig?.value === true) {
      console.log('[google-places] Emergency cost mode active, returning empty for Nominatim fallback');
      return new Response(
        JSON.stringify({ 
          predictions: [], 
          status: 'COST_PROTECTION_ACTIVE',
          message: 'Using Nominatim fallback due to cost protection',
          cached: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check cache first
    const cacheKey = generateCacheKey(input);
    const { data: cachedResult } = await supabase
      .from('api_cache_universal')
      .select('response, expires_at')
      .eq('cache_key', cacheKey)
      .single();

    if (cachedResult && new Date(cachedResult.expires_at) > new Date()) {
      console.log('[google-places] Cache HIT for:', cacheKey);
      
      // Update hit count
      await supabase.rpc('increment_cache_hit', { key: cacheKey }).catch(() => {});
      
      return new Response(
        JSON.stringify({ ...cachedResult.response, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
    
    console.log('[google-places] Calling Google Places API (cache MISS)...');
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

      // Cache successful response
      const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();
      await supabase
        .from('api_cache_universal')
        .upsert({
          cache_key: cacheKey,
          provider: 'google',
          endpoint: 'places/autocomplete',
          response: data,
          expires_at: expiresAt,
          hit_count: 0
        }, { onConflict: 'cache_key' })
        .catch(err => console.warn('[google-places] Cache write failed:', err));

      console.log('[google-places] Response cached until:', expiresAt);
    }

    return new Response(
      JSON.stringify({ ...data, cached: false }),
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