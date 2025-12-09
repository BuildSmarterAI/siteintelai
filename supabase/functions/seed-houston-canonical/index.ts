// deno-lint-ignore-file no-explicit-any
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
    return isNaN(date.getTime()) ? null : date.toISOString();
  },
  identity: (val) => val,
};

interface LayerConfig {
  layer_key: string;
  source_url: string;
  target_table: string;
  field_mappings: Array<{ source: string; target: string; transform?: string }>;
  constants: Record<string, any>;
  max_records?: number;
}

// Layer configurations with field mappings
const LAYER_CONFIGS: LayerConfig[] = [
  {
    layer_key: 'houston_parcels',
    source_url: 'https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0',
    target_table: 'parcels_canonical',
    field_mappings: [
      { source: 'ACCT_NUM', target: 'parcel_id', transform: 'trim' },
      { source: 'owner_name_1', target: 'owner_name', transform: 'uppercase' },
      { source: 'SITUS_ADDR', target: 'site_address', transform: 'trim' },
      { source: 'legal_dscr_1', target: 'legal_description', transform: 'trim' },
      { source: 'acreage_1', target: 'acreage', transform: 'parse_float' },
      { source: 'tot_market_val', target: 'total_value', transform: 'parse_int' },
      { source: 'land_val', target: 'land_value', transform: 'parse_int' },
    ],
    constants: { jurisdiction: 'Harris County', state: 'TX', source_dataset: 'houston_parcels' },
    max_records: 5000,
  },
  {
    layer_key: 'houston_sewer_lines',
    source_url: 'https://geogimstest.houstontx.gov/arcgis/rest/services/WastewaterUtilities/MapServer/24',
    target_table: 'utilities_canonical',
    field_mappings: [
      { source: 'DIAMETER', target: 'pipe_diameter', transform: 'parse_float' },
      { source: 'MATERIAL', target: 'pipe_material', transform: 'uppercase' },
      { source: 'INSTALL_DATE', target: 'install_date', transform: 'parse_date' },
      { source: 'STATUS', target: 'status', transform: 'lowercase' },
    ],
    constants: { jurisdiction: 'Houston', utility_type: 'sewer', source_dataset: 'houston_sewer_lines' },
    max_records: 5000,
  },
  {
    layer_key: 'houston_water_lines',
    source_url: 'https://geogimstest.houstontx.gov/arcgis/rest/services/WaterUtilities/MapServer/0',
    target_table: 'utilities_canonical',
    field_mappings: [
      { source: 'DIAMETER', target: 'pipe_diameter', transform: 'parse_float' },
      { source: 'MATERIAL', target: 'pipe_material', transform: 'uppercase' },
      { source: 'PRESSURE', target: 'pressure_psi', transform: 'parse_float' },
      { source: 'STATUS', target: 'status', transform: 'lowercase' },
    ],
    constants: { jurisdiction: 'Houston', utility_type: 'water', source_dataset: 'houston_water_lines' },
    max_records: 5000,
  },
  {
    layer_key: 'fema_flood_zones',
    source_url: 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28',
    target_table: 'fema_flood_canonical',
    field_mappings: [
      { source: 'FLD_ZONE', target: 'flood_zone', transform: 'uppercase' },
      { source: 'ZONE_SUBTY', target: 'flood_zone_subtype', transform: 'uppercase' },
      { source: 'STATIC_BFE', target: 'static_bfe', transform: 'parse_float' },
      { source: 'FLOODWAY', target: 'floodway_flag', transform: 'parse_bool' },
      { source: 'DFIRM_ID', target: 'panel_id', transform: 'trim' },
    ],
    constants: { source_dataset: 'fema_flood_zones', state: 'TX', county: 'Harris' },
    max_records: 5000,
  },
  {
    layer_key: 'nwi_wetlands',
    source_url: 'https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0',
    target_table: 'wetlands_canonical',
    field_mappings: [
      { source: 'ATTRIBUTE', target: 'wetland_code', transform: 'uppercase' },
      { source: 'WETLAND_TYPE', target: 'wetland_type', transform: 'trim' },
    ],
    constants: { source_dataset: 'nwi_wetlands' },
    max_records: 2000,
  },
  {
    layer_key: 'txdot_aadt',
    source_url: 'https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/AADT/FeatureServer/0',
    target_table: 'transportation_canonical',
    field_mappings: [
      { source: 'AADT_RPT_QTY', target: 'aadt', transform: 'parse_int' },
      { source: 'AADT_RPT_YEAR', target: 'aadt_year', transform: 'parse_int' },
      { source: 'RD_NM', target: 'road_name', transform: 'uppercase' },
      { source: 'TRFC_STATN_ID', target: 'station_id', transform: 'trim' },
    ],
    constants: { source_dataset: 'txdot_aadt', state: 'TX' },
    max_records: 3000,
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
  const batchSize = Math.min(1000, maxRecords);

  console.log(`[seed] Fetching from ${sourceUrl}`);

  while (allFeatures.length < maxRecords) {
    const geometry = encodeURIComponent(JSON.stringify({
      xmin: bbox.xmin,
      ymin: bbox.ymin,
      xmax: bbox.xmax,
      ymax: bbox.ymax,
      spatialReference: { wkid: 4326 }
    }));

    const queryUrl = `${sourceUrl}/query?` +
      `where=1=1` +
      `&geometry=${geometry}` +
      `&geometryType=esriGeometryEnvelope` +
      `&inSR=4326` +
      `&outSR=4326` +
      `&spatialRel=esriSpatialRelIntersects` +
      `&outFields=*` +
      `&returnGeometry=true` +
      `&f=geojson` +
      `&resultOffset=${offset}` +
      `&resultRecordCount=${batchSize}`;

    try {
      const response = await fetch(queryUrl);
      
      if (!response.ok) {
        console.error(`[seed] HTTP error: ${response.status}`);
        break;
      }

      const data = await response.json();

      if (data.error) {
        console.error(`[seed] API error:`, data.error);
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
      await new Promise(resolve => setTimeout(resolve, 200));
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
      config.max_records || 5000
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
        
        // Generate source_id
        const idField = mapped.parcel_id || mapped.station_id || crypto.randomUUID().slice(0, 8);
        
        const record: any = {
          ...mapped,
          source_id: `${config.layer_key}_${idField}`,
          dataset_version: datasetVersion,
        };

        // Handle geometry - convert GeoJSON to WKT for PostGIS
        if (feature.geometry) {
          record.geom = feature.geometry;
        }

        transformedRecords.push(record);
      } catch (err) {
        result.records_failed++;
      }
    }

    console.log(`[seed] Transformed ${transformedRecords.length} records for ${config.layer_key}`);

    // Insert in batches
    const BATCH_SIZE = 100;
    
    for (let i = 0; i < transformedRecords.length; i += BATCH_SIZE) {
      const batch = transformedRecords.slice(i, i + BATCH_SIZE);
      
      const { error } = await supabase
        .from(config.target_table)
        .upsert(batch, { 
          onConflict: 'source_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`[seed] Batch insert error for ${config.layer_key}:`, error.message);
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
