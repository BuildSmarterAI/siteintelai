-- Create metro_regions lookup table
CREATE TABLE metro_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metro_key TEXT UNIQUE NOT NULL,
  metro_name TEXT NOT NULL,
  primary_city TEXT NOT NULL,
  market_characteristics JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE metro_regions ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access to metro_regions" ON metro_regions
  FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Admins can manage metro_regions" ON metro_regions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed the 4 Texas metros
INSERT INTO metro_regions (metro_key, metro_name, primary_city, market_characteristics) VALUES
('houston', 'Houston Metro', 'Houston', '{"traits": ["mega-market", "energy-corridor", "port-economy", "high-CRE-velocity"], "counties": 3}'),
('austin', 'Austin Metro', 'Austin', '{"traits": ["tech-growth", "entitlement-friction", "price-sensitive", "suburban-expansion"], "counties": 2}'),
('san_antonio', 'San Antonio Metro', 'San Antonio', '{"traits": ["public-sector", "healthcare", "cheaper-land", "slower-entitlement"], "counties": 1}'),
('dallas', 'Dallas-Fort Worth Metro', 'Dallas', '{"traits": ["corporate-relocations", "logistics", "suburban-sprawl"], "counties": 0}');

-- Create county_metro_mapping table
CREATE TABLE county_metro_mapping (
  county_fips TEXT PRIMARY KEY,
  county_name TEXT NOT NULL,
  metro_key TEXT REFERENCES metro_regions(metro_key),
  is_primary_county BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE county_metro_mapping ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access to county_metro_mapping" ON county_metro_mapping
  FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Admins can manage county_metro_mapping" ON county_metro_mapping
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed the 6 priority counties with correct metro classification
INSERT INTO county_metro_mapping (county_fips, county_name, metro_key, is_primary_county) VALUES
-- Houston Metro (3 counties)
('48201', 'Harris County', 'houston', true),
('48157', 'Fort Bend County', 'houston', false),
('48339', 'Montgomery County', 'houston', false),
-- Austin Metro (2 counties)
('48453', 'Travis County', 'austin', true),
('48491', 'Williamson County', 'austin', false),
-- San Antonio Metro (1 county)
('48029', 'Bexar County', 'san_antonio', true);

-- Add metro_key column to gis_layers
ALTER TABLE gis_layers ADD COLUMN IF NOT EXISTS metro_key TEXT;

-- Update existing parcel layers with correct metro classification
UPDATE gis_layers SET metro_key = 'houston' WHERE county_fips IN ('48201', '48157', '48339');
UPDATE gis_layers SET metro_key = 'austin' WHERE county_fips IN ('48453', '48491');
UPDATE gis_layers SET metro_key = 'san_antonio' WHERE county_fips = '48029';

-- Update transform_configs with correct metro_region in constants
-- Houston Metro counties
UPDATE transform_configs 
SET config = jsonb_set(config, '{constants,metro_region}', '"Houston Metro"')
WHERE layer_key IN ('harris_parcels', 'houston_parcels', 'fortbend_parcels', 'montgomery_parcels_v2');

-- Austin Metro counties  
UPDATE transform_configs 
SET config = jsonb_set(config, '{constants,metro_region}', '"Austin Metro"')
WHERE layer_key IN ('travis_parcels', 'williamson_parcels');

-- San Antonio Metro county
UPDATE transform_configs 
SET config = jsonb_set(config, '{constants,metro_region}', '"San Antonio Metro"')
WHERE layer_key = 'bexar_parcels';

-- Create index for metro_key lookups
CREATE INDEX IF NOT EXISTS idx_gis_layers_metro_key ON gis_layers(metro_key);
CREATE INDEX IF NOT EXISTS idx_county_metro_mapping_metro_key ON county_metro_mapping(metro_key);