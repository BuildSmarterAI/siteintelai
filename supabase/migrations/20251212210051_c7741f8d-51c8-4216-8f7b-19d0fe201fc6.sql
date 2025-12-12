-- ============================================
-- PHASE 1: BUILDABILITY ENGINE DATABASE FOUNDATION
-- ============================================

-- 1. Create buildability_outputs table (unified output regardless of path)
CREATE TABLE IF NOT EXISTS public.buildability_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  parcel_id TEXT,
  
  -- Path determination
  governing_path TEXT NOT NULL CHECK (governing_path IN ('Houston_Deed', 'Formal_Zoning', 'ETJ_Standards', 'County_Standards')),
  governing_authority JSONB DEFAULT '{}',
  -- { city, county, etj, special_districts: [] }
  
  -- Constraints (unified output regardless of path)
  constraints JSONB NOT NULL DEFAULT '{}',
  -- { setbacks_ft: {front, side, rear, street_side}, height_max_ft, max_far, lot_coverage_max_pct, use_rules: {...}, easements: {...} }
  
  -- Buildable envelope
  buildable_envelope JSONB NOT NULL DEFAULT '{}',
  -- { max_footprint_sf, max_floor_area_sf, max_height_ft, stories_max, max_buildable_sf, net_buildable_area_sf }
  
  -- Validation results
  validation JSONB DEFAULT '{}',
  -- { proposed_program_valid, issues: [] }
  
  -- Status
  buildability_status TEXT CHECK (buildability_status IN ('Buildable', 'Conditionally Buildable', 'Not Buildable', 'Unknown')),
  kill_factors TEXT[] DEFAULT '{}',
  
  -- Confidence
  confidence JSONB DEFAULT '{"level": "Low", "score_0_100": 0, "reasons": []}',
  -- { level: 'High'|'Medium'|'Low', score_0_100, reasons: [] }
  
  -- Sources
  sources JSONB DEFAULT '[]',
  -- [{ source_type, source_id, retrieved_at, notes }]
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for buildability_outputs
CREATE INDEX IF NOT EXISTS idx_buildability_outputs_application ON public.buildability_outputs(application_id);
CREATE INDEX IF NOT EXISTS idx_buildability_outputs_parcel ON public.buildability_outputs(parcel_id);
CREATE INDEX IF NOT EXISTS idx_buildability_outputs_status ON public.buildability_outputs(buildability_status);
CREATE INDEX IF NOT EXISTS idx_buildability_outputs_path ON public.buildability_outputs(governing_path);

-- 2. Create deed_restriction_docs table (Houston-specific)
CREATE TABLE IF NOT EXISTS public.deed_restriction_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_no TEXT NOT NULL,
  county TEXT DEFAULT 'Harris',
  recorded_date DATE,
  doc_type TEXT, -- 'Declaration of Restrictions', 'Amendment', 'Supplement', etc.
  subdivision_name TEXT,
  lot_block_pattern TEXT, -- regex or pattern for matching lots
  file_hash TEXT, -- for deduplication
  storage_path TEXT, -- Supabase storage path
  source_url TEXT, -- original retrieval URL
  extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'extracted', 'failed', 'manual_review')),
  extracted_constraints JSONB DEFAULT '{}',
  -- { setbacks_ft: {}, lot_coverage_max_pct, height_max_ft, use_restrictions: {allowed: [], prohibited: []}, minimum_building_sf, materials_restrictions: [] }
  extraction_citations JSONB DEFAULT '[]',
  -- [{ page, text_span, constraint_type }]
  confidence NUMERIC DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  manual_review_required BOOLEAN DEFAULT false,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for deed_restriction_docs
CREATE INDEX IF NOT EXISTS idx_deed_docs_instrument ON public.deed_restriction_docs(instrument_no);
CREATE INDEX IF NOT EXISTS idx_deed_docs_subdivision ON public.deed_restriction_docs(subdivision_name);
CREATE INDEX IF NOT EXISTS idx_deed_docs_county ON public.deed_restriction_docs(county);
CREATE INDEX IF NOT EXISTS idx_deed_docs_status ON public.deed_restriction_docs(extraction_status);
CREATE INDEX IF NOT EXISTS idx_deed_docs_hash ON public.deed_restriction_docs(file_hash);

-- 3. Create plat_documents table
CREATE TABLE IF NOT EXISTS public.plat_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plat_name TEXT NOT NULL,
  county TEXT DEFAULT 'Harris',
  recorded_date DATE,
  subdivision_name TEXT,
  volume_page TEXT, -- e.g., "Vol. 123, Page 45"
  file_hash TEXT,
  storage_path TEXT,
  source_url TEXT,
  extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'extracted', 'failed', 'manual_review')),
  extracted_features JSONB DEFAULT '{}',
  -- { building_lines: [], easements: [], no_build_zones: [], setback_notes: [] }
  constraint_geometry JSONB, -- GeoJSON of constraint polygons
  orientation_data JSONB DEFAULT '{}',
  -- { front_edge_id, corner_lot, orientation_confidence }
  confidence NUMERIC DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  manual_review_required BOOLEAN DEFAULT false,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for plat_documents
