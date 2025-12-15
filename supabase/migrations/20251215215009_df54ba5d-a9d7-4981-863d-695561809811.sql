-- =============================================
-- Utility Ownership Resolution Engine - Phase 1
-- Tables: utility_providers, parcel_utility_assignments
-- =============================================

-- 1. Utility Providers Master Registry
CREATE TABLE public.utility_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Provider Identity
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('municipal', 'mud', 'wcid', 'pud', 'wsc', 'investor_owned', 'coop', 'private')),
  ccn_number TEXT,  -- PUCT Certificate of Convenience and Necessity
  tceq_id TEXT,     -- TCEQ PWS ID for water systems
  
  -- Service Types (what they provide)
  provides_water BOOLEAN DEFAULT false,
  provides_sewer BOOLEAN DEFAULT false,
  provides_storm BOOLEAN DEFAULT false,
  provides_reclaimed BOOLEAN DEFAULT false,
  
  -- Contact Information
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  website_url TEXT,
  mailing_address TEXT,
  physical_address TEXT,
  
  -- Service Area (PostGIS geometry)
  service_area_geom GEOMETRY(MultiPolygon, 4326),
  service_area_sqmi NUMERIC(10,2),
  
  -- Capacity & Status
  capacity_status TEXT DEFAULT 'available' CHECK (capacity_status IN ('available', 'limited', 'moratorium', 'unknown')),
  capacity_notes TEXT,
  accepts_new_connections BOOLEAN DEFAULT true,
  
  -- Fee Schedule (JSONB for flexibility)
  fee_schedule JSONB DEFAULT '{}'::jsonb,
  -- Example: {"water_tap": {"residential": 2500, "commercial": 5000}, "sewer_tap": {"residential": 3500}, "impact_fee_per_acre": 15000}
  fee_schedule_effective_date DATE,
  fee_schedule_source TEXT,
  
  -- Jurisdiction
  primary_county TEXT,
  counties_served TEXT[],
  cities_served TEXT[],
  
  -- Data Quality
  accuracy_tier INTEGER DEFAULT 2 CHECK (accuracy_tier BETWEEN 1 AND 3),
  confidence NUMERIC(3,2) DEFAULT 0.80,
  data_source TEXT,
  source_url TEXT,
  last_verified_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Parcel Utility Assignments (cached resolution results)
CREATE TABLE public.parcel_utility_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parcel Reference
  parcel_id UUID REFERENCES public.parcels(parcel_uuid),
  application_id UUID REFERENCES public.applications(id),
  
  -- Location (for parcels not yet in parcels table)
  centroid GEOMETRY(Point, 4326),
  
  -- Resolved Providers
  water_provider_id UUID REFERENCES public.utility_providers(id),
  sewer_provider_id UUID REFERENCES public.utility_providers(id),
  storm_provider_id UUID REFERENCES public.utility_providers(id),
  
  -- Resolution Details
  water_resolution_method TEXT CHECK (water_resolution_method IN ('ccn_spatial_match', 'mud_overlay', 'city_default', 'etj_provider', 'manual_override', 'unresolved')),
  sewer_resolution_method TEXT CHECK (sewer_resolution_method IN ('ccn_spatial_match', 'mud_overlay', 'city_default', 'etj_provider', 'manual_override', 'unresolved')),
  storm_resolution_method TEXT CHECK (storm_resolution_method IN ('city_limits', 'mud_overlay', 'county_default', 'manual_override', 'unresolved')),
  
  -- Confidence & Conflicts
  resolution_confidence NUMERIC(3,2) DEFAULT 0.80,
  has_conflicts BOOLEAN DEFAULT false,
  conflict_details JSONB,  -- Array of conflicting provider claims
  
  -- Estimated Costs (snapshot at resolution time)
  estimated_water_tap_cost NUMERIC(12,2),
  estimated_sewer_tap_cost NUMERIC(12,2),
  estimated_impact_fees NUMERIC(12,2),
  estimated_total_utility_cost NUMERIC(12,2),
  
  -- Serviceability Assessment
  water_serviceability TEXT CHECK (water_serviceability IN ('available', 'extension_required', 'lift_station_required', 'well_only', 'unavailable')),
  sewer_serviceability TEXT CHECK (sewer_serviceability IN ('gravity_available', 'extension_required', 'lift_station_required', 'septic_only', 'unavailable')),
  
  -- Distance to Infrastructure (from utilities enrichment)
  distance_to_water_main_ft NUMERIC(10,2),
  distance_to_sewer_main_ft NUMERIC(10,2),
  
  -- Kill Factor Flags
  is_kill_factor BOOLEAN DEFAULT false,
  kill_factor_reason TEXT,
  
  -- Cache Management
  resolved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================

