-- ============================================================================
-- Production-Grade Design Mode Bootstrap Schema + RPC Functions
-- ============================================================================

-- ============================================================================
-- PART 0: Clean up duplicate sessions (keep the newest one per envelope/user)
-- ============================================================================

-- First, delete duplicate design_sessions keeping only the most recent one per envelope_id + user_id
DELETE FROM public.design_sessions
WHERE id NOT IN (
  SELECT DISTINCT ON (envelope_id, user_id) id
  FROM public.design_sessions
  ORDER BY envelope_id, user_id, created_at DESC
);

-- ============================================================================
-- PART 1: Schema Upgrades
-- ============================================================================

-- 1.1 Add versioning and status columns to regulatory_envelopes
ALTER TABLE public.regulatory_envelopes
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ready',
ADD COLUMN IF NOT EXISTS confidence_grade TEXT,
ADD COLUMN IF NOT EXISTS source_versions JSONB DEFAULT '{"parcel_version": null, "zoning_version": null, "overlays_version": null}'::jsonb,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add check constraints
ALTER TABLE public.regulatory_envelopes
DROP CONSTRAINT IF EXISTS regulatory_envelopes_status_check;
ALTER TABLE public.regulatory_envelopes
ADD CONSTRAINT regulatory_envelopes_status_check 
CHECK (status IN ('pending', 'ready', 'failed'));

ALTER TABLE public.regulatory_envelopes
DROP CONSTRAINT IF EXISTS regulatory_envelopes_confidence_grade_check;
ALTER TABLE public.regulatory_envelopes
ADD CONSTRAINT regulatory_envelopes_confidence_grade_check 
CHECK (confidence_grade IS NULL OR confidence_grade IN ('A', 'B', 'C', 'D'));

-- Unique index for idempotency: one envelope per application per version
CREATE UNIQUE INDEX IF NOT EXISTS ux_envelopes_app_version
ON public.regulatory_envelopes(application_id, version);

-- 1.2 Add envelope_version and status to design_sessions
ALTER TABLE public.design_sessions
ADD COLUMN IF NOT EXISTS envelope_version INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE public.design_sessions
DROP CONSTRAINT IF EXISTS design_sessions_status_check;
ALTER TABLE public.design_sessions
ADD CONSTRAINT design_sessions_status_check 
CHECK (status IN ('active', 'archived'));

-- Unique index: one active session per envelope version per user
CREATE UNIQUE INDEX IF NOT EXISTS ux_sessions_envelope_active
ON public.design_sessions(envelope_id, envelope_version, user_id)
WHERE status = 'active';

-- 1.3 Create unified design_jobs table
CREATE TABLE IF NOT EXISTS public.design_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  envelope_id UUID REFERENCES public.regulatory_envelopes(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.design_sessions(id) ON DELETE SET NULL,
  
  idempotency_key TEXT NOT NULL,
  attempt INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  
  locked_by TEXT,
  locked_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  input_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_json JSONB,
  error_json JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT design_jobs_type_check CHECK (job_type IN ('envelope_compute', 'variant_generate')),
  CONSTRAINT design_jobs_status_check CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'canceled'))
);

-- Idempotency: one job per type + key
CREATE UNIQUE INDEX IF NOT EXISTS ux_design_jobs_type_idem
ON public.design_jobs(job_type, idempotency_key);

-- Query performance for job claiming
CREATE INDEX IF NOT EXISTS ix_design_jobs_status_next
ON public.design_jobs(status, next_run_at);

-- Index for application lookups
CREATE INDEX IF NOT EXISTS ix_design_jobs_application
ON public.design_jobs(application_id);

