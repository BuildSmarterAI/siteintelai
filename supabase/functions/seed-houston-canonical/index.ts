// deno-lint-ignore-file no-explicit-any
// Version: 1.0.1 - Deployed 2025-12-13
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Houston bounding box (approximate)
const HOUSTON_BBOX = {
  xmin: -95.8,
  ymin: 29.5,
  xmax: -95.0,
  ymax: 30.2,
};

// Transform functions for field mappings
const transformFunctions: Record<string, (val: any) => any> = {
  trim: (val) => typeof val === 'string' ? val.trim() : val,
  uppercase: (val) => typeof val === 'string' ? val.toUpperCase() : val,
  lowercase: (val) => typeof val === 'string' ? val.toLowerCase() : val,
  parse_int: (val) => {
    const num = parseInt(String(val), 10);
    return isNaN(num) ? null : num;
  },
  parse_float: (val) => {
    const num = parseFloat(String(val));
    return isNaN(num) ? null : num;
  },
  parse_bool: (val) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
      return ['true', 'yes', '1', 'y'].includes(val.toLowerCase());
    }
    return Boolean(val);
  },
  parse_date: (val) => {
    if (!val) return null;
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  },
  identity: (val) => val,
  sqft_to_acres: (val) => {
    const sqft = parseFloat(String(val));
    return isNaN(sqft) ? null : sqft / 43560;
  },
  // Map CCN status values to canonical enum
  ccn_status: (val) => {
    if (!val) return 'unknown';
    const s = String(val).toLowerCase().trim();
    if (s.includes('active') || s === 'a') return 'active';
    if (s.includes('inactive') || s === 'i') return 'inactive';
    if (s.includes('revoked') || s === 'r') return 'revoked';
    if (s.includes('proposed') || s === 'p') return 'proposed';
    return 'unknown';
  },
  // Map pipeline status values to canonical enum
  pipeline_status: (val) => {
    if (!val) return 'unknown';
    const s = String(val).toLowerCase().trim();
    if (s.includes('active') || s === 'a' || s.includes('in service')) return 'active';
    if (s.includes('abandon') || s === 'abn') return 'abandoned';
    if (s.includes('inactive') || s.includes('idle')) return 'inactive';
    if (s.includes('proposed') || s === 'p') return 'proposed';
    return 'unknown';
  },
  // Map TxDOT route prefix to roadway classification (FHWA functional class)
  route_prefix_to_class: (val) => {
    if (!val) return null;
    const prefix = String(val).toUpperCase().trim();
    // Principal/Minor Arterial
    if (['IH', 'US', 'PA', 'SH', 'SA', 'UA'].includes(prefix)) return 'arterial';
    // Major/Minor Collector
    if (['FM', 'RM', 'RR', 'FS', 'RS', 'UP'].includes(prefix)) return 'collector';
    // Local
    if (['CS', 'CR', 'PV', 'PR'].includes(prefix)) return 'local';
    return null;
  },
};

interface LayerConfig {
  layer_key: string;
  source_url: string;
  target_table: string;
  field_mappings: Array<{ source: string; target: string; transform?: string }>;
  constants: Record<string, any>;
  max_records?: number;
}

