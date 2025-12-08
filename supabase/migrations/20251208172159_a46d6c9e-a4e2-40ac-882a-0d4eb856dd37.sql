-- =====================================================
-- Phase 1: Data Moat Infrastructure Migration
-- Creates map_servers, map_server_layers, gis_coverage_events
-- and adds moat columns to applications table
-- =====================================================

-- 1. Create map_servers table (GIS endpoint registry)
CREATE TABLE public.map_servers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  server_key TEXT NOT NULL UNIQUE,
  jurisdiction TEXT NOT NULL,
  provider TEXT NOT NULL,
  base_url TEXT NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'arcgis_rest',
  version TEXT,
  spatial_reference INTEGER DEFAULT 4326,
  max_record_count INTEGER DEFAULT 1000,
  supports_pagination BOOLEAN DEFAULT true,
  supports_geojson BOOLEAN DEFAULT true,
  auth_required BOOLEAN DEFAULT false,
  auth_config JSONB DEFAULT '{}'::jsonb,
  health_status TEXT DEFAULT 'unknown',
  last_health_check TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency_hours INTEGER DEFAULT 24,
  priority INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Create map_server_layers table (layer metadata with field mappings)
CREATE TABLE public.map_server_layers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  map_server_id UUID NOT NULL REFERENCES public.map_servers(id) ON DELETE CASCADE,
  layer_key TEXT NOT NULL,
  layer_id INTEGER NOT NULL,
  layer_name TEXT NOT NULL,
  layer_type TEXT NOT NULL DEFAULT 'feature',
  geometry_type TEXT,
  canonical_type TEXT NOT NULL,
  description TEXT,
  field_mappings JSONB NOT NULL DEFAULT '{}'::jsonb,
  query_fields TEXT[] DEFAULT '{}',
  display_field TEXT,
  min_scale NUMERIC,
  max_scale NUMERIC,
  supports_query BOOLEAN DEFAULT true,
  supports_statistics BOOLEAN DEFAULT false,
  dataset_version TEXT,
  last_data_update TIMESTAMP WITH TIME ZONE,
  record_count INTEGER,
  coverage_geometry GEOMETRY(MultiPolygon, 4326),
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 50,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(map_server_id, layer_id)
);

-- 3. Create gis_coverage_events table (coverage gap logging)
CREATE TABLE public.gis_coverage_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  missing_layer_type TEXT,
  requested_canonical_type TEXT,
  location GEOMETRY(Point, 4326),
  location_context JSONB DEFAULT '{}'::jsonb,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  user_id UUID,
  resolution_status TEXT DEFAULT 'pending',
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  resolution_notes TEXT,
  priority INTEGER DEFAULT 50,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Add moat columns to applications table
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS parcel_source TEXT,
ADD COLUMN IF NOT EXISTS mapserver_key TEXT,
ADD COLUMN IF NOT EXISTS layer_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dataset_version TEXT,
ADD COLUMN IF NOT EXISTS tile_cache_hit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS coverage_flags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS gis_provenance JSONB DEFAULT '{}'::jsonb;

-- 5. Create indexes for map_servers
CREATE INDEX idx_map_servers_jurisdiction ON public.map_servers(jurisdiction);
CREATE INDEX idx_map_servers_server_key ON public.map_servers(server_key);
CREATE INDEX idx_map_servers_is_active ON public.map_servers(is_active) WHERE is_active = true;
CREATE INDEX idx_map_servers_health_status ON public.map_servers(health_status);

-- 6. Create indexes for map_server_layers
CREATE INDEX idx_map_server_layers_server_id ON public.map_server_layers(map_server_id);
CREATE INDEX idx_map_server_layers_canonical_type ON public.map_server_layers(canonical_type);
CREATE INDEX idx_map_server_layers_layer_key ON public.map_server_layers(layer_key);
CREATE INDEX idx_map_server_layers_is_active ON public.map_server_layers(is_active) WHERE is_active = true;
CREATE INDEX idx_map_server_layers_coverage ON public.map_server_layers USING GIST (coverage_geometry);

