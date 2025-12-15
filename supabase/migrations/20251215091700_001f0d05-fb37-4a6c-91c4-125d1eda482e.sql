-- Update RPC function to cast geometry to MultiPolygon
CREATE OR REPLACE FUNCTION update_demographics_geometry(
  p_geoid TEXT,
  p_geom_json TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE canonical_demographics
  SET 
    geom = ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(p_geom_json), 4326)),
    updated_at = NOW()
  WHERE geoid = p_geoid;
END;
$$;