-- Add name and use_case columns to beta_signups table
ALTER TABLE public.beta_signups 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS use_case text;