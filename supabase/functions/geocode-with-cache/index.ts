/**
 * Geocode with Cache Edge Function
 * Wraps Google Geocoding API with 30-day caching in geocoder_cache table
 * Fallback chain: Google → Nominatim → Mapbox
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
  source: 'cache' | 'google' | 'nominatim' | 'mapbox';
  cache_hit: boolean;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  importance: number;
  type: string;
  class: string;
}

interface MapboxFeature {
  id: string;
  type: string;
  place_type: string[];
  relevance: number;
  text: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
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
    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');

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

    console.log(`[geocode-with-cache] Cache MISS`);

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
    } | null = null;

    // Try Google first if API key is available
    if (googleApiKey) {
      console.log(`[geocode-with-cache] Trying Google API`);
      
      const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(geocodeQuery)}&key=${googleApiKey}`;
      
      try {
        const googleResponse = await fetch(googleUrl);
        const googleData = await googleResponse.json();

        if (googleData.status === 'OK' && googleData.results?.length) {
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

          geocodeResult = {
            lat: location.lat,
            lng: location.lng,
            formatted_address: result.formatted_address,
            confidence,
            source: 'google',
          };
          
          console.log(`[geocode-with-cache] Google success: ${result.formatted_address}`);
        } else {
          console.warn(`[geocode-with-cache] Google API failed: ${googleData.status} - ${googleData.error_message || 'No results'}`);
        }
      } catch (googleError) {
        console.error(`[geocode-with-cache] Google API error:`, googleError);
      }
    } else {
      console.log(`[geocode-with-cache] No Google API key, skipping to Nominatim`);
    }

    // Fall back to Nominatim if Google failed or wasn't available
    if (!geocodeResult) {
      const nominatimResult = await geocodeWithNominatim(geocodeQuery);
      
      if (nominatimResult) {
        geocodeResult = {
          ...nominatimResult,
          source: 'nominatim',
        };
      }
    }

    // Fall back to Mapbox if Nominatim also failed
    if (!geocodeResult && mapboxToken) {
      const mapboxResult = await geocodeWithMapbox(geocodeQuery, mapboxToken);
      
      if (mapboxResult) {
        geocodeResult = {
          ...mapboxResult,
          source: 'mapbox',
        };
      }
    } else if (!geocodeResult && !mapboxToken) {
      console.log(`[geocode-with-cache] No Mapbox token available, skipping Mapbox fallback`);
    }

    // If all providers failed, return error
    if (!geocodeResult) {
      console.error(`[geocode-with-cache] All geocoding providers failed (Google → Nominatim → Mapbox)`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Geocoding failed: No results from any provider',
          providers_tried: [
            googleApiKey ? 'google' : null,
            'nominatim',
            mapboxToken ? 'mapbox' : null,
          ].filter(Boolean),
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
    };

    const { error: cacheError } = await supabase
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
      }, {
        onConflict: 'input_hash',
      });

    if (cacheError) {
      console.error(`[geocode-with-cache] Cache write error:`, cacheError);
    } else {
      console.log(`[geocode-with-cache] Cached result from ${geocodeResult.source}, expires: ${expiresAt.toISOString()}`);
    }

    return new Response(
      JSON.stringify({
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
    console.error('[geocode-with-cache] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
