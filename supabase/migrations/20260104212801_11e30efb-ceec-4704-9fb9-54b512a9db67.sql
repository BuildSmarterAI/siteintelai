-- ============================================================================
-- Design Intent & Generation Jobs Migration (Fixed)
-- Adds design_intent column to design_sessions and creates generation_jobs table
-- ============================================================================

-- 1. Add design_intent column to design_sessions
ALTER TABLE public.design_sessions 
ADD COLUMN IF NOT EXISTS design_intent JSONB;

-- 2. Create design_generation_jobs table for atomic variant generation
CREATE TABLE IF NOT EXISTS public.design_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.design_sessions(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'complete', 'failed')) DEFAULT 'pending',
  input_hash TEXT,
  design_intent JSONB,
  variants_count INTEGER,
  best_variant_id UUID,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for generation jobs
CREATE INDEX IF NOT EXISTS idx_generation_jobs_session 
ON public.design_generation_jobs(session_id);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_status 
ON public.design_generation_jobs(status);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_input_hash 
ON public.design_generation_jobs(input_hash);

-- Enable RLS
ALTER TABLE public.design_generation_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for generation jobs
CREATE POLICY "Users can view their own generation jobs" 
ON public.design_generation_jobs 
FOR SELECT 
USING (
  session_id IN (
    SELECT id FROM public.design_sessions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own generation jobs" 
ON public.design_generation_jobs 
FOR INSERT 
WITH CHECK (
  session_id IN (
    SELECT id FROM public.design_sessions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own generation jobs" 
ON public.design_generation_jobs 
FOR UPDATE 
USING (
  session_id IN (
    SELECT id FROM public.design_sessions WHERE user_id = auth.uid()
  )
);

-- 3. Create function to batch insert variants atomically
CREATE OR REPLACE FUNCTION public.insert_variants_batch(
  p_session_id UUID,
  p_variants JSONB,
  p_best_variant_id UUID DEFAULT NULL,
  p_generation_job_id UUID DEFAULT NULL
)
RETURNS SETOF public.design_variants
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_variant JSONB;
  v_inserted design_variants;
  v_count INTEGER := 0;
BEGIN
  -- Validate session belongs to user
  IF NOT EXISTS (
    SELECT 1 FROM design_sessions 
    WHERE id = p_session_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Session not found or access denied';
  END IF;

  -- Insert each variant in the array
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    INSERT INTO design_variants (
      session_id,
      name,
      footprint,
      height_ft,
      floors,
      preset_type,
      notes,
      metrics,
      compliance_status,
      is_baseline,
      sort_order
    ) VALUES (
      p_session_id,
      v_variant->>'name',
      (v_variant->'footprint')::JSONB,
      (v_variant->>'height_ft')::NUMERIC,
      (v_variant->>'floors')::INTEGER,
      v_variant->>'preset_type',
      v_variant->>'notes',
      (v_variant->'metrics')::JSONB,
      COALESCE(v_variant->>'compliance_status', 'PENDING'),
      COALESCE((v_variant->>'is_baseline')::BOOLEAN, FALSE),
      v_count
    )
    RETURNING * INTO v_inserted;
    
    v_count := v_count + 1;
    RETURN NEXT v_inserted;
  END LOOP;

  -- Update session's active variant to best variant if provided
  IF p_best_variant_id IS NOT NULL THEN
    UPDATE design_sessions 
    SET updated_at = now()
    WHERE id = p_session_id;
  END IF;

  -- Update generation job if provided
  IF p_generation_job_id IS NOT NULL THEN
    UPDATE design_generation_jobs
    SET 
      status = 'complete',
      variants_count = v_count,
      best_variant_id = p_best_variant_id,
      completed_at = now(),
      updated_at = now()
    WHERE id = p_generation_job_id;
  END IF;

  RETURN;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_variants_batch TO authenticated;

-- 4. Create function to update design intent
CREATE OR REPLACE FUNCTION public.update_session_design_intent(
  p_session_id UUID,
  p_design_intent JSONB
)
RETURNS public.design_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session design_sessions;
BEGIN
  UPDATE design_sessions
  SET 
    design_intent = p_design_intent,
    updated_at = now()
  WHERE id = p_session_id AND user_id = auth.uid()
  RETURNING * INTO v_session;
  
  IF v_session IS NULL THEN
    RAISE EXCEPTION 'Session not found or access denied';
  END IF;
  
  RETURN v_session;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_session_design_intent TO authenticated;

-- 5. Add updated_at trigger for generation jobs
CREATE OR REPLACE FUNCTION public.update_generation_job_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_generation_jobs_updated_at ON public.design_generation_jobs;
CREATE TRIGGER update_generation_jobs_updated_at
BEFORE UPDATE ON public.design_generation_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_generation_job_updated_at();