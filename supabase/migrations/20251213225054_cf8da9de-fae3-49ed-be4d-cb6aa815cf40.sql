-- Update existing tileset URLs to use branded domain
UPDATE tilesets 
SET tile_url_template = REPLACE(
  tile_url_template, 
  'd1s5qe1loulzm6.cloudfront.net', 
  'tiles.siteintel.ai'
)
WHERE tile_url_template LIKE '%d1s5qe1loulzm6.cloudfront.net%';

-- Add comment for audit trail
COMMENT ON TABLE tilesets IS 'Vector tile catalog - URLs migrated to tiles.siteintel.ai on 2024-12-13';