// Layer configurations with CORRECTED field mappings matching actual table columns
const LAYER_CONFIGS: LayerConfig[] = [
  {
    layer_key: 'houston_parcels',
    source_url: 'https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0',
    target_table: 'canonical_parcels',
    field_mappings: [
      // Field names from HCAD API are lowercase - mapped to canonical_parcels schema
      { source: 'acct_num', target: 'source_parcel_id', transform: 'trim' },
      { source: 'acct_num', target: 'apn', transform: 'trim' },
      { source: 'owner_name_1', target: 'owner_name', transform: 'uppercase' },
      { source: 'site_str_name', target: 'situs_address', transform: 'trim' },
      { source: 'land_sqft', target: 'acreage', transform: 'sqft_to_acres' },
      { source: 'state_class', target: 'land_use_code', transform: 'trim' },
      { source: 'site_city', target: 'city', transform: 'trim' },
      { source: 'site_zip', target: 'zip', transform: 'trim' },
    ],
    constants: { 
      jurisdiction: 'Harris County', 
      state: 'TX', 
      dataset_version: '2025_01',
      source_system: 'HCAD',
      source_agency: 'Harris County Appraisal District'
    },
    max_records: 5000, // Production batch size
  },
  {
    layer_key: 'houston_sewer_lines',
    // CORRECT Houston Water GIS Sewer Lines endpoint (no www, correct service path)
    source_url: 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWWastewaterLineIPS/MapServer/0',
    target_table: 'utilities_canonical',
    field_mappings: [
      // Field names from Houston Water GIS (check actual response)
      { source: 'OBJECTID', target: 'line_id', transform: 'trim' },
      { source: 'PIPE_SIZE', target: 'diameter', transform: 'parse_float' },
      { source: 'PIPE_MATERIAL', target: 'material', transform: 'uppercase' },
      { source: 'ASSETSTATUS', target: 'status', transform: 'lowercase' },
      { source: 'INSTALLDATE', target: 'install_date', transform: 'parse_date' },
      { source: 'Shape__Length', target: 'length_ft', transform: 'parse_float' },
    ],
    constants: { 
      jurisdiction: 'Houston', 
      utility_type: 'sewer', 
      diameter_unit: 'inches',
      source_dataset: 'houston_sewer_lines' 
    },
    max_records: 2000, // Increased for production
  },
  {
    layer_key: 'houston_water_lines',
    // CORRECT Houston Water GIS Water Lines endpoint (no www, correct service path)
    source_url: 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWWaterLineIPS/MapServer/0',
    target_table: 'utilities_canonical',
    field_mappings: [
      // Field names from Houston Water GIS (check actual response)
      { source: 'OBJECTID', target: 'line_id', transform: 'trim' },
      { source: 'PIPE_SIZE', target: 'diameter', transform: 'parse_float' },
      { source: 'PIPE_MATERIAL', target: 'material', transform: 'uppercase' },
      { source: 'PRESSURE_ZONE', target: 'pressure', transform: 'parse_float' },
      { source: 'ASSETSTATUS', target: 'status', transform: 'lowercase' },
      { source: 'Shape__Length', target: 'length_ft', transform: 'parse_float' },
    ],
    constants: { 
      jurisdiction: 'Houston', 
      utility_type: 'water',
      diameter_unit: 'inches',
      pressure_unit: 'psi',
      source_dataset: 'houston_water_lines' 
    },
    max_records: 2000, // Increased for production
  },
  {
    layer_key: 'fema_flood_zones',
    // Alternative: ESRI Living Atlas FEMA Flood Zones (better connectivity than hazards.fema.gov)
    source_url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Flood_Hazard_Reduced_Set_gdb/FeatureServer/0',
    target_table: 'fema_flood_canonical',
    field_mappings: [
      { source: 'FLD_ZONE', target: 'flood_zone', transform: 'uppercase' },
      { source: 'ZONE_SUBTY', target: 'flood_zone_subtype', transform: 'uppercase' },
      { source: 'STATIC_BFE', target: 'static_bfe', transform: 'parse_float' },
      { source: 'SFHA_TF', target: 'floodway_flag', transform: 'parse_bool' },
      { source: 'DFIRM_ID', target: 'panel_id', transform: 'trim' },
    ],
    constants: { 
      source_dataset: 'fema_flood_zones_esri', 
      state: 'TX', 
      county: 'Harris',
      bfe_unit: 'NAVD88'
    },
    max_records: 2000, // Increased for production
  },
  {
    layer_key: 'nwi_wetlands',
    // NWI Wetlands service - uses WETLAND_TYPE field
    source_url: 'https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0',
    target_table: 'wetlands_canonical',
    field_mappings: [
      // NWI uses WETLAND_TYPE as main classification
      { source: 'WETLAND_TYPE', target: 'wetland_code', transform: 'uppercase' },
      { source: 'WETLAND_TYPE', target: 'wetland_type', transform: 'trim' },
      { source: 'ACRES', target: 'area_acres', transform: 'parse_float' },
    ],
    constants: { source_dataset: 'nwi_wetlands' },
    max_records: 1500, // Increased for production
  },
  {
    layer_key: 'txdot_aadt',
    // TxDOT AADT Feature Service - CORRECTED field mappings
    source_url: 'https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_AADT/FeatureServer/0',
    target_table: 'transportation_canonical',
    field_mappings: [
      // FIXED: Use AADT_CUR (current AADT) instead of T_FLAG
      { source: 'AADT_CUR', target: 'aadt', transform: 'parse_int' },
      { source: 'YR', target: 'aadt_year', transform: 'parse_int' },
      { source: 'RTE_NM', target: 'road_name', transform: 'uppercase' },
      // NEW: Add route prefix for classification
      { source: 'RTE_PRFX', target: 'road_class', transform: 'route_prefix_to_class' },
      { source: 'RTE_ID', target: 'route_number', transform: 'trim' },
      // NEW: Truck percentage for freight analysis
      { source: 'T_PCT', target: 'truck_percent', transform: 'parse_float' },
      // NEW: K-factor for peak hour calculation
      { source: 'K_FLAG', target: 'k_factor', transform: 'parse_float' },
      // Direction flag for segment identification
      { source: 'DIR_FLAG', target: 'direction', transform: 'trim' },
    ],
    constants: { 
      source_dataset: 'txdot_aadt', 
      jurisdiction: 'TxDOT',
      county: 'Harris'
    },
    max_records: 3000, // Increased for production
  },
  // === NEW INFRASTRUCTURE LAYERS ===
  {
    layer_key: 'puct_ccn_water',
    // PUCT CCN Water Service Areas via Harris County GIS mirror
    source_url: 'https://www.gis.hctx.net/arcgishcpid/rest/services/State/PUC_CCN_Sewer_Water/MapServer/1',
    target_table: 'utilities_ccn_canonical',
    field_mappings: [
      { source: 'CCN_NO', target: 'ccn_number', transform: 'trim' },
      { source: 'UTILITY', target: 'utility_name', transform: 'trim' },
      { source: 'DBA_NAME', target: 'dba_name', transform: 'trim' },
      { source: 'COUNTY', target: 'county', transform: 'trim' },
      { source: 'STATUS', target: 'status', transform: 'ccn_status' },
      { source: 'OBJECTID', target: 'source_feature_id', transform: 'trim' },
    ],
    constants: { 
      ccn_type: 'water', 
      state: 'TX',
      source_system: 'PUCT_CCN',
      source_layer: 'CCN_Water_Service_Areas',
      accuracy_tier: 1,
      boundary_confidence: 90
    },
    max_records: 1000, // Increased for production
  },
  {
    layer_key: 'puct_ccn_sewer',
    // PUCT CCN Sewer Service Areas via Harris County GIS mirror
    source_url: 'https://www.gis.hctx.net/arcgishcpid/rest/services/State/PUC_CCN_Sewer_Water/MapServer/2',
    target_table: 'utilities_ccn_canonical',
    field_mappings: [
      { source: 'CCN_NO', target: 'ccn_number', transform: 'trim' },
      { source: 'UTILITY', target: 'utility_name', transform: 'trim' },
      { source: 'DBA_NAME', target: 'dba_name', transform: 'trim' },
      { source: 'COUNTY', target: 'county', transform: 'trim' },
      { source: 'STATUS', target: 'status', transform: 'ccn_status' },
      { source: 'OBJECTID', target: 'source_feature_id', transform: 'trim' },
    ],
    constants: { 
      ccn_type: 'sewer', 
      state: 'TX',
      source_system: 'PUCT_CCN',
      source_layer: 'CCN_Sewer_Service_Areas',
      accuracy_tier: 1,
      boundary_confidence: 90
    },
    max_records: 1000, // Increased for production
  },
  {
    layer_key: 'rrc_pipelines',
    // Texas RRC Pipelines via Harris County GIS mirror
    source_url: 'https://www.gis.hctx.net/arcgishcpid/rest/services/TXRRC/Pipelines/MapServer/0',
    target_table: 'pipelines_canonical',
    field_mappings: [
      { source: 'OPER_NM', target: 'operator_name', transform: 'trim' },
      { source: 'SYS_NM', target: 'pipeline_system_name', transform: 'trim' },
      { source: 'PLINE_ID', target: 'pipeline_segment_id', transform: 'trim' },
      { source: 'COMMODITY1', target: 'commodity_type', transform: 'lowercase' },
      { source: 'STATUS_CD', target: 'status', transform: 'pipeline_status' },
      { source: 'DIAMETER', target: 'nominal_diameter_in', transform: 'parse_float' },
      { source: 'INTERSTATE', target: 'jurisdiction', transform: 'trim' },
      { source: 'OBJECTID', target: 'source_feature_id', transform: 'trim' },
    ],
    constants: { 
      source_system: 'RRC_PIPELINES',
      source_layer: 'Pipelines',
      accuracy_tier: 2,
      alignment_confidence: 70,
      depth_confidence: 40
    },
    max_records: 2000, // Increased for production
  },
];

