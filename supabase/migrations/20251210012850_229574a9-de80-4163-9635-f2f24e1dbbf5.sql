-- Fix houston_water_lines to use Layer 3 (Water Distribution Main) instead of Layer 0 (Service Lateral)
-- Layer 3 has no minScale restriction and contains the main distribution lines

UPDATE map_servers 
SET base_url = REPLACE(base_url, '/MapServer/0', '/MapServer/3'),
    updated_at = now()
WHERE server_key = 'houston_water_lines';