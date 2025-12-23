-- Make user_id nullable for guest support
ALTER TABLE parcel_verification_logs ALTER COLUMN user_id DROP NOT NULL;

-- Add guest session tracking column
ALTER TABLE parcel_verification_logs ADD COLUMN guest_session_id text;

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can insert own verification logs" ON parcel_verification_logs;
DROP POLICY IF EXISTS "Users and guests can insert verification logs" ON parcel_verification_logs;

-- Create new policy that allows guest inserts (user_id null) or authenticated inserts
CREATE POLICY "Users and guests can insert verification logs" ON parcel_verification_logs
  FOR INSERT WITH CHECK (
    (auth.uid() = user_id) OR (user_id IS NULL)
  );