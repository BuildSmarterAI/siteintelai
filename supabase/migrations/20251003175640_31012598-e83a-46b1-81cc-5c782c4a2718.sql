-- Create endpoint catalog table for utility districts
CREATE TABLE IF NOT EXISTS utility_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_type TEXT NOT NULL,        -- e.g. MUD, WCID, TIRZ, City
  provider_name TEXT NOT NULL,        -- Human-friendly name
  url TEXT NOT NULL,                  -- ArcGIS REST endpoint or viewer
  geometry_type TEXT NOT NULL,        -- Polygon / Line
  out_fields TEXT[],                  -- Attributes to return
  notes TEXT                          -- Usage notes / instructions
);

-- Seed with Harris County ETJ providers
INSERT INTO utility_endpoints (provider_type, provider_name, url, geometry_type, out_fields, notes) VALUES
-- Harris County MUD boundaries (polygon layer)
('MUD', 'Harris County MUD Boundaries',
 'https://services.arcgis.com/KTcxiTD9dsQwVSFh/arcgis/rest/services/MUD_Boundaries/FeatureServer/0',
 'Polygon',
 ARRAY['DISTRICT_NA','DISTRICT_NO','AGENCY'],
 'Use for point-in-polygon lookups outside Houston city limits to identify governing MUD.'),

-- Harris County WCID / Special Utility Districts (also polygons)
('WCID', 'Harris County Water Control & Improvement Districts',
 'https://services.arcgis.com/KTcxiTD9dsQwVSFh/arcgis/rest/services/WCID_Boundaries/FeatureServer/0',
 'Polygon',
 ARRAY['DISTRICT_NA','DISTRICT_NO'],
 'Covers water control and improvement districts in Harris County.'),

-- Harris County TIRZ (Tax Increment Reinvestment Zones)
('TIRZ', 'Houston TIRZ Boundaries',
 'https://services.arcgis.com/KTcxiTD9dsQwVSFh/arcgis/rest/services/TIRZ_Boundaries/FeatureServer/0',
 'Polygon',
 ARRAY['TIRZ_NUM','TIRZ_NAME'],
 'Identifies parcels in Tax Increment Reinvestment Zones.'),

-- Drainage / Flood Control Districts
('Drainage', 'Harris County Drainage Districts',
 'https://services.arcgis.com/KTcxiTD9dsQwVSFh/arcgis/rest/services/Drainage_Districts/FeatureServer/0',
 'Polygon',
 ARRAY['DISTRICT','CONTACT'],
 'Drainage authorities; note this does not include underground pipe data.'),

-- Statewide fallback (TCEQ iWDD)
('MUD', 'TCEQ Water Districts Map Viewer',
 'https://www.tceq.texas.gov/gis/iwudview.html',
 'Polygon',
 ARRAY[]::TEXT[],
 'Covers all Texas water districts (MUD, WCID, SUD). Use when county GIS has no coverage.');