/**
 * Batch Geocode Edge Function
 * Geocodes up to 50 addresses in a single request
 * Uses cache-first strategy with parallel provider calls
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AddressInput {
  id: string;
  query: string;
}

interface BatchGeocodeRequest {
  addresses: AddressInput[];
  maxConcurrency?: number;
  userId?: string;
}

interface GeocodeResult {
  id: string;
  success: boolean;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
  confidence?: number;
  source?: 'cache' | 'google' | 'nominatim' | 'mapbox';
  error?: string;
}

interface BatchGeocodeResponse {
  results: GeocodeResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    cacheHits: number;
    totalCost: number;
  };
  traceId: string;
}

// Provider costs
const PROVIDER_COSTS = {
  google: 0.005,
  nominatim: 0,
  mapbox: 0.0007,
  cache: 0,
};

// Rate limit: 10 batch requests per minute per user
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;

// Generate short trace ID
function generateTraceId(): string {
  return crypto.randomUUID().substring(0, 8);
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
function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Check rate limit
async function checkRateLimit(supabase: any, userId: string | null): Promise<boolean> {
  if (!userId) return true; // Allow anonymous for now
  
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  
  const { count } = await supabase
    .from('api_logs')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'batch-geocode')
    .eq('cache_key', `user:${userId}`)
    .gte('timestamp', windowStart);
  
  return (count || 0) < RATE_LIMIT_MAX;
}

// Geocode single address using Google
async function geocodeWithGoogle(
  query: string,
  apiKey: string
): Promise<{ lat: number; lng: number; formattedAddress: string; confidence: number } | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results?.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;
      
      let confidence = 0.8;
      if (result.geometry.location_type === 'ROOFTOP') confidence = 1.0;
      else if (result.geometry.location_type === 'RANGE_INTERPOLATED') confidence = 0.85;
      else if (result.geometry.location_type === 'GEOMETRIC_CENTER') confidence = 0.7;
      else if (result.geometry.location_type === 'APPROXIMATE') confidence = 0.5;
      
      return {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: result.formatted_address,
        confidence,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Geocode single address using Nominatim
async function geocodeWithNominatim(
  query: string
): Promise<{ lat: number; lng: number; formattedAddress: string; confidence: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SiteIntel-Feasibility/1.0 (buildsmarter.io)',
      },
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      const confidence = 0.5 + (result.importance || 0.5) * 0.4;
      
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        formattedAddress: result.display_name,
        confidence: Math.min(confidence, 0.85),
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Geocode single address with provider chain
async function geocodeSingle(
  address: AddressInput,
  googleApiKey: string | undefined,
  mapboxToken: string | undefined,
  supabase: any,
  traceId: string
): Promise<{ result: GeocodeResult; cost: number; cacheHit: boolean }> {
  const normalizedQuery = normalizeQuery(address.query);
  const inputHash = await generateHash(`address:${normalizedQuery}`);
  
  // Check cache first
  const { data: cached } = await supabase
    .from('geocoder_cache')
    .select('result_data, confidence, source')
    .eq('input_hash', inputHash)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (cached?.result_data) {
    const data = cached.result_data as { lat: number; lng: number; formatted_address: string };
    return {
      result: {
        id: address.id,
        success: true,
        lat: data.lat,
        lng: data.lng,
        formattedAddress: data.formatted_address,
        confidence: cached.confidence || 0.8,
        source: 'cache',
      },
      cost: 0,
      cacheHit: true,
    };
  }
  
  let geocodeResult: { lat: number; lng: number; formattedAddress: string; confidence: number } | null = null;
  let source: 'google' | 'nominatim' | 'mapbox' = 'nominatim';
  let cost = 0;
  
  // Try Google first
  if (googleApiKey) {
    geocodeResult = await geocodeWithGoogle(address.query, googleApiKey);
    if (geocodeResult) {
      source = 'google';
      cost = PROVIDER_COSTS.google;
    }
  }
  
  // Fall back to Nominatim
  if (!geocodeResult) {
    geocodeResult = await geocodeWithNominatim(address.query);
    if (geocodeResult) {
      source = 'nominatim';
      cost = PROVIDER_COSTS.nominatim;
    }
  }
  
  if (!geocodeResult) {
    return {
      result: {
        id: address.id,
        success: false,
        error: 'No results from any provider',
      },
      cost: 0,
      cacheHit: false,
    };
  }
  
  // Cache the result (30-day TTL)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  await supabase.from('geocoder_cache').upsert({
    input_hash: inputHash,
    input_query: address.query.trim(),
    query_type: 'address',
    source,
    result_data: {
      lat: geocodeResult.lat,
      lng: geocodeResult.lng,
      formatted_address: geocodeResult.formattedAddress,
    },
    confidence: geocodeResult.confidence,
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString(),
  }, { onConflict: 'input_hash' }).catch(() => {});
  
  return {
    result: {
      id: address.id,
      success: true,
      lat: geocodeResult.lat,
      lng: geocodeResult.lng,
      formattedAddress: geocodeResult.formattedAddress,
      confidence: geocodeResult.confidence,
      source,
    },
    cost,
    cacheHit: false,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const traceId = generateTraceId();

  try {
    const { addresses, maxConcurrency = 5, userId }: BatchGeocodeRequest = await req.json();

    console.log(`[batch-geocode:${traceId}] Request: ${addresses?.length} addresses, concurrency=${maxConcurrency}`);

    // Validate input
    if (!addresses || !Array.isArray(addresses)) {
      return new Response(
        JSON.stringify({ error: 'addresses must be an array', traceId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (addresses.length > 50) {
      return new Response(
        JSON.stringify({ 
          error: 'Maximum 50 addresses per request. Use pagination for larger batches.',
          traceId,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (addresses.length === 0) {
      return new Response(
        JSON.stringify({
          results: [],
          summary: { total: 0, successful: 0, failed: 0, cacheHits: 0, totalCost: 0 },
          traceId,
        } as BatchGeocodeResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate each address has id and query
    for (const addr of addresses) {
      if (!addr.id || !addr.query) {
        return new Response(
          JSON.stringify({ error: 'Each address must have id and query properties', traceId }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limit
    const withinLimit = await checkRateLimit(supabase, userId || null);
    if (!withinLimit) {
      console.warn(`[batch-geocode:${traceId}] Rate limit exceeded for user ${userId}`);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Maximum 10 batch requests per minute.',
          traceId,
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

    // Dedupe addresses by query
    const uniqueAddresses = new Map<string, AddressInput[]>();
    for (const addr of addresses) {
      const key = normalizeQuery(addr.query);
      if (!uniqueAddresses.has(key)) {
        uniqueAddresses.set(key, []);
      }
      uniqueAddresses.get(key)!.push(addr);
    }

    console.log(`[batch-geocode:${traceId}] ${addresses.length} addresses, ${uniqueAddresses.size} unique`);

    // Process in batches with concurrency limit
    const results: GeocodeResult[] = [];
    let totalCost = 0;
    let cacheHits = 0;
    let successful = 0;
    let failed = 0;

    const uniqueEntries = Array.from(uniqueAddresses.entries());
    const effectiveConcurrency = Math.min(maxConcurrency, 5);

    for (let i = 0; i < uniqueEntries.length; i += effectiveConcurrency) {
      const batch = uniqueEntries.slice(i, i + effectiveConcurrency);
      
      const batchResults = await Promise.allSettled(
        batch.map(async ([_, addrs]) => {
          // Use first address in group to geocode
          const result = await geocodeSingle(addrs[0], googleApiKey, mapboxToken, supabase, traceId);
          
          // Apply result to all addresses with same query
          const mappedResults: GeocodeResult[] = addrs.map(addr => ({
            ...result.result,
            id: addr.id,
          }));
          
          return { results: mappedResults, cost: result.cost, cacheHit: result.cacheHit };
        })
      );
      
      for (const batchResult of batchResults) {
        if (batchResult.status === 'fulfilled') {
          for (const r of batchResult.value.results) {
            results.push(r);
            if (r.success) successful++;
            else failed++;
          }
          totalCost += batchResult.value.cost;
          if (batchResult.value.cacheHit) cacheHits += batchResult.value.results.length;
        } else {
          failed++;
        }
      }
      
      // Small delay between batches to respect rate limits
      if (i + effectiveConcurrency < uniqueEntries.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Log the batch request
    await supabase.from('api_logs').insert({
      source: 'batch-geocode',
      endpoint: 'batch',
      duration_ms: Date.now() - startTime,
      success: true,
      cache_key: userId ? `user:${userId}` : `trace:${traceId}`,
    }).catch(() => {});

    console.log(`[batch-geocode:${traceId}] Complete: ${successful} success, ${failed} failed, ${cacheHits} cache hits, cost=$${totalCost.toFixed(4)}`);

    return new Response(
      JSON.stringify({
        results,
        summary: {
          total: addresses.length,
          successful,
          failed,
          cacheHits,
          totalCost,
        },
        traceId,
      } as BatchGeocodeResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[batch-geocode:${traceId}] Error:`, error);
    return new Response(
      JSON.stringify({ error: error.message, traceId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
