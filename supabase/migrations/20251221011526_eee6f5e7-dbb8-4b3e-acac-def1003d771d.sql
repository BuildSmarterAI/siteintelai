-- Add payment-first flow columns to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed'));
ALTER TABLE applications ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS stripe_customer_email TEXT;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_applications_payment_status ON applications(payment_status);
CREATE INDEX IF NOT EXISTS idx_applications_stripe_session_id ON applications(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_applications_stripe_customer_email ON applications(stripe_customer_email);

-- Allow nullable user_id for guest applications (payment-first flow)
-- Note: user_id already exists and is NOT NULL, we need to make it nullable for guest flow
ALTER TABLE applications ALTER COLUMN user_id DROP NOT NULL;