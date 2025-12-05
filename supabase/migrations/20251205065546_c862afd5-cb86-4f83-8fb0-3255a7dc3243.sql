-- Fix security warnings: Set search_path on functions

-- Fix normalize_parcel_identifier function
CREATE OR REPLACE FUNCTION public.normalize_parcel_identifier(identifier TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT UPPER(REGEXP_REPLACE(identifier, '[^A-Za-z0-9]', '', 'g'))
$$;

-- Fix update_parcel_timestamp function
CREATE OR REPLACE FUNCTION public.update_parcel_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;