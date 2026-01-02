-- Create usage_monthly table for tracking monthly report usage per account
CREATE TABLE IF NOT EXISTS public.usage_monthly (
  account_id UUID NOT NULL REFERENCES public.accounts(account_id) ON DELETE CASCADE,
  yyyymm TEXT NOT NULL,
  reports_generated INTEGER NOT NULL DEFAULT 0,
  active_parcels_peak INTEGER NOT NULL DEFAULT 0,
  seats_peak INTEGER NOT NULL DEFAULT 0,
  overage_credits_used INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, yyyymm)
);

-- Enable RLS on usage_monthly
ALTER TABLE public.usage_monthly ENABLE ROW LEVEL SECURITY;

-- RLS policies for usage_monthly
CREATE POLICY "Users can view own usage" ON public.usage_monthly
  FOR SELECT USING (account_id IN (
    SELECT p.account_id FROM profiles p WHERE p.id = auth.uid()
  ));

CREATE POLICY "Service role can manage usage" ON public.usage_monthly
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view all usage" ON public.usage_monthly
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Create account_members table for team seat management
CREATE TABLE IF NOT EXISTS public.account_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(account_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, user_id)
);

-- Enable RLS on account_members
ALTER TABLE public.account_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for account_members
CREATE POLICY "Users can view own membership" ON public.account_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Account admins can manage members" ON public.account_members
  FOR ALL USING (
    account_id IN (
      SELECT am.account_id FROM account_members am 
      WHERE am.user_id = auth.uid() AND am.role = 'admin'
    )
  )
  WITH CHECK (
    account_id IN (
      SELECT am.account_id FROM account_members am 
      WHERE am.user_id = auth.uid() AND am.role = 'admin'
    )
  );

CREATE POLICY "Service role can manage members" ON public.account_members
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create helper functions for RLS
CREATE OR REPLACE FUNCTION public.is_account_member(a UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.account_members m
    WHERE m.account_id = a AND m.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_account_admin(a UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.account_members m
    WHERE m.account_id = a 
    AND m.user_id = auth.uid() 
    AND m.role = 'admin'
  );
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_monthly_account ON public.usage_monthly(account_id);
CREATE INDEX IF NOT EXISTS idx_usage_monthly_yyyymm ON public.usage_monthly(yyyymm);
CREATE INDEX IF NOT EXISTS idx_account_members_account ON public.account_members(account_id);
CREATE INDEX IF NOT EXISTS idx_account_members_user ON public.account_members(user_id);