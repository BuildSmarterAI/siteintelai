-- Phase 1: Add fields for EPA ECHO and Wetlands integration
-- These fields align with the BuildSmarter™ research document specifications

-- EPA ECHO Environmental Facilities fields
ALTER TABLE applications ADD COLUMN IF NOT EXISTS epa_facilities_count INTEGER;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS nearest_facility_dist NUMERIC;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS nearest_facility_type TEXT;

-- USFWS Wetlands fields
ALTER TABLE applications ADD COLUMN IF NOT EXISTS wetlands_area_pct NUMERIC;

-- FEMA NFIP Claims fields (for future use)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS nfip_claims_count INTEGER;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS nfip_claims_total_paid NUMERIC;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS disaster_declarations TEXT;

-- Traffic fields (standardize naming per research doc)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS aadt_near INTEGER;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS aadt_road_name TEXT;

-- Caching strategy fields
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cache_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_api_refresh JSONB DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN applications.epa_facilities_count IS 'Count of EPA ECHO facilities within 1-mile radius';
COMMENT ON COLUMN applications.nearest_facility_dist IS 'Distance in miles to nearest EPA facility';
COMMENT ON COLUMN applications.nearest_facility_type IS 'Type/program of nearest EPA facility (NPDES, RCRA, etc.)';
COMMENT ON COLUMN applications.wetlands_area_pct IS 'Percentage of parcel area overlapping wetlands (NWI)';
COMMENT ON COLUMN applications.aadt_near IS 'TxDOT Annual Average Daily Traffic count of nearest road';
COMMENT ON COLUMN applications.aadt_road_name IS 'Name of road for AADT measurement';
COMMENT ON COLUMN applications.cache_expires_at IS 'Timestamp when cached data expires';
COMMENT ON COLUMN applications.last_api_refresh IS 'JSONB tracking last refresh time per API source';