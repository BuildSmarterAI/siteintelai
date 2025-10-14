-- Phase 1: Foundation & Infrastructure
-- Enable spatial and vector extensions

-- Step 1: Enable Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Feature Flags Table
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  user_whitelist UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage feature flags"
  ON public.feature_flags FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view feature flags"
  ON public.feature_flags FOR SELECT
  USING (true);

-- Insert flags (all disabled by default)
INSERT INTO public.feature_flags (flag_name, description, enabled) VALUES
  ('draw_parcel_tool', 'Enable polygon drawing and parcel assemblage', false),
  ('ai_feasibility_v2', 'Enhanced AI scoring with cost/schedule datasets', false),
  ('3d_visualization', 'Enable 3D massing models', false),
  ('portfolio_dashboard', 'Multi-report portfolio analytics', false),
  ('odata_api_access', 'Read-only OData API for partners', false);

-- Step 3: Drawn Parcels Table (PostGIS)
CREATE TABLE public.drawn_parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  geometry GEOMETRY(Polygon, 4326) NOT NULL,
  acreage_calc NUMERIC GENERATED ALWAYS AS (
    ST_Area(ST_Transform(geometry, 2278)) / 43560.0
  ) STORED,
  source TEXT DEFAULT 'user_drawn',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_drawn_parcels_geom ON public.drawn_parcels USING GIST(geometry);

ALTER TABLE public.drawn_parcels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own drawn parcels"
  ON public.drawn_parcels FOR ALL
  USING (auth.uid() = user_id);

-- Step 4: 3D Visualization Cache Table
CREATE TABLE public.visualization_cache_3d (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  scenario_name TEXT NOT NULL,
  building_model JSONB NOT NULL,
  rendering_params JSONB,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(application_id, scenario_name)
);

ALTER TABLE public.visualization_cache_3d ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own 3D visualizations"
  ON public.visualization_cache_3d FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM public.applications WHERE user_id = auth.uid()
    )
  );

-- Step 5: Cost & Schedule Data Table
CREATE TABLE public.cost_schedule_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_type TEXT NOT NULL,
  quality_level TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'houston',
  cost_per_sqft NUMERIC NOT NULL,
  permitting_timeline_months NUMERIC NOT NULL,
  complexity_factor NUMERIC DEFAULT 1.0,
  data_source TEXT NOT NULL,
  effective_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_type, quality_level, region, effective_date)
);

ALTER TABLE public.cost_schedule_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to cost data"
  ON public.cost_schedule_data FOR SELECT
  USING (true);

-- Seed with RSMeans 2025 Houston benchmarks
INSERT INTO public.cost_schedule_data 
(project_type, quality_level, region, cost_per_sqft, permitting_timeline_months, data_source, effective_date)
VALUES
  ('retail', 'standard', 'houston', 185.00, 6.5, 'RSMeans 2025 Texas Metro', '2025-01-01'),
  ('retail', 'class_a', 'houston', 280.00, 8.0, 'RSMeans 2025 Texas Metro', '2025-01-01'),
  ('office', 'standard', 'houston', 225.00, 7.0, 'RSMeans 2025 Texas Metro', '2025-01-01'),
  ('office', 'class_a', 'houston', 350.00, 9.5, 'RSMeans 2025 Texas Metro', '2025-01-01'),
  ('industrial', 'tilt_up', 'houston', 95.00, 5.0, 'RSMeans 2025 Texas Metro', '2025-01-01'),
  ('multifamily', 'garden_style', 'houston', 165.00, 8.5, 'RSMeans 2025 Texas Metro', '2025-01-01'),
  ('multifamily', 'mid_rise', 'houston', 245.00, 12.0, 'RSMeans 2025 Texas Metro', '2025-01-01');

-- Step 6: PostGIS Helper Function
CREATE OR REPLACE FUNCTION public.calculate_acreage(geom GEOMETRY)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN ST_Area(ST_Transform(geom, 2278)) / 43560.0;
END;
$$;