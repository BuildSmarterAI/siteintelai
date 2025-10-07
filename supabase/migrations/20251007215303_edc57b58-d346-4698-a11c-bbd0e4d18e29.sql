-- Temporarily disable the JSON schema validation check constraint
-- This allows reports to be saved even when AI doesn't return perfect JSON
ALTER TABLE public.reports 
DROP CONSTRAINT IF EXISTS chk_report_json_schema;