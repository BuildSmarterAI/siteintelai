import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PipelinePhaseMetric {
  id: string;
  application_id: string;
  phase: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  success: boolean;
  error_message: string | null;
}

interface StatusCounts {
  queued: number;
  enriching: number;
  ai: number;
  rendering: number;
  complete: number;
  error: number;
}

interface PhaseStats {
  phase: string;
  totalRuns: number;
  successRate: number;
  avgDuration: number;
  errorCount: number;
}

interface PipelineMetrics {
  phaseMetrics: PipelinePhaseMetric[];
  statusCounts: StatusCounts;
  phaseStats: PhaseStats[];
  recentErrors: { phase: string; error_message: string; application_id: string; timestamp: string }[];
  avgPipelineTime: number;
  isLoading: boolean;
  error: string | null;
}

export function usePipelineMetrics() {
  const [metrics, setMetrics] = useState<PipelineMetrics>({
    phaseMetrics: [],
    statusCounts: { queued: 0, enriching: 0, ai: 0, rendering: 0, complete: 0, error: 0 },
    phaseStats: [],
    recentErrors: [],
    avgPipelineTime: 0,
    isLoading: true,
    error: null,
  });

  const fetchMetrics = useCallback(async () => {
    setMetrics(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch current application status counts
      const statusQueries = ['queued', 'enriching', 'ai', 'rendering', 'complete', 'error'].map(
        async (status) => {
          const { count } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('status', status);
          return { status, count: count || 0 };
        }
      );

      const statusResults = await Promise.all(statusQueries);
      const statusCounts: StatusCounts = {
        queued: 0, enriching: 0, ai: 0, rendering: 0, complete: 0, error: 0,
      };
      for (const result of statusResults) {
        statusCounts[result.status as keyof StatusCounts] = result.count;
      }

      // Fetch recent pipeline phase metrics (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: phaseMetrics, error: phaseError } = await supabase
        .from('pipeline_phase_metrics')
        .select('*')
        .gte('started_at', weekAgo)
        .order('started_at', { ascending: false })
        .limit(1000);

      if (phaseError) throw phaseError;

      // Calculate phase statistics
      const phaseGroups: Record<string, PipelinePhaseMetric[]> = {};
      for (const metric of (phaseMetrics || [])) {
        if (!phaseGroups[metric.phase]) {
          phaseGroups[metric.phase] = [];
        }
        phaseGroups[metric.phase].push(metric);
      }

      const phaseStats: PhaseStats[] = Object.entries(phaseGroups).map(([phase, metrics]) => {
        const successful = metrics.filter(m => m.success).length;
        const durations = metrics.filter(m => m.duration_ms != null).map(m => m.duration_ms!);
        const avgDuration = durations.length > 0 
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) 
          : 0;

        return {
          phase,
          totalRuns: metrics.length,
          successRate: metrics.length > 0 ? (successful / metrics.length) * 100 : 100,
          avgDuration,
          errorCount: metrics.length - successful,
        };
      }).sort((a, b) => b.totalRuns - a.totalRuns);

      // Get recent errors
      const recentErrors = (phaseMetrics || [])
        .filter(m => !m.success && m.error_message)
        .slice(0, 20)
        .map(m => ({
          phase: m.phase,
          error_message: m.error_message || 'Unknown error',
          application_id: m.application_id,
          timestamp: m.started_at,
        }));

      // Calculate average total pipeline time (from queued to complete)
      // This requires looking at applications that completed recently
      const { data: completedApps } = await supabase
        .from('applications')
        .select('created_at, updated_at')
        .eq('status', 'complete')
        .gte('updated_at', weekAgo)
        .limit(100);

      let avgPipelineTime = 0;
      if (completedApps && completedApps.length > 0) {
        const times = completedApps.map(app => 
          new Date(app.updated_at).getTime() - new Date(app.created_at).getTime()
        );
        avgPipelineTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      }

      setMetrics({
        phaseMetrics: phaseMetrics || [],
        statusCounts,
        phaseStats,
        recentErrors,
        avgPipelineTime,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching pipeline metrics:', err);
      setMetrics(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch metrics',
      }));
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { ...metrics, refetch: fetchMetrics };
}
