-- Add USDA SSURGO Shrink-Swell Potential columns
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS shrink_swell_potential text,
ADD COLUMN IF NOT EXISTS linear_extensibility_pct numeric;

-- Add USGS Groundwater API columns
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS groundwater_depth_ft numeric,
ADD COLUMN IF NOT EXISTS groundwater_well_distance_ft numeric,
ADD COLUMN IF NOT EXISTS groundwater_measurement_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS nearest_groundwater_well_id text;

-- Add comments for documentation
COMMENT ON COLUMN public.applications.shrink_swell_potential IS 'USDA SSURGO shrink-swell potential rating (Low/Moderate/High) - indicates foundation risk';
COMMENT ON COLUMN public.applications.linear_extensibility_pct IS 'USDA SSURGO linear extensibility percentage (LEP) - clay shrink-swell measure';
COMMENT ON COLUMN public.applications.groundwater_depth_ft IS 'USGS Groundwater API - depth to water table in feet from nearest well';
COMMENT ON COLUMN public.applications.groundwater_well_distance_ft IS 'USGS Groundwater API - distance to nearest monitoring well in feet';
COMMENT ON COLUMN public.applications.groundwater_measurement_date IS 'USGS Groundwater API - date of most recent water level measurement';
COMMENT ON COLUMN public.applications.nearest_groundwater_well_id IS 'USGS Groundwater API - USGS site number of nearest monitoring well';