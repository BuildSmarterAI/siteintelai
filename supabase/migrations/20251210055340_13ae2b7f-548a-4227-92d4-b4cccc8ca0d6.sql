
-- Phase 1: Scraper Mode Audit
-- Set all ArcGIS/MapServer endpoints to 'disabled' (JSON APIs don't need ScraperAPI)
-- Per architecture principle: direct-fetch-vs-scraper-json-api-principle

UPDATE map_servers 
SET scraper_mode = 'disabled', updated_at = NOW()
WHERE (base_url LIKE '%arcgis%' OR base_url LIKE '%MapServer%' OR base_url LIKE '%FeatureServer%')
  AND scraper_mode = 'fallback';

-- Add comment for audit trail
COMMENT ON TABLE map_servers IS 'GIS MapServer registry. ArcGIS REST endpoints use disabled scraper_mode per architecture principle (JSON APIs dont need ScraperAPI). Updated 2025-12-10.';
