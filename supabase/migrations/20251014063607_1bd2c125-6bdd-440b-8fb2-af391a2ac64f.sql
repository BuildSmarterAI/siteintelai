-- =====================================================
-- Phase 2: Database-Level IP Protection for data_sources
-- =====================================================
-- Purpose: Prevent non-enterprise users from accessing 
-- competitive intelligence (dataset names, endpoints, timestamps)
-- at the PostgreSQL level, even if they bypass the application.

-- Step 1: Create security definer function to sanitize report JSON
CREATE OR REPLACE FUNCTION public.sanitize_report_json(
  report_json jsonb,
  user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tier text;
BEGIN
  -- Get user's subscription tier name
  SELECT st.name INTO user_tier
  FROM user_subscriptions us
  JOIN subscription_tiers st ON us.tier_id = st.id
  WHERE us.user_id = sanitize_report_json.user_id
    AND us.status = 'active'
  LIMIT 1;

  -- If no active subscription, treat as free tier
  IF user_tier IS NULL THEN
    user_tier := 'Free';
  END IF;

  -- Enterprise users get full data_sources array
  IF user_tier = 'Enterprise' THEN
    RETURN report_json;
  END IF;

  -- All other tiers: strip data_sources from JSON
  -- This prevents exposure of competitive intelligence:
  -- - Dataset names (e.g., "FEMA National Flood Hazard Layer")
  -- - API endpoints (e.g., "https://hazards.fema.gov/gis/nfhl/rest/services")
  -- - Timestamps (e.g., "2025-01-15T08:30:00Z")
  RETURN report_json - 'data_sources';
END;
$$;

-- Step 2: Create sanitized view for reports table
-- This view automatically applies data_sources filtering based on user tier
CREATE OR REPLACE VIEW v_reports_sanitized AS
SELECT 
  r.id,
  r.application_id,
  r.user_id,
  r.report_type,
  r.feasibility_score,
  r.score_band,
  r.status,
  r.validation_status,
  r.error_message,
  r.pdf_url,
  r.ai_prompt_tokens,
  r.ai_completion_tokens,
  r.created_at,
  r.updated_at,
  -- 🔒 Apply tier-based sanitization to json_data
  public.sanitize_report_json(r.json_data, auth.uid()) AS json_data
FROM reports r;

-- Step 3: Grant access to authenticated users
GRANT SELECT ON v_reports_sanitized TO authenticated;

-- Step 4: Add RLS policy to the view (inherit from reports table)
ALTER VIEW v_reports_sanitized SET (security_invoker = true);

-- Step 5: Create index on subscription tier lookup (performance optimization)
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active_tier 
ON user_subscriptions(user_id, status, tier_id) 
WHERE status = 'active';

-- Step 6: Add comment documentation
COMMENT ON FUNCTION public.sanitize_report_json IS 
'IP Protection: Removes data_sources array from report JSON for non-enterprise users. Enterprise tier receives full dataset transparency including provider names, API endpoints, and timestamps.';

COMMENT ON VIEW v_reports_sanitized IS 
'Secure view that automatically filters data_sources based on user subscription tier. Non-enterprise users cannot see competitive intelligence like dataset names or API endpoints.';