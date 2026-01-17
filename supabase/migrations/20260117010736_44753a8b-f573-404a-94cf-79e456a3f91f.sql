-- Create building_models table for storing 3D model metadata
CREATE TABLE public.building_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  archetype_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  style TEXT NOT NULL CHECK (style IN ('modern', 'traditional', 'industrial', 'mixed')),
  
  -- Model dimensions (baseline, before user scaling)
  base_width_ft NUMERIC NOT NULL,
  base_depth_ft NUMERIC NOT NULL,
  base_height_ft NUMERIC NOT NULL,
  base_stories INTEGER NOT NULL DEFAULT 1,
  
  -- Asset references
  glb_storage_path TEXT NOT NULL,
  thumbnail_url TEXT,
  preview_url TEXT,
  
  -- Metadata
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Scaling constraints
  min_scale NUMERIC DEFAULT 0.5,
  max_scale NUMERIC DEFAULT 2.0
);

-- Create design_variant_models table for tracking user model selections and transformations
CREATE TABLE public.design_variant_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID REFERENCES public.design_variants(id) ON DELETE CASCADE,
  model_id UUID REFERENCES public.building_models(id),
  
  -- User transformations
  scale_x NUMERIC DEFAULT 1.0,
  scale_y NUMERIC DEFAULT 1.0,
  scale_z NUMERIC DEFAULT 1.0,
  rotation_deg NUMERIC DEFAULT 0,
  offset_x_meters NUMERIC DEFAULT 0,
  offset_y_meters NUMERIC DEFAULT 0,
  
  -- Computed metrics after transformation
  final_footprint_sqft NUMERIC,
  final_height_ft NUMERIC,
  final_gfa NUMERIC,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(variant_id)
);

-- Enable RLS
ALTER TABLE public.building_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_variant_models ENABLE ROW LEVEL SECURITY;

-- RLS policies for building_models (public read, authenticated write for own models)
CREATE POLICY "Anyone can view public building models"
  ON public.building_models FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own models"
  ON public.building_models FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can create models"
  ON public.building_models FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own models"
  ON public.building_models FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own models"
  ON public.building_models FOR DELETE
  USING (auth.uid() = created_by);

-- RLS policies for design_variant_models
CREATE POLICY "Users can view their variant models"
  ON public.design_variant_models FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.design_variants v
      JOIN public.design_sessions s ON v.session_id = s.id
      WHERE v.id = design_variant_models.variant_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert variant models"
  ON public.design_variant_models FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.design_variants v
      JOIN public.design_sessions s ON v.session_id = s.id
      WHERE v.id = design_variant_models.variant_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their variant models"
  ON public.design_variant_models FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.design_variants v
      JOIN public.design_sessions s ON v.session_id = s.id
      WHERE v.id = design_variant_models.variant_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their variant models"
  ON public.design_variant_models FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.design_variants v
      JOIN public.design_sessions s ON v.session_id = s.id
      WHERE v.id = design_variant_models.variant_id
      AND s.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_building_models_archetype ON public.building_models(archetype_id);
CREATE INDEX idx_building_models_style ON public.building_models(style);
CREATE INDEX idx_building_models_public ON public.building_models(is_public) WHERE is_public = true;
CREATE INDEX idx_design_variant_models_variant ON public.design_variant_models(variant_id);

-- Create storage bucket for building models
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'building-models',
  'building-models',
  true,
  52428800, -- 50MB
  ARRAY['model/gltf-binary', 'model/gltf+json', 'image/png', 'image/jpeg', 'image/webp']
);

-- Storage policies
CREATE POLICY "Anyone can view building model files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'building-models');

CREATE POLICY "Authenticated users can upload building models"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'building-models' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own uploads"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'building-models' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own uploads"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'building-models' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Seed initial building models (using placeholder paths - actual GLB files would be uploaded separately)
INSERT INTO public.building_models (archetype_id, name, description, style, base_width_ft, base_depth_ft, base_height_ft, base_stories, glb_storage_path, is_public, is_featured) VALUES
-- Single-Story Retail Pad
('single-story-retail', 'Modern Glass Retail', 'Contemporary retail building with glass storefront', 'modern', 120, 80, 24, 1, 'templates/retail-modern.glb', true, true),
('single-story-retail', 'Traditional Brick Retail', 'Classic brick retail building with awning', 'traditional', 100, 70, 22, 1, 'templates/retail-traditional.glb', true, false),

-- Multi-Tenant Retail Strip
('multi-tenant-strip', 'Contemporary Strip Center', 'Modern multi-tenant strip with varied facades', 'modern', 200, 60, 24, 1, 'templates/strip-modern.glb', true, true),
('multi-tenant-strip', 'Classic Storefront Strip', 'Traditional storefront strip center', 'traditional', 180, 55, 22, 1, 'templates/strip-traditional.glb', true, false),

-- Medical Office Building
('medical-office', 'Modern Medical Office', 'Contemporary medical office with clean lines', 'modern', 100, 80, 48, 3, 'templates/medical-modern.glb', true, true),
('medical-office', 'Professional Medical Building', 'Traditional professional medical building', 'traditional', 90, 75, 44, 3, 'templates/medical-traditional.glb', true, false),

-- Industrial Warehouse
('industrial-warehouse', 'Clear-Span Warehouse', 'Modern high-bay distribution warehouse', 'industrial', 300, 200, 40, 1, 'templates/warehouse-modern.glb', true, true),
('industrial-warehouse', 'Flex Distribution Center', 'Flexible industrial distribution facility', 'industrial', 250, 180, 36, 1, 'templates/warehouse-flex.glb', true, false),

-- Low-Rise Multifamily
('low-rise-multifamily', 'Garden Apartments', 'Modern garden-style apartment complex', 'modern', 150, 50, 36, 3, 'templates/multifamily-garden.glb', true, true),
('low-rise-multifamily', 'Urban Townhomes', 'Contemporary urban townhome row', 'modern', 120, 40, 42, 3, 'templates/multifamily-townhome.glb', true, false),

-- Hotel / Hospitality
('hotel-hospitality', 'Select-Service Hotel', 'Modern select-service hotel tower', 'modern', 120, 80, 60, 5, 'templates/hotel-select.glb', true, true),
('hotel-hospitality', 'Boutique Inn', 'Charming boutique hotel design', 'traditional', 100, 70, 48, 4, 'templates/hotel-boutique.glb', true, false),

-- QSR / Drive-Thru
('qsr-drive-thru', 'Modern Fast-Casual', 'Contemporary fast-casual restaurant', 'modern', 60, 50, 20, 1, 'templates/qsr-modern.glb', true, true),
('qsr-drive-thru', 'Classic Drive-Thru', 'Traditional drive-thru restaurant design', 'traditional', 55, 45, 18, 1, 'templates/qsr-traditional.glb', true, false),

-- Flex / Light Mixed-Use
('flex-mixed-use', 'Tech Flex Building', 'Modern tech flex space with showroom', 'modern', 150, 100, 32, 2, 'templates/flex-tech.glb', true, true),
('flex-mixed-use', 'Showroom Hybrid', 'Mixed showroom and office hybrid', 'mixed', 140, 90, 30, 2, 'templates/flex-showroom.glb', true, false);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_building_models_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_building_models_timestamp
  BEFORE UPDATE ON public.building_models
  FOR EACH ROW
  EXECUTE FUNCTION update_building_models_updated_at();

CREATE TRIGGER update_design_variant_models_timestamp
  BEFORE UPDATE ON public.design_variant_models
  FOR EACH ROW
  EXECUTE FUNCTION update_building_models_updated_at();