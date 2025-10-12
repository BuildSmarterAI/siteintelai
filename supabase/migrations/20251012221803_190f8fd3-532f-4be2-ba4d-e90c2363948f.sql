-- Phase 3D: Add Texas Property Classification fields to applications table

-- Add land_use_description column
ALTER TABLE public.applications 
ADD COLUMN land_use_description TEXT;

COMMENT ON COLUMN public.applications.land_use_description IS 'Human-readable description decoded from state_class and land_use_code (e.g., "Commercial Vacant Land - Neighborhood Section 1")';

-- Add property_category column
ALTER TABLE public.applications 
ADD COLUMN property_category TEXT;

COMMENT ON COLUMN public.applications.property_category IS 'Broad property classification decoded from state_class (e.g., "Commercial", "Residential", "Industrial")';

-- Add indexes for filtering and reporting
CREATE INDEX idx_applications_property_category ON public.applications(property_category);
CREATE INDEX idx_applications_land_use_description ON public.applications(land_use_description);