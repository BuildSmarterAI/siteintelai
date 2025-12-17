// deno-lint-ignore-file no-explicit-any
/**
 * seed-texas-canonical - Unified multi-metro ETL seeding function
 * Version: 2.1.0 - Expanded Texas county coverage
 * 
 * ============================================================================
 * HOW TO ADD A NEW COUNTY:
 * ============================================================================
 * 1. Find the county CAD ArcGIS REST endpoint (usually at [county]cad.org or county GIS portal)
 * 2. Query the endpoint's ?f=json to discover field names
 * 3. Add a LayerConfig entry to HARDCODED_CONFIGS with field_mappings
 * 4. Add bbox to DEFAULT_BBOXES (get from county GIS or use approx coords)
 * 5. Add to LAYER_TO_COUNTY mapping
 * 6. Invoke: POST /seed-texas-canonical { "county": "newcounty" }
 * 
 * For shapefile-only counties (Galveston, Brazoria), use shapefile_ingestor instead.
 * Real-time fallback queries non-seeded counties via enrich-feasibility ENDPOINT_CATALOG.
 * 
 * Current REST API Counties: Harris, Fort Bend, Montgomery, Travis, Bexar, Williamson,
 *                            Dallas, Collin, Denton, Kaufman, Rockwall (via Dallas endpoint), Tarrant
 * Shapefile-only (future): Galveston, Brazoria
 * ============================================================================
 */
