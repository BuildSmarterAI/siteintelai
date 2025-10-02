-- ============================================================
-- BuildSmarter Feasibility Schema Migration
-- Cleans duplicates + adds new enrichment fields
-- ============================================================

-- 1. DROP DUPLICATE / LEGACY FIELDS
ALTER TABLE applications DROP COLUMN IF EXISTS parcel_id_apn;
ALTER TABLE applications DROP COLUMN IF EXISTS zoning_classification;
ALTER TABLE applications DROP COLUMN IF EXISTS submarket;
ALTER TABLE applications DROP COLUMN IF EXISTS floodplain;

-- 2. RENAME City TO city (if exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' 
    AND column_name = 'City'
  ) THEN
    ALTER TABLE applications RENAME COLUMN "City" TO city;
  END IF;
END $$;

-- 3. ADD city if not exists
ALTER TABLE applications ADD COLUMN IF NOT EXISTS city TEXT;

-- 4. ADD floodplain_zone
ALTER TABLE applications ADD COLUMN IF NOT EXISTS floodplain_zone TEXT;

-- 5. ADD situs_address if not exists
ALTER TABLE applications ADD COLUMN IF NOT EXISTS situs_address TEXT;

-- 6. ADD parcel_id (replacing parcel_id_apn)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS parcel_id TEXT;

-- 7. ADD entitlement_notes
ALTER TABLE applications ADD COLUMN IF NOT EXISTS entitlement_notes TEXT;

-- 8. TRAFFIC / MOBILITY FIELDS
ALTER TABLE applications 
  ADD COLUMN IF NOT EXISTS traffic_aadt INTEGER,
  ADD COLUMN IF NOT EXISTS traffic_year INTEGER,
  ADD COLUMN IF NOT EXISTS traffic_segment_id TEXT,
  ADD COLUMN IF NOT EXISTS traffic_distance_ft NUMERIC,
  ADD COLUMN IF NOT EXISTS traffic_road_name TEXT,
  ADD COLUMN IF NOT EXISTS traffic_direction TEXT,
  ADD COLUMN IF NOT EXISTS traffic_map_url TEXT,
  ADD COLUMN IF NOT EXISTS nearest_highway TEXT,
  ADD COLUMN IF NOT EXISTS distance_highway_ft NUMERIC,
  ADD COLUMN IF NOT EXISTS nearest_transit_stop TEXT,
  ADD COLUMN IF NOT EXISTS distance_transit_ft NUMERIC,
  ADD COLUMN IF NOT EXISTS drive_time_15min_population INTEGER,
  ADD COLUMN IF NOT EXISTS drive_time_30min_population INTEGER;

-- 9. UTILITIES CAPACITY
ALTER TABLE applications 
  ADD COLUMN IF NOT EXISTS water_capacity_mgd NUMERIC,
  ADD COLUMN IF NOT EXISTS sewer_capacity_mgd NUMERIC,
  ADD COLUMN IF NOT EXISTS power_kv_nearby NUMERIC,
  ADD COLUMN IF NOT EXISTS fiber_available BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS broadband_providers JSONB DEFAULT '[]'::jsonb;

-- 10. DEMOGRAPHICS / MARKET
ALTER TABLE applications 
  ADD COLUMN IF NOT EXISTS population_1mi INTEGER,
  ADD COLUMN IF NOT EXISTS population_3mi INTEGER,
  ADD COLUMN IF NOT EXISTS population_5mi INTEGER,
  ADD COLUMN IF NOT EXISTS growth_rate_5yr NUMERIC,
  ADD COLUMN IF NOT EXISTS median_income NUMERIC,
  ADD COLUMN IF NOT EXISTS households_5mi INTEGER,
  ADD COLUMN IF NOT EXISTS employment_clusters JSONB DEFAULT '[]'::jsonb;

-- 11. FINANCIAL / INCENTIVES
ALTER TABLE applications 
  ADD COLUMN IF NOT EXISTS tax_rate_total NUMERIC,
  ADD COLUMN IF NOT EXISTS taxing_jurisdictions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS opportunity_zone BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS enterprise_zone BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS foreign_trade_zone BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS average_permit_time_months NUMERIC;

-- 12. ENVIRONMENTAL / SOILS
ALTER TABLE applications 
  ADD COLUMN IF NOT EXISTS wetlands_type TEXT,
  ADD COLUMN IF NOT EXISTS soil_series TEXT,
  ADD COLUMN IF NOT EXISTS soil_slope_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS soil_drainage_class TEXT,
  ADD COLUMN IF NOT EXISTS environmental_sites JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS historical_flood_events INTEGER;

-- 13. AI NARRATIVE OUTPUTS
ALTER TABLE applications 
  ADD COLUMN IF NOT EXISTS traffic_output TEXT;

-- 14. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_applications_city ON applications(city);
CREATE INDEX IF NOT EXISTS idx_applications_county ON applications(county);
CREATE INDEX IF NOT EXISTS idx_applications_parcel_id ON applications(parcel_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_zone ON applications(opportunity_zone);
CREATE INDEX IF NOT EXISTS idx_applications_submission_timestamp ON applications(submission_timestamp);

-- ============================================================
-- End of Migration Script
-- ============================================================