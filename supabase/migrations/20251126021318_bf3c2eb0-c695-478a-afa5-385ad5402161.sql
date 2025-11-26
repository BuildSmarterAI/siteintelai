-- Add payment_history table
CREATE TABLE public.payment_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  stripe_session_id text,
  stripe_payment_intent_id text,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending',
  payment_type text NOT NULL, -- 'one_time' or 'subscription'
  product_name text,
  receipt_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add stripe_customer_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Add stripe_subscription_id to user_subscriptions
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Enable RLS on payment_history
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment history
CREATE POLICY "Users can view own payment history" 
ON public.payment_history 
FOR SELECT 
USING (auth.uid() = user_id);

-- Service role can insert/update payment history (for webhooks)
CREATE POLICY "Service role can manage payment history" 
ON public.payment_history 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX idx_payment_history_stripe_session ON public.payment_history(stripe_session_id);
CREATE INDEX idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);
CREATE INDEX idx_user_subscriptions_stripe ON public.user_subscriptions(stripe_subscription_id);