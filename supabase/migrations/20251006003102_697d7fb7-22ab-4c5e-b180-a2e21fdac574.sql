-- Add observability columns to applications table
ALTER TABLE applications 
  ADD COLUMN IF NOT EXISTS api_meta jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS enrichment_status text DEFAULT 'pending';

-- Add comment for documentation
COMMENT ON COLUMN applications.api_meta IS 'Stores API response metadata including status codes, record counts, and latency';
COMMENT ON COLUMN applications.enrichment_status IS 'Enrichment status: pending, complete, partial, or failed';