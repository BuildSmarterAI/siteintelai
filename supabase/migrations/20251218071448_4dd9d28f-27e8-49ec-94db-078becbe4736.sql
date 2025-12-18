-- API Cost Configuration Table - Define cost per API source
CREATE TABLE public.api_cost_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT UNIQUE NOT NULL,
  cost_per_call NUMERIC(10,6) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  provider TEXT,
  is_free BOOLEAN DEFAULT false,
  monthly_free_tier INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Cost Snapshots Table - Hourly cost aggregation
CREATE TABLE public.api_cost_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hour TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL,
  call_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  estimated_cost NUMERIC(10,4) NOT NULL DEFAULT 0,
  cumulative_daily_cost NUMERIC(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hour, source)
);

-- API Budget Configuration Table - Budget thresholds
CREATE TABLE public.api_budget_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_type TEXT NOT NULL,
  source TEXT,
  threshold_warn NUMERIC(10,2) NOT NULL DEFAULT 50,
  threshold_critical NUMERIC(10,2) NOT NULL DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.api_cost_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_cost_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_budget_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_cost_config
CREATE POLICY "Admins can manage api_cost_config" ON public.api_cost_config
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public read access to api_cost_config" ON public.api_cost_config
  FOR SELECT USING (true);

-- RLS Policies for api_cost_snapshots
CREATE POLICY "Service role can manage api_cost_snapshots" ON public.api_cost_snapshots
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view api_cost_snapshots" ON public.api_cost_snapshots
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for api_budget_config
CREATE POLICY "Admins can manage api_budget_config" ON public.api_budget_config
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes
CREATE INDEX idx_api_cost_snapshots_hour ON public.api_cost_snapshots(hour DESC);
CREATE INDEX idx_api_cost_snapshots_source ON public.api_cost_snapshots(source);

-- Seed API cost configuration with known Google API prices
INSERT INTO public.api_cost_config (source, cost_per_call, provider, is_free, monthly_free_tier, notes) VALUES
  ('google_places_nearby', 0.032000, 'google', false, 0, 'Places API - Nearby Search'),
  ('google_places_details', 0.017000, 'google', false, 0, 'Places API - Place Details'),
  ('google_geocoding', 0.005000, 'google', false, 0, 'Geocoding API'),
  ('google_elevation_api', 0.005000, 'google', false, 0, 'Elevation API'),
  ('google_static_maps', 0.002000, 'google', false, 0, 'Static Maps API'),
  ('google_street_view', 0.007000, 'google', false, 0, 'Street View Static API'),
  ('google_distance_matrix', 0.005000, 'google', false, 0, 'Distance Matrix API'),
  ('google_address_validation', 0.006600, 'google', false, 5000, 'Address Validation API - 5k free/month'),
  ('usgs_epqs', 0.000000, 'usgs', true, 0, 'USGS Elevation Point Query Service - Free'),
  ('fema_nfhl', 0.000000, 'fema', true, 0, 'FEMA National Flood Hazard Layer - Free'),
  ('census_api', 0.000000, 'census', true, 0, 'Census Bureau API - Free'),
  ('epa_echo', 0.000000, 'epa', true, 0, 'EPA ECHO Facility Search - Free'),
  ('hcad_parcel', 0.000000, 'hcad', true, 0, 'Harris County Appraisal District - Free'),
  ('coh_gis', 0.000000, 'houston', true, 0, 'City of Houston GIS Services - Free'),
  ('txdot_aadt', 0.000000, 'txdot', true, 0, 'TxDOT Traffic Counts - Free'),
  ('supabase_rpc', 0.000000, 'supabase', true, 0, 'Internal Supabase RPC - Free')
ON CONFLICT (source) DO UPDATE SET
  cost_per_call = EXCLUDED.cost_per_call,
  provider = EXCLUDED.provider,
  is_free = EXCLUDED.is_free,
  monthly_free_tier = EXCLUDED.monthly_free_tier,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- Seed default budget thresholds
INSERT INTO public.api_budget_config (budget_type, source, threshold_warn, threshold_critical, is_active) VALUES
  ('daily', NULL, 50.00, 100.00, true),
  ('monthly', NULL, 1000.00, 2000.00, true)
ON CONFLICT DO NOTHING;