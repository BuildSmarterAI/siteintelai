-- ============================================================
-- Enhanced Survey-First Parcel Matching RPCs
-- Harris County focus (SRID 4326, jurisdiction = 'Harris County')
-- ============================================================

-- Drop existing function if exists (clean upgrade)
DROP FUNCTION IF EXISTS public.match_parcels_to_survey_v2;
DROP FUNCTION IF EXISTS public.check_survey_auto_select;
DROP FUNCTION IF EXISTS public.find_multi_parcel_assembly;

-- ============================================================
-- 1. match_parcels_to_survey_v2: Weighted composite scoring
-- Scoring: 65% geometry overlap + 25% gross acreage + 10% net acreage
-- ============================================================
CREATE OR REPLACE FUNCTION public.match_parcels_to_survey_v2(
  survey_wkt text,
  gross_acres numeric DEFAULT NULL,
  net_acres numeric DEFAULT NULL,
  county_filter text DEFAULT NULL,
  limit_count int DEFAULT 15
)
RETURNS TABLE (
  id bigint,
  source_parcel_id text,
  jurisdiction text,
  situs_address text,
  owner_name text,
  parcel_acres numeric,
  overlap_acres numeric,
  overlap_pct double precision,
  gross_acre_delta numeric,
  net_acre_delta numeric,
  match_score double precision,
  confidence_tier text,
  geom_json text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  survey_geom geometry;
  survey_area_acres numeric;
BEGIN
  -- Parse and validate survey geometry
  survey_geom := ST_MakeValid(ST_GeomFromText(survey_wkt, 4326));
  
  IF survey_geom IS NULL THEN
    RAISE EXCEPTION 'Invalid survey geometry WKT';
  END IF;
  
  -- Calculate survey area in acres (geography for accuracy)
  survey_area_acres := ST_Area(survey_geom::geography) / 4046.8564224;
  
  RETURN QUERY
  WITH candidates AS (
    SELECT
      p.id,
      p.source_parcel_id,
      p.jurisdiction,
      p.situs_address,
      p.owner_name,
      p.geom,
      -- Parcel acres from geometry (don't trust CAD acreage fields)
      (ST_Area(p.geom::geography) / 4046.8564224)::numeric AS parcel_acres,
      -- Overlap area in acres
      (ST_Area(ST_Intersection(p.geom, survey_geom)::geography) / 4046.8564224)::numeric AS overlap_acres,
      -- Overlap percentage (of survey area, not parcel area - survey is truth)
      (ST_Area(ST_Intersection(p.geom, survey_geom)::geography) / 
       NULLIF(ST_Area(survey_geom::geography), 0))::double precision AS overlap_pct
    FROM canonical_parcels p
    WHERE 
      -- Bbox prefilter for performance
      p.geom && ST_Envelope(survey_geom)
      -- Actual intersection check
      AND ST_Intersects(p.geom, survey_geom)
      -- Optional county filter
      AND (county_filter IS NULL OR p.jurisdiction ILIKE '%' || county_filter || '%')
  ),
  scored AS (
    SELECT
      c.id,
      c.source_parcel_id,
      c.jurisdiction,
      c.situs_address,
      c.owner_name,
      c.parcel_acres,
      c.overlap_acres,
      c.overlap_pct,
      c.geom,
      -- Gross acreage delta
      ABS(c.parcel_acres - COALESCE(gross_acres, c.parcel_acres)) AS gross_acre_delta,
      -- Net acreage delta (compare overlap to net if available)
      CASE 
        WHEN net_acres IS NULL THEN NULL
        ELSE ABS(c.overlap_acres - net_acres)
      END AS net_acre_delta,
      
      -- Normalized sub-scores (0 to 1)
      -- s_geom: Geometry overlap (clamped 0-1)
      LEAST(1.0, GREATEST(0.0, c.overlap_pct)) AS s_geom,
      
      -- s_gross: Gross acreage score (10% tolerance band)
      CASE 
        WHEN gross_acres IS NULL OR gross_acres = 0 THEN 0.5 -- neutral if no gross provided
        ELSE GREATEST(0.0, 1.0 - (ABS(c.parcel_acres - gross_acres) / (gross_acres * 0.10)))
      END AS s_gross,
      
      -- s_net: Net acreage score (10% tolerance band, optional)
      CASE 
        WHEN net_acres IS NULL OR net_acres = 0 THEN 0.0 -- no contribution if no net
        ELSE GREATEST(0.0, 1.0 - (ABS(c.overlap_acres - net_acres) / (net_acres * 0.10)))
      END AS s_net
    FROM candidates c
  )
  SELECT
    s.id,
    s.source_parcel_id,
    s.jurisdiction,
    s.situs_address,
    s.owner_name,
    s.parcel_acres,
    s.overlap_acres,
    s.overlap_pct,
    s.gross_acre_delta,
    s.net_acre_delta,
    -- Weighted composite score: 65% geometry + 25% gross + 10% net
    (0.65 * s.s_geom + 0.25 * s.s_gross + 0.10 * s.s_net)::double precision AS match_score,
    -- Confidence tier based on thresholds
    CASE
      WHEN (0.65 * s.s_geom + 0.25 * s.s_gross + 0.10 * s.s_net) >= 0.85 AND s.s_geom >= 0.90 THEN 'HIGH'
      WHEN (0.65 * s.s_geom + 0.25 * s.s_gross + 0.10 * s.s_net) >= 0.65 AND s.s_geom >= 0.75 THEN 'MEDIUM'
      ELSE 'LOW'
    END AS confidence_tier,
    -- Return geometry as GeoJSON for frontend
    ST_AsGeoJSON(s.geom)::text AS geom_json
  FROM scored s
  ORDER BY (0.65 * s.s_geom + 0.25 * s.s_gross + 0.10 * s.s_net) DESC
  LIMIT limit_count;
END;
$$;

-- ============================================================
-- 2. check_survey_auto_select: Validate if auto-selection is safe
-- Returns TRUE only if: score >= 0.85, overlap >= 0.90, and gap >= 0.10
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_survey_auto_select(
  survey_wkt text,
  gross_acres numeric DEFAULT NULL,
  net_acres numeric DEFAULT NULL,
  county_filter text DEFAULT NULL
)
RETURNS TABLE (
  auto_select_ok boolean,
  best_parcel_id bigint,
  best_score double precision,
  best_overlap_pct double precision,
  runner_up_score double precision,
  score_gap double precision,
  reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r_best record;
  r_runner_up record;
  v_auto_select boolean := false;
  v_reason text := 'NO_CANDIDATES';
BEGIN
  -- Get top 2 candidates
  SELECT * INTO r_best
  FROM match_parcels_to_survey_v2(survey_wkt, gross_acres, net_acres, county_filter, 2)
  LIMIT 1;
  
  SELECT * INTO r_runner_up
  FROM match_parcels_to_survey_v2(survey_wkt, gross_acres, net_acres, county_filter, 2)
  OFFSET 1 LIMIT 1;
  
  -- Evaluate auto-select rules
  IF r_best IS NULL THEN
    v_reason := 'NO_CANDIDATES';
  ELSIF r_best.match_score < 0.85 THEN
    v_reason := 'SCORE_BELOW_THRESHOLD';
  ELSIF r_best.overlap_pct < 0.90 THEN
    v_reason := 'OVERLAP_BELOW_THRESHOLD';
  ELSIF r_runner_up IS NOT NULL AND (r_best.match_score - r_runner_up.match_score) < 0.10 THEN
    v_reason := 'AMBIGUOUS_CANDIDATES';
  ELSE
    v_auto_select := true;
    v_reason := 'AUTO_SELECT_OK';
  END IF;
  
  RETURN QUERY SELECT
    v_auto_select,
    r_best.id,
    r_best.match_score,
    r_best.overlap_pct,
    r_runner_up.match_score,
    CASE WHEN r_runner_up IS NOT NULL THEN r_best.match_score - r_runner_up.match_score ELSE NULL END,
    v_reason;
END;
$$;

-- ============================================================
-- 3. find_multi_parcel_assembly: Greedy union when survey spans multiple CAD parcels
-- Uses adjacency-based assembly starting from highest overlap parcel
-- ============================================================
CREATE OR REPLACE FUNCTION public.find_multi_parcel_assembly(
  survey_wkt text,
  gross_acres numeric,
  county_filter text DEFAULT NULL,
  max_parcels int DEFAULT 8
)
RETURNS TABLE (
  parcel_ids text[],
  union_acres numeric,
  overlap_acres numeric,
  overlap_pct double precision,
  gross_delta numeric,
  match_score double precision,
  union_geom_json text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  survey_geom geometry;
BEGIN
  -- Parse and validate survey geometry
  survey_geom := ST_MakeValid(ST_GeomFromText(survey_wkt, 4326));
  
  IF survey_geom IS NULL THEN
    RAISE EXCEPTION 'Invalid survey geometry WKT';
  END IF;
  
  RETURN QUERY
  WITH RECURSIVE
  -- Get all candidate parcels that intersect the survey
  cand AS (
    SELECT
      p.id,
      p.source_parcel_id,
      p.geom,
      (ST_Area(ST_Intersection(p.geom, survey_geom)::geography) / 4046.8564224)::numeric AS overlap_acres,
      (ST_Area(ST_Intersection(p.geom, survey_geom)::geography) / 
       NULLIF(ST_Area(survey_geom::geography), 0))::double precision AS overlap_pct
    FROM canonical_parcels p
    WHERE 
      p.geom && ST_Envelope(survey_geom)
      AND ST_Intersects(p.geom, survey_geom)
      AND (county_filter IS NULL OR p.jurisdiction ILIKE '%' || county_filter || '%')
  ),
  -- Start with the highest overlap parcel as seed
  seed AS (
    SELECT 
      ARRAY[source_parcel_id]::text[] AS parcel_ids,
      geom AS union_geom,
      1 AS parcel_count
    FROM cand
    ORDER BY overlap_pct DESC
    LIMIT 1
  ),
  -- Recursively add adjacent parcels
  iter AS (
    SELECT * FROM seed
    UNION ALL
    SELECT
      i.parcel_ids || c.source_parcel_id,
      ST_UnaryUnion(ST_Collect(i.union_geom, c.geom)) AS union_geom,
      i.parcel_count + 1 AS parcel_count
    FROM iter i
    CROSS JOIN LATERAL (
      SELECT ca.source_parcel_id, ca.geom
      FROM cand ca
      WHERE NOT (ca.source_parcel_id = ANY(i.parcel_ids))
        AND ST_Touches(i.union_geom, ca.geom)
      ORDER BY ca.overlap_pct DESC
      LIMIT 1
    ) c
    WHERE i.parcel_count < max_parcels
  ),
  -- Score all assembly combinations
  scored AS (
    SELECT
      i.parcel_ids,
      i.union_geom,
      (ST_Area(i.union_geom::geography) / 4046.8564224)::numeric AS union_acres,
      (ST_Area(ST_Intersection(i.union_geom, survey_geom)::geography) / 4046.8564224)::numeric AS overlap_acres,
      (ST_Area(ST_Intersection(i.union_geom, survey_geom)::geography) / 
       NULLIF(ST_Area(survey_geom::geography), 0))::double precision AS overlap_pct,
      ABS((ST_Area(i.union_geom::geography) / 4046.8564224) - gross_acres)::numeric AS gross_delta
    FROM iter i
  )
  SELECT
    s.parcel_ids,
    s.union_acres,
    s.overlap_acres,
    s.overlap_pct,
    s.gross_delta,
    -- Score: 75% overlap + 25% acreage match (within 10% tolerance)
    (0.75 * s.overlap_pct + 0.25 * GREATEST(0, 1 - (s.gross_delta / NULLIF(gross_acres * 0.10, 0))))::double precision AS match_score,
    ST_AsGeoJSON(s.union_geom)::text AS union_geom_json
  FROM scored s
  ORDER BY (0.75 * s.overlap_pct + 0.25 * GREATEST(0, 1 - (s.gross_delta / NULLIF(gross_acres * 0.10, 0)))) DESC
  LIMIT 10;
END;
$$;

-- ============================================================
-- 4. Add performance indexes if not exists
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_canonical_parcels_geom_gist 
  ON canonical_parcels USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_canonical_parcels_jurisdiction 
  ON canonical_parcels (jurisdiction);

-- Composite index for county + geometry queries
CREATE INDEX IF NOT EXISTS idx_canonical_parcels_jurisdiction_geom 
  ON canonical_parcels USING GIST (geom) 
  WHERE jurisdiction IS NOT NULL;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.match_parcels_to_survey_v2 TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_survey_auto_select TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.find_multi_parcel_assembly TO authenticated, anon;

-- ============================================================
-- 5. Add new columns to survey_uploads for enhanced tracking
-- ============================================================
ALTER TABLE IF EXISTS survey_uploads 
  ADD COLUMN IF NOT EXISTS gross_acreage numeric,
  ADD COLUMN IF NOT EXISTS net_acreage numeric,
  ADD COLUMN IF NOT EXISTS row_acreage numeric,
  ADD COLUMN IF NOT EXISTS geometry_confidence_level text,
  ADD COLUMN IF NOT EXISTS parcel_identity_confidence_level text,
  ADD COLUMN IF NOT EXISTS report_grade text;

-- Add check constraint for valid confidence levels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_geometry_confidence_level'
  ) THEN
    ALTER TABLE survey_uploads 
      ADD CONSTRAINT chk_geometry_confidence_level 
      CHECK (geometry_confidence_level IN ('HIGH', 'MEDIUM', 'LOW', 'NONE') OR geometry_confidence_level IS NULL);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_parcel_identity_confidence_level'
  ) THEN
    ALTER TABLE survey_uploads 
      ADD CONSTRAINT chk_parcel_identity_confidence_level 
      CHECK (parcel_identity_confidence_level IN ('HIGH', 'MEDIUM', 'LOW', 'NONE') OR parcel_identity_confidence_level IS NULL);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_report_grade'
  ) THEN
    ALTER TABLE survey_uploads 
      ADD CONSTRAINT chk_report_grade 
      CHECK (report_grade IN ('LENDER_READY', 'SCREENING_ONLY') OR report_grade IS NULL);
  END IF;
END;
$$;

COMMENT ON FUNCTION public.match_parcels_to_survey_v2 IS 
'Survey-first parcel matching with weighted composite scoring. 
Weights: 65% geometry overlap + 25% gross acreage + 10% net acreage.
Confidence tiers: HIGH (>=0.85 score, >=0.90 overlap), MEDIUM (>=0.65, >=0.75), LOW (else)';

COMMENT ON FUNCTION public.check_survey_auto_select IS 
'Validates if auto-selection is safe. Returns TRUE only if:
- match_score >= 0.85
- overlap_pct >= 0.90
- No runner-up, OR score gap >= 0.10';

COMMENT ON FUNCTION public.find_multi_parcel_assembly IS 
'Greedy union assembly for surveys spanning multiple CAD parcels.
Starts from highest overlap parcel, adds adjacent parcels via ST_Touches.
Capped at max_parcels (default 8) to prevent explosion.';