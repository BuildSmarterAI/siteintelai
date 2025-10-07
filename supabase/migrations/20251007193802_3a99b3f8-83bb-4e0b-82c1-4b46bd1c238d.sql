-- Fix security warnings from Phase 1 migration

-- 1. Fix validate_report_json_schema function - set search_path
CREATE OR REPLACE FUNCTION public.validate_report_json_schema(data jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Validate required top-level keys exist
  IF NOT (data ? 'executive_summary' AND 
          data ? 'property_overview' AND 
          data ? 'zoning' AND 
          data ? 'utilities' AND 
          data ? 'conclusion') THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- 2. Fix views - set security_invoker to on to use querying user's permissions
ALTER VIEW public.v_parcels SET (security_invoker = on);
ALTER VIEW public.v_reports_public SET (security_invoker = on);