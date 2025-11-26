-- Add stripe_price_id column to subscription_tiers table
ALTER TABLE public.subscription_tiers 
ADD COLUMN stripe_price_id text UNIQUE;

-- Update the Pro tier with correct pricing and Stripe configuration
UPDATE public.subscription_tiers 
SET 
  price_monthly = 1950.00,
  stripe_price_id = 'price_1SHcbzAsWVx52wY3noAgZVsf',
  api_access = true,
  description = '10 Professional Reports/month + unlimited QuickChecks + API access'
WHERE name = 'Pro';