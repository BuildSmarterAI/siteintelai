-- Feasibility Intake: Immutable Snapshots & Job Queue
-- Per SiteIntel™ lender-grade architecture: snapshots are locked by design

-- Create feasibility_snapshots table
CREATE TABLE public.feasibility_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id uuid NOT NULL,
  application_id uuid REFERENCES public.applications(id),
  intended_use text NOT NULL,
  project_type text NOT NULL,
  approx_sqft integer,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  locked boolean DEFAULT true,
  
  CONSTRAINT valid_intended_use CHECK (intended_use IN ('industrial', 'retail', 'office', 'medical', 'multifamily', 'hotel', 'other')),
  CONSTRAINT valid_project_type CHECK (project_type IN ('ground_up', 'tenant_improvement'))
);

-- Create feasibility_jobs table for processing queue
CREATE TABLE public.feasibility_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid REFERENCES public.feasibility_snapshots(id) NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  error text,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'running', 'completed', 'failed'))
);

-- Enable RLS on both tables
ALTER TABLE public.feasibility_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feasibility_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feasibility_snapshots
-- Insert: Authenticated users can create their own snapshots
CREATE POLICY "insert_own_snapshot" ON public.feasibility_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Select: Creator can read their own snapshots
CREATE POLICY "read_own_snapshot" ON public.feasibility_snapshots
  FOR SELECT TO authenticated
  USING (auth.uid() = created_by);

-- No UPDATE or DELETE policies = immutable by design

-- RLS Policies for feasibility_jobs
-- Select: Users can read jobs for their own snapshots
CREATE POLICY "read_own_jobs" ON public.feasibility_jobs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.feasibility_snapshots s
      WHERE s.id = snapshot_id AND s.created_by = auth.uid()
    )
  );

-- Insert: System only (via trigger), users cannot insert directly
-- No insert policy for users

-- Auto-enqueue trigger function
CREATE OR REPLACE FUNCTION public.enqueue_feasibility_run()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.feasibility_jobs (snapshot_id, status)
  VALUES (NEW.id, 'pending');
  RETURN NEW;
END;
$$;

-- Create trigger to auto-enqueue on snapshot insert
CREATE TRIGGER after_snapshot_insert
AFTER INSERT ON public.feasibility_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_feasibility_run();

-- Indexes for performance
CREATE INDEX idx_feasibility_snapshots_created_by ON public.feasibility_snapshots(created_by);
CREATE INDEX idx_feasibility_snapshots_parcel_id ON public.feasibility_snapshots(parcel_id);
CREATE INDEX idx_feasibility_jobs_snapshot_id ON public.feasibility_jobs(snapshot_id);
CREATE INDEX idx_feasibility_jobs_status ON public.feasibility_jobs(status);