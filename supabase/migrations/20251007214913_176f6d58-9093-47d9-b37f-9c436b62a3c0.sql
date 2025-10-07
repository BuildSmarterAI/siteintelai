-- Make user_id nullable in reports table
ALTER TABLE public.reports 
ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can insert own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;

-- Create new RLS policies that support both authenticated and anonymous reports
CREATE POLICY "Authenticated users can insert own reports"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert anonymous reports"
ON public.reports
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Authenticated users can view own reports"
ON public.reports
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view anonymous reports"
ON public.reports
FOR SELECT
TO anon, authenticated
USING (user_id IS NULL);

CREATE POLICY "Service role can view all reports"
ON public.reports
FOR SELECT
TO service_role
USING (true);