interface SeedResult {
  layer_key: string;
  success: boolean;
  records_fetched: number;
  records_inserted: number;
  records_failed: number;
  duration_ms: number;
  error?: string;
}

async function fetchArcGISFeatures(
  sourceUrl: string,
  bbox: typeof HOUSTON_BBOX,
  maxRecords: number
): Promise<any[]> {
  const allFeatures: any[] = [];
  let offset = 0;
  const batchSize = Math.min(200, maxRecords); // Smaller batches for reliability

  console.log(`[seed] Fetching from ${sourceUrl}`);

  while (allFeatures.length < maxRecords) {
    // Simpler query format that works with more ArcGIS servers
    const queryParams = new URLSearchParams({
      where: '1=1',
      geometry: `${bbox.xmin},${bbox.ymin},${bbox.xmax},${bbox.ymax}`,
      geometryType: 'esriGeometryEnvelope',
      inSR: '4326',
      outSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: '*',
      returnGeometry: 'true',
      f: 'geojson',
      resultOffset: String(offset),
      resultRecordCount: String(batchSize),
    });

    const queryUrl = `${sourceUrl}/query?${queryParams.toString()}`;

    try {
      console.log(`[seed] Fetching offset ${offset}: ${queryUrl.slice(0, 150)}...`);
      const response = await fetch(queryUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://buildsmarter.app/',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[seed] HTTP error ${response.status}: ${errorText.slice(0, 500)}`);
        break;
      }

      const data = await response.json();
      
      // Log raw response structure for debugging
      console.log(`[seed] Response keys: ${Object.keys(data).join(', ')}`);
      if (data.features && data.features.length > 0) {
        console.log(`[seed] Sample feature properties: ${Object.keys(data.features[0].properties || {}).join(', ')}`);
      }

      if (data.error) {
        console.error(`[seed] API error:`, JSON.stringify(data.error));
        break;
      }

      const features = data.features || [];
      console.log(`[seed] Batch at offset ${offset}: ${features.length} features`);

      if (features.length === 0) break;

      allFeatures.push(...features);
      offset += features.length;

      // If we got less than batch size, we're done
      if (features.length < batchSize) break;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 400));
    } catch (err) {
      console.error(`[seed] Fetch error:`, err);
      break;
    }
  }

  console.log(`[seed] Total features fetched: ${allFeatures.length}`);
  return allFeatures.slice(0, maxRecords);
}

