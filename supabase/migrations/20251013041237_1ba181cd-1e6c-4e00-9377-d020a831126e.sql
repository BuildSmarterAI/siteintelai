-- Create user_onboarding table to track onboarding progress
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_complete BOOLEAN DEFAULT false,
  first_login_at TIMESTAMPTZ DEFAULT now(),
  checklist_completed JSONB DEFAULT '{
    "profile_complete": false,
    "first_application_started": false,
    "first_report_generated": false,
    "report_tour_viewed": false,
    "lender_invited": false
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view and update their own onboarding data
CREATE POLICY "Users can view own onboarding data"
  ON public.user_onboarding
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding data"
  ON public.user_onboarding
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding data"
  ON public.user_onboarding
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_user_onboarding_updated_at
  BEFORE UPDATE ON public.user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_user_onboarding_user_id ON public.user_onboarding(user_id);

-- Add draft_saved_at column to applications table for tracking draft saves
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS draft_saved_at TIMESTAMPTZ;

-- Add index for finding draft applications quickly
CREATE INDEX IF NOT EXISTS idx_applications_enrichment_status ON public.applications(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_applications_user_draft ON public.applications(user_id, enrichment_status) 
WHERE enrichment_status = 'draft';