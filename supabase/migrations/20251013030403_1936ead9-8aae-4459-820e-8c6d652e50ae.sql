-- Remove anonymous access policies that allow users to see all applications and reports
-- This fixes the security issue where logged-in users were seeing all data

-- Remove anonymous viewing policy from applications table
DROP POLICY IF EXISTS "Users can view anonymous applications" ON applications;

-- Remove anonymous insert policy from applications table
DROP POLICY IF EXISTS "Anonymous users can insert applications" ON applications;

-- Remove anonymous viewing policy from reports table
DROP POLICY IF EXISTS "Anyone can view anonymous reports" ON reports;