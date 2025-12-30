import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AddressComponent {
  componentName: {
    text: string;
    languageCode: string;
  };
  componentType: string;
  confirmationLevel: string;
}

interface ValidationResult {
  valid: boolean;
  verdict: 'CONFIRMED' | 'UNCONFIRMED' | 'INVALID' | 'ERROR';
  confidence: number;
  standardizedAddress: string;
  components: {
    streetNumber?: string;
    streetName?: string;
    city?: string;
    state?: string;
    zip?: string;
    county?: string;
  };
  geocode?: {
    lat: number;
    lng: number;
    accuracy: string;
  };
  addressType?: string;
  issues?: string[];
}

// Texas bounding box for coordinate validation
const TEXAS_BOUNDS = {
  minLat: 25.8,
  maxLat: 36.5,
  minLng: -106.6,
  maxLng: -93.5
};

function isInTexas(lat: number, lng: number): boolean {
  return lat >= TEXAS_BOUNDS.minLat && 
         lat <= TEXAS_BOUNDS.maxLat && 
         lng >= TEXAS_BOUNDS.minLng && 
         lng <= TEXAS_BOUNDS.maxLng;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now();

  try {
    const { address, lat, lng } = await req.json()
    
    console.log('[validate-address-google] Request received:', {
      address,
      lat,
      lng,
      timestamp: new Date().toISOString()
    });
    
    if (!address) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          verdict: 'ERROR',
          error: 'Address is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    
    if (!apiKey) {
      console.error('[validate-address-google] API key not configured');
      return new Response(
        JSON.stringify({ 
          valid: false, 
          verdict: 'ERROR',
          error: 'Google API key not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Call Google Address Validation API
    const url = `https://addressvalidation.googleapis.com/v1:validateAddress?key=${apiKey}`;
    
    console.log('[validate-address-google] Calling Google Address Validation API...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: {
          addressLines: [address],
          regionCode: 'US',
          locality: 'TX' // Hint to bias toward Texas
        },
        enableUspsCass: true // Enable USPS CASS validation for US addresses
      })
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    console.log('[validate-address-google] API response:', {
      status: response.status,
      has_result: !!data.result,
      duration_ms: duration
    });

    if (!response.ok) {
      console.error('[validate-address-google] API error:', data);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          verdict: 'ERROR',
          error: data.error?.message || 'Address validation failed'
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse the validation result
    const result = data.result;
    const verdict = result?.verdict;
    const addressComplete = verdict?.addressComplete === true;
    const hasUnconfirmedComponents = verdict?.hasUnconfirmedComponentTypes === true;
    
    // Extract address components
    const components: ValidationResult['components'] = {};
    const addressComponents = result?.address?.addressComponents || [];
    
    for (const comp of addressComponents) {
      const type = comp.componentType;
      const name = comp.componentName?.text;
      
      switch (type) {
        case 'street_number':
          components.streetNumber = name;
          break;
        case 'route':
          components.streetName = name;
          break;
        case 'locality':
          components.city = name;
          break;
        case 'administrative_area_level_1':
          components.state = name;
          break;
        case 'postal_code':
          components.zip = name;
          break;
        case 'administrative_area_level_2':
          components.county = name?.replace(' County', '');
          break;
      }
    }

    // Get geocode
    const geocode = result?.geocode;
    const location = geocode?.location;
    
    // Build standardized address
    const standardizedAddress = result?.address?.formattedAddress || address;

    // Determine if valid for SiteIntel purposes
    const issues: string[] = [];
    
    // Check for missing critical components
    if (!components.streetNumber) {
      issues.push('Missing street number');
    }
    if (!components.streetName) {
      issues.push('Missing street name');
    }
    if (!components.city) {
      issues.push('Missing city');
    }
    if (!components.state || (components.state !== 'TX' && components.state !== 'Texas')) {
      issues.push('Not in Texas');
    }
    
    // Check coordinates
    if (!location?.latitude || !location?.longitude) {
      issues.push('Unable to geocode');
    } else if (!isInTexas(location.latitude, location.longitude)) {
      issues.push('Coordinates outside Texas');
    }

    // Check geocode quality
    const granularity = geocode?.placeType;
    if (granularity && !['PREMISE', 'SUBPREMISE', 'ROOFTOP'].includes(granularity)) {
      issues.push('Low geocode accuracy');
    }

    const valid = issues.length === 0 && addressComplete;
    
    const validationResult: ValidationResult = {
      valid,
      verdict: valid ? 'CONFIRMED' : (hasUnconfirmedComponents ? 'UNCONFIRMED' : 'INVALID'),
      confidence: valid ? 0.95 : (addressComplete ? 0.7 : 0.3),
      standardizedAddress,
      components,
      geocode: location ? {
        lat: location.latitude,
        lng: location.longitude,
        accuracy: granularity || 'UNKNOWN'
      } : undefined,
      addressType: result?.metadata?.addressType,
      issues: issues.length > 0 ? issues : undefined
    };

    console.log('[validate-address-google] Validation result:', {
      valid: validationResult.valid,
      verdict: validationResult.verdict,
      issues: validationResult.issues,
      duration_ms: duration
    });

    return new Response(
      JSON.stringify(validationResult),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[validate-address-google] Error:', {
      message: error.message,
      stack: error.stack,
      duration_ms: duration
    });
    return new Response(
      JSON.stringify({ 
        valid: false, 
        verdict: 'ERROR',
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})