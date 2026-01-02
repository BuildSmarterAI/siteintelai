-- Create the match_parcels_to_survey RPC function for spatial parcel matching
CREATE OR REPLACE FUNCTION public.match_parcels_to_survey(
  survey_wkt text,
  limit_count int DEFAULT 5
)
RETURNS TABLE (
  id bigint,
  source_parcel_id text,
  jurisdiction text,
  situs_address text,
  owner_name text,
  acreage numeric,
  overlap_pct double precision,
  centroid_distance_m double precision,
  geom_json text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH survey AS (
    SELECT ST_SetSRID(ST_GeomFromText(survey_wkt), 4326) AS g
  )
  SELECT
    p.id,
    p.source_parcel_id,
    p.jurisdiction,
    p.situs_address,
    p.owner_name,
    p.acreage,
    COALESCE(
      (ST_Area(ST_Intersection(p.geom, survey.g)) / NULLIF(ST_Area(p.geom), 0))::double precision,
      0
    ) AS overlap_pct,
    COALESCE(
      ST_Distance(
        ST_Centroid(p.geom)::geography,
        ST_Centroid(survey.g)::geography
      )::double precision,
      0
    ) AS centroid_distance_m,
    ST_AsGeoJSON(p.geom) AS geom_json
  FROM public.canonical_parcels p
  CROSS JOIN survey
  WHERE p.geom IS NOT NULL
    AND ST_IsValid(p.geom)
    AND ST_Intersects(p.geom, survey.g)
  ORDER BY overlap_pct DESC, centroid_distance_m ASC
  LIMIT GREATEST(limit_count, 1);
$$;