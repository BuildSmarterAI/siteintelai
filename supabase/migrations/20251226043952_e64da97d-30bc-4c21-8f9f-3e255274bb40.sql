-- =====================================================
-- CRITICAL & HIGH PRIORITY RLS SECURITY FIXES
-- =====================================================

-- =====================================================
-- 1. FIX: system_config - Currently allows everyone read/write
-- =====================================================
DROP POLICY IF EXISTS "system_config_select" ON public.system_config;
DROP POLICY IF EXISTS "system_config_insert" ON public.system_config;
DROP POLICY IF EXISTS "system_config_update" ON public.system_config;
DROP POLICY IF EXISTS "system_config_delete" ON public.system_config;

-- Only admins can read system config
CREATE POLICY "system_config_admin_select"
ON public.system_config FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert system config
CREATE POLICY "system_config_admin_insert"
ON public.system_config FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update system config
CREATE POLICY "system_config_admin_update"
ON public.system_config FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete system config
CREATE POLICY "system_config_admin_delete"
ON public.system_config FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Service role bypass for edge functions
CREATE POLICY "system_config_service_role"
ON public.system_config FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- 2. FIX: feasibility_geospatial - Open insert/update
-- =====================================================
DROP POLICY IF EXISTS "feasibility_geospatial_insert" ON public.feasibility_geospatial;
DROP POLICY IF EXISTS "feasibility_geospatial_update" ON public.feasibility_geospatial;
DROP POLICY IF EXISTS "Users can insert own feasibility_geospatial" ON public.feasibility_geospatial;
DROP POLICY IF EXISTS "Users can update own feasibility_geospatial" ON public.feasibility_geospatial;

-- Users can only insert records linked to their own applications
CREATE POLICY "feasibility_geospatial_user_insert"
ON public.feasibility_geospatial FOR INSERT
TO authenticated
WITH CHECK (
  application_id IN (
    SELECT id FROM public.applications WHERE user_id = auth.uid()
  )
);

-- Users can only update records linked to their own applications
CREATE POLICY "feasibility_geospatial_user_update"
ON public.feasibility_geospatial FOR UPDATE
TO authenticated
USING (
  application_id IN (
    SELECT id FROM public.applications WHERE user_id = auth.uid()
  )
);

-- Service role for edge functions
CREATE POLICY "feasibility_geospatial_service_role"
ON public.feasibility_geospatial FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- 3. FIX: tile_jobs - Internal table, admin/service only
-- =====================================================
DROP POLICY IF EXISTS "tile_jobs_service_role" ON public.tile_jobs;
DROP POLICY IF EXISTS "Service role full access to tile_jobs" ON public.tile_jobs;
DROP POLICY IF EXISTS "tile_jobs_user_select" ON public.tile_jobs;

-- Service role only for operations
CREATE POLICY "tile_jobs_service_role_only"
ON public.tile_jobs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Admins can read tile jobs for monitoring
CREATE POLICY "tile_jobs_admin_select"
ON public.tile_jobs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 4. FIX: risk_profiles - Service role policy open to public
-- =====================================================
DROP POLICY IF EXISTS "risk_profiles_service_role" ON public.risk_profiles;
DROP POLICY IF EXISTS "Service role full access to risk_profiles" ON public.risk_profiles;
DROP POLICY IF EXISTS "risk_profiles_user_select" ON public.risk_profiles;

