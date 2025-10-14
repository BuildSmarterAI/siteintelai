-- Phase 1: Add report_assets column to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS report_assets JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN reports.report_assets IS 'Stores URLs for static maps, street view images, and other visual assets. Schema: { "static_map_url": "...", "streetview": [...], "utilities_overlay_url": "..." }';

CREATE INDEX IF NOT EXISTS idx_reports_report_assets 
ON reports USING gin(report_assets);

-- Add drive-time storage to applications
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS drivetimes JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN applications.drivetimes IS 'Drive time data from Distance Matrix API. Schema: [{"destination": "CBD", "duration_min": 18, "distance_mi": 12.3}]';

CREATE INDEX IF NOT EXISTS idx_applications_drivetimes 
ON applications USING gin(drivetimes);

-- Add nearby places context to applications
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS nearby_places JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN applications.nearby_places IS 'Nearby POIs from Places API. Schema: [{"name": "Memorial Hermann", "type": "hospital", "distance_ft": 1247}]';

CREATE INDEX IF NOT EXISTS idx_applications_nearby_places 
ON applications USING gin(nearby_places);

-- Create api_logs table for observability
CREATE TABLE IF NOT EXISTS api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  application_id UUID REFERENCES applications(id),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_message TEXT,
  cache_key TEXT,
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_logs_source ON api_logs(source);
CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp ON api_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_logs_application ON api_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_cache ON api_logs(cache_key) WHERE cache_key IS NOT NULL;