function applyFieldMappings(
  feature: any,
  mappings: Array<{ source: string; target: string; transform?: string }>,
  constants: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const mapping of mappings) {
    const sourceValue = feature.properties?.[mapping.source];
    const transformFn = transformFunctions[mapping.transform || 'identity'];
    result[mapping.target] = transformFn(sourceValue);
  }

  for (const [key, value] of Object.entries(constants)) {
    result[key] = value;
  }

  return result;
}

// Convert GeoJSON geometry to WKT for PostGIS
function geometryToWKT(geometry: any): string | null {
  if (!geometry || !geometry.type) return null;

  try {
    switch (geometry.type) {
      case 'Point': {
        const [x, y] = geometry.coordinates;
        return `SRID=4326;POINT(${x} ${y})`;
      }
      case 'LineString': {
        const coords = geometry.coordinates.map((c: number[]) => `${c[0]} ${c[1]}`).join(', ');
        return `SRID=4326;LINESTRING(${coords})`;
      }
      case 'Polygon': {
        const rings = geometry.coordinates.map((ring: number[][]) => 
          '(' + ring.map((c: number[]) => `${c[0]} ${c[1]}`).join(', ') + ')'
        ).join(', ');
        return `SRID=4326;POLYGON(${rings})`;
      }
      case 'MultiPoint': {
        const points = geometry.coordinates.map((c: number[]) => `(${c[0]} ${c[1]})`).join(', ');
        return `SRID=4326;MULTIPOINT(${points})`;
      }
      case 'MultiLineString': {
        const lines = geometry.coordinates.map((line: number[][]) =>
          '(' + line.map((c: number[]) => `${c[0]} ${c[1]}`).join(', ') + ')'
        ).join(', ');
        return `SRID=4326;MULTILINESTRING(${lines})`;
      }
      case 'MultiPolygon': {
        const polygons = geometry.coordinates.map((poly: number[][][]) =>
          '(' + poly.map((ring: number[][]) =>
            '(' + ring.map((c: number[]) => `${c[0]} ${c[1]}`).join(', ') + ')'
          ).join(', ') + ')'
        ).join(', ');
        return `SRID=4326;MULTIPOLYGON(${polygons})`;
      }
      default:
        console.warn(`[seed] Unknown geometry type: ${geometry.type}`);
        return null;
    }
  } catch (err) {
    console.error(`[seed] Geometry conversion error:`, err);
    return null;
  }
}

