-- Update TxDOT AADT layer with working public ArcGIS Online endpoint
UPDATE gis_layers
SET 
  source_url = 'https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/TxDOT_AADT_ANNUALS/FeatureServer/0',
  status = 'active',
  field_mappings = jsonb_build_object(
    'county_name', 'CNTY_NM',
    'district_name', 'DIST_NM',
    'traffic_station_id', 'T_FLAG',
    'aadt_2017', 'AADT_2017',
    'aadt_2016', 'AADT_2016',
    'aadt_2015', 'AADT_2015',
    'z_level', 'ZLEVEL'
  ),
  updated_at = NOW()
WHERE layer_key = 'txdot_aadt';