-- utility_providers indexes
CREATE INDEX idx_utility_providers_service_area ON public.utility_providers USING GIST (service_area_geom);
CREATE INDEX idx_utility_providers_ccn ON public.utility_providers (ccn_number) WHERE ccn_number IS NOT NULL;
CREATE INDEX idx_utility_providers_type ON public.utility_providers (provider_type);
CREATE INDEX idx_utility_providers_county ON public.utility_providers (primary_county);
CREATE INDEX idx_utility_providers_water ON public.utility_providers (provides_water) WHERE provides_water = true;
CREATE INDEX idx_utility_providers_sewer ON public.utility_providers (provides_sewer) WHERE provides_sewer = true;

-- parcel_utility_assignments indexes
CREATE INDEX idx_parcel_utility_assignments_parcel ON public.parcel_utility_assignments (parcel_id);
CREATE INDEX idx_parcel_utility_assignments_application ON public.parcel_utility_assignments (application_id);
CREATE INDEX idx_parcel_utility_assignments_centroid ON public.parcel_utility_assignments USING GIST (centroid);
CREATE INDEX idx_parcel_utility_assignments_expires ON public.parcel_utility_assignments (expires_at);
CREATE INDEX idx_parcel_utility_assignments_water_provider ON public.parcel_utility_assignments (water_provider_id);
CREATE INDEX idx_parcel_utility_assignments_sewer_provider ON public.parcel_utility_assignments (sewer_provider_id);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.utility_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcel_utility_assignments ENABLE ROW LEVEL SECURITY;

-- utility_providers: Public read access (reference data)
CREATE POLICY "Utility providers are viewable by everyone"
  ON public.utility_providers FOR SELECT
  USING (true);

-- utility_providers: Admin-only write access
CREATE POLICY "Only admins can insert utility providers"
  ON public.utility_providers FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update utility providers"
  ON public.utility_providers FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete utility providers"
  ON public.utility_providers FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- parcel_utility_assignments: Users can view their own assignments
CREATE POLICY "Users can view their own utility assignments"
  ON public.parcel_utility_assignments FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM public.applications WHERE user_id = auth.uid()
    )
  );

-- parcel_utility_assignments: Service role can manage all
CREATE POLICY "Service role can manage all utility assignments"
  ON public.parcel_utility_assignments FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to find utility providers for a point
CREATE OR REPLACE FUNCTION public.get_utility_providers_for_point(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION
)
RETURNS TABLE (
  provider_id UUID,
  provider_name TEXT,
  provider_type TEXT,
  ccn_number TEXT,
  provides_water BOOLEAN,
  provides_sewer BOOLEAN,
  provides_storm BOOLEAN,
  capacity_status TEXT,
  fee_schedule JSONB,
  confidence NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    up.id AS provider_id,
    up.provider_name,
    up.provider_type,
    up.ccn_number,
    up.provides_water,
    up.provides_sewer,
    up.provides_storm,
    up.capacity_status,
    up.fee_schedule,
    up.confidence
  FROM public.utility_providers up
  WHERE ST_Contains(
    up.service_area_geom,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)
  )
  ORDER BY up.accuracy_tier ASC, up.confidence DESC;
$$;

-- Function to get cached utility assignment
CREATE OR REPLACE FUNCTION public.get_cached_utility_assignment(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_tolerance_meters DOUBLE PRECISION DEFAULT 100
)
RETURNS public.parcel_utility_assignments
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.parcel_utility_assignments
  WHERE ST_DWithin(
    centroid::geography,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    p_tolerance_meters
  )
  AND expires_at > now()
  ORDER BY resolved_at DESC
  LIMIT 1;
$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_utility_providers_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_utility_providers_updated_at
  BEFORE UPDATE ON public.utility_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_utility_providers_timestamp();

CREATE TRIGGER update_parcel_utility_assignments_updated_at
  BEFORE UPDATE ON public.parcel_utility_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_utility_providers_timestamp();

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE public.utility_providers IS 'Master registry of utility providers (water, sewer, storm) with service area geometries and fee schedules';
COMMENT ON TABLE public.parcel_utility_assignments IS 'Cached utility ownership resolution results per parcel with estimated costs and serviceability';
COMMENT ON FUNCTION public.get_utility_providers_for_point IS 'Spatial query to find all utility providers whose service area contains a given point';
COMMENT ON FUNCTION public.get_cached_utility_assignment IS 'Retrieve cached utility assignment for a location within tolerance';