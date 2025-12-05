-- Pipeline phase metrics table for tracking timing of each enrichment phase
CREATE TABLE IF NOT EXISTS pipeline_phase_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  data_sources JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API health snapshots for hourly aggregated metrics
CREATE TABLE IF NOT EXISTS api_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hour TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL,
  total_calls INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  avg_duration_ms NUMERIC,
  p95_duration_ms NUMERIC,
  error_count INTEGER DEFAULT 0,
  top_errors JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hour, source)
);

-- Indexes for pipeline_phase_metrics
CREATE INDEX IF NOT EXISTS idx_pipeline_metrics_app ON pipeline_phase_metrics(application_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_metrics_phase ON pipeline_phase_metrics(phase);
CREATE INDEX IF NOT EXISTS idx_pipeline_metrics_time ON pipeline_phase_metrics(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_metrics_success ON pipeline_phase_metrics(success, phase);

-- Indexes for api_health_snapshots
CREATE INDEX IF NOT EXISTS idx_api_health_hour ON api_health_snapshots(hour DESC);
CREATE INDEX IF NOT EXISTS idx_api_health_source ON api_health_snapshots(source, hour DESC);

-- Performance indexes for api_logs
CREATE INDEX IF NOT EXISTS idx_api_logs_source_time ON api_logs(source, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_success_time ON api_logs(success, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_duration ON api_logs(duration_ms DESC);

-- Enable RLS
ALTER TABLE pipeline_phase_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_health_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS policies - allow service role full access (for edge functions)
CREATE POLICY "Service role full access to pipeline_phase_metrics" 
ON pipeline_phase_metrics FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service role full access to api_health_snapshots" 
ON api_health_snapshots FOR ALL 
USING (true) 
WITH CHECK (true);