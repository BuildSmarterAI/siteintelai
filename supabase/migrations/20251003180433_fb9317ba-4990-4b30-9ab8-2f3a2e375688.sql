-- Set default for data_flags column
ALTER TABLE applications
ALTER COLUMN data_flags SET DEFAULT '[]'::jsonb;