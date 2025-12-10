-- Phase 1: Fix Houston Storm Lines URL (verified Houston Water GIS endpoint)
UPDATE gis_layers
SET 
  source_url = 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/HPWStormdrainLineIPS/MapServer/0',
  native_srid = 2278,
  field_mappings = '{
    "DIAMETER": "pipe_diameter",
    "MATERIAL": "pipe_material",
    "INSTALL_DT": "install_date",
    "STATUS": "status"
  }'::jsonb,
  updated_at = NOW()
WHERE layer_key = 'houston_storm_lines';

-- Phase 2: Delete broken Montgomery Parcels layer (old mctx.org domain - DNS dead)
DELETE FROM gis_layers WHERE layer_key = 'montgomery_parcels';

-- Phase 3a: Add Montgomery Tax Parcels Layer (MCAD ArcGIS Online)
INSERT INTO gis_layers (
  layer_key, display_name, category, provider,
  source_url, geometry_type, native_srid, status,
  field_mappings, update_policy
) VALUES (
  'montgomery_parcels_v2',
  'Montgomery Tax Parcels (MCAD)',
  'parcels',
  'Montgomery County Appraisal District',
  'https://services1.arcgis.com/PRoAPGnMSUqvTrzq/arcgis/rest/services/TaxParcelperClass/FeatureServer/0',
  'Polygon',
  2277,
  'active',
  '{
    "PROP_ID": "parcel_id",
    "OWNER_NAME": "owner_name",
    "PROP_ADDR": "site_address",
    "MARKET_VALUE": "total_value",
    "LAND_VALUE": "land_value",
    "PROP_CLASS": "property_class"
  }'::jsonb,
  '{"frequency": "weekly", "method": "etag"}'::jsonb
) ON CONFLICT (layer_key) DO UPDATE SET
  source_url = EXCLUDED.source_url,
  status = 'active',
  updated_at = NOW();

-- Phase 3b: Add Montgomery Municipal Boundaries Layer
INSERT INTO gis_layers (
  layer_key, display_name, category, provider,
  source_url, geometry_type, native_srid, status,
  field_mappings, update_policy
) VALUES (
  'montgomery_municipal',
  'Montgomery Municipal Boundaries',
  'jurisdiction',
  'Montgomery County Appraisal District',
  'https://services1.arcgis.com/PRoAPGnMSUqvTrzq/ArcGIS/rest/services/MunicipalBoundary/FeatureServer/0',
  'Polygon',
  2277,
  'active',
  '{
    "CITY_CODE": "jurisdiction_code",
    "CITY_NAME": "jurisdiction_name",
    "Shape__Area": "area_sqft"
  }'::jsonb,
  '{"frequency": "monthly", "method": "etag"}'::jsonb
) ON CONFLICT (layer_key) DO UPDATE SET
  source_url = EXCLUDED.source_url,
  status = 'active',
  updated_at = NOW();

-- Phase 4: Register Montgomery CAD ArcGIS Online as map server
INSERT INTO map_servers (
  server_key, jurisdiction, provider, base_url,
  service_type, scraper_mode, health_status, is_active
) VALUES (
  'montgomery_cad_agol',
  'Montgomery County',
  'Montgomery County Appraisal District',
  'https://services1.arcgis.com/PRoAPGnMSUqvTrzq/arcgis/rest/services',
  'FeatureServer',
  'disabled',
  'operational',
  true
) ON CONFLICT (server_key) DO UPDATE SET
  base_url = EXCLUDED.base_url,
  is_active = true,
  updated_at = NOW();