async function seedLayer(
  supabase: any,
  config: LayerConfig
): Promise<SeedResult> {
  const startTime = Date.now();
  const result: SeedResult = {
    layer_key: config.layer_key,
    success: false,
    records_fetched: 0,
    records_inserted: 0,
    records_failed: 0,
    duration_ms: 0,
  };

  try {
    console.log(`[seed] Starting ${config.layer_key}...`);

    // Fetch features from ArcGIS
    const features = await fetchArcGISFeatures(
      config.source_url,
      HOUSTON_BBOX,
      config.max_records || 1000
    );

    result.records_fetched = features.length;

    if (features.length === 0) {
      result.error = 'No features returned from API';
      result.duration_ms = Date.now() - startTime;
      return result;
    }

    // Generate dataset version
    const datasetVersion = `${config.layer_key}_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}`;

    // Transform features
    const transformedRecords: any[] = [];
    
    for (const feature of features) {
      try {
        const mapped = applyFieldMappings(feature, config.field_mappings, config.constants);
        
        // Apply defaults for required NOT NULL columns based on table
        if (config.target_table === 'wetlands_canonical') {
          mapped.wetland_code = mapped.wetland_code || 'UNKNOWN';
        }
        if (config.target_table === 'fema_flood_canonical') {
          mapped.flood_zone = mapped.flood_zone || 'X';  // Default to Zone X (minimal flood hazard)
        }
        
        // Convert geometry to EWKT format for PostGIS
        const wkt = geometryToWKT(feature.geometry);
        if (!wkt) {
          result.records_failed++;
          continue; // Skip records without valid geometry
        }

        const record: any = {
          ...mapped,
          dataset_version: datasetVersion,
          geom: wkt,
        };

        transformedRecords.push(record);
      } catch (err) {
        console.error(`[seed] Transform error:`, err);
        result.records_failed++;
      }
    }

    console.log(`[seed] Transformed ${transformedRecords.length} records for ${config.layer_key}`);

    if (transformedRecords.length === 0) {
      result.error = 'No valid records after transformation';
      result.duration_ms = Date.now() - startTime;
      return result;
    }

    // Insert in batches using plain INSERT (no unique constraints on these tables)
    const BATCH_SIZE = 50;
    
    for (let i = 0; i < transformedRecords.length; i += BATCH_SIZE) {
      const batch = transformedRecords.slice(i, i + BATCH_SIZE);
      
      // Use raw SQL via RPC to handle PostGIS geometry properly
      const { error } = await insertBatchWithGeometry(supabase, config.target_table, batch);

      if (error) {
        console.error(`[seed] Batch insert error for ${config.layer_key}:`, error);
        result.records_failed += batch.length;
      } else {
        result.records_inserted += batch.length;
      }
    }

    // Log to gis_fetch_logs
    await supabase.from('gis_fetch_logs').insert({
      operation: 'seed_canonical',
      status: result.records_inserted > 0 ? 'success' : 'partial',
      records_processed: result.records_fetched,
      duration_ms: Date.now() - startTime,
      metadata: {
        layer_key: config.layer_key,
        target_table: config.target_table,
        records_inserted: result.records_inserted,
        records_failed: result.records_failed,
        dataset_version: datasetVersion,
      },
    });

    result.success = result.records_inserted > 0;
    result.duration_ms = Date.now() - startTime;

    console.log(`[seed] Completed ${config.layer_key}: ${result.records_inserted} inserted, ${result.records_failed} failed`);

  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    result.duration_ms = Date.now() - startTime;
    console.error(`[seed] Fatal error for ${config.layer_key}:`, result.error);
  }

  return result;
}

