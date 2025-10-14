-- Add WCID district column to applications table
-- This enables tracking of Water Control & Improvement Districts for Harris County properties
ALTER TABLE applications
ADD COLUMN wcid_district TEXT;

-- Add index for faster WCID queries (optional but recommended for performance)
CREATE INDEX IF NOT EXISTS idx_applications_wcid_district 
ON applications(wcid_district) 
WHERE wcid_district IS NOT NULL;