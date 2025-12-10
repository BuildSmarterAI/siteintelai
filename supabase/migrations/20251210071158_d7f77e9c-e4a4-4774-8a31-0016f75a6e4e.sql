-- Phase 2: Mark houston_zoning as disabled (Houston has no zoning - uses deed restrictions)
UPDATE gis_layers
SET 
  status = 'disabled',
  updated_at = NOW()
WHERE layer_key = 'houston_zoning';

-- Phase 3: Fix FEMA Flood Zones URL - use layer 3 (S_Fld_Haz_Ar - flood hazard areas)
UPDATE gis_layers
SET 
  source_url = 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/3',
  field_mappings = '{
    "FLD_ZONE": "flood_zone",
    "ZONE_SUBTY": "zone_subtype",
    "SFHA_TF": "sfha_flag",
    "STATIC_BFE": "base_flood_elevation",
    "DEPTH": "flood_depth"
  }'::jsonb,
  updated_at = NOW()
WHERE layer_key = 'fema_flood_zones';