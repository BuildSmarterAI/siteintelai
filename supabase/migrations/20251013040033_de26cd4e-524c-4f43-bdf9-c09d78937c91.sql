-- ============================================================================
-- SECURITY HARDENING MIGRATION (Corrected)
-- Phase 1: Clean up legacy test data with NULL user_id
-- Phase 2: Enforce user_id constraints and update RLS policies
-- ============================================================================

-- Phase 1: Delete legacy test data
-- Delete orphaned reports first (they may reference applications)
DELETE FROM reports WHERE user_id IS NULL;

-- Delete applications with NULL user_id (88 legacy records from September 2025)
DELETE FROM applications WHERE user_id IS NULL;

-- Phase 2.1: Enforce user_id constraints
-- Make user_id required on applications table
ALTER TABLE applications ALTER COLUMN user_id SET NOT NULL;

-- Make user_id required on reports table  
ALTER TABLE reports ALTER COLUMN user_id SET NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);

-- Phase 2.2: Remove problematic RLS policies that allowed anonymous access
DROP POLICY IF EXISTS "Anonymous users can insert applications" ON applications;
DROP POLICY IF EXISTS "Users can view anonymous applications" ON applications;
DROP POLICY IF EXISTS "Anyone can view anonymous reports" ON reports;
DROP POLICY IF EXISTS "Service role can view all reports" ON reports;
DROP POLICY IF EXISTS "Service role can insert anonymous reports" ON reports;

-- Phase 2.3: Add explicit admin policies for geospatial reference data
-- Lock down county boundaries to admin-only modifications
DROP POLICY IF EXISTS "Only admins can modify county boundaries" ON county_boundaries;
CREATE POLICY "Only admins can modify county boundaries" 
ON county_boundaries FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Lock down FEMA flood zones
DROP POLICY IF EXISTS "Only admins can modify flood zones" ON fema_flood_zones;
CREATE POLICY "Only admins can modify flood zones" 
ON fema_flood_zones FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Lock down TxDOT traffic segments
DROP POLICY IF EXISTS "Only admins can modify traffic segments" ON txdot_traffic_segments;
CREATE POLICY "Only admins can modify traffic segments" 
ON txdot_traffic_segments FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Note: v_parcels view security is enforced through the applications table RLS
-- Views inherit security from their base tables, so no additional policies needed