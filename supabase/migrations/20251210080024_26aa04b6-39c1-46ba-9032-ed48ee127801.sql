-- Update Houston Water GIS endpoints to correct working URLs and re-enable
UPDATE gis_layers
SET 
  source_url = 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWWastewaterLineIPS/MapServer/3',
  status = 'active',
  updated_at = NOW()
WHERE layer_key = 'houston_sewer_lines';

UPDATE gis_layers
SET 
  source_url = 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWWaterLineIPS/MapServer/3',
  status = 'active',
  updated_at = NOW()
WHERE layer_key = 'houston_water_lines';

-- Keep txdot_aadt disabled (requires authentication token)
-- Already disabled from previous migration