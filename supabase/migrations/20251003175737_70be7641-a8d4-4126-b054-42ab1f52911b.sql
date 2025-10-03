-- Enable RLS on utility_endpoints table
ALTER TABLE utility_endpoints ENABLE ROW LEVEL SECURITY;

-- Allow public read access to utility endpoints (reference data)
CREATE POLICY "Allow public read access to utility endpoints"
ON utility_endpoints
FOR SELECT
USING (true);