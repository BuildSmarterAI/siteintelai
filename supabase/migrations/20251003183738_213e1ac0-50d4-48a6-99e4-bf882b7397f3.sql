-- Add MUD district and ETJ provider columns to applications table
ALTER TABLE applications
ADD COLUMN mud_district TEXT,
ADD COLUMN etj_provider TEXT;