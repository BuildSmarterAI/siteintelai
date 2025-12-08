-- ===========================================
-- Phase A: Vector Tile Pipeline Database Extensions
-- Creates tilesets catalog and tile_jobs tracking tables
-- ===========================================

-- Create tile job status enum
CREATE TYPE public.tile_job_status AS ENUM (
  'queued',
  'fetching',
  'normalizing',
  'tiling',
  'uploading',
  'registering',
  'complete',
  'error',
  'cancelled'
);

-- Create tile job type enum
CREATE TYPE public.tile_job_type AS ENUM (
  'full',
  'incremental',
  'repair'
);

-- Create tileset category enum
CREATE TYPE public.tileset_category AS ENUM (
  'parcels',
  'zoning',
  'flood',
  'utilities',
  'environmental',
  'transportation',
  'jurisdiction',
  'topography',
  'addressing',
  'demographics',
  'other'
);

-- ===========================================
-- TILESETS TABLE - Tile Catalog
-- ===========================================
CREATE TABLE public.tilesets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tileset_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category tileset_category NOT NULL DEFAULT 'other',
  jurisdiction TEXT NOT NULL,
  
  -- Tile serving configuration
  tile_url_template TEXT NOT NULL,
  min_zoom INTEGER NOT NULL DEFAULT 4,
  max_zoom INTEGER NOT NULL DEFAULT 16,
  bounds JSONB, -- [minLng, minLat, maxLng, maxLat]
  center JSONB, -- [lng, lat, zoom]
  
  -- Source tracking (links to map_servers)
  source_map_server_id UUID REFERENCES public.map_servers(id) ON DELETE SET NULL,
  source_layer_ids TEXT[] DEFAULT '{}',
  source_version TEXT,
  
  -- Vector layer metadata
  vector_layers JSONB DEFAULT '[]', -- Array of {id, fields, minzoom, maxzoom}
  attribution TEXT,
  
  -- Statistics
  record_count INTEGER,
  tile_count INTEGER,
  size_bytes BIGINT,
  
  -- Lifecycle
  is_active BOOLEAN NOT NULL DEFAULT true,
  generated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  refresh_frequency_hours INTEGER DEFAULT 168, -- Weekly default
  
  -- Tippecanoe options used
  tippecanoe_options JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===========================================
-- TILE_JOBS TABLE - ETL Job Tracking
-- ===========================================
CREATE TABLE public.tile_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tileset_key TEXT NOT NULL,
  job_type tile_job_type NOT NULL DEFAULT 'full',
  status tile_job_status NOT NULL DEFAULT 'queued',
  
  -- Source configuration
  source_map_server_id UUID REFERENCES public.map_servers(id) ON DELETE SET NULL,
  source_layer_ids TEXT[] DEFAULT '{}',
  fetch_bbox JSONB, -- Optional bounding box filter
  fetch_where TEXT, -- Optional SQL WHERE clause
  
  -- Processing metrics
  input_records INTEGER,
  output_tiles INTEGER,
  
  -- File paths (S3 or local)
  raw_file_path TEXT,
  normalized_file_path TEXT,
  mbtiles_path TEXT,
  s3_prefix TEXT,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE,
  fetch_completed_at TIMESTAMP WITH TIME ZONE,
  normalize_completed_at TIMESTAMP WITH TIME ZONE,
  tile_completed_at TIMESTAMP WITH TIME ZONE,
  upload_completed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  
  -- Tippecanoe configuration
  tippecanoe_options JSONB DEFAULT '{}',
  
  -- Error handling
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Worker info
  worker_id TEXT,
  worker_type TEXT, -- 'github_actions', 'lambda', 'ec2'
  
  -- Triggered by
  triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trigger_type TEXT DEFAULT 'manual', -- 'manual', 'scheduled', 'webhook'
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===========================================
-- INDEXES
-- ===========================================

-- Tilesets indexes
CREATE INDEX idx_tilesets_key ON public.tilesets(tileset_key);
CREATE INDEX idx_tilesets_category ON public.tilesets(category);
CREATE INDEX idx_tilesets_jurisdiction ON public.tilesets(jurisdiction);
CREATE INDEX idx_tilesets_active ON public.tilesets(is_active) WHERE is_active = true;
CREATE INDEX idx_tilesets_source_server ON public.tilesets(source_map_server_id);
CREATE INDEX idx_tilesets_refresh ON public.tilesets(generated_at, refresh_frequency_hours) 
  WHERE is_active = true;

