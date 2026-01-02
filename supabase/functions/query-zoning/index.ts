import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ZoningRequest {
  lat: number;
  lng: number;
  county?: string;
}

interface BaseZoning {
  code: string;
  description: string;
  permittedUses: string[];
  conditionalUses: string[];
  density?: number;
  setbacks?: {
    front: number;
    side: number;
    rear: number;
  };
  heightLimit?: number;
}

interface Overlay {
  code: string;
  name: string;
  restrictions: string[];
}

interface ZoningResponse {
  baseZoning: BaseZoning;
  overlays: Overlay[];
  jurisdiction: string;
  hasExtraterritorialJurisdiction: boolean;
  traceId: string;
  source: string;
  cacheHit: boolean;
}

function generateTraceId(): string {
  return crypto.randomUUID().slice(0, 8);
}

// Common zoning code mappings for Texas cities
const ZONING_DESCRIPTIONS: Record<string, { description: string; permittedUses: string[] }> = {
  'R-1': { description: 'Single-Family Residential', permittedUses: ['Single-family dwelling', 'Home occupation', 'Accessory buildings'] },
  'R-2': { description: 'Two-Family Residential', permittedUses: ['Two-family dwelling', 'Single-family dwelling', 'Home occupation'] },
  'R-3': { description: 'Multi-Family Residential', permittedUses: ['Multi-family dwelling', 'Apartments', 'Townhouses'] },
  'C-1': { description: 'Neighborhood Commercial', permittedUses: ['Retail sales', 'Personal services', 'Office', 'Restaurant'] },
  'C-2': { description: 'General Commercial', permittedUses: ['Retail', 'Office', 'Restaurant', 'Entertainment', 'Hotel'] },
  'C-3': { description: 'Heavy Commercial', permittedUses: ['Auto sales', 'Building materials', 'Wholesale', 'Light manufacturing'] },
  'I-1': { description: 'Light Industrial', permittedUses: ['Light manufacturing', 'Warehouse', 'Distribution', 'Office'] },
  'I-2': { description: 'Heavy Industrial', permittedUses: ['Heavy manufacturing', 'Processing', 'Storage', 'Warehouse'] },
  'MU': { description: 'Mixed Use', permittedUses: ['Residential', 'Commercial', 'Office', 'Retail'] },
  'PD': { description: 'Planned Development', permittedUses: ['As per development agreement'] },
  'AG': { description: 'Agricultural', permittedUses: ['Farming', 'Ranching', 'Single-family dwelling', 'Accessory farm structures'] },
};

async function queryZoningData(supabase: any, lat: number, lng: number): Promise<any> {
  // Try canonical zoning table first
  const { data: canonicalZoning } = await supabase
    .rpc('get_zoning_at_point', { p_lat: lat, p_lng: lng })
    .single();
  
  if (canonicalZoning) {
    return canonicalZoning;
  }

  // Fall back to application data
  const { data: appZoning } = await supabase
    .from('applications')
    .select('zoning_code, overlay_district, city, county')
    .not('zoning_code', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return appZoning;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = generateTraceId();
  const startTime = Date.now();

  try {
    const body: ZoningRequest = await req.json();
    const { lat, lng, county } = body;
    
    console.log(`[TRACE:${traceId}] query-zoning: lat=${lat}, lng=${lng}`);
    
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
    const cacheKey = `zoning:v1:${lat.toFixed(5)}:${lng.toFixed(5)}`;
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
        cacheHit: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Query zoning data
    const zoningData = await queryZoningData(supabase, lat, lng);
    
    // Build response
    let baseZoning: BaseZoning;
    const overlays: Overlay[] = [];
    let jurisdiction = county || 'Unknown';
    let hasETJ = false;

    if (zoningData?.zoning_code) {
      const code = zoningData.zoning_code.toUpperCase();
      const mapping = ZONING_DESCRIPTIONS[code] || ZONING_DESCRIPTIONS[code.split('-')[0]] || {
        description: 'Zoning District',
        permittedUses: [],
      };

      baseZoning = {
        code: zoningData.zoning_code,
        description: mapping.description,
        permittedUses: mapping.permittedUses,
        conditionalUses: [],
        density: zoningData.max_density || undefined,
        setbacks: zoningData.setbacks ? {
          front: zoningData.setbacks.front || 25,
          side: zoningData.setbacks.side || 10,
          rear: zoningData.setbacks.rear || 20,
        } : undefined,
        heightLimit: zoningData.max_height || undefined,
      };

      if (zoningData.overlay_district) {
        overlays.push({
          code: zoningData.overlay_district,
          name: zoningData.overlay_name || zoningData.overlay_district,
          restrictions: [],
        });
      }

      jurisdiction = zoningData.city || zoningData.jurisdiction || county || 'Unknown';
      hasETJ = zoningData.etj_provider !== null;
    } else {
      // Houston special case - no traditional zoning
      if (county?.toLowerCase() === 'harris' || zoningData?.city?.toLowerCase() === 'houston') {
        baseZoning = {
          code: 'NONE',
          description: 'No Zoning (Houston)',
          permittedUses: ['All uses subject to deed restrictions and building codes'],
          conditionalUses: [],
        };
        jurisdiction = 'City of Houston';
        
        // Houston overlays
        overlays.push({
          code: 'DEED',
          name: 'Deed Restrictions',
          restrictions: ['Subject to recorded deed restrictions - verify with title company'],
        });
      } else {
        baseZoning = {
          code: 'UNKNOWN',
          description: 'Zoning data unavailable',
          permittedUses: [],
          conditionalUses: [],
        };
      }
    }

    const result: ZoningResponse = {
      baseZoning,
      overlays,
      jurisdiction,
      hasExtraterritorialJurisdiction: hasETJ,
      traceId,
      source: 'canonical_zoning',
      cacheHit: false,
    };

    // Cache for 90 days (zoning changes infrequently)
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('api_cache_universal').upsert({
      cache_key: cacheKey,
      provider: 'internal',
      endpoint: 'zoning',
      response: result,
      expires_at: expiresAt,
    }, { onConflict: 'cache_key' });

    // Log API call
    const durationMs = Date.now() - startTime;
    await supabase.from('api_logs').insert({
      source: 'query-zoning',
      endpoint: 'canonical_zoning',
      duration_ms: durationMs,
      success: true,
      cache_key: cacheKey,
    });

    console.log(`[TRACE:${traceId}] Zoning: ${baseZoning.code} (${jurisdiction})`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[TRACE:${traceId}] Error:`, error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      traceId,
      baseZoning: { code: 'ERROR', description: 'Query failed', permittedUses: [], conditionalUses: [] },
      overlays: [],
      cacheHit: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
