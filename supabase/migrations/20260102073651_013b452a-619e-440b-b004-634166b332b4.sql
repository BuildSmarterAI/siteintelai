-- Google Places Cache: stores Places API responses with field mask versioning
CREATE TABLE public.google_places_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id TEXT NOT NULL,
  fields_mask_hash TEXT NOT NULL,
  payload JSONB NOT NULL,
  display_name TEXT,
  formatted_address TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  types TEXT[],
  primary_type TEXT,
  confidence_score NUMERIC,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  cost_units NUMERIC DEFAULT 0,
  source_version TEXT DEFAULT 'places_v1',
  UNIQUE(place_id, fields_mask_hash)
);

-- Google Static Maps Assets: immutable map image provenance
CREATE TABLE public.google_static_maps_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  map_signature_hash TEXT NOT NULL UNIQUE,
  params_json JSONB NOT NULL,
  storage_path TEXT NOT NULL,
  sha256 TEXT,
  width INTEGER,
  height INTEGER,
  map_type TEXT DEFAULT 'hybrid',
  fetched_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '90 days')
);

-- Google Street View Assets: pano tracking with fallback status
CREATE TABLE public.google_streetview_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  sv_signature_hash TEXT NOT NULL UNIQUE,
  pano_id TEXT,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  heading NUMERIC,
  pitch NUMERIC DEFAULT 0,
  fov NUMERIC DEFAULT 90,
  params_json JSONB NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'not_available', 'pending', 'error')),
  storage_path TEXT,
  sha256 TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.google_places_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_static_maps_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_streetview_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for google_places_cache (public read, service write)
CREATE POLICY "Public read access to google_places_cache"
  ON public.google_places_cache FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage google_places_cache"
  ON public.google_places_cache FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for google_static_maps_assets
CREATE POLICY "Users can view own static map assets"
  ON public.google_static_maps_assets FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM applications WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all static map assets"
  ON public.google_static_maps_assets FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage static map assets"
  ON public.google_static_maps_assets FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for google_streetview_assets
CREATE POLICY "Users can view own streetview assets"
  ON public.google_streetview_assets FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM applications WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all streetview assets"
  ON public.google_streetview_assets FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage streetview assets"
  ON public.google_streetview_assets FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX idx_google_places_cache_place_id ON public.google_places_cache(place_id);
CREATE INDEX idx_google_places_cache_expires ON public.google_places_cache(expires_at);
CREATE INDEX idx_google_static_maps_application ON public.google_static_maps_assets(application_id);
CREATE INDEX idx_google_static_maps_signature ON public.google_static_maps_assets(map_signature_hash);
CREATE INDEX idx_google_streetview_application ON public.google_streetview_assets(application_id);
CREATE INDEX idx_google_streetview_signature ON public.google_streetview_assets(sv_signature_hash);
CREATE INDEX idx_google_streetview_status ON public.google_streetview_assets(status);