-- Add missing columns to applications table for data moat schema
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS parcel_source_id UUID REFERENCES public.parcel_sources(id);

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS dataset_version_summary JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS override_stats JSONB DEFAULT '{}'::jsonb;

-- Add application_draft_id FK to gis_coverage_events
ALTER TABLE public.gis_coverage_events
  ADD COLUMN IF NOT EXISTS application_draft_id UUID REFERENCES public.applications_draft(draft_id);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_applications_parcel_source_id 
  ON public.applications (parcel_source_id);

CREATE INDEX IF NOT EXISTS idx_gis_coverage_events_draft_id 
  ON public.gis_coverage_events (application_draft_id);