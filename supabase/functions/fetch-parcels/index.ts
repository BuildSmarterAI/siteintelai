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

// Generate a short trace ID for debugging
function generateTraceId(): string {
  return Math.random().toString(36).substring(2, 10);
}

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
    // Montgomery County GIS Hub - service may be unavailable, marked for monitoring
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
    // Updated: Travis County Tax Maps - verified working 2024
    apiUrl: 'https://taxmaps.traviscountytx.gov/arcgis/rest/services/Parcels/MapServer/0/query',
    fields: ['OBJECTID', 'prop_id', 'py_owner_name', 'Acres', 'situs_full_address', 'market_value'],
    idField: 'prop_id',
    ownerField: 'py_owner_name',
    acreageField: 'Acres',
    addressField: 'situs_full_address',
    valueField: 'market_value',
    maxRecords: 1000,
    srid: 4326,
  },
  bexar: {
    name: 'Bexar County',
    // Updated: Bexar County Maps - verified endpoint 2024
    apiUrl: 'https://maps.bexar.org/arcgis/rest/services/Parcels/MapServer/0/query',
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
    // Updated: City of Dallas GIS - verified working 2024
    apiUrl: 'https://egis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/MapServer/0/query',
    fields: ['OBJECTID', 'GIS_ACCT', 'OWNER_NAME', 'ACRES', 'SITUS_ADDR', 'MKT_VALUE'],
    idField: 'GIS_ACCT',
    ownerField: 'OWNER_NAME',
    acreageField: 'ACRES',
    addressField: 'SITUS_ADDR',
    valueField: 'MKT_VALUE',
    maxRecords: 1000,
    srid: 4326,
  },
  tarrant: {
    name: 'Tarrant County',
    // Updated: Tarrant County MapIt - verified working 2024
    apiUrl: 'https://mapit.tarrantcounty.com/arcgis/rest/services/Tax/TCProperty/MapServer/0/query',
    fields: ['OBJECTID', 'ACCOUNT', 'OWNER_NAME', 'LAND_ACRES', 'SITUS_ADDR', 'TOTAL_VALU'],
    idField: 'ACCOUNT',
    ownerField: 'OWNER_NAME',
    acreageField: 'LAND_ACRES',
    addressField: 'SITUS_ADDR',
    valueField: 'TOTAL_VALU',
    maxRecords: 1000,
    srid: 4326,
  },
  williamson: {
    name: 'Williamson County',
    // Updated: Williamson County GIS public service - verified working 2024
    apiUrl: 'https://gis.wilco.org/arcgis/rest/services/public/county_wcad_parcels/MapServer/0/query',
    fields: ['OBJECTID', 'geo_id', 'owner_name', 'acreage', 'situs_addr', 'market_value'],
    idField: 'geo_id',
    ownerField: 'owner_name',
    acreageField: 'acreage',
    addressField: 'situs_addr',
    valueField: 'market_value',
    maxRecords: 1000,
    srid: 4326,
  },
  fortbend: {
    name: 'Fort Bend County',
    apiUrl: 'https://gisweb.fbcad.org/arcgis/rest/services/Hosted/FBCAD_Public_Data/FeatureServer/0/query',
    // FBCAD does NOT expose OBJECTID; it uses `fid` as the object identifier field.
    fields: ['fid', 'propnumber', 'ownername', 'acres', 'situs', 'totalvalue'],
    idField: 'propnumber',
    ownerField: 'ownername',
    acreageField: 'acres',
    addressField: 'situs',
    valueField: 'totalvalue',
    maxRecords: 2000,
    srid: 4326,
  },
  brazoria: {
    name: 'Brazoria County',
    apiUrl: 'https://arcgis-web.brazoriacountytx.gov/arcgis/rest/services/general/Parcels/MapServer/1/query',
    fields: ['OBJECTID', 'prop_id', 'py_owner_name', 'legal_acreage', 'SITUS', 'appraised_val', 'situs_num', 'situs_street', 'situs_city', 'situs_zip'],
    idField: 'prop_id',
    ownerField: 'py_owner_name',
    acreageField: 'legal_acreage',
    addressField: 'SITUS',
    valueField: 'appraised_val',
    maxRecords: 1000,
    srid: 4326,
  },
  collin: {
    name: 'Collin County',
    apiUrl: 'https://maps.collincountytx.gov/server/rest/services/InteractiveMap/Appraisal_District/MapServer/1/query',
    fields: ['OBJECTID_1', 'PROP_ID', 'situs_disp', 'cert_asses', 'geo_id'],
    idField: 'PROP_ID',
    ownerField: '',
    acreageField: '',
    addressField: 'situs_disp',
    valueField: 'cert_asses',
    maxRecords: 1000,
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
  brazoria: { minLng: -95.85, maxLng: -95.05, minLat: 28.85, maxLat: 29.55 },
  collin: { minLng: -96.90, maxLng: -96.30, minLat: 33.00, maxLat: 33.50 },
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
  
  // No fallback to Harris - return null if no specific county match
  // This allows multi-county queries or prevents incorrect data
  console.log(`[detect-county] ✗ No county matched for coordinates (in Texas: ${isInTexas(lat, lng)})`);
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

// Helper: check if a point is inside a single polygon ring (ray casting)
function pointInRing(lat: number, lng: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// Helper: check if a point is inside a polygon (handles holes)
function pointInPolygon(lat: number, lng: number, polygon: number[][][]): boolean {
  // Check outer ring first
  if (!pointInRing(lat, lng, polygon[0])) {
    return false;
  }
  // Check if point is inside any hole (exclude it)
  for (let i = 1; i < polygon.length; i++) {
    if (pointInRing(lat, lng, polygon[i])) {
      return false; // Inside a hole
    }
  }
  return true;
}

// Helper: check if a point is inside a geometry (Polygon or MultiPolygon)
function pointInGeometry(lat: number, lng: number, geometry: { type: string; coordinates: unknown }): boolean {
  if (!geometry || !geometry.coordinates) return false;
  
  if (geometry.type === 'Polygon') {
    return pointInPolygon(lat, lng, geometry.coordinates as number[][][]);
  } else if (geometry.type === 'MultiPolygon') {
    const multiCoords = geometry.coordinates as number[][][][];
    for (const polygon of multiCoords) {
      if (pointInPolygon(lat, lng, polygon)) {
        return true;
      }
    }
  }
  return false;
}

// Helper: calculate centroid of a polygon
function getPolygonCentroid(polygon: number[][][]): { lat: number; lng: number } {
  const ring = polygon[0];
  let sumLng = 0, sumLat = 0;
  for (const coord of ring) {
    sumLng += coord[0];
    sumLat += coord[1];
  }
  return { lng: sumLng / ring.length, lat: sumLat / ring.length };
}

// Helper: calculate distance from point to geometry centroid
function distanceToGeometryCentroid(lat: number, lng: number, geometry: { type: string; coordinates: unknown }): number {
  if (!geometry || !geometry.coordinates) return Infinity;
  
  let centroid: { lat: number; lng: number };
  
  if (geometry.type === 'Polygon') {
    centroid = getPolygonCentroid(geometry.coordinates as number[][][]);
  } else if (geometry.type === 'MultiPolygon') {
    // Use centroid of first polygon
    const multiCoords = geometry.coordinates as number[][][][];
    if (multiCoords.length === 0) return Infinity;
    centroid = getPolygonCentroid(multiCoords[0]);
  } else {
    return Infinity;
  }
  
  // Simple Euclidean distance (sufficient for nearby parcels)
  return Math.sqrt(Math.pow(lng - centroid.lng, 2) + Math.pow(lat - centroid.lat, 2));
}

// =============================================
// ADDRESS PARSING AND MATCHING
// =============================================

interface ParsedAddress {
  streetNumber: string | null;
  streetName: string | null;
  normalized: string;
}

// Parse an address into street number and name components
function parseAddress(address: string | null): ParsedAddress {
  if (!address) {
    return { streetNumber: null, streetName: null, normalized: '' };
  }
  
  const normalized = address.toUpperCase().trim();
  
  // Match street number at start (e.g., "1234", "1234-A", "1234 1/2")
  const numberMatch = normalized.match(/^(\d+[\-A-Z]?(?:\s*\d+\/\d+)?)\s+(.+)/);
  
  if (numberMatch) {
    const streetNumber = numberMatch[1].trim();
    let streetName = numberMatch[2].trim();
    
    // Remove common suffixes for better matching (ST, AVE, BLVD, DR, etc.)
    streetName = streetName
      .replace(/\s+(ST|STREET|AVE|AVENUE|BLVD|BOULEVARD|DR|DRIVE|RD|ROAD|LN|LANE|CT|COURT|CIR|CIRCLE|PL|PLACE|WAY|PKWY|PARKWAY|TRL|TRAIL|HWY|HIGHWAY)\.?$/i, '')
      .trim();
    
    return { streetNumber, streetName, normalized };
  }
  
  return { streetNumber: null, streetName: normalized, normalized };
}

// Calculate address match score (0-100)
function calculateAddressMatchScore(inputAddress: string | null, parcelAddress: string | null): number {
  const input = parseAddress(inputAddress);
  const parcel = parseAddress(parcelAddress);
  
  let score = 0;
  
  // Street number match (highest weight - 60 points)
  if (input.streetNumber && parcel.streetNumber) {
    if (input.streetNumber === parcel.streetNumber) {
      score += 60;
    } else {
      // Partial match for close numbers (e.g., 1234 vs 1234-A)
      const inputNum = parseInt(input.streetNumber, 10);
      const parcelNum = parseInt(parcel.streetNumber, 10);
      if (!isNaN(inputNum) && !isNaN(parcelNum) && inputNum === parcelNum) {
        score += 50;
      }
    }
  }
  
  // Street name match (medium weight - 40 points)
  if (input.streetName && parcel.streetName) {
    if (input.streetName === parcel.streetName) {
      score += 40;
    } else if (parcel.streetName.includes(input.streetName) || input.streetName.includes(parcel.streetName)) {
      score += 25; // Partial street name match
    } else {
      // Check for common abbreviations / variations
      const inputWords = input.streetName.split(/\s+/);
      const parcelWords = parcel.streetName.split(/\s+/);
      const matchingWords = inputWords.filter(w => parcelWords.includes(w));
      if (matchingWords.length > 0) {
        score += Math.min(20, matchingWords.length * 10);
      }
    }
  }
  
  return score;
}

// Resolution trace for debugging
interface ResolutionTrace {
  traceId: string;
  inputAddress: string | null;
  geocodeLat: number;
  geocodeLng: number;
  county: string;
  pointInPolygonHit: boolean;
  fallbackUsed: boolean;
  candidateCount: number;
  selectedParcelId: string | null;
  selectionReason: 'contains_point' | 'address_match' | 'closest_centroid' | 'only_candidate' | 'multiple_returned';
  addressMatchScores: Array<{ parcelId: string; score: number }>;
}

interface ParcelFeature {
  type: string;
  geometry: { type: string; coordinates: unknown };
  properties: NormalizedParcelProperties;
}

async function fetchFromCounty(
  config: typeof COUNTY_CONFIG[string],
  countyKey: string,
  params: { 
    bbox?: [number, number, number, number]; 
    parcelId?: string; 
    lat?: number; 
    lng?: number;
    inputAddress?: string; // For address-aware ranking
  },
  traceId: string
): Promise<{ 
  type: string; 
  features: ParcelFeature[]; 
  error?: string; 
  errorCode?: string;
  resolution_trace?: ResolutionTrace;
}> {
  const queryParams = new URLSearchParams();
  
  const isPointQuery = params.lat !== undefined && params.lng !== undefined && !params.bbox && !params.parcelId;
  
  // Initialize trace for point queries
  let trace: ResolutionTrace | undefined;
  if (isPointQuery) {
    trace = {
      traceId,
      inputAddress: params.inputAddress || null,
      geocodeLat: params.lat!,
      geocodeLng: params.lng!,
      county: countyKey,
      pointInPolygonHit: false,
      fallbackUsed: false,
      candidateCount: 0,
      selectedParcelId: null,
      selectionReason: 'only_candidate',
      addressMatchScores: [],
    };
  }
  
  // CRITICAL: Always add a where clause - many ArcGIS servers require it
  if (params.parcelId) {
    queryParams.set('where', `${config.idField}='${params.parcelId}'`);
    console.log(`[TRACE:${traceId}] Query type: parcelId lookup for ${params.parcelId}`);
  } else if (isPointQuery) {
    queryParams.set('where', '1=1'); // Required for spatial-only queries
    // Use TRUE point-in-polygon query first (no buffer)
    queryParams.set('geometry', `${params.lng},${params.lat}`);
    queryParams.set('geometryType', 'esriGeometryPoint');
    queryParams.set('inSR', '4326');
    queryParams.set('spatialRel', 'esriSpatialRelWithin');
    console.log(`[TRACE:${traceId}] Query type: TRUE point-in-parcel (${params.lat}, ${params.lng})`);
  } else if (params.bbox) {
    const [minLng, minLat, maxLng, maxLat] = params.bbox;
    queryParams.set('where', '1=1'); // Required for spatial-only queries
    // Use simple comma-separated envelope format (more compatible with ArcGIS servers)
    queryParams.set('geometry', `${minLng},${minLat},${maxLng},${maxLat}`);
    queryParams.set('geometryType', 'esriGeometryEnvelope');
    queryParams.set('inSR', '4326');
    queryParams.set('spatialRel', 'esriSpatialRelIntersects');
    console.log(`[TRACE:${traceId}] Query type: bbox query via envelope`);
  }
  
  queryParams.set('outFields', config.fields.join(','));
  queryParams.set('inSR', '4326');
  queryParams.set('outSR', '4326');
  queryParams.set('returnGeometry', 'true');
  queryParams.set('resultRecordCount', String(Math.min(500, config.maxRecords)));
  queryParams.set('f', 'geojson');
  
  const url = `${config.apiUrl}?${queryParams.toString()}`;
  console.log(`[TRACE:${traceId}] Querying ${config.name}: ${url.substring(0, 250)}...`);
  
  try {
    let response = await fetchWithTimeout(url, 15000);
    
    console.log(`[TRACE:${traceId}] ${config.name} response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[TRACE:${traceId}] ${config.name} HTTP error: ${response.status} - ${errorText.substring(0, 200)}`);
      return { 
        type: 'FeatureCollection', 
        features: [],
        error: `${config.name} service returned ${response.status}`,
        errorCode: 'HTTP_ERROR',
        resolution_trace: trace,
      };
    }
    
    let data = await response.json();
    
    // Check for ArcGIS error response
    if (data.error) {
      console.error(`[TRACE:${traceId}] ${config.name} ArcGIS error:`, JSON.stringify(data.error));
      return { 
        type: 'FeatureCollection', 
        features: [],
        error: `${config.name}: ${data.error.message || 'Query failed'}`,
        errorCode: 'ARCGIS_ERROR',
        resolution_trace: trace,
      };
    }
    
    const initialFeatureCount = data.features?.length || 0;
    
    // FALLBACK: If point query returned 0 features (geocode might be on street), use small envelope
    if (isPointQuery && initialFeatureCount === 0) {
      console.log(`[TRACE:${traceId}] Point query returned 0 features, trying small envelope fallback...`);
      
      if (trace) {
        trace.pointInPolygonHit = false;
        trace.fallbackUsed = true;
      }
      
      const fallbackParams = new URLSearchParams();
      fallbackParams.set('where', '1=1');
      // Small buffer: ~25 meters (catches nearby parcels when point lands on street)
      const buffer = 0.00025;
      fallbackParams.set('geometry', `${params.lng! - buffer},${params.lat! - buffer},${params.lng! + buffer},${params.lat! + buffer}`);
      fallbackParams.set('geometryType', 'esriGeometryEnvelope');
      fallbackParams.set('inSR', '4326');
      fallbackParams.set('spatialRel', 'esriSpatialRelIntersects');
      fallbackParams.set('outFields', config.fields.join(','));
      fallbackParams.set('outSR', '4326');
      fallbackParams.set('returnGeometry', 'true');
      fallbackParams.set('resultRecordCount', '10'); // Limit fallback results
      fallbackParams.set('f', 'geojson');
      
      const fallbackUrl = `${config.apiUrl}?${fallbackParams.toString()}`;
      console.log(`[TRACE:${traceId}] Fallback query: ${fallbackUrl.substring(0, 250)}...`);
      
      response = await fetchWithTimeout(fallbackUrl, 15000);
      if (response.ok) {
        data = await response.json();
        console.log(`[TRACE:${traceId}] Fallback returned ${data.features?.length || 0} features`);
      }
    } else if (isPointQuery && initialFeatureCount > 0 && trace) {
      trace.pointInPolygonHit = true;
    }
    
    // Normalize features
    let normalizedFeatures: ParcelFeature[] = (data.features || []).map((feature: { type: string; geometry: { type: string; coordinates: unknown }; properties: Record<string, unknown> }) => ({
      type: 'Feature',
      geometry: feature.geometry,
      properties: normalizeProperties(feature.properties, config, countyKey),
    }));
    
    if (trace) {
      trace.candidateCount = normalizedFeatures.length;
    }
    
    // POST-PROCESSING: If point query returned multiple features, use ADDRESS-AWARE ranking
    if (isPointQuery && normalizedFeatures.length > 1) {
      console.log(`[TRACE:${traceId}] Multiple parcels (${normalizedFeatures.length}) found, applying address-aware ranking...`);
      
      // Calculate address match scores for each candidate
      const scoredFeatures = normalizedFeatures.map(f => {
        const addressScore = calculateAddressMatchScore(params.inputAddress || null, f.properties.situs_address);
        const containsPoint = pointInGeometry(params.lat!, params.lng!, f.geometry);
        const centroidDist = distanceToGeometryCentroid(params.lat!, params.lng!, f.geometry);
        
        return {
          feature: f,
          addressScore,
          containsPoint,
          centroidDist,
        };
      });
      
      // Log all candidates with scores
      console.log(`[TRACE:${traceId}] Candidate scores:`);
      for (const sf of scoredFeatures) {
        console.log(`  - ${sf.feature.properties.parcel_id}: addressScore=${sf.addressScore}, containsPoint=${sf.containsPoint}, centroidDist=${sf.centroidDist.toFixed(6)}, situs="${sf.feature.properties.situs_address}"`);
      }
      
      if (trace) {
        trace.addressMatchScores = scoredFeatures.map(sf => ({
          parcelId: sf.feature.properties.parcel_id,
          score: sf.addressScore,
        }));
      }
      
      // 1. First priority: parcel that contains the point AND has good address match
      const containingWithGoodAddress = scoredFeatures.find(sf => sf.containsPoint && sf.addressScore >= 50);
      if (containingWithGoodAddress) {
        console.log(`[TRACE:${traceId}] Selected parcel ${containingWithGoodAddress.feature.properties.parcel_id}: contains point AND address match (score=${containingWithGoodAddress.addressScore})`);
        if (trace) {
          trace.selectedParcelId = containingWithGoodAddress.feature.properties.parcel_id;
          trace.selectionReason = 'contains_point';
        }
        normalizedFeatures = [containingWithGoodAddress.feature];
      } else {
        // 2. Second priority: best address match (if strong enough)
        const bestAddressMatch = [...scoredFeatures].sort((a, b) => b.addressScore - a.addressScore)[0];
        if (bestAddressMatch && bestAddressMatch.addressScore >= 50) {
          console.log(`[TRACE:${traceId}] Selected parcel ${bestAddressMatch.feature.properties.parcel_id}: best address match (score=${bestAddressMatch.addressScore})`);
          if (trace) {
            trace.selectedParcelId = bestAddressMatch.feature.properties.parcel_id;
            trace.selectionReason = 'address_match';
          }
          normalizedFeatures = [bestAddressMatch.feature];
        } else {
          // 3. Third priority: any parcel that contains the point
          const anyContaining = scoredFeatures.find(sf => sf.containsPoint);
          if (anyContaining) {
            console.log(`[TRACE:${traceId}] Selected parcel ${anyContaining.feature.properties.parcel_id}: contains point (no strong address match)`);
            if (trace) {
              trace.selectedParcelId = anyContaining.feature.properties.parcel_id;
              trace.selectionReason = 'contains_point';
            }
            normalizedFeatures = [anyContaining.feature];
          } else {
            // 4. NO confident match - return ALL candidates for user selection
            // This is a key change: don't silently pick wrong parcel
            console.log(`[TRACE:${traceId}] ⚠️ No confident match! Returning all ${normalizedFeatures.length} candidates for user verification.`);
            if (trace) {
              trace.selectionReason = 'multiple_returned';
              trace.selectedParcelId = null;
            }
            // Keep all normalized features - let the UI handle disambiguation
          }
        }
      }
    } else if (isPointQuery && normalizedFeatures.length === 1) {
      console.log(`[TRACE:${traceId}] Single parcel found: ${normalizedFeatures[0].properties.parcel_id}`);
      if (trace) {
        trace.selectedParcelId = normalizedFeatures[0].properties.parcel_id;
        trace.selectionReason = 'only_candidate';
      }
    }
    
    console.log(`[TRACE:${traceId}] ${config.name}: Returning ${normalizedFeatures.length} parcel(s)`);
    
    return {
      type: 'FeatureCollection',
      features: normalizedFeatures,
      resolution_trace: trace,
    };
  } catch (error) {
    console.error(`[TRACE:${traceId}] ${config.name} fetch error:`, error.message);
    return { 
      type: 'FeatureCollection', 
      features: [],
      error: error.message || 'Network error',
      errorCode: 'NETWORK_ERROR',
      resolution_trace: trace,
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = generateTraceId();

  try {
    const body = await req.json();
    const { bbox, zoom, parcelId, lat, lng, county, inputAddress } = body;
    
    console.log(`[TRACE:${traceId}] === New Request ===`);
    console.log(`[TRACE:${traceId}] Input:`, JSON.stringify({ bbox, zoom, parcelId, lat, lng, county, inputAddress }));

    // Determine which county to query
    let targetCounty = county?.toLowerCase();
    
    if (!targetCounty) {
      if (lat !== undefined && lng !== undefined) {
        console.log(`[TRACE:${traceId}] Detecting county from lat/lng...`);
        targetCounty = detectCounty(lat, lng);
      } else if (bbox && validateBbox(bbox)) {
        console.log(`[TRACE:${traceId}] Detecting county from bbox...`);
        targetCounty = detectCountyFromBbox(bbox);
      }
    }
    
    console.log(`[TRACE:${traceId}] Target county: ${targetCounty || 'NONE'}`);

    // If searching by parcel ID
    if (parcelId) {
      if (!validateParcelId(parcelId)) {
        console.log(`[TRACE:${traceId}] Invalid parcel ID format`);
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
        const result = await fetchFromCounty(config, targetCounty, { parcelId }, traceId);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Otherwise, try all counties (starting with Harris as most common)
      console.log(`[TRACE:${traceId}] Searching all counties for parcel ID...`);
      const countyOrder = ['harris', 'fortbend', 'montgomery', 'travis', 'dallas', 'tarrant', 'bexar', 'williamson', 'brazoria', 'collin'];
      for (const countyKey of countyOrder) {
        const config = COUNTY_CONFIG[countyKey];
        const result = await fetchFromCounty(config, countyKey, { parcelId }, traceId);
        if (result.features.length > 0) {
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      console.log(`[TRACE:${traceId}] Parcel ID not found in any county`);
      return new Response(JSON.stringify({ type: 'FeatureCollection', features: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Point-in-parcel query
    if (lat !== undefined && lng !== undefined) {
      if (!targetCounty || !COUNTY_CONFIG[targetCounty]) {
        console.log(`[TRACE:${traceId}] Could not determine county for point (${lat}, ${lng})`);
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
      const result = await fetchFromCounty(config, targetCounty, { lat, lng, inputAddress }, traceId);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Bbox query - only at zoom 14+
    if (zoom !== undefined && zoom < 14) {
      console.log(`[TRACE:${traceId}] Zoom ${zoom} < 14, returning empty (zoom in to see parcels)`);
      return new Response(JSON.stringify({ 
        type: 'FeatureCollection', 
        features: [],
        message: 'Zoom in to see parcels (zoom 14+)'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!bbox || !validateBbox(bbox)) {
      console.log(`[TRACE:${traceId}] Invalid or missing bbox`);
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
      console.log(`[TRACE:${traceId}] Could not determine county for bbox, trying harris as fallback`);
      // Last resort fallback for bbox queries
      targetCounty = 'harris';
    }

    const config = COUNTY_CONFIG[targetCounty];
    const result = await fetchFromCounty(config, targetCounty, { bbox }, traceId);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[TRACE:${traceId}] Fatal error:`, error);
    return new Response(
      JSON.stringify({ error: error.message, type: 'FeatureCollection', features: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
