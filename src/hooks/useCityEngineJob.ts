import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { 
  CityEngineJob, 
  CityEngineJobStatus, 
  QueueCityEngineJobRequest,
  QueueCityEngineJobResponse,
  CityEngineJobStatusResponse,
  CityEnginePayload,
  CityEngineOutputManifest
} from "@/types/cityengine";

/**
 * Hook to fetch and poll CityEngine job status
 */
export function useCityEngineJob(jobId: string | null) {
  return useQuery({
    queryKey: ["cityengine-job", jobId],
    queryFn: async (): Promise<CityEngineJobStatusResponse | null> => {
      if (!jobId) return null;

      const { data, error } = await supabase.functions.invoke("cityengine-job-status", {
        body: { job_id: jobId },
      });

      if (error) {
        throw new Error(error.message || "Failed to fetch job status");
      }

      return data as CityEngineJobStatusResponse;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      
      const status = data.job?.status;
      // Stop polling when job is complete or failed
      if (status === "complete" || status === "failed" || status === "cancelled") {
        return false;
      }
      // Poll every 3 seconds while processing
      return 3000;
    },
    enabled: !!jobId,
    staleTime: 1000,
  });
}

/**
 * Hook to queue a new CityEngine job
 */
export function useQueueCityEngineJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: QueueCityEngineJobRequest): Promise<QueueCityEngineJobResponse> => {
      const { data, error } = await supabase.functions.invoke("queue-cityengine-job", {
        body: request,
      });

      if (error) {
        throw new Error(error.message || "Failed to queue job");
      }

      return data as QueueCityEngineJobResponse;
    },
    onSuccess: (data) => {
      // Invalidate job list query
      queryClient.invalidateQueries({ queryKey: ["cityengine-jobs"] });
      
      // Pre-populate the job status query
      if (data.job_id) {
        queryClient.setQueryData(["cityengine-job", data.job_id], {
          job: {
            id: data.job_id,
            status: data.status,
            progress: 0,
            current_stage: "Queued",
          },
        });
      }
    },
  });
}

/**
 * Hook to fetch user's CityEngine job history
 */
export function useCityEngineJobHistory(limit = 10) {
  return useQuery({
    queryKey: ["cityengine-jobs", limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("cityengine_jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      // Map database rows to typed CityEngineJob objects
      return (data || []).map(row => ({
        ...row,
        input_payload: row.input_payload as unknown as CityEnginePayload,
        output_manifest: row.output_manifest as unknown as CityEngineOutputManifest | null,
        status: row.status as CityEngineJobStatus,
      })) as CityEngineJob[];
    },
    staleTime: 30000,
  });
}

/**
 * Hook to cancel a pending CityEngine job
 */
export function useCancelCityEngineJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("cityengine_jobs")
        .update({ status: "cancelled" as CityEngineJobStatus })
        .eq("id", jobId)
        .in("status", ["queued", "processing"]);

      if (error) {
        throw new Error(error.message);
      }

      return jobId;
    },
    onSuccess: (jobId) => {
      queryClient.invalidateQueries({ queryKey: ["cityengine-job", jobId] });
      queryClient.invalidateQueries({ queryKey: ["cityengine-jobs"] });
    },
  });
}

/**
 * Get status display info
 */
export function getJobStatusInfo(status: CityEngineJobStatus): {
  label: string;
  color: string;
  isLoading: boolean;
} {
  switch (status) {
    case "queued":
      return { label: "Queued", color: "text-muted-foreground", isLoading: true };
    case "processing":
      return { label: "Processing", color: "text-blue-500", isLoading: true };
    case "exporting":
      return { label: "Exporting", color: "text-blue-500", isLoading: true };
    case "uploading":
      return { label: "Uploading", color: "text-blue-500", isLoading: true };
    case "complete":
      return { label: "Complete", color: "text-green-500", isLoading: false };
    case "failed":
      return { label: "Failed", color: "text-destructive", isLoading: false };
    case "cancelled":
      return { label: "Cancelled", color: "text-muted-foreground", isLoading: false };
    default:
      return { label: "Unknown", color: "text-muted-foreground", isLoading: false };
  }
}
