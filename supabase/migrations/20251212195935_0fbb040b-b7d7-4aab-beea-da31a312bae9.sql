-- Complete Montgomery County (MCAD) parcel configuration for 6-county Houston metro priority registry

-- Step 1: Update gis_layers with county_fips
UPDATE gis_layers 
SET county_fips = '48339'
WHERE layer_key = 'montgomery_parcels_v2';

-- Step 2: Ensure map_servers entry has proper metadata
UPDATE map_servers 
SET 
  dataset_family = 'parcels',
  update_frequency = 'quarterly',
  accuracy_tier = 'T1',
  reliability_score = 95
WHERE server_key = 'mcad_parcels';

-- Step 3: Insert transform_config for Montgomery County parcels
INSERT INTO transform_configs (
  transform_id,
  layer_key,
  target_table,
  enabled,
  config,
  created_at,
  updated_at
) VALUES (
  'mcad_parcels_canonical',
  'montgomery_parcels_v2',
  'canonical_parcels',
  true,
  '{
    "field_mappings": [
      {"source": "ACCOUNT", "target": "apn", "transform": "trim"},
      {"source": "ACCOUNT", "target": "source_parcel_id", "transform": "trim"},
      {"source": "OWNER_NAME", "target": "owner_name", "transform": "trim"},
      {"source": "SITUS_ADDR", "target": "situs_address", "transform": "trim"},
      {"source": "SITUS_CITY", "target": "city", "transform": "trim"},
      {"source": "SITUS_ZIP", "target": "zip", "transform": "trim"},
      {"source": "LEGAL_ACRE", "target": "acreage", "transform": "parse_float"},
      {"source": "LAND_USE", "target": "land_use_code", "transform": "trim"},
      {"source": "LAND_DESC", "target": "land_use_desc", "transform": "trim"},
      {"source": "OWNER_ADDR", "target": "owner_mailing_address", "transform": "trim"},
      {"source": "OWNER_CITY", "target": "owner_city", "transform": "trim"},
      {"source": "OWNER_STATE", "target": "owner_state", "transform": "uppercase"},
      {"source": "OWNER_ZIP", "target": "owner_zip", "transform": "trim"}
    ],
    "geometry_transforms": {
      "source_srid": 4326,
      "target_srid": 4326,
      "operations": ["repair", "make_valid"]
    },
    "constants": {
      "source_agency": "Montgomery CAD",
      "jurisdiction": "Montgomery County",
      "state": "TX",
      "county_fips": "48339",
      "source_system": "MCAD ArcGIS"
    },
    "deduplication": {
      "strategy": "keep_latest",
      "key_field": "source_parcel_id",
      "timestamp_field": "updated_at"
    }
  }'::jsonb,
  now(),
  now()
)
ON CONFLICT (transform_id) DO UPDATE SET
  config = EXCLUDED.config,
  enabled = true,
  updated_at = now();