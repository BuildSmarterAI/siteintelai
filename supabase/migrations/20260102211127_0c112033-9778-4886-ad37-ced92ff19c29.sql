-- =============================================================================
-- Survey Uploads Table & Storage Bucket
-- Phase 1: Read-only overlay mode for parcel selection visual confirmation
-- =============================================================================

-- Create survey_uploads table
CREATE TABLE public.survey_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  filename text NOT NULL,
  storage_path text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  
  -- Metadata extracted from file (optional)
  title text,
  recording_info text,
  surveyor_name text,
  survey_date date,
  county text,
  
  -- Calibration state (Phase 2)
  calibration_status text DEFAULT 'uncalibrated',
  control_points jsonb,
  transform_matrix jsonb,
  residual_error_meters numeric,
  
  -- Link to parcel selection
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  draft_id uuid REFERENCES public.applications_draft(draft_id) ON DELETE SET NULL,
  
  -- Confidence tracking
  geometry_confidence text DEFAULT 'low',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_calibration_status CHECK (calibration_status IN ('uncalibrated', 'calibrated', 'failed')),
  CONSTRAINT valid_geometry_confidence CHECK (geometry_confidence IN ('high', 'medium', 'low'))
);

-- Create indexes
CREATE INDEX idx_survey_uploads_user_id ON public.survey_uploads(user_id);
CREATE INDEX idx_survey_uploads_application_id ON public.survey_uploads(application_id);
CREATE INDEX idx_survey_uploads_draft_id ON public.survey_uploads(draft_id);

-- Enable RLS
ALTER TABLE public.survey_uploads ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can insert their own surveys"
  ON public.survey_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own surveys"
  ON public.survey_uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own surveys"
  ON public.survey_uploads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own surveys"
  ON public.survey_uploads FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for surveys
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'surveys', 
  'surveys', 
  false, 
  52428800,  -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/tiff']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Users can upload their own surveys"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'surveys' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own surveys"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'surveys' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own surveys"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'surveys' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Updated_at trigger
CREATE TRIGGER update_survey_uploads_updated_at
  BEFORE UPDATE ON public.survey_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();