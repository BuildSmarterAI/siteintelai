-- Create gis-data storage bucket for GeoJSON files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gis-data', 'gis-data', true, 52428800, ARRAY['application/json', 'application/geo+json', 'application/gzip'])
ON CONFLICT (id) DO NOTHING;

-- Public read policy
CREATE POLICY "Allow public read gis-data" ON storage.objects
FOR SELECT USING (bucket_id = 'gis-data');

-- Service role write policies
CREATE POLICY "Allow service write gis-data" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'gis-data');

CREATE POLICY "Allow service update gis-data" ON storage.objects
FOR UPDATE USING (bucket_id = 'gis-data');

CREATE POLICY "Allow service delete gis-data" ON storage.objects
FOR DELETE USING (bucket_id = 'gis-data');

-- Disable problematic layers temporarily
UPDATE gis_layers
SET status = 'disabled', updated_at = NOW()
WHERE layer_key IN ('houston_parcels', 'houston_storm_lines', 'fema_flood_zones');