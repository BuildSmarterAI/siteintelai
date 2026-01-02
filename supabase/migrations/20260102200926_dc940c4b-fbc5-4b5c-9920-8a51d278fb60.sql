-- =============================================
-- SiteIntel™ Design Mode Schema
-- Version: 1.0
-- Date: 2026-01-02
-- =============================================

-- 1. Regulatory Envelopes (immutable, computed per parcel)
CREATE TABLE public.regulatory_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  parcel_geometry GEOMETRY(Polygon, 4326) NOT NULL,
  buildable_footprint_2d GEOMETRY(Polygon, 4326) NOT NULL,
  envelope_3d_volume JSONB DEFAULT '{}', -- 3D representation as JSON
  far_cap NUMERIC(5,2),
  height_cap_ft NUMERIC(6,1),
  coverage_cap_pct NUMERIC(5,2),
  setbacks JSONB DEFAULT '{"front": 0, "rear": 0, "left": 0, "right": 0}',
  exclusion_zones JSONB DEFAULT '[]',
  buffer_zones JSONB DEFAULT '[]',
  constraints_source JSONB DEFAULT '{}', -- Source data references
  constraints_version TEXT DEFAULT 'v1.0',
  computed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(application_id, constraints_version)
);

-- 2. Design Sessions (user exploration container)
CREATE TABLE public.design_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  envelope_id UUID NOT NULL REFERENCES public.regulatory_envelopes(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Session',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_shared BOOLEAN DEFAULT false,
  shared_with JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Design Variants (individual test-fits)
CREATE TABLE public.design_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.design_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Variant A',
  footprint GEOMETRY(Polygon, 4326),
  height_ft NUMERIC(6,1) DEFAULT 0,
  floors INTEGER DEFAULT 1,
  preset_type TEXT, -- e.g., 'warehouse_1story', 'office_2story', 'retail_strip'
  notes TEXT,
  metrics JSONB DEFAULT '{
    "gross_floor_area_sf": 0,
    "far_used_pct": 0,
    "coverage_pct": 0,
    "envelope_utilization_pct": 0,
    "height_used_pct": 0
  }',
  compliance_status TEXT DEFAULT 'PENDING' CHECK (compliance_status IN ('PASS', 'WARN', 'FAIL', 'PENDING')),
  is_baseline BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Compliance Results (audit trail, append-only)
CREATE TABLE public.compliance_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.design_variants(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL, -- e.g., 'envelope_containment', 'far_limit', 'height_limit', 'coverage_limit', 'buffer_violation'
  status TEXT NOT NULL CHECK (status IN ('PASS', 'WARN', 'FAIL')),
  current_value NUMERIC,
  limit_value NUMERIC,
  unit TEXT, -- e.g., 'sqft', 'ft', 'pct'
  message TEXT,
  geometry_highlight GEOMETRY(Geometry, 4326), -- For highlighting violations on map
  checked_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Design Presets (system-defined and user-defined)
CREATE TABLE public.design_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  preset_key TEXT NOT NULL UNIQUE, -- e.g., 'warehouse_1story', 'office_2story'
  category TEXT NOT NULL, -- e.g., 'industrial', 'office', 'retail', 'multifamily'
  default_height_ft NUMERIC(6,1),
  default_floors INTEGER,
  coverage_target_pct NUMERIC(5,2),
  far_target_pct NUMERIC(5,2),
  icon TEXT, -- Lucide icon name
  is_system BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Indexes
-- =============================================

CREATE INDEX idx_regulatory_envelopes_application ON public.regulatory_envelopes(application_id);
CREATE INDEX idx_regulatory_envelopes_geometry ON public.regulatory_envelopes USING GIST(buildable_footprint_2d);

CREATE INDEX idx_design_sessions_user ON public.design_sessions(user_id);
CREATE INDEX idx_design_sessions_envelope ON public.design_sessions(envelope_id);
CREATE INDEX idx_design_sessions_active ON public.design_sessions(is_active) WHERE is_active = true;

CREATE INDEX idx_design_variants_session ON public.design_variants(session_id);
CREATE INDEX idx_design_variants_footprint ON public.design_variants USING GIST(footprint);
CREATE INDEX idx_design_variants_compliance ON public.design_variants(compliance_status);

CREATE INDEX idx_compliance_results_variant ON public.compliance_results(variant_id);
CREATE INDEX idx_compliance_results_check_type ON public.compliance_results(check_type);
CREATE INDEX idx_compliance_results_checked_at ON public.compliance_results(checked_at DESC);

-- =============================================
-- Row Level Security
-- =============================================

ALTER TABLE public.regulatory_envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_presets ENABLE ROW LEVEL SECURITY;

-- Regulatory Envelopes: Read-only for authenticated users who own the application
CREATE POLICY "Users can view envelopes for their applications"
  ON public.regulatory_envelopes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a 
      WHERE a.id = regulatory_envelopes.application_id 
      AND a.user_id = auth.uid()
    )
  );

-- Design Sessions: Full access for owner, read for shared users
CREATE POLICY "Users can manage their own design sessions"
  ON public.design_sessions FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can view shared design sessions"
  ON public.design_sessions FOR SELECT
  USING (
    is_shared = true 
    AND auth.uid()::text = ANY(SELECT jsonb_array_elements_text(shared_with))
  );