CREATE INDEX IF NOT EXISTS idx_plat_docs_name ON public.plat_documents(plat_name);
CREATE INDEX IF NOT EXISTS idx_plat_docs_subdivision ON public.plat_documents(subdivision_name);
CREATE INDEX IF NOT EXISTS idx_plat_docs_county ON public.plat_documents(county);
CREATE INDEX IF NOT EXISTS idx_plat_docs_status ON public.plat_documents(extraction_status);
CREATE INDEX IF NOT EXISTS idx_plat_docs_hash ON public.plat_documents(file_hash);

-- 4. Create buildability_rulesets table (per jurisdiction)
CREATE TABLE IF NOT EXISTS public.buildability_rulesets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_key TEXT NOT NULL UNIQUE, -- 'harris_county', 'city_of_houston', 'city_of_austin', etc.
  jurisdiction_type TEXT NOT NULL CHECK (jurisdiction_type IN ('city', 'county', 'etj', 'special_district')),
  jurisdiction_name TEXT NOT NULL,
  governing_path TEXT NOT NULL CHECK (governing_path IN ('Houston_Deed', 'Formal_Zoning', 'ETJ_Standards', 'County_Standards')),
  
  -- Default setbacks when no deed/plat overrides
  default_setbacks JSONB DEFAULT '{"front": 25, "side": 10, "rear": 15, "street_side": 15}',
  
  -- Development controls
  development_controls JSONB DEFAULT '{}',
  -- { drainage_detention_required, platting_required, driveway_permit_required, etc. }
  
  -- Default story height assumptions (for stories_max calculation)
  story_height_assumptions JSONB DEFAULT '{"residential": 10, "office": 14, "industrial": 24, "hotel": 11}',
  
  -- Version tracking
  version TEXT DEFAULT 'v1',
  effective_date DATE DEFAULT CURRENT_DATE,
  superseded_by UUID REFERENCES public.buildability_rulesets(id),
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  source_document TEXT, -- reference to ordinance or code
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for buildability_rulesets
CREATE INDEX IF NOT EXISTS idx_rulesets_jurisdiction ON public.buildability_rulesets(jurisdiction_key);
CREATE INDEX IF NOT EXISTS idx_rulesets_type ON public.buildability_rulesets(jurisdiction_type);
CREATE INDEX IF NOT EXISTS idx_rulesets_path ON public.buildability_rulesets(governing_path);
CREATE INDEX IF NOT EXISTS idx_rulesets_active ON public.buildability_rulesets(is_active) WHERE is_active = true;

-- 5. Create deed_parcel_links junction table (maps deed restrictions to parcels)
CREATE TABLE IF NOT EXISTS public.deed_parcel_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deed_doc_id UUID NOT NULL REFERENCES public.deed_restriction_docs(id) ON DELETE CASCADE,
  parcel_id TEXT NOT NULL,
  match_confidence NUMERIC DEFAULT 0.5 CHECK (match_confidence >= 0 AND match_confidence <= 1),
  match_method TEXT, -- 'subdivision_match', 'lot_block_match', 'chain_of_title', 'manual'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(deed_doc_id, parcel_id)
);

CREATE INDEX IF NOT EXISTS idx_deed_parcel_links_deed ON public.deed_parcel_links(deed_doc_id);
CREATE INDEX IF NOT EXISTS idx_deed_parcel_links_parcel ON public.deed_parcel_links(parcel_id);

-- 6. Add buildability columns to applications table
ALTER TABLE public.applications 
  ADD COLUMN IF NOT EXISTS buildability_output_id UUID REFERENCES public.buildability_outputs(id),
  ADD COLUMN IF NOT EXISTS governing_path TEXT,
  ADD COLUMN IF NOT EXISTS max_buildable_sf NUMERIC,
  ADD COLUMN IF NOT EXISTS net_buildable_area_sf NUMERIC,
  ADD COLUMN IF NOT EXISTS buildability_status TEXT,
  ADD COLUMN IF NOT EXISTS kill_factors_triggered TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_applications_buildability ON public.applications(buildability_output_id);
CREATE INDEX IF NOT EXISTS idx_applications_buildability_status ON public.applications(buildability_status);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE public.buildability_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deed_restriction_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plat_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildability_rulesets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deed_parcel_links ENABLE ROW LEVEL SECURITY;

-- buildability_outputs: Users can view their own, admins can view all
CREATE POLICY "Users can view own buildability outputs"
  ON public.buildability_outputs FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM public.applications WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all buildability outputs"
  ON public.buildability_outputs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage buildability outputs"
  ON public.buildability_outputs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- deed_restriction_docs: Public read, admin/service write
CREATE POLICY "Public read access to deed restriction docs"
  ON public.deed_restriction_docs FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage deed restriction docs"
  ON public.deed_restriction_docs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage deed restriction docs"
  ON public.deed_restriction_docs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- plat_documents: Public read, admin/service write
