-- CityEngine Jobs Table for tracking 3D generation jobs
CREATE TABLE cityengine_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Linkage to SiteIntel entities
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  session_id UUID REFERENCES design_sessions(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES design_variants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Job state machine
  status TEXT NOT NULL DEFAULT 'queued' 
    CHECK (status IN ('queued', 'processing', 'exporting', 'uploading', 'complete', 'failed', 'cancelled')),
  
  -- Input payload (immutable once created)
  input_payload JSONB NOT NULL,
  input_hash TEXT NOT NULL, -- SHA256 hash for idempotency
  
  -- Output references
  output_manifest JSONB, -- { glb_path, obj_path, png_axon, png_top, png_street, manifest_path }
  
  -- Job execution details
  attempt INTEGER DEFAULT 1,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  error_code TEXT,
  processing_time_ms INTEGER,
  
  -- Progress tracking (0-100)
  progress INTEGER DEFAULT 0,
  current_stage TEXT,
  
  -- Audit timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_cityengine_jobs_status ON cityengine_jobs(status);
CREATE INDEX idx_cityengine_jobs_user ON cityengine_jobs(user_id);
CREATE INDEX idx_cityengine_jobs_application ON cityengine_jobs(application_id);
CREATE INDEX idx_cityengine_jobs_session ON cityengine_jobs(session_id);
CREATE INDEX idx_cityengine_jobs_created ON cityengine_jobs(created_at DESC);

-- Unique constraint for idempotency (only one complete job per input hash)
CREATE UNIQUE INDEX idx_cityengine_jobs_idempotency 
  ON cityengine_jobs(input_hash) 
  WHERE status = 'complete';

-- Enable RLS
ALTER TABLE cityengine_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
CREATE POLICY "Users can view their own CityEngine jobs"
  ON cityengine_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create jobs for themselves
CREATE POLICY "Users can create CityEngine jobs"
  ON cityengine_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can cancel their own pending jobs
CREATE POLICY "Users can update their own pending jobs"
  ON cityengine_jobs
  FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('queued', 'processing'))
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cityengine_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cityengine_jobs_updated_at
  BEFORE UPDATE ON cityengine_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_cityengine_jobs_updated_at();

-- Function to claim the next queued job (for worker)
CREATE OR REPLACE FUNCTION claim_cityengine_job()
RETURNS cityengine_jobs AS $$
DECLARE
  claimed_job cityengine_jobs;
BEGIN
  -- Atomically claim the oldest queued job
  UPDATE cityengine_jobs
  SET 
    status = 'processing',
    started_at = NOW(),
    attempt = attempt + 1
  WHERE id = (
    SELECT id FROM cityengine_jobs
    WHERE status = 'queued'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING * INTO claimed_job;
  
  RETURN claimed_job;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;