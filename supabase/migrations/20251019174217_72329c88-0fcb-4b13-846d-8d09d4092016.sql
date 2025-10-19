-- Phase 1: Add orchestration fields to applications table
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'enriching', 'ai', 'rendering', 'complete', 'error')),
  ADD COLUMN IF NOT EXISTS status_rev INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS error_code TEXT,
  ADD COLUMN IF NOT EXISTS status_percent INTEGER DEFAULT 0
    CHECK (status_percent >= 0 AND status_percent <= 100);

-- Create indexes for queue processing
CREATE INDEX IF NOT EXISTS idx_applications_next_run_at 
  ON public.applications (next_run_at) 
  WHERE status NOT IN ('complete', 'error');

CREATE INDEX IF NOT EXISTS idx_applications_status_rev 
  ON public.applications (id, status_rev);

-- Add comments for documentation
COMMENT ON COLUMN public.applications.status IS 
  'Lifecycle state: queued → enriching → ai → rendering → complete|error';

COMMENT ON COLUMN public.applications.status_rev IS 
  'Monotonic revision counter for idempotent state transitions';

COMMENT ON COLUMN public.applications.attempts IS 
  'Retry counter for current phase (reset on successful transition)';

COMMENT ON COLUMN public.applications.next_run_at IS 
  'Timestamp for next scheduled execution (queue processing)';

COMMENT ON COLUMN public.applications.error_code IS 
  'Standardized error code from error registry (e.g., E001, E101)';

COMMENT ON COLUMN public.applications.status_percent IS 
  'UI progress hint: 0-100 percent complete';

-- Create error_registry table
CREATE TABLE IF NOT EXISTS public.error_registry (
  code TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  http_status INTEGER,
  human_message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.error_registry ENABLE ROW LEVEL SECURITY;

-- Public read access (for error UI display)
CREATE POLICY "Public read access to error registry"
  ON public.error_registry FOR SELECT
  USING (true);

-- Admin write access
CREATE POLICY "Admins can manage error registry"
  ON public.error_registry FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed initial error codes
INSERT INTO public.error_registry (code, source, http_status, human_message) VALUES
  ('E001', 'ARCGIS', 500, 'ArcGIS service timeout or unavailable'),
  ('E002', 'ARCGIS', 200, 'ArcGIS returned no features for query'),
  ('E003', 'ARCGIS', 400, 'Invalid geometry or spatial query'),
  ('E101', 'FEMA', 500, 'OpenFEMA transient failure (rate limit or server error)'),
  ('E102', 'FEMA', 200, 'OpenFEMA returned empty results after pagination'),
  ('E201', 'WETLAND', 200, 'USFWS Wetlands service returned invalid geometry'),
  ('E202', 'WETLAND', 500, 'USFWS Wetlands service timeout'),
  ('E301', 'TXDOT', 200, 'TxDOT AADT data unavailable for location'),
  ('E302', 'TXDOT', 500, 'TxDOT service error'),
  ('E401', 'UTILITIES', 200, 'Utility endpoint returned no data within buffer'),
  ('E402', 'UTILITIES', 500, 'Utility service timeout or error'),
  ('E901', 'AI', null, 'JSON schema validation failed (AI output malformed)'),
  ('E902', 'AI', 429, 'AI service rate limit exceeded'),
  ('E903', 'AI', 500, 'AI service error or timeout'),
  ('E999', 'SYSTEM', null, 'Unhandled exception during processing')
ON CONFLICT (code) DO NOTHING;

COMMENT ON TABLE public.error_registry IS 
  'Centralized error code definitions for machine-readable error handling';