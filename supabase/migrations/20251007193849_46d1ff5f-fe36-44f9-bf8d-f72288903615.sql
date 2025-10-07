-- Fix security warnings from Phase 1 migration

-- 1. Fix validate_report_json_schema function - add search_path
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

-- 2. Fix views - ensure they use security_invoker (querying user's permissions)
-- Recreate v_parcels with proper security settings
DROP VIEW IF EXISTS public.v_parcels CASCADE;
CREATE VIEW public.v_parcels
WITH (security_invoker = on)
AS
SELECT 
  id as application_id,
  formatted_address,
  property_address,
  geo_lat,
  geo_lng,
  parcel_id,
  county,
  city,
  neighborhood,
  zoning_code,
  overlay_district,
  lot_size_value,
  lot_size_unit,
  acreage_cad,
  elevation,
  ownership_status,
  existing_improvements,
  created_at,
  updated_at
FROM public.applications;

-- Recreate v_reports_public with proper security settings
DROP VIEW IF EXISTS public.v_reports_public CASCADE;
CREATE VIEW public.v_reports_public
WITH (security_invoker = on)
AS
SELECT 
  r.id,
  r.application_id,
  r.user_id,
  r.report_type,
  r.status,
  r.feasibility_score,
  r.json_data,
  r.pdf_url,
  r.created_at,
  r.updated_at,
  -- Computed score band for OData $compute
  CASE 
    WHEN r.feasibility_score >= 80 THEN 'A'
    WHEN r.feasibility_score >= 60 THEN 'B'
    WHEN r.feasibility_score >= 40 THEN 'C'
    ELSE 'D'
  END as score_band,
  -- Related parcel data
  a.formatted_address,
  a.county,
  a.city,
  a.zoning_code,
  a.lot_size_value,
  a.lot_size_unit
FROM public.reports r
LEFT JOIN public.applications a ON r.application_id = a.id;

-- Re-add comments
COMMENT ON VIEW public.v_parcels IS 'OData-ready view of parcel/property core data (security_invoker enforces querying user RLS)';
COMMENT ON VIEW public.v_reports_public IS 'OData-ready view of reports with computed score_band and related parcel data (security_invoker enforces querying user RLS)';