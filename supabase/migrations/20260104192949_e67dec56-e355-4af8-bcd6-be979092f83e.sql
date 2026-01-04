-- Update the CHECK constraint to allow new use types
ALTER TABLE public.design_templates 
  DROP CONSTRAINT IF EXISTS design_templates_use_type_check;

ALTER TABLE public.design_templates 
  ADD CONSTRAINT design_templates_use_type_check 
  CHECK (use_type IN ('industrial', 'multifamily', 'office', 'retail', 'medical', 'hotel', 'qsr', 'retail_strip'));

-- Insert QSR templates
INSERT INTO public.design_templates 
  (template_key, use_type, name, description, default_floors, floor_to_floor_ft, footprint_shape, footprint_area_target_sqft, width_depth_ratio, min_floors, max_floors, min_footprint_sqft, max_footprint_sqft, render_icon, sort_order, is_recommended_default) 
VALUES
  ('qsr_freestanding', 'qsr', 'Freestanding QSR', 'Drive-thru focused quick service restaurant with pad site format', 1, 15, 'pad', 3500, 1.2, 1, 1, 2000, 5000, 'UtensilsCrossed', 10, true),
  ('qsr_endcap', 'qsr', 'Endcap QSR', 'Quick service restaurant as endcap of retail strip', 1, 15, 'pad', 2800, 1.0, 1, 1, 1800, 4000, 'Coffee', 20, false);

-- Insert Retail Strip templates
INSERT INTO public.design_templates 
  (template_key, use_type, name, description, default_floors, floor_to_floor_ft, footprint_shape, footprint_area_target_sqft, width_depth_ratio, min_floors, max_floors, min_footprint_sqft, max_footprint_sqft, render_icon, sort_order, is_recommended_default) 
VALUES
  ('retail_strip_neighborhood', 'retail_strip', 'Neighborhood Strip', 'Frontage-focused neighborhood retail with inline tenants', 1, 16, 'bar', 15000, 6.0, 1, 2, 5000, 50000, 'Store', 10, true),
  ('retail_strip_shadow', 'retail_strip', 'Shadow-Anchored Strip', 'Retail strip in shadow of major anchor', 1, 16, 'bar', 25000, 5.0, 1, 2, 10000, 75000, 'ShoppingBag', 20, false);