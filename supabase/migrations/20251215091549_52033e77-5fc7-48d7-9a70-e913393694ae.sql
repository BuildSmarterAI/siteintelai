-- Create RPC function to update demographics geometry from GeoJSON
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
    geom = ST_SetSRID(ST_GeomFromGeoJSON(p_geom_json), 4326),
    updated_at = NOW()
  WHERE geoid = p_geoid;
END;
$$;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION update_demographics_geometry(TEXT, TEXT) TO service_role;