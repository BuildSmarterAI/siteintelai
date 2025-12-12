-- Register San Antonio Zoning FeatureServer in map_servers
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
  'cosa_zoning',
  'City of San Antonio',
  'https://services.arcgis.com/g1fRTDLeMgspWrYp/ArcGIS/rest/services/COSA_Zoning/FeatureServer',
  'San Antonio',
  'City of San Antonio GIS',
  'zoning',
  'monthly',
  'T2',
  90,
  true,
  'FeatureServer',
  'San Antonio zoning districts. Layer 12 contains current zoning polygons with Base, Zoning, BaseDescription fields. Updated Dec 2025.'
);

-- Register Austin Zoning FeatureServer in map_servers
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
  'austin_zoning',
  'City of Austin',
  'https://services.arcgis.com/0L95CJ0VTaxqcmED/ArcGIS/rest/services/Current_Zoning_gdb/FeatureServer',
  'Austin',
  'City of Austin Planning',
  'zoning',
  'annually',
  'T2',
  75,
  true,
  'FeatureServer',
  'Austin zoning districts. Layer 0 contains zoning polygons with BASE_ZONE, ZONE_NAME fields. Note: Data last updated Nov 2020 - may be stale.'
);

-- Register San Antonio Zoning Layer in gis_layers
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
  'sa_zoning_districts',
  'San Antonio Zoning Districts',
  'City of San Antonio',
  'https://services.arcgis.com/g1fRTDLeMgspWrYp/ArcGIS/rest/services/COSA_Zoning/FeatureServer/12',
  (SELECT id FROM map_servers WHERE server_key = 'cosa_zoning'),
  'Polygon',
  'arcgis_featureserver',
  'active',
  'arcgis_unified',
  '{
    "Base": {"target": "district_code", "transform": "uppercase"},
    "BaseDescription": {"target": "district_name", "transform": "trim"},
    "Zoning": {"target": "full_zoning_code", "transform": "trim"},
    "OBJECTID": {"target": "source_feature_id", "transform": "to_string"}
  }'::jsonb,
  'zoning'
);

-- Register Austin Zoning Layer in gis_layers
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
  'austin_zoning_districts',
  'Austin Zoning Districts',
  'City of Austin',
  'https://services.arcgis.com/0L95CJ0VTaxqcmED/ArcGIS/rest/services/Current_Zoning_gdb/FeatureServer/0',
  (SELECT id FROM map_servers WHERE server_key = 'austin_zoning'),
  'Polygon',
  'arcgis_featureserver',
  'active',
  'arcgis_unified',
  '{
    "BASE_ZONE": {"target": "district_code", "transform": "uppercase"},
    "ZONE_NAME": {"target": "district_name", "transform": "trim"},
    "OBJECTID": {"target": "source_feature_id", "transform": "to_string"}
  }'::jsonb,
  'zoning'
);