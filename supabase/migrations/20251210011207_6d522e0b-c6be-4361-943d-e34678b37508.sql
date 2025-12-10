-- Fix ArcGIS base URLs to include layer index (e.g., /MapServer/0 instead of /MapServer)
-- This is required for ArcGIS REST queries to work properly

UPDATE map_servers 
SET base_url = base_url || '/0',
    updated_at = now()
WHERE base_url LIKE '%/MapServer' 
  AND base_url NOT LIKE '%/MapServer/%'
  AND (base_url ILIKE '%houstonwatergis%' OR base_url ILIKE '%houstontx.gov%');