-- Design Variants: Access through session ownership
CREATE POLICY "Users can manage variants in their sessions"
  ON public.design_variants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.design_sessions ds 
      WHERE ds.id = design_variants.session_id 
      AND ds.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view variants in shared sessions"
  ON public.design_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.design_sessions ds 
      WHERE ds.id = design_variants.session_id 
      AND ds.is_shared = true 
      AND auth.uid()::text = ANY(SELECT jsonb_array_elements_text(ds.shared_with))
    )
  );

-- Compliance Results: Read-only access through variant ownership
CREATE POLICY "Users can view compliance results for their variants"
  ON public.compliance_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.design_variants dv
      JOIN public.design_sessions ds ON ds.id = dv.session_id
      WHERE dv.id = compliance_results.variant_id 
      AND ds.user_id = auth.uid()
    )
  );

-- Insert-only for compliance results (audit trail)
CREATE POLICY "System can insert compliance results"
  ON public.compliance_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.design_variants dv
      JOIN public.design_sessions ds ON ds.id = dv.session_id
      WHERE dv.id = compliance_results.variant_id 
      AND ds.user_id = auth.uid()
    )
  );

-- Design Presets: System presets readable by all, user presets by owner
CREATE POLICY "Anyone can view system presets"
  ON public.design_presets FOR SELECT
  USING (is_system = true);

CREATE POLICY "Users can manage their own presets"
  ON public.design_presets FOR ALL
  USING (user_id = auth.uid());

-- =============================================
-- Trigger for updated_at
-- =============================================

CREATE OR REPLACE FUNCTION public.update_design_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_design_sessions_updated_at
  BEFORE UPDATE ON public.design_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_design_updated_at();

CREATE TRIGGER update_design_variants_updated_at
  BEFORE UPDATE ON public.design_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_design_updated_at();

-- =============================================
-- Insert Default System Presets
-- =============================================

INSERT INTO public.design_presets (name, description, preset_key, category, default_height_ft, default_floors, coverage_target_pct, far_target_pct, icon, is_system) VALUES
  ('1-Story Warehouse', 'Maximum footprint industrial building with 24ft clear height', 'warehouse_1story', 'industrial', 24, 1, 85, 85, 'Warehouse', true),
  ('2-Story Office Shell', 'Standard office building with 60% lot coverage', 'office_2story', 'office', 35, 2, 60, 120, 'Building2', true),
  ('Retail Strip', 'Single-story retail with maximum frontage exposure', 'retail_strip', 'retail', 20, 1, 80, 80, 'Store', true),
  ('3-Story Multifamily Shell', 'Garden-style apartments maximizing FAR', 'multifamily_3story', 'multifamily', 45, 3, 50, 150, 'Home', true),
  ('Flex Industrial', '2-story flex space with dock-high loading', 'flex_industrial', 'industrial', 32, 2, 70, 140, 'Factory', true),
  ('Medical Office', 'Single-story medical office with parking considerations', 'medical_office', 'office', 18, 1, 40, 40, 'Stethoscope', true);

-- =============================================
-- PostGIS Helper Functions
-- =============================================

-- Compute buildable footprint from parcel with setbacks
CREATE OR REPLACE FUNCTION public.compute_buildable_footprint(
  parcel_geom GEOMETRY,
  setback_front_ft NUMERIC DEFAULT 25,
  setback_rear_ft NUMERIC DEFAULT 10,
  setback_side_ft NUMERIC DEFAULT 10
)
RETURNS GEOMETRY
LANGUAGE sql
IMMUTABLE PARALLEL SAFE
SET search_path = public
AS $$
  -- Convert feet to degrees (approximate for Texas ~29.7° latitude)
  -- 1 degree latitude ≈ 364,000 feet, 1 degree longitude ≈ 318,000 feet at 29.7°
  SELECT ST_Buffer(
    parcel_geom,
    -GREATEST(setback_front_ft, setback_rear_ft, setback_side_ft) / 364000.0,
    'join=mitre'
  );
$$;

-- Check if design geometry is fully contained within envelope
CREATE OR REPLACE FUNCTION public.check_geometry_containment(
  design_geom GEOMETRY,
  envelope_geom GEOMETRY
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE PARALLEL SAFE
SET search_path = public
AS $$
  SELECT ST_Contains(envelope_geom, design_geom);
$$;

-- Calculate coverage percentage
CREATE OR REPLACE FUNCTION public.calculate_coverage_pct(
  design_geom GEOMETRY,
  parcel_geom GEOMETRY
)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE PARALLEL SAFE
SET search_path = public
AS $$
  SELECT ROUND(
    (ST_Area(ST_Transform(design_geom, 2278)) / 
     NULLIF(ST_Area(ST_Transform(parcel_geom, 2278)), 0) * 100)::NUMERIC,
    2
  );
$$;

-- Calculate gross floor area in square feet
CREATE OR REPLACE FUNCTION public.calculate_gfa_sqft(
  footprint_geom GEOMETRY,
  floors INTEGER
)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE PARALLEL SAFE
SET search_path = public
AS $$
  SELECT ROUND(
    (ST_Area(ST_Transform(footprint_geom, 2278)) * floors)::NUMERIC,
    0
  );
$$;