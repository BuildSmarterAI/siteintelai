import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Houston metro bounding box (generous to include inner suburbs)
const HOUSTON_BOUNDS = {
  minLat: 29.52,
  maxLat: 30.15,
  minLng: -95.95,
  maxLng: -95.01,
};

// COH Address Point ArcGIS endpoint
const COH_ADDRESS_POINT_URL = 'https://services.arcgis.com/04HiymDgLlsbhaV4/ArcGIS/rest/services/COH_ADDRESS_POINT/FeatureServer/0/query';

interface AddressValidationRequest {
  address: string;
  lat?: number;
  lng?: number;
}

interface AddressValidationResponse {
  validated: boolean;
  confidence: number;
  standardized_address: string | null;
  source: 'coh' | 'google_av' | 'cache';
  cache_hit: boolean;
  components: {
    street_number?: string;
    street_name?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    county?: string;
  };
  usps_data?: {
    dpv_confirmation?: string;
    carrier_route?: string;
  };
  warnings: string[];
}

function isInHoustonBounds(lat: number, lng: number): boolean {
  return (
    lat >= HOUSTON_BOUNDS.minLat &&
    lat <= HOUSTON_BOUNDS.maxLat &&
    lng >= HOUSTON_BOUNDS.minLng &&
    lng <= HOUSTON_BOUNDS.maxLng
  );
}

async function checkCache(
  supabase: any,
  address: string
): Promise<AddressValidationResponse | null> {
  try {
    const cacheKey = `av_${address.toLowerCase().trim()}`;
    
    const { data, error } = await supabase
      .from('geocoder_cache')
      .select('result_data, created_at')
      .eq('input_hash', cacheKey)
      .eq('query_type', 'address_validation')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (data && !error) {
      console.log('[validate-address] Cache hit for:', address);
      const cached = data.result_data as AddressValidationResponse;
      return { ...cached, source: 'cache', cache_hit: true };
    }
  } catch (err) {
    console.warn('[validate-address] Cache check failed:', err);
  }
  return null;
}

async function saveToCache(
  supabase: any,
  address: string,
  result: AddressValidationResponse
): Promise<void> {
  try {
    const cacheKey = `av_${address.toLowerCase().trim()}`;
    
    await supabase.from('geocoder_cache').upsert({
      input_hash: cacheKey,
      input_query: address,
      query_type: 'address_validation',
      result_data: result,
      confidence: result.confidence,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }, {
      onConflict: 'input_hash'
    });
    
    console.log('[validate-address] Cached result for:', address);
  } catch (err) {
    console.warn('[validate-address] Cache save failed:', err);
  }
}

