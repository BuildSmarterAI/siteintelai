-- PHASE 1: Fix Missing user_id on Applications (CRITICAL)
-- Add user_id column to applications table
ALTER TABLE public.applications 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_applications_user_id ON public.applications(user_id);

-- Update RLS policies for applications
DROP POLICY IF EXISTS "Allow authenticated users to update applications" ON public.applications;
DROP POLICY IF EXISTS "Allow authenticated users to view applications" ON public.applications;
DROP POLICY IF EXISTS "Allow public insert on applications" ON public.applications;

-- Create secure RLS policies
CREATE POLICY "Users can view own applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view anonymous applications"
  ON public.applications FOR SELECT
  TO anon
  USING (user_id IS NULL);

CREATE POLICY "Anonymous users can insert applications"
  ON public.applications FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Authenticated users can insert own applications"
  ON public.applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all applications"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- PHASE 2: Add Essential Indexes (Performance)
-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_reports_application_id ON public.reports(application_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier_id ON public.user_subscriptions(tier_id);
CREATE INDEX IF NOT EXISTS idx_credits_usage_user_id ON public.credits_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_usage_application_id ON public.credits_usage(application_id);

-- Query optimization indexes (skip if exists)
CREATE INDEX IF NOT EXISTS idx_applications_enrichment_status ON public.applications(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

-- Composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_reports_user_status_created 
  ON public.reports(user_id, status, created_at DESC);

-- PHASE 3: Data Consistency Fixes (Safety)
-- Make enrichment_status NOT NULL with safe default
ALTER TABLE public.applications 
  ALTER COLUMN enrichment_status SET DEFAULT 'pending';

UPDATE public.applications 
SET enrichment_status = 'pending' 
WHERE enrichment_status IS NULL;

ALTER TABLE public.applications 
  ALTER COLUMN enrichment_status SET NOT NULL;

-- Add check constraints for data quality
ALTER TABLE public.applications
  ADD CONSTRAINT chk_geo_coordinates 
  CHECK (
    (geo_lat IS NULL AND geo_lng IS NULL) OR 
    (geo_lat BETWEEN -90 AND 90 AND geo_lng BETWEEN -180 AND 180)
  );

-- Add validation for subscription status
ALTER TABLE public.user_subscriptions
  ADD CONSTRAINT chk_subscription_dates
  CHECK (period_end IS NULL OR period_end > period_start);