-- =====================================================
-- BuildSmarter Feasibility
-- Parcel Ownership + Acreage Migration
-- =====================================================

-- 1. Drop duplicate / legacy parcel field
ALTER TABLE applications 
DROP COLUMN IF EXISTS parcel_id_apn;

-- 2. Ensure correct standardized fields exist
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS parcel_id TEXT,
ADD COLUMN IF NOT EXISTS parcel_owner TEXT,
ADD COLUMN IF NOT EXISTS acreage_cad NUMERIC;

-- 3. Add index for faster spatial/parcel lookups
CREATE INDEX IF NOT EXISTS idx_parcel_id ON applications (parcel_id);