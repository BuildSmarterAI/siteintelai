import { supabase } from "@/integrations/supabase/client";

export type IntendedUse = 'industrial' | 'retail' | 'office' | 'medical' | 'multifamily' | 'hotel' | 'other';
export type ProjectType = 'ground_up' | 'tenant_improvement';

interface CreateSnapshotInput {
  parcel_id: string;
  intended_use: IntendedUse;
  project_type: ProjectType;
  approx_sqft?: number | null;
}

export interface FeasibilitySnapshot {
  id: string;
  parcel_id: string;
  application_id: string | null;
  intended_use: IntendedUse;
  project_type: ProjectType;
  approx_sqft: number | null;
  created_at: string;
  created_by: string | null;
  locked: boolean;
}

export interface FeasibilityJob {
  id: string;
  snapshot_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
}

export async function createFeasibilitySnapshot(input: CreateSnapshotInput): Promise<FeasibilitySnapshot> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase
    .from("feasibility_snapshots")
    .insert([{
      parcel_id: input.parcel_id,
      intended_use: input.intended_use,
      project_type: input.project_type,
      approx_sqft: input.approx_sqft ?? null,
      created_by: user.id
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as FeasibilitySnapshot;
}

export async function getFeasibilitySnapshot(id: string): Promise<FeasibilitySnapshot> {
  const { data, error } = await supabase
    .from("feasibility_snapshots")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data as FeasibilitySnapshot;
}

export async function getFeasibilityJob(snapshotId: string): Promise<FeasibilityJob | null> {
  const { data, error } = await supabase
    .from("feasibility_jobs")
    .select("*")
    .eq("snapshot_id", snapshotId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data as FeasibilityJob | null;
}
