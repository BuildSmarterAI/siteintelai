import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Texas state bounds
const TEXAS_BOUNDS = {
  minLat: 25.84,
  maxLat: 36.50,
  minLng: -106.65,
  maxLng: -93.51,
};

// Houston metro bounding box
const HOUSTON_CITY_BOUNDS = {
  minLat: 29.52,
  maxLat: 30.15,
  minLng: -95.95,
  maxLng: -95.01,
};

// County-specific bounds for routing
const COUNTY_BOUNDS: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
  'Harris': { minLat: 29.49, maxLat: 30.17, minLng: -95.91, maxLng: -94.91 },
  'Fort Bend': { minLat: 29.37, maxLat: 29.81, minLng: -96.05, maxLng: -95.52 },
  'Montgomery': { minLat: 30.07, maxLat: 30.67, minLng: -95.86, maxLng: -95.07 },
  'Brazoria': { minLat: 28.93, maxLat: 29.58, minLng: -95.90, maxLng: -95.05 },
  'Galveston': { minLat: 29.08, maxLat: 29.64, minLng: -95.30, maxLng: -94.51 },
};

// COH Address Point ArcGIS endpoint (City of Houston)
const COH_ADDRESS_POINT_URL = 'https://services.arcgis.com/04HiymDgLlsbhaV4/ArcGIS/rest/services/COH_ADDRESS_POINT/FeatureServer/0/query';

// HCAD Parcel endpoint (Harris County)
const HCAD_PARCELS_URL = 'https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query';

// FBCAD Parcel endpoint (Fort Bend County)
const FBCAD_PARCELS_URL = 'https://gisweb.fbcad.org/arcgis/rest/services/Hosted/FBCAD_Public_Data/FeatureServer/0/query';

// TNRIS Statewide Address Points (TxDOT/911)
const TNRIS_ADDRESS_URL = 'https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Address_Points/FeatureServer/0/query';

// TAMU Geocoder (free tier fallback)
const TAMU_GEOCODER_URL = 'https://geoservices.tamu.edu/Services/Geocode/WebService/GeocoderWebServiceHttpNonParsed_V04_01.aspx';

type ValidationSource = 'cache' | 'coh' | 'hcad' | 'fbcad' | 'mcad' | 'tnris' | 'tamu' | 'google_geocoding';

interface AddressValidationRequest {
  address: string;
  lat?: number;
  lng?: number;
}

interface AddressValidationResponse {
  validated: boolean;
  confidence: number;
  standardized_address: string | null;
  source: ValidationSource;
  cache_hit: boolean;
  components: {
    street_number?: string;
    street_name?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    county?: string;
  };
  parcel_linked?: {
    parcel_id?: string;
    owner?: string;
  };
  usps_data?: {
    dpv_confirmation?: string;
    carrier_route?: string;
  };
  warnings: string[];
}

function isInTexas(lat: number, lng: number): boolean {
  return (
    lat >= TEXAS_BOUNDS.minLat &&
    lat <= TEXAS_BOUNDS.maxLat &&
    lng >= TEXAS_BOUNDS.minLng &&
    lng <= TEXAS_BOUNDS.maxLng
  );
}

function isInHoustonCity(lat: number, lng: number): boolean {
  return (
    lat >= HOUSTON_CITY_BOUNDS.minLat &&
    lat <= HOUSTON_CITY_BOUNDS.maxLat &&
    lng >= HOUSTON_CITY_BOUNDS.minLng &&
    lng <= HOUSTON_CITY_BOUNDS.maxLng
  );
}

function detectTexasCounty(lat: number, lng: number): string | null {
  for (const [county, bounds] of Object.entries(COUNTY_BOUNDS)) {
    if (
      lat >= bounds.minLat &&
      lat <= bounds.maxLat &&
      lng >= bounds.minLng &&
      lng <= bounds.maxLng
    ) {
      return county;
    }
  }
  return null;
}

// Cache functions
async function checkCache(supabase: any, address: string): Promise<AddressValidationResponse | null> {
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

async function saveToCache(supabase: any, address: string, result: AddressValidationResponse): Promise<void> {
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
  } catch (err) {
    console.warn('[validate-address] Cache save failed:', err);
  }
}

