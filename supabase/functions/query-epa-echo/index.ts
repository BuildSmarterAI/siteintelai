import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// EPA ECHO All-Programs Facility Search API
const EPA_ECHO_URL = "https://echodata.epa.gov/echo/echo_rest_services.get_facilities";

interface EPAFacilityRequest {
  lat: number;
  lng: number;
  radiusMiles?: number;
  programs?: ('air' | 'water' | 'rcra' | 'sdwa' | 'tri')[];
}

interface Facility {
  registryId: string;
  name: string;
  address: string;
  distanceMiles: number;
  programs: string[];
  violationStatus?: 'significant' | 'minor' | 'none';
  lastInspection?: string;
  latitude: number;
  longitude: number;
}

interface EPAFacilityResponse {
  facilities: Facility[];
  totalCount: number;
  riskIndicator: 'low' | 'moderate' | 'high';
  traceId: string;
  source: string;
  cacheHit: boolean;
}

function generateTraceId(): string {
  return crypto.randomUUID().slice(0, 8);
}

function calculateRisk(facilities: Facility[]): 'low' | 'moderate' | 'high' {
  const hasSignificantViolator = facilities.some(f => f.violationStatus === 'significant');
  const hasRCRAWithin500m = facilities.some(f => 
    f.programs.includes('RCRA') && f.distanceMiles < 0.31 // ~500m
  );
  
  if (hasSignificantViolator || hasRCRAWithin500m) return 'high';
  if (facilities.length > 5) return 'moderate';
  return 'low';
}

function parseViolationStatus(qncr: string | null): 'significant' | 'minor' | 'none' {
  if (!qncr) return 'none';
  const status = String(qncr).toUpperCase();
  if (status.includes('SNC') || status.includes('HPV')) return 'significant';
  if (status.includes('NON') || status.includes('VIO')) return 'minor';
  return 'none';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = generateTraceId();
  const startTime = Date.now();

  try {
    const body: EPAFacilityRequest = await req.json();
    const { lat, lng, radiusMiles = 1, programs } = body;
    
    console.log(`[TRACE:${traceId}] query-epa-echo: lat=${lat}, lng=${lng}, radius=${radiusMiles}mi`);
    
    if (!lat || !lng) {
      return new Response(JSON.stringify({ 
        error: 'lat and lng are required',
        traceId 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Check cache first
    const cacheKey = `epa:v1:${lat.toFixed(4)}:${lng.toFixed(4)}:${radiusMiles}`;
    const { data: cached } = await supabase
      .from('api_cache_universal')
      .select('response')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (cached?.response) {
      console.log(`[TRACE:${traceId}] Cache HIT`);
      return new Response(JSON.stringify({
        ...cached.response,
        traceId,
        cacheHit: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Query EPA ECHO
    const params = new URLSearchParams({
      output: 'JSON',
      p_lat: String(lat),
      p_long: String(lng),
      p_radius: String(radiusMiles),
      p_program: 'all',
    });

    console.log(`[TRACE:${traceId}] Calling EPA ECHO API`);
    const response = await fetch(`${EPA_ECHO_URL}?${params}`, {
      signal: AbortSignal.timeout(15000),
    });
    
    if (!response.ok) {
      console.error(`[TRACE:${traceId}] EPA ECHO API error: ${response.status}`);
      throw new Error(`EPA ECHO API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Parse results
    const rawFacilities = data.Results?.Facilities || [];
    const totalCount = data.Results?.QueryRows || rawFacilities.length;
    
    const facilities: Facility[] = rawFacilities.slice(0, 25).map((f: any) => ({
      registryId: f.RegistryId || f.FRSId || '',
      name: f.FacName || 'Unknown Facility',
      address: `${f.FacStreet || ''}, ${f.FacCity || ''}, ${f.FacState || ''} ${f.FacZip || ''}`.trim(),
      distanceMiles: parseFloat(f.Distance) || 0,
      programs: (f.FacProgramDesc || '').split(',').map((p: string) => p.trim()).filter(Boolean),
      violationStatus: parseViolationStatus(f.CurrSvFlag || f.CurrVioFlag),
      lastInspection: f.DaysSinceLastInspection ? 
        new Date(Date.now() - parseInt(f.DaysSinceLastInspection) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
        undefined,
      latitude: parseFloat(f.FacLat) || lat,
      longitude: parseFloat(f.FacLong) || lng,
    }));

    // Filter by program if specified
    const filteredFacilities = programs && programs.length > 0
      ? facilities.filter(f => 
          f.programs.some(p => 
            programs.some(prog => p.toLowerCase().includes(prog))
          )
        )
      : facilities;

    const riskIndicator = calculateRisk(filteredFacilities);

    const result: EPAFacilityResponse = {
      facilities: filteredFacilities,
      totalCount,
      riskIndicator,
      traceId,
      source: 'EPA_ECHO',
      cacheHit: false,
    };

    // Cache for 7 days (EPA data updates frequently)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('api_cache_universal').upsert({
      cache_key: cacheKey,
      provider: 'epa',
      endpoint: 'echo_facilities',
      response: result,
      expires_at: expiresAt,
    }, { onConflict: 'cache_key' });

    // Log API call
    const durationMs = Date.now() - startTime;
    await supabase.from('api_logs').insert({
      source: 'query-epa-echo',
      endpoint: 'EPA_ECHO',
      duration_ms: durationMs,
      success: true,
      cache_key: cacheKey,
    });

    console.log(`[TRACE:${traceId}] Found ${filteredFacilities.length} facilities, risk: ${riskIndicator}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[TRACE:${traceId}] Error:`, error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      traceId,
      facilities: [],
      totalCount: 0,
      riskIndicator: 'low',
      cacheHit: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
