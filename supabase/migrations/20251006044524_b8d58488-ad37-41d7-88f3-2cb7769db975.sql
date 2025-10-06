-- Create feasibility_geospatial table for structured spatial intelligence
CREATE TABLE IF NOT EXISTS public.feasibility_geospatial (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parcel_id TEXT NOT NULL UNIQUE,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  location JSONB NOT NULL,
  county_boundary JSONB,
  fema_flood_risk JSONB,
  traffic_exposure JSONB,
  geospatial_score JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feasibility_geospatial ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to feasibility geospatial"
ON public.feasibility_geospatial
FOR SELECT
USING (true);

-- Allow authenticated insert/update
CREATE POLICY "Allow authenticated insert to feasibility geospatial"
ON public.feasibility_geospatial
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow authenticated update to feasibility geospatial"
ON public.feasibility_geospatial
FOR UPDATE
USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feasibility_geospatial_parcel_id ON public.feasibility_geospatial(parcel_id);
CREATE INDEX IF NOT EXISTS idx_feasibility_geospatial_application_id ON public.feasibility_geospatial(application_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_feasibility_geospatial_updated_at
BEFORE UPDATE ON public.feasibility_geospatial
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE public.feasibility_geospatial IS 'Structured spatial intelligence for parcels analyzed in BuildSmarter Feasibility reports';