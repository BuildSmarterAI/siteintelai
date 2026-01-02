/**
 * validate-address-usps - A-06: USPS Address Validation
 * 
 * Standardizes addresses to USPS format for lender-ready reports.
 * Uses Google Address Validation API with USPS CASS enabled.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AddressInput {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
}

interface USPSValidationRequest {
  address: AddressInput;
  validateDeliverability?: boolean;
}

interface USPSStandardized {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip5: string;
  zip4?: string;
  deliveryPoint?: string;
}

interface USPSValidationResponse {
  valid: boolean;
  standardized: USPSStandardized;
  corrections: string[];
  deliverable: boolean;
  residentialIndicator: 'Y' | 'N' | 'U';
  dpvMatch: 'Y' | 'N' | 'D' | 'S';
  traceId: string;
  requestCost: number;
  cacheHit: boolean;
}

// Generate 8-char trace ID
function generateTraceId(): string {
  return crypto.randomUUID().substring(0, 8);
}

// Normalize address for cache key
function normalizeAddress(addr: AddressInput): string {
  return `${addr.line1}|${addr.line2 || ''}|${addr.city}|${addr.state}|${addr.zip}`
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Generate cache key
function generateCacheKey(addr: AddressInput): string {
  const normalized = normalizeAddress(addr);
  return `usps:v1:${btoa(normalized).substring(0, 32)}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const traceId = generateTraceId();

  try {
    const { address, validateDeliverability = true }: USPSValidationRequest = await req.json();

    if (!address || !address.line1 || !address.city || !address.state || !address.zip) {
      return new Response(
        JSON.stringify({ error: 'Missing required address fields', traceId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${traceId}] validate-address-usps: ${address.line1}, ${address.city}, ${address.state}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const cacheKey = generateCacheKey(address);

    // Check cache first
    const { data: cached } = await supabase
      .from('api_cache_universal')
      .select('response')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cached?.response) {
      console.log(`[${traceId}] Cache hit for USPS validation`);
      const cachedResponse = cached.response as USPSValidationResponse;
      cachedResponse.traceId = traceId;
      cachedResponse.cacheHit = true;
      cachedResponse.requestCost = 0;

      await supabase.from('api_logs').insert({
        source: 'validate-address-usps',
        endpoint: 'cache',
        duration_ms: Date.now() - startTime,
        success: true,
        cache_key: cacheKey,
      });

      return new Response(JSON.stringify(cachedResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check emergency mode
    const { data: emergencyMode } = await supabase
      .from('api_budget_config')
      .select('is_active')
      .eq('budget_type', 'emergency_mode')
      .eq('source', 'google')
      .maybeSingle();

    if (emergencyMode?.is_active) {
      console.log(`[${traceId}] Emergency mode active, blocking Google calls`);
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable', traceId }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Google Address Validation API
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Google API key not configured', traceId }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const googleUrl = 'https://addressvalidation.googleapis.com/v1:validateAddress';
    const googleResponse = await fetch(`${googleUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: {
          addressLines: [address.line1, address.line2].filter(Boolean),
          locality: address.city,
          administrativeArea: address.state,
          postalCode: address.zip,
          regionCode: 'US',
        },
        enableUspsCass: true,
      }),
    });

    const googleData = await googleResponse.json();
    const duration = Date.now() - startTime;

    if (!googleResponse.ok || googleData.error) {
      console.error(`[${traceId}] Google API error:`, googleData.error);
      await supabase.from('api_logs').insert({
        source: 'validate-address-usps',
        endpoint: 'google-address-validation',
        duration_ms: duration,
        success: false,
        error_message: googleData.error?.message || 'Unknown error',
      });

      return new Response(
        JSON.stringify({ error: 'Address validation failed', traceId }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse USPS data from response
    const result = googleData.result;
    const uspsData = result?.uspsData || {};
    const address_result = result?.address || {};
    const verdict = result?.verdict || {};
    const components = address_result?.addressComponents || [];

    // Build standardized address
    const streetNumber = components.find((c: any) => 
      c.componentType === 'street_number')?.componentName?.text || '';
    const route = components.find((c: any) => 
      c.componentType === 'route')?.componentName?.text || '';
    const subpremise = components.find((c: any) => 
      c.componentType === 'subpremise')?.componentName?.text;
    const locality = components.find((c: any) => 
      c.componentType === 'locality')?.componentName?.text || address.city;
    const adminArea = components.find((c: any) => 
      c.componentType === 'administrative_area_level_1')?.componentName?.text || address.state;
    const postalCode = components.find((c: any) => 
      c.componentType === 'postal_code')?.componentName?.text || address.zip;
    const postalCodeSuffix = components.find((c: any) => 
      c.componentType === 'postal_code_suffix')?.componentName?.text;

    // Collect corrections
    const corrections: string[] = [];
    components.forEach((comp: any) => {
      if (comp.replaced?.text) {
        corrections.push(`Corrected ${comp.componentType}: "${comp.replaced.text}" → "${comp.componentName.text}"`);
      }
      if (comp.spellCorrected) {
        corrections.push(`Spell corrected: ${comp.componentName.text}`);
      }
    });

    // Build line1 in USPS format
    let line1 = `${streetNumber} ${route}`.toUpperCase().trim();
    if (subpremise) {
      line1 += ` ${subpremise.toUpperCase()}`;
    }

    const standardized: USPSStandardized = {
      line1: line1 || address.line1.toUpperCase(),
      line2: undefined, // USPS format typically combines
      city: locality.toUpperCase(),
      state: adminArea.toUpperCase(),
      zip5: postalCode.substring(0, 5),
      zip4: postalCodeSuffix || undefined,
      deliveryPoint: uspsData.dpvFootnote || undefined,
    };

    // Determine DPV match
    let dpvMatch: 'Y' | 'N' | 'D' | 'S' = 'N';
    const dpvConfirmation = uspsData.dpvConfirmation;
    if (dpvConfirmation === 'Y') dpvMatch = 'Y';
    else if (dpvConfirmation === 'S') dpvMatch = 'S';
    else if (dpvConfirmation === 'D') dpvMatch = 'D';

    // Residential indicator
    let residentialIndicator: 'Y' | 'N' | 'U' = 'U';
    if (uspsData.carrierRoute) {
      // R = residential, C = city, H = highway contract, B = PO Box
      if (uspsData.carrierRoute.startsWith('R')) residentialIndicator = 'Y';
      else if (uspsData.carrierRoute.startsWith('C')) residentialIndicator = 'N';
    }

    const response: USPSValidationResponse = {
      valid: verdict.addressComplete === true || verdict.validationGranularity === 'PREMISE',
      standardized,
      corrections,
      deliverable: dpvMatch === 'Y' || dpvMatch === 'S',
      residentialIndicator,
      dpvMatch,
      traceId,
      requestCost: 0.01, // Google Address Validation cost
      cacheHit: false,
    };

    // Cache the result (30 days)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('api_cache_universal').upsert({
      cache_key: cacheKey,
      provider: 'google',
      endpoint: 'address-validation',
      response: response,
      expires_at: expiresAt,
    }, { onConflict: 'cache_key' });

    // Log API call
    await supabase.from('api_logs').insert({
      source: 'validate-address-usps',
      endpoint: 'google-address-validation',
      duration_ms: duration,
      success: true,
      cache_key: cacheKey,
    });

    console.log(`[${traceId}] Validation complete: valid=${response.valid}, dpv=${dpvMatch} in ${duration}ms`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[${traceId}] Error:`, error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', traceId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
