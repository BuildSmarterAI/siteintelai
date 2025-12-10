-- Phase 1: Fix Harris County HCAD and Add Travis County (TCAD Austin)

-- 1. Fix Harris County HCAD parcels - try layer index 4 (parcels layer)
UPDATE gis_layers
SET 
  source_url = 'https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/4',
  status = 'active',
  update_policy = '{"frequency": "quarterly", "strategy": "full_refresh"}'::jsonb,
  field_mappings = jsonb_build_object(
    'parcel_id', 'HCAD_NUM',
    'owner_name', 'owner_name_1',
    'situs_address', 'situs_address',
    'legal_desc', 'legal_desc_1',
    'acreage', 'acreage_1',
    'tot_appr_val', 'tot_appr_val',
    'land_val', 'land_val',
    'imprv_val', 'imprv_val'
  ),
  updated_at = NOW()
WHERE layer_key = 'houston_parcels';

-- 2. Add Travis County (TCAD) - Austin area parcels
INSERT INTO gis_layers (
  layer_key,
  display_name,
  provider,
  source_url,
  category,
  geometry_type,
  native_srid,
  status,
  update_policy,
  field_mappings
) VALUES (
  'travis_parcels',
  'Travis County Parcels (TCAD)',
  'Travis County Appraisal District',
  'https://gis.traviscountytx.gov/server1/rest/services/Boundaries_and_Jurisdictions/TCAD_public/MapServer/0',
  'parcels',
  'Polygon',
  2277,
  'active',
  '{"frequency": "monthly", "strategy": "full_refresh"}'::jsonb,
  jsonb_build_object(
    'parcel_id', 'PROP_ID',
    'owner_name', 'OWNER',
    'situs_address', 'SITUS_ADDR',
    'legal_desc', 'LEGAL_DESC',
    'acreage', 'ACRES',
    'land_val', 'LAND_VAL',
    'imprv_val', 'IMPR_VAL',
    'tot_appr_val', 'TOT_VAL'
  )
)
ON CONFLICT (layer_key) DO UPDATE SET
  source_url = EXCLUDED.source_url,
  status = EXCLUDED.status,
  update_policy = EXCLUDED.update_policy,
  field_mappings = EXCLUDED.field_mappings,
  updated_at = NOW();