// Tier 1: City of Houston (COH) Address Points
async function validateWithCOH(lat: number, lng: number, address: string): Promise<AddressValidationResponse> {
  console.log('[validate-address] Using COH_ADDRESS_POINT for Houston address');
  
  const warnings: string[] = [];
  
  try {
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
      
      if (feature.STATUS && feature.STATUS !== 'ACTIVE') {
        warnings.push(`Address status: ${feature.STATUS}`);
      }

      const standardizedAddress = feature.FULL_ADDRESS || 
        [feature.STREET_NUM, feature.PREFIX, feature.STREET_NAME, feature.SUFFIX]
          .filter(Boolean)
          .join(' ');

      return {
        validated: true,
        confidence: 0.95,
        standardized_address: standardizedAddress,
        source: 'coh',
        cache_hit: false,
        components: {
          street_number: feature.STREET_NUM,
          street_name: feature.STREET_NAME,
          city: feature.CITY || 'Houston',
          state: 'TX',
          postal_code: feature.ZIPCODE,
          county: 'Harris',
        },
        warnings,
      };
    } else {
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

// Tier 2: HCAD Parcels (Harris County)
async function validateWithHCAD(lat: number, lng: number, address: string): Promise<AddressValidationResponse> {
  console.log('[validate-address] Using HCAD Parcels for Harris County');
  
  const warnings: string[] = [];
  
  try {
    const queryUrl = `${HCAD_PARCELS_URL}?` + new URLSearchParams({
      geometry: `${lng},${lat}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelWithin',
      outFields: 'ACCOUNT,LocAddr,CurrOwner,SITE_CITY,SITE_ZIP',
      returnGeometry: 'false',
      f: 'json',
    });

    const response = await fetch(queryUrl);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0].attributes;

      return {
        validated: true,
        confidence: 0.92,
        standardized_address: feature.LocAddr || null,
        source: 'hcad',
        cache_hit: false,
        components: {
          city: feature.SITE_CITY || 'Houston',
          state: 'TX',
          postal_code: feature.SITE_ZIP,
          county: 'Harris',
        },
        parcel_linked: {
          parcel_id: feature.ACCOUNT,
          owner: feature.CurrOwner,
        },
        warnings,
      };
    } else {
      warnings.push('No parcel found at location in HCAD');
      return {
        validated: false,
        confidence: 0.3,
        standardized_address: null,
        source: 'hcad',
        cache_hit: false,
        components: { county: 'Harris', state: 'TX' },
        warnings,
      };
    }
  } catch (error) {
    console.error('[validate-address] HCAD query error:', error);
    warnings.push('HCAD query failed');
    return {
      validated: false,
      confidence: 0.0,
      standardized_address: null,
      source: 'hcad',
      cache_hit: false,
      components: {},
      warnings,
    };
  }
}

// Tier 2: FBCAD Parcels (Fort Bend County)
async function validateWithFBCAD(lat: number, lng: number, address: string): Promise<AddressValidationResponse> {
  console.log('[validate-address] Using FBCAD Parcels for Fort Bend County');
  
  const warnings: string[] = [];
  
  try {
    const queryUrl = `${FBCAD_PARCELS_URL}?` + new URLSearchParams({
      geometry: `${lng},${lat}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelWithin',
      outFields: 'propnumber,situs,ownername,city,zip',
      returnGeometry: 'false',
      f: 'json',
    });

    const response = await fetch(queryUrl);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0].attributes;

      return {
        validated: true,
        confidence: 0.92,
        standardized_address: feature.situs || null,
        source: 'fbcad',
        cache_hit: false,
        components: {
          city: feature.city,
          state: 'TX',
          postal_code: feature.zip,
          county: 'Fort Bend',
        },
        parcel_linked: {
          parcel_id: feature.propnumber,
          owner: feature.ownername,
        },
        warnings,
      };
    } else {
      warnings.push('No parcel found at location in FBCAD');
      return {
        validated: false,
        confidence: 0.3,
        standardized_address: null,
        source: 'fbcad',
        cache_hit: false,
        components: { county: 'Fort Bend', state: 'TX' },
        warnings,
      };
    }
  } catch (error) {
    console.error('[validate-address] FBCAD query error:', error);
    warnings.push('FBCAD query failed');
    return {
      validated: false,
      confidence: 0.0,
      standardized_address: null,
      source: 'fbcad',
      cache_hit: false,
      components: {},
      warnings,
    };
  }
}

