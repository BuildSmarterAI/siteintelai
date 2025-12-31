-- =============================================
-- SiteIntel™ Subscription Model Migration
-- Phase 2: Database Schema Updates (Fixed)
-- =============================================

-- 2.1 Add new columns to subscription_tiers table
ALTER TABLE public.subscription_tiers
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id_annual TEXT,
ADD COLUMN IF NOT EXISTS active_parcel_limit INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS seat_limit INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS history_retention_days INTEGER DEFAULT 90,
ADD COLUMN IF NOT EXISTS can_generate_lender_ready BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_share_links BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_export_csv BOOLEAN DEFAULT false;

-- Update existing Free tier
UPDATE public.subscription_tiers SET
  stripe_product_id = NULL,
  stripe_price_id = NULL,
  stripe_price_id_annual = NULL,
  price_monthly = 0,
  reports_per_month = 0,
  active_parcel_limit = 5,
  seat_limit = 1,
  history_retention_days = 30,
  can_generate_lender_ready = false,
  can_share_links = false,
  can_export_csv = false,
  api_access = false
WHERE name = 'Free';

-- Insert/Update Starter tier
INSERT INTO public.subscription_tiers (
  name, price_monthly, reports_per_month, quickchecks_unlimited, api_access, description,
  stripe_product_id, stripe_price_id, stripe_price_id_annual,
  active_parcel_limit, seat_limit, history_retention_days,
  can_generate_lender_ready, can_share_links, can_export_csv
) VALUES (
  'Starter', 299, 5, false, false, 'Kill bad deals fast. 5 reports/month, 10 active parcels.',
  'prod_ThxdnusS5qmyPL', 'price_1SkXihAsWVx52wY3Cvrbylf4', 'price_1SkXivAsWVx52wY3fjI3Rd4N',
  10, 1, 90, false, false, false
)
ON CONFLICT (name) DO UPDATE SET
  price_monthly = EXCLUDED.price_monthly,
  reports_per_month = EXCLUDED.reports_per_month,
  quickchecks_unlimited = EXCLUDED.quickchecks_unlimited,
  api_access = EXCLUDED.api_access,
  description = EXCLUDED.description,
  stripe_product_id = EXCLUDED.stripe_product_id,
  stripe_price_id = EXCLUDED.stripe_price_id,
  stripe_price_id_annual = EXCLUDED.stripe_price_id_annual,
  active_parcel_limit = EXCLUDED.active_parcel_limit,
  seat_limit = EXCLUDED.seat_limit,
  history_retention_days = EXCLUDED.history_retention_days,
  can_generate_lender_ready = EXCLUDED.can_generate_lender_ready,
  can_share_links = EXCLUDED.can_share_links,
  can_export_csv = EXCLUDED.can_export_csv;

-- Insert/Update Professional tier
INSERT INTO public.subscription_tiers (
  name, price_monthly, reports_per_month, quickchecks_unlimited, api_access, description,
  stripe_product_id, stripe_price_id, stripe_price_id_annual,
  active_parcel_limit, seat_limit, history_retention_days,
  can_generate_lender_ready, can_share_links, can_export_csv
) VALUES (
  'Professional', 749, 20, true, false, 'The fastest way to get to No — or to underwriting. 20 lender-ready reports/month.',
  'prod_ThxeNTJf0WkEMY', 'price_1SkXj9AsWVx52wY3cwZQSDzC', 'price_1SkXjJAsWVx52wY3sP3suBw5',
  50, 2, 365, true, true, false
)
ON CONFLICT (name) DO UPDATE SET
  price_monthly = EXCLUDED.price_monthly,
  reports_per_month = EXCLUDED.reports_per_month,
  quickchecks_unlimited = EXCLUDED.quickchecks_unlimited,
  api_access = EXCLUDED.api_access,
  description = EXCLUDED.description,
  stripe_product_id = EXCLUDED.stripe_product_id,
  stripe_price_id = EXCLUDED.stripe_price_id,
  stripe_price_id_annual = EXCLUDED.stripe_price_id_annual,
  active_parcel_limit = EXCLUDED.active_parcel_limit,
  seat_limit = EXCLUDED.seat_limit,
  history_retention_days = EXCLUDED.history_retention_days,
  can_generate_lender_ready = EXCLUDED.can_generate_lender_ready,
  can_share_links = EXCLUDED.can_share_links,
  can_export_csv = EXCLUDED.can_export_csv;

-- Insert/Update Team tier
INSERT INTO public.subscription_tiers (
  name, price_monthly, reports_per_month, quickchecks_unlimited, api_access, description,
  stripe_product_id, stripe_price_id, stripe_price_id_annual,
  active_parcel_limit, seat_limit, history_retention_days,
  can_generate_lender_ready, can_share_links, can_export_csv
) VALUES (
  'Team', 1950, 75, true, false, 'Standardize feasibility across your organization. 75 reports/month, priority support.',
  'prod_Thxe2I0rLintQ5', 'price_1SkXjXAsWVx52wY34Gdq3o2T', 'price_1SkXjlAsWVx52wY3q07DyaWp',
  150, 5, -1, true, true, true
)
ON CONFLICT (name) DO UPDATE SET
  price_monthly = EXCLUDED.price_monthly,
  reports_per_month = EXCLUDED.reports_per_month,
  quickchecks_unlimited = EXCLUDED.quickchecks_unlimited,
  api_access = EXCLUDED.api_access,
  description = EXCLUDED.description,
  stripe_product_id = EXCLUDED.stripe_product_id,
  stripe_price_id = EXCLUDED.stripe_price_id,
  stripe_price_id_annual = EXCLUDED.stripe_price_id_annual,
  active_parcel_limit = EXCLUDED.active_parcel_limit,
  seat_limit = EXCLUDED.seat_limit,
  history_retention_days = EXCLUDED.history_retention_days,
  can_generate_lender_ready = EXCLUDED.can_generate_lender_ready,
  can_share_links = EXCLUDED.can_share_links,
  can_export_csv = EXCLUDED.can_export_csv;

