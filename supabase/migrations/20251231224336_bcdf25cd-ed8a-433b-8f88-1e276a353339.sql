-- ============================================
-- Phase 2: Account-Based Billing Architecture
-- ============================================

-- 2.1 Create accounts table (workspace/org level)
CREATE TABLE public.accounts (
  account_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name text NOT NULL,
  primary_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- 2.2 Create stripe_customers table (links Stripe customer to account)
CREATE TABLE public.stripe_customers (
  stripe_customer_id text PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(account_id) ON DELETE CASCADE,
  billing_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

-- 2.3 Create subscriptions table (account-based, mirrors Stripe)
CREATE TABLE public.subscriptions (
  subscription_id text PRIMARY KEY,  -- Stripe subscription ID (sub_xxx)
  account_id uuid NOT NULL REFERENCES public.accounts(account_id) ON DELETE CASCADE,
  stripe_price_id text,
  tier text CHECK (tier IN ('starter', 'professional', 'team', 'enterprise', 'view_only')),
  status text CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 2.4 Add account_id to profiles for user→account mapping
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(account_id) ON DELETE SET NULL;

-- 2.5 Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stripe_customers_account ON public.stripe_customers(account_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_account ON public.subscriptions(account_id);
CREATE INDEX IF NOT EXISTS idx_profiles_account ON public.profiles(account_id);

-- ============================================
-- RLS Policies
-- ============================================

-- Accounts: Users can view their own account
CREATE POLICY "Users can view own account"
ON public.accounts FOR SELECT
USING (
  account_id IN (
    SELECT p.account_id FROM public.profiles p WHERE p.id = auth.uid()
  )
);

-- Accounts: Service role can manage all accounts
CREATE POLICY "Service role manages accounts"
ON public.accounts FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Accounts: Admins can view all accounts
CREATE POLICY "Admins can view all accounts"
ON public.accounts FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Stripe Customers: Users can view their account's Stripe customer
CREATE POLICY "Users can view own stripe customer"
ON public.stripe_customers FOR SELECT
USING (
  account_id IN (
    SELECT p.account_id FROM public.profiles p WHERE p.id = auth.uid()
  )
);

-- Stripe Customers: Service role can manage
CREATE POLICY "Service role manages stripe customers"
ON public.stripe_customers FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Subscriptions: Users can view their account's subscription
CREATE POLICY "Users can view own subscription"
ON public.subscriptions FOR SELECT
USING (
  account_id IN (
    SELECT p.account_id FROM public.profiles p WHERE p.id = auth.uid()
  )
);

-- Subscriptions: Service role can manage all subscriptions
CREATE POLICY "Service role manages subscriptions"
ON public.subscriptions FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Subscriptions: Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- Triggers for updated_at
-- ============================================

-- Accounts updated_at trigger
CREATE TRIGGER update_accounts_updated_at
BEFORE UPDATE ON public.accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Subscriptions updated_at trigger
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();