-- Phase 1: Dataset Quality Table and Parcel Views

-- 1. Create dataset_quality table for ETL quality metrics
CREATE TABLE public.dataset_quality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingestion_run_id UUID NOT NULL REFERENCES public.ingestion_runs(id) ON DELETE CASCADE,
  jurisdiction TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  total_records BIGINT DEFAULT 0,
  valid_records BIGINT DEFAULT 0,
  invalid_geometries BIGINT DEFAULT 0,
  repaired_geometries BIGINT DEFAULT 0,
  null_parcel_ids BIGINT DEFAULT 0,
  duplicate_parcel_ids BIGINT DEFAULT 0,
  missing_addresses BIGINT DEFAULT 0,
  quality_score NUMERIC(5,2),
  error_summary JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for dataset_quality
CREATE INDEX idx_dataset_quality_run ON public.dataset_quality(ingestion_run_id);
CREATE INDEX idx_dataset_quality_jurisdiction ON public.dataset_quality(jurisdiction);
CREATE INDEX idx_dataset_quality_version ON public.dataset_quality(dataset_version);

-- RLS for dataset_quality
ALTER TABLE public.dataset_quality ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage dataset_quality"
  ON public.dataset_quality FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view dataset_quality"
  ON public.dataset_quality FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view dataset_quality"
  ON public.dataset_quality FOR SELECT
  USING (auth.role() = 'authenticated');

-- 2. Create v_parcels_current view (latest version per jurisdiction)
CREATE OR REPLACE VIEW public.v_parcels_current AS
SELECT cp.*
FROM public.canonical_parcels cp
INNER JOIN (
  SELECT jurisdiction, MAX(dataset_version) AS dataset_version
  FROM public.canonical_parcels
  GROUP BY jurisdiction
) latest
ON cp.jurisdiction = latest.jurisdiction
AND cp.dataset_version = latest.dataset_version;

-- 3. Create v_parcels_odata view (OData-friendly JSON output)
CREATE OR REPLACE VIEW public.v_parcels_odata AS
SELECT
  id,
  jurisdiction,
  county_fips,
  source_agency,
  dataset_version,
  source_parcel_id,
  apn,
  situs_address,
  city,
  state,
  zip,
  acreage,
  land_use_code,
  land_use_desc,
  owner_name,
  owner_mailing_address,
  owner_city,
  owner_state,
  owner_zip,
  ST_AsGeoJSON(centroid)::jsonb AS centroid_geojson,
  ST_AsGeoJSON(geom)::jsonb AS geom_geojson,
  created_at,
  updated_at
FROM public.v_parcels_current;

-- Comment the views for documentation
COMMENT ON VIEW public.v_parcels_current IS 'Latest parcel records per jurisdiction based on dataset_version';
COMMENT ON VIEW public.v_parcels_odata IS 'OData-friendly parcel view with GeoJSON geometry output';
COMMENT ON TABLE public.dataset_quality IS 'ETL quality metrics per ingestion run';