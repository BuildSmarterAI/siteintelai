-- ============================================
-- GIS ETL Pipeline Tables
-- ============================================

-- 1. GIS Layers Registry (source layer metadata)
CREATE TABLE IF NOT EXISTS public.gis_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  source_url TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('parcels', 'zoning', 'flood', 'utilities', 'wetlands', 'transportation', 'environmental', 'jurisdiction', 'topography', 'demographics')),
  geometry_type TEXT CHECK (geometry_type IN ('Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon')),
  native_srid INTEGER DEFAULT 4326,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'deprecated', 'testing')),
  update_policy JSONB NOT NULL DEFAULT '{"frequency": "daily", "method": "etag"}',
  field_mappings JSONB,
  license TEXT,
  map_server_id UUID REFERENCES public.map_servers(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. GIS Layer Versions (versioned snapshots of fetched data)
CREATE TABLE IF NOT EXISTS public.gis_layer_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id UUID NOT NULL REFERENCES public.gis_layers(id) ON DELETE CASCADE,
  area_key TEXT DEFAULT 'all',
  version_tag TEXT,
  etag TEXT,
  checksum_sha256 TEXT,
  record_count INTEGER,
  size_bytes BIGINT,
  bbox JSONB,
  storage_path TEXT,
  geojson JSONB,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  transform_status TEXT DEFAULT 'pending' CHECK (transform_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  transformed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. GIS Fetch Logs (audit trail for all fetch operations)
CREATE TABLE IF NOT EXISTS public.gis_fetch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id UUID REFERENCES public.gis_layers(id) ON DELETE SET NULL,
  layer_version_id UUID REFERENCES public.gis_layer_versions(id) ON DELETE SET NULL,
  operation TEXT NOT NULL CHECK (operation IN ('fetch', 'transform', 'validate', 'upload')),
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'unchanged', 'error', 'skipped')),
  http_status INTEGER,
  bytes_processed BIGINT,
  records_processed INTEGER,
  duration_ms INTEGER,
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Transform Configs (DSL configurations for data transformation)
CREATE TABLE IF NOT EXISTS public.transform_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transform_id TEXT UNIQUE NOT NULL,
  layer_key TEXT NOT NULL,
  target_table TEXT NOT NULL CHECK (target_table IN ('parcels_canonical', 'zoning_canonical', 'fema_flood_canonical', 'utilities_canonical', 'wetlands_canonical', 'transportation_canonical')),
  version TEXT DEFAULT '1.0.0',
  description TEXT,
  config JSONB NOT NULL,
  validation_rules JSONB,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_gis_layers_category ON public.gis_layers(category);
CREATE INDEX IF NOT EXISTS idx_gis_layers_status ON public.gis_layers(status);
CREATE INDEX IF NOT EXISTS idx_gis_layers_provider ON public.gis_layers(provider);

CREATE INDEX IF NOT EXISTS idx_gis_layer_versions_layer_id ON public.gis_layer_versions(layer_id);
CREATE INDEX IF NOT EXISTS idx_gis_layer_versions_is_active ON public.gis_layer_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_gis_layer_versions_transform_status ON public.gis_layer_versions(transform_status);
CREATE INDEX IF NOT EXISTS idx_gis_layer_versions_expires_at ON public.gis_layer_versions(expires_at);
CREATE INDEX IF NOT EXISTS idx_gis_layer_versions_fetched_at ON public.gis_layer_versions(fetched_at DESC);

CREATE INDEX IF NOT EXISTS idx_gis_fetch_logs_layer_id ON public.gis_fetch_logs(layer_id);
CREATE INDEX IF NOT EXISTS idx_gis_fetch_logs_operation ON public.gis_fetch_logs(operation);
CREATE INDEX IF NOT EXISTS idx_gis_fetch_logs_status ON public.gis_fetch_logs(status);
CREATE INDEX IF NOT EXISTS idx_gis_fetch_logs_created_at ON public.gis_fetch_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transform_configs_layer_key ON public.transform_configs(layer_key);
CREATE INDEX IF NOT EXISTS idx_transform_configs_target_table ON public.transform_configs(target_table);
CREATE INDEX IF NOT EXISTS idx_transform_configs_enabled ON public.transform_configs(enabled);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE public.gis_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gis_layer_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gis_fetch_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transform_configs ENABLE ROW LEVEL SECURITY;

