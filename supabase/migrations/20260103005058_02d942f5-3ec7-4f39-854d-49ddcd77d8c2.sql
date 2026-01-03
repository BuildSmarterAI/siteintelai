-- ============================================================
-- Survey Auto-Match Enhancement Migration
-- Adds survey_type column and creates owner/area matching RPCs
-- ============================================================

-- 1. Add survey_type column to survey_uploads
ALTER TABLE survey_uploads ADD COLUMN IF NOT EXISTS survey_type TEXT;
COMMENT ON COLUMN survey_uploads.survey_type IS 'Classified survey type: LAND_TITLE_SURVEY, RECORDED_PLAT, BOUNDARY_ONLY, UNKNOWN';

-- 2. Add extracted fields for enhanced matching
ALTER TABLE survey_uploads ADD COLUMN IF NOT EXISTS extracted_owner_name TEXT;
ALTER TABLE survey_uploads ADD COLUMN IF NOT EXISTS extracted_acreage NUMERIC;
ALTER TABLE survey_uploads ADD COLUMN IF NOT EXISTS extracted_legal_description JSONB;

-- 3. Create function to find parcels by owner name (trigram fuzzy match)
CREATE OR REPLACE FUNCTION find_parcels_by_owner(
  p_owner_name TEXT,
  p_county TEXT DEFAULT NULL,
  p_acreage_min NUMERIC DEFAULT NULL,
  p_acreage_max NUMERIC DEFAULT NULL,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  parcel_uuid UUID,
  source_parcel_id TEXT,
  owner_name TEXT,
  situs_address TEXT,
  acreage NUMERIC,
  county TEXT,
  match_score NUMERIC,
  match_type TEXT,
  geometry JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_owner TEXT;
BEGIN
  -- Normalize owner name: uppercase, remove common suffixes, collapse whitespace
  normalized_owner := UPPER(TRIM(regexp_replace(
    regexp_replace(p_owner_name, '\s*(LLC|INC|LP|LLP|CORP|CORPORATION|CO|COMPANY|LTD|LIMITED|TRUST|TRUSTEE|FAMILY|PROPERTIES|INVESTMENTS|HOLDINGS|ENTERPRISES|GROUP)\s*$', '', 'gi'),
    '\s+', ' ', 'g'
  )));
  
  RETURN QUERY
  SELECT 
    p.parcel_uuid,
    p.source_parcel_id,
    p.owner_name,
    p.situs_address,
    p.acreage,
    p.county,
    -- Score based on similarity (0-1)
    CASE 
      WHEN UPPER(p.owner_name) = normalized_owner THEN 1.0
      WHEN UPPER(p.owner_name) ILIKE normalized_owner || '%' THEN 0.9
      WHEN UPPER(p.owner_name) ILIKE '%' || normalized_owner || '%' THEN 0.8
      ELSE similarity(UPPER(COALESCE(p.owner_name, '')), normalized_owner)
    END AS match_score,
    'OWNER_MATCH'::TEXT AS match_type,
    ST_AsGeoJSON(p.geometry)::JSONB AS geometry
  FROM parcels p
  WHERE 
    -- County filter (optional)
    (p_county IS NULL OR UPPER(p.county) = UPPER(p_county))
    -- Acreage filter (optional)
    AND (p_acreage_min IS NULL OR p.acreage >= p_acreage_min)
    AND (p_acreage_max IS NULL OR p.acreage <= p_acreage_max)
    -- Owner name filter - use trigram similarity
    AND (
      UPPER(p.owner_name) ILIKE '%' || normalized_owner || '%'
      OR similarity(UPPER(COALESCE(p.owner_name, '')), normalized_owner) > 0.3
    )
  ORDER BY match_score DESC
  LIMIT p_limit;
END;
$$;

-- 4. Create function to find parcels by area (acreage fallback)
CREATE OR REPLACE FUNCTION find_parcels_by_area(
  p_county TEXT,
  p_target_acreage NUMERIC,
  p_tolerance NUMERIC DEFAULT 0.2,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  parcel_uuid UUID,
  source_parcel_id TEXT,
  owner_name TEXT,
  situs_address TEXT,
  acreage NUMERIC,
  county TEXT,
  match_score NUMERIC,
  match_type TEXT,
  geometry JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  min_acreage NUMERIC;
  max_acreage NUMERIC;
BEGIN
  -- Calculate acreage tolerance range
  min_acreage := p_target_acreage * (1 - p_tolerance);
  max_acreage := p_target_acreage * (1 + p_tolerance);
  
  RETURN QUERY
  SELECT 
    p.parcel_uuid,
    p.source_parcel_id,
    p.owner_name,
    p.situs_address,
    p.acreage,
    p.county,
    -- Score based on how close the acreage is (1.0 = exact match, decreasing with difference)
    (1.0 - ABS(p.acreage - p_target_acreage) / GREATEST(p_target_acreage, 0.01))::NUMERIC AS match_score,
    'AREA_MATCH'::TEXT AS match_type,
    ST_AsGeoJSON(p.geometry)::JSONB AS geometry
  FROM parcels p
  WHERE 
    UPPER(p.county) = UPPER(p_county)
    AND p.acreage BETWEEN min_acreage AND max_acreage
  ORDER BY ABS(p.acreage - p_target_acreage) ASC
  LIMIT p_limit;
END;
$$;

-- 5. Create function to find parcels by legal description (lot/block/subdivision)
CREATE OR REPLACE FUNCTION find_parcels_by_legal_description(
  p_lot TEXT DEFAULT NULL,
  p_block TEXT DEFAULT NULL,
  p_subdivision TEXT DEFAULT NULL,
  p_county TEXT DEFAULT NULL,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  parcel_uuid UUID,
  source_parcel_id TEXT,
  owner_name TEXT,
  situs_address TEXT,
  acreage NUMERIC,
  county TEXT,
  match_score NUMERIC,
  match_type TEXT,
  geometry JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.parcel_uuid,
    p.source_parcel_id,
    p.owner_name,
    p.situs_address,
    p.acreage,
    p.county,
    -- High confidence for legal description matches
    0.92::NUMERIC AS match_score,
    'LEGAL_DESC_MATCH'::TEXT AS match_type,
    ST_AsGeoJSON(p.geometry)::JSONB AS geometry
  FROM parcels p
  WHERE 
    (p_county IS NULL OR UPPER(p.county) = UPPER(p_county))
    AND (
      -- Match on lot if provided
      (p_lot IS NOT NULL AND p.legal_description ILIKE '%LOT ' || p_lot || '%')
      OR
      -- Match on block if provided  
      (p_block IS NOT NULL AND p.legal_description ILIKE '%BLOCK ' || p_block || '%')
      OR
      -- Match on subdivision if provided
      (p_subdivision IS NOT NULL AND p.legal_description ILIKE '%' || p_subdivision || '%')
    )
  ORDER BY 
    -- Prefer matches that hit more criteria
    (CASE WHEN p_lot IS NOT NULL AND p.legal_description ILIKE '%LOT ' || p_lot || '%' THEN 1 ELSE 0 END +
     CASE WHEN p_block IS NOT NULL AND p.legal_description ILIKE '%BLOCK ' || p_block || '%' THEN 1 ELSE 0 END +
     CASE WHEN p_subdivision IS NOT NULL AND p.legal_description ILIKE '%' || p_subdivision || '%' THEN 1 ELSE 0 END) DESC
  LIMIT p_limit;
END;
$$;

-- 6. Grant execute permissions
GRANT EXECUTE ON FUNCTION find_parcels_by_owner TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION find_parcels_by_area TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION find_parcels_by_legal_description TO authenticated, anon, service_role;