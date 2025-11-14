-- =====================================================
-- RLS Security Migration: Enable Row-Level Security
-- on all public tables with user isolation & admin access
-- =====================================================

-- ============================================================
-- 1. APPLICATIONS TABLE
-- ============================================================
alter table public.applications enable row level security;

-- Users can only see their own applications
create policy "Users can view their own applications"
  on public.applications
  for select
  using (auth.uid() = user_id);

-- Users can insert their own applications
create policy "Users can create their own applications"
  on public.applications
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own applications
create policy "Users can update their own applications"
  on public.applications
  for update
  using (auth.uid() = user_id);

-- Users can delete their own applications
create policy "Users can delete their own applications"
  on public.applications
  for delete
  using (auth.uid() = user_id);

-- Admins can view all applications
create policy "Admins can view all applications"
  on public.applications
  for select
  using (public.has_role(auth.uid(), 'admin'));

-- Admins can update all applications
create policy "Admins can update all applications"
  on public.applications
  for update
  using (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 2. REPORTS TABLE
-- ============================================================
alter table public.reports enable row level security;

-- Users can only see their own reports
create policy "Users can view their own reports"
  on public.reports
  for select
  using (auth.uid() = user_id);

-- Users can insert their own reports
create policy "Users can create their own reports"
  on public.reports
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own reports
create policy "Users can update their own reports"
  on public.reports
  for update
  using (auth.uid() = user_id);

-- Admins can view all reports
create policy "Admins can view all reports"
  on public.reports
  for select
  using (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 3. DRAWN_PARCELS TABLE
-- ============================================================
alter table public.drawn_parcels enable row level security;

-- Users can only see their own drawn parcels
create policy "Users can view their own drawn parcels"
  on public.drawn_parcels
  for select
  using (auth.uid() = user_id);

-- Users can insert their own drawn parcels
create policy "Users can create their own drawn parcels"
  on public.drawn_parcels
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own drawn parcels
create policy "Users can update their own drawn parcels"
  on public.drawn_parcels
  for update
  using (auth.uid() = user_id);

-- Users can delete their own drawn parcels
create policy "Users can delete their own drawn parcels"
  on public.drawn_parcels
  for delete
  using (auth.uid() = user_id);

-- Admins can view all drawn parcels
create policy "Admins can view all drawn parcels"
  on public.drawn_parcels
  for select
  using (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 4. CREDITS_USAGE TABLE
-- ============================================================
alter table public.credits_usage enable row level security;

-- Users can only view their own credit usage
create policy "Users can view their own credit usage"
  on public.credits_usage
  for select
  using (auth.uid() = user_id);

-- Service role can insert credit usage records
create policy "Service role can insert credit usage"
  on public.credits_usage
  for insert
  with check (auth.role() = 'service_role');

-- Admins can view all credit usage
create policy "Admins can view all credit usage"
  on public.credits_usage
  for select
  using (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 5. PROFILES TABLE
-- ============================================================
alter table public.profiles enable row level security;

-- Users can view their own profile
create policy "Users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Admins can view all profiles
create policy "Admins can view all profiles"
  on public.profiles
  for select
  using (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 6. USER_SUBSCRIPTIONS TABLE
-- ============================================================
alter table public.user_subscriptions enable row level security;

-- Users can view their own subscriptions
create policy "Users can view their own subscriptions"
  on public.user_subscriptions
  for select
  using (auth.uid() = user_id);

-- Service role can manage subscriptions
create policy "Service role can manage subscriptions"
  on public.user_subscriptions
  for all
  using (auth.role() = 'service_role');

-- Admins can view all subscriptions
create policy "Admins can view all subscriptions"
  on public.user_subscriptions
  for select
  using (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 7. USER_ONBOARDING TABLE
-- ============================================================
alter table public.user_onboarding enable row level security;

-- Users can view their own onboarding
create policy "Users can view their own onboarding"
  on public.user_onboarding
  for select
  using (auth.uid() = user_id);

-- Users can update their own onboarding
create policy "Users can update their own onboarding"
  on public.user_onboarding
  for update
  using (auth.uid() = user_id);

-- Users can insert their own onboarding
create policy "Users can insert their own onboarding"
  on public.user_onboarding
  for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- 8. API_LOGS TABLE
-- ============================================================
alter table public.api_logs enable row level security;

-- Users can view logs for their own applications
create policy "Users can view their own api logs"
  on public.api_logs
  for select
  using (
    exists (
      select 1 from public.applications
      where applications.id = api_logs.application_id
      and applications.user_id = auth.uid()
    )
  );

-- Service role can insert logs
create policy "Service role can insert api logs"
  on public.api_logs
  for insert
  with check (auth.role() = 'service_role');

-- Admins can view all logs
create policy "Admins can view all api logs"
  on public.api_logs
  for select
  using (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 9. JOBS_ENRICHMENT TABLE
-- ============================================================
alter table public.jobs_enrichment enable row level security;

-- Users can view jobs for their own applications
create policy "Users can view their own enrichment jobs"
  on public.jobs_enrichment
  for select
  using (
    exists (
      select 1 from public.applications
      where applications.id = jobs_enrichment.application_id
      and applications.user_id = auth.uid()
    )
  );

-- Service role can manage jobs
create policy "Service role can manage enrichment jobs"
  on public.jobs_enrichment
  for all
  using (auth.role() = 'service_role');

-- Admins can view all jobs
create policy "Admins can view all enrichment jobs"
  on public.jobs_enrichment
  for select
  using (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 10. FEASIBILITY_GEOSPATIAL TABLE
-- ============================================================
alter table public.feasibility_geospatial enable row level security;

-- Users can view geospatial data for their own applications
create policy "Users can view their own geospatial data"
  on public.feasibility_geospatial
  for select
  using (
    exists (
      select 1 from public.applications
      where applications.id = feasibility_geospatial.application_id
      and applications.user_id = auth.uid()
    )
  );

-- Service role can manage geospatial data
create policy "Service role can manage geospatial data"
  on public.feasibility_geospatial
  for all
  using (auth.role() = 'service_role');

-- Admins can view all geospatial data
create policy "Admins can view all geospatial data"
  on public.feasibility_geospatial
  for select
  using (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 11. VISUALIZATION_CACHE_3D TABLE
-- ============================================================
alter table public.visualization_cache_3d enable row level security;

-- Users can view 3D cache for their own applications
create policy "Users can view their own 3D visualizations"
  on public.visualization_cache_3d
  for select
  using (
    exists (
      select 1 from public.applications
      where applications.id = visualization_cache_3d.application_id
      and applications.user_id = auth.uid()
    )
  );

-- Service role can manage 3D cache
create policy "Service role can manage 3D visualizations"
  on public.visualization_cache_3d
  for all
  using (auth.role() = 'service_role');

-- ============================================================
-- 12. READ-ONLY PUBLIC TABLES (Reference Data)
-- ============================================================

-- SUBSCRIPTION_TIERS: Public read access
alter table public.subscription_tiers enable row level security;
create policy "Anyone can view subscription tiers"
  on public.subscription_tiers
  for select
  using (true);

-- COST_SCHEDULE_DATA: Public read access
alter table public.cost_schedule_data enable row level security;
create policy "Authenticated users can view cost schedule data"
  on public.cost_schedule_data
  for select
  using (auth.role() = 'authenticated');

-- COUNTY_BOUNDARIES: Public read access
alter table public.county_boundaries enable row level security;
create policy "Authenticated users can view county boundaries"
  on public.county_boundaries
  for select
  using (auth.role() = 'authenticated');

-- FEMA_FLOOD_ZONES: Public read access
alter table public.fema_flood_zones enable row level security;
create policy "Authenticated users can view flood zones"
  on public.fema_flood_zones
  for select
  using (auth.role() = 'authenticated');

-- TXDOT_TRAFFIC_SEGMENTS: Public read access
alter table public.txdot_traffic_segments enable row level security;
create policy "Authenticated users can view traffic segments"
  on public.txdot_traffic_segments
  for select
  using (auth.role() = 'authenticated');

-- UTILITY_ENDPOINTS: Public read access
alter table public.utility_endpoints enable row level security;
create policy "Authenticated users can view utility endpoints"
  on public.utility_endpoints
  for select
  using (auth.role() = 'authenticated');

-- ============================================================
-- 13. FEATURE_FLAGS & ERROR_REGISTRY (Admin-Only)
-- ============================================================

-- FEATURE_FLAGS: Admin read, service role write
alter table public.feature_flags enable row level security;
create policy "Admins can view feature flags"
  on public.feature_flags
  for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Service role can manage feature flags"
  on public.feature_flags
  for all
  using (auth.role() = 'service_role');

-- ERROR_REGISTRY: Admin read, service role write
alter table public.error_registry enable row level security;
create policy "Admins can view error registry"
  on public.error_registry
  for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Service role can manage error registry"
  on public.error_registry
  for all
  using (auth.role() = 'service_role');

-- ============================================================
-- 14. BETA_SIGNUPS (Admin-Only)
-- ============================================================
alter table public.beta_signups enable row level security;

-- Public can insert signups
create policy "Anyone can submit beta signups"
  on public.beta_signups
  for insert
  with check (true);

-- Admins can view all signups
create policy "Admins can view beta signups"
  on public.beta_signups
  for select
  using (public.has_role(auth.uid(), 'admin'));

-- Admins can update signups
create policy "Admins can update beta signups"
  on public.beta_signups
  for update
  using (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- COMMENT: Tables already secured in previous migrations
-- =====================================================
-- tx_mixed_beverage_activity: RLS enabled in 001_init_tx_beverage.sql
-- hii_alerts: RLS enabled in 003_hii_alerts.sql
-- hii_watchlist: RLS enabled in 003_hii_alerts.sql
-- user_roles: RLS enabled during role system setup
-- spatial_ref_sys: PostGIS system table, RLS not applicable

comment on table public.applications is 'User application data - RLS enforced with user isolation and admin access';
comment on table public.reports is 'User reports - RLS enforced with user isolation and admin access';
comment on table public.drawn_parcels is 'User-drawn parcels - RLS enforced with user isolation';
comment on table public.profiles is 'User profiles - RLS enforced with user isolation';