-- Public read access for GIS layers (metadata is public)
CREATE POLICY "Public read access for gis_layers"
  ON public.gis_layers FOR SELECT
  USING (true);

-- Service role write access
CREATE POLICY "Service role write for gis_layers"
  ON public.gis_layers FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Public read for layer versions
CREATE POLICY "Public read access for gis_layer_versions"
  ON public.gis_layer_versions FOR SELECT
  USING (true);

CREATE POLICY "Service role write for gis_layer_versions"
  ON public.gis_layer_versions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Fetch logs - service role only
CREATE POLICY "Service role access for gis_fetch_logs"
  ON public.gis_fetch_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Transform configs - public read, service write
CREATE POLICY "Public read access for transform_configs"
  ON public.transform_configs FOR SELECT
  USING (true);

CREATE POLICY "Service role write for transform_configs"
  ON public.transform_configs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- Triggers for updated_at
-- ============================================

CREATE TRIGGER update_gis_layers_updated_at
  BEFORE UPDATE ON public.gis_layers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transform_configs_updated_at
  BEFORE UPDATE ON public.transform_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Seed Houston GIS Layers
-- ============================================

INSERT INTO public.gis_layers (layer_key, display_name, provider, source_url, category, geometry_type, native_srid, status, update_policy, field_mappings) VALUES
  ('houston_parcels', 'Houston Parcels (HCAD)', 'Harris County Appraisal District', 'https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0', 'parcels', 'Polygon', 2278, 'active', '{"frequency": "weekly", "method": "etag"}', '{"ACCT_NUM": "parcel_id", "OWNER_NAME": "owner_name", "SITE_ADDR": "site_address", "LEGAL_DESC": "legal_description", "LAND_VAL": "land_value", "IMPR_VAL": "improvement_value", "TOT_VAL": "total_value", "ACRES": "acreage"}'),
  ('houston_sewer_lines', 'Houston Sewer Lines', 'Houston Water GIS', 'https://geogimstest.houstontx.gov/arcgis/rest/services/WastewaterUtilities/MapServer/24', 'utilities', 'LineString', 2278, 'active', '{"frequency": "daily", "method": "etag"}', '{"DIAMETER": "pipe_diameter", "MATERIAL": "pipe_material", "INSTALL_DATE": "install_date", "STATUS": "status"}'),
  ('houston_water_lines', 'Houston Water Lines', 'Houston Water GIS', 'https://geogimstest.houstontx.gov/arcgis/rest/services/WaterUtilities/MapServer/0', 'utilities', 'LineString', 2278, 'active', '{"frequency": "daily", "method": "etag"}', '{"DIAMETER": "pipe_diameter", "MATERIAL": "pipe_material", "PRESSURE": "pressure_psi", "STATUS": "status"}'),
  ('houston_storm_lines', 'Houston Storm Sewer', 'Houston Public Works', 'https://cohgis-mycity.opendata.arcgis.com/datasets/stormwater', 'utilities', 'LineString', 4326, 'active', '{"frequency": "weekly", "method": "etag"}', '{"PIPE_DIAMETER": "pipe_diameter", "PIPE_MATERIAL": "pipe_material", "INSTALL_YEAR": "install_date"}'),
  ('fema_flood_zones', 'FEMA Flood Zones (NFHL)', 'FEMA', 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28', 'flood', 'Polygon', 4326, 'active', '{"frequency": "monthly", "method": "etag"}', '{"FLD_ZONE": "flood_zone", "ZONE_SUBTY": "flood_zone_subtype", "STATIC_BFE": "base_flood_elevation", "FLOODWAY": "floodway_flag"}'),
  ('nwi_wetlands', 'National Wetlands Inventory', 'USFWS', 'https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0', 'wetlands', 'Polygon', 3857, 'active', '{"frequency": "quarterly", "method": "checksum"}', '{"ATTRIBUTE": "wetland_code", "WETLAND_TYPE": "wetland_type"}'),
  ('txdot_aadt', 'TxDOT Traffic Counts', 'TxDOT', 'https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/AADT/FeatureServer/0', 'transportation', 'Point', 4326, 'active', '{"frequency": "yearly", "method": "etag"}', '{"AADT_RPT_QTY": "aadt", "TRFC_STATN_ID": "station_id", "AADT_RPT_YEAR": "count_year", "ROAD_NAME": "road_name"}'),
  ('houston_zoning', 'Houston Land Use (No Zoning)', 'City of Houston', 'https://mycity.houstontx.gov/rest/services/LARA/MapServer/0', 'zoning', 'Polygon', 2278, 'active', '{"frequency": "monthly", "method": "etag"}', '{"LAND_USE_CODE": "zoning_code", "DESCRIPTION": "zoning_description"}'),
  ('fortbend_parcels', 'Fort Bend Parcels (FBCAD)', 'Fort Bend CAD', 'https://gisweb.fbcad.org/arcgis/rest/services/Hosted/FBCAD_Public_Data/FeatureServer/0', 'parcels', 'Polygon', 2278, 'active', '{"frequency": "weekly", "method": "etag"}', '{"propnumber": "parcel_id", "ownername": "owner_name", "situs": "site_address", "totalvalue": "total_value", "landvalue": "land_value"}'),
  ('montgomery_parcels', 'Montgomery Parcels (MCAD)', 'Montgomery CAD', 'https://gis.mctx.org/arcgis/rest/services/Parcels/MapServer/0', 'parcels', 'Polygon', 2278, 'active', '{"frequency": "weekly", "method": "etag"}', '{"PROP_ID": "parcel_id", "OWNER": "owner_name", "ADDRESS": "site_address", "MARKET_VAL": "total_value"}')
ON CONFLICT (layer_key) DO NOTHING;

-- ============================================
-- Seed Transform Configs
-- ============================================

INSERT INTO public.transform_configs (transform_id, layer_key, target_table, version, description, config, enabled) VALUES
  ('houston_parcels_to_canonical', 'houston_parcels', 'parcels_canonical', '1.0.0', 'Transform HCAD parcels to canonical schema', '{
    "source": {"layer_key": "houston_parcels", "geometry_field": "geometry"},
    "target": {"table": "parcels_canonical", "upsert_key": "source_id"},
    "geometry": {"reproject": {"from": 2278, "to": 3857}, "validate": true, "repair": true},
    "field_mappings": [
      {"source": "ACCT_NUM", "target": "parcel_id", "transform": "trim"},
      {"source": "OWNER_NAME", "target": "owner_name", "transform": "uppercase"},
      {"source": "SITE_ADDR", "target": "site_address", "transform": "trim"},
      {"source": "LEGAL_DESC", "target": "legal_description", "transform": "trim"},
      {"source": "ACRES", "target": "acreage", "transform": "parse_float"},
      {"source": "TOT_VAL", "target": "total_value", "transform": "parse_int"},
      {"source": "LAND_VAL", "target": "land_value", "transform": "parse_int"}
    ],
    "constants": {"jurisdiction": "Harris County", "state": "TX", "source_dataset": "houston_parcels"},
    "deduplication": {"strategy": "keep_latest", "key": "parcel_id"}
  }', true),
  
  ('houston_sewer_to_canonical', 'houston_sewer_lines', 'utilities_canonical', '1.0.0', 'Transform Houston sewer to utilities canonical', '{
    "source": {"layer_key": "houston_sewer_lines", "geometry_field": "geometry"},
    "target": {"table": "utilities_canonical", "upsert_key": "source_id"},
    "geometry": {"reproject": {"from": 2278, "to": 3857}, "validate": true},
    "field_mappings": [
      {"source": "DIAMETER", "target": "pipe_diameter", "transform": "parse_float"},
      {"source": "MATERIAL", "target": "pipe_material", "transform": "uppercase"},
      {"source": "INSTALL_DATE", "target": "install_date", "transform": "parse_date"},
      {"source": "STATUS", "target": "status", "transform": "lowercase"}
    ],
    "constants": {"utility_type": "sewer", "jurisdiction": "Houston", "source_dataset": "houston_sewer_lines"}
  }', true),
  
  ('houston_water_to_canonical', 'houston_water_lines', 'utilities_canonical', '1.0.0', 'Transform Houston water to utilities canonical', '{
    "source": {"layer_key": "houston_water_lines", "geometry_field": "geometry"},
    "target": {"table": "utilities_canonical", "upsert_key": "source_id"},
    "geometry": {"reproject": {"from": 2278, "to": 3857}, "validate": true},
    "field_mappings": [
      {"source": "DIAMETER", "target": "pipe_diameter", "transform": "parse_float"},
      {"source": "MATERIAL", "target": "pipe_material", "transform": "uppercase"},
      {"source": "PRESSURE", "target": "pressure_psi", "transform": "parse_float"},
      {"source": "STATUS", "target": "status", "transform": "lowercase"}
    ],
    "constants": {"utility_type": "water", "jurisdiction": "Houston", "source_dataset": "houston_water_lines"}
  }', true),
  
  ('fema_flood_to_canonical', 'fema_flood_zones', 'fema_flood_canonical', '1.0.0', 'Transform FEMA NFHL to flood canonical', '{
    "source": {"layer_key": "fema_flood_zones", "geometry_field": "geometry"},
    "target": {"table": "fema_flood_canonical", "upsert_key": "source_id"},
    "geometry": {"reproject": {"from": 4326, "to": 3857}, "validate": true},
    "field_mappings": [
      {"source": "FLD_ZONE", "target": "flood_zone", "transform": "uppercase"},
      {"source": "ZONE_SUBTY", "target": "flood_zone_subtype", "transform": "uppercase"},
      {"source": "STATIC_BFE", "target": "static_bfe", "transform": "parse_float"},
      {"source": "FLOODWAY", "target": "floodway_flag", "transform": "parse_bool"}
    ],
    "constants": {"source_dataset": "fema_flood_zones"}
  }', true),
  
  ('nwi_wetlands_to_canonical', 'nwi_wetlands', 'wetlands_canonical', '1.0.0', 'Transform NWI to wetlands canonical', '{
    "source": {"layer_key": "nwi_wetlands", "geometry_field": "geometry"},
    "target": {"table": "wetlands_canonical", "upsert_key": "source_id"},
    "geometry": {"reproject": {"from": 3857, "to": 3857}, "validate": true},
    "field_mappings": [
      {"source": "ATTRIBUTE", "target": "wetland_code", "transform": "uppercase"},
      {"source": "WETLAND_TYPE", "target": "wetland_type", "transform": "trim"}
    ],
    "constants": {"source_dataset": "nwi_wetlands"}
  }', true),
  
  ('txdot_aadt_to_canonical', 'txdot_aadt', 'transportation_canonical', '1.0.0', 'Transform TxDOT AADT to transportation canonical', '{
    "source": {"layer_key": "txdot_aadt", "geometry_field": "geometry"},
    "target": {"table": "transportation_canonical", "upsert_key": "source_id"},
    "geometry": {"reproject": {"from": 4326, "to": 3857}, "validate": true},
    "field_mappings": [
      {"source": "AADT_RPT_QTY", "target": "aadt", "transform": "parse_int"},
      {"source": "TRFC_STATN_ID", "target": "station_id", "transform": "trim"},
      {"source": "AADT_RPT_YEAR", "target": "count_year", "transform": "parse_int"},
      {"source": "ROAD_NAME", "target": "road_name", "transform": "uppercase"}
    ],
    "constants": {"source_dataset": "txdot_aadt", "road_type": "state_highway"}
  }', true)
ON CONFLICT (transform_id) DO NOTHING;