-- Add elevation data columns to canonical_parcels for tile pipeline
ALTER TABLE canonical_parcels
ADD COLUMN IF NOT EXISTS elevation_ft NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS elevation_source TEXT DEFAULT 'aws_terrain',
ADD COLUMN IF NOT EXISTS elevation_sampled_at TIMESTAMPTZ;

-- Create index for efficient bulk update queries (find parcels needing elevation)
CREATE INDEX IF NOT EXISTS idx_canonical_parcels_elevation_null 
ON canonical_parcels (id) 
WHERE elevation_ft IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN canonical_parcels.elevation_ft IS 'Elevation in feet (NAVD88) sampled from AWS Terrain Tiles at parcel centroid';
COMMENT ON COLUMN canonical_parcels.elevation_source IS 'Source of elevation data: aws_terrain, google, usgs';
COMMENT ON COLUMN canonical_parcels.elevation_sampled_at IS 'Timestamp when elevation was sampled';