// Tier 3: TNRIS Statewide Address Points (all Texas)
async function validateWithTNRIS(lat: number, lng: number, address: string): Promise<AddressValidationResponse> {
  console.log('[validate-address] Using TNRIS Statewide Address Points');
  
  const warnings: string[] = [];
  
  try {
    const queryUrl = `${TNRIS_ADDRESS_URL}?` + new URLSearchParams({
      geometry: `${lng},${lat}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      distance: '100',
      units: 'esriSRUnit_Foot',
      outFields: 'ADDR_NUM,STREET,CITY,STATE,ZIP,COUNTY',
      returnGeometry: 'false',
      f: 'json',
    });

    const response = await fetch(queryUrl);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0].attributes;
      
      const standardizedAddress = [feature.ADDR_NUM, feature.STREET]
        .filter(Boolean)
        .join(' ');

      return {
        validated: true,
        confidence: 0.88,
        standardized_address: standardizedAddress || null,
        source: 'tnris',
        cache_hit: false,
        components: {
          street_number: feature.ADDR_NUM,
          street_name: feature.STREET,
          city: feature.CITY,
          state: feature.STATE || 'TX',
          postal_code: feature.ZIP,
          county: feature.COUNTY,
        },
        warnings,
      };
    } else {
      warnings.push('Address not found in TNRIS statewide records');
      return {
        validated: false,
        confidence: 0.3,
        standardized_address: null,
        source: 'tnris',
        cache_hit: false,
        components: { state: 'TX' },
        warnings,
      };
    }
  } catch (error) {
    console.error('[validate-address] TNRIS query error:', error);
    warnings.push('TNRIS query failed');
    return {
      validated: false,
      confidence: 0.0,
      standardized_address: null,
      source: 'tnris',
      cache_hit: false,
      components: {},
      warnings,
    };
  }
}

// Tier 4: TAMU GeoServices (free tier fallback)
async function validateWithTAMU(address: string, apiKey: string): Promise<AddressValidationResponse> {
  console.log('[validate-address] Using TAMU GeoServices fallback');
  
  const warnings: string[] = [];
  
  if (!apiKey) {
    warnings.push('TAMU API key not configured');
    return {
      validated: false,
      confidence: 0.0,
      standardized_address: null,
      source: 'tamu',
      cache_hit: false,
      components: {},
      warnings,
    };
  }
  
  try {
    const params = new URLSearchParams({
      apiKey,
      version: '4.01',
      streetAddress: address,
      city: '',
      state: 'TX',
      format: 'json',
      census: 'false',
      notStore: 'true',
    });

    const response = await fetch(`${TAMU_GEOCODER_URL}?${params}`);
    const data = await response.json();

    if (data.OutputGeocode && data.OutputGeocode.MatchScore >= 80) {
      const geo = data.OutputGeocode;
      
      return {
        validated: true,
        confidence: geo.MatchScore / 100,
        standardized_address: geo.MatchedAddress || address,
        source: 'tamu',
        cache_hit: false,
        components: {
          city: geo.City,
          state: geo.State || 'TX',
          postal_code: geo.Zip,
          county: geo.County,
        },
        warnings,
      };
    } else {
      warnings.push('Low confidence match from TAMU');
      return {
        validated: false,
        confidence: (data.OutputGeocode?.MatchScore || 0) / 100,
        standardized_address: null,
        source: 'tamu',
        cache_hit: false,
        components: {},
        warnings,
      };
    }
  } catch (error) {
    console.error('[validate-address] TAMU query error:', error);
    warnings.push('TAMU geocoder failed');
    return {
      validated: false,
      confidence: 0.0,
      standardized_address: null,
      source: 'tamu',
      cache_hit: false,
      components: {},
      warnings,
    };
  }
}

// Tier 5: Google Geocoding API (non-Texas fallback - cheaper than Address Validation)
async function validateWithGoogleGeocoding(address: string, apiKey: string): Promise<AddressValidationResponse> {
  console.log('[validate-address] Using Google Geocoding API fallback');
  
  const warnings: string[] = [];
  
  try {
    const params = new URLSearchParams({
      address,
      key: apiKey,
    });

    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      
      // Extract address components
      const components: AddressValidationResponse['components'] = {};
      for (const comp of result.address_components || []) {
        if (comp.types.includes('street_number')) components.street_number = comp.long_name;
        if (comp.types.includes('route')) components.street_name = comp.long_name;
        if (comp.types.includes('locality')) components.city = comp.long_name;
        if (comp.types.includes('administrative_area_level_1')) components.state = comp.short_name;
        if (comp.types.includes('postal_code')) components.postal_code = comp.long_name;
        if (comp.types.includes('administrative_area_level_2')) {
          components.county = comp.long_name.replace(' County', '');
        }
      }

      // Calculate confidence based on location_type
      let confidence = 0.7;
      if (result.geometry?.location_type === 'ROOFTOP') confidence = 0.95;
      else if (result.geometry?.location_type === 'RANGE_INTERPOLATED') confidence = 0.85;
      else if (result.geometry?.location_type === 'GEOMETRIC_CENTER') confidence = 0.75;

      return {
        validated: true,
        confidence,
        standardized_address: result.formatted_address,
        source: 'google_geocoding',
        cache_hit: false,
        components,
        warnings,
      };
    } else {
      warnings.push(`Google Geocoding status: ${data.status}`);
      return {
        validated: false,
        confidence: 0.0,
        standardized_address: null,
        source: 'google_geocoding',
        cache_hit: false,
        components: {},
        warnings,
      };
    }
  } catch (error) {
    console.error('[validate-address] Google Geocoding error:', error);
    warnings.push('Google Geocoding failed');
    return {
      validated: false,
      confidence: 0.0,
      standardized_address: null,
      source: 'google_geocoding',
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
    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY') || '';
    const tamuApiKey = Deno.env.get('TAMU_GEOCODER_API_KEY') || '';

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
    
    if (hasCoordinates && isInTexas(lat, lng)) {
      const county = detectTexasCounty(lat, lng);
      console.log(`[validate-address][${traceId}] Texas county detected: ${county}`);

      // Tier 1: City of Houston (highest accuracy for Houston)
      if (isInHoustonCity(lat, lng)) {
        result = await validateWithCOH(lat, lng, address);
        if (result.validated) {
          await saveToCache(supabase, address, result);
          return new Response(
            JSON.stringify({ success: true, data: result }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Tier 2: County CADs (parcel-linked data)
      if (county === 'Harris') {
        result = await validateWithHCAD(lat, lng, address);
        if (result.validated) {
          await saveToCache(supabase, address, result);
          return new Response(
            JSON.stringify({ success: true, data: result }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else if (county === 'Fort Bend') {
        result = await validateWithFBCAD(lat, lng, address);
        if (result.validated) {
          await saveToCache(supabase, address, result);
          return new Response(
            JSON.stringify({ success: true, data: result }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Tier 3: TNRIS Statewide (all Texas)
      result = await validateWithTNRIS(lat, lng, address);
      if (result.validated) {
        await saveToCache(supabase, address, result);
        return new Response(
          JSON.stringify({ success: true, data: result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Tier 4: TAMU Geocoder fallback (Texas)
      if (tamuApiKey) {
        result = await validateWithTAMU(address, tamuApiKey);
        if (result.validated) {
          await saveToCache(supabase, address, result);
          return new Response(
            JSON.stringify({ success: true, data: result }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Last resort for Texas: return best unsuccessful result
      result.warnings.push('Address could not be validated with high confidence');
      await saveToCache(supabase, address, result);
    } else {
      // Non-Texas: Use Google Geocoding (cheaper than Address Validation API)
      if (googleApiKey) {
        result = await validateWithGoogleGeocoding(address, googleApiKey);
      } else {
        result = {
          validated: false,
          confidence: 0,
          standardized_address: null,
          source: 'google_geocoding',
          cache_hit: false,
          components: {},
          warnings: ['No API key available for non-Texas addresses'],
        };
      }
      
      await saveToCache(supabase, address, result);
    }

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
