-- Add speed_limit and surface_type columns to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS speed_limit integer,
ADD COLUMN IF NOT EXISTS surface_type text;

-- Add comment for documentation
COMMENT ON COLUMN applications.speed_limit IS 'Posted speed limit in MPH from TxDOT Roadway Inventory';
COMMENT ON COLUMN applications.surface_type IS 'Pavement surface type (Asphalt, Concrete, Gravel, etc.) from TxDOT';