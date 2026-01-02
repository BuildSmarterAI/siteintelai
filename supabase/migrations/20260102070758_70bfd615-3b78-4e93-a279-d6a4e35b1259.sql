-- Migration: Add orchestration hardening columns and API cache table

-- Add orchestration lock column for idempotency
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS orchestration_lock_at TIMESTAMPTZ DEFAULT NULL;

-- Add confidence score for AI outputs
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS confidence_score INTEGER DEFAULT NULL;

-- Create API cache table for external API responses
CREATE TABLE IF NOT EXISTS api_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Indexes for api_cache
CREATE INDEX IF NOT EXISTS idx_api_cache_key ON api_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON api_cache(expires_at);

-- Index for orchestration lock lookups
CREATE INDEX IF NOT EXISTS idx_applications_orchestration_lock ON applications(orchestration_lock_at) WHERE orchestration_lock_at IS NOT NULL;

-- Enable RLS on api_cache (service_role only)
ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access api_cache
CREATE POLICY "Service role can manage api_cache"
ON api_cache
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);