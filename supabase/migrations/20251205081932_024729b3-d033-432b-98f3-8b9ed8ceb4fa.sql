-- Create kill_factors table for lender customization
CREATE TABLE IF NOT EXISTS public.kill_factors (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  threshold NUMERIC,
  category TEXT NOT NULL,
  severity TEXT DEFAULT 'critical',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kill_factors ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read kill factors
CREATE POLICY "Anyone can read kill factors"
  ON public.kill_factors FOR SELECT
  USING (true);

-- Only admins can modify kill factors
CREATE POLICY "Admins can modify kill factors"
  ON public.kill_factors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create index
CREATE INDEX idx_kill_factors_category ON public.kill_factors(category);

-- Seed default kill factors
INSERT INTO public.kill_factors (code, description, threshold, category, severity) VALUES
  ('FLOODWAY', 'Parcel intersects FEMA floodway', NULL, 'flood', 'critical'),
  ('WETLAND_50', 'Wetlands cover >50% of parcel', 0.5, 'environmental', 'critical'),
  ('NO_UTILITIES', 'No public water/sewer within 1000ft', 1000, 'utilities', 'high'),
  ('STEEP_SLOPE', 'More than 30% of parcel has slope >15%', 0.3, 'topography', 'high'),
  ('CONTAMINATION', 'EPA facility with violations within 0.5mi', 0.5, 'environmental', 'critical'),
  ('FLOOD_ZONE_AE', 'Parcel in Special Flood Hazard Area AE', NULL, 'flood', 'high'),
  ('NO_SEWER', 'No sewer service available within 1500ft', 1500, 'utilities', 'medium'),
  ('HIGH_TRAFFIC', 'AADT exceeds 50000 vehicles/day', 50000, 'traffic', 'medium')
ON CONFLICT (code) DO NOTHING;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_kill_factors_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kill_factors_updated_at
  BEFORE UPDATE ON public.kill_factors
  FOR EACH ROW
  EXECUTE FUNCTION update_kill_factors_timestamp();