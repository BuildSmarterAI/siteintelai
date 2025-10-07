-- Add missing GIS and AI pipeline fields to applications table
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS enrichment_metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ai_context jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS scoring_weights jsonb DEFAULT '{
  "zoning": 25,
  "flood": 20,
  "utilities": 20,
  "environmental": 15,
  "schedule": 10,
  "market": 10
}'::jsonb;

-- Add AI pipeline tracking to reports table
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS score_band text CHECK (score_band IN ('A', 'B', 'C')),
ADD COLUMN IF NOT EXISTS ai_prompt_tokens integer,
ADD COLUMN IF NOT EXISTS ai_completion_tokens integer,
ADD COLUMN IF NOT EXISTS validation_status text DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'failed'));

-- Create index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_applications_geo_location ON public.applications USING btree (geo_lat, geo_lng) WHERE geo_lat IS NOT NULL AND geo_lng IS NOT NULL;

-- Create index for status-based queries
CREATE INDEX IF NOT EXISTS idx_applications_enrichment_status ON public.applications (enrichment_status);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports (status);

-- Update updated_at trigger for applications
DROP TRIGGER IF EXISTS update_applications_updated_at ON public.applications;
CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update updated_at trigger for reports
DROP TRIGGER IF EXISTS update_reports_updated_at ON public.reports;
CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON COLUMN public.applications.enrichment_metadata IS 'Stores metadata from enrichment pipeline including API call logs and timestamps';
COMMENT ON COLUMN public.applications.ai_context IS 'Packed context data sent to LLM for report generation';
COMMENT ON COLUMN public.applications.scoring_weights IS 'Configurable weights for feasibility score calculation';
COMMENT ON COLUMN public.reports.score_band IS 'Letter grade (A/B/C) derived from feasibility_score';
COMMENT ON COLUMN public.reports.validation_status IS 'Status of AI output validation and retry loop';