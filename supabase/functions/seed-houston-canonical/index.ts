// deno-lint-ignore-file no-explicit-any
// Version: 1.1.0 - Incremental batch insert to prevent timeouts
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
  ccn_status: (val) => {
    if (!val) return 'unknown';
    const s = String(val).toLowerCase().trim();
    if (s.includes('active') || s === 'a') return 'active';
    if (s.includes('inactive') || s === 'i') return 'inactive';
    if (s.includes('revoked') || s === 'r') return 'revoked';
    if (s.includes('proposed') || s === 'p') return 'proposed';
    return 'unknown';
  },
  pipeline_status: (val) => {
    if (!val) return 'unknown';
    const s = String(val).toLowerCase().trim();
    if (s.includes('active') || s === 'a' || s.includes('in service')) return 'active';
    if (s.includes('abandon') || s === 'abn') return 'abandoned';
    if (s.includes('inactive') || s.includes('idle')) return 'inactive';
    if (s.includes('proposed') || s === 'p') return 'proposed';
    return 'unknown';
  },
  route_prefix_to_class: (val) => {
    if (!val) return null;
    const prefix = String(val).toUpperCase().trim();
    if (['IH', 'US', 'PA', 'SH', 'SA', 'UA'].includes(prefix)) return 'arterial';
    if (['FM', 'RM', 'RR', 'FS', 'RS', 'UP'].includes(prefix)) return 'collector';
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

// REDUCED max_records for faster completion within timeout
const LAYER_CONFIGS: LayerConfig[] = [
  {
    layer_key: 'houston_parcels',
    source_url: 'https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0',
    target_table: 'canonical_parcels',
    field_mappings: [
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
    max_records: 300, // REDUCED from 5000 to fit within timeout
  },
  {
    layer_key: 'houston_sewer_lines',
    source_url: 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWWastewaterLineIPS/MapServer/0',
    target_table: 'utilities_canonical',
    field_mappings: [
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
    max_records: 500,
  },
  {
    layer_key: 'houston_water_lines',
    source_url: 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWWaterLineIPS/MapServer/0',
    target_table: 'utilities_canonical',
    field_mappings: [
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
    max_records: 500,
  },
  {
    layer_key: 'fema_flood_zones',
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
    max_records: 500,
  },
  {
    layer_key: 'nwi_wetlands',
    source_url: 'https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0',
    target_table: 'wetlands_canonical',
    field_mappings: [
      { source: 'WETLAND_TYPE', target: 'wetland_code', transform: 'uppercase' },
      { source: 'WETLAND_TYPE', target: 'wetland_type', transform: 'trim' },
      { source: 'ACRES', target: 'area_acres', transform: 'parse_float' },
    ],
    constants: { source_dataset: 'nwi_wetlands' },
    max_records: 500,
  },
  {
    layer_key: 'txdot_aadt',
    source_url: 'https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_AADT/FeatureServer/0',
    target_table: 'transportation_canonical',
    field_mappings: [
      { source: 'AADT_CUR', target: 'aadt', transform: 'parse_int' },
      { source: 'YR', target: 'aadt_year', transform: 'parse_int' },
      { source: 'RTE_NM', target: 'road_name', transform: 'uppercase' },
      { source: 'RTE_PRFX', target: 'road_class', transform: 'route_prefix_to_class' },
      { source: 'RTE_ID', target: 'route_number', transform: 'trim' },
      { source: 'T_PCT', target: 'truck_percent', transform: 'parse_float' },
      { source: 'K_FLAG', target: 'k_factor', transform: 'parse_float' },
      { source: 'DIR_FLAG', target: 'direction', transform: 'trim' },
    ],
    constants: { 
      source_dataset: 'txdot_aadt', 
      jurisdiction: 'TxDOT',
      county: 'Harris'
    },
    max_records: 500,
  },
  {
    layer_key: 'puct_ccn_water',
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
    max_records: 300,
  },
  {
    layer_key: 'puct_ccn_sewer',
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
    max_records: 300,
  },
  {
    layer_key: 'rrc_pipelines',
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
    max_records: 500,
  },
];

interface SeedResult {
  layer_key: string;
  success: boolean;
  records_fetched: number;
  records_inserted: number;
  records_failed: number;
  duration_ms: number;
  resumed_from_offset?: number;
  total_in_table?: number;
  error?: string;
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
        return null;
    }
  } catch {
    return null;
  }
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

// Insert single record with PostGIS geometry handling
async function insertRecord(
  supabase: any, 
  tableName: string, 
  record: any
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('execute_canonical_insert', {
      p_table_name: tableName,
      p_record: record,
    });
    
    if (error) {
      console.error(`[seed] RPC error:`, error.message);
      return false;
    }
    
    return data?.success === true;
  } catch (err) {
    console.error(`[seed] Insert exception:`, err);
    return false;
  }
}

// Query existing record count to resume from where we left off
async function getExistingCount(supabase: any, tableName: string, layerKey: string): Promise<number> {
  try {
    // For tables with source_dataset column, filter by layer key
    const tablesWithSourceDataset = ['utilities_canonical', 'fema_flood_canonical', 'wetlands_canonical', 'transportation_canonical'];
    
    if (tablesWithSourceDataset.includes(tableName)) {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq('source_dataset', layerKey);
      
      if (error) {
        console.log(`[seed] Count query error for ${tableName}:`, error.message);
        return 0;
      }
      return count || 0;
    }
    
    // For canonical_parcels, count all records (or filter by jurisdiction if needed)
    if (tableName === 'canonical_parcels') {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`[seed] Count query error for ${tableName}:`, error.message);
        return 0;
      }
      return count || 0;
    }
    
    // For other tables (CCN, pipelines), count all
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`[seed] Count query error for ${tableName}:`, error.message);
      return 0;
    }
    return count || 0;
  } catch (err) {
    console.log(`[seed] Count exception:`, err);
    return 0;
  }
}

