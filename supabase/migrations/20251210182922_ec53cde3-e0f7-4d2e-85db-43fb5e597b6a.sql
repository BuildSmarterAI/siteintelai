-- =============================================
-- Phase 2A: ETL Pipeline Tables
-- staging_parcels + ingestion_runs
-- =============================================

-- 1. Create ingestion_runs table (tracks ETL job executions)
CREATE TABLE IF NOT EXISTS public.ingestion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gis_layer_id UUID REFERENCES public.gis_layers(id) ON DELETE SET NULL,
  data_source_id UUID REFERENCES public.map_servers(id) ON DELETE SET NULL,
  dataset_version TEXT NOT NULL,
  etl_adapter TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error_message TEXT,
  error_details JSONB,
  rows_fetched INTEGER DEFAULT 0,
  rows_staged INTEGER DEFAULT 0,
  rows_merged INTEGER DEFAULT 0,
  rows_failed INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  triggered_by TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create staging_parcels table (temporary storage before merge to canonical)
CREATE TABLE IF NOT EXISTS public.staging_parcels (
  id BIGSERIAL PRIMARY KEY,
  ingestion_run_id UUID NOT NULL REFERENCES public.ingestion_runs(id) ON DELETE CASCADE,
  jurisdiction TEXT NOT NULL,
  county_fips TEXT,
  dataset_version TEXT NOT NULL,
  source_parcel_id TEXT,
  raw JSONB NOT NULL,
  geom geometry(Geometry, 4326),
  validation_errors JSONB,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create canonical_parcels table (final deduplicated parcel storage)
CREATE TABLE IF NOT EXISTS public.canonical_parcels (
  id BIGSERIAL PRIMARY KEY,
  jurisdiction TEXT NOT NULL,
  county_fips TEXT,
  source_agency TEXT,
  dataset_version TEXT NOT NULL,
  source_parcel_id TEXT NOT NULL,
  apn TEXT,
  situs_address TEXT,
  city TEXT,
  state TEXT DEFAULT 'TX',
  zip TEXT,
  acreage NUMERIC,
  land_use_code TEXT,
  land_use_desc TEXT,
  owner_name TEXT,
  owner_mailing_address TEXT,
  owner_city TEXT,
  owner_state TEXT,
  owner_zip TEXT,
  centroid geometry(Point, 4326),
  geom geometry(Geometry, 4326),
  source_url TEXT,
  source_system TEXT,
  ingestion_run_id UUID REFERENCES public.ingestion_runs(id) ON DELETE SET NULL,
  accuracy_tier SMALLINT DEFAULT 2,
  confidence SMALLINT DEFAULT 80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(jurisdiction, source_parcel_id, dataset_version)
);

-- =============================================
-- INDEXES
-- =============================================

-- ingestion_runs indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_status ON public.ingestion_runs(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_gis_layer_id ON public.ingestion_runs(gis_layer_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_data_source_id ON public.ingestion_runs(data_source_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_created_at ON public.ingestion_runs(created_at DESC);

-- staging_parcels indexes
CREATE INDEX IF NOT EXISTS idx_staging_parcels_run_id ON public.staging_parcels(ingestion_run_id);
CREATE INDEX IF NOT EXISTS idx_staging_parcels_jurisdiction ON public.staging_parcels(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_staging_parcels_geom ON public.staging_parcels USING GIST(geom);

-- canonical_parcels indexes
CREATE INDEX IF NOT EXISTS idx_canonical_parcels_jurisdiction ON public.canonical_parcels(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_canonical_parcels_county_fips ON public.canonical_parcels(county_fips);
CREATE INDEX IF NOT EXISTS idx_canonical_parcels_source_parcel_id ON public.canonical_parcels(source_parcel_id);
CREATE INDEX IF NOT EXISTS idx_canonical_parcels_geom ON public.canonical_parcels USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_canonical_parcels_centroid ON public.canonical_parcels USING GIST(centroid);
CREATE INDEX IF NOT EXISTS idx_canonical_parcels_situs_address ON public.canonical_parcels(situs_address);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS
ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staging_parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canonical_parcels ENABLE ROW LEVEL SECURITY;

-- ingestion_runs policies
CREATE POLICY "Admins can manage ingestion_runs"
  ON public.ingestion_runs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage ingestion_runs"
  ON public.ingestion_runs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view ingestion_runs"
  ON public.ingestion_runs FOR SELECT
  USING (auth.role() = 'authenticated');

-- staging_parcels policies (internal ETL only)
CREATE POLICY "Service role can manage staging_parcels"
  ON public.staging_parcels FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view staging_parcels"
  ON public.staging_parcels FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- canonical_parcels policies
CREATE POLICY "Public read access to canonical_parcels"
  ON public.canonical_parcels FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage canonical_parcels"
  ON public.canonical_parcels FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can manage canonical_parcels"
  ON public.canonical_parcels FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at for ingestion_runs
CREATE OR REPLACE FUNCTION public.update_ingestion_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ingestion_runs_updated_at
  BEFORE UPDATE ON public.ingestion_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ingestion_runs_updated_at();

-- Auto-update updated_at for canonical_parcels
CREATE TRIGGER trg_canonical_parcels_updated_at
  BEFORE UPDATE ON public.canonical_parcels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ingestion_runs_updated_at();