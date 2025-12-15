-- Add bbox column to metro_regions for geographic bounds per metro
ALTER TABLE metro_regions 
ADD COLUMN bbox jsonb DEFAULT NULL;

-- Add comment explaining the bbox structure
COMMENT ON COLUMN metro_regions.bbox IS 'Geographic bounding box: {xmin, ymin, xmax, ymax} in WGS84 (EPSG:4326)';

-- Seed bounding boxes for Texas metros
UPDATE metro_regions SET bbox = '{"xmin": -95.8, "ymin": 29.5, "xmax": -95.0, "ymax": 30.2}'::jsonb WHERE metro_key = 'houston';
UPDATE metro_regions SET bbox = '{"xmin": -97.5, "ymin": 32.5, "xmax": -96.5, "ymax": 33.2}'::jsonb WHERE metro_key = 'dallas';
UPDATE metro_regions SET bbox = '{"xmin": -98.1, "ymin": 30.0, "xmax": -97.4, "ymax": 30.6}'::jsonb WHERE metro_key = 'austin';
UPDATE metro_regions SET bbox = '{"xmin": -98.8, "ymin": 29.2, "xmax": -98.2, "ymax": 29.7}'::jsonb WHERE metro_key = 'san_antonio';