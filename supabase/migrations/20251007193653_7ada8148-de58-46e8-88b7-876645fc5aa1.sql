-- Phase 1: Foundation Enhancements for OData-Ready Architecture

-- 1. Attach update_updated_at_column() triggers (drop if exists first)
DROP TRIGGER IF EXISTS update_applications_updated_at ON public.applications;
DROP TRIGGER IF EXISTS update_reports_updated_at ON public.reports;

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add foreign key constraint on reports.application_id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_reports_application' 
    AND table_name = 'reports'
  ) THEN
    ALTER TABLE public.reports
      ADD CONSTRAINT fk_reports_application
      FOREIGN KEY (application_id)
      REFERENCES public.applications(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Add JSON schema validation function for reports
CREATE OR REPLACE FUNCTION public.validate_report_json_schema(data jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
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

-- Add check constraint for JSON validation on reports (drop if exists first)
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS chk_report_json_schema;
ALTER TABLE public.reports
  ADD CONSTRAINT chk_report_json_schema
  CHECK (json_data IS NULL OR public.validate_report_json_schema(json_data));

-- 4. Create OData-ready views

-- View: v_parcels - Core parcel/property data
CREATE OR REPLACE VIEW public.v_parcels AS
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

-- View: v_reports_public - Public-facing reports with computed fields
CREATE OR REPLACE VIEW public.v_reports_public AS
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

-- Add comments for documentation
COMMENT ON VIEW public.v_parcels IS 'OData-ready view of parcel/property core data';
COMMENT ON VIEW public.v_reports_public IS 'OData-ready view of reports with computed score_band and related parcel data';
COMMENT ON TRIGGER update_applications_updated_at ON public.applications IS 'Automatically update updated_at timestamp on row modification';
COMMENT ON TRIGGER update_reports_updated_at ON public.reports IS 'Automatically update updated_at timestamp on row modification';