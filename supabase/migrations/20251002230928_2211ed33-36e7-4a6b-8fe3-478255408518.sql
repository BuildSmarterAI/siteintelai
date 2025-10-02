-- Add fema_panel_id column to applications table for storing FEMA panel identifiers
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS fema_panel_id text;