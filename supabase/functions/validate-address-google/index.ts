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
  inferred?: boolean;
  spellCorrected?: boolean;
  replaced?: boolean;
  unexpected?: boolean;
}

interface UspsData {
  dpvConfirmation: 'Y' | 'N' | 'S' | 'D' | '';  // Y=Confirmed, N=Not found, S=Secondary missing, D=Default
  dpvFootnote: string;
  isVacant: boolean;
  carrierRoute: string;
  fipsCountyCode: string;
  county: string;
  zipPlus4: string;
  addressRecordType: string;
  postOfficeCity: string;
  postOfficeState: string;
  deliveryPointCode: string;
  deliveryPointCheckDigit: string;
}

interface ComponentConfirmations {
  [component: string]: 'CONFIRMED' | 'UNCONFIRMED_BUT_PLAUSIBLE' | 'UNCONFIRMED_AND_SUSPICIOUS';
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
  
  // NEW: Enhanced geocode quality
  geocodeGranularity?: 'ROOFTOP' | 'RANGE_INTERPOLATED' | 'GEOMETRIC_CENTER' | 'APPROXIMATE' | 'OTHER';
  featureSizeMeters?: number;
  
  // NEW: Component-level confidence
  componentConfirmations?: ComponentConfirmations;
  hasInferredComponents?: boolean;
  hasReplacedComponents?: boolean;
  hasSpellCorrectedComponents?: boolean;
  suggestedAction?: 'ACCEPT' | 'CONFIRM' | 'FIX';
  
  // NEW: Property metadata
  propertyType?: 'RESIDENTIAL' | 'BUSINESS' | 'PO_BOX' | 'UNKNOWN';
  
  // NEW: USPS validation (US addresses)
  usps?: UspsData;
  
  // NEW: Plus code
  plusCode?: {
    global: string;
    compound: string;
  };
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
    const hasInferredComponents = verdict?.hasInferredComponents === true;
    const hasReplacedComponents = verdict?.hasReplacedComponents === true;
    
    // Extract address components with confirmation levels
    const components: ValidationResult['components'] = {};
    const componentConfirmations: ComponentConfirmations = {};
    const addressComponents: AddressComponent[] = result?.address?.addressComponents || [];
    
    let hasSpellCorrectedComponents = false;
    