-- Proper service role policy
CREATE POLICY "risk_profiles_service_role_only"
ON public.risk_profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Users can read risk profiles linked to their applications
CREATE POLICY "risk_profiles_user_select"
ON public.risk_profiles FOR SELECT
TO authenticated
USING (
  application_id IN (
    SELECT id FROM public.applications WHERE user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- =====================================================
-- 5. FIX: pipeline_phase_metrics - Service role policy open to public
-- =====================================================
DROP POLICY IF EXISTS "pipeline_phase_metrics_service_role" ON public.pipeline_phase_metrics;
DROP POLICY IF EXISTS "Service role full access to pipeline_phase_metrics" ON public.pipeline_phase_metrics;
DROP POLICY IF EXISTS "pipeline_phase_metrics_admin_select" ON public.pipeline_phase_metrics;

-- Proper service role policy
CREATE POLICY "pipeline_phase_metrics_service_role_only"
ON public.pipeline_phase_metrics FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Only admins can read pipeline metrics
CREATE POLICY "pipeline_phase_metrics_admin_select"
ON public.pipeline_phase_metrics FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 6. FIX: beta_signups - Uses insecure raw_user_meta_data check
-- =====================================================
DROP POLICY IF EXISTS "Admins can view signups" ON public.beta_signups;
DROP POLICY IF EXISTS "beta_signups_admin_select" ON public.beta_signups;
DROP POLICY IF EXISTS "beta_signups_admin_update" ON public.beta_signups;
DROP POLICY IF EXISTS "beta_signups_admin_view" ON public.beta_signups;

-- Secure admin check using has_role function
CREATE POLICY "beta_signups_admin_view"
ON public.beta_signups FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "beta_signups_admin_update"
ON public.beta_signups FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Keep insert open for public signups
DROP POLICY IF EXISTS "Anyone can sign up for beta" ON public.beta_signups;
DROP POLICY IF EXISTS "beta_signups_public_insert" ON public.beta_signups;
CREATE POLICY "beta_signups_public_insert"
ON public.beta_signups FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- =====================================================
-- 7. FIX: api_cache_universal - Overly permissive
-- =====================================================
DROP POLICY IF EXISTS "api_cache_universal_insert" ON public.api_cache_universal;
DROP POLICY IF EXISTS "api_cache_universal_select" ON public.api_cache_universal;
DROP POLICY IF EXISTS "api_cache_universal_update" ON public.api_cache_universal;
DROP POLICY IF EXISTS "api_cache_universal_service_role" ON public.api_cache_universal;
DROP POLICY IF EXISTS "api_cache_universal_admin_select" ON public.api_cache_universal;

-- Only service role can manage cache
CREATE POLICY "api_cache_universal_service_role"
ON public.api_cache_universal FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Admins can read cache for debugging
CREATE POLICY "api_cache_universal_admin_select"
ON public.api_cache_universal FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 8. FIX: api_cost_snapshots - Overly permissive
-- =====================================================
DROP POLICY IF EXISTS "api_cost_snapshots_insert" ON public.api_cost_snapshots;
DROP POLICY IF EXISTS "api_cost_snapshots_select" ON public.api_cost_snapshots;
DROP POLICY IF EXISTS "api_cost_snapshots_service_role" ON public.api_cost_snapshots;
DROP POLICY IF EXISTS "api_cost_snapshots_admin_select" ON public.api_cost_snapshots;

-- Only service role can manage cost snapshots
CREATE POLICY "api_cost_snapshots_service_role"
ON public.api_cost_snapshots FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Admins can read for analytics
CREATE POLICY "api_cost_snapshots_admin_select"
ON public.api_cost_snapshots FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 9. FIX: api_health_snapshots - Overly permissive
-- =====================================================
DROP POLICY IF EXISTS "api_health_snapshots_insert" ON public.api_health_snapshots;
DROP POLICY IF EXISTS "api_health_snapshots_select" ON public.api_health_snapshots;
DROP POLICY IF EXISTS "api_health_snapshots_service_role" ON public.api_health_snapshots;
DROP POLICY IF EXISTS "api_health_snapshots_admin_select" ON public.api_health_snapshots;

-- Only service role can manage health snapshots
CREATE POLICY "api_health_snapshots_service_role"
ON public.api_health_snapshots FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Admins can read for monitoring
CREATE POLICY "api_health_snapshots_admin_select"
ON public.api_health_snapshots FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));