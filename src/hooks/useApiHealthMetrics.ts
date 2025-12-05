import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface TopError {
  message: string;
  count: number;
}

interface ApiHealthSnapshot {
  hour: string;
  source: string;
  total_calls: number;
  successful_calls: number;
  avg_duration_ms: number | null;
  p95_duration_ms: number | null;
  error_count: number;
  top_errors: TopError[] | null;
}

interface ApiLogEntry {
  source: string;
  success: boolean;
  duration_ms: number;
  error_message: string | null;
  timestamp: string;
}

interface ApiHealthMetrics {
  snapshots: ApiHealthSnapshot[];
  recentLogs: ApiLogEntry[];
  bySource: Record<string, {
    totalCalls: number;
    successRate: number;
    avgDuration: number;
    errorCount: number;
  }>;
  overallStats: {
    totalCalls: number;
    successRate: number;
    avgDuration: number;
    errorCount: number;
  };
  topErrors: { source: string; message: string; count: number }[];
  isLoading: boolean;
  error: string | null;
}

// Helper to safely parse top_errors JSON field
function parseTopErrors(topErrors: Json | null): TopError[] | null {
  if (!topErrors || !Array.isArray(topErrors)) return null;
  return topErrors.map((err) => {
    if (typeof err === 'object' && err !== null && 'message' in err && 'count' in err) {
      return {
        message: String((err as { message: unknown }).message || ''),
        count: Number((err as { count: unknown }).count || 0),
      };
    }
    return { message: 'Unknown error', count: 0 };
  });
}

export function useApiHealthMetrics(timeRange: '24h' | '7d' | '30d' = '24h') {
  const [metrics, setMetrics] = useState<ApiHealthMetrics>({
    snapshots: [],
    recentLogs: [],
    bySource: {},
    overallStats: { totalCalls: 0, successRate: 0, avgDuration: 0, errorCount: 0 },
    topErrors: [],
    isLoading: true,
    error: null,
  });

  const fetchMetrics = useCallback(async () => {
    setMetrics(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const hoursBack = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

      // Fetch health snapshots
      const { data: rawSnapshots, error: snapshotsError } = await supabase
        .from('api_health_snapshots')
        .select('*')
        .gte('hour', startTime)
        .order('hour', { ascending: true });

      if (snapshotsError) throw snapshotsError;

      // Transform snapshots with proper type handling
      const snapshots: ApiHealthSnapshot[] = (rawSnapshots || []).map(s => ({
        hour: s.hour,
        source: s.source,
        total_calls: s.total_calls,
        successful_calls: s.successful_calls,
        avg_duration_ms: s.avg_duration_ms,
        p95_duration_ms: s.p95_duration_ms,
        error_count: s.error_count,
        top_errors: parseTopErrors(s.top_errors),
      }));

      // Fetch recent raw logs for real-time data (last 2 hours)
      const recentStart = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data: recentLogs, error: logsError } = await supabase
        .from('api_logs')
        .select('source, success, duration_ms, error_message, timestamp')
        .gte('timestamp', recentStart)
        .order('timestamp', { ascending: false })
        .limit(500);

      if (logsError) throw logsError;

      // Aggregate by source from snapshots
      const bySource: Record<string, {
        totalCalls: number;
        successRate: number;
        avgDuration: number;
        errorCount: number;
      }> = {};

      let totalCalls = 0;
      let totalSuccess = 0;
      let totalDuration = 0;
      let durationCount = 0;

      for (const snapshot of snapshots) {
        const source = snapshot.source;
        if (!bySource[source]) {
          bySource[source] = { totalCalls: 0, successRate: 0, avgDuration: 0, errorCount: 0 };
        }
        bySource[source].totalCalls += snapshot.total_calls;
        bySource[source].errorCount += snapshot.error_count;
        if (snapshot.avg_duration_ms) {
          bySource[source].avgDuration = (bySource[source].avgDuration + snapshot.avg_duration_ms) / 2;
        }

        totalCalls += snapshot.total_calls;
        totalSuccess += snapshot.successful_calls;
        if (snapshot.avg_duration_ms) {
          totalDuration += snapshot.avg_duration_ms;
          durationCount++;
        }
      }

      // Calculate success rates
      for (const source of Object.keys(bySource)) {
        const stats = bySource[source];
        stats.successRate = stats.totalCalls > 0 
          ? ((stats.totalCalls - stats.errorCount) / stats.totalCalls) * 100 
          : 100;
      }

      // Collect top errors
      const errorMap: Record<string, { source: string; message: string; count: number }> = {};
      for (const snapshot of snapshots) {
        if (snapshot.top_errors) {
          for (const err of snapshot.top_errors) {
            const key = `${snapshot.source}:${err.message}`;
            if (!errorMap[key]) {
              errorMap[key] = { source: snapshot.source, message: err.message, count: 0 };
            }
            errorMap[key].count += err.count;
          }
        }
      }
      const topErrors = Object.values(errorMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setMetrics({
        snapshots,
        recentLogs: recentLogs || [],
        bySource,
        overallStats: {
          totalCalls,
          successRate: totalCalls > 0 ? (totalSuccess / totalCalls) * 100 : 100,
          avgDuration: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
          errorCount: totalCalls - totalSuccess,
        },
        topErrors,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching API health metrics:', err);
      setMetrics(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch metrics',
      }));
    }
  }, [timeRange]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { ...metrics, refetch: fetchMetrics };
}
