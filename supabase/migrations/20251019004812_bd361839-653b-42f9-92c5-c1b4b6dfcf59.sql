-- Create beta_signups table
CREATE TABLE IF NOT EXISTS beta_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  company TEXT,
  interests TEXT[] NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invite_sent BOOLEAN DEFAULT FALSE,
  invite_sent_at TIMESTAMP WITH TIME ZONE,
  source TEXT DEFAULT 'beta_landing_page'
);

-- Enable Row Level Security
ALTER TABLE beta_signups ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for sign-ups)
CREATE POLICY "Allow anonymous beta signups" ON beta_signups
  FOR INSERT TO anon
  WITH CHECK (true);

-- Only authenticated admins can read
CREATE POLICY "Only admins can read beta signups" ON beta_signups
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_beta_signups_email ON beta_signups(email);
CREATE INDEX IF NOT EXISTS idx_beta_signups_submitted_at ON beta_signups(submitted_at DESC);