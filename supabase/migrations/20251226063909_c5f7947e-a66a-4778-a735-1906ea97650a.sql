-- Add new soil properties columns
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS farmland_classification text,
ADD COLUMN IF NOT EXISTS soil_permeability_in_hr numeric,
ADD COLUMN IF NOT EXISTS available_water_capacity_in numeric;

-- Add comments for documentation
COMMENT ON COLUMN public.applications.farmland_classification IS 'USDA NRCS farmland classification (Prime farmland, Farmland of statewide importance, etc.)';
COMMENT ON COLUMN public.applications.soil_permeability_in_hr IS 'Saturated hydraulic conductivity (Ksat) in inches/hour from SSURGO';
COMMENT ON COLUMN public.applications.available_water_capacity_in IS 'Available water capacity in inches from SSURGO chorizon';