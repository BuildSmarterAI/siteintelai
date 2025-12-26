-- Add service role access and anonymous insert for guest applications

-- Service role full access for edge functions
DROP POLICY IF EXISTS "Service role has full access to applications" ON public.applications;
CREATE POLICY "Service role has full access to applications"
ON public.applications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow anonymous users to insert (for guest applications before auth)
DROP POLICY IF EXISTS "Anonymous can insert guest applications" ON public.applications;
CREATE POLICY "Anonymous can insert guest applications"
ON public.applications
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);