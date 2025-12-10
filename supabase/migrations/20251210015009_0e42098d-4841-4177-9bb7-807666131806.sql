-- Fix houston_wastewater_lines to use Layer 3 (Gravity Mains) instead of Layer 0
UPDATE map_servers 
SET base_url = 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWWastewaterLineIPS/MapServer/3'
WHERE server_key = 'houston_wastewater_lines';

-- Add additional wastewater layers for comprehensive coverage
INSERT INTO map_servers (server_key, base_url, provider, jurisdiction, dataset_family, is_active, scraper_mode)
VALUES 
  ('houston_wastewater_force', 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWWastewaterLineIPS/MapServer/2', 'Houston Water', 'houston', 'utilities', true, 'disabled'),
  ('houston_wastewater_service', 'https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWWastewaterLineIPS/MapServer/1', 'Houston Water', 'houston', 'utilities', true, 'disabled')
ON CONFLICT (server_key) DO UPDATE SET
  base_url = EXCLUDED.base_url,
  is_active = true;