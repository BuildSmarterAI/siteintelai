-- Fix search_path on newly created functions
-- This addresses the Function Search Path Mutable warnings

-- Recreate is_account_member with proper search_path
CREATE OR REPLACE FUNCTION public.is_account_member(a uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.account_id = a
      AND p.id = auth.uid()
  );
$$;

-- Recreate is_account_admin with proper search_path
CREATE OR REPLACE FUNCTION public.is_account_admin(a uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.accounts acc ON acc.account_id = p.account_id
    WHERE p.account_id = a
      AND p.id = auth.uid()
      AND acc.primary_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
$$;