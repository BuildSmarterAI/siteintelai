-- ============================================================
-- Migration: Sprint Task Tracking Table + Security Function Fixes
-- Purpose: Enable executive dashboard for sprint progress monitoring
--          AND fix SECURITY DEFINER functions missing search_path
-- Date: 2026-01-23
-- ============================================================

-- Create the sprint_tasks table
CREATE TABLE IF NOT EXISTS public.sprint_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_number integer NOT NULL,
  task_id text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  complexity text CHECK (complexity IN ('XS', 'S', 'M', 'L', 'XL')),
  estimated_hours numeric,
  actual_hours numeric,
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'blocked', 'complete', 'skipped')),
  owner text,
  files_involved text[],
  notes text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sprint_tasks ENABLE ROW LEVEL SECURITY;

-- Admin-only read access
CREATE POLICY "Admins can view sprint tasks"
ON public.sprint_tasks
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admin-only write access  
CREATE POLICY "Admins can manage sprint tasks"
ON public.sprint_tasks
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_sprint_tasks_updated_at
  BEFORE UPDATE ON public.sprint_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Table comment
COMMENT ON TABLE public.sprint_tasks IS 'Tracks sprint tasks for production readiness roadmap';

-- ============================================================
-- Seed Sprint 1 Tasks (Security Hardening)
-- ============================================================
INSERT INTO public.sprint_tasks (sprint_number, task_id, title, description, complexity, estimated_hours, status, notes) VALUES
(1, 'S1-01', 'Identify RLS-disabled table', 'Find and enable RLS on tables flagged by linter', 'XS', 0.5, 'complete', 'spatial_ref_sys is PostGIS system table - not user data, false positive'),
(1, 'S1-02', 'Add rate limiting to generate-quick-check', 'Implement IP-based rate limiting on public endpoints', 'M', 4, 'complete', 'Already implemented: 10 req/min/IP using api_cache_universal'),
(1, 'S1-03', 'Fix search_path on SECURITY DEFINER functions', 'Add SET search_path = public to user-defined functions', 'S', 2, 'in_progress', NULL),
(1, 'S1-04', 'Remove console.log statements', 'Replace 367 console.log with logger utility, add ESLint rule', 'S', 3, 'in_progress', NULL),
(1, 'S1-05', 'Fix Google Maps API referrer restrictions', 'Add *.supabase.co/* to allowed referrers in Google Cloud Console', 'XS', 1, 'todo', 'Manual action required in Google Cloud Console'),
(1, 'S1-06', 'Add ESLint pre-commit hook', 'Configure husky + lint-staged for pre-commit linting', 'S', 2, 'todo', NULL);

-- ============================================================
-- Seed Sprint 2 Tasks (Testing Foundation)
-- ============================================================
INSERT INTO public.sprint_tasks (sprint_number, task_id, title, description, complexity, estimated_hours, status) VALUES
(2, 'S2-01', 'Configure Vitest + React Testing Library', 'Set up unit testing framework', 'M', 4, 'todo'),
(2, 'S2-02', 'Write stripe-webhook test suite', 'Achieve >80% coverage on payment webhook handler', 'L', 8, 'todo'),
(2, 'S2-03', 'Set up Playwright E2E framework', 'Configure end-to-end testing infrastructure', 'M', 4, 'todo'),
(2, 'S2-04', 'Create checkout flow E2E test', 'Test complete address to payment confirmation flow', 'L', 8, 'todo'),
(2, 'S2-05', 'Integrate Sentry error tracking', 'Add production error monitoring with source maps', 'M', 4, 'todo'),
(2, 'S2-06', 'Configure payment failure alerts', 'Set up Slack notifications for payment errors', 'S', 3, 'todo'),
(2, 'S2-07', 'Add orchestrate-application tests', 'Test core pipeline scenarios', 'L', 6, 'todo');

-- ============================================================
-- Seed Sprint 3 Tasks (Polish & Launch Prep)
-- ============================================================
INSERT INTO public.sprint_tasks (sprint_number, task_id, title, description, complexity, estimated_hours, status) VALUES
(3, 'S3-01', 'Implement email notification system', 'Add SendGrid/Resend for report completion emails', 'M', 6, 'todo'),
(3, 'S3-02', 'Wire up variant rename', 'Complete TODO at DesignVariantList.tsx:241', 'XS', 2, 'todo'),
(3, 'S3-03', 'Reduce any types to <200', 'Improve type safety across 53 files', 'L', 12, 'todo'),
(3, 'S3-04', 'Run Lighthouse audit and optimize', 'Achieve performance score >80', 'M', 4, 'todo'),
(3, 'S3-05', 'Create deployment runbook', 'Document rollback, env vars, secrets procedures', 'S', 4, 'todo'),
(3, 'S3-06', 'Remove unused dependencies', 'Audit and remove Leaflet, Three.js if unused', 'S', 2, 'todo'),
(3, 'S3-07', 'Extract CesiumViewer components', 'Refactor 1,777 line file into modular hooks/components', 'XL', 12, 'todo');

-- ============================================================
-- Fix SECURITY DEFINER functions missing search_path (S1-03)
-- ============================================================

-- Core parcel/GIS functions
ALTER FUNCTION public.claim_cityengine_job()
SET search_path = public;

ALTER FUNCTION public.find_parcel_candidates(text, text, geometry, geometry, integer)
SET search_path = public;

ALTER FUNCTION public.find_parcels_by_area(text, numeric, numeric, integer)
SET search_path = public;

ALTER FUNCTION public.match_parcels_to_survey(text, integer)
SET search_path = public;

-- Add documentation comments
COMMENT ON FUNCTION public.claim_cityengine_job() IS 
  'Atomically claims a pending CityEngine job. SECURITY DEFINER with search_path=public.';
  
COMMENT ON FUNCTION public.find_parcel_candidates(text, text, geometry, geometry, integer) IS 
  'Finds parcel candidates by county, APN, and spatial proximity. SECURITY DEFINER with search_path=public.';
  
COMMENT ON FUNCTION public.find_parcels_by_area(text, numeric, numeric, integer) IS 
  'Finds parcels matching target acreage within tolerance. SECURITY DEFINER with search_path=public.';
  
COMMENT ON FUNCTION public.match_parcels_to_survey(text, integer) IS 
  'Matches parcels to survey geometry using spatial intersection. SECURITY DEFINER with search_path=public.';