// NEW: Fetch and insert incrementally - insert each batch immediately after fetching
// Now with RESUME capability - queries existing count and starts from that offset
async function seedLayerIncremental(
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
    resumed_from_offset: 0,
    total_in_table: 0,
  };

  const maxRecords = config.max_records || 300;
  const fetchBatchSize = 100; // Fetch 100 at a time
  
  // RESUME: Get existing count and use as starting offset
  const existingCount = await getExistingCount(supabase, config.target_table, config.layer_key);
  let offset = existingCount;
  result.resumed_from_offset = existingCount;
  
  const datasetVersion = `${config.layer_key}_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}`;
  
  console.log(`[seed] Starting incremental seed for ${config.layer_key}`);
  console.log(`[seed] RESUME: Found ${existingCount} existing records, starting from offset ${offset}`);
  console.log(`[seed] Will fetch up to ${maxRecords} NEW records this invocation`);

  try {
    while (result.records_fetched < maxRecords) {
      // Check if we're running out of time (50 second soft limit)
      const elapsed = Date.now() - startTime;
      if (elapsed > 50000) {
        console.log(`[seed] Time limit approaching (${elapsed}ms), stopping ${config.layer_key}`);
        break;
      }

      // Fetch one batch
      const queryParams = new URLSearchParams({
        where: '1=1',
        geometry: `${HOUSTON_BBOX.xmin},${HOUSTON_BBOX.ymin},${HOUSTON_BBOX.xmax},${HOUSTON_BBOX.ymax}`,
        geometryType: 'esriGeometryEnvelope',
        inSR: '4326',
        outSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: '*',
        returnGeometry: 'true',
        f: 'geojson',
        resultOffset: String(offset),
        resultRecordCount: String(fetchBatchSize),
      });

      const queryUrl = `${config.source_url}/query?${queryParams.toString()}`;
      
      console.log(`[seed] Fetching batch at offset ${offset}...`);
      
      const response = await fetch(queryUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://buildsmarter.app/',
        },
      });
      
      if (!response.ok) {
        console.error(`[seed] HTTP error ${response.status}`);
        break;
      }

      const data = await response.json();
      
      if (data.error) {
        console.error(`[seed] API error:`, data.error.message || JSON.stringify(data.error));
        break;
      }

      const features = data.features || [];
      console.log(`[seed] Batch ${offset}: ${features.length} features`);

      if (features.length === 0) break;

      result.records_fetched += features.length;

      // IMMEDIATELY insert this batch
      for (const feature of features) {
        try {
          const mapped = applyFieldMappings(feature, config.field_mappings, config.constants);
          
          // Apply defaults for required NOT NULL columns
          if (config.target_table === 'wetlands_canonical') {
            mapped.wetland_code = mapped.wetland_code || 'UNKNOWN';
          }
          if (config.target_table === 'fema_flood_canonical') {
            mapped.flood_zone = mapped.flood_zone || 'X';
          }
          
          const wkt = geometryToWKT(feature.geometry);
          if (!wkt) {
            result.records_failed++;
            continue;
          }

          const record = {
            ...mapped,
            dataset_version: datasetVersion,
            geom: wkt,
          };

          const success = await insertRecord(supabase, config.target_table, record);
          if (success) {
            result.records_inserted++;
          } else {
            result.records_failed++;
          }
        } catch {
          result.records_failed++;
        }
      }

      console.log(`[seed] Batch complete: ${result.records_inserted} inserted, ${result.records_failed} failed`);

      // If we got less than batch size, we're done
      if (features.length < fetchBatchSize) break;
      
      offset += features.length;
      
      // Brief pause between fetches
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Log to gis_fetch_logs
    await supabase.from('gis_fetch_logs').insert({
      operation: 'seed_canonical_incremental',
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
    }).catch(() => {}); // Don't fail on log error

    result.success = result.records_inserted > 0;
    result.duration_ms = Date.now() - startTime;
    result.total_in_table = existingCount + result.records_inserted;

    console.log(`[seed] Completed ${config.layer_key}: ${result.records_inserted} NEW records inserted`);
    console.log(`[seed] Total now in ${config.target_table}: ${result.total_in_table} (was ${existingCount})`);

  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    result.duration_ms = Date.now() - startTime;
    console.error(`[seed] Fatal error for ${config.layer_key}:`, result.error);
  }

  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[seed-houston-canonical] Starting incremental seed operation v1.1.0');

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
        available_layers: LAYER_CONFIGS.map(l => l.layer_key),
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[seed-houston-canonical] Seeding ${layersToSeed.length} layers: ${layersToSeed.map(l => l.layer_key).join(', ')}`);

    // Seed each layer sequentially using incremental approach
    const results: SeedResult[] = [];
    
    for (const layerConfig of layersToSeed) {
      // Check overall time limit (allow 55 seconds total)
      if (Date.now() - startTime > 55000) {
        console.log('[seed-houston-canonical] Overall time limit reached, stopping');
        break;
      }
      
      const result = await seedLayerIncremental(supabase, layerConfig);
      results.push(result);
      
      // Brief pause between layers
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Get current counts for canonical tables
    const tableCounts: Record<string, number> = {};
    const tables = ['canonical_parcels', 'fema_flood_canonical', 'utilities_canonical', 'wetlands_canonical', 'transportation_canonical', 'utilities_ccn_canonical', 'pipelines_canonical'];
    
    for (const table of tables) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        tableCounts[table] = count || 0;
      } catch {
        tableCounts[table] = -1; // Table might not exist
      }
    }

    const summary = {
      success: results.some(r => r.success),
      version: '1.1.0',
      layers_processed: results.length,
      layers_successful: results.filter(r => r.success).length,
      layers_failed: results.filter(r => !r.success).length,
      total_records_fetched: results.reduce((sum, r) => sum + r.records_fetched, 0),
      total_records_inserted: results.reduce((sum, r) => sum + r.records_inserted, 0),
      total_records_failed: results.reduce((sum, r) => sum + r.records_failed, 0),
      duration_ms: Date.now() - startTime,
      table_counts: tableCounts,
      results,
    };

    console.log(`[seed-houston-canonical] Complete: ${summary.total_records_inserted} records in ${summary.duration_ms}ms`);

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
