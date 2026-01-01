-- =====================================================
-- RLS DENY POLICIES + REVENUE ANALYTICS TABLES
-- Per Billing Infrastructure Spec v1.0
-- =====================================================

-- ==========================
-- 1. RLS DENY POLICIES
-- Block client writes on billing-critical tables
-- Only service role (webhooks) can write
-- ==========================

-- ENTITLEMENTS: Block client writes
DROP POLICY IF EXISTS "no client inserts entitlements" ON public.entitlements;
CREATE POLICY "no client inserts entitlements"
ON public.entitlements
FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "no client updates entitlements" ON public.entitlements;
CREATE POLICY "no client updates entitlements"
ON public.entitlements
FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "no client deletes entitlements" ON public.entitlements;
CREATE POLICY "no client deletes entitlements"
ON public.entitlements
FOR DELETE
USING (false);

-- SUBSCRIPTIONS: Block client writes
DROP POLICY IF EXISTS "no client inserts subscriptions" ON public.subscriptions;
CREATE POLICY "no client inserts subscriptions"
ON public.subscriptions
FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "no client updates subscriptions" ON public.subscriptions;
CREATE POLICY "no client updates subscriptions"
ON public.subscriptions
FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "no client deletes subscriptions" ON public.subscriptions;
CREATE POLICY "no client deletes subscriptions"
ON public.subscriptions
FOR DELETE
USING (false);

-- USAGE_COUNTERS_MONTHLY: Block client writes
DROP POLICY IF EXISTS "no client inserts usage" ON public.usage_counters_monthly;
CREATE POLICY "no client inserts usage"
ON public.usage_counters_monthly
FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "no client updates usage" ON public.usage_counters_monthly;
CREATE POLICY "no client updates usage"
ON public.usage_counters_monthly
FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "no client deletes usage" ON public.usage_counters_monthly;
CREATE POLICY "no client deletes usage"
ON public.usage_counters_monthly
FOR DELETE
USING (false);

-- ==========================
-- 2. HELPER FUNCTIONS
-- For account membership checks
-- ==========================

-- is_account_member: Check if current user belongs to an account
CREATE OR REPLACE FUNCTION public.is_account_member(a uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.account_id = a
      AND p.id = auth.uid()
  );
$$;

-- is_account_admin: Check if current user is admin of an account
-- For now, the primary user (first linked) is considered admin
CREATE OR REPLACE FUNCTION public.is_account_admin(a uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
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

-- ==========================
-- 3. REVENUE ANALYTICS TABLES
-- MRR tracking, cohort analysis
-- ==========================

-- MRR Snapshots: End-of-month state for each account
CREATE TABLE IF NOT EXISTS public.mrr_snapshots_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts(account_id) ON DELETE SET NULL,
  yyyymm text NOT NULL,
  mrr numeric(10,2) NOT NULL DEFAULT 0,
  tier text,
  status text,
  is_churned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add unique constraint for account per month
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mrr_snapshots_monthly_account_period_key'
  ) THEN
    ALTER TABLE public.mrr_snapshots_monthly
    ADD CONSTRAINT mrr_snapshots_monthly_account_period_key UNIQUE (account_id, yyyymm);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.mrr_snapshots_monthly ENABLE ROW LEVEL SECURITY;

-- Only service role can write, admins with has_role can read
DROP POLICY IF EXISTS "service role all mrr_snapshots" ON public.mrr_snapshots_monthly;
CREATE POLICY "service role all mrr_snapshots"
ON public.mrr_snapshots_monthly
FOR ALL
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "admins can read mrr_snapshots" ON public.mrr_snapshots_monthly;
CREATE POLICY "admins can read mrr_snapshots"
ON public.mrr_snapshots_monthly
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- MRR Events: Movement tracking (new, upgrade, downgrade, churn, reactivation)
CREATE TABLE IF NOT EXISTS public.mrr_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts(account_id) ON DELETE SET NULL,
  event_time timestamptz DEFAULT now(),
  event_type text NOT NULL CHECK (event_type IN ('new', 'upgrade', 'downgrade', 'churn', 'reactivation')),
  delta_mrr numeric(10,2),
  from_tier text,
  to_tier text,
  stripe_event_id text,
  created_at timestamptz DEFAULT now()
);

-- Index for efficient cohort queries
CREATE INDEX IF NOT EXISTS idx_mrr_events_account_time ON public.mrr_events(account_id, event_time);
CREATE INDEX IF NOT EXISTS idx_mrr_events_type_time ON public.mrr_events(event_type, event_time);

-- Enable RLS
ALTER TABLE public.mrr_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role all mrr_events" ON public.mrr_events;
CREATE POLICY "service role all mrr_events"
ON public.mrr_events
FOR ALL
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "admins can read mrr_events" ON public.mrr_events;
CREATE POLICY "admins can read mrr_events"
ON public.mrr_events
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Cohorts: First paid subscription assignment
CREATE TABLE IF NOT EXISTS public.cohorts (
  account_id uuid PRIMARY KEY REFERENCES public.accounts(account_id) ON DELETE CASCADE,
  cohort_month_yyyymm text NOT NULL,
  initial_tier text,
  initial_mrr numeric(10,2),
  created_at timestamptz DEFAULT now()
);

-- Index for cohort analysis
CREATE INDEX IF NOT EXISTS idx_cohorts_month ON public.cohorts(cohort_month_yyyymm);

-- Enable RLS
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role all cohorts" ON public.cohorts;
CREATE POLICY "service role all cohorts"
ON public.cohorts
FOR ALL
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "admins can read cohorts" ON public.cohorts;
CREATE POLICY "admins can read cohorts"
ON public.cohorts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ==========================
-- 4. GRANT SERVICE ROLE ACCESS
-- Explicit grants for webhook operations
-- ==========================

GRANT ALL ON public.mrr_snapshots_monthly TO service_role;
GRANT ALL ON public.mrr_events TO service_role;
GRANT ALL ON public.cohorts TO service_role;