-- ============================================================================
-- Transport Metrics Database Schema
-- Creates txdot_districts, parcel_transport_metrics, and RPC functions
-- ============================================================================

-- ========== TXDOT DISTRICTS TABLE ==========
CREATE TABLE IF NOT EXISTS public.txdot_districts (
  id SERIAL PRIMARY KEY,
  district_id TEXT NOT NULL UNIQUE,
  district_name TEXT NOT NULL,
  district_abbr TEXT,
  geom GEOMETRY(MultiPolygon, 4326) NOT NULL,
  area_sq_mi NUMERIC,
  headquarters_city TEXT,
  source_version TEXT DEFAULT '2025_01',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for txdot_districts
CREATE INDEX IF NOT EXISTS idx_txdot_districts_geom ON public.txdot_districts USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_txdot_districts_district_id ON public.txdot_districts(district_id);

-- Enable RLS
ALTER TABLE public.txdot_districts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read txdot_districts" ON public.txdot_districts
  FOR SELECT USING (true);

CREATE POLICY "Admin write txdot_districts" ON public.txdot_districts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service write txdot_districts" ON public.txdot_districts
  FOR ALL USING (auth.role() = 'service_role');

-- ========== PARCEL TRANSPORT METRICS CACHE TABLE ==========
CREATE TABLE IF NOT EXISTS public.parcel_transport_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id BIGINT NOT NULL,
  parcel_uid UUID,
  
  -- District info
  txdot_district_id TEXT,
  txdot_district_name TEXT,
  
  -- Road proximity metrics (in feet)
  nearest_highway_ft NUMERIC,
  nearest_arterial_ft NUMERIC,
  nearest_collector_ft NUMERIC,
  nearest_local_ft NUMERIC,
  
  -- Traffic metrics
  aadt_weighted NUMERIC,
  aadt_max_nearby INTEGER,
  aadt_road_name TEXT,
  aadt_year INTEGER,
  
  -- Intersection/access metrics
  intersection_count_500ft INTEGER DEFAULT 0,
  intersection_count_1mi INTEGER DEFAULT 0,
  signal_count_500ft INTEGER DEFAULT 0,
  
  -- Computed scores (0-100)
  highway_proximity_score NUMERIC,
  arterial_proximity_score NUMERIC,
  traffic_volume_score NUMERIC,
  access_density_score NUMERIC,
  
  -- Final weighted scores by use type
  score_retail NUMERIC,
  score_industrial NUMERIC,
  score_office NUMERIC,
  score_healthcare NUMERIC,
  score_residential NUMERIC,
  
  -- Confidence and metadata
  confidence NUMERIC DEFAULT 0.5,
  confidence_factors JSONB DEFAULT '{}',
  citations JSONB DEFAULT '[]',
  
  -- Versioning
  computed_version TEXT DEFAULT 'v1',
  source_data_version TEXT,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  
  -- Constraints
  CONSTRAINT parcel_transport_metrics_parcel_id_version_key UNIQUE (parcel_id, computed_version)
);

-- Indexes for parcel_transport_metrics
CREATE INDEX IF NOT EXISTS idx_ptm_parcel_id ON public.parcel_transport_metrics(parcel_id);
CREATE INDEX IF NOT EXISTS idx_ptm_parcel_uid ON public.parcel_transport_metrics(parcel_uid);
CREATE INDEX IF NOT EXISTS idx_ptm_expires_at ON public.parcel_transport_metrics(expires_at);
CREATE INDEX IF NOT EXISTS idx_ptm_district ON public.parcel_transport_metrics(txdot_district_id);

-- Enable RLS
ALTER TABLE public.parcel_transport_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read parcel_transport_metrics" ON public.parcel_transport_metrics
  FOR SELECT USING (true);

CREATE POLICY "Admin write parcel_transport_metrics" ON public.parcel_transport_metrics
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service write parcel_transport_metrics" ON public.parcel_transport_metrics
  FOR ALL USING (auth.role() = 'service_role');

-- ========== RPC: RESOLVE PARCEL CANDIDATES ==========
CREATE OR REPLACE FUNCTION public.resolve_parcel_candidates(
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_radius_m NUMERIC DEFAULT 100,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  parcel_id BIGINT,
  source_parcel_id TEXT,
  apn TEXT,
  situs_address TEXT,
  owner_name TEXT,
  acreage NUMERIC,
  jurisdiction TEXT,
  land_use_code TEXT,
  distance_m NUMERIC,
  centroid_lat NUMERIC,
  centroid_lng NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id AS parcel_id,
    cp.source_parcel_id,
    cp.apn,
    cp.situs_address,
    cp.owner_name,
    cp.acreage,
    cp.jurisdiction,
    cp.land_use_code,
    ST_Distance(
      ST_Transform(cp.geom, 3857),
      ST_Transform(ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326), 3857)
    ) AS distance_m,
    ST_Y(cp.centroid)::NUMERIC AS centroid_lat,
    ST_X(cp.centroid)::NUMERIC AS centroid_lng
  FROM canonical_parcels cp
  WHERE ST_DWithin(
    cp.geom::geography,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    p_radius_m
  )
  ORDER BY distance_m ASC
  LIMIT p_limit;