import { createClient } from "jsr:@supabase/supabase-js@2";
import { 
  transformFunctions, 
  applyFieldMappings, 
  geometryToWKT, 
  buildArcGISQueryUrl,
  insertRecord, 
  getExistingCount, 
  logEtlOperation,
  getTableCounts,
  type BBox 
} from "../_shared/etl-utils/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Hardcoded layer configs as fallback (Houston legacy configs)
const HARDCODED_CONFIGS: LayerConfig[] = [
  // ========== HARRIS COUNTY (HCAD) ==========
  {
    layer_key: 'harris_parcels',
    source_url: 'https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0',
    target_table: 'canonical_parcels',
    metro: 'houston',
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
    max_records: 500,
  },

  // ========== FORT BEND COUNTY (FBCAD) ==========
  {
    layer_key: 'fortbend_parcels',
    source_url: 'https://gisweb.fbcad.org/arcgis/rest/services/Hosted/FBCAD_Public_Data/FeatureServer/0',
    target_table: 'canonical_parcels',
    metro: 'houston',
    field_mappings: [
      { source: 'propnumber', target: 'source_parcel_id', transform: 'trim' },
      { source: 'propnumber', target: 'apn', transform: 'trim' },
      { source: 'ownername', target: 'owner_name', transform: 'uppercase' },
      { source: 'situs', target: 'situs_address', transform: 'trim' },
      { source: 'acres', target: 'acreage', transform: 'parse_float' },
      { source: 'proptype', target: 'land_use_code', transform: 'trim' },
      { source: 'city', target: 'city', transform: 'trim' },
      { source: 'zip', target: 'zip', transform: 'trim' },
    ],
    constants: { 
      jurisdiction: 'Fort Bend County', 
      state: 'TX', 
      dataset_version: '2025_01',
      source_system: 'FBCAD',
      source_agency: 'Fort Bend County Appraisal District'
    },
    max_records: 500,
  },

  // ========== MONTGOMERY COUNTY (MCAD) ==========
  {
    layer_key: 'montgomery_parcels',
    source_url: 'https://gis.mctx.org/arcgis/rest/services/Parcels/MapServer/0',
    target_table: 'canonical_parcels',
    metro: 'houston',
    field_mappings: [
      { source: 'PROP_ID', target: 'source_parcel_id', transform: 'trim' },
      { source: 'PROP_ID', target: 'apn', transform: 'trim' },
      { source: 'OWNER_NAME', target: 'owner_name', transform: 'uppercase' },
      { source: 'SITUS_ADDR', target: 'situs_address', transform: 'trim' },
      { source: 'ACRES', target: 'acreage', transform: 'parse_float' },
      { source: 'PROP_TYPE', target: 'land_use_code', transform: 'trim' },
      { source: 'SITUS_CITY', target: 'city', transform: 'trim' },
      { source: 'SITUS_ZIP', target: 'zip', transform: 'trim' },
    ],
    constants: { 
      jurisdiction: 'Montgomery County', 
      state: 'TX', 
      dataset_version: '2025_01',
      source_system: 'MCAD',
      source_agency: 'Montgomery County Appraisal District'
    },
    max_records: 500,
  },

  // ========== TRAVIS COUNTY (TCAD) ==========
  {
    layer_key: 'travis_parcels',
    source_url: 'https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/TCAD_public/FeatureServer/0',
    target_table: 'canonical_parcels',
    metro: 'austin',
    field_mappings: [
      { source: 'prop_id', target: 'source_parcel_id', transform: 'trim' },
      { source: 'prop_id', target: 'apn', transform: 'trim' },
      { source: 'owner_name', target: 'owner_name', transform: 'uppercase' },
      { source: 'situs_address', target: 'situs_address', transform: 'trim' },
      { source: 'acres', target: 'acreage', transform: 'parse_float' },
      { source: 'land_use', target: 'land_use_code', transform: 'trim' },
      { source: 'city', target: 'city', transform: 'trim' },
      { source: 'zip', target: 'zip', transform: 'trim' },
    ],
    constants: { 
      jurisdiction: 'Travis County', 
      state: 'TX', 
      dataset_version: '2025_01',
      source_system: 'TCAD',
      source_agency: 'Travis County Appraisal District'
    },
    max_records: 500,
  },

  // ========== BEXAR COUNTY (BCAD) ==========
  {
    layer_key: 'bexar_parcels',
    source_url: 'https://gis.bexar.org/arcgis/rest/services/BCAD/Parcels/MapServer/0',
    target_table: 'canonical_parcels',
    metro: 'san_antonio',
    field_mappings: [
      { source: 'PROP_ID', target: 'source_parcel_id', transform: 'trim' },
      { source: 'PROP_ID', target: 'apn', transform: 'trim' },
      { source: 'OWNER', target: 'owner_name', transform: 'uppercase' },
      { source: 'SITUS', target: 'situs_address', transform: 'trim' },
      { source: 'ACRES', target: 'acreage', transform: 'parse_float' },
      { source: 'LAND_USE', target: 'land_use_code', transform: 'trim' },
      { source: 'CITY', target: 'city', transform: 'trim' },
      { source: 'ZIP', target: 'zip', transform: 'trim' },
    ],
    constants: { 
      jurisdiction: 'Bexar County', 
      state: 'TX', 
      dataset_version: '2025_01',
      source_system: 'BCAD',
      source_agency: 'Bexar County Appraisal District'
    },
    max_records: 500,
  },

  // ========== WILLIAMSON COUNTY (WCAD) ==========
  {
    layer_key: 'williamson_parcels',
    source_url: 'https://gis.wilco.org/arcgis/rest/services/Parcels/MapServer/0',
    target_table: 'canonical_parcels',
    metro: 'austin',
    field_mappings: [
      { source: 'PROP_ID', target: 'source_parcel_id', transform: 'trim' },
      { source: 'PROP_ID', target: 'apn', transform: 'trim' },
      { source: 'OWNER_NAME', target: 'owner_name', transform: 'uppercase' },
      { source: 'SITUS', target: 'situs_address', transform: 'trim' },
      { source: 'ACRES', target: 'acreage', transform: 'parse_float' },
      { source: 'LAND_USE', target: 'land_use_code', transform: 'trim' },
      { source: 'CITY', target: 'city', transform: 'trim' },
      { source: 'ZIP', target: 'zip', transform: 'trim' },
    ],
    constants: { 
      jurisdiction: 'Williamson County', 
      state: 'TX', 
      dataset_version: '2025_01',
      source_system: 'WCAD',
      source_agency: 'Williamson County Appraisal District'
    },
    max_records: 500,
  },

  // ========== DALLAS AREA (Multi-county: Dallas, Collin, Denton, Kaufman, Rockwall) ==========
  // This single endpoint covers 5 counties via Dallas City Hall GIS
  {
    layer_key: 'dallas_area_parcels',
    source_url: 'https://egis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/MapServer/0',
    target_table: 'canonical_parcels',
    metro: 'dallas',
    field_mappings: [
      { source: 'ACCT', target: 'source_parcel_id', transform: 'trim' },
      { source: 'ACCT', target: 'apn', transform: 'trim' },
      { source: 'TAXPANAME1', target: 'owner_name', transform: 'uppercase' },
      { source: 'ST_NUM', target: 'situs_address', transform: 'trim' }, // Will need address concat in transform
      { source: 'AREA_FEET', target: 'acreage', transform: 'sqft_to_acres' },
      { source: 'LAND_USE', target: 'land_use_code', transform: 'trim' },
      { source: 'CITY', target: 'city', transform: 'trim' },
      { source: 'ZIP', target: 'zip', transform: 'trim' },
      { source: 'COUNTY', target: 'county_fips', transform: 'trim' }, // For filtering by county
    ],
    constants: { 
      jurisdiction: 'Dallas Area', 
      state: 'TX', 
      dataset_version: '2025_01',
      source_system: 'DCAD_MULTI',
      source_agency: 'Dallas City Hall GIS (Multi-County)'
    },
    max_records: 500,
  },

  // ========== TARRANT COUNTY (TAD) ==========
  {
    layer_key: 'tarrant_parcels',
    source_url: 'https://mapit.tarrantcounty.com/arcgis/rest/services/Dynamic/TADParcels/FeatureServer/0',
    target_table: 'canonical_parcels',
    metro: 'dallas',
    field_mappings: [
      { source: 'ACCOUNT', target: 'source_parcel_id', transform: 'trim' },
      { source: 'ACCOUNT', target: 'apn', transform: 'trim' },
      { source: 'OWNER_NAME', target: 'owner_name', transform: 'uppercase' },
      { source: 'SITUS_ADDR', target: 'situs_address', transform: 'trim' },
      { source: 'LAND_ACRES', target: 'acreage', transform: 'parse_float' },
      { source: 'LAND_USE', target: 'land_use_code', transform: 'trim' },
      { source: 'SITUS_CITY', target: 'city', transform: 'trim' },
      { source: 'SITUS_ZIP', target: 'zip', transform: 'trim' },
    ],
    constants: { 
      jurisdiction: 'Tarrant County', 
      state: 'TX', 
      dataset_version: '2025_01',
      source_system: 'TAD',
      source_agency: 'Tarrant Appraisal District'
    },
    max_records: 500,
  },

  // ========== HOUSTON UTILITIES ==========
  {
    layer_key: 'houston_sewer_lines',
    source_url: 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWWastewaterLineIPS/MapServer/0',
    target_table: 'utilities_canonical',
    metro: 'houston',
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
    metro: 'houston',
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

  // ========== FEMA FLOOD ZONES ==========
  {
    layer_key: 'fema_flood_zones',
    source_url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Flood_Hazard_Reduced_Set_gdb/FeatureServer/0',
    target_table: 'fema_flood_canonical',
    metro: 'houston',
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
      bfe_unit: 'NAVD88'
    },
    max_records: 500,
  },

  // ========== NWI WETLANDS ==========
  {
    layer_key: 'nwi_wetlands',
    source_url: 'https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0',
    target_table: 'wetlands_canonical',
    metro: 'houston',
    field_mappings: [
      { source: 'WETLAND_TYPE', target: 'wetland_code', transform: 'uppercase' },
      { source: 'WETLAND_TYPE', target: 'wetland_type', transform: 'trim' },
      { source: 'ACRES', target: 'area_acres', transform: 'parse_float' },
    ],
    constants: { source_dataset: 'nwi_wetlands' },
    max_records: 500,
  },

  // ========== TXDOT AADT ==========
  {
    layer_key: 'txdot_aadt',
    source_url: 'https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_AADT/FeatureServer/0',
    target_table: 'transportation_canonical',
    metro: 'houston',
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
      jurisdiction: 'TxDOT'
    },
    max_records: 500,
  },

  // ========== CCN WATER/SEWER ==========
  {
    layer_key: 'puct_ccn_water',
    source_url: 'https://www.gis.hctx.net/arcgishcpid/rest/services/State/PUC_CCN_Sewer_Water/MapServer/1',
    target_table: 'utilities_ccn_canonical',
    metro: 'houston',
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
    metro: 'houston',
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

  // ========== RRC PIPELINES ==========
  {
    layer_key: 'rrc_pipelines',
    source_url: 'https://www.gis.hctx.net/arcgishcpid/rest/services/TXRRC/Pipelines/MapServer/0',
    target_table: 'pipelines_canonical',
    metro: 'houston',
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

// Default bounding boxes - county-specific and metro-level (fallback if not in database)
const DEFAULT_BBOXES: Record<string, BBox> = {
  // Houston Metro counties
  harris:     { xmin: -95.91, ymin: 29.49, xmax: -94.91, ymax: 30.17 },
  fortbend:   { xmin: -96.01, ymin: 29.35, xmax: -95.45, ymax: 29.82 },
  montgomery: { xmin: -95.86, ymin: 30.07, xmax: -95.07, ymax: 30.67 },
  // Austin Metro counties
  travis:     { xmin: -98.17, ymin: 30.07, xmax: -97.37, ymax: 30.63 },
  williamson: { xmin: -98.05, ymin: 30.48, xmax: -97.28, ymax: 30.91 },
  // San Antonio Metro
  bexar:      { xmin: -98.81, ymin: 29.17, xmax: -98.09, ymax: 29.73 },
  // Dallas-Fort Worth Metro counties
  dallas:     { xmin: -97.05, ymin: 32.55, xmax: -96.46, ymax: 33.02 },
  tarrant:    { xmin: -97.55, ymin: 32.55, xmax: -97.03, ymax: 33.00 },
  collin:     { xmin: -96.99, ymin: 33.00, xmax: -96.29, ymax: 33.48 },
  denton:     { xmin: -97.38, ymin: 33.00, xmax: -96.82, ymax: 33.48 },
  kaufman:    { xmin: -96.55, ymin: 32.45, xmax: -96.02, ymax: 32.85 },
  rockwall:   { xmin: -96.50, ymin: 32.82, xmax: -96.28, ymax: 33.00 },
  // Metro-level bounding boxes (union of counties for broad queries)
  houston:      { xmin: -96.01, ymin: 29.35, xmax: -94.91, ymax: 30.67 },
  dallas_metro: { xmin: -97.55, ymin: 32.45, xmax: -96.02, ymax: 33.48 }, // All DFW counties
  austin:       { xmin: -98.17, ymin: 30.07, xmax: -97.28, ymax: 30.91 },
  san_antonio:  { xmin: -98.81, ymin: 29.17, xmax: -98.09, ymax: 29.73 },
};

interface LayerConfig {
  layer_key: string;
  source_url: string;
  target_table: string;
  metro: string;
  field_mappings: Array<{ source: string; target: string; transform?: string }>;
  constants: Record<string, any>;
  max_records?: number;
}

// Map layer_key prefixes to county bbox keys
const LAYER_TO_COUNTY: Record<string, string> = {
  // Houston Metro
  harris: 'harris',
  fortbend: 'fortbend',
  montgomery: 'montgomery',
  houston: 'harris', // Houston utilities use Harris bbox
  // Austin Metro
  travis: 'travis',
  williamson: 'williamson',
  // San Antonio
  bexar: 'bexar',
  // Dallas-Fort Worth Metro
  dallas_area: 'dallas_metro', // Multi-county endpoint uses full DFW bbox
  tarrant: 'tarrant',
  collin: 'collin',
  denton: 'denton',
  kaufman: 'kaufman',
  rockwall: 'rockwall',
};

interface SeedResult {
  layer_key: string;
  metro: string;
  success: boolean;
  records_fetched: number;
  records_inserted: number;
  records_failed: number;
  duration_ms: number;
  resumed_from_offset?: number;
  total_in_table?: number;
  error?: string;
}

// Fetch metro bbox from database
async function getMetroBbox(supabase: any, metroKey: string): Promise<BBox> {
  try {
    const { data, error } = await supabase
      .from('metro_regions')
      .select('bbox')
      .eq('metro_key', metroKey)
      .single();
    
    if (error || !data?.bbox) {
      console.log(`[seed] No bbox in DB for ${metroKey}, using default`);
      return DEFAULT_BBOXES[metroKey] || DEFAULT_BBOXES.houston;
    }
    
    return data.bbox as BBox;
  } catch {
    return DEFAULT_BBOXES[metroKey] || DEFAULT_BBOXES.houston;
  }
}

// Seed a single layer incrementally with resume capability
async function seedLayerIncremental(
  supabase: any,
  config: LayerConfig,
  bbox: BBox,
  startTime: number
): Promise<SeedResult> {
  const layerStartTime = Date.now();
  const result: SeedResult = {
    layer_key: config.layer_key,
    metro: config.metro,
    success: false,
    records_fetched: 0,
    records_inserted: 0,
    records_failed: 0,
    duration_ms: 0,
    resumed_from_offset: 0,
    total_in_table: 0,
  };

  const maxRecords = config.max_records || 300;
  const fetchBatchSize = 100;
  
  // RESUME: Get existing count and use as starting offset
  const existingCount = await getExistingCount(supabase, config.target_table, config.layer_key);
  let offset = existingCount;
  result.resumed_from_offset = existingCount;
  
  const datasetVersion = `${config.layer_key}_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}`;
  
  console.log(`[seed] Starting ${config.layer_key} (${config.metro})`);
  console.log(`[seed] RESUME: ${existingCount} existing, starting from offset ${offset}`);

  try {
    while (result.records_fetched < maxRecords) {
      // Check overall time limit (50 second soft limit per layer)
      const elapsed = Date.now() - layerStartTime;
      if (elapsed > 50000) {
        console.log(`[seed] Time limit approaching (${elapsed}ms), stopping ${config.layer_key}`);
        break;
      }
      
      // Check overall function time limit (55 seconds)
      if (Date.now() - startTime > 55000) {
        console.log(`[seed] Overall time limit, stopping ${config.layer_key}`);
        break;
      }

      const queryUrl = buildArcGISQueryUrl(config.source_url, bbox, offset, fetchBatchSize);
      
      console.log(`[seed] Fetching batch at offset ${offset}...`);
      
      const response = await fetch(queryUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://siteintel.ai/',
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

      // Immediately insert this batch
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

      if (features.length < fetchBatchSize) break;
      
      offset += features.length;
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    await logEtlOperation(
      supabase,
      'seed_texas_canonical',
      result.records_inserted > 0 ? 'success' : 'partial',
      result.records_fetched,
      Date.now() - layerStartTime,
      {
        layer_key: config.layer_key,
        metro: config.metro,
        target_table: config.target_table,
        records_inserted: result.records_inserted,
        records_failed: result.records_failed,
        dataset_version: datasetVersion,
      }
    );

    result.success = result.records_inserted > 0;
    result.duration_ms = Date.now() - layerStartTime;
    result.total_in_table = existingCount + result.records_inserted;

    console.log(`[seed] Completed ${config.layer_key}: ${result.records_inserted} NEW records`);

  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    result.duration_ms = Date.now() - layerStartTime;
    console.error(`[seed] Fatal error for ${config.layer_key}:`, result.error);
  }

  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[seed-texas-canonical] Starting unified ETL v2.0.0');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body
    let body: { 
      metro?: string; 
      layer_key?: string; 
      layers?: string[];
      category?: string;
      county?: string;  // NEW: Filter by county (harris, fortbend, montgomery, travis, bexar, williamson)
    } = {};
    try {
      body = await req.json();
    } catch {
      // No body, default behavior
    }

    console.log(`[seed-texas-canonical] Request params:`, JSON.stringify(body));

    // Determine which layers to seed
    let layersToSeed: LayerConfig[] = [...HARDCODED_CONFIGS];
    
    // Filter by county if specified
    if (body.county) {
      const countyLower = body.county.toLowerCase().replace(/\s+/g, '');
      layersToSeed = layersToSeed.filter(config => 
        config.layer_key.startsWith(countyLower) ||
        config.constants.jurisdiction?.toLowerCase().includes(body.county!.toLowerCase())
      );
    }
    
    // Filter by metro if specified
    if (body.metro) {
      layersToSeed = layersToSeed.filter(config => config.metro === body.metro);
    }

    // Filter by specific layer
    if (body.layer_key) {
      layersToSeed = layersToSeed.filter(config => config.layer_key === body.layer_key);
    }

    // Filter by layer list
    if (body.layers?.length) {
      layersToSeed = layersToSeed.filter(config => body.layers!.includes(config.layer_key));
    }

    // Filter by category
    if (body.category) {
      layersToSeed = layersToSeed.filter(config => 
        config.target_table.includes(body.category!.toLowerCase())
      );
    }

    // Determine bbox for first layer (use county-specific if available)
    const firstLayerKey = layersToSeed[0]?.layer_key || '';
    const countyPrefix = Object.keys(LAYER_TO_COUNTY).find(prefix => firstLayerKey.startsWith(prefix));
    const bboxKey = countyPrefix ? LAYER_TO_COUNTY[countyPrefix] : (body.metro || 'houston');
    const bbox = DEFAULT_BBOXES[bboxKey] || await getMetroBbox(supabase, body.metro || 'houston');

    console.log(`[seed-texas-canonical] Using bbox for ${bboxKey}:`, JSON.stringify(bbox));

    // If metro specified but no hardcoded configs, check database for layers
    if (layersToSeed.length === 0 && body.metro) {
      console.log(`[seed-texas-canonical] No hardcoded configs for ${body.metro}, checking database...`);
      
      // Try to load from gis_layers table
      const { data: dbLayers } = await supabase
        .from('gis_layers')
        .select('*, map_servers!inner(*)')
        .eq('map_servers.jurisdiction', body.metro)
        .eq('is_active', true);
      
      if (dbLayers?.length) {
        console.log(`[seed-texas-canonical] Found ${dbLayers.length} database layers for ${body.metro}`);
        // Convert database layers to LayerConfig format
        // (This would require transform_config parsing - for now just log)
        console.log(`[seed-texas-canonical] Database-driven seeding not yet implemented for ${body.metro}`);
      }
    }

    if (layersToSeed.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No matching layers found',
        available_layers: HARDCODED_CONFIGS.map(l => ({ key: l.layer_key, metro: l.metro })),
        available_metros: [...new Set(HARDCODED_CONFIGS.map(l => l.metro))],
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[seed-texas-canonical] Seeding ${layersToSeed.length} layers: ${layersToSeed.map(l => l.layer_key).join(', ')}`);

    // Seed each layer sequentially
    const results: SeedResult[] = [];
    
    for (const layerConfig of layersToSeed) {
      if (Date.now() - startTime > 55000) {
        console.log('[seed-texas-canonical] Overall time limit reached, stopping');
        break;
      }
      
      const result = await seedLayerIncremental(supabase, layerConfig, bbox, startTime);
      results.push(result);
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Get current table counts
    const tableCounts = await getTableCounts(supabase);

    const summary = {
      success: results.some(r => r.success),
      version: '2.0.0',
      metro: body.metro || bboxKey,
      bbox,
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

    console.log(`[seed-texas-canonical] Complete: ${summary.total_records_inserted} records in ${summary.duration_ms}ms`);

    return new Response(JSON.stringify(summary, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[seed-texas-canonical] Fatal error:', errorMsg);
    
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
