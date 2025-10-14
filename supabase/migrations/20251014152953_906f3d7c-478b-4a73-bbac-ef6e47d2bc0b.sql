-- Enable RLS on api_logs table
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all API logs
CREATE POLICY "Admins can view all API logs"
ON api_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow system to insert logs (no user context needed for background jobs)
CREATE POLICY "System can insert API logs"
ON api_logs
FOR INSERT
WITH CHECK (true);