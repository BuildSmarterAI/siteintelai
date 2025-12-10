-- Update all ArcGIS endpoints to use 'fallback' mode instead of 'primary'
-- This ensures direct fetch is tried first, only falling back to ScraperAPI on 403/429/5xx

UPDATE map_servers 
SET scraper_mode = 'fallback',
    updated_at = now()
WHERE base_url ILIKE '%arcgis%' 
   OR base_url ILIKE '%gis.hctx.net%'
   OR base_url ILIKE '%houstonwatergis%'
   OR base_url ILIKE '%houstontx.gov%';

-- Also set any 'primary' mode endpoints to 'fallback' as a safety measure
UPDATE map_servers
SET scraper_mode = 'fallback',
    updated_at = now()
WHERE scraper_mode = 'primary';