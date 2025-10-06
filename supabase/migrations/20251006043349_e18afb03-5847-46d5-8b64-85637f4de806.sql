-- Create county_boundaries table
CREATE TABLE IF NOT EXISTS public.county_boundaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  county_name TEXT NOT NULL UNIQUE,
  geometry JSONB NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.county_boundaries ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to county boundaries"
ON public.county_boundaries
FOR SELECT
USING (true);

-- Create fema_flood_zones table
CREATE TABLE IF NOT EXISTS public.fema_flood_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fema_id TEXT NOT NULL UNIQUE,
  zone TEXT,
  geometry JSONB NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fema_flood_zones ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to fema flood zones"
ON public.fema_flood_zones
FOR SELECT
USING (true);

-- Create txdot_traffic_segments table
CREATE TABLE IF NOT EXISTS public.txdot_traffic_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  segment_id TEXT NOT NULL UNIQUE,
  aadt INTEGER,
  year INTEGER,
  roadway TEXT,
  geometry JSONB NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.txdot_traffic_segments ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to txdot traffic segments"
ON public.txdot_traffic_segments
FOR SELECT
USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_county_boundaries_county_name ON public.county_boundaries(county_name);
CREATE INDEX IF NOT EXISTS idx_fema_flood_zones_fema_id ON public.fema_flood_zones(fema_id);
CREATE INDEX IF NOT EXISTS idx_txdot_traffic_segments_segment_id ON public.txdot_traffic_segments(segment_id);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_county_boundaries_updated_at
BEFORE UPDATE ON public.county_boundaries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fema_flood_zones_updated_at
BEFORE UPDATE ON public.fema_flood_zones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_txdot_traffic_segments_updated_at
BEFORE UPDATE ON public.txdot_traffic_segments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();