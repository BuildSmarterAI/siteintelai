-- Phase 1: Add ETL adapter routing columns to gis_layers

-- Add etl_adapter column for routing to appropriate ingestor
ALTER TABLE gis_layers ADD COLUMN IF NOT EXISTS etl_adapter TEXT DEFAULT 'arcgis_unified';
COMMENT ON COLUMN gis_layers.etl_adapter IS 'ETL adapter to use: arcgis_unified, shapefile_ingestor, implicit_scraper_ingestor';

-- Add source_type column for data source classification
ALTER TABLE gis_layers ADD COLUMN IF NOT EXISTS source_type TEXT;
COMMENT ON COLUMN gis_layers.source_type IS 'Source type: arcgis_mapserver, arcgis_featureserver, shapefile, mixed';

-- Add update_cadence column for refresh scheduling
ALTER TABLE gis_layers ADD COLUMN IF NOT EXISTS update_cadence TEXT DEFAULT 'monthly';
COMMENT ON COLUMN gis_layers.update_cadence IS 'Update frequency: monthly, quarterly, semiannual, annual, irregular';

-- Add coverage_quality column for data completeness indicator
ALTER TABLE gis_layers ADD COLUMN IF NOT EXISTS coverage_quality TEXT DEFAULT 'full';
COMMENT ON COLUMN gis_layers.coverage_quality IS 'Coverage quality: full, partial, fragmented';

-- Add county_fips for direct FIPS code lookup
ALTER TABLE gis_layers ADD COLUMN IF NOT EXISTS county_fips TEXT;
COMMENT ON COLUMN gis_layers.county_fips IS 'County FIPS code for jurisdiction mapping';

-- Add version_strategy for ETL versioning approach
ALTER TABLE gis_layers ADD COLUMN IF NOT EXISTS version_strategy TEXT DEFAULT 'full_replace';
COMMENT ON COLUMN gis_layers.version_strategy IS 'Version strategy: full_replace, append_with_version';

-- Update existing layers with appropriate values
UPDATE gis_layers SET 
  etl_adapter = 'arcgis_unified',
  source_type = 'arcgis_mapserver',
  update_cadence = 'quarterly',
  coverage_quality = 'full',
  county_fips = '48201',
  version_strategy = 'full_replace'
WHERE layer_key = 'houston_parcels';

UPDATE gis_layers SET 
  etl_adapter = 'arcgis_unified',
  source_type = 'arcgis_featureserver',
  update_cadence = 'monthly',
  coverage_quality = 'full',
  county_fips = '48157',
  version_strategy = 'full_replace'
WHERE layer_key = 'fortbend_parcels';

UPDATE gis_layers SET 
  etl_adapter = 'arcgis_unified',
  source_type = 'arcgis_mapserver',
  update_cadence = 'monthly',
  coverage_quality = 'full',
  county_fips = '48453',
  version_strategy = 'full_replace'
WHERE layer_key = 'travis_parcels';

-- Create index for etl_adapter routing queries
CREATE INDEX IF NOT EXISTS idx_gis_layers_etl_adapter ON gis_layers(etl_adapter);
CREATE INDEX IF NOT EXISTS idx_gis_layers_county_fips ON gis_layers(county_fips);