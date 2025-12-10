-- ScraperAPI Infrastructure Tables

-- Add scraper columns to map_servers
ALTER TABLE map_servers ADD COLUMN IF NOT EXISTS scraper_mode text DEFAULT 'fallback' CHECK (scraper_mode IN ('disabled', 'fallback', 'primary'));
ALTER TABLE map_servers ADD COLUMN IF NOT EXISTS scraper_config jsonb DEFAULT '{}';

-- Scraper cache table for response caching
CREATE TABLE IF NOT EXISTS scraper_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url_hash text NOT NULL UNIQUE,
  url text NOT NULL,
  response_body text,
  content_type text DEFAULT 'application/json',
  source_type text DEFAULT 'gis',
  api_credits_used integer DEFAULT 1,
  scraped_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for cache lookup
CREATE INDEX IF NOT EXISTS idx_scraper_cache_url_hash ON scraper_cache(url_hash);
CREATE INDEX IF NOT EXISTS idx_scraper_cache_expires ON scraper_cache(expires_at);

-- Scraper usage log for cost tracking
CREATE TABLE IF NOT EXISTS scraper_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  endpoint_type text,
  map_server_id uuid REFERENCES map_servers(id),
  scraper_mode text,
  api_credits_used integer DEFAULT 1,
  response_status integer,
  response_time_ms integer,
  cache_hit boolean DEFAULT false,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for usage analysis
CREATE INDEX IF NOT EXISTS idx_scraper_usage_created ON scraper_usage_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraper_usage_map_server ON scraper_usage_log(map_server_id);

-- Enable RLS
ALTER TABLE scraper_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_usage_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for scraper_cache (service role only)
CREATE POLICY "Service role full access to scraper_cache" ON scraper_cache
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- RLS policies for scraper_usage_log
CREATE POLICY "Service role can insert scraper_usage" ON scraper_usage_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view scraper_usage" ON scraper_usage_log
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Set default scraper modes for existing map_servers based on server_key
-- Tier 1: Disabled (reliable endpoints)
UPDATE map_servers SET scraper_mode = 'disabled' WHERE server_key ILIKE '%fema%' OR server_key ILIKE '%txdot%' OR server_key ILIKE '%usfws%' OR server_key ILIKE '%wetlands%';

-- Tier 2: Fallback (occasional issues) - default
UPDATE map_servers SET scraper_mode = 'fallback' WHERE scraper_mode IS NULL;

-- Tier 3: Primary (known problematic)
UPDATE map_servers SET scraper_mode = 'primary' WHERE server_key ILIKE '%houston_water%' OR base_url ILIKE '%houstonwatergis%';