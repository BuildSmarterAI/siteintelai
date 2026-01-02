/**
 * refresh-parcel-data - B-07: Refresh Stale Parcel Data
 * 
 * Re-fetches parcel data from authoritative CAD sources when cache is stale.
 * Returns diff of changes between old and new data.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RefreshParcelRequest {
  apn: string;
  county: string;
  forceRefresh?: boolean;
}

interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
}

interface RefreshParcelResponse {
  updated: boolean;
  changes: FieldChange[];
  dataTimestamp: string;
  source: string;
  stale: boolean;
  traceId: string;
  duration_ms: number;
}

// Generate 8-char trace ID
function generateTraceId(): string {
  return crypto.randomUUID().substring(0, 8);
}

// Staleness thresholds in days
const STALENESS_THRESHOLDS = {
  owner_value: 90,   // Owner and value data: 90 days
  geometry: 365,     // Geometry: 1 year
};

// County CAD endpoints
const COUNTY_ENDPOINTS: Record<string, { endpoint: string; idField: string }> = {
  harris: {
    endpoint: 'https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query',
    idField: 'ACCOUNT',
  },
  fort_bend: {
    endpoint: 'https://gisweb.fbcad.org/arcgis/rest/services/Hosted/FBCAD_Public_Data/FeatureServer/0/query',
    idField: 'propnumber',
  },
  montgomery: {
    endpoint: 'https://gis.mctx.org/arcgis/rest/services/MCAD/MCAD_Parcels/MapServer/0/query',
    idField: 'PROP_ID',
  },
  travis: {
    endpoint: 'https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/TCAD_Parcels_Public/FeatureServer/0/query',
    idField: 'PROP_ID',
  },
  bexar: {
    endpoint: 'https://gis.bcad.org/arcgis/rest/services/BCAD/Parcels/MapServer/0/query',
    idField: 'PROP_ID',
  },
  dallas: {
    endpoint: 'https://gis.dallascad.org/arcgis/rest/services/DCAD/Parcels/MapServer/0/query',
    idField: 'ACCOUNT_NUM',
  },
};

// Check if data is stale
function isStale(updatedAt: string | null, thresholdDays: number): boolean {
  if (!updatedAt) return true;
  const updated = new Date(updatedAt);
  const now = new Date();
  const diffDays = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > thresholdDays;
}

// Compare objects and return changes
function compareData(oldData: Record<string, any>, newData: Record<string, any>): FieldChange[] {
  const changes: FieldChange[] = [];
  const fieldsToCompare = [
    'owner_name', 'situs_address', 'acreage', 'market_value', 
    'land_value', 'improvement_value', 'land_use_code', 'tax_year'
  ];
  
  for (const field of fieldsToCompare) {
    const oldVal = oldData[field];
    const newVal = newData[field];
    
    // Normalize for comparison
    const oldNorm = oldVal === null || oldVal === undefined ? null : String(oldVal).trim();
    const newNorm = newVal === null || newVal === undefined ? null : String(newVal).trim();
    
    if (oldNorm !== newNorm) {
      changes.push({ field, oldValue: oldVal, newValue: newVal });
    }
  }
  
  return changes;
}

// Fetch fresh data from CAD endpoint
async function fetchFromCAD(
  county: string, 
  apn: string
): Promise<Record<string, any> | null> {
  const config = COUNTY_ENDPOINTS[county.toLowerCase()];
  if (!config) {
    console.log(`[refresh-parcel-data] No endpoint for county: ${county}`);
    return null;
  }

  const cleanAPN = apn.replace(/-/g, '');
  const params = new URLSearchParams({
    where: `${config.idField}='${cleanAPN}' OR ${config.idField}='${apn}'`,
    outFields: '*',
    returnGeometry: 'false',
    f: 'json',
  });

  try {
    const response = await fetch(`${config.endpoint}?${params.toString()}`);
    if (!response.ok) {
      console.error(`[refresh-parcel-data] CAD fetch failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data.features || data.features.length === 0) {
      return null;
    }

    const attrs = data.features[0].attributes;
    
    // Normalize to our schema
    return {
      owner_name: attrs.OWNER_NAME || attrs.ownername || attrs.OWNER1,
      situs_address: attrs.SITUS_ADDR || attrs.situs || attrs.SITUS_ADDRESS,
      acreage: attrs.ACREAGE || attrs.acres || attrs.LAND_ACRES,
      market_value: attrs.MARKET_VAL || attrs.totalvalue || attrs.TOTAL_VALUE,
      land_value: attrs.LAND_VAL || attrs.landvalue || attrs.LAND_VALUE,
      improvement_value: attrs.IMPRV_VAL || attrs.impvalue || attrs.IMPRV_VALUE,
      land_use_code: attrs.LAND_USE || attrs.land_use_code || attrs.USE_CODE,
      tax_year: attrs.TAX_YEAR || attrs.taxyear || new Date().getFullYear(),
    };
  } catch (error) {
    console.error(`[refresh-parcel-data] CAD fetch error:`, error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const traceId = generateTraceId();

  try {
    const { apn, county, forceRefresh = false }: RefreshParcelRequest = await req.json();

    if (!apn || !county) {
      return new Response(
        JSON.stringify({ error: 'APN and county are required', traceId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${traceId}] refresh-parcel-data: apn=${apn}, county=${county}, force=${forceRefresh}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get existing parcel data
    const { data: existing } = await supabase
      .from('canonical_parcels')
      .select('*')
      .eq('source_parcel_id', apn)
      .ilike('jurisdiction', `%${county}%`)
      .maybeSingle();

    const isDataStale = !existing || isStale(existing?.updated_at, STALENESS_THRESHOLDS.owner_value);

    // If not stale and not forced, return without refresh
    if (!forceRefresh && !isDataStale) {
      console.log(`[${traceId}] Data is fresh, no refresh needed`);
      
      return new Response(JSON.stringify({
        updated: false,
        changes: [],
        dataTimestamp: existing.updated_at,
        source: 'canonical_parcels',
        stale: false,
        traceId,
        duration_ms: Date.now() - startTime,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch fresh data from CAD
    console.log(`[${traceId}] Fetching fresh data from CAD`);
    const freshData = await fetchFromCAD(county, apn);

    if (!freshData) {
      console.log(`[${traceId}] CAD source unavailable, returning stale data`);
      
      return new Response(JSON.stringify({
        updated: false,
        changes: [],
        dataTimestamp: existing?.updated_at || null,
        source: 'canonical_parcels',
        stale: true,
        sourceUnavailable: true,
        traceId,
        duration_ms: Date.now() - startTime,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Compare and calculate changes
    const changes = existing ? compareData(existing, freshData) : [];
    
    // Flag large value changes for review
    const valueFlagged = changes.some(c => {
      if (!['market_value', 'land_value'].includes(c.field)) return false;
      if (!c.oldValue || !c.newValue) return false;
      const oldNum = Number(c.oldValue);
      const newNum = Number(c.newValue);
      if (isNaN(oldNum) || isNaN(newNum) || oldNum === 0) return false;
      const pctChange = Math.abs((newNum - oldNum) / oldNum);
      return pctChange > 0.2; // >20% change
    });

    if (valueFlagged) {
      console.log(`[${traceId}] Large value change detected, flagging for review`);
    }

    // Update the parcel data
    const updatePayload = {
      ...freshData,
      updated_at: new Date().toISOString(),
      dataset_version: `CAD-${county}-${new Date().toISOString().substring(0, 10)}`,
    };

    if (existing) {
      await supabase
        .from('canonical_parcels')
        .update(updatePayload)
        .eq('source_parcel_id', apn);
    }

    const duration = Date.now() - startTime;

    // Log the refresh
    await supabase.from('api_logs').insert({
      source: 'refresh-parcel-data',
      endpoint: `CAD-${county}`,
      duration_ms: duration,
      success: true,
      cache_key: `trace:${traceId}`,
    }).catch(() => {});

    const response: RefreshParcelResponse = {
      updated: changes.length > 0,
      changes,
      dataTimestamp: new Date().toISOString(),
      source: `CAD-${county}`,
      stale: false,
      traceId,
      duration_ms: duration,
    };

    console.log(`[${traceId}] Refresh complete: ${changes.length} changes in ${duration}ms`);

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
