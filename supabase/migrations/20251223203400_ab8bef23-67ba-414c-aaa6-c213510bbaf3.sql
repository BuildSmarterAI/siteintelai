-- Add tax_amount_cents column to payment_history for Stripe Tax tracking
ALTER TABLE public.payment_history 
ADD COLUMN IF NOT EXISTS tax_amount_cents integer;

COMMENT ON COLUMN public.payment_history.tax_amount_cents IS 'Tax amount in cents collected via Stripe Tax';