-- Parcel Verification Logs Table
-- Comprehensive audit trail for parcel selection verification gate
-- Per SiteIntel™ Parcel Selection Gate Audit requirements

CREATE TABLE public.parcel_verification_logs (
  lock_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parcel_id TEXT NOT NULL,
  county TEXT NOT NULL,
  
  -- Geometry integrity
  geometry_hash TEXT NOT NULL,
  geometry_wkt TEXT,
  
  -- Input context
  input_method TEXT NOT NULL CHECK (input_method IN ('address', 'cross_streets', 'cad')),
  raw_input TEXT NOT NULL,
  
  -- Geocoding metadata
  geocode_confidence TEXT CHECK (geocode_confidence IN ('high', 'medium', 'low')),
  geocode_precision TEXT,
  geocode_source TEXT,
  
  -- Selection context
  candidate_count INTEGER NOT NULL DEFAULT 1,
  candidates_presented JSONB DEFAULT '[]'::jsonb,
  warnings_shown TEXT[] DEFAULT '{}'::text[],
  
  -- User interaction timestamps
  checkbox_correct_boundary_at TIMESTAMPTZ,
  checkbox_location_matches_at TIMESTAMPTZ,
  checkbox_understands_analysis_at TIMESTAMPTZ,
  typed_confirmation_phrase TEXT,
  
  -- Verification timestamps
  lock_confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Client metadata
  user_agent TEXT,
  map_zoom_level NUMERIC,
  map_center_lat NUMERIC,
  map_center_lng NUMERIC,
  
  -- Staleness tracking
  geometry_verified_at TIMESTAMPTZ,
  geometry_stale BOOLEAN DEFAULT false,
  geometry_stale_detected_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.parcel_verification_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification logs
CREATE POLICY "Users can view own verification logs"
  ON public.parcel_verification_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own verification logs
CREATE POLICY "Users can insert own verification logs"
  ON public.parcel_verification_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all verification logs
CREATE POLICY "Admins can view all verification logs"
  ON public.parcel_verification_logs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role can manage all verification logs
CREATE POLICY "Service role can manage verification logs"
  ON public.parcel_verification_logs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Index for user lookups
CREATE INDEX idx_parcel_verification_logs_user_id ON public.parcel_verification_logs(user_id);

-- Index for parcel lookups
CREATE INDEX idx_parcel_verification_logs_parcel_id ON public.parcel_verification_logs(parcel_id);

-- Index for geometry hash lookups (staleness checks)
CREATE INDEX idx_parcel_verification_logs_geometry_hash ON public.parcel_verification_logs(geometry_hash);

-- Index for recent verifications
CREATE INDEX idx_parcel_verification_logs_lock_confirmed_at ON public.parcel_verification_logs(lock_confirmed_at DESC);

COMMENT ON TABLE public.parcel_verification_logs IS 'Audit trail for parcel selection verification gate - tracks user confirmations, geometry hashes, and verification metadata';