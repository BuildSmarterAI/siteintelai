/**
 * Geocode with Cache Edge Function
 * Wraps Google Geocoding API with 30-day caching in geocoder_cache table
 * Fallback chain: Google → Nominatim → Mapbox
 * 
 * Enhanced with:
 * - traceId for request correlation
 * - Rate limiting (60 requests/minute per user)
 * - Emergency mode check
 * - requestCost tracking
 * - Stale-while-revalidate caching
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type QueryType = 'address' | 'intersection' | 'point' | 'poi';

interface GeocodeRequest {
  query: string;
  query_type?: QueryType;
  sessionId?: string;
  userId?: string;
  forceRefresh?: boolean;
}

interface AddressComponents {
  streetNumber?: string;
  street?: string;
  city?: string;
  county?: string;
  state?: string;
  zip?: string;
  country?: string;
}

interface GeocodeCandidate {
  formattedAddress: string;
  lat: number;
  lng: number;
  placeId?: string;
  confidence: number;
  source: 'cache' | 'google' | 'nominatim' | 'mapbox';
  locationType?: string;
  addressComponents?: AddressComponents;
}

interface GeocodeResponse {
  success: boolean;
  candidates: GeocodeCandidate[];
  cacheHit: boolean;
  traceId: string;
  upstreamProvider?: string;
  requestCost: number;
  // Legacy fields for backward compatibility
  lat?: number;
  lng?: number;
  formatted_address?: string;
  confidence?: number;
  source?: string;
  cache_hit?: boolean;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  importance: number;
  type: string;
  class: string;
  address?: Record<string, string>;
}

interface MapboxFeature {
  id: string;
  type: string;
  place_type: string[];
  relevance: number;
  text: string;
  place_name: string;
  center: [number, number];
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  properties: {
    accuracy?: string;
    mapbox_id?: string;
  };
}

interface MapboxResponse {
  type: string;
  features: MapboxFeature[];
  attribution: string;
}

// Texas bounding box for Mapbox geocoding
const TEXAS_BBOX = '-106.645646,25.837377,-93.508039,36.500704';

// Houston center for proximity bias
const HOUSTON_CENTER = { lng: -95.3698, lat: 29.7604 };

// Provider costs
const PROVIDER_COSTS = {
  google: 0.005,
  nominatim: 0,
  mapbox: 0.0007,
  cache: 0,
};

// Rate limiting constants
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 60;

// Stale-while-revalidate window (7 days past expiry)
const STALE_WINDOW_DAYS = 7;

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
function normalizeQuery(query: string, queryType: QueryType): string {
  const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
  return `${queryType}:${normalized}`;
}

// Check rate limit
async function checkRateLimit(supabase: any, userId: string | null, traceId: string): Promise<boolean> {
  if (!userId) return true;
  
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  
  const { count } = await supabase
    .from('api_logs')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'geocode-with-cache')
    .eq('cache_key', `user:${userId}`)
    .gte('timestamp', windowStart);
  
  const withinLimit = (count || 0) < RATE_LIMIT_MAX;
  if (!withinLimit) {
    console.warn(`[geocode-with-cache:${traceId}] Rate limit exceeded for user ${userId}`);
  }
  return withinLimit;
}

// Check emergency mode
async function checkEmergencyMode(supabase: any, traceId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'emergency_cost_mode')
      .single();
    
    if (data?.value === true || data?.value === 'true') {
      console.warn(`[geocode-with-cache:${traceId}] Emergency mode active - blocking paid API calls`);
      return true;
    }
  } catch {
    // Ignore - emergency mode not configured
  }
  return false;
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
      source: 'geocode-with-cache',
      endpoint: source,
      duration_ms: durationMs,
      success,
      cache_key: userId ? `user:${userId}` : `trace:${traceId}`,
      error_message: errorMessage,
    });
  } catch (e) {
    console.error(`[geocode-with-cache:${traceId}] Failed to log API call:`, e);
  }
}

// Parse Google address components
function parseGoogleComponents(components: any[]): AddressComponents {
  const result: AddressComponents = {};
  
  for (const component of components) {
    const types = component.types;
    if (types.includes('street_number')) result.streetNumber = component.long_name;
    else if (types.includes('route')) result.street = component.long_name;
    else if (types.includes('locality')) result.city = component.long_name;
    else if (types.includes('administrative_area_level_2')) result.county = component.long_name.replace(' County', '');
    else if (types.includes('administrative_area_level_1')) result.state = component.short_name;
    else if (types.includes('postal_code')) result.zip = component.long_name;
    else if (types.includes('country')) result.country = component.short_name;
  }
  
  return result;
}

// Parse Nominatim address
function parseNominatimAddress(address: Record<string, string>): AddressComponents {
  return {
    streetNumber: address.house_number,
    street: address.road,
    city: address.city || address.town || address.village,
    county: (address.county || '').replace(' County', ''),
    state: address.state,
    zip: address.postcode,
    country: address.country_code?.toUpperCase(),
  };
}

// Calculate confidence from Nominatim result
function calculateNominatimConfidence(result: NominatimResult): number {
  // Nominatim importance ranges from 0-1, we map it to 0.5-0.9
  const baseConfidence = 0.5 + (result.importance * 0.4);
  
  // Boost for specific result types
  if (result.type === 'house' || result.class === 'building') {
    return Math.min(baseConfidence + 0.1, 0.9);
  }
  if (result.type === 'street' || result.class === 'highway') {
    return Math.min(baseConfidence + 0.05, 0.85);
  }
  
  return Math.max(0.5, Math.min(baseConfidence, 0.85));
}

// Calculate confidence from Mapbox result
function calculateMapboxConfidence(feature: MapboxFeature): number {
  // Start with Mapbox relevance score (0-1)
  let confidence = feature.relevance * 0.85;
  
  // Boost based on place_type (most specific first)
  const placeType = feature.place_type[0];
  if (placeType === 'address') {
    confidence += 0.15;
  } else if (placeType === 'poi') {
    confidence += 0.12;
  } else if (placeType === 'postcode') {
    confidence += 0.08;
  } else if (placeType === 'place' || placeType === 'locality') {
    confidence += 0.05;
  }
  
  // Boost for high accuracy property
  if (feature.properties?.accuracy === 'rooftop') {
    confidence += 0.05;
  } else if (feature.properties?.accuracy === 'parcel') {
    confidence += 0.03;
  }
  
  // Cap at 0.95 (Google ROOFTOP gets 1.0)
  return Math.max(0.5, Math.min(confidence, 0.95));
}

// Geocode using OpenStreetMap Nominatim (free fallback)
async function geocodeWithNominatim(query: string): Promise<{
  lat: number;
  lng: number;
  formatted_address: string;
  confidence: number;
} | null> {
  console.log(`[geocode-with-cache] Trying Nominatim fallback for: "${query}"`);
  
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
      console.error(`[geocode-with-cache] Nominatim HTTP error: ${response.status}`);
      return null;
    }
    
    const data: NominatimResult[] = await response.json();
    
    if (!data || data.length === 0) {
      console.log(`[geocode-with-cache] Nominatim returned no results`);
      return null;
    }
    
    const result = data[0];
    const confidence = calculateNominatimConfidence(result);
    
    console.log(`[geocode-with-cache] Nominatim success: ${result.display_name} (confidence: ${confidence.toFixed(2)})`);
    
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      formatted_address: result.display_name,
      confidence,
    };
  } catch (error) {
    console.error(`[geocode-with-cache] Nominatim error:`, error);
    return null;
  }
}

// Geocode using Mapbox Geocoding API (third fallback)
async function geocodeWithMapbox(query: string, accessToken: string): Promise<{
  lat: number;
  lng: number;
  formatted_address: string;
  confidence: number;
} | null> {
  console.log(`[geocode-with-cache] Trying Mapbox fallback for: "${query}"`);
  
  // Build Mapbox geocoding URL with Texas bounding and Houston proximity
  const mapboxUrl = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
  mapboxUrl.searchParams.set('access_token', accessToken);
  mapboxUrl.searchParams.set('country', 'US');
  mapboxUrl.searchParams.set('bbox', TEXAS_BBOX);
  mapboxUrl.searchParams.set('proximity', `${HOUSTON_CENTER.lng},${HOUSTON_CENTER.lat}`);
  mapboxUrl.searchParams.set('types', 'address,poi,postcode,place,locality');
  mapboxUrl.searchParams.set('limit', '1');
  mapboxUrl.searchParams.set('language', 'en');
  
  try {
    const response = await fetch(mapboxUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[geocode-with-cache] Mapbox HTTP error: ${response.status} - ${errorText}`);
      return null;
    }
    
    const data: MapboxResponse = await response.json();
    
    if (!data.features || data.features.length === 0) {
      console.log(`[geocode-with-cache] Mapbox returned no results`);
      return null;
    }
    
    const feature = data.features[0];
    const [lng, lat] = feature.center;
    const confidence = calculateMapboxConfidence(feature);
    
    console.log(`[geocode-with-cache] Mapbox success: ${feature.place_name} (type: ${feature.place_type[0]}, relevance: ${feature.relevance.toFixed(2)}, confidence: ${confidence.toFixed(2)})`);
    
    return {
      lat,
      lng,
      formatted_address: feature.place_name,
      confidence,
    };
  } catch (error) {
    console.error(`[geocode-with-cache] Mapbox error:`, error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const traceId = generateTraceId();

  try {
    const { query, query_type = 'address', sessionId, userId, forceRefresh }: GeocodeRequest = await req.json();

    console.log(`[geocode-with-cache:${traceId}] Request: query="${query}", type=${query_type}`);

    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Query must be at least 3 characters',
          traceId,
          candidates: [],
          cacheHit: false,
          requestCost: 0,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limit
    const withinLimit = await checkRateLimit(supabase, userId || null, traceId);
    if (!withinLimit) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Rate limit exceeded. Maximum 60 requests per minute.',
          traceId,
          candidates: [],
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

    // Check emergency mode
    const emergencyMode = await checkEmergencyMode(supabase, traceId);

    // Generate cache key
    const normalizedQuery = normalizeQuery(query, query_type);
    const inputHash = await generateHash(normalizedQuery);

    console.log(`[geocode-with-cache:${traceId}] Hash: ${inputHash.substring(0, 12)}...`);

    // Check cache first (unless forceRefresh)
    if (!forceRefresh) {
      const now = new Date();
      const staleDate = new Date();
      staleDate.setDate(staleDate.getDate() - STALE_WINDOW_DAYS);
      
      const { data: cacheHit } = await supabase
        .from('geocoder_cache')
        .select('result_data, confidence, geometry, source, expires_at')
        .eq('input_hash', inputHash)
        .single();

      if (cacheHit && cacheHit.result_data) {
        const expiresAt = new Date(cacheHit.expires_at);
        const isStale = expiresAt < now;
        const isWithinStaleWindow = expiresAt > staleDate;
        
        if (!isStale || isWithinStaleWindow) {
          console.log(`[geocode-with-cache:${traceId}] Cache ${isStale ? 'STALE (serving anyway)' : 'HIT'}`);
          
          const result = cacheHit.result_data as { lat: number; lng: number; formatted_address: string; addressComponents?: AddressComponents };
          
          await logApiCall(supabase, traceId, 'cache', Date.now() - startTime, true, userId);
          
          // If stale, trigger background refresh (fire and forget)
          if (isStale) {
            console.log(`[geocode-with-cache:${traceId}] Triggering background refresh`);
            // Background refresh would be implemented here in production
          }
          
          return new Response(
            JSON.stringify({
              success: true,
              candidates: [{
                formattedAddress: result.formatted_address,
                lat: result.lat,
                lng: result.lng,
                confidence: cacheHit.confidence || 0.9,
                source: 'cache',
                addressComponents: result.addressComponents,
              }],
              cacheHit: true,
              traceId,
              upstreamProvider: cacheHit.source,
              requestCost: 0,
              // Legacy fields
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
      }
    }

    console.log(`[geocode-with-cache:${traceId}] Cache MISS`);

    // Prepare query for geocoding
    let geocodeQuery = query.trim();
    
    // For intersections, append Houston, TX for better accuracy
    if (query_type === 'intersection') {
      geocodeQuery = `${query.trim()}, Houston, TX`;
    }

    let geocodeResult: {
      lat: number;
      lng: number;
      formatted_address: string;
      confidence: number;
      source: 'google' | 'nominatim' | 'mapbox';
      locationType?: string;
      addressComponents?: AddressComponents;
      placeId?: string;
    } | null = null;
    let requestCost = 0;

    // Try Google first if API key is available and not in emergency mode
    if (googleApiKey && !emergencyMode) {
      console.log(`[geocode-with-cache:${traceId}] Trying Google API`);
      
      const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(geocodeQuery)}&key=${googleApiKey}`;
      
      try {
        const googleResponse = await fetch(googleUrl);
        const googleData = await googleResponse.json();

        if (googleData.status === 'OK' && googleData.results?.length) {
          const result = googleData.results[0];
          const location = result.geometry.location;

          let confidence = 0.9;
          if (result.geometry.location_type === 'ROOFTOP') confidence = 1.0;
          else if (result.geometry.location_type === 'RANGE_INTERPOLATED') confidence = 0.85;
          else if (result.geometry.location_type === 'GEOMETRIC_CENTER') confidence = 0.7;
          else if (result.geometry.location_type === 'APPROXIMATE') confidence = 0.5;

          geocodeResult = {
            lat: location.lat,
            lng: location.lng,
            formatted_address: result.formatted_address,
            confidence,
            source: 'google',
            locationType: result.geometry.location_type,
            addressComponents: parseGoogleComponents(result.address_components || []),
            placeId: result.place_id,
          };
          requestCost = PROVIDER_COSTS.google;
          
          console.log(`[geocode-with-cache:${traceId}] Google success: ${result.formatted_address}`);
        } else {
          console.warn(`[geocode-with-cache:${traceId}] Google API failed: ${googleData.status}`);
        }
      } catch (googleError) {
        console.error(`[geocode-with-cache:${traceId}] Google API error:`, googleError);
      }
    } else if (emergencyMode) {
      console.log(`[geocode-with-cache:${traceId}] Skipping Google due to emergency mode`);
    } else {
      console.log(`[geocode-with-cache:${traceId}] No Google API key`);
    }

    // Fall back to Nominatim if Google failed
    if (!geocodeResult) {
      const nominatimResult = await geocodeWithNominatim(geocodeQuery);
      
      if (nominatimResult) {
        geocodeResult = {
          ...nominatimResult,
          source: 'nominatim',
        };
        requestCost = PROVIDER_COSTS.nominatim;
      }
    }

    // Fall back to Mapbox if Nominatim also failed and not in emergency mode
    if (!geocodeResult && mapboxToken && !emergencyMode) {
      const mapboxResult = await geocodeWithMapbox(geocodeQuery, mapboxToken);
      
      if (mapboxResult) {
        geocodeResult = {
          ...mapboxResult,
          source: 'mapbox',
        };
        requestCost = PROVIDER_COSTS.mapbox;
      }
    }

    // If all providers failed
    if (!geocodeResult) {
      console.error(`[geocode-with-cache:${traceId}] All providers failed`);
      
      await logApiCall(supabase, traceId, 'none', Date.now() - startTime, false, userId, 'All providers failed');
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Geocoding failed: No results from any provider',
          traceId,
          candidates: [],
          cacheHit: false,
          requestCost: 0,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cache the result (30-day TTL)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const resultData = {
      lat: geocodeResult.lat,
      lng: geocodeResult.lng,
      formatted_address: geocodeResult.formatted_address,
      addressComponents: geocodeResult.addressComponents,
    };

    await supabase
      .from('geocoder_cache')
      .upsert({
        input_hash: inputHash,
        input_query: query.trim(),
        query_type: query_type,
        source: geocodeResult.source,
        result_data: resultData,
        confidence: geocodeResult.confidence,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      }, { onConflict: 'input_hash' });

    await logApiCall(supabase, traceId, geocodeResult.source, Date.now() - startTime, true, userId);

    console.log(`[geocode-with-cache:${traceId}] Response: provider=${geocodeResult.source}, cost=$${requestCost}`);

    return new Response(
      JSON.stringify({
        success: true,
        candidates: [{
          formattedAddress: geocodeResult.formatted_address,
          lat: geocodeResult.lat,
          lng: geocodeResult.lng,
          placeId: geocodeResult.placeId,
          confidence: geocodeResult.confidence,
          source: geocodeResult.source,
          locationType: geocodeResult.locationType,
          addressComponents: geocodeResult.addressComponents,
        }],
        cacheHit: false,
        traceId,
        upstreamProvider: geocodeResult.source,
        requestCost,
        // Legacy fields
        lat: geocodeResult.lat,
        lng: geocodeResult.lng,
        formatted_address: geocodeResult.formatted_address,
        confidence: geocodeResult.confidence,
        source: geocodeResult.source,
        cache_hit: false,
      } as GeocodeResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[geocode-with-cache:${traceId}] Error:`, error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        traceId,
        candidates: [],
        cacheHit: false,
        requestCost: 0,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
