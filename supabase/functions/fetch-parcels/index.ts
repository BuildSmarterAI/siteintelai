/**
 * @deprecated This edge function is DEPRECATED and will be removed.
 * 
 * DATA MOAT ENFORCEMENT: Use internal vector tiles and query-canonical-parcel instead.
 * 
 * - For parcel DISPLAY: Use vector tiles from tiles.siteintel.ai via useVectorTileLayers hook
 * - For parcel DETAILS: Use query-canonical-parcel edge function to query canonical_parcels table
 * 
 * This function makes direct calls to external city GIS APIs (HCAD, FBCAD, MCAD, etc.)
 * which violates the data moat architecture. All GIS data should be served from
 * SiteIntel's internal infrastructure.
 * 
 * Migration path:
 * 1. MapLibreCanvas now uses useVectorTileLayers for parcel display
 * 2. Click handlers fetch details via query-canonical-parcel from canonical_parcels
 * 3. This function kept temporarily for backward compatibility
 * 
 * @see supabase/functions/query-canonical-parcel/index.ts
 * @see src/hooks/useCanonicalParcel.ts
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
    // HCAD uses separate address component fields, not SITUS_ADDRESS
    fields: ['OBJECTID', 'acct_num', 'owner_name_1', 'acreage_1', 'site_zip', 'land_value', 'impr_value', 'site_str_num', 'site_str_name', 'site_str_sfx', 'site_city'],
    idField: 'acct_num',
    ownerField: 'owner_name_1',
    acreageField: 'acreage_1',
    addressField: '', // Composite - built from site_str_* fields
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

// Texas bounding box for fallback detection
const TEXAS_BOUNDS = { minLng: -106.65, maxLng: -93.51, minLat: 25.84, maxLat: 36.50 };

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

function isInTexas(lat: number, lng: number): boolean {
  return lng >= TEXAS_BOUNDS.minLng && lng <= TEXAS_BOUNDS.maxLng &&
         lat >= TEXAS_BOUNDS.minLat && lat <= TEXAS_BOUNDS.maxLat;
}

function detectCounty(lat: number, lng: number): string | null {
  console.log(`[detect-county] Checking lat=${lat}, lng=${lng}`);
  
  for (const [county, bounds] of Object.entries(COUNTY_BOUNDS)) {
    const inLng = lng >= bounds.minLng && lng <= bounds.maxLng;
    const inLat = lat >= bounds.minLat && lat <= bounds.maxLat;
    
    if (inLng && inLat) {
      console.log(`[detect-county] ✓ Matched: ${county}`);
      return county;
    }
  }
  
  // Fallback: if in Texas but no specific county match, default to harris
  if (isInTexas(lat, lng)) {
    console.log(`[detect-county] No exact match, but in Texas. Defaulting to harris`);
    return 'harris';
  }
  
  console.log(`[detect-county] ✗ No county matched for coordinates`);
  return null;
}

function detectCountyFromBbox(bbox: [number, number, number, number]): string | null {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;
  console.log(`[detect-county-bbox] Bbox center: lat=${centerLat}, lng=${centerLng}`);
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
  // Build situs address - Harris County uses separate component fields
  let situsAddress: string | null = null;
  if (countyKey === 'harris') {
    // HCAD stores address in separate fields: site_str_num, site_str_name, site_str_sfx, site_city
    const parts = [
      properties.site_str_num,
      properties.site_str_name,
      properties.site_str_sfx,
      properties.site_city
    ].filter(Boolean);
    situsAddress = parts.length > 0 ? parts.join(' ') : null;
  } else {
    situsAddress = config.addressField ? (properties[config.addressField] as string | null) : null;
  }

  return {
    parcel_id: String(properties[config.idField] || ''),
    owner_name: properties[config.ownerField] as string | null,
    acreage: properties[config.acreageField] as number | null,
    situs_address: situsAddress,
    market_value: properties[config.valueField] as number | null,
    county: countyKey,
    source: config.name,
    raw_properties: properties,
  };
}

// Timeout wrapper for fetch calls
async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

async function fetchFromCounty(
  config: typeof COUNTY_CONFIG[string],
  countyKey: string,
  params: { bbox?: [number, number, number, number]; parcelId?: string; lat?: number; lng?: number }
): Promise<{ type: string; features: Array<{ type: string; geometry: unknown; properties: NormalizedParcelProperties }>; error?: string; errorCode?: string }> {
  const queryParams = new URLSearchParams();
  
  // CRITICAL: Always add a where clause - many ArcGIS servers require it
  if (params.parcelId) {
    queryParams.set('where', `${config.idField}='${params.parcelId}'`);
    console.log(`[fetch-parcels] Query type: parcelId lookup for ${params.parcelId}`);
  } else if (params.lat !== undefined && params.lng !== undefined) {
    queryParams.set('where', '1=1'); // Required for spatial-only queries
    // Use larger buffer to catch parcels when geocode lands on street
    const buffer = 0.001; // ~110 meters at Texas latitudes - catches nearby parcels
    const minLng = params.lng - buffer;
    const minLat = params.lat - buffer;
    const maxLng = params.lng + buffer;
    const maxLat = params.lat + buffer;
    queryParams.set('geometry', `${minLng},${minLat},${maxLng},${maxLat}`);
    queryParams.set('geometryType', 'esriGeometryEnvelope');
    queryParams.set('inSR', '4326');
    queryParams.set('spatialRel', 'esriSpatialRelIntersects');
    console.log(`[fetch-parcels] Query type: point-in-parcel via envelope (${params.lat}, ${params.lng})`);
  } else if (params.bbox) {
    const [minLng, minLat, maxLng, maxLat] = params.bbox;
    queryParams.set('where', '1=1'); // Required for spatial-only queries
    // Use simple comma-separated envelope format (more compatible with ArcGIS servers)
    queryParams.set('geometry', `${minLng},${minLat},${maxLng},${maxLat}`);
    queryParams.set('geometryType', 'esriGeometryEnvelope');
    queryParams.set('inSR', '4326');
    queryParams.set('spatialRel', 'esriSpatialRelIntersects');
    console.log(`[fetch-parcels] Query type: bbox query via envelope`);
  }
  
  queryParams.set('outFields', config.fields.join(','));
  queryParams.set('inSR', '4326');
  queryParams.set('outSR', '4326');
  queryParams.set('returnGeometry', 'true');
  queryParams.set('resultRecordCount', String(Math.min(500, config.maxRecords)));
  queryParams.set('f', 'geojson');
  
  const url = `${config.apiUrl}?${queryParams.toString()}`;
  console.log(`[fetch-parcels] Querying ${config.name}: ${url.substring(0, 250)}...`);
  
  try {
    const response = await fetchWithTimeout(url, 15000);
    
    console.log(`[fetch-parcels] ${config.name} response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[fetch-parcels] ${config.name} HTTP error: ${response.status} - ${errorText.substring(0, 200)}`);
      return { 
        type: 'FeatureCollection', 
        features: [],
        error: `${config.name} service returned ${response.status}`,
        errorCode: 'HTTP_ERROR'
      };
    }
    
    const data = await response.json();
    
    // Check for ArcGIS error response
    if (data.error) {
      console.error(`[fetch-parcels] ${config.name} ArcGIS error:`, JSON.stringify(data.error));
      return { 
        type: 'FeatureCollection', 
        features: [],
        error: `${config.name}: ${data.error.message || 'Query failed'}`,
        errorCode: 'ARCGIS_ERROR'
      };
    }
    
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
  } catch (error) {
    console.error(`[fetch-parcels] ${config.name} fetch error:`, error.message);
    return { 
      type: 'FeatureCollection', 
      features: [],
      error: error.message || 'Network error',
      errorCode: 'NETWORK_ERROR'
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { bbox, zoom, parcelId, lat, lng, county } = body;
    
    console.log('[fetch-parcels] === New Request ===');
    console.log('[fetch-parcels] Input:', JSON.stringify({ bbox, zoom, parcelId, lat, lng, county }));

    // Determine which county to query
    let targetCounty = county?.toLowerCase();
    
    if (!targetCounty) {
      if (lat !== undefined && lng !== undefined) {
        console.log('[fetch-parcels] Detecting county from lat/lng...');
        targetCounty = detectCounty(lat, lng);
      } else if (bbox && validateBbox(bbox)) {
        console.log('[fetch-parcels] Detecting county from bbox...');
        targetCounty = detectCountyFromBbox(bbox);
      }
    }
    
    console.log(`[fetch-parcels] Target county: ${targetCounty || 'NONE'}`);

    // If searching by parcel ID
    if (parcelId) {
      if (!validateParcelId(parcelId)) {
        console.log('[fetch-parcels] Invalid parcel ID format');
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
      console.log('[fetch-parcels] Searching all counties for parcel ID...');
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

      console.log('[fetch-parcels] Parcel ID not found in any county');
      return new Response(JSON.stringify({ type: 'FeatureCollection', features: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Point-in-parcel query
    if (lat !== undefined && lng !== undefined) {
      if (!targetCounty || !COUNTY_CONFIG[targetCounty]) {
        console.log(`[fetch-parcels] Could not determine county for point (${lat}, ${lng})`);
        return new Response(
          JSON.stringify({ 
            error: `Could not determine county for coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
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
      console.log(`[fetch-parcels] Zoom ${zoom} < 14, returning empty (zoom in to see parcels)`);
      return new Response(JSON.stringify({ 
        type: 'FeatureCollection', 
        features: [],
        message: 'Zoom in to see parcels (zoom 14+)'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!bbox || !validateBbox(bbox)) {
      console.log('[fetch-parcels] Invalid or missing bbox');
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
      console.log('[fetch-parcels] Could not determine county for bbox, trying harris as fallback');
      // Last resort fallback for bbox queries
      targetCounty = 'harris';
    }

    const config = COUNTY_CONFIG[targetCounty];
    const result = await fetchFromCounty(config, targetCounty, { bbox });
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[fetch-parcels] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message, type: 'FeatureCollection', features: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
