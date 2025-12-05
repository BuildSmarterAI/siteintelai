-- Add index for fast geocoder cache lookups
CREATE INDEX IF NOT EXISTS idx_geocoder_cache_hash_expires 
ON geocoder_cache(input_hash, expires_at);

-- Add index for cache cleanup queries
CREATE INDEX IF NOT EXISTS idx_geocoder_cache_expires_at 
ON geocoder_cache(expires_at);