async function validateWithCOH(
  lat: number,
  lng: number,
  address: string
): Promise<AddressValidationResponse> {
  console.log('[validate-address] Using COH_ADDRESS_POINT for Houston address');
  
  const warnings: string[] = [];
  
  try {
    // Query COH Address Point with spatial proximity
    const queryUrl = `${COH_ADDRESS_POINT_URL}?` + new URLSearchParams({
      geometry: `${lng},${lat}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      distance: '50',
      units: 'esriSRUnit_Foot',
      outFields: 'STREET_NUM,STREET_NAME,CITY,ZIPCODE,STATUS,TYPES,FULL_ADDRESS,PREFIX,SUFFIX',
      returnGeometry: 'false',
      f: 'json',
    });

    const response = await fetch(queryUrl);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0].attributes;
      
      // Check address status
      if (feature.STATUS && feature.STATUS !== 'ACTIVE') {
        warnings.push(`Address status: ${feature.STATUS}`);
      }

      const standardizedAddress = feature.FULL_ADDRESS || 
        [feature.STREET_NUM, feature.PREFIX, feature.STREET_NAME, feature.SUFFIX]
          .filter(Boolean)
          .join(' ');

      return {
        validated: true,
        confidence: 0.95, // High confidence from official city records
        standardized_address: standardizedAddress,
        source: 'coh',
        cache_hit: false,
        components: {
          street_number: feature.STREET_NUM,
          street_name: feature.STREET_NAME,
          city: feature.CITY || 'Houston',
          state: 'TX',
          postal_code: feature.ZIPCODE,
        },
        warnings,
      };
    } else {
      // No match found in COH database
      warnings.push('Address not found in City of Houston records');
      return {
        validated: false,
        confidence: 0.3,
        standardized_address: null,
        source: 'coh',
        cache_hit: false,
        components: {},
        warnings,
      };
    }
  } catch (error) {
    console.error('[validate-address] COH query error:', error);
    warnings.push('COH Address Point query failed');
    return {
      validated: false,
      confidence: 0.0,
      standardized_address: null,
      source: 'coh',
      cache_hit: false,
      components: {},
      warnings,
    };
  }
}

async function validateWithGoogleAV(
  address: string,
  googleApiKey: string
): Promise<AddressValidationResponse> {
  console.log('[validate-address] Using Google Address Validation API for non-Houston address');
  
  const warnings: string[] = [];
  
  try {
    const googleAvUrl = `https://addressvalidation.googleapis.com/v1:validateAddress?key=${googleApiKey}`;
    
    const response = await fetch(googleAvUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: {
          regionCode: 'US',
          addressLines: [address],
        },
        enableUspsCass: true, // USPS-grade validation
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[validate-address] Google AV API error:', response.status, errorText);
      
      // Check if it's an API not enabled error
      if (errorText.includes('ADDRESS_VALIDATION_API') || errorText.includes('not enabled')) {
        warnings.push('Google Address Validation API not enabled - falling back to basic validation');
        return {
          validated: false,
          confidence: 0.5,
          standardized_address: address,
          source: 'google_av',
          cache_hit: false,
          components: {},
          warnings,
        };
      }
      
      throw new Error(`Google AV API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.result;

    if (!result) {
      warnings.push('No validation result from Google');
      return {
        validated: false,
        confidence: 0.0,
        standardized_address: null,
        source: 'google_av',
        cache_hit: false,
        components: {},
        warnings,
      };
    }

    // Extract verdict
    const verdict = result.verdict || {};
    const addressComplete = verdict.addressComplete === true;
    const hasUnconfirmedComponents = verdict.hasUnconfirmedComponents === true;
    const hasInferredComponents = verdict.hasInferredComponents === true;

    // Calculate confidence based on verdict
    let confidence = 0.5;
    if (addressComplete && !hasUnconfirmedComponents) {
      confidence = 0.95;
    } else if (addressComplete && hasUnconfirmedComponents) {
      confidence = 0.75;
    } else if (hasInferredComponents) {
      confidence = 0.6;
    }

    // Extract address components
    const postalAddress = result.address?.postalAddress || {};
    const components: AddressValidationResponse['components'] = {};

    if (postalAddress.addressLines?.[0]) {
      const streetParts = postalAddress.addressLines[0].match(/^(\d+)\s+(.+)$/);
      if (streetParts) {
        components.street_number = streetParts[1];
        components.street_name = streetParts[2];
      }
    }
    components.city = postalAddress.locality;
    components.state = postalAddress.administrativeArea;
    components.postal_code = postalAddress.postalCode;

    // Extract USPS data if available
    let uspsData: AddressValidationResponse['usps_data'];
    if (result.uspsData) {
      uspsData = {
        dpv_confirmation: result.uspsData.dpvConfirmation,
        carrier_route: result.uspsData.carrierRoute,
      };
      
      // Add warnings based on DPV
      if (result.uspsData.dpvConfirmation === 'N') {
        warnings.push('Address not confirmed deliverable by USPS');
        confidence = Math.min(confidence, 0.4);
      }
    }

    // Add warnings for missing components
    if (result.address?.missingComponentTypes) {
      for (const missing of result.address.missingComponentTypes) {
        warnings.push(`Missing: ${missing}`);
      }
    }

    const formattedAddress = result.address?.formattedAddress || postalAddress.addressLines?.join(', ');

    return {
      validated: addressComplete,
      confidence,
      standardized_address: formattedAddress,
      source: 'google_av',
      cache_hit: false,
      components,
      usps_data: uspsData,
      warnings,
    };
  } catch (error) {
    console.error('[validate-address] Google AV error:', error);
    warnings.push(`Google Address Validation failed: ${error.message}`);
    return {
      validated: false,
      confidence: 0.0,
      standardized_address: null,
      source: 'google_av',
      cache_hit: false,
      components: {},
      warnings,
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = crypto.randomUUID().slice(0, 8);
  console.log(`[validate-address][${traceId}] Request received`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: AddressValidationRequest = await req.json();
    const { address, lat, lng } = body;

    if (!address) {
      return new Response(
        JSON.stringify({ success: false, error: 'Address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[validate-address][${traceId}] Validating:`, { address, lat, lng });

    // Check cache first
    const cachedResult = await checkCache(supabase, address);
    if (cachedResult) {
      return new Response(
        JSON.stringify({ success: true, data: cachedResult }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: AddressValidationResponse;

    // Determine validation source based on location
    const hasCoordinates = lat !== undefined && lng !== undefined;
    const isHouston = hasCoordinates && isInHoustonBounds(lat, lng);

    if (isHouston) {
      // Use free COH Address Point for Houston addresses
      result = await validateWithCOH(lat, lng, address);
    } else {
      // Use Google Address Validation API for non-Houston addresses
      result = await validateWithGoogleAV(address, googleApiKey);
    }

    // Cache the result
    await saveToCache(supabase, address, result);

    console.log(`[validate-address][${traceId}] Result:`, {
      validated: result.validated,
      confidence: result.confidence,
      source: result.source,
    });

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`[validate-address][${traceId}] Error:`, error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
