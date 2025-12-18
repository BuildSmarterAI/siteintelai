-- 1. Create universal API cache table
CREATE TABLE public.api_cache_universal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_params JSONB,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.api_cache_universal ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Service role can manage cache" ON public.api_cache_universal
  FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_api_cache_key ON public.api_cache_universal(cache_key);
CREATE INDEX idx_api_cache_expires ON public.api_cache_universal(expires_at);
CREATE INDEX idx_api_cache_provider ON public.api_cache_universal(provider);

-- 2. Create system_config table for emergency mode and other flags
CREATE TABLE public.system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system config" ON public.system_config
  FOR ALL USING (true) WITH CHECK (true);

-- Seed emergency mode config
INSERT INTO public.system_config (key, value, description) VALUES
  ('emergency_cost_mode', 'false', 'When true, expensive API calls are skipped'),
  ('cost_circuit_breaker_threshold', '100', 'Daily spend threshold in USD to trigger emergency mode'),
  ('paused_cron_jobs', '[]', 'List of cron job names currently paused due to cost controls');

-- 3. Extend api_cost_config with AWS, BigQuery, and third-party costs
INSERT INTO public.api_cost_config (source, cost_per_call, provider, is_free, notes) VALUES
  -- AWS
  ('aws_s3_put', 0.000005, 'aws', false, '$0.005 per 1000 PUT requests'),
  ('aws_s3_get', 0.0000004, 'aws', false, '$0.0004 per 1000 GET requests'),
  ('aws_s3_storage_gb', 0.023, 'aws', false, '$0.023 per GB-month'),
  ('aws_cloudfront_gb', 0.085, 'aws', false, '$0.085 per GB transfer'),
  -- BigQuery
  ('bigquery_query_tb', 5.00, 'google', false, '$5 per TB scanned'),
  ('bigquery_storage_gb', 0.02, 'google', false, '$0.02 per GB-month active'),
  -- Third-party
  ('pdfshift_conversion', 0.01, 'pdfshift', false, 'Per PDF conversion'),
  ('scraperapi_request', 0.001, 'scraperapi', false, 'Per successful request'),
  -- Additional Google APIs
  ('google_address_validation', 0.017, 'google', false, '$17 per 1000 requests')
ON CONFLICT (source) DO UPDATE SET
  cost_per_call = EXCLUDED.cost_per_call,
  provider = EXCLUDED.provider,
  notes = EXCLUDED.notes;

-- 4. Create function to check/get cached response
CREATE OR REPLACE FUNCTION get_cached_api_response(p_cache_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_response JSONB;
BEGIN
  UPDATE api_cache_universal
  SET hit_count = hit_count + 1
  WHERE cache_key = p_cache_key
    AND expires_at > NOW()
  RETURNING response INTO v_response;
  
  RETURN v_response;
END;
$$;

-- 5. Create function to store cached response
CREATE OR REPLACE FUNCTION store_cached_api_response(
  p_cache_key TEXT,
  p_provider TEXT,
  p_endpoint TEXT,
  p_request_params JSONB,
  p_response JSONB,
  p_ttl_hours INTEGER DEFAULT 168
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO api_cache_universal (cache_key, provider, endpoint, request_params, response, expires_at)
  VALUES (p_cache_key, p_provider, p_endpoint, p_request_params, p_response, NOW() + (p_ttl_hours || ' hours')::INTERVAL)
  ON CONFLICT (cache_key) DO UPDATE SET
    response = EXCLUDED.response,
    expires_at = NOW() + (p_ttl_hours || ' hours')::INTERVAL,
    hit_count = api_cache_universal.hit_count;
END;
$$;

-- 6. Cleanup function for expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_api_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM api_cache_universal WHERE expires_at < NOW();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;