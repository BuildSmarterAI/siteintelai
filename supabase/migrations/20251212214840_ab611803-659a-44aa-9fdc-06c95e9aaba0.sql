-- Register Dallas Zoning MapServer in map_servers
INSERT INTO map_servers (
  server_key,
  provider,
  base_url,
  jurisdiction,
  agency,
  dataset_family,
  update_frequency,
  accuracy_tier,
  reliability_score,
  is_active,
  service_type,
  notes
) VALUES (
  'dallas_zoning',
  'City of Dallas',
  'https://gis.dallascityhall.com/arcgis/rest/services/sdc_public/Zoning/MapServer',
  'Dallas',
  'City of Dallas Sustainable Development & Construction GIS',
  'zoning',
  'monthly',
  'T2',
  85,
  true,
  'MapServer',
  'Dallas zoning districts. Layer 15 contains Base Zoning polygons with ZONE_DIST, LONG_ZONE_DIST, PD_NUM fields. Service has 20 layers including overlays for Historic, Height Map, SUP.'
);

-- Register Dallas Base Zoning Layer in gis_layers
INSERT INTO gis_layers (
  layer_key,
  display_name,
  provider,
  source_url,
  map_server_id,
  geometry_type,
  source_type,
  status,
  etl_adapter,
  field_mappings,
  category
) VALUES (
  'dallas_zoning_districts',
  'Dallas Base Zoning Districts',
  'City of Dallas',
  'https://gis.dallascityhall.com/arcgis/rest/services/sdc_public/Zoning/MapServer/15',
  (SELECT id FROM map_servers WHERE server_key = 'dallas_zoning'),
  'Polygon',
  'arcgis_mapserver',
  'active',
  'arcgis_unified',
  '{
    "ZONE_DIST": {"target": "district_code", "transform": "uppercase"},
    "LONG_ZONE_DIST": {"target": "district_name", "transform": "trim"},
    "PD_NUM": {"target": "pd_number", "transform": "trim"},
    "OBJECTID": {"target": "source_feature_id", "transform": "to_string"}
  }'::jsonb,
  'zoning'
);