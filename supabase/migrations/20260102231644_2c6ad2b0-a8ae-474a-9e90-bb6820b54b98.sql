-- Extend survey_uploads table for auto-matching
ALTER TABLE survey_uploads ADD COLUMN IF NOT EXISTS extraction_json jsonb;
ALTER TABLE survey_uploads ADD COLUMN IF NOT EXISTS match_status text DEFAULT 'pending' 
  CHECK (match_status IN ('pending', 'analyzing', 'matching', 'matched', 'needs_review', 'no_match', 'error'));
ALTER TABLE survey_uploads ADD COLUMN IF NOT EXISTS selected_parcel_id uuid;
ALTER TABLE survey_uploads ADD COLUMN IF NOT EXISTS match_confidence numeric;
ALTER TABLE survey_uploads ADD COLUMN IF NOT EXISTS match_candidates jsonb;
ALTER TABLE survey_uploads ADD COLUMN IF NOT EXISTS match_reason_codes text[];

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_survey_uploads_match_status ON survey_uploads(match_status);
CREATE INDEX IF NOT EXISTS idx_survey_uploads_selected_parcel ON survey_uploads(selected_parcel_id);

-- Create find_parcel_candidates RPC function
CREATE OR REPLACE FUNCTION public.find_parcel_candidates(
  p_county text DEFAULT NULL,
  p_apn text DEFAULT NULL,
  p_address_point geometry DEFAULT NULL,
  p_search_bbox geometry DEFAULT NULL,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  parcel_uuid uuid,
  source_parcel_id text,
  county text,
  situs_address text,
  owner_name text,
  acreage numeric,
  geometry jsonb,
  match_type text,
  match_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized_apn text;
BEGIN
  -- Normalize APN (remove dashes, spaces, uppercase)
  v_normalized_apn := UPPER(REGEXP_REPLACE(COALESCE(p_apn, ''), '[^A-Z0-9]', '', 'g'));
  
  RETURN QUERY
  WITH scored_parcels AS (
    SELECT 
      p.parcel_uuid,
      p.source_parcel_id,
      p.county,
      p.situs_address,
      p.owner_name,
      p.acreage,
      ST_AsGeoJSON(p.geometry)::jsonb as geometry,
      CASE 
        -- Exact APN match (highest priority)
        WHEN v_normalized_apn != '' AND 
             UPPER(REGEXP_REPLACE(COALESCE(p.source_parcel_id, ''), '[^A-Z0-9]', '', 'g')) = v_normalized_apn 
        THEN 'APN'
        -- Address proximity match
        WHEN p_address_point IS NOT NULL AND 
             ST_DWithin(p.geometry::geography, p_address_point::geography, 100)
        THEN 'ADDRESS'
        -- County + bbox match
        WHEN p_search_bbox IS NOT NULL AND 
             ST_Intersects(p.geometry, p_search_bbox)
        THEN 'SHAPE'
        ELSE 'COUNTY'
      END as match_type,
      CASE 
        -- Exact APN match = 0.98
        WHEN v_normalized_apn != '' AND 
             UPPER(REGEXP_REPLACE(COALESCE(p.source_parcel_id, ''), '[^A-Z0-9]', '', 'g')) = v_normalized_apn 
        THEN 0.98
        -- Address within 50m = 0.92, within 100m = 0.85
        WHEN p_address_point IS NOT NULL AND 
             ST_DWithin(p.geometry::geography, p_address_point::geography, 50)
        THEN 0.92
        WHEN p_address_point IS NOT NULL AND 
             ST_DWithin(p.geometry::geography, p_address_point::geography, 100)
        THEN 0.85
        -- Bbox intersection = 0.60
        WHEN p_search_bbox IS NOT NULL AND 
             ST_Intersects(p.geometry, p_search_bbox)
        THEN 0.60
        -- County only = 0.40
        ELSE 0.40
      END as match_score
    FROM parcels p
    WHERE 
      -- Filter by county if provided
      (p_county IS NULL OR UPPER(p.county) = UPPER(p_county))
      AND (
        -- APN match
        (v_normalized_apn != '' AND 
         UPPER(REGEXP_REPLACE(COALESCE(p.source_parcel_id, ''), '[^A-Z0-9]', '', 'g')) = v_normalized_apn)
        OR
        -- Address proximity
        (p_address_point IS NOT NULL AND 
         ST_DWithin(p.geometry::geography, p_address_point::geography, 100))
        OR
        -- Bbox intersection
        (p_search_bbox IS NOT NULL AND 
         ST_Intersects(p.geometry, p_search_bbox))
      )
  )
  SELECT * FROM scored_parcels
  ORDER BY match_score DESC
  LIMIT p_limit;
END;
$$;