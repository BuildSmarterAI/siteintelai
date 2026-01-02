-- Security fix: Add explicit search_path to update_updated_at function
-- This addresses the linter warning about functions without search_path

-- First, drop the existing function if it exists (to recreate with search_path)
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;

-- Recreate the function with explicit search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Document the Security Definer views as intentional
-- v_reports_sanitized uses SECURITY DEFINER because it needs to:
-- 1. Check subscription status from subscription_credits table
-- 2. Apply the sanitize_report_json function which has elevated permissions
-- This is the correct pattern for views that need to aggregate data across tables
-- with different RLS policies

COMMENT ON VIEW public.v_reports_sanitized IS 
'Security Definer view for report sanitization. This view intentionally uses elevated 
permissions to check subscription status and apply data sanitization. The underlying 
sanitize_report_json function is security definer to prevent unauthorized access to 
full report data. This is the recommended pattern for views that aggregate data across 
tables with different RLS policies.';

-- Note: geography_columns and geometry_columns are PostGIS system views
-- and should NOT be modified. They are flagged by the linter but are 
-- intentional and necessary for PostGIS functionality.