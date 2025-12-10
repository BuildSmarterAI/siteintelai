-- Disable currently-down endpoints temporarily
UPDATE gis_layers
SET status = 'disabled', updated_at = NOW()
WHERE layer_key IN ('houston_sewer_lines', 'houston_water_lines', 'nwi_wetlands', 'txdot_aadt');