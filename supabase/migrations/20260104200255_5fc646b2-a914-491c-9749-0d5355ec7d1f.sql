-- Create a view that returns regulatory envelope geometries as GeoJSON
CREATE OR REPLACE VIEW regulatory_envelopes_geojson AS
SELECT
  id,
  application_id,
  ST_AsGeoJSON(parcel_geometry)::jsonb AS parcel_geometry_geojson,
  ST_AsGeoJSON(buildable_footprint_2d)::jsonb AS buildable_footprint_2d_geojson,
  far_cap,
  height_cap_ft,
  coverage_cap_pct,
  setbacks,
  exclusion_zones,
  constraints_version,
  constraints_source,
  computed_at
FROM regulatory_envelopes;