-- 7. Create indexes for gis_coverage_events
CREATE INDEX idx_gis_coverage_events_jurisdiction ON public.gis_coverage_events(jurisdiction);
CREATE INDEX idx_gis_coverage_events_event_type ON public.gis_coverage_events(event_type);
CREATE INDEX idx_gis_coverage_events_resolution_status ON public.gis_coverage_events(resolution_status);
CREATE INDEX idx_gis_coverage_events_created_at ON public.gis_coverage_events(created_at DESC);
CREATE INDEX idx_gis_coverage_events_location ON public.gis_coverage_events USING GIST (location);
CREATE INDEX idx_gis_coverage_events_application ON public.gis_coverage_events(application_id) WHERE application_id IS NOT NULL;

-- 8. Create indexes for applications moat columns
CREATE INDEX idx_applications_parcel_source ON public.applications(parcel_source) WHERE parcel_source IS NOT NULL;
CREATE INDEX idx_applications_mapserver_key ON public.applications(mapserver_key) WHERE mapserver_key IS NOT NULL;
CREATE INDEX idx_applications_coverage_flags ON public.applications USING GIN (coverage_flags);

-- 9. Enable RLS on new tables
ALTER TABLE public.map_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_server_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gis_coverage_events ENABLE ROW LEVEL SECURITY;

-- 10. RLS policies for map_servers (public read, admin write)
CREATE POLICY "Public read access to map_servers" 
  ON public.map_servers FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage map_servers" 
  ON public.map_servers FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 11. RLS policies for map_server_layers (public read, admin write)
CREATE POLICY "Public read access to map_server_layers" 
  ON public.map_server_layers FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage map_server_layers" 
  ON public.map_server_layers FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 12. RLS policies for gis_coverage_events
CREATE POLICY "Service can insert coverage events" 
  ON public.gis_coverage_events FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can view all coverage events" 
  ON public.gis_coverage_events FOR SELECT 
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update coverage events" 
  ON public.gis_coverage_events FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 13. Update trigger for map_servers
CREATE TRIGGER update_map_servers_updated_at
  BEFORE UPDATE ON public.map_servers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Update trigger for map_server_layers
CREATE TRIGGER update_map_server_layers_updated_at
  BEFORE UPDATE ON public.map_server_layers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- SEED DATA: Houston GIS Map Servers
-- =====================================================

