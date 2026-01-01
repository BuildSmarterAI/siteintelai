-- Create billing reconcile log table for audit trail
CREATE TABLE IF NOT EXISTS public.billing_reconcile_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL,
  account_id uuid REFERENCES public.accounts(account_id),
  stripe_customer_id text,
  action text NOT NULL, -- 'repair_tier', 'repair_status', 'set_grace', 'clear_grace', 'set_view_only', 'no_change', 'error'
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_billing_reconcile_log_run_id ON public.billing_reconcile_log(run_id);
CREATE INDEX IF NOT EXISTS idx_billing_reconcile_log_account_id ON public.billing_reconcile_log(account_id);
CREATE INDEX IF NOT EXISTS idx_billing_reconcile_log_created_at ON public.billing_reconcile_log(created_at);
CREATE INDEX IF NOT EXISTS idx_billing_reconcile_log_action ON public.billing_reconcile_log(action) WHERE action != 'no_change';

-- Add overage_allowed column to entitlements table
ALTER TABLE public.entitlements 
ADD COLUMN IF NOT EXISTS overage_allowed boolean DEFAULT false;

-- Enable RLS on billing_reconcile_log
ALTER TABLE public.billing_reconcile_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access billing reconcile logs (cron job uses service role)
CREATE POLICY "Service role can manage billing_reconcile_log"
ON public.billing_reconcile_log
FOR ALL
USING (false)
WITH CHECK (false);

-- Grant access via service role (RLS bypass)
COMMENT ON TABLE public.billing_reconcile_log IS 'Audit log for billing reconciliation runs - service role access only';