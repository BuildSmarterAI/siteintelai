/**
 * Geocode Intersection Edge Function
 * Uses cache-first approach with Google Geocoding API fallback
 * Falls back to OpenStreetMap Nominatim when Google fails
 * 
 * Enhanced with:
 * - traceId for request correlation
 * - Rate limiting
 * - Enhanced response with nearestAddress
 * - Cost tracking
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Provider costs
const PROVIDER_COSTS = {
  google: 0.005,
  nominatim: 0,
  cache: 0,
};

// Rate limiting
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 30;

// Generate short trace ID
function generateTraceId(): string {
  return crypto.randomUUID().substring(0, 8);
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  importance: number;
  type: string;
  class: string;
}

interface IntersectionResponse {
  success: boolean;
  lat: number;
  lng: number;
  formatted_address: string;
  formattedIntersection?: string;
  confidence: number;
  source: 'cache' | 'google' | 'nominatim';
  nearestAddress?: string;
  traceId: string;
  cacheHit: boolean;
  requestCost: number;
  cache_hit?: boolean; // Legacy
  error?: string;
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

// Check rate limit
async function checkRateLimit(supabase: any, userId: string | null, traceId: string): Promise<boolean> {
  if (!userId) return true;
  
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  
  const { count } = await supabase
    .from('api_logs')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'geocode-intersection')
    .eq('cache_key', `user:${userId}`)
    .gte('timestamp', windowStart);
  
  return (count || 0) < RATE_LIMIT_MAX;
}

// Log API call
async function logApiCall(
  supabase: any,
  traceId: string,
  source: string,
  durationMs: number,
  success: boolean,
  userId?: string,
  errorMessage?: string
) {
  try {
    await supabase.from('api_logs').insert({
      source: 'geocode-intersection',
      endpoint: source,
      duration_ms: durationMs,
      success,
      cache_key: userId ? `user:${userId}` : `trace:${traceId}`,
      error_message: errorMessage,
    });
  } catch (e) {
    console.error(`[geocode-intersection:${traceId}] Failed to log API call:`, e);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const traceId = generateTraceId();

  try {
    const { intersection, street1, street2, city, state, userId } = await req.json();
    
    // Support both formats: { intersection } or { street1, street2 }
    const sanitizedIntersection = intersection 
      ? intersection.trim()
      : `${street1?.trim() || ''} & ${street2?.trim() || ''}`;
    
    // Validate intersection input
    const validation = validateIntersection(sanitizedIntersection);
    if (!validation.valid) {
      console.warn(`[geocode-intersection:${traceId}] Invalid input: ${validation.error}`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: validation.error,
          traceId,
          cacheHit: false,
          requestCost: 0,
        } as IntersectionResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[geocode-intersection:${traceId}] Geocoding: ${sanitizedIntersection}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limit
    const withinLimit = await checkRateLimit(supabase, userId || null, traceId);
    if (!withinLimit) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Rate limit exceeded',
          traceId,
          cacheHit: false,
          requestCost: 0,
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '60',
          } 
        }
      );
    }

    // Generate cache key
    const cacheKey = `intersection:${sanitizedIntersection.toLowerCase()}`;
    const inputHash = await generateHash(cacheKey);

    // Check cache first
    const { data: cacheHit } = await supabase
      .from('geocoder_cache')
      .select('result_data, confidence, source')
      .eq('input_hash', inputHash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cacheHit && cacheHit.result_data) {
      console.log(`[geocode-intersection:${traceId}] Cache HIT`);
      const result = cacheHit.result_data as { lat: number; lng: number; formatted_address: string; nearestAddress?: string };
      
      await logApiCall(supabase, traceId, 'cache', Date.now() - startTime, true, userId);
      
      return new Response(
        JSON.stringify({
          success: true,
          lat: result.lat,
          lng: result.lng,
          formatted_address: result.formatted_address,
          formattedIntersection: result.formatted_address,
          nearestAddress: result.nearestAddress,
          confidence: cacheHit.confidence || 0.85,
          source: 'cache',
          traceId,
          cacheHit: true,
          cache_hit: true,
          requestCost: 0,
        } as IntersectionResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[geocode-intersection:${traceId}] Cache MISS`);

    // Append city/state for geocoding
    const locationSuffix = `${city || 'Houston'}, ${state || 'TX'}`;
    const address = `${sanitizedIntersection}, ${locationSuffix}`;
    
    let geocodeResult: {
      lat: number;
      lng: number;
      formatted_address: string;
      confidence: number;
      source: 'google' | 'nominatim';
    } | null = null;
    let requestCost = 0;

    // Try Google first
    if (GOOGLE_API_KEY) {
      console.log(`[geocode-intersection:${traceId}] Trying Google API`);
      
      const url = `https://maps.googleapis.com/maps/api/geocode/json?` +
        `address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results?.length) {
          const result = data.results[0];
          const location = result.geometry.location;

          let confidence = 0.85;
          if (result.geometry.location_type === 'GEOMETRIC_CENTER') confidence = 0.9;
          else if (result.geometry.location_type === 'APPROXIMATE') confidence = 0.7;

          geocodeResult = {
            lat: location.lat,
            lng: location.lng,
            formatted_address: result.formatted_address,
            confidence,
            source: 'google',
          };
          requestCost = PROVIDER_COSTS.google;
          
          console.log(`[geocode-intersection:${traceId}] Google success: ${result.formatted_address}`);
        } else {
          console.warn(`[geocode-intersection:${traceId}] Google failed: ${data.status}`);
        }
      } catch (googleError) {
        console.error(`[geocode-intersection:${traceId}] Google error:`, googleError);
      }
    }

    // Fall back to Nominatim
    if (!geocodeResult) {
      const nominatimResult = await geocodeWithNominatim(sanitizedIntersection);
      
      if (nominatimResult) {
        geocodeResult = {
          ...nominatimResult,
          source: 'nominatim',
        };
        requestCost = PROVIDER_COSTS.nominatim;
      }
    }

    // If both failed
    if (!geocodeResult) {
      console.error(`[geocode-intersection:${traceId}] All providers failed`);
      
      await logApiCall(supabase, traceId, 'none', Date.now() - startTime, false, userId, 'All providers failed');
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Geocoding failed: No results from any provider',
          traceId,
          cacheHit: false,
          requestCost: 0,
        }),
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

    await supabase
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
      }, { onConflict: 'input_hash' });

    await logApiCall(supabase, traceId, geocodeResult.source, Date.now() - startTime, true, userId);

    console.log(`[geocode-intersection:${traceId}] Response: provider=${geocodeResult.source}, cost=$${requestCost}`);

    return new Response(
      JSON.stringify({
        success: true,
        lat: geocodeResult.lat,
        lng: geocodeResult.lng,
        formatted_address: geocodeResult.formatted_address,
        formattedIntersection: geocodeResult.formatted_address,
        confidence: geocodeResult.confidence,
        source: geocodeResult.source,
        traceId,
        cacheHit: false,
        cache_hit: false,
        requestCost,
      } as IntersectionResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`[geocode-intersection:${traceId}] Error:`, error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        traceId,
        cacheHit: false,
        requestCost: 0,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
