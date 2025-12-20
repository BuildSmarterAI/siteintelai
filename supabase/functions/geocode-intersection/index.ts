/**
 * Geocode Intersection Edge Function
 * Uses cache-first approach with Google Geocoding API fallback
 * Falls back to OpenStreetMap Nominatim when Google fails
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  importance: number;
  type: string;
  class: string;
}

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

// Calculate confidence from Nominatim result
function calculateNominatimConfidence(result: NominatimResult): number {
  const baseConfidence = 0.5 + (result.importance * 0.4);
  
  // Intersections often return as 'junction' or street types
  if (result.type === 'junction' || result.class === 'junction') {
    return Math.min(baseConfidence + 0.15, 0.9);
  }
  if (result.type === 'street' || result.class === 'highway') {
    return Math.min(baseConfidence + 0.05, 0.8);
  }
  
  return Math.max(0.5, Math.min(baseConfidence, 0.8));
}

// Geocode using OpenStreetMap Nominatim (free fallback)
async function geocodeWithNominatim(intersection: string): Promise<{
  lat: number;
  lng: number;
  formatted_address: string;
  confidence: number;
} | null> {
  console.log(`[geocode-intersection] Trying Nominatim fallback for: "${intersection}"`);
  
  // Add Houston, TX for better accuracy
  const query = `${intersection}, Houston, TX, USA`;
  
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?` +
    `format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;
  
  try {
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'SiteIntel-Feasibility/1.0 (buildsmarter.io)',
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`[geocode-intersection] Nominatim HTTP error: ${response.status}`);
      return null;
    }
    
    const data: NominatimResult[] = await response.json();
    
    if (!data || data.length === 0) {
      console.log(`[geocode-intersection] Nominatim returned no results`);
      return null;
    }
    
    const result = data[0];
    const confidence = calculateNominatimConfidence(result);
    
    console.log(`[geocode-intersection] Nominatim success: ${result.display_name} (confidence: ${confidence.toFixed(2)})`);
    
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      formatted_address: result.display_name,
      confidence,
    };
  } catch (error) {
    console.error(`[geocode-intersection] Nominatim error:`, error);
    return null;
  }
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
          source: 'cache',
          cache_hit: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[geocode-intersection] Cache MISS`);

    // Append Houston, TX to help with geocoding accuracy
    const address = `${sanitizedIntersection}, Houston, TX`;
    
    let geocodeResult: {
      lat: number;
      lng: number;
      formatted_address: string;
      confidence: number;
      source: 'google' | 'nominatim';
    } | null = null;

    // Try Google first if API key is available
    if (GOOGLE_API_KEY) {
      console.log(`[geocode-intersection] Trying Google API`);
      
      const url = `https://maps.googleapis.com/maps/api/geocode/json?` +
        `address=${encodeURIComponent(address)}&` +
        `key=${GOOGLE_API_KEY}`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results?.length) {
          const result = data.results[0];
          const location = result.geometry.location;

          // Calculate confidence
          let confidence = 0.85;
          if (result.geometry.location_type === 'GEOMETRIC_CENTER') {
            confidence = 0.9; // Intersections typically return GEOMETRIC_CENTER
          } else if (result.geometry.location_type === 'APPROXIMATE') {
            confidence = 0.7;
          }

          geocodeResult = {
            lat: location.lat,
            lng: location.lng,
            formatted_address: result.formatted_address,
            confidence,
            source: 'google',
          };
          
          console.log(`[geocode-intersection] Google success: ${result.formatted_address}`);
        } else {
          console.warn(`[geocode-intersection] Google API failed: ${data.status} - ${data.error_message || 'No results'}`);
        }
      } catch (googleError) {
        console.error(`[geocode-intersection] Google API error:`, googleError);
      }
    } else {
      console.log(`[geocode-intersection] No Google API key, skipping to Nominatim`);
    }

    // Fall back to Nominatim if Google failed or wasn't available
    if (!geocodeResult) {
      const nominatimResult = await geocodeWithNominatim(sanitizedIntersection);
      
      if (nominatimResult) {
        geocodeResult = {
          ...nominatimResult,
          source: 'nominatim',
        };
      }
    }

    // If both failed, return error
    if (!geocodeResult) {
      console.error(`[geocode-intersection] All geocoding methods failed`);
      return new Response(
        JSON.stringify({ error: 'Geocoding failed: No results from any provider' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cache the result (30-day TTL)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const resultData = {
      lat: geocodeResult.lat,
      lng: geocodeResult.lng,
      formatted_address: geocodeResult.formatted_address,
    };

    const { error: cacheError } = await supabase
      .from('geocoder_cache')
      .upsert({
        input_hash: inputHash,
        input_query: sanitizedIntersection,
        query_type: 'intersection',
        source: geocodeResult.source,
        result_data: resultData,
        confidence: geocodeResult.confidence,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'input_hash',
      });

    if (cacheError) {
      console.error(`[geocode-intersection] Cache write error:`, cacheError);
    } else {
      console.log(`[geocode-intersection] Cached result from ${geocodeResult.source}`);
    }

    return new Response(
      JSON.stringify({
        lat: geocodeResult.lat,
        lng: geocodeResult.lng,
        formatted_address: geocodeResult.formatted_address,
        confidence: geocodeResult.confidence,
        source: geocodeResult.source,
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
