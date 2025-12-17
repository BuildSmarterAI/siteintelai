/**
 * Geocode with Cache Edge Function
 * Wraps Google Geocoding API with 30-day caching in geocoder_cache table
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type QueryType = 'address' | 'intersection' | 'point';

interface GeocodeRequest {
  query: string;
  query_type?: QueryType;
}

interface GeocodeResponse {
  lat: number;
  lng: number;
  formatted_address: string;
  confidence: number;
  source: 'cache' | 'google';
  cache_hit: boolean;
}

// Generate SHA-256 hash for cache key
async function generateHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Normalize query for consistent caching
function normalizeQuery(query: string, queryType: QueryType): string {
  const normalized = query.toLowerCase().trim();
  return `${queryType}:${normalized}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, query_type = 'address' }: GeocodeRequest = await req.json();

    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: 'Query must be at least 3 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate cache key
    const normalizedQuery = normalizeQuery(query, query_type);
    const inputHash = await generateHash(normalizedQuery);

    console.log(`[geocode-with-cache] Query: "${query}", Type: ${query_type}, Hash: ${inputHash.substring(0, 12)}...`);

    // Check cache first
    const { data: cacheHit } = await supabase
      .from('geocoder_cache')
      .select('result_data, confidence, geometry')
      .eq('input_hash', inputHash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cacheHit && cacheHit.result_data) {
      console.log(`[geocode-with-cache] Cache HIT for hash ${inputHash.substring(0, 12)}`);
      
      const result = cacheHit.result_data as { lat: number; lng: number; formatted_address: string };
      
      return new Response(
        JSON.stringify({
          lat: result.lat,
          lng: result.lng,
          formatted_address: result.formatted_address,
          confidence: cacheHit.confidence || 0.9,
          source: 'cache',
          cache_hit: true,
        } as GeocodeResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[geocode-with-cache] Cache MISS, calling Google API`);

    // Call Google Geocoding API
    let geocodeQuery = query.trim();
    
    // For intersections, append Houston, TX for better accuracy
    if (query_type === 'intersection') {
      geocodeQuery = `${query.trim()}, Houston, TX`;
    }

    const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(geocodeQuery)}&key=${googleApiKey}`;
    
    const googleResponse = await fetch(googleUrl);
    const googleData = await googleResponse.json();

     if (googleData.status !== 'OK' || !googleData.results?.length) {
       // IMPORTANT: return 200 so clients don't crash on non-2xx responses.
       // Clients can treat this as "no result" and fall back to presets.
       console.error(`[geocode-with-cache] Google API error: ${googleData.status}`);
       return new Response(
         JSON.stringify({
           success: false,
           error: `Geocoding failed: ${googleData.status}`,
           google_status: googleData.status,
         }),
         { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }

    const result = googleData.results[0];
    const location = result.geometry.location;

    // Calculate confidence based on result type
    let confidence = 0.9;
    if (result.geometry.location_type === 'ROOFTOP') {
      confidence = 1.0;
    } else if (result.geometry.location_type === 'RANGE_INTERPOLATED') {
      confidence = 0.85;
    } else if (result.geometry.location_type === 'GEOMETRIC_CENTER') {
      confidence = 0.75;
    } else if (result.geometry.location_type === 'APPROXIMATE') {
      confidence = 0.6;
    }

    // Cache the result (30-day TTL)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const resultData = {
      lat: location.lat,
      lng: location.lng,
      formatted_address: result.formatted_address,
      location_type: result.geometry.location_type,
      place_id: result.place_id,
    };

    const { error: cacheError } = await supabase
      .from('geocoder_cache')
      .upsert({
        input_hash: inputHash,
        input_query: query.trim(),
        query_type: query_type,
        source: 'google',
        result_data: resultData,
        confidence: confidence,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'input_hash',
      });

    if (cacheError) {
      console.error(`[geocode-with-cache] Cache write error:`, cacheError);
      // Continue anyway, caching is non-critical
    } else {
      console.log(`[geocode-with-cache] Cached result, expires: ${expiresAt.toISOString()}`);
    }

    return new Response(
      JSON.stringify({
        lat: location.lat,
        lng: location.lng,
        formatted_address: result.formatted_address,
        confidence,
        source: 'google',
        cache_hit: false,
      } as GeocodeResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[geocode-with-cache] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
