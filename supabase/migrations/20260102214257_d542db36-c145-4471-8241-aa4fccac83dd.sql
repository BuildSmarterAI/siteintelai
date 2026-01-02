-- Add calibrated_bounds column to survey_uploads for storing georeferenced corners
ALTER TABLE public.survey_uploads
ADD COLUMN IF NOT EXISTS calibrated_bounds jsonb;