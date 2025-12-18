import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CostSnapshot {
  hour: string;
  source: string;
  call_count: number;
  success_count: number;
  error_count: number;
  estimated_cost: number;
  cumulative_daily_cost: number | null;
}

export interface CostConfig {
  source: string;
  cost_per_call: number;
  provider: string | null;
  is_free: boolean;
  notes: string | null;
}

export interface BudgetConfig {
  id: string;
  budget_type: string;
  source: string | null;
  threshold_warn: number;
  threshold_critical: number;
  is_active: boolean;
}

export interface CostBreakdown {
  source: string;
  provider: string | null;
  callsToday: number;
  costToday: number;
  callsMTD: number;
  costMTD: number;
  costPerCall: number;
  isFree: boolean;
}

export interface CostMetrics {
  todayTotal: number;
  mtdTotal: number;
  projectedMonthly: number;
  highestCostSource: string | null;
  highestCostAmount: number;
  breakdown: CostBreakdown[];
  hourlyTrend: { hour: string; cost: number; calls: number }[];
  budgetConfig: BudgetConfig[];
  costConfig: CostConfig[];
}

export function useApiCostMetrics(timeRange: '24h' | '7d' | '30d' = '24h') {
  return useQuery({
    queryKey: ['api-cost-metrics', timeRange],
    queryFn: async (): Promise<CostMetrics> => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Calculate time range start
      let rangeStart: Date;
      switch (timeRange) {
        case '7d':
          rangeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          rangeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          rangeStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      // Fetch all data in parallel
      const [snapshotsResult, configResult, budgetResult, todayLogsResult, mtdLogsResult] = await Promise.all([
        // Cost snapshots for trend
        supabase
          .from('api_cost_snapshots')
          .select('*')
          .gte('hour', rangeStart.toISOString())
          .order('hour', { ascending: true }),
        
        // Cost configuration
        supabase
          .from('api_cost_config')
          .select('*'),
        
        // Budget configuration
        supabase
          .from('api_budget_config')
          .select('*')
          .eq('is_active', true),
        
        // Today's raw logs for accurate breakdown
        supabase
          .from('api_logs')
          .select('source, success')
          .gte('timestamp', todayStart.toISOString()),
        
        // MTD raw logs
        supabase
          .from('api_logs')
          .select('source, success')
          .gte('timestamp', monthStart.toISOString()),
      ]);

      const snapshots = (snapshotsResult.data || []) as CostSnapshot[];
      const costConfig = (configResult.data || []) as CostConfig[];
      const budgetConfig = (budgetResult.data || []) as BudgetConfig[];
      const todayLogs = todayLogsResult.data || [];
      const mtdLogs = mtdLogsResult.data || [];

      // Create cost lookup
      const costMap = new Map<string, CostConfig>();
      costConfig.forEach(c => costMap.set(c.source, c));

      // Calculate today's costs from logs
      const todayBySource = new Map<string, number>();
      todayLogs.forEach(log => {
        todayBySource.set(log.source, (todayBySource.get(log.source) || 0) + 1);
      });

      // Calculate MTD costs from logs
      const mtdBySource = new Map<string, number>();
      mtdLogs.forEach(log => {
        mtdBySource.set(log.source, (mtdBySource.get(log.source) || 0) + 1);
      });

      // Build breakdown
      const breakdown: CostBreakdown[] = [];
      const allSources = new Set([...todayBySource.keys(), ...mtdBySource.keys()]);

      let todayTotal = 0;
      let mtdTotal = 0;
      let highestCostSource: string | null = null;
      let highestCostAmount = 0;

      allSources.forEach(source => {
        const config = costMap.get(source);
        const costPerCall = config ? Number(config.cost_per_call) : 0;
        const callsToday = todayBySource.get(source) || 0;
        const callsMTD = mtdBySource.get(source) || 0;
        const costToday = callsToday * costPerCall;
        const costMTD = callsMTD * costPerCall;

        todayTotal += costToday;
        mtdTotal += costMTD;

        if (costToday > highestCostAmount) {
          highestCostAmount = costToday;
          highestCostSource = source;
        }

        breakdown.push({
          source,
          provider: config?.provider || null,
          callsToday,
          costToday,
          callsMTD,
          costMTD,
          costPerCall,
          isFree: config?.is_free || false,
        });
      });

      // Sort breakdown by today's cost descending
      breakdown.sort((a, b) => b.costToday - a.costToday);

      // Build hourly trend from snapshots
      const hourlyMap = new Map<string, { cost: number; calls: number }>();
      snapshots.forEach(s => {
        const existing = hourlyMap.get(s.hour) || { cost: 0, calls: 0 };
        existing.cost += Number(s.estimated_cost);
        existing.calls += s.call_count;
        hourlyMap.set(s.hour, existing);
      });

      const hourlyTrend = Array.from(hourlyMap.entries())
        .map(([hour, data]) => ({ hour, ...data }))
        .sort((a, b) => a.hour.localeCompare(b.hour));

      // Calculate projected monthly spend
      const daysElapsed = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const dailyAverage = daysElapsed > 0 ? mtdTotal / daysElapsed : 0;
      const projectedMonthly = dailyAverage * daysInMonth;

      return {
        todayTotal,
        mtdTotal,
        projectedMonthly,
        highestCostSource,
        highestCostAmount,
        breakdown,
        hourlyTrend,
        budgetConfig,
        costConfig,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useTriggerCostAggregation() {
  return async () => {
    const { data, error } = await supabase.functions.invoke('aggregate-api-costs');
    if (error) throw error;
    return data;
  };
}
