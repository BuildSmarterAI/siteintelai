/**
 * Reverse Geocode Edge Function
 * Converts lat/lng to formatted address with multi-provider fallback
 * Provider chain: Google → Nominatim
 * Cache TTL: 90 days
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReverseGeocodeRequest {
  lat: number;
  lng: number;
  resultTypes?: string[];
  userId?: string;
}

interface AddressComponents {
  streetNumber?: string;
  street?: string;
  city: string;
  county: string;
  state: string;
  zip: string;
  country?: string;
}

interface ReverseGeocodeResponse {
  success: boolean;
  formattedAddress?: string;
  addressComponents?: AddressComponents;
  confidence: number;
  source: 'cache' | 'google' | 'nominatim';
  traceId: string;
  cacheHit: boolean;
  requestCost: number;
  isOutsideTexas?: boolean;
  isWater?: boolean;
  error?: string;
}

// Texas bounding box
const TEXAS_BOUNDS = {
  minLat: 25.837377,
  maxLat: 36.500704,
  minLng: -106.645646,
  maxLng: -93.508039,
};

// Provider costs
const PROVIDER_COSTS = {
  google: 0.005,
  nominatim: 0,
  cache: 0,
};

// Generate short trace ID
function generateTraceId(): string {
  return crypto.randomUUID().substring(0, 8);
}

// Generate cache key from coordinates (rounded to 6 decimal places)
function generateCacheKey(lat: number, lng: number): string {
  const roundedLat = lat.toFixed(6);
  const roundedLng = lng.toFixed(6);
  return `reverse:v1:${roundedLat}:${roundedLng}`;
}

// Check if coordinates are within Texas
function isInTexas(lat: number, lng: number): boolean {
  return (
    lat >= TEXAS_BOUNDS.minLat &&
    lat <= TEXAS_BOUNDS.maxLat &&
    lng >= TEXAS_BOUNDS.minLng &&
    lng <= TEXAS_BOUNDS.maxLng
  );
}

// Parse Google address components
function parseGoogleComponents(components: any[]): AddressComponents {
  const result: AddressComponents = {
    city: '',
    county: '',
    state: '',
    zip: '',
  };

  for (const component of components) {
    const types = component.types;
    if (types.includes('street_number')) {
      result.streetNumber = component.long_name;
    } else if (types.includes('route')) {
      result.street = component.long_name;
    } else if (types.includes('locality')) {
      result.city = component.long_name;
    } else if (types.includes('administrative_area_level_2')) {
      result.county = component.long_name.replace(' County', '');
    } else if (types.includes('administrative_area_level_1')) {
      result.state = component.short_name;
    } else if (types.includes('postal_code')) {
      result.zip = component.long_name;
    } else if (types.includes('country')) {
      result.country = component.short_name;
    }
  }

  return result;
}

// Parse Nominatim address
function parseNominatimAddress(address: any): AddressComponents {
  return {
    streetNumber: address.house_number,
    street: address.road,
    city: address.city || address.town || address.village || address.hamlet,
    county: (address.county || '').replace(' County', ''),
    state: address.state,
    zip: address.postcode,
    country: address.country_code?.toUpperCase(),
  };
}

// Reverse geocode with Google
async function reverseGeocodeGoogle(
  lat: number,
  lng: number,
  apiKey: string,
  traceId: string
): Promise<{
  formattedAddress: string;
  addressComponents: AddressComponents;
  confidence: number;
  isWater?: boolean;
} | null> {
  console.log(`[reverse-geocode:${traceId}] Trying Google API`);

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results?.length > 0) {
      const result = data.results[0];
      
      // Check for water/ocean
      const types = result.types || [];
      if (types.includes('natural_feature') || types.includes('establishment')) {
        // Could be water - check address components
        const hasStreet = result.address_components?.some((c: any) => 
          c.types.includes('route') || c.types.includes('street_address')
        );
        if (!hasStreet && types.includes('natural_feature')) {
          return { 
            formattedAddress: result.formatted_address,
            addressComponents: parseGoogleComponents(result.address_components || []),
            confidence: 0.3,
            isWater: true 
          };
        }
      }

      // Calculate confidence based on result type
      let confidence = 0.8;
      if (result.geometry?.location_type === 'ROOFTOP') {
        confidence = 1.0;
      } else if (result.geometry?.location_type === 'RANGE_INTERPOLATED') {
        confidence = 0.85;
      } else if (result.geometry?.location_type === 'GEOMETRIC_CENTER') {
        confidence = 0.7;
      } else if (result.geometry?.location_type === 'APPROXIMATE') {
        confidence = 0.5;
      }

      console.log(`[reverse-geocode:${traceId}] Google success: ${result.formatted_address}`);

      return {
        formattedAddress: result.formatted_address,
        addressComponents: parseGoogleComponents(result.address_components || []),
        confidence,
      };
    } else if (data.status === 'ZERO_RESULTS') {
      console.log(`[reverse-geocode:${traceId}] Google returned no results (possibly water/ocean)`);
      return { 
        formattedAddress: 'Unknown location',
        addressComponents: { city: '', county: '', state: '', zip: '' },
        confidence: 0,
        isWater: true 
      };
    } else {
      console.warn(`[reverse-geocode:${traceId}] Google API failed: ${data.status}`);
      return null;
    }
  } catch (error) {
    console.error(`[reverse-geocode:${traceId}] Google API error:`, error);
    return null;
  }
}

// Reverse geocode with Nominatim
async function reverseGeocodeNominatim(
  lat: number,
  lng: number,
  traceId: string
): Promise<{
  formattedAddress: string;
  addressComponents: AddressComponents;
  confidence: number;
  isWater?: boolean;
} | null> {
  console.log(`[reverse-geocode:${traceId}] Trying Nominatim fallback`);

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SiteIntel-Feasibility/1.0 (buildsmarter.io)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[reverse-geocode:${traceId}] Nominatim HTTP error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.error) {
      console.log(`[reverse-geocode:${traceId}] Nominatim error: ${data.error}`);
      if (data.error.includes('Unable to geocode')) {
        return {
          formattedAddress: 'Unknown location',
          addressComponents: { city: '', county: '', state: '', zip: '' },
          confidence: 0,
          isWater: true,
        };
      }
      return null;
    }

    // Check if it's water
    if (data.type === 'water' || data.class === 'natural') {
      return {
        formattedAddress: data.display_name || 'Water body',
        addressComponents: { city: '', county: '', state: '', zip: '' },
        confidence: 0.3,
        isWater: true,
      };
    }

    // Calculate confidence based on type
    let confidence = 0.7;
    if (data.type === 'house' || data.type === 'building') {
      confidence = 0.85;
    } else if (data.type === 'street') {
      confidence = 0.75;
    } else if (data.type === 'city' || data.type === 'town') {
      confidence = 0.5;
    }

    console.log(`[reverse-geocode:${traceId}] Nominatim success: ${data.display_name}`);

    return {
      formattedAddress: data.display_name,
      addressComponents: parseNominatimAddress(data.address || {}),
      confidence,
    };
  } catch (error) {
    console.error(`[reverse-geocode:${traceId}] Nominatim error:`, error);
    return null;
  }
}

// Log to api_logs
async function logApiCall(
  supabase: any,
  traceId: string,
  source: string,
  durationMs: number,
  success: boolean,
  errorMessage?: string
) {
  try {
    await supabase.from('api_logs').insert({
      source: 'reverse-geocode',
      endpoint: source,
      duration_ms: durationMs,
      success,
      cache_key: `trace:${traceId}`,
      error_message: errorMessage,
    });
  } catch (e) {
    console.error(`[reverse-geocode:${traceId}] Failed to log API call:`, e);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const traceId = generateTraceId();

  try {
    const { lat, lng, userId }: ReverseGeocodeRequest = await req.json();

    console.log(`[reverse-geocode:${traceId}] Request: lat=${lat}, lng=${lng}`);

    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'lat and lng must be numbers',
          traceId,
          cacheHit: false,
          confidence: 0,
          source: 'cache',
          requestCost: 0,
        } as ReverseGeocodeResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid coordinates',
          traceId,
          cacheHit: false,
          confidence: 0,
          source: 'cache',
          requestCost: 0,
        } as ReverseGeocodeResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if outside Texas
    const outsideTexas = !isInTexas(lat, lng);

    // Generate cache key
    const cacheKey = generateCacheKey(lat, lng);

    // Check cache first
    const { data: cacheHit } = await supabase
      .from('api_cache_universal')
      .select('response, provider')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cacheHit?.response) {
      console.log(`[reverse-geocode:${traceId}] Cache HIT`);
      
      const cached = cacheHit.response as any;
      
      await logApiCall(supabase, traceId, 'cache', Date.now() - startTime, true);

      return new Response(
        JSON.stringify({
          success: true,
          formattedAddress: cached.formattedAddress,
          addressComponents: cached.addressComponents,
          confidence: cached.confidence,
          source: 'cache',
          traceId,
          cacheHit: true,
          requestCost: 0,
          isOutsideTexas: outsideTexas,
          isWater: cached.isWater,
        } as ReverseGeocodeResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[reverse-geocode:${traceId}] Cache MISS`);

    let result: {
      formattedAddress: string;
      addressComponents: AddressComponents;
      confidence: number;
      isWater?: boolean;
    } | null = null;
    let source: 'google' | 'nominatim' = 'nominatim';
    let requestCost = 0;

    // Try Google first if available
    if (googleApiKey) {
      result = await reverseGeocodeGoogle(lat, lng, googleApiKey, traceId);
      if (result) {
        source = 'google';
        requestCost = PROVIDER_COSTS.google;
      }
    }

    // Fall back to Nominatim
    if (!result) {
      result = await reverseGeocodeNominatim(lat, lng, traceId);
      if (result) {
        source = 'nominatim';
        requestCost = PROVIDER_COSTS.nominatim;
      }
    }

    // If all providers failed
    if (!result) {
      console.error(`[reverse-geocode:${traceId}] All providers failed`);
      
      await logApiCall(supabase, traceId, 'none', Date.now() - startTime, false, 'All providers failed');

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Reverse geocoding failed: No results from any provider',
          traceId,
          cacheHit: false,
          confidence: 0,
          source: 'nominatim',
          requestCost: 0,
        } as ReverseGeocodeResponse),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cache the result (90-day TTL)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    await supabase.from('api_cache_universal').upsert({
      cache_key: cacheKey,
      provider: source,
      endpoint: 'reverse-geocode',
      response: result,
      expires_at: expiresAt.toISOString(),
    }, { onConflict: 'cache_key' });

    await logApiCall(supabase, traceId, source, Date.now() - startTime, true);

    console.log(`[reverse-geocode:${traceId}] Response: provider=${source}, cost=$${requestCost}, cached=false`);

    return new Response(
      JSON.stringify({
        success: true,
        formattedAddress: result.formattedAddress,
        addressComponents: result.addressComponents,
        confidence: result.confidence,
        source,
        traceId,
        cacheHit: false,
        requestCost,
        isOutsideTexas: outsideTexas,
        isWater: result.isWater,
      } as ReverseGeocodeResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[reverse-geocode:${traceId}] Error:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        traceId,
        cacheHit: false,
        confidence: 0,
        source: 'cache',
        requestCost: 0,
      } as ReverseGeocodeResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
