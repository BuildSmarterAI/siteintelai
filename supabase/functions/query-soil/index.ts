import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// USDA NRCS Web Soil Survey API
const SSURGO_URL = 'https://sdmdataaccess.nrcs.usda.gov/Tabular/SDMTabularService.asmx/RunQuery';

interface SoilRequest {
  lat: number;
  lng: number;
  parcelGeometry?: GeoJSON.Polygon;
}

interface MapUnit {
  symbol: string;
  name: string;
  description: string;
  areaPercentage: number;
}

interface SoilProperties {
  drainageClass: string;
  hydrologicGroup: string;
  shrinkSwell: string;
  floodingFrequency: string;
  pondingFrequency: string;
  depthToWaterTable: number;
}

interface EngineeringLimitations {
  shallowExcavations: string;
  dwellingsWithBasements: string;
  localRoads: string;
  septicTankAbsorption: string;
}

interface SoilResponse {
  mapUnits: MapUnit[];
  properties: SoilProperties;
  engineeringLimitations: EngineeringLimitations;
  overallBuildability: 'favorable' | 'moderate' | 'severe';
  traceId: string;
  source: string;
  cacheHit: boolean;
}

function generateTraceId(): string {
  return crypto.randomUUID().slice(0, 8);
}

function parseDrainageClass(rating: string | null): string {
  if (!rating) return 'unknown';
  const r = rating.toLowerCase();
  if (r.includes('excessively') || r.includes('somewhat excessively')) return 'excessively drained';
  if (r.includes('well')) return 'well drained';
  if (r.includes('moderately well')) return 'moderately well drained';
  if (r.includes('somewhat poorly')) return 'somewhat poorly drained';
  if (r.includes('poorly')) return 'poorly drained';
  if (r.includes('very poorly')) return 'very poorly drained';
  return rating;
}

function calculateBuildability(properties: SoilProperties, limitations: EngineeringLimitations): 'favorable' | 'moderate' | 'severe' {
  const severeIndicators = [
    properties.shrinkSwell === 'high',
    properties.drainageClass.includes('poorly'),
    properties.floodingFrequency !== 'none' && properties.floodingFrequency !== 'rare',
    limitations.dwellingsWithBasements === 'very limited',
    limitations.shallowExcavations === 'very limited',
  ];
  
  const moderateIndicators = [
    properties.shrinkSwell === 'moderate',
    properties.hydrologicGroup === 'C' || properties.hydrologicGroup === 'D',
    limitations.dwellingsWithBasements === 'somewhat limited',
    limitations.localRoads === 'somewhat limited',
  ];
  
  const severeCount = severeIndicators.filter(Boolean).length;
  const moderateCount = moderateIndicators.filter(Boolean).length;
  
  if (severeCount >= 2) return 'severe';
  if (severeCount >= 1 || moderateCount >= 2) return 'moderate';
  return 'favorable';
}