-- Tile jobs indexes
CREATE INDEX idx_tile_jobs_tileset ON public.tile_jobs(tileset_key);
CREATE INDEX idx_tile_jobs_status ON public.tile_jobs(status);
CREATE INDEX idx_tile_jobs_queued ON public.tile_jobs(created_at) 
  WHERE status = 'queued';
CREATE INDEX idx_tile_jobs_active ON public.tile_jobs(status, started_at) 
  WHERE status NOT IN ('complete', 'error', 'cancelled');
CREATE INDEX idx_tile_jobs_source ON public.tile_jobs(source_map_server_id);
CREATE INDEX idx_tile_jobs_triggered_by ON public.tile_jobs(triggered_by);

-- ===========================================
-- TRIGGERS
-- ===========================================

-- Auto-update updated_at for tilesets
CREATE TRIGGER update_tilesets_updated_at
  BEFORE UPDATE ON public.tilesets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at for tile_jobs
CREATE TRIGGER update_tile_jobs_updated_at
  BEFORE UPDATE ON public.tile_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

-- Enable RLS
ALTER TABLE public.tilesets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tile_jobs ENABLE ROW LEVEL SECURITY;

-- Tilesets policies
CREATE POLICY "Public read access to active tilesets"
  ON public.tilesets
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage all tilesets"
  ON public.tilesets
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Tile jobs policies
CREATE POLICY "Admins can view all tile jobs"
  ON public.tile_jobs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage tile jobs"
  ON public.tile_jobs
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage tile jobs"
  ON public.tile_jobs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Function to get stale tilesets that need refresh
CREATE OR REPLACE FUNCTION public.get_stale_tilesets()
RETURNS TABLE (
  tileset_key TEXT,
  name TEXT,
  jurisdiction TEXT,
  hours_since_refresh NUMERIC,
  refresh_frequency_hours INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.tileset_key,
    t.name,
    t.jurisdiction,
    EXTRACT(EPOCH FROM (now() - t.generated_at)) / 3600 AS hours_since_refresh,
    t.refresh_frequency_hours
  FROM public.tilesets t
  WHERE t.is_active = true
    AND (
      t.generated_at IS NULL 
      OR EXTRACT(EPOCH FROM (now() - t.generated_at)) / 3600 > t.refresh_frequency_hours
    )
  ORDER BY hours_since_refresh DESC NULLS FIRST;
$$;

-- Function to get active/running tile jobs
CREATE OR REPLACE FUNCTION public.get_active_tile_jobs()
RETURNS TABLE (
  id UUID,
  tileset_key TEXT,
  status tile_job_status,
  started_at TIMESTAMP WITH TIME ZONE,
  duration_minutes NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    j.id,
    j.tileset_key,
    j.status,
    j.started_at,
    EXTRACT(EPOCH FROM (now() - j.started_at)) / 60 AS duration_minutes
  FROM public.tile_jobs j
  WHERE j.status NOT IN ('complete', 'error', 'cancelled')
  ORDER BY j.started_at ASC;
$$;

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE public.tilesets IS 'Catalog of vector tilesets served by SiteIntel tile infrastructure';
COMMENT ON TABLE public.tile_jobs IS 'ETL job tracking for vector tile generation pipeline';

COMMENT ON COLUMN public.tilesets.tileset_key IS 'Unique identifier used in tile URL path (e.g., houston_parcels)';
COMMENT ON COLUMN public.tilesets.tile_url_template IS 'URL template with {z}/{x}/{y} placeholders for tile requests';
COMMENT ON COLUMN public.tilesets.vector_layers IS 'Array of layer definitions within the tileset with field schemas';
COMMENT ON COLUMN public.tilesets.tippecanoe_options IS 'Tippecanoe CLI options used for tile generation';

COMMENT ON COLUMN public.tile_jobs.tippecanoe_options IS 'Tippecanoe configuration for this specific job run';
COMMENT ON COLUMN public.tile_jobs.worker_type IS 'Type of worker: github_actions, lambda, ec2';