INSERT INTO public.map_servers (server_key, jurisdiction, provider, base_url, service_type, version, spatial_reference, metadata) VALUES
-- Parcels
('houston_hcad_parcels', 'houston', 'Houston Water GIS', 'https://houstonwatergis.org/arcgis/rest/services/ICBASEMAP/HCADParcels/MapServer', 'arcgis_mapserver', '10.91', 2278, '{"category": "parcels", "source": "HCAD"}'),
('houston_address_parcels_fs', 'houston', 'Houston Water GIS', 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/AddressPtsAndParcelsIPS/FeatureServer', 'arcgis_featureserver', '10.91', 2278, '{"category": "parcels", "source": "HPW"}'),
('houston_address_parcels_ms', 'houston', 'Houston Water GIS', 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/AddressPtsAndParcelsIPS/MapServer', 'arcgis_mapserver', '10.91', 2278, '{"category": "parcels", "source": "HPW"}'),

-- Basemap
('houston_icbm', 'houston', 'Houston Water GIS', 'https://houstonwatergis.org/arcgis/rest/services/ICBASEMAP/ICBM/MapServer', 'arcgis_mapserver', '10.91', 2278, '{"category": "basemap", "layers": 18}'),

-- Stormwater
('houston_stormdrain_lines', 'houston', 'Houston Public Works', 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/HPWStormdrainLineIPS/MapServer', 'arcgis_mapserver', '10.91', 2278, '{"category": "stormwater", "utility_type": "storm"}'),
('houston_stormdrain_manholes', 'houston', 'Houston Public Works', 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/HPWStormdrainManholesIPS/MapServer', 'arcgis_mapserver', '10.91', 2278, '{"category": "stormwater", "utility_type": "storm"}'),

-- Water
('houston_water_devices', 'houston', 'Houston Water', 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWWaterDeviceIPS/MapServer', 'arcgis_mapserver', '10.91', 2278, '{"category": "water", "utility_type": "water"}'),
('houston_water_lines', 'houston', 'Houston Water', 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWWaterLineIPS/MapServer', 'arcgis_mapserver', '10.91', 2278, '{"category": "water", "utility_type": "water"}'),
('houston_water_aband_devices', 'houston', 'Houston Water', 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWAbanWaterDeviceIPS/MapServer', 'arcgis_mapserver', '10.91', 2278, '{"category": "water", "utility_type": "water", "status": "abandoned"}'),
('houston_water_aband_lines', 'houston', 'Houston Water', 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWAbanWaterLineIPS/MapServer', 'arcgis_mapserver', '10.91', 2278, '{"category": "water", "utility_type": "water", "status": "abandoned"}'),

-- Wastewater
('houston_wastewater_devices', 'houston', 'Houston Water', 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWWastewaterDeviceIPS/MapServer', 'arcgis_mapserver', '10.91', 2278, '{"category": "wastewater", "utility_type": "sewer"}'),
('houston_wastewater_lines', 'houston', 'Houston Water', 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWWastewaterLineIPS/MapServer', 'arcgis_mapserver', '10.91', 2278, '{"category": "wastewater", "utility_type": "sewer"}'),
('houston_wastewater_anno', 'houston', 'Houston Water', 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWWastewaterAnnoIPS/MapServer', 'arcgis_mapserver', '10.91', 2278, '{"category": "wastewater", "utility_type": "sewer", "layer_type": "annotation"}'),
('houston_wastewater_aband_devices', 'houston', 'Houston Water', 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWAbanWastewaterDeviceIPS/MapServer', 'arcgis_mapserver', '10.91', 2278, '{"category": "wastewater", "utility_type": "sewer", "status": "abandoned"}'),
('houston_wastewater_aband_lines', 'houston', 'Houston Water', 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWAbanWastewaterLineIPS/MapServer', 'arcgis_mapserver', '10.91', 2278, '{"category": "wastewater", "utility_type": "sewer", "status": "abandoned"}');

-- =====================================================
-- SEED DATA: Houston GIS Layers
-- =====================================================

-- Insert layers for HCAD Parcels
INSERT INTO public.map_server_layers (map_server_id, layer_key, layer_id, layer_name, layer_type, geometry_type, canonical_type, field_mappings, query_fields, description)
SELECT 
  id, 
  'houston_hcad_parcels_0', 
  0, 
  'HCAD Parcels', 
  'feature', 
  'Polygon', 
  'parcel',
  '{
    "parcel_id": "HCAD_NUM",
    "owner_name": "OWNER",
    "situs_address": "SITE_ADDR",
    "acreage": "ACREAGE",
    "land_value": "LAND_VAL",
    "improvement_value": "IMPR_VAL",
    "total_value": "TOT_VAL",
    "land_use_code": "STATE_CLASS"
  }'::jsonb,
  ARRAY['HCAD_NUM', 'OWNER', 'SITE_ADDR', 'ACREAGE', 'LAND_VAL', 'IMPR_VAL', 'TOT_VAL', 'STATE_CLASS'],
  'Harris County Appraisal District parcel boundaries with ownership and valuation'
FROM public.map_servers WHERE server_key = 'houston_hcad_parcels';

-- Insert layers for Address Points
INSERT INTO public.map_server_layers (map_server_id, layer_key, layer_id, layer_name, layer_type, geometry_type, canonical_type, field_mappings, query_fields, description)
SELECT 
  id, 
  'houston_address_points', 
  0, 
  'Address Points', 
  'feature', 
  'Point', 
  'address_point',
  '{
    "full_address": "FULLADDR",
    "house_number": "ADDRNUM",
    "street_name": "ST_NAME",
    "city": "CITY",
    "zip": "ZIP"
  }'::jsonb,
  ARRAY['FULLADDR', 'ADDRNUM', 'ST_NAME', 'CITY', 'ZIP'],
  'Address points for geocoding and address validation'
FROM public.map_servers WHERE server_key = 'houston_address_parcels_ms';

-- Insert layers for Stormdrain Lines
INSERT INTO public.map_server_layers (map_server_id, layer_key, layer_id, layer_name, layer_type, geometry_type, canonical_type, field_mappings, query_fields, description)
SELECT 
  id, 
  'houston_stormdrain_lines_0', 
  0, 
  'Storm Drain Lines', 
  'feature', 
  'Polyline', 
  'storm_line',
  '{
    "pipe_diameter": "DIAMETER",
    "pipe_material": "MATERIAL",
    "install_year": "INSTALL_YR",
    "flow_direction": "FLOW_DIR"
  }'::jsonb,
  ARRAY['DIAMETER', 'MATERIAL', 'INSTALL_YR', 'FLOW_DIR'],
  'Storm drainage pipe network'
FROM public.map_servers WHERE server_key = 'houston_stormdrain_lines';

-- Insert layers for Stormdrain Manholes
INSERT INTO public.map_server_layers (map_server_id, layer_key, layer_id, layer_name, layer_type, geometry_type, canonical_type, field_mappings, query_fields, description)
SELECT 
  id, 
  'houston_stormdrain_manholes_0', 
  0, 
  'Storm Drain Manholes', 
  'feature', 
  'Point', 
  'storm_device',
  '{
    "manhole_type": "MH_TYPE",
    "rim_elevation": "RIM_ELEV",
    "invert_elevation": "INV_ELEV"
  }'::jsonb,
  ARRAY['MH_TYPE', 'RIM_ELEV', 'INV_ELEV'],
  'Storm drainage manholes and access points'
FROM public.map_servers WHERE server_key = 'houston_stormdrain_manholes';

-- Insert layers for Wastewater Lines
INSERT INTO public.map_server_layers (map_server_id, layer_key, layer_id, layer_name, layer_type, geometry_type, canonical_type, field_mappings, query_fields, description)
SELECT 
  id, 
  'houston_wastewater_lines_0', 
  0, 
  'Sanitary Sewer Lines', 
  'feature', 
  'Polyline', 
  'sewer_line',
  '{
    "pipe_diameter": "DIAMETER",
    "pipe_material": "MATERIAL",
    "install_year": "INSTALL_YR",
    "pipe_type": "PIPE_TYPE"
  }'::jsonb,
  ARRAY['DIAMETER', 'MATERIAL', 'INSTALL_YR', 'PIPE_TYPE'],
  'Sanitary sewer gravity mains'
FROM public.map_servers WHERE server_key = 'houston_wastewater_lines';

-- Insert layers for Wastewater Devices (multiple layers)
INSERT INTO public.map_server_layers (map_server_id, layer_key, layer_id, layer_name, layer_type, geometry_type, canonical_type, field_mappings, description)
SELECT 
  id,
  'houston_wastewater_manholes',
  0,
  'Sewer Manholes',
  'feature',
  'Point',
  'sewer_device',
  '{"device_type": "TYPE", "rim_elevation": "RIM_ELEV", "invert_elevation": "INV_ELEV"}'::jsonb,
  'Sanitary sewer manholes'
FROM public.map_servers WHERE server_key = 'houston_wastewater_devices';

INSERT INTO public.map_server_layers (map_server_id, layer_key, layer_id, layer_name, layer_type, geometry_type, canonical_type, field_mappings, description)
SELECT 
  id,
  'houston_wastewater_cleanouts',
  1,
  'Sewer Cleanouts',
  'feature',
  'Point',
  'sewer_device',
  '{"device_type": "TYPE"}'::jsonb,
  'Sanitary sewer cleanouts'
FROM public.map_servers WHERE server_key = 'houston_wastewater_devices';

INSERT INTO public.map_server_layers (map_server_id, layer_key, layer_id, layer_name, layer_type, geometry_type, canonical_type, field_mappings, description)
SELECT 
  id,
  'houston_wastewater_lift_stations',
  3,
  'Lift Stations',
  'feature',
  'Point',
  'sewer_device',
  '{"station_name": "NAME", "capacity": "CAPACITY"}'::jsonb,
  'Sanitary sewer lift stations'
FROM public.map_servers WHERE server_key = 'houston_wastewater_devices';

-- Insert layers for Water Lines
INSERT INTO public.map_server_layers (map_server_id, layer_key, layer_id, layer_name, layer_type, geometry_type, canonical_type, field_mappings, query_fields, description)
SELECT 
  id, 
  'houston_water_lines_0', 
  0, 
  'Water Mains', 
  'feature', 
  'Polyline', 
  'water_line',
  '{
    "pipe_diameter": "DIAMETER",
    "pipe_material": "MATERIAL",
    "install_year": "INSTALL_YR",
    "pressure_zone": "PRESS_ZONE"
  }'::jsonb,
  ARRAY['DIAMETER', 'MATERIAL', 'INSTALL_YR', 'PRESS_ZONE'],
  'Water distribution mains'
FROM public.map_servers WHERE server_key = 'houston_water_lines';

-- Insert layers for Water Devices
INSERT INTO public.map_server_layers (map_server_id, layer_key, layer_id, layer_name, layer_type, geometry_type, canonical_type, field_mappings, description)
SELECT 
  id,
  'houston_water_valves',
  0,
  'Water Valves',
  'feature',
  'Point',
  'water_device',
  '{"valve_type": "TYPE", "size": "SIZE"}'::jsonb,
  'Water system valves'
FROM public.map_servers WHERE server_key = 'houston_water_devices';

INSERT INTO public.map_server_layers (map_server_id, layer_key, layer_id, layer_name, layer_type, geometry_type, canonical_type, field_mappings, description)
SELECT 
  id,
  'houston_fire_hydrants',
  1,
  'Fire Hydrants',
  'feature',
  'Point',
  'water_device',
  '{"hydrant_type": "TYPE", "flow_rate": "FLOW"}'::jsonb,
  'Fire hydrants'
FROM public.map_servers WHERE server_key = 'houston_water_devices';

-- Insert ICBM basemap layers
INSERT INTO public.map_server_layers (map_server_id, layer_key, layer_id, layer_name, layer_type, geometry_type, canonical_type, description)
SELECT id, 'houston_icbm_boundaries', 0, 'City Boundaries', 'feature', 'Polygon', 'boundary', 'City and jurisdiction boundaries'
FROM public.map_servers WHERE server_key = 'houston_icbm';

INSERT INTO public.map_server_layers (map_server_id, layer_key, layer_id, layer_name, layer_type, geometry_type, canonical_type, description)
SELECT id, 'houston_icbm_streets', 1, 'Streets', 'feature', 'Polyline', 'street', 'Street centerlines'
FROM public.map_servers WHERE server_key = 'houston_icbm';

INSERT INTO public.map_server_layers (map_server_id, layer_key, layer_id, layer_name, layer_type, geometry_type, canonical_type, description)
SELECT id, 'houston_icbm_water_bodies', 2, 'Water Bodies', 'feature', 'Polygon', 'hydrology', 'Lakes, ponds, and water features'
FROM public.map_servers WHERE server_key = 'houston_icbm';

INSERT INTO public.map_server_layers (map_server_id, layer_key, layer_id, layer_name, layer_type, geometry_type, canonical_type, description)
SELECT id, 'houston_icbm_railroads', 3, 'Railroads', 'feature', 'Polyline', 'transportation', 'Railroad tracks'
FROM public.map_servers WHERE server_key = 'houston_icbm';