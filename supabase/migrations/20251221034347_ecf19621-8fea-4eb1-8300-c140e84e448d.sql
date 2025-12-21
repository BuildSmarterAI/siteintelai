-- Create find_parcels_in_bbox function for spatial parcel queries
CREATE OR REPLACE FUNCTION public.find_parcels_in_bbox(
  min_lng DOUBLE PRECISION,
  min_lat DOUBLE PRECISION,
  max_lng DOUBLE PRECISION,
  max_lat DOUBLE PRECISION,
  max_results INTEGER DEFAULT 200
)
RETURNS TABLE (
  id BIGINT,
  source_parcel_id TEXT,
  owner_name TEXT,
  situs_address TEXT,
  acreage NUMERIC,
  land_use_desc TEXT,
  jurisdiction TEXT,
  source_agency TEXT,
  geom_json JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    cp.id,
    cp.source_parcel_id,
    cp.owner_name,
    cp.situs_address,
    cp.acreage,
    cp.land_use_desc,
    cp.jurisdiction,
    cp.source_agency,
    ST_AsGeoJSON(cp.geom)::jsonb AS geom_json
  FROM canonical_parcels cp
  WHERE cp.geom IS NOT NULL
    AND ST_Intersects(
      cp.geom,
      ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    )
  LIMIT max_results;
$$;

-- Grant access to all roles
GRANT EXECUTE ON FUNCTION public.find_parcels_in_bbox TO authenticated, anon, service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.find_parcels_in_bbox IS 'Finds canonical parcels within a bounding box, returning GeoJSON geometry. Used by fetch-parcels-geojson edge function.';