END;
$$;

-- ========== RPC: GET TXDOT DISTRICT ==========
CREATE OR REPLACE FUNCTION public.get_txdot_district(
  p_lat NUMERIC,
  p_lng NUMERIC
)
RETURNS TABLE (
  district_id TEXT,
  district_name TEXT,
  district_abbr TEXT,
  headquarters_city TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    td.district_id,
    td.district_name,
    td.district_abbr,
    td.headquarters_city
  FROM txdot_districts td
  WHERE ST_Contains(
    td.geom,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)
  )
  LIMIT 1;
END;
$$;

-- ========== RPC: FIND NEAREST ROADS BY CLASS ==========
CREATE OR REPLACE FUNCTION public.find_nearest_roads(
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_buffer_ft NUMERIC DEFAULT 5280
)
RETURNS TABLE (
  road_class TEXT,
  road_name TEXT,
  distance_ft NUMERIC,
  aadt INTEGER,
  aadt_year INTEGER,
  speed_limit INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buffer_m NUMERIC;
BEGIN
  -- Convert feet to meters
  v_buffer_m := p_buffer_ft * 0.3048;
  
  RETURN QUERY
  SELECT DISTINCT ON (tc.road_class)
    tc.road_class,
    tc.road_name,
    (ST_Distance(
      ST_Transform(tc.geom, 3857),
      ST_Transform(ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326), 3857)
    ) * 3.28084)::NUMERIC AS distance_ft,
    tc.aadt,
    tc.aadt_year,
    tc.speed_limit
  FROM transportation_canonical tc
  WHERE ST_DWithin(
    tc.geom::geography,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    v_buffer_m
  )
  AND tc.road_class IS NOT NULL
  ORDER BY tc.road_class, distance_ft ASC;
END;
$$;

-- ========== RPC: COMPUTE TRANSPORT SCORE ==========
CREATE OR REPLACE FUNCTION public.compute_transport_metrics(
  p_parcel_id BIGINT,
  p_lat NUMERIC,
  p_lng NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_district RECORD;
  v_roads RECORD;
  v_highway_ft NUMERIC;
  v_arterial_ft NUMERIC;
  v_aadt_max INTEGER := 0;
  v_aadt_road TEXT;
  v_intersection_count INTEGER := 0;
BEGIN
  -- Get TxDOT district
  SELECT * INTO v_district FROM get_txdot_district(p_lat, p_lng);
  
  -- Get nearest roads by class
  FOR v_roads IN SELECT * FROM find_nearest_roads(p_lat, p_lng, 5280) LOOP
    IF v_roads.road_class IN ('Interstate', 'US Highway', 'State Highway') THEN
      v_highway_ft := COALESCE(v_highway_ft, v_roads.distance_ft);
    ELSIF v_roads.road_class IN ('Arterial', 'Major Arterial', 'Minor Arterial') THEN
      v_arterial_ft := COALESCE(v_arterial_ft, v_roads.distance_ft);
    END IF;
    
    IF v_roads.aadt > v_aadt_max THEN
      v_aadt_max := v_roads.aadt;
      v_aadt_road := v_roads.road_name;
    END IF;
  END LOOP;
  
  -- Count nearby road segments as intersection proxy
  SELECT COUNT(*) INTO v_intersection_count
  FROM transportation_canonical tc
  WHERE ST_DWithin(
    tc.geom::geography,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    152.4  -- 500 feet in meters
  );
  
  -- Build result
  v_result := jsonb_build_object(
    'parcel_id', p_parcel_id,
    'district', jsonb_build_object(
      'id', v_district.district_id,
      'name', v_district.district_name
    ),
    'proximity', jsonb_build_object(
      'highway_ft', v_highway_ft,
      'arterial_ft', v_arterial_ft
    ),
    'traffic', jsonb_build_object(
      'aadt_max', v_aadt_max,
      'aadt_road', v_aadt_road
    ),
    'access', jsonb_build_object(
      'intersection_count_500ft', v_intersection_count
    ),
    'computed_at', now()
  );
  
  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.resolve_parcel_candidates TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_txdot_district TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.find_nearest_roads TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.compute_transport_metrics TO anon, authenticated, service_role;