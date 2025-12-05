/**
 * Geocode Intersection Edge Function
 * Uses cache-first approach with Google Geocoding API fallback
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Validates intersection input
 * Expected format: "Street A & Street B" or "Street A and Street B"
 */
function validateIntersection(intersection: string): { valid: boolean; error?: string } {
  if (!intersection || typeof intersection !== 'string') {
    return { valid: false, error: 'Intersection must be a non-empty string' };
  }
  
  intersection = intersection.trim();
  
  if (intersection.length < 7) {
    return { valid: false, error: 'Intersection must be at least 7 characters' };
  }
  
  if (intersection.length > 150) {
    return { valid: false, error: 'Intersection must be less than 150 characters' };
  }
  
  if (!intersection.includes('&') && !/\band\b/i.test(intersection)) {
    return { valid: false, error: 'Intersection must contain "&" or "and" between street names' };
  }
  
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /\$\{/,
    /\x00/,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(intersection)) {
      return { valid: false, error: 'Intersection contains invalid characters' };
    }
  }
  
  return { valid: true };
}

// Generate SHA-256 hash for cache key
async function generateHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { intersection } = await req.json();
    
    // Validate intersection input
    const validation = validateIntersection(intersection);
    if (!validation.valid) {
      console.warn('⚠️ Invalid intersection input:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedIntersection = intersection.trim();
    console.log('[geocode-intersection] Geocoding:', sanitizedIntersection);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!GOOGLE_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate cache key
    const cacheKey = `intersection:${sanitizedIntersection.toLowerCase()}`;
    const inputHash = await generateHash(cacheKey);

    // Check cache first
    const { data: cacheHit } = await supabase
      .from('geocoder_cache')
      .select('result_data, confidence')
      .eq('input_hash', inputHash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cacheHit && cacheHit.result_data) {
      console.log(`[geocode-intersection] Cache HIT`);
      const result = cacheHit.result_data as { lat: number; lng: number; formatted_address: string };
      
      return new Response(
        JSON.stringify({
          lat: result.lat,
          lng: result.lng,
          formatted_address: result.formatted_address,
          confidence: cacheHit.confidence || 0.85,
          cache_hit: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[geocode-intersection] Cache MISS, calling Google API`);

    // Append Houston, TX to help with geocoding accuracy
    const address = `${sanitizedIntersection}, Houston, TX`;
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?` +
      `address=${encodeURIComponent(address)}&` +
      `key=${GOOGLE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Geocoding failed: ${data.status}`);
    }

    const result = data.results[0];
    const location = result.geometry.location;

    // Calculate confidence
    let confidence = 0.85;
    if (result.geometry.location_type === 'GEOMETRIC_CENTER') {
      confidence = 0.9; // Intersections typically return GEOMETRIC_CENTER
    } else if (result.geometry.location_type === 'APPROXIMATE') {
      confidence = 0.7;
    }

    // Cache the result (30-day TTL)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const resultData = {
      lat: location.lat,
      lng: location.lng,
      formatted_address: result.formatted_address,
      location_type: result.geometry.location_type,
    };

    const { error: cacheError } = await supabase
      .from('geocoder_cache')
      .upsert({
        input_hash: inputHash,
        input_query: sanitizedIntersection,
        query_type: 'intersection',
        source: 'google',
        result_data: resultData,
        confidence: confidence,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'input_hash',
      });

    if (cacheError) {
      console.error(`[geocode-intersection] Cache write error:`, cacheError);
    } else {
      console.log(`[geocode-intersection] Cached result`);
    }

    return new Response(
      JSON.stringify({
        lat: location.lat,
        lng: location.lng,
        formatted_address: result.formatted_address,
        confidence,
        cache_hit: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[geocode-intersection] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
