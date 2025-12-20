import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StuckApplication {
  id: string;
  formatted_address: string | null;
  status: string;
  enrichment_status: string;
  status_percent: number | null;
  error_code: string | null;
  attempts: number;
  updated_at: string;
  created_at: string;
  parcel_id: string | null;
  user_id: string;
  full_name: string;
  email: string;
  company: string;
}

export interface StuckApplicationsSummary {
  total: number;
  byStatus: Record<string, number>;
  byErrorCode: Record<string, number>;
  avgStuckTimeMs: number;
}

interface UseStuckApplicationsResult {
  applications: StuckApplication[];
  summary: StuckApplicationsSummary;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  retryApplication: (id: string) => Promise<boolean>;
  skipEnrichmentStep: (id: string, step: string) => Promise<boolean>;
  bulkRetry: (ids: string[]) => Promise<{ success: number; failed: number }>;
  forceComplete: (id: string) => Promise<boolean>;
}

export function useStuckApplications(): UseStuckApplicationsResult {
  const [applications, setApplications] = useState<StuckApplication[]>([]);
  const [summary, setSummary] = useState<StuckApplicationsSummary>({
    total: 0,
    byStatus: {},
    byErrorCode: {},
    avgStuckTimeMs: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStuckApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch applications that are stuck (enriching/queued for >10 min, or error/failed)
      const { data, error: fetchError } = await supabase
        .from('applications')
        .select(`
          id,
          formatted_address,
          status,
          enrichment_status,
          status_percent,
          error_code,
          attempts,
          updated_at,
          created_at,
          parcel_id,
          user_id,
          full_name,
          email,
          company
        `)
        .or(
          `status.in.(enriching,queued,error),enrichment_status.in.(failed,partial,pending)`
        )
        .order('updated_at', { ascending: false })
        .limit(200);

      if (fetchError) throw fetchError;

      const apps = (data || []) as StuckApplication[];
      setApplications(apps);

      // Calculate summary
      const byStatus: Record<string, number> = {};
      const byErrorCode: Record<string, number> = {};
      let totalStuckTimeMs = 0;
      const now = Date.now();

      apps.forEach(app => {
        // Count by status
        byStatus[app.status] = (byStatus[app.status] || 0) + 1;
        
        // Count by error code
        if (app.error_code) {
          byErrorCode[app.error_code] = (byErrorCode[app.error_code] || 0) + 1;
        }

        // Calculate stuck time
        const updatedAt = new Date(app.updated_at).getTime();
        totalStuckTimeMs += now - updatedAt;
      });

      setSummary({
        total: apps.length,
        byStatus,
        byErrorCode,
        avgStuckTimeMs: apps.length > 0 ? totalStuckTimeMs / apps.length : 0,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch stuck applications';
      setError(message);
      console.error('Error fetching stuck applications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retryApplication = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke('re-enrich-application', {
        body: { applicationId: id },
      });

      if (error) throw error;

      toast.success('Application retry triggered');
      await fetchStuckApplications();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to retry application';
      toast.error(message);
      console.error('Error retrying application:', err);
      return false;
    }
  }, [fetchStuckApplications]);

  const skipEnrichmentStep = useCallback(async (id: string, step: string): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke('skip-enrichment-step', {
        body: { applicationId: id, step },
      });

      if (error) throw error;

      toast.success(`Skipped ${step} step and continued pipeline`);
      await fetchStuckApplications();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to skip step';
      toast.error(message);
      console.error('Error skipping step:', err);
      return false;
    }
  }, [fetchStuckApplications]);

  const bulkRetry = useCallback(async (ids: string[]): Promise<{ success: number; failed: number }> => {
    let success = 0;
    let failed = 0;

    // Process in batches of 5 to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(id => retryApplication(id).catch(() => false))
      );
      
      results.forEach(result => {
        if (result) success++;
        else failed++;
      });
    }

    if (success > 0) {
      toast.success(`Retried ${success} applications`);
    }
    if (failed > 0) {
      toast.error(`Failed to retry ${failed} applications`);
    }

    await fetchStuckApplications();
    return { success, failed };
  }, [retryApplication, fetchStuckApplications]);

  const forceComplete = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Update the application status directly
      const { error } = await supabase
        .from('applications')
        .update({
          status: 'complete',
          enrichment_status: 'complete',
          status_percent: 100,
          data_flags: { forced_complete: true, forced_at: new Date().toISOString() },
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Application marked as complete (forced)');
      await fetchStuckApplications();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to force complete';
      toast.error(message);
      console.error('Error forcing complete:', err);
      return false;
    }
  }, [fetchStuckApplications]);

  // Initial fetch
  useEffect(() => {
    fetchStuckApplications();
  }, [fetchStuckApplications]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('stuck-applications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
          filter: 'status=in.(enriching,queued,error)',
        },
        () => {
          // Debounce refetch to avoid too many calls
          fetchStuckApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStuckApplications]);

  return {
    applications,
    summary,
    isLoading,
    error,
    refetch: fetchStuckApplications,
    retryApplication,
    skipEnrichmentStep,
    bulkRetry,
    forceComplete,
  };
}
