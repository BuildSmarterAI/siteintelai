-- Drop the conflicting function signature (numeric version)
DROP FUNCTION IF EXISTS public.get_demographics_for_point(NUMERIC, NUMERIC);

-- Keep only the double precision version which we just updated