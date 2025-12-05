/**
 * Unified Multi-County Parcel Fetch Edge Function
 * Supports: HCAD, MCAD, TCAD, BCAD, DCAD, TAD, WCAD, FBCAD
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// County configuration registry
const COUNTY_CONFIG: Record<string, {
  name: string;
  apiUrl: string;
  fields: string[];
  idField: string;
  ownerField: string;
  acreageField: string;
  addressField: string;
  valueField: string;
  maxRecords: number;
  srid: number;
}> = {
  harris: {
    name: 'Harris County',
    apiUrl: 'https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query',
    fields: ['OBJECTID', 'acct_num', 'owner_name_1', 'Acreage', 'site_zip', 'land_value', 'impr_value', 'SITUS_ADDRESS'],
    idField: 'acct_num',
    ownerField: 'owner_name_1',
    acreageField: 'Acreage',
    addressField: 'SITUS_ADDRESS',
    valueField: 'land_value',
    maxRecords: 1000,
    srid: 4326,
  },
  montgomery: {
    name: 'Montgomery County',
    apiUrl: 'https://gis.mctx.org/arcgis/rest/services/Parcels/MapServer/0/query',
    fields: ['OBJECTID', 'PROP_ID', 'OWNER_NAME', 'ACRES', 'SITUS_ADDR', 'MARKET_VAL'],
    idField: 'PROP_ID',
    ownerField: 'OWNER_NAME',
    acreageField: 'ACRES',
    addressField: 'SITUS_ADDR',
    valueField: 'MARKET_VAL',
    maxRecords: 1000,
    srid: 4326,
  },
  travis: {
    name: 'Travis County',
    apiUrl: 'https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/TCAD_public/FeatureServer/0/query',
    fields: ['OBJECTID', 'prop_id', 'owner_name', 'acres', 'situs_address', 'market_value'],
    idField: 'prop_id',
    ownerField: 'owner_name',
    acreageField: 'acres',
    addressField: 'situs_address',
    valueField: 'market_value',
    maxRecords: 2000,
    srid: 4326,
  },
  bexar: {
    name: 'Bexar County',
    apiUrl: 'https://gis.bexar.org/arcgis/rest/services/BCAD/Parcels/MapServer/0/query',
    fields: ['OBJECTID', 'PROP_ID', 'OWNER', 'ACRES', 'SITUS', 'MKT_VALUE'],
    idField: 'PROP_ID',
    ownerField: 'OWNER',
    acreageField: 'ACRES',
    addressField: 'SITUS',
    valueField: 'MKT_VALUE',
    maxRecords: 1000,
    srid: 4326,
  },
  dallas: {
    name: 'Dallas County',
    apiUrl: 'https://gis.dallascad.org/arcgis/rest/services/Parcels/MapServer/0/query',
    fields: ['OBJECTID', 'ACCT', 'OWNER_NAME', 'ACRES', 'ADDRESS', 'MKT_VALUE'],
    idField: 'ACCT',
    ownerField: 'OWNER_NAME',
    acreageField: 'ACRES',
    addressField: 'ADDRESS',
    valueField: 'MKT_VALUE',
    maxRecords: 1000,
    srid: 4326,
  },
  tarrant: {
    name: 'Tarrant County',
    apiUrl: 'https://gis.tad.org/arcgis/rest/services/TAD/Parcels/MapServer/0/query',
    fields: ['OBJECTID', 'ACCOUNT', 'OWNER', 'ACRES', 'SITUS_ADDR', 'MARKET'],
    idField: 'ACCOUNT',
    ownerField: 'OWNER',
    acreageField: 'ACRES',
    addressField: 'SITUS_ADDR',
    valueField: 'MARKET',
    maxRecords: 1000,
    srid: 4326,
  },
  williamson: {
    name: 'Williamson County',
    apiUrl: 'https://gis.wilco.org/arcgis/rest/services/Parcels/MapServer/0/query',
    fields: ['OBJECTID', 'PROP_ID', 'OWNER_NAME', 'ACRES', 'SITUS', 'MARKET_VAL'],
    idField: 'PROP_ID',
    ownerField: 'OWNER_NAME',
    acreageField: 'ACRES',
    addressField: 'SITUS',
    valueField: 'MARKET_VAL',
    maxRecords: 1000,
    srid: 4326,
  },
  fortbend: {
    name: 'Fort Bend County',
    apiUrl: 'https://gisweb.fbcad.org/arcgis/rest/services/Hosted/FBCAD_Public_Data/FeatureServer/0/query',
    fields: ['OBJECTID', 'propnumber', 'ownername', 'acres', 'situs', 'totalvalue'],
    idField: 'propnumber',
    ownerField: 'ownername',
    acreageField: 'acres',
    addressField: 'situs',
    valueField: 'totalvalue',
    maxRecords: 2000,
    srid: 4326,
  },
};

// County boundary boxes for auto-detection (approximate)
const COUNTY_BOUNDS: Record<string, { minLng: number; maxLng: number; minLat: number; maxLat: number }> = {
  harris: { minLng: -95.91, maxLng: -94.91, minLat: 29.49, maxLat: 30.17 },
  montgomery: { minLng: -95.86, maxLng: -95.07, minLat: 30.07, maxLat: 30.67 },
  travis: { minLng: -98.17, maxLng: -97.37, minLat: 30.07, maxLat: 30.63 },
  bexar: { minLng: -98.81, maxLng: -98.09, minLat: 29.17, maxLat: 29.73 },
  dallas: { minLng: -97.05, maxLng: -96.52, minLat: 32.55, maxLat: 33.02 },
  tarrant: { minLng: -97.55, maxLng: -96.98, minLat: 32.55, maxLat: 33.00 },
  williamson: { minLng: -98.05, maxLng: -97.28, minLat: 30.48, maxLat: 30.91 },
  fortbend: { minLng: -96.01, maxLng: -95.45, minLat: 29.35, maxLat: 29.82 },
};

function validateParcelId(parcelId: string): boolean {
  if (!parcelId || typeof parcelId !== 'string') return false;
  if (parcelId.length > 50) return false;
  const validPattern = /^[A-Za-z0-9\s\-]+$/;
  return validPattern.test(parcelId);
}

function validateBbox(bbox: unknown): bbox is [number, number, number, number] {
  if (!Array.isArray(bbox) || bbox.length !== 4) return false;
  if (!bbox.every(val => typeof val === 'number' && !isNaN(val))) return false;
  const [minLng, minLat, maxLng, maxLat] = bbox;
  if (minLat < -90 || minLat > 90 || maxLat < -90 || maxLat > 90) return false;
  if (minLng < -180 || minLng > 180 || maxLng < -180 || maxLng > 180) return false;
  if (minLng >= maxLng || minLat >= maxLat) return false;
  return true;
}

function detectCounty(lat: number, lng: number): string | null {
  for (const [county, bounds] of Object.entries(COUNTY_BOUNDS)) {
    if (lng >= bounds.minLng && lng <= bounds.maxLng && 
        lat >= bounds.minLat && lat <= bounds.maxLat) {
      return county;
    }
  }
  return null;
}

function detectCountyFromBbox(bbox: [number, number, number, number]): string | null {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;
  return detectCounty(centerLat, centerLng);
}

interface NormalizedParcelProperties {
  parcel_id: string;
  owner_name: string | null;
  acreage: number | null;
  situs_address: string | null;
  market_value: number | null;
  county: string;
  source: string;
  raw_properties: Record<string, unknown>;
}

function normalizeProperties(
  properties: Record<string, unknown>,
  config: typeof COUNTY_CONFIG[string],
  countyKey: string
): NormalizedParcelProperties {
  return {
    parcel_id: String(properties[config.idField] || ''),
    owner_name: properties[config.ownerField] as string | null,
    acreage: properties[config.acreageField] as number | null,
    situs_address: properties[config.addressField] as string | null,
    market_value: properties[config.valueField] as number | null,
    county: countyKey,
    source: config.name,
    raw_properties: properties,
  };
}

async function fetchFromCounty(
  config: typeof COUNTY_CONFIG[string],
  countyKey: string,
  params: { bbox?: [number, number, number, number]; parcelId?: string; lat?: number; lng?: number }
): Promise<{ type: string; features: Array<{ type: string; geometry: unknown; properties: NormalizedParcelProperties }> }> {
  const queryParams = new URLSearchParams();
  
  if (params.parcelId) {
    queryParams.set('where', `${config.idField}='${params.parcelId}'`);
  } else if (params.lat !== undefined && params.lng !== undefined) {
    queryParams.set('geometry', `${params.lng},${params.lat}`);
    queryParams.set('geometryType', 'esriGeometryPoint');
    queryParams.set('spatialRel', 'esriSpatialRelWithin');
  } else if (params.bbox) {
    const [minLng, minLat, maxLng, maxLat] = params.bbox;
    queryParams.set('geometry', `${minLng},${minLat},${maxLng},${maxLat}`);
    queryParams.set('geometryType', 'esriGeometryEnvelope');
    queryParams.set('spatialRel', 'esriSpatialRelIntersects');
  }
  
  queryParams.set('outFields', config.fields.join(','));
  queryParams.set('inSR', '4326');
  queryParams.set('outSR', '4326');
  queryParams.set('returnGeometry', 'true');
  queryParams.set('resultRecordCount', String(Math.min(500, config.maxRecords)));
  queryParams.set('f', 'geojson');
  
  const url = `${config.apiUrl}?${queryParams.toString()}`;
  console.log(`[fetch-parcels] Querying ${config.name}:`, url);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    console.error(`[fetch-parcels] ${config.name} returned ${response.status}`);
    return { type: 'FeatureCollection', features: [] };
  }
  
  const data = await response.json();
  
  // Normalize features
  const normalizedFeatures = (data.features || []).map((feature: { type: string; geometry: unknown; properties: Record<string, unknown> }) => ({
    type: 'Feature',
    geometry: feature.geometry,
    properties: normalizeProperties(feature.properties, config, countyKey),
  }));
  
  console.log(`[fetch-parcels] ${config.name}: Found ${normalizedFeatures.length} parcels`);
  
  return {
    type: 'FeatureCollection',
    features: normalizedFeatures,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { bbox, zoom, parcelId, lat, lng, county } = body;
    
    console.log('[fetch-parcels] Request:', { bbox, zoom, parcelId, lat, lng, county });

    // Determine which county to query
    let targetCounty = county?.toLowerCase();
    
    if (!targetCounty) {
      if (lat !== undefined && lng !== undefined) {
        targetCounty = detectCounty(lat, lng);
      } else if (bbox && validateBbox(bbox)) {
        targetCounty = detectCountyFromBbox(bbox);
      }
    }

    // If searching by parcel ID
    if (parcelId) {
      if (!validateParcelId(parcelId)) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid parcel ID format',
            type: 'FeatureCollection', 
            features: [] 
          }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If county specified, query only that county
      if (targetCounty && COUNTY_CONFIG[targetCounty]) {
        const config = COUNTY_CONFIG[targetCounty];
        const result = await fetchFromCounty(config, targetCounty, { parcelId });
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Otherwise, try all counties (starting with Harris as most common)
      const countyOrder = ['harris', 'fortbend', 'montgomery', 'travis', 'dallas', 'tarrant', 'bexar', 'williamson'];
      for (const countyKey of countyOrder) {
        const config = COUNTY_CONFIG[countyKey];
        const result = await fetchFromCounty(config, countyKey, { parcelId });
        if (result.features.length > 0) {
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(JSON.stringify({ type: 'FeatureCollection', features: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Point-in-parcel query
    if (lat !== undefined && lng !== undefined) {
      if (!targetCounty || !COUNTY_CONFIG[targetCounty]) {
        return new Response(
          JSON.stringify({ 
            error: 'Could not determine county for coordinates',
            type: 'FeatureCollection', 
            features: [] 
          }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const config = COUNTY_CONFIG[targetCounty];
      const result = await fetchFromCounty(config, targetCounty, { lat, lng });
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Bbox query - only at zoom 14+
    if (zoom !== undefined && zoom < 14) {
      return new Response(JSON.stringify({ type: 'FeatureCollection', features: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!bbox || !validateBbox(bbox)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid or missing bbox',
          type: 'FeatureCollection', 
          features: [] 
        }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!targetCounty || !COUNTY_CONFIG[targetCounty]) {
      return new Response(
        JSON.stringify({ 
          error: 'Could not determine county for bbox',
          type: 'FeatureCollection', 
          features: [] 
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = COUNTY_CONFIG[targetCounty];
    const result = await fetchFromCounty(config, targetCounty, { bbox });
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[fetch-parcels] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, type: 'FeatureCollection', features: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
