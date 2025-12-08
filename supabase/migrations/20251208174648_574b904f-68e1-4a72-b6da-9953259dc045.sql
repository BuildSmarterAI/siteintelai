-- =============================================================================
-- Phase 1: Data Moat Architecture - Core Tables
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ENUM Types
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE intent_type AS ENUM ('build', 'buy', 'invest');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE parcel_source_type AS ENUM ('official', 'user_drawn', 'third_party');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE dataset_type AS ENUM ('parcels', 'zoning', 'flood', 'utilities', 'environmental', 'wetlands', 'topography', 'traffic', 'demographics', 'boundaries');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE dataset_status AS ENUM ('active', 'stale', 'deprecated');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE risk_source AS ENUM ('auto', 'user_annotation');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 1. datasets table - Unified dataset registry
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction TEXT NOT NULL,
  mapserver_id UUID REFERENCES public.map_servers(id) ON DELETE SET NULL,
  layer_name TEXT NOT NULL,
  dataset_key TEXT NOT NULL UNIQUE,
  dataset_version TEXT NOT NULL,
  dataset_type dataset_type NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  status dataset_status NOT NULL DEFAULT 'active',
  record_count INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for datasets
CREATE INDEX IF NOT EXISTS idx_datasets_jurisdiction ON public.datasets(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_datasets_type ON public.datasets(dataset_type);
CREATE INDEX IF NOT EXISTS idx_datasets_status ON public.datasets(status);
CREATE INDEX IF NOT EXISTS idx_datasets_mapserver ON public.datasets(mapserver_id);
CREATE INDEX IF NOT EXISTS idx_datasets_key ON public.datasets(dataset_key);

-- Comments
COMMENT ON TABLE public.datasets IS 'Unified registry of all GIS datasets used for feasibility analysis';
COMMENT ON COLUMN public.datasets.dataset_key IS 'Unique identifier like hou_parcels_v2025_11';
COMMENT ON COLUMN public.datasets.dataset_version IS 'Version string for audit trail';

-- -----------------------------------------------------------------------------
-- 2. parcel_sources table - Canonical parcel provenance
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parcel_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id UUID REFERENCES public.parcels(parcel_uuid) ON DELETE CASCADE,
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE SET NULL,
  source_type parcel_source_type NOT NULL DEFAULT 'official',
  coverage_flags TEXT[] DEFAULT '{}',
  geometry_source TEXT,
  confidence_score NUMERIC(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for parcel_sources
CREATE INDEX IF NOT EXISTS idx_parcel_sources_parcel ON public.parcel_sources(parcel_id);
CREATE INDEX IF NOT EXISTS idx_parcel_sources_dataset ON public.parcel_sources(dataset_id);
CREATE INDEX IF NOT EXISTS idx_parcel_sources_type ON public.parcel_sources(source_type);

-- Comments
COMMENT ON TABLE public.parcel_sources IS 'Tracks provenance and source attribution for each parcel';
COMMENT ON COLUMN public.parcel_sources.coverage_flags IS 'Array of flags like missing_official_source, stale_data';

-- -----------------------------------------------------------------------------
-- 3. applications_draft table - Draft state management
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.applications_draft (
  draft_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  intent_type intent_type,
  current_step INTEGER NOT NULL DEFAULT 0,
  completed_steps INTEGER[] DEFAULT '{}',
  
  -- Parcel & GIS provenance
  parcel_id UUID REFERENCES public.parcels(parcel_uuid) ON DELETE SET NULL,
  parcel_source_id UUID REFERENCES public.parcel_sources(id) ON DELETE SET NULL,
  drawn_parcel_id UUID REFERENCES public.drawn_parcels(id) ON DELETE SET NULL,
  coverage_flags TEXT[] DEFAULT '{}',
  gis_provenance JSONB DEFAULT '{}'::jsonb,
  
  -- Feasibility preview
  initial_feasibility_score NUMERIC(5,2),
  derived_max_far NUMERIC(6,3),
  derived_max_height NUMERIC(6,2),
  
  -- Step data
  contact_info JSONB DEFAULT '{}'::jsonb,
  property_info JSONB DEFAULT '{}'::jsonb,
  project_intent JSONB DEFAULT '{}'::jsonb,
  market_risks JSONB DEFAULT '{}'::jsonb,
  final_questions JSONB DEFAULT '{}'::jsonb,
  
  -- Full form snapshot
  form_data JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  last_saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Submission tracking
  submitted_at TIMESTAMPTZ,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL
);

-- Indexes for applications_draft
CREATE INDEX IF NOT EXISTS idx_draft_user ON public.applications_draft(user_id);
CREATE INDEX IF NOT EXISTS idx_draft_parcel ON public.applications_draft(parcel_id);
CREATE INDEX IF NOT EXISTS idx_draft_step ON public.applications_draft(current_step);
CREATE INDEX IF NOT EXISTS idx_draft_updated ON public.applications_draft(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_draft_not_submitted ON public.applications_draft(user_id) WHERE submitted_at IS NULL;

-- Comments
COMMENT ON TABLE public.applications_draft IS 'Draft application state for resume functionality and moat tracking';
COMMENT ON COLUMN public.applications_draft.gis_provenance IS 'JSON object with dataset names, versions, layer IDs used';
COMMENT ON COLUMN public.applications_draft.coverage_flags IS 'Array of missing/stale layer indicators';

-- -----------------------------------------------------------------------------
-- 4. application_overrides table - User edit audit trail
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.application_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_draft_id UUID REFERENCES public.applications_draft(draft_id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  parcel_id UUID REFERENCES public.parcels(parcel_uuid) ON DELETE SET NULL,
  field_name TEXT NOT NULL,
  original_value TEXT,
  new_value TEXT,
  source_dataset TEXT,
  source_layer_id TEXT,
  delta_percent NUMERIC(10,4),
  override_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- At least one reference must exist
  CONSTRAINT chk_override_reference CHECK (
    application_draft_id IS NOT NULL OR application_id IS NOT NULL
  )
);

-- Indexes for application_overrides
CREATE INDEX IF NOT EXISTS idx_overrides_draft ON public.application_overrides(application_draft_id);
CREATE INDEX IF NOT EXISTS idx_overrides_app ON public.application_overrides(application_id);
CREATE INDEX IF NOT EXISTS idx_overrides_parcel ON public.application_overrides(parcel_id);
CREATE INDEX IF NOT EXISTS idx_overrides_field ON public.application_overrides(field_name);
CREATE INDEX IF NOT EXISTS idx_overrides_created ON public.application_overrides(created_at DESC);

-- Comments
COMMENT ON TABLE public.application_overrides IS 'Audit trail of user edits to auto-enriched GIS data';
COMMENT ON COLUMN public.application_overrides.delta_percent IS 'Percentage difference between original and new value (for numeric fields)';

-- -----------------------------------------------------------------------------
-- 5. risk_profiles table - Structured risk annotations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.risk_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  parcel_id UUID REFERENCES public.parcels(parcel_uuid) ON DELETE SET NULL,
  
  -- Risk data
  risk_annotations JSONB DEFAULT '[]'::jsonb,
  kill_factors_triggered TEXT[] DEFAULT '{}',
  overall_risk_score NUMERIC(5,2),
  risk_category TEXT,
  
  -- Source tracking
  source risk_source NOT NULL DEFAULT 'auto',
  dataset_versions_used JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for risk_profiles
CREATE INDEX IF NOT EXISTS idx_risk_application ON public.risk_profiles(application_id);
CREATE INDEX IF NOT EXISTS idx_risk_parcel ON public.risk_profiles(parcel_id);
CREATE INDEX IF NOT EXISTS idx_risk_source ON public.risk_profiles(source);
CREATE INDEX IF NOT EXISTS idx_risk_category ON public.risk_profiles(risk_category);
CREATE INDEX IF NOT EXISTS idx_risk_score ON public.risk_profiles(overall_risk_score);

-- Comments
COMMENT ON TABLE public.risk_profiles IS 'Structured risk annotations and kill factor tracking per application';
COMMENT ON COLUMN public.risk_profiles.risk_annotations IS 'Array of {type, severity, description, source} objects';
COMMENT ON COLUMN public.risk_profiles.dataset_versions_used IS 'JSON mapping dataset_type to version for audit';

-- -----------------------------------------------------------------------------
-- Triggers for updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_datasets_updated_at ON public.datasets;
CREATE TRIGGER update_datasets_updated_at
  BEFORE UPDATE ON public.datasets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_applications_draft_updated_at ON public.applications_draft;
CREATE TRIGGER update_applications_draft_updated_at
  BEFORE UPDATE ON public.applications_draft
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_risk_profiles_updated_at ON public.risk_profiles;
CREATE TRIGGER update_risk_profiles_updated_at
  BEFORE UPDATE ON public.risk_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- Row Level Security Policies
-- -----------------------------------------------------------------------------

-- datasets: Public read, admin manage
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to datasets"
  ON public.datasets FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage datasets"
  ON public.datasets FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- parcel_sources: Public read, admin manage
ALTER TABLE public.parcel_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to parcel_sources"
  ON public.parcel_sources FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage parcel_sources"
  ON public.parcel_sources FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service can insert parcel_sources"
  ON public.parcel_sources FOR INSERT
  WITH CHECK (true);

-- applications_draft: Users manage their own drafts
ALTER TABLE public.applications_draft ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own drafts"
  ON public.applications_draft FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own drafts"
  ON public.applications_draft FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drafts"
  ON public.applications_draft FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own drafts"
  ON public.applications_draft FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all drafts"
  ON public.applications_draft FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- application_overrides: Users manage via their drafts/applications
ALTER TABLE public.application_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own overrides"
  ON public.application_overrides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications_draft d 
      WHERE d.draft_id = application_draft_id AND d.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.applications a 
      WHERE a.id = application_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own overrides"
  ON public.application_overrides FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications_draft d 
      WHERE d.draft_id = application_draft_id AND d.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.applications a 
      WHERE a.id = application_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all overrides"
  ON public.application_overrides FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- risk_profiles: Users view via their applications
ALTER TABLE public.risk_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own risk profiles"
  ON public.risk_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a 
      WHERE a.id = application_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Service can manage risk profiles"
  ON public.risk_profiles FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view all risk profiles"
  ON public.risk_profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- -----------------------------------------------------------------------------
-- Helper Functions
-- -----------------------------------------------------------------------------

-- Get active datasets for a jurisdiction
CREATE OR REPLACE FUNCTION get_active_datasets(p_jurisdiction TEXT)
RETURNS SETOF public.datasets
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM public.datasets
  WHERE jurisdiction = p_jurisdiction
    AND status = 'active'
    AND (effective_to IS NULL OR effective_to > now())
  ORDER BY dataset_type, effective_from DESC;
$$;

-- Get draft by user (most recent unsubmitted)
CREATE OR REPLACE FUNCTION get_latest_draft(p_user_id UUID)
RETURNS public.applications_draft
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.applications_draft
  WHERE user_id = p_user_id
    AND submitted_at IS NULL
  ORDER BY updated_at DESC
  LIMIT 1;
$$;

-- Calculate override stats for an application
CREATE OR REPLACE FUNCTION get_override_stats(p_application_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    jsonb_build_object(
      'total_overrides', COUNT(*),
      'fields_overridden', array_agg(DISTINCT field_name),
      'avg_delta_percent', ROUND(AVG(ABS(delta_percent))::numeric, 2)
    ),
    '{}'::jsonb
  )
  FROM public.application_overrides
  WHERE application_id = p_application_id;
$$;

COMMENT ON FUNCTION get_active_datasets IS 'Returns active datasets for a given jurisdiction';
COMMENT ON FUNCTION get_latest_draft IS 'Returns the most recent unsubmitted draft for a user';
COMMENT ON FUNCTION get_override_stats IS 'Returns summary statistics of user overrides for an application';