// Insert batch with proper PostGIS geometry handling via RPC (one at a time)
async function insertBatchWithGeometry(
  supabase: any, 
  tableName: string, 
  records: any[]
): Promise<{ error: any }> {
  let successCount = 0;
  let lastError: any = null;
  
  for (const record of records) {
    try {
      // Call RPC for each record individually
      const { data, error } = await supabase.rpc('execute_canonical_insert', {
        p_table_name: tableName,
        p_record: record,  // Pass as object, Supabase will convert to JSONB
      });
      
      if (error) {
        console.error(`[seed] RPC error:`, error);
        lastError = error;
        continue;
      }
      
      // Check RPC result
      if (data && data.success) {
        successCount++;
      } else if (data) {
        console.error(`[seed] Insert failed:`, data.error, data.sql?.slice(0, 200));
        lastError = { message: data.error };
      }
    } catch (err) {
      console.error(`[seed] Exception:`, err);
      lastError = err;
    }
  }
  
  console.log(`[seed] Batch result: ${successCount}/${records.length} inserted`);
  
  // Return error only if ALL records failed
  if (successCount === 0 && lastError) {
    return { error: lastError };
  }
  
  return { error: successCount === records.length ? null : { partial: true, successCount } };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[seed-houston-canonical] Starting seed operation');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body for optional layer filter
    let body: { layer_key?: string; layers?: string[] } = {};
    try {
      body = await req.json();
    } catch {
      // No body, seed all layers
    }

    // Filter layers if specified
    let layersToSeed = LAYER_CONFIGS;
    
    if (body.layer_key) {
      layersToSeed = LAYER_CONFIGS.filter(l => l.layer_key === body.layer_key);
    } else if (body.layers && body.layers.length > 0) {
      layersToSeed = LAYER_CONFIGS.filter(l => body.layers!.includes(l.layer_key));
    }

    if (layersToSeed.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No matching layers found',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[seed-houston-canonical] Seeding ${layersToSeed.length} layers`);

    // Seed each layer sequentially to avoid overwhelming APIs
    const results: SeedResult[] = [];
    
    for (const layerConfig of layersToSeed) {
      const result = await seedLayer(supabase, layerConfig);
      results.push(result);
      
      // Brief pause between layers
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Get current counts for all canonical tables
    const tableCounts: Record<string, number> = {};
    const tables = ['parcels_canonical', 'fema_flood_canonical', 'utilities_canonical', 'wetlands_canonical', 'transportation_canonical'];
    
    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      tableCounts[table] = count || 0;
    }

    const summary = {
      success: results.some(r => r.success),
      layers_processed: results.length,
      layers_successful: results.filter(r => r.success).length,
      layers_failed: results.filter(r => !r.success).length,
      total_records_fetched: results.reduce((sum, r) => sum + r.records_fetched, 0),
      total_records_inserted: results.reduce((sum, r) => sum + r.records_inserted, 0),
      duration_ms: Date.now() - startTime,
      table_counts: tableCounts,
      results,
    };

    console.log(`[seed-houston-canonical] Complete:`, JSON.stringify({
      layers: summary.layers_successful,
      records: summary.total_records_inserted,
      duration: summary.duration_ms,
    }));

    return new Response(JSON.stringify(summary, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[seed-houston-canonical] Fatal error:', errorMsg);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMsg,
      duration_ms: Date.now() - startTime,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
