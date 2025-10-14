-- Add utilities_summary column to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS utilities_summary jsonb DEFAULT '{
  "water": {
    "has_service": false,
    "min_distance_ft": null,
    "service_url": null,
    "last_verified": null
  },
  "sewer": {
    "has_service": false,
    "min_distance_ft": null,
    "service_url": null,
    "last_verified": null
  },
  "force_main": {
    "has_service": false,
    "min_distance_ft": null,
    "service_url": null,
    "last_verified": null
  },
  "storm": {
    "has_service": false,
    "min_distance_ft": null,
    "service_url": null,
    "last_verified": null
  }
}'::jsonb;

-- Add index for faster queries on utilities_summary
CREATE INDEX IF NOT EXISTS idx_applications_utilities_summary 
ON applications USING GIN (utilities_summary);

COMMENT ON COLUMN applications.utilities_summary IS 
'Enhanced utility proximity data with distance metrics and source attribution. Replaces legacy boolean water_nearby/sewer_nearby/storm_nearby fields.';