-- Insert/Update Enterprise tier
INSERT INTO public.subscription_tiers (
  name, price_monthly, reports_per_month, quickchecks_unlimited, api_access, description,
  stripe_product_id, stripe_price_id, stripe_price_id_annual,
  active_parcel_limit, seat_limit, history_retention_days,
  can_generate_lender_ready, can_share_links, can_export_csv
) VALUES (
  'Enterprise', 4500, 250, true, true, 'Feasibility as infrastructure. 250+ reports/month, API access, SSO, custom scoring.',
  'prod_ThxgIB1k6aP6XC', 'price_1SkXkxAsWVx52wY3ZfO3V03r', NULL,
  -1, 25, -1, true, true, true
)
ON CONFLICT (name) DO UPDATE SET
  price_monthly = EXCLUDED.price_monthly,
  reports_per_month = EXCLUDED.reports_per_month,
  quickchecks_unlimited = EXCLUDED.quickchecks_unlimited,
  api_access = EXCLUDED.api_access,
  description = EXCLUDED.description,
  stripe_product_id = EXCLUDED.stripe_product_id,
  stripe_price_id = EXCLUDED.stripe_price_id,
  stripe_price_id_annual = EXCLUDED.stripe_price_id_annual,
  active_parcel_limit = EXCLUDED.active_parcel_limit,
  seat_limit = EXCLUDED.seat_limit,
  history_retention_days = EXCLUDED.history_retention_days,
  can_generate_lender_ready = EXCLUDED.can_generate_lender_ready,
  can_share_links = EXCLUDED.can_share_links,
  can_export_csv = EXCLUDED.can_export_csv;

-- Remove old Pro tier if it exists
DELETE FROM public.subscription_tiers WHERE name = 'Pro';

-- 2.2 Create entitlements table for computed entitlements per user
CREATE TABLE IF NOT EXISTS public.entitlements (
  account_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free',
  included_reports_monthly INTEGER DEFAULT 0,
  report_overage_allowed BOOLEAN DEFAULT false,
  active_parcel_limit INTEGER DEFAULT 10,
  seat_limit INTEGER DEFAULT 1,
  history_retention_days INTEGER DEFAULT 90,
  can_generate_lender_ready BOOLEAN DEFAULT false,
  can_share_links BOOLEAN DEFAULT false,
  can_export_csv BOOLEAN DEFAULT false,
  can_use_api BOOLEAN DEFAULT false,
  grace_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on entitlements
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

-- RLS policies for entitlements
CREATE POLICY "Users can view own entitlements"
  ON public.entitlements FOR SELECT
  USING (auth.uid() = account_id);

CREATE POLICY "Service role can manage entitlements"
  ON public.entitlements FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view all entitlements"
  ON public.entitlements FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2.3 Create usage_counters_monthly table for tracking usage per period
CREATE TABLE IF NOT EXISTS public.usage_counters_monthly (
  account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_yyyymm TEXT NOT NULL,
  reports_generated INTEGER DEFAULT 0,
  active_parcels_peak INTEGER DEFAULT 0,
  seats_active_peak INTEGER DEFAULT 0,
  overage_credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (account_id, period_yyyymm)
);

-- Enable RLS on usage_counters_monthly
ALTER TABLE public.usage_counters_monthly ENABLE ROW LEVEL SECURITY;

-- RLS policies for usage_counters_monthly
CREATE POLICY "Users can view own usage"
  ON public.usage_counters_monthly FOR SELECT
  USING (auth.uid() = account_id);

CREATE POLICY "Service role can manage usage counters"
  ON public.usage_counters_monthly FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view all usage"
  ON public.usage_counters_monthly FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2.4 Create billing_events_log table for webhook audit trail
CREATE TABLE IF NOT EXISTS public.billing_events_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  received_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  account_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payload JSONB,
  status TEXT DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on billing_events_log
ALTER TABLE public.billing_events_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for billing_events_log
CREATE POLICY "Service role can manage billing events"
  ON public.billing_events_log FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view billing events"
  ON public.billing_events_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_billing_events_stripe_id ON public.billing_events_log(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_account ON public.billing_events_log(account_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_type ON public.billing_events_log(event_type);

-- 2.5 Add new columns to user_subscriptions table
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
ADD COLUMN IF NOT EXISTS active_parcels_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS purchased_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credit_expires_at TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_entitlements_tier ON public.entitlements(tier);
CREATE INDEX IF NOT EXISTS idx_usage_counters_period ON public.usage_counters_monthly(period_yyyymm);

-- Create trigger to update updated_at on entitlements
CREATE OR REPLACE FUNCTION public.update_entitlements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_entitlements_timestamp ON public.entitlements;
CREATE TRIGGER update_entitlements_timestamp
  BEFORE UPDATE ON public.entitlements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_entitlements_updated_at();

-- Create trigger to update updated_at on usage_counters_monthly
DROP TRIGGER IF EXISTS update_usage_counters_timestamp ON public.usage_counters_monthly;
CREATE TRIGGER update_usage_counters_timestamp
  BEFORE UPDATE ON public.usage_counters_monthly
  FOR EACH ROW
  EXECUTE FUNCTION public.update_entitlements_updated_at();