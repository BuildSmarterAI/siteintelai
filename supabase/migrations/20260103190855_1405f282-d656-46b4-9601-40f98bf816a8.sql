-- Create design_templates table for building type templates
CREATE TABLE public.design_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  use_type TEXT NOT NULL CHECK (use_type IN ('industrial', 'multifamily', 'office', 'retail', 'medical', 'hotel')),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Default assumptions
  default_floors INTEGER DEFAULT 1,
  floor_to_floor_ft NUMERIC DEFAULT 12,
  footprint_shape TEXT DEFAULT 'bar' CHECK (footprint_shape IN ('bar', 'L', 'courtyard', 'tower', 'pad')),
  footprint_area_target_sqft INTEGER,
  width_depth_ratio NUMERIC DEFAULT 2.5,
  
  -- Constraints
  min_floors INTEGER DEFAULT 1,
  max_floors INTEGER DEFAULT 10,
  min_footprint_sqft INTEGER DEFAULT 5000,
  max_footprint_sqft INTEGER DEFAULT 200000,
  
  -- UI
  render_icon TEXT DEFAULT 'Building2',
  sort_order INTEGER DEFAULT 100,
  is_recommended_default BOOLEAN DEFAULT false,
  
  -- Metadata
  version INTEGER DEFAULT 1,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.design_templates ENABLE ROW LEVEL SECURITY;

-- Templates are read-only for all authenticated users
CREATE POLICY "Templates are readable by authenticated users"
ON public.design_templates
FOR SELECT
TO authenticated
USING (true);

-- Create index for use_type lookups
CREATE INDEX idx_design_templates_use_type ON public.design_templates(use_type);

-- Seed default templates
INSERT INTO public.design_templates (template_key, use_type, name, description, default_floors, floor_to_floor_ft, footprint_shape, footprint_area_target_sqft, width_depth_ratio, min_floors, max_floors, min_footprint_sqft, max_footprint_sqft, render_icon, sort_order, is_recommended_default) VALUES
('industrial_warehouse_bar', 'industrial', 'Warehouse Bar', 'Single-story distribution center with clear height 28-32ft', 1, 32, 'bar', 80000, 3.0, 1, 2, 20000, 500000, 'Warehouse', 10, true),
('industrial_flex', 'industrial', 'Flex Industrial', 'Multi-tenant flex space with office component', 1, 24, 'bar', 40000, 4.0, 1, 2, 15000, 100000, 'Factory', 20, false),
('office_2story_shell', 'office', 'Office Shell (2-Story)', 'Professional services, medical office. Moderate coverage.', 2, 13, 'bar', 25000, 2.5, 1, 4, 10000, 60000, 'Building2', 10, true),
('office_midrise', 'office', 'Mid-Rise Office', 'Class A office tower, structured parking', 5, 13, 'tower', 18000, 1.8, 3, 8, 12000, 30000, 'Building', 20, false),
('multifamily_garden_3story', 'multifamily', 'Garden-Style 3-Story', 'Wood-frame garden apartments. Courtyard optional.', 3, 11, 'courtyard', 15000, 4.0, 2, 5, 8000, 40000, 'Home', 10, true),
('multifamily_wrap', 'multifamily', 'Wrap Apartments', 'Apartments wrapped around structured parking', 4, 11, 'courtyard', 20000, 3.0, 3, 6, 15000, 50000, 'Building2', 20, false),
('retail_strip', 'retail', 'Retail Strip Center', 'Frontage-focused neighborhood retail', 1, 16, 'bar', 12000, 6.0, 1, 2, 5000, 50000, 'Store', 10, true),
('retail_anchor', 'retail', 'Retail Anchor', 'Big-box anchor tenant with pad sites', 1, 24, 'pad', 45000, 2.0, 1, 1, 30000, 150000, 'ShoppingCart', 20, false),
('medical_clinic', 'medical', 'Medical Office Building', 'Outpatient clinic with structured parking consideration', 2, 12, 'bar', 18000, 2.0, 1, 5, 10000, 80000, 'Stethoscope', 10, true),
('medical_surgery_center', 'medical', 'Ambulatory Surgery Center', 'Outpatient surgical facility', 1, 14, 'bar', 25000, 2.5, 1, 3, 15000, 50000, 'Heart', 20, false),
('hotel_select_service', 'hotel', 'Select-Service Hotel', '4-5 story limited service hotel, tower format', 4, 10, 'tower', 12000, 1.5, 3, 8, 8000, 25000, 'Hotel', 10, true),
('hotel_extended_stay', 'hotel', 'Extended Stay Hotel', 'Long-term stay format with kitchenettes', 4, 10, 'bar', 15000, 3.0, 3, 6, 10000, 30000, 'BedDouble', 20, false);

-- Add trigger for updated_at
CREATE TRIGGER update_design_templates_updated_at
BEFORE UPDATE ON public.design_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();