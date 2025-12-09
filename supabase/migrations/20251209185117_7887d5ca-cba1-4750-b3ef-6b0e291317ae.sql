-- Create canonical_schemas table for formal schema definitions
CREATE TABLE IF NOT EXISTS public.canonical_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_family TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_table TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  schema_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create unique constraint for active schema per family
CREATE UNIQUE INDEX IF NOT EXISTS idx_canonical_schemas_active_family 
ON public.canonical_schemas (dataset_family, version) WHERE is_active = true;

-- Create etl_runs table for tracking ETL execution history
CREATE TABLE IF NOT EXISTS public.etl_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gis_layer_id UUID REFERENCES public.gis_layers(id),
  transform_config_id UUID REFERENCES public.transform_configs(id),
  canonical_schema_id UUID REFERENCES public.canonical_schemas(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  rows_extracted INTEGER DEFAULT 0,
  rows_transformed INTEGER DEFAULT 0,
  rows_loaded INTEGER DEFAULT 0,
  rows_failed INTEGER DEFAULT 0,
  error_message TEXT,
  error_details JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  triggered_by TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for etl_runs
CREATE INDEX IF NOT EXISTS idx_etl_runs_status ON public.etl_runs(status);
CREATE INDEX IF NOT EXISTS idx_etl_runs_started_at ON public.etl_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_etl_runs_gis_layer_id ON public.etl_runs(gis_layer_id);
CREATE INDEX IF NOT EXISTS idx_etl_runs_transform_config_id ON public.etl_runs(transform_config_id);

-- Add canonical_schema_id to transform_configs if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transform_configs' 
    AND column_name = 'canonical_schema_id'
  ) THEN
    ALTER TABLE public.transform_configs 
    ADD COLUMN canonical_schema_id UUID REFERENCES public.canonical_schemas(id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.canonical_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etl_runs ENABLE ROW LEVEL SECURITY;

-- RLS policies for canonical_schemas using has_role function
CREATE POLICY "Public read access to canonical_schemas"
ON public.canonical_schemas FOR SELECT
USING (true);

CREATE POLICY "Admins can manage canonical_schemas"
ON public.canonical_schemas FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for etl_runs using has_role function
CREATE POLICY "Authenticated users can view etl_runs"
ON public.etl_runs FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage etl_runs"
ON public.etl_runs FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage etl_runs"
ON public.etl_runs FOR ALL
USING (auth.role() = 'service_role');

-- Seed canonical schemas for existing tables
INSERT INTO public.canonical_schemas (dataset_family, name, target_table, version, description, schema_json)
VALUES 
  ('parcels', 'Parcels Canonical Schema', 'parcels_canonical', '1.0.0', 'Unified parcel data from CAD sources', '{"required_fields": ["parcel_id", "geom", "county"], "geometry_type": "MultiPolygon"}'),
  ('zoning', 'Zoning Canonical Schema', 'zoning_canonical', '1.0.0', 'Zoning districts and regulations', '{"required_fields": ["zone_code", "geom"], "geometry_type": "MultiPolygon"}'),
  ('flood', 'FEMA Flood Canonical Schema', 'fema_flood_canonical', '1.0.0', 'FEMA flood zones and BFE data', '{"required_fields": ["flood_zone", "geom"], "geometry_type": "MultiPolygon"}'),
  ('wetlands', 'Wetlands Canonical Schema', 'wetlands_canonical', '1.0.0', 'NWI wetlands data', '{"required_fields": ["wetland_type", "geom"], "geometry_type": "MultiPolygon"}'),
  ('utilities', 'Utilities Canonical Schema', 'utilities_canonical', '1.0.0', 'Water, sewer, storm infrastructure', '{"required_fields": ["utility_type", "geom"], "geometry_type": "MultiLineString"}'),
  ('transportation', 'Transportation Canonical Schema', 'transportation_canonical', '1.0.0', 'Roads and traffic data', '{"required_fields": ["road_name", "geom"], "geometry_type": "MultiLineString"}'),
  ('pipelines', 'Pipelines Canonical Schema', 'pipelines_canonical', '1.0.0', 'RRC pipeline infrastructure', '{"required_fields": ["pipeline_type", "geom"], "geometry_type": "MultiLineString"}'),
  ('broadband', 'Broadband Canonical Schema', 'broadband_coverage_canonical', '1.0.0', 'FCC broadband coverage', '{"required_fields": ["provider_name", "geom"], "geometry_type": "MultiPolygon"}')
ON CONFLICT DO NOTHING;

-- Add updated_at trigger for canonical_schemas
CREATE OR REPLACE FUNCTION public.update_canonical_schemas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_canonical_schemas_updated_at ON public.canonical_schemas;
CREATE TRIGGER update_canonical_schemas_updated_at
  BEFORE UPDATE ON public.canonical_schemas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_canonical_schemas_updated_at();