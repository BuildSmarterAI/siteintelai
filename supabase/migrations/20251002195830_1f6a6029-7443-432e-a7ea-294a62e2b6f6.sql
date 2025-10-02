-- Add administrative_area_level_1 (state) and postal_code columns to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS administrative_area_level_1 text,
ADD COLUMN IF NOT EXISTS postal_code text;