-- Add intent_type and supporting fields to applications table
ALTER TABLE applications
ADD COLUMN intent_type TEXT CHECK (intent_type IN ('build', 'buy')),
ADD COLUMN intent_weights JSONB DEFAULT '{
  "build": {"zoning": 0.30, "flood": 0.20, "utilities": 0.20, "environmental": 0.10, "schedule": 0.10, "market": 0.10},
  "buy": {"valuation": 0.30, "flood": 0.25, "environmental": 0.20, "market": 0.15, "infrastructure": 0.10}
}'::jsonb,
ADD COLUMN market_context JSONB DEFAULT '{}'::jsonb,
ADD COLUMN financial_indicators JSONB DEFAULT '{}'::jsonb;

-- Add index for intent-based filtering
CREATE INDEX idx_applications_intent_type ON applications(intent_type) WHERE intent_type IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN applications.intent_type IS 'User intent: build (development/construction) or buy (investment/acquisition)';

-- Drop and recreate v_reports_public view to include intent_type
DROP VIEW IF EXISTS v_reports_public;
CREATE VIEW v_reports_public AS
SELECT 
  r.id,
  r.application_id,
  r.user_id,
  r.feasibility_score,
  r.score_band,
  r.report_type,
  r.created_at,
  r.updated_at,
  r.status,
  r.pdf_url,
  r.json_data,
  a.formatted_address,
  a.county,
  a.city,
  a.zoning_code,
  a.lot_size_value,
  a.lot_size_unit,
  a.intent_type
FROM reports r
JOIN applications a ON r.application_id = a.id;