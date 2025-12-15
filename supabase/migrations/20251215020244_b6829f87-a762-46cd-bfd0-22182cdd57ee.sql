-- Add extended Census ACS demographic fields to applications table
-- These fields store housing market and employment data from Census ACS

ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS median_home_value numeric,
ADD COLUMN IF NOT EXISTS median_rent numeric,
ADD COLUMN IF NOT EXISTS vacancy_rate numeric,
ADD COLUMN IF NOT EXISTS unemployment_rate numeric,
ADD COLUMN IF NOT EXISTS median_age numeric,
ADD COLUMN IF NOT EXISTS college_attainment_pct numeric,
ADD COLUMN IF NOT EXISTS total_housing_units integer,
ADD COLUMN IF NOT EXISTS labor_force integer;

-- Add comments for documentation
COMMENT ON COLUMN public.applications.median_home_value IS 'Median home value from Census ACS B25077_001E';
COMMENT ON COLUMN public.applications.median_rent IS 'Median gross rent from Census ACS B25064_001E';
COMMENT ON COLUMN public.applications.vacancy_rate IS 'Housing vacancy rate percentage from Census ACS';
COMMENT ON COLUMN public.applications.unemployment_rate IS 'Unemployment rate percentage from Census ACS';
COMMENT ON COLUMN public.applications.median_age IS 'Median age of population from Census ACS B01002_001E';
COMMENT ON COLUMN public.applications.college_attainment_pct IS 'Percentage with bachelors degree from Census ACS';
COMMENT ON COLUMN public.applications.total_housing_units IS 'Total housing units from Census ACS';
COMMENT ON COLUMN public.applications.labor_force IS 'Labor force population from Census ACS B23025_002E';