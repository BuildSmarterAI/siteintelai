-- Add TWDB and In-City MUD tracking columns to applications
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS twdb_pws_id TEXT,
ADD COLUMN IF NOT EXISTS twdb_pws_name TEXT,
ADD COLUMN IF NOT EXISTS twdb_system_type TEXT,
ADD COLUMN IF NOT EXISTS in_city_mud_name TEXT,
ADD COLUMN IF NOT EXISTS in_city_mud_number TEXT,
ADD COLUMN IF NOT EXISTS utility_provider_confidence NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS utility_data_sources JSONB DEFAULT '[]';

-- Add TWDB and In-City MUD tracking columns to parcel_utility_assignments
ALTER TABLE parcel_utility_assignments
ADD COLUMN IF NOT EXISTS twdb_pws_id TEXT,
ADD COLUMN IF NOT EXISTS twdb_pws_name TEXT,
ADD COLUMN IF NOT EXISTS in_city_mud_name TEXT,
ADD COLUMN IF NOT EXISTS in_city_mud_number TEXT,
ADD COLUMN IF NOT EXISTS provider_distinction TEXT;

-- Add index for TWDB lookups
CREATE INDEX IF NOT EXISTS idx_applications_twdb_pws_id ON applications(twdb_pws_id);
CREATE INDEX IF NOT EXISTS idx_parcel_utility_twdb ON parcel_utility_assignments(twdb_pws_id);

-- Add comments for documentation
COMMENT ON COLUMN applications.twdb_pws_id IS 'Texas Water Development Board Public Water System ID - regulatory truth anchor';
COMMENT ON COLUMN applications.in_city_mud_name IS 'MUD name if parcel is within Houston city limits AND inside a MUD with utility agreement';
COMMENT ON COLUMN parcel_utility_assignments.provider_distinction IS 'Indicates whether MUD or City serves utilities: mud_serves, city_serves, or shared';