CREATE POLICY "Public read access to plat documents"
  ON public.plat_documents FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage plat documents"
  ON public.plat_documents FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage plat documents"
  ON public.plat_documents FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- buildability_rulesets: Public read, admin/service write
CREATE POLICY "Public read access to buildability rulesets"
  ON public.buildability_rulesets FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage buildability rulesets"
  ON public.buildability_rulesets FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage buildability rulesets"
  ON public.buildability_rulesets FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- deed_parcel_links: Public read, admin/service write
CREATE POLICY "Public read access to deed parcel links"
  ON public.deed_parcel_links FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage deed parcel links"
  ON public.deed_parcel_links FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage deed parcel links"
  ON public.deed_parcel_links FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- SEED INITIAL BUILDABILITY RULESETS
-- ============================================

INSERT INTO public.buildability_rulesets (jurisdiction_key, jurisdiction_type, jurisdiction_name, governing_path, default_setbacks, development_controls, notes)
VALUES 
  ('city_of_houston', 'city', 'City of Houston', 'Houston_Deed', 
   '{"front": 25, "side": 5, "rear": 5, "street_side": 10}',
   '{"drainage_detention_required": true, "platting_required": true, "driveway_permit_required": true, "building_permit_required": true}',
   'Houston has no traditional zoning; deed restrictions and plats govern buildability'),
  
  ('harris_county', 'county', 'Harris County', 'Houston_Deed',
   '{"front": 25, "side": 10, "rear": 15, "street_side": 15}',
   '{"drainage_detention_required": true, "platting_required": true, "septic_permit_if_no_sewer": true}',
   'Unincorporated Harris County follows deed restriction model'),
  
  ('city_of_austin', 'city', 'City of Austin', 'Formal_Zoning',
   '{"front": 25, "side": 5, "rear": 10, "street_side": 15}',
   '{"drainage_detention_required": true, "platting_required": true, "tree_ordinance": true, "impervious_cover_limits": true}',
   'Austin uses formal zoning with overlay districts'),
  
  ('travis_county', 'county', 'Travis County', 'County_Standards',
   '{"front": 30, "side": 15, "rear": 25, "street_side": 20}',
   '{"drainage_detention_required": true, "environmental_review": true, "septic_permit_if_no_sewer": true}',
   'Travis County development standards for unincorporated areas'),
  
  ('city_of_san_antonio', 'city', 'City of San Antonio', 'Formal_Zoning',
   '{"front": 20, "side": 5, "rear": 5, "street_side": 10}',
   '{"drainage_detention_required": true, "platting_required": true}',
   'San Antonio unified development code'),
  
  ('bexar_county', 'county', 'Bexar County', 'County_Standards',
   '{"front": 25, "side": 10, "rear": 15, "street_side": 15}',
   '{"drainage_detention_required": true, "septic_permit_if_no_sewer": true}',
   'Bexar County standards for unincorporated areas'),
  
  ('city_of_dallas', 'city', 'City of Dallas', 'Formal_Zoning',
   '{"front": 15, "side": 5, "rear": 5, "street_side": 10}',
   '{"drainage_detention_required": true, "platting_required": true, "tree_preservation": true}',
   'Dallas development code with formal zoning districts'),
  
  ('dallas_county', 'county', 'Dallas County', 'County_Standards',
   '{"front": 25, "side": 10, "rear": 15, "street_side": 15}',
   '{"drainage_detention_required": true, "septic_permit_if_no_sewer": true}',
   'Dallas County standards for unincorporated areas')
ON CONFLICT (jurisdiction_key) DO UPDATE SET
  default_setbacks = EXCLUDED.default_setbacks,
  development_controls = EXCLUDED.development_controls,
  updated_at = now();

-- ============================================
-- TRIGGER FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_buildability_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_buildability_outputs_updated ON public.buildability_outputs;
CREATE TRIGGER trg_buildability_outputs_updated
  BEFORE UPDATE ON public.buildability_outputs
  FOR EACH ROW EXECUTE FUNCTION update_buildability_timestamp();

DROP TRIGGER IF EXISTS trg_deed_docs_updated ON public.deed_restriction_docs;
CREATE TRIGGER trg_deed_docs_updated
  BEFORE UPDATE ON public.deed_restriction_docs
  FOR EACH ROW EXECUTE FUNCTION update_buildability_timestamp();

DROP TRIGGER IF EXISTS trg_plat_docs_updated ON public.plat_documents;
CREATE TRIGGER trg_plat_docs_updated
  BEFORE UPDATE ON public.plat_documents
  FOR EACH ROW EXECUTE FUNCTION update_buildability_timestamp();

DROP TRIGGER IF EXISTS trg_rulesets_updated ON public.buildability_rulesets;
CREATE TRIGGER trg_rulesets_updated
  BEFORE UPDATE ON public.buildability_rulesets
  FOR EACH ROW EXECUTE FUNCTION update_buildability_timestamp();