    for (const comp of addressComponents) {
      const type = comp.componentType;
      const name = comp.componentName?.text;
      const confirmationLevel = comp.confirmationLevel as 'CONFIRMED' | 'UNCONFIRMED_BUT_PLAUSIBLE' | 'UNCONFIRMED_AND_SUSPICIOUS';
      
      // Track spell corrections
      if (comp.spellCorrected) {
        hasSpellCorrectedComponents = true;
      }
      
      // Store confirmation level for each component type
      if (confirmationLevel) {
        componentConfirmations[type] = confirmationLevel;
      }
      
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

    // Get geocode with granularity
    const geocode = result?.geocode;
    const location = geocode?.location;
    const placeType = geocode?.placeType;
    const featureSizeMeters = geocode?.featureSizeMeters;
    
    // Map Google's placeType to our granularity enum
    let geocodeGranularity: ValidationResult['geocodeGranularity'] = 'OTHER';
    if (placeType === 'ROOFTOP' || placeType === 'PREMISE' || placeType === 'SUBPREMISE') {
      geocodeGranularity = 'ROOFTOP';
    } else if (placeType === 'RANGE_INTERPOLATED') {
      geocodeGranularity = 'RANGE_INTERPOLATED';
    } else if (placeType === 'GEOMETRIC_CENTER') {
      geocodeGranularity = 'GEOMETRIC_CENTER';
    } else if (placeType === 'APPROXIMATE') {
      geocodeGranularity = 'APPROXIMATE';
    }
    
    // Build standardized address
    const standardizedAddress = result?.address?.formattedAddress || address;

    // Extract USPS data if available
    let uspsData: UspsData | undefined;
    const uspsRaw = result?.uspsData;
    if (uspsRaw) {
      uspsData = {
        dpvConfirmation: uspsRaw.dpvConfirmation || '',
        dpvFootnote: uspsRaw.dpvFootnote || '',
        isVacant: uspsRaw.addressVacant === 'Y',
        carrierRoute: uspsRaw.carrierRoute || '',
        fipsCountyCode: uspsRaw.fipsCountyCode || '',
        county: uspsRaw.county || '',
        zipPlus4: uspsRaw.standardizedAddress?.zipCodePlus4Extension 
          ? `${components.zip}-${uspsRaw.standardizedAddress.zipCodePlus4Extension}` 
          : components.zip || '',
        addressRecordType: uspsRaw.addressRecordType || '',
        postOfficeCity: uspsRaw.postOfficeCity || '',
        postOfficeState: uspsRaw.postOfficeState || '',
        deliveryPointCode: uspsRaw.dpvDeliveryPointCode || '',
        deliveryPointCheckDigit: uspsRaw.dpvDeliveryPointCheckDigit || '',
      };
      
      // Use USPS county if not already extracted
      if (!components.county && uspsData.county) {
        components.county = uspsData.county.replace(' County', '');
      }
    }
    
    // Extract plus code if available
    let plusCode: ValidationResult['plusCode'];
    if (geocode?.plusCode) {
      plusCode = {
        global: geocode.plusCode.globalCode || '',
        compound: geocode.plusCode.compoundCode || '',
      };
    }
    
    // Determine property type from metadata
    let propertyType: ValidationResult['propertyType'] = 'UNKNOWN';
    const metadata = result?.metadata;
    if (metadata) {
      if (metadata.poBox) {
        propertyType = 'PO_BOX';
      } else if (metadata.business) {
        propertyType = 'BUSINESS';
      } else if (metadata.residential) {
        propertyType = 'RESIDENTIAL';
      }
    }

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
    if (geocodeGranularity && geocodeGranularity !== 'ROOFTOP') {
      issues.push(`Low geocode accuracy: ${geocodeGranularity}`);
    }
    
    // Check USPS validation
    if (uspsData?.dpvConfirmation === 'N') {
      issues.push('USPS: Address not deliverable');
    } else if (uspsData?.dpvConfirmation === 'S') {
      issues.push('USPS: Missing secondary/unit number');
    } else if (uspsData?.dpvConfirmation === 'D') {
      issues.push('USPS: Default delivery only');
    }
    
    if (uspsData?.isVacant) {
      issues.push('USPS: Address marked as vacant');
    }
    
    // Check for unconfirmed components
    const hasSuspiciousComponents = Object.values(componentConfirmations).some(
      level => level === 'UNCONFIRMED_AND_SUSPICIOUS'
    );
    if (hasSuspiciousComponents) {
      issues.push('Has suspicious/unconfirmed address components');
    }

    // Calculate confidence based on all factors
    let confidence = 1.0;
    if (!addressComplete) confidence -= 0.3;
    if (hasUnconfirmedComponents) confidence -= 0.1;
    if (hasInferredComponents) confidence -= 0.05;
    if (hasReplacedComponents) confidence -= 0.1;
    if (geocodeGranularity !== 'ROOFTOP') confidence -= 0.1;
    if (uspsData?.dpvConfirmation !== 'Y') confidence -= 0.15;
    if (hasSuspiciousComponents) confidence -= 0.2;
    confidence = Math.max(0.1, Math.min(1.0, confidence));

    const valid = issues.length === 0 && addressComplete;
    
    // Determine suggested action
    let suggestedAction: ValidationResult['suggestedAction'] = 'ACCEPT';
    if (!valid) {
      suggestedAction = hasSuspiciousComponents ? 'FIX' : 'CONFIRM';
    }
    
    const validationResult: ValidationResult = {
      valid,
      verdict: valid ? 'CONFIRMED' : (hasUnconfirmedComponents ? 'UNCONFIRMED' : 'INVALID'),
      confidence,
      standardizedAddress,
      components,
      geocode: location ? {
        lat: location.latitude,
        lng: location.longitude,
        accuracy: placeType || 'UNKNOWN'
      } : undefined,
      addressType: metadata?.addressType,
      issues: issues.length > 0 ? issues : undefined,
      
      // Enhanced data
      geocodeGranularity,
      featureSizeMeters,
      componentConfirmations: Object.keys(componentConfirmations).length > 0 ? componentConfirmations : undefined,
      hasInferredComponents,
      hasReplacedComponents,
      hasSpellCorrectedComponents,
      suggestedAction,
      propertyType,
      usps: uspsData,
      plusCode,
    };

    console.log('[validate-address-google] Validation result:', {
      valid: validationResult.valid,
      verdict: validationResult.verdict,
      confidence: validationResult.confidence.toFixed(2),
      geocodeGranularity: validationResult.geocodeGranularity,
      propertyType: validationResult.propertyType,
      dpvConfirmation: validationResult.usps?.dpvConfirmation,
      fipsCountyCode: validationResult.usps?.fipsCountyCode,
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
