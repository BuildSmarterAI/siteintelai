-- Fix find_parcel_candidates RPC to use correct table (canonical_parcels) and columns
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
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gen_random_uuid() as parcel_uuid,
    p.source_parcel_id,
    p.jurisdiction as county,
    p.situs_address,
    p.owner_name,
    p.acreage,
    ST_AsGeoJSON(p.geom)::jsonb as geometry,
    CASE 
      WHEN p_apn IS NOT NULL AND (p.apn = p_apn OR p.source_parcel_id = p_apn) THEN 'APN_EXACT'
      WHEN p_apn IS NOT NULL THEN 'APN_PARTIAL'
      WHEN p_address_point IS NOT NULL THEN 'ADDRESS'
      ELSE 'BBOX'
    END::text as match_type,
    CASE 
      WHEN p_apn IS NOT NULL AND (p.apn = p_apn OR p.source_parcel_id = p_apn) THEN 0.98
      WHEN p_apn IS NOT NULL THEN 0.85
      WHEN p_address_point IS NOT NULL THEN 0.90
      ELSE 0.70
    END::numeric as match_score
  FROM canonical_parcels p
  WHERE 
    -- APN search: check both apn and source_parcel_id columns
    (p_apn IS NOT NULL AND (
      p.apn ILIKE '%' || p_apn || '%' OR
      p.source_parcel_id ILIKE '%' || p_apn || '%'
    ))
    -- Address point search: find parcels within 100m of the point
    OR (p_address_point IS NOT NULL AND 
        ST_DWithin(p.geom::geography, p_address_point::geography, 100))
    -- Bounding box search
    OR (p_search_bbox IS NOT NULL AND 
        ST_Intersects(p.geom, p_search_bbox))
  ORDER BY 
    -- Exact APN matches first
    CASE WHEN p.apn = p_apn OR p.source_parcel_id = p_apn THEN 0 ELSE 1 END,
    -- Then by distance if address point provided
    CASE WHEN p_address_point IS NOT NULL 
         THEN ST_Distance(p.geom::geography, p_address_point::geography) 
         ELSE 0 END
  LIMIT p_limit;
END;
$$;