async function querySoilData(lat: number, lng: number): Promise<any> {
  // Build SSURGO query for soil data at point
  const query = `
    SELECT 
      musym, muname, mukind,
      drainagecl, hydgrp, hydclprs,
      flodfreqcl, pondfreqcl, wtdepannmin,
      coression, corsteel
    FROM mapunit AS mu
    INNER JOIN component AS co ON mu.mukey = co.mukey
    WHERE mu.mukey IN (
      SELECT * FROM SDA_Get_Mukey_from_intersection_with_WktWgs84(
        'POINT(${lng} ${lat})'
      )
    )
    AND co.majcompflag = 'Yes'
    LIMIT 5
  `;

  try {
    const response = await fetch(SSURGO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `Query=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error(`[query-soil] SSURGO API error: ${response.status}`);
      return null;
    }

    const text = await response.text();
    // Parse XML response
    const rowMatch = text.match(/<row>([\s\S]*?)<\/row>/g);
    if (!rowMatch) return null;

    return rowMatch.map(row => {
      const getValue = (tag: string) => {
        const match = row.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
        return match ? match[1].trim() : null;
      };

      return {
        musym: getValue('musym'),
        muname: getValue('muname'),
        mukind: getValue('mukind'),
        drainagecl: getValue('drainagecl'),
        hydgrp: getValue('hydgrp'),
        flodfreqcl: getValue('flodfreqcl'),
        pondfreqcl: getValue('pondfreqcl'),
        wtdepannmin: getValue('wtdepannmin'),
      };
    });
  } catch (err) {
    console.error(`[query-soil] SSURGO query failed:`, err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = generateTraceId();
  const startTime = Date.now();

  try {
    const body: SoilRequest = await req.json();
    const { lat, lng } = body;
    
    console.log(`[TRACE:${traceId}] query-soil: lat=${lat}, lng=${lng}`);
    
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
    
    // Check cache first (1 year TTL - soil data rarely changes)
    const cacheKey = `soil:v1:${lat.toFixed(5)}:${lng.toFixed(5)}`;
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

    // Query SSURGO
    const soilData = await querySoilData(lat, lng);

    // Build response with defaults if no data
    const mapUnits: MapUnit[] = [];
    let properties: SoilProperties = {
      drainageClass: 'unknown',
      hydrologicGroup: 'unknown',
      shrinkSwell: 'unknown',
      floodingFrequency: 'unknown',
      pondingFrequency: 'unknown',
      depthToWaterTable: -1,
    };

    let engineeringLimitations: EngineeringLimitations = {
      shallowExcavations: 'unknown',
      dwellingsWithBasements: 'unknown',
      localRoads: 'unknown',
      septicTankAbsorption: 'unknown',
    };

    if (soilData && soilData.length > 0) {
      // Process map units
      soilData.forEach((unit: any, index: number) => {
        if (unit.musym && unit.muname) {
          mapUnits.push({
            symbol: unit.musym,
            name: unit.muname,
            description: unit.mukind || '',
            areaPercentage: index === 0 ? 100 : 0, // Simplified - first is dominant
          });
        }
      });

      // Use first (dominant) component for properties
      const dominant = soilData[0];
      properties = {
        drainageClass: parseDrainageClass(dominant.drainagecl),
        hydrologicGroup: dominant.hydgrp || 'unknown',
        shrinkSwell: 'moderate', // Would need additional query for shrink-swell
        floodingFrequency: dominant.flodfreqcl || 'none',
        pondingFrequency: dominant.pondfreqcl || 'none',
        depthToWaterTable: parseInt(dominant.wtdepannmin) || -1,
      };

      // Infer engineering limitations from properties
      const isPoorlyDrained = properties.drainageClass.includes('poorly');
      const hasHighWaterTable = properties.depthToWaterTable > 0 && properties.depthToWaterTable < 24;
      const hasFloodRisk = properties.floodingFrequency !== 'none' && properties.floodingFrequency !== 'rare';

      engineeringLimitations = {
        shallowExcavations: hasHighWaterTable ? 'very limited' : isPoorlyDrained ? 'somewhat limited' : 'not limited',
        dwellingsWithBasements: hasHighWaterTable || hasFloodRisk ? 'very limited' : isPoorlyDrained ? 'somewhat limited' : 'not limited',
        localRoads: isPoorlyDrained ? 'somewhat limited' : 'not limited',
        septicTankAbsorption: isPoorlyDrained || hasHighWaterTable ? 'very limited' : 'not limited',
      };
    }

    const overallBuildability = calculateBuildability(properties, engineeringLimitations);

    const result: SoilResponse = {
      mapUnits,
      properties,
      engineeringLimitations,
      overallBuildability,
      traceId,
      source: 'USDA_SSURGO',
      cacheHit: false,
    };

    // Cache for 1 year
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('api_cache_universal').upsert({
      cache_key: cacheKey,
      provider: 'usda',
      endpoint: 'ssurgo',
      response: result,
      expires_at: expiresAt,
    }, { onConflict: 'cache_key' });

    // Log API call
    const durationMs = Date.now() - startTime;
    await supabase.from('api_logs').insert({
      source: 'query-soil',
      endpoint: 'USDA_SSURGO',
      duration_ms: durationMs,
      success: true,
      cache_key: cacheKey,
    });

    console.log(`[TRACE:${traceId}] Soil: ${mapUnits.length} units, buildability: ${overallBuildability}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[TRACE:${traceId}] Error:`, error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      traceId,
      mapUnits: [],
      overallBuildability: 'unknown',
      cacheHit: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
