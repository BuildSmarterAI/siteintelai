-- Add enhanced SSURGO soil properties and NWI Cowardin classification columns
-- Migration: Enhanced Environmental Data Fields

-- SSURGO Enhanced Soil Properties
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS hydric_soil_rating text;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS flood_frequency_usda text;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS water_table_depth_cm numeric;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS bedrock_depth_cm numeric;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS ponding_frequency text;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS erosion_k_factor numeric;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS corrosion_concrete text;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS corrosion_steel text;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS septic_suitability text;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS building_site_rating text;

-- NWI Cowardin Classification
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS wetland_cowardin_code text;

-- Add comments for documentation
COMMENT ON COLUMN public.applications.hydric_soil_rating IS 'USDA SSURGO hydric soil rating (Yes/No/Partial) - indicates wetlands or flood-prone soils';
COMMENT ON COLUMN public.applications.flood_frequency_usda IS 'USDA SSURGO flooding frequency class (None/Rare/Occasional/Frequent)';
COMMENT ON COLUMN public.applications.water_table_depth_cm IS 'USDA SSURGO annual minimum depth to water table in centimeters';
COMMENT ON COLUMN public.applications.bedrock_depth_cm IS 'USDA SSURGO minimum depth to bedrock in centimeters';
COMMENT ON COLUMN public.applications.ponding_frequency IS 'USDA SSURGO ponding frequency class (None/Rare/Occasional/Frequent)';
COMMENT ON COLUMN public.applications.erosion_k_factor IS 'USDA SSURGO soil erodibility K-factor (0.0-0.69)';
COMMENT ON COLUMN public.applications.corrosion_concrete IS 'USDA SSURGO concrete corrosion potential (Low/Moderate/High)';
COMMENT ON COLUMN public.applications.corrosion_steel IS 'USDA SSURGO uncoated steel corrosion potential (Low/Moderate/High)';
COMMENT ON COLUMN public.applications.septic_suitability IS 'USDA SSURGO septic tank absorption field rating';
COMMENT ON COLUMN public.applications.building_site_rating IS 'USDA SSURGO dwellings with basements development rating';
COMMENT ON COLUMN public.applications.wetland_cowardin_code IS 'NWI Cowardin classification code (e.g., PFO1A = Palustrine Forested Broad-Leaved Deciduous)';