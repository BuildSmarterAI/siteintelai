import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface APNLookupRequest {
  apn: string;
  county?: string;
}

interface ParcelResult {
  id: string;
  address: string;
  acreage: number;
  owner?: string;
  zoning?: string;
  county: string;
  lat: number;
  lng: number;
  geometry?: any;
}

// County-specific APN patterns and CAD endpoints
const COUNTY_CONFIG: Record<string, {
  pattern: RegExp;
  endpoint: string;
  idField: string;
  name: string;
}> = {
  harris: {
    pattern: /^\d{13}$|^\d{3}-\d{3}-\d{3}-\d{4}$/,
    endpoint: 'https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query',
    idField: 'ACCOUNT',
    name: 'Harris'
  },
  fort_bend: {
    pattern: /^\d{6,12}$/,
    endpoint: 'https://gisweb.fbcad.org/arcgis/rest/services/Hosted/FBCAD_Public_Data/FeatureServer/0/query',
    idField: 'propnumber',
    name: 'Fort Bend'
  },
  montgomery: {
    pattern: /^[A-Z]\d{6,10}$|^\d{8,12}$/,
    endpoint: 'https://gis.mctx.org/arcgis/rest/services/MCAD/MCAD_Parcels/MapServer/0/query',
    idField: 'PROP_ID',
    name: 'Montgomery'
  }
};

// Detect which county based on APN pattern
function detectCountyFromAPN(apn: string): string | null {
  const cleanAPN = apn.replace(/[^A-Za-z0-9]/g, '');
  
  for (const [county, config] of Object.entries(COUNTY_CONFIG)) {
    if (config.pattern.test(cleanAPN) || config.pattern.test(apn)) {
      return county;
    }
  }
  return null;
}

// Query a CAD ArcGIS endpoint
async function queryCADEndpoint(
  endpoint: string, 
  idField: string, 
  apn: string
): Promise<ParcelResult | null> {
  const cleanAPN = apn.replace(/-/g, '');
  
  const params = new URLSearchParams({
    where: `${idField}='${cleanAPN}' OR ${idField}='${apn}'`,
    outFields: '*',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'json'
  });

  try {
    console.log(`[lookup-parcel-by-apn] Querying ${endpoint}`);
    const response = await fetch(`${endpoint}?${params.toString()}`);
    
    if (!response.ok) {
      console.error(`[lookup-parcel-by-apn] CAD query failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      console.log('[lookup-parcel-by-apn] No features found');
      return null;
    }

    const feature = data.features[0];
    const props = feature.attributes;
    const geometry = feature.geometry;

    // Calculate centroid from geometry
    let lat = 0, lng = 0;
    if (geometry?.rings?.[0]) {
      const ring = geometry.rings[0];
      const sumLat = ring.reduce((sum: number, coord: number[]) => sum + coord[1], 0);
      const sumLng = ring.reduce((sum: number, coord: number[]) => sum + coord[0], 0);
      lat = sumLat / ring.length;
      lng = sumLng / ring.length;
    }

    return {
      id: props.ACCOUNT || props.propnumber || props.PROP_ID || apn,
      address: props.SITUS_ADDR || props.situs || props.SITUS_ADDRESS || 'Unknown Address',
      acreage: props.ACREAGE || props.acres || props.LAND_ACRES || 0,
      owner: props.OWNER_NAME || props.ownername || props.OWNER1,
      zoning: props.ZONING || props.zone_code,
      county: props.COUNTY || 'Unknown',
      lat,
      lng,
      geometry: geometry?.rings ? {
        type: 'Polygon',
        coordinates: geometry.rings
      } : undefined
    };
  } catch (error) {
    console.error('[lookup-parcel-by-apn] Query error:', error);
    return null;
  }
}

// Query canonical parcels table as fallback
async function queryCanonicalParcels(
  supabase: any,
  apn: string,
  county?: string
): Promise<ParcelResult | null> {
  try {
    let query = supabase
      .from('canonical_parcels')
      .select('*')
      .or(`apn.eq.${apn},source_parcel_id.eq.${apn}`);
    
    if (county) {
      query = query.ilike('jurisdiction', `%${county}%`);
    }

    const { data, error } = await query.limit(1).single();

    if (error || !data) {
      console.log('[lookup-parcel-by-apn] No canonical parcel found');
      return null;
    }

    return {
      id: data.apn || data.source_parcel_id,
      address: data.situs_address || 'Unknown Address',
      acreage: data.acreage || 0,
      owner: data.owner_name,
      zoning: data.land_use_code,
      county: data.jurisdiction,
      lat: data.centroid?.coordinates?.[1] || 0,
      lng: data.centroid?.coordinates?.[0] || 0,
      geometry: data.geom
    };
  } catch (error) {
    console.error('[lookup-parcel-by-apn] Canonical query error:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apn, county }: APNLookupRequest = await req.json();

    if (!apn || apn.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: 'Invalid APN provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[lookup-parcel-by-apn] Looking up APN: ${apn}, county: ${county || 'auto-detect'}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let result: ParcelResult | null = null;

    // Determine which county to search
    const targetCounty = county || detectCountyFromAPN(apn);

    if (targetCounty && COUNTY_CONFIG[targetCounty]) {
      // Query specific CAD endpoint
      const config = COUNTY_CONFIG[targetCounty];
      console.log(`[lookup-parcel-by-apn] Querying ${config.name} County CAD`);
      result = await queryCADEndpoint(config.endpoint, config.idField, apn);
      
      if (result) {
        result.county = config.name;
      }
    }

    // If no specific county or CAD query failed, try all counties
    if (!result && !county) {
      for (const [countyKey, config] of Object.entries(COUNTY_CONFIG)) {
        console.log(`[lookup-parcel-by-apn] Trying ${config.name} County`);
        result = await queryCADEndpoint(config.endpoint, config.idField, apn);
        if (result) {
          result.county = config.name;
          break;
        }
      }
    }

    // Fallback to canonical parcels table
    if (!result) {
      console.log('[lookup-parcel-by-apn] Falling back to canonical parcels');
      result = await queryCanonicalParcels(supabase, apn, county);
    }

    // Log the lookup attempt
    await supabase.from('api_logs').insert({
      source: 'lookup-parcel-by-apn',
      endpoint: county ? `CAD-${county}` : 'auto-detect',
      success: !!result,
      duration_ms: 0,
      error_message: result ? null : 'No parcel found'
    }).catch(() => {}); // Don't fail if logging fails

    return new Response(
      JSON.stringify({ 
        parcel: result,
        searched_apn: apn,
        searched_county: targetCounty || 'all'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[lookup-parcel-by-apn] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