-- Unique variant names per session - handle existing duplicates first
-- Delete duplicate variants keeping only the first one per session/name
DELETE FROM public.design_variants
WHERE id NOT IN (
  SELECT DISTINCT ON (session_id, name) id
  FROM public.design_variants
  ORDER BY session_id, name, created_at ASC
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_variants_session_name
ON public.design_variants(session_id, name);

-- Updated_at trigger for design_jobs
CREATE OR REPLACE FUNCTION public.update_design_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_design_jobs_updated_at ON public.design_jobs;
CREATE TRIGGER update_design_jobs_updated_at
  BEFORE UPDATE ON public.design_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_design_jobs_updated_at();

-- RLS for design_jobs
ALTER TABLE public.design_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own design jobs" ON public.design_jobs;
CREATE POLICY "Users can view their own design jobs"
ON public.design_jobs FOR SELECT
USING (
  application_id IN (
    SELECT id FROM public.applications WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create design jobs for their applications" ON public.design_jobs;
CREATE POLICY "Users can create design jobs for their applications"
ON public.design_jobs FOR INSERT
WITH CHECK (
  application_id IN (
    SELECT id FROM public.applications WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own design jobs" ON public.design_jobs;
CREATE POLICY "Users can update their own design jobs"
ON public.design_jobs FOR UPDATE
USING (
  application_id IN (
    SELECT id FROM public.applications WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- PART 2: Core RPC Functions
-- ============================================================================

-- 2.1 ensure_regulatory_envelope - Core bootstrap primitive with advisory locking
CREATE OR REPLACE FUNCTION public.ensure_regulatory_envelope(
  p_application_id UUID,
  p_parcel_id UUID DEFAULT NULL,
  p_force_recompute BOOLEAN DEFAULT FALSE,
  p_parcel_version TEXT DEFAULT NULL,
  p_zoning_version TEXT DEFAULT NULL,
  p_overlays_version TEXT DEFAULT NULL,
  p_create_if_missing BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lock_key BIGINT;
  v_envelope regulatory_envelopes;
  v_job design_jobs;
  v_source_versions JSONB;
  v_idem_key TEXT;
  v_next_version INTEGER;
  v_parcel_id UUID;
BEGIN
  -- Advisory lock by application to prevent races
  v_lock_key := hashtext(p_application_id::text);
  PERFORM pg_advisory_xact_lock(v_lock_key);
  
  v_source_versions := jsonb_build_object(
    'parcel_version', p_parcel_version,
    'zoning_version', p_zoning_version,
    'overlays_version', p_overlays_version
  );
  
  -- Get parcel_id from application if not provided
  IF p_parcel_id IS NULL THEN
    SELECT parcel_id INTO v_parcel_id FROM applications WHERE id = p_application_id;
  ELSE
    v_parcel_id := p_parcel_id;
  END IF;
  
  -- Check for existing ready envelope with matching source versions
  IF NOT p_force_recompute THEN
    SELECT * INTO v_envelope
    FROM regulatory_envelopes
    WHERE application_id = p_application_id
      AND status = 'ready'
      AND (
        source_versions = v_source_versions 
        OR source_versions IS NULL 
        OR source_versions = '{"parcel_version": null, "zoning_version": null, "overlays_version": null}'::jsonb
      )
    ORDER BY version DESC
    LIMIT 1;
    
    IF v_envelope.id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'envelope', jsonb_build_object(
          'id', v_envelope.id,
          'version', v_envelope.version,
          'status', v_envelope.status,
          'confidence_grade', v_envelope.confidence_grade,
          'source_versions', v_envelope.source_versions,
          'height_cap_ft', v_envelope.height_cap_ft,
          'far_cap', v_envelope.far_cap,
          'coverage_cap_pct', v_envelope.coverage_cap_pct,
          'setbacks', v_envelope.setbacks
        ),
        'job', NULL,
        'cache_hit', TRUE
      );
    END IF;
  END IF;
  
  -- Check for pending envelope with matching sources
  SELECT * INTO v_envelope
  FROM regulatory_envelopes
  WHERE application_id = p_application_id
    AND status = 'pending'
  ORDER BY version DESC
  LIMIT 1;
  
  IF v_envelope.id IS NOT NULL THEN
    -- Return pending envelope + its job
    SELECT * INTO v_job
    FROM design_jobs
    WHERE job_type = 'envelope_compute'
      AND envelope_id = v_envelope.id
      AND status IN ('queued', 'running')
    LIMIT 1;
    
    RETURN jsonb_build_object(
      'envelope', jsonb_build_object(
        'id', v_envelope.id,
        'version', v_envelope.version,
        'status', v_envelope.status,
        'confidence_grade', v_envelope.confidence_grade,
        'source_versions', v_envelope.source_versions
      ),
      'job', CASE WHEN v_job.id IS NOT NULL THEN jsonb_build_object(
        'id', v_job.id,
        'status', v_job.status,
        'attempt', v_job.attempt,
        'error', v_job.error_json
      ) ELSE NULL END,
      'cache_hit', FALSE
    );
  END IF;
  
  -- Create new pending envelope if allowed
  IF NOT p_create_if_missing THEN
    RETURN jsonb_build_object(
      'envelope', NULL,
      'job', NULL,
      'cache_hit', FALSE,
      'error', 'ENVELOPE_NOT_FOUND'
    );
  END IF;
  
  -- Compute next version
  SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version
  FROM regulatory_envelopes
  WHERE application_id = p_application_id;
  
  -- Create pending envelope row with placeholder geometry
  INSERT INTO regulatory_envelopes (
    application_id, version, status, source_versions,
    parcel_geometry, buildable_footprint_2d,
    height_cap_ft, far_cap, coverage_cap_pct, setbacks
  )
  VALUES (
    p_application_id, v_next_version, 'pending', v_source_versions,
    ST_GeomFromText('POLYGON EMPTY', 4326),
    ST_GeomFromText('POLYGON EMPTY', 4326),
    0, 0, 0, '{}'::jsonb
  )
  RETURNING * INTO v_envelope;
  
  -- Create compute job with idempotency key
  v_idem_key := md5(format('envelope|%s|%s|%s|%s|%s',
    p_application_id,
    COALESCE(v_parcel_id::text, 'null'),
    COALESCE(p_parcel_version, 'null'),
    COALESCE(p_zoning_version, 'null'),
    COALESCE(p_overlays_version, 'null')
  ));
  
  INSERT INTO design_jobs (
    job_type, status, application_id, envelope_id, idempotency_key, input_json
  )
  VALUES (
    'envelope_compute', 'queued', p_application_id, v_envelope.id, v_idem_key,
    jsonb_build_object(
      'application_id', p_application_id,
      'parcel_id', v_parcel_id,
      'source_versions', v_source_versions
    )
  )
  ON CONFLICT (job_type, idempotency_key) DO UPDATE
    SET updated_at = now()
  RETURNING * INTO v_job;
  
  RETURN jsonb_build_object(
    'envelope', jsonb_build_object(
      'id', v_envelope.id,
      'version', v_envelope.version,
      'status', v_envelope.status,
      'source_versions', v_envelope.source_versions
    ),
    'job', jsonb_build_object(
      'id', v_job.id,
      'status', v_job.status,
      'attempt', v_job.attempt
    ),
    'cache_hit', FALSE
  );
END;
$$;

-- 2.2 ensure_design_session - Idempotent session creation
CREATE OR REPLACE FUNCTION public.ensure_design_session(
  p_application_id UUID,
  p_envelope_id UUID,
  p_envelope_version INTEGER,
  p_create_if_missing BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lock_key BIGINT;
  v_session design_sessions;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('session', NULL, 'error', 'AUTH_REQUIRED');
  END IF;
  
  -- Advisory lock by envelope to prevent races
  v_lock_key := hashtext(p_envelope_id::text);
  PERFORM pg_advisory_xact_lock(v_lock_key);
  
  -- Check for existing active session
  SELECT * INTO v_session
  FROM design_sessions
  WHERE envelope_id = p_envelope_id
    AND envelope_version = p_envelope_version
    AND user_id = v_user_id
    AND status = 'active'
  LIMIT 1;
  
  IF v_session.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'session', jsonb_build_object(
        'id', v_session.id,
        'status', v_session.status,
        'active_variant_id', v_session.active_variant_id,
        'created_at', v_session.created_at,
        'updated_at', v_session.updated_at
      ),
      'is_new', FALSE
    );
  END IF;
  
  IF NOT p_create_if_missing THEN
    RETURN jsonb_build_object('session', NULL, 'error', 'SESSION_NOT_FOUND');
  END IF;
  
  -- Create new session
  INSERT INTO design_sessions (
    user_id, envelope_id, envelope_version, name, status
  )
  VALUES (
    v_user_id, p_envelope_id, p_envelope_version, 'Design Session', 'active'
  )
  ON CONFLICT DO NOTHING
  RETURNING * INTO v_session;
  
  -- If conflict, fetch existing
  IF v_session.id IS NULL THEN
    SELECT * INTO v_session
    FROM design_sessions
    WHERE envelope_id = p_envelope_id
      AND envelope_version = p_envelope_version
      AND user_id = v_user_id
      AND status = 'active'
    LIMIT 1;
  END IF;
  
  RETURN jsonb_build_object(
    'session', jsonb_build_object(
      'id', v_session.id,
      'status', v_session.status,
      'active_variant_id', v_session.active_variant_id,
      'created_at', v_session.created_at,
      'updated_at', v_session.updated_at
    ),
    'is_new', TRUE
  );
END;
$$;

-- 2.3 claim_next_design_job - For worker-based job processing
CREATE OR REPLACE FUNCTION public.claim_next_design_job(
  p_job_type TEXT,
  p_worker_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job design_jobs;
BEGIN
  SELECT * INTO v_job
  FROM design_jobs
  WHERE job_type = p_job_type
    AND status = 'queued'
    AND next_run_at <= now()
  ORDER BY created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;
  
  IF v_job.id IS NULL THEN
    RETURN NULL;
  END IF;
  
  UPDATE design_jobs
  SET status = 'running',
      locked_by = p_worker_id,
      locked_at = now(),
      attempt = attempt + 1,
      updated_at = now()
  WHERE id = v_job.id
  RETURNING * INTO v_job;
  
  RETURN row_to_json(v_job)::jsonb;
END;
$$;

-- 2.4 fail_design_job - With exponential backoff
CREATE OR REPLACE FUNCTION public.fail_design_job(
  p_job_id UUID,
  p_error JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt INTEGER;
  v_max_attempts INTEGER;
  v_next_ts TIMESTAMPTZ;
BEGIN
  SELECT attempt, max_attempts INTO v_attempt, v_max_attempts
  FROM design_jobs WHERE id = p_job_id;
  
  IF v_attempt < v_max_attempts THEN
    -- Backoff: 10s → 60s → 5m
    v_next_ts := now() + (CASE v_attempt
      WHEN 1 THEN interval '10 seconds'
      WHEN 2 THEN interval '60 seconds'
      ELSE interval '5 minutes'
    END);
    
    UPDATE design_jobs
    SET status = 'queued',
        next_run_at = v_next_ts,
        error_json = p_error,
        locked_by = NULL,
        locked_at = NULL,
        updated_at = now()
    WHERE id = p_job_id;
  ELSE
    UPDATE design_jobs
    SET status = 'failed',
        error_json = p_error,
        updated_at = now()
    WHERE id = p_job_id;
    
    -- Also mark envelope as failed if this was an envelope job
    UPDATE regulatory_envelopes
    SET status = 'failed',
        error_message = p_error->>'message'
    WHERE id = (SELECT envelope_id FROM design_jobs WHERE id = p_job_id)
      AND status = 'pending';
  END IF;
END;
$$;

-- 2.5 complete_design_job - Mark job as succeeded
CREATE OR REPLACE FUNCTION public.complete_design_job(
  p_job_id UUID,
  p_output JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE design_jobs
  SET status = 'succeeded',
      output_json = p_output,
      locked_by = NULL,
      locked_at = NULL,
      updated_at = now()
  WHERE id = p_job_id;
END;
$$;

-- 2.6 complete_envelope_computation - Mark envelope as ready with computed values
CREATE OR REPLACE FUNCTION public.complete_envelope_computation(
  p_envelope_id UUID,
  p_job_id UUID,
  p_height_cap_ft NUMERIC,
  p_far_cap NUMERIC,
  p_coverage_cap_pct NUMERIC,
  p_setbacks JSONB,
  p_confidence_grade TEXT DEFAULT 'B',
  p_buildable_footprint GEOMETRY DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update envelope with computed values
  UPDATE regulatory_envelopes
  SET status = 'ready',
      height_cap_ft = p_height_cap_ft,
      far_cap = p_far_cap,
      coverage_cap_pct = p_coverage_cap_pct,
      setbacks = p_setbacks,
      confidence_grade = p_confidence_grade,
      buildable_footprint_2d = COALESCE(p_buildable_footprint, buildable_footprint_2d),
      updated_at = now()
  WHERE id = p_envelope_id;
  
  -- Complete the job
  PERFORM complete_design_job(p_job_id, jsonb_build_object(
    'envelope_id', p_envelope_id,
    'completed_at', now()
  ));
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.ensure_regulatory_envelope TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_design_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_next_design_job TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fail_design_job TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.complete_design_job TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.complete_envelope_computation TO authenticated, service_role;