-- Add fields for GIS enrichment data
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS acreage_cad numeric,
ADD COLUMN IF NOT EXISTS parcel_owner text,
ADD COLUMN IF NOT EXISTS base_flood_elevation numeric,
ADD COLUMN IF NOT EXISTS data_flags jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS situs_address text;

-- Add comment for clarity
COMMENT ON COLUMN applications.acreage_cad IS 'Lot acreage from CAD parcel data';
COMMENT ON COLUMN applications.parcel_owner IS 'Property owner from parcel records';
COMMENT ON COLUMN applications.base_flood_elevation IS 'Base flood elevation from FEMA';
COMMENT ON COLUMN applications.data_flags IS 'Array of flags for missing/incomplete data';
COMMENT ON COLUMN applications.situs_address IS 'Normalized address from geocoding';