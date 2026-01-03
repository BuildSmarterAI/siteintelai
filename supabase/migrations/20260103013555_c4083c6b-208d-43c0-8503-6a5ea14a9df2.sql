-- Drop the old function and recreate with correct table
DROP FUNCTION IF EXISTS find_parcels_by_area(TEXT, NUMERIC, NUMERIC, INT);

-- Recreate find_parcels_by_area RPC to use canonical_parcels table
CREATE OR REPLACE FUNCTION find_parcels_by_area(
  p_county TEXT,
  p_target_acreage NUMERIC,
  p_tolerance NUMERIC DEFAULT 0.25,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  parcel_uuid TEXT,
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
    p.id::TEXT AS parcel_uuid,
    p.source_parcel_id,
    p.owner_name,
    p.situs_address,
    p.acreage,
    p.jurisdiction AS county,
    -- Score based on how close the acreage is (1.0 = exact match, decreasing with difference)
    (1.0 - ABS(p.acreage - p_target_acreage) / GREATEST(p_target_acreage, 0.01))::NUMERIC AS match_score,
    'AREA_MATCH'::TEXT AS match_type,
    ST_AsGeoJSON(p.geom)::JSONB AS geometry
  FROM canonical_parcels p
  WHERE 
    UPPER(p.jurisdiction) = UPPER(p_county)
    AND p.acreage BETWEEN min_acreage AND max_acreage
  ORDER BY ABS(p.acreage - p_target_acreage) ASC
  LIMIT p_limit;
END;
$$;