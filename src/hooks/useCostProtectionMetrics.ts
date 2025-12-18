import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SystemConfig {
  key: string;
  value: string;
}

interface BudgetStatus {
  type: string;
  thresholdWarn: number;
  thresholdCritical: number;
  current: number;
  percentUsed: number;
  status: 'ok' | 'warning' | 'critical';
}

interface CacheMetric {
  source: string;
  totalCalls: number;
  cacheHits: number;
  hitRate: number;
}

interface CostAlert {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  created_at: string;
  acknowledged: boolean;
}

export interface CostProtectionMetrics {
  emergencyMode: boolean;
  pausedCronJobs: string[];
  todaySpend: number;
  monthlySpend: number;
  budgets: BudgetStatus[];
  cacheMetrics: CacheMetric[];
  recentCostAlerts: CostAlert[];
  circuitBreakerThreshold: number;
  isLoading: boolean;
}

export function useCostProtectionMetrics() {
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [pausedCronJobs, setPausedCronJobs] = useState<string[]>([]);

  // Fetch main metrics
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['cost-protection-metrics'],
    queryFn: async (): Promise<Omit<CostProtectionMetrics, 'emergencyMode' | 'pausedCronJobs' | 'isLoading'>> => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fetch all data in parallel
      const [
        configResult,
        budgetResult,
        todayLogsResult,
        monthLogsResult,
        alertsResult,
        costConfigResult
      ] = await Promise.all([
        // System config
        supabase
          .from('system_config')
          .select('key, value')
          .in('key', ['emergency_cost_mode', 'paused_cron_jobs']),

        // Budget config
        supabase
          .from('api_budget_config')
          .select('*')
          .eq('is_active', true),

        // Today's logs for spend calculation
        supabase
          .from('api_logs')
          .select('source, cache_key, success')
          .gte('timestamp', todayStart.toISOString()),

        // This month's logs
        supabase
          .from('api_logs')
          .select('source, cache_key, success')
          .gte('timestamp', monthStart.toISOString()),

        // Recent cost alerts
        supabase
          .from('system_alerts')
          .select('*')
          .in('alert_type', ['daily_spend_warning', 'daily_spend_critical', 'emergency_mode_activated', 'circuit_breaker_tripped'])
          .order('created_at', { ascending: false })
          .limit(10),

        // Cost config for calculations
        supabase
          .from('api_cost_config')
          .select('source, cost_per_call'),
      ]);

      // Parse system config
      const configs = (configResult.data || []) as SystemConfig[];
      const emergencyConfig = configs.find(c => c.key === 'emergency_cost_mode');
      const pausedConfig = configs.find(c => c.key === 'paused_cron_jobs');

      setEmergencyMode(emergencyConfig?.value === 'true');
      setPausedCronJobs(pausedConfig?.value ? JSON.parse(pausedConfig.value) : []);

      // Build cost lookup
      const costMap = new Map<string, number>();
      (costConfigResult.data || []).forEach((c: { source: string; cost_per_call: number }) => {
        costMap.set(c.source, Number(c.cost_per_call));
      });

      // Calculate today's spend
      const todayLogs = todayLogsResult.data || [];
      let todaySpend = 0;
      const todayBySource = new Map<string, { total: number; cached: number }>();

      todayLogs.forEach((log: { source: string; cache_key: string | null }) => {
        const costPerCall = costMap.get(log.source) || 0;
        todaySpend += costPerCall;

        const existing = todayBySource.get(log.source) || { total: 0, cached: 0 };
        existing.total += 1;
        if (log.cache_key) existing.cached += 1;
        todayBySource.set(log.source, existing);
      });

      // Calculate monthly spend
      const monthLogs = monthLogsResult.data || [];
      let monthlySpend = 0;
      monthLogs.forEach((log: { source: string }) => {
        const costPerCall = costMap.get(log.source) || 0;
        monthlySpend += costPerCall;
      });

      // Build cache metrics
      const cacheMetrics: CacheMetric[] = Array.from(todayBySource.entries()).map(([source, stats]) => ({
        source,
        totalCalls: stats.total,
        cacheHits: stats.cached,
        hitRate: stats.total > 0 ? Math.round((stats.cached / stats.total) * 100) : 0,
      })).sort((a, b) => b.totalCalls - a.totalCalls);

      // Build budget statuses
      const budgetConfigs = budgetResult.data || [];
      const budgets: BudgetStatus[] = budgetConfigs.map((b: { budget_type: string; threshold_warn: number; threshold_critical: number }) => {
        const current = b.budget_type === 'daily' ? todaySpend : monthlySpend;
        const percentUsed = b.threshold_critical > 0 ? (current / b.threshold_critical) * 100 : 0;
        
        let status: 'ok' | 'warning' | 'critical' = 'ok';
        if (current >= b.threshold_critical) status = 'critical';
        else if (current >= b.threshold_warn) status = 'warning';

        return {
          type: b.budget_type,
          thresholdWarn: b.threshold_warn,
          thresholdCritical: b.threshold_critical,
          current,
          percentUsed: Math.min(percentUsed, 100),
          status,
        };
      });

      // Get circuit breaker threshold (daily critical)
      const dailyBudget = budgets.find(b => b.type === 'daily');
      const circuitBreakerThreshold = dailyBudget?.thresholdCritical || 100;

      return {
        todaySpend,
        monthlySpend,
        budgets,
        cacheMetrics,
        recentCostAlerts: (alertsResult.data || []) as CostAlert[],
        circuitBreakerThreshold,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Real-time subscription for emergency mode changes
  useEffect(() => {
    const channel = supabase
      .channel('cost-protection-config')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_config',
          filter: 'key=in.(emergency_cost_mode,paused_cron_jobs)',
        },
        (payload) => {
          const record = payload.new as SystemConfig;
          if (record.key === 'emergency_cost_mode') {
            setEmergencyMode(record.value === 'true');
          } else if (record.key === 'paused_cron_jobs') {
            setPausedCronJobs(record.value ? JSON.parse(record.value) : []);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    emergencyMode,
    pausedCronJobs,
    todaySpend: data?.todaySpend ?? 0,
    monthlySpend: data?.monthlySpend ?? 0,
    budgets: data?.budgets ?? [],
    cacheMetrics: data?.cacheMetrics ?? [],
    recentCostAlerts: data?.recentCostAlerts ?? [],
    circuitBreakerThreshold: data?.circuitBreakerThreshold ?? 100,
    isLoading,
    refetch,
  };
}

export async function toggleEmergencyMode(enabled: boolean) {
  const { error } = await supabase
    .from('system_config')
    .upsert({ key: 'emergency_cost_mode', value: String(enabled) }, { onConflict: 'key' });
  
  if (error) throw error;
}

export async function updateBudgetThreshold(budgetType: string, thresholdWarn: number, thresholdCritical: number) {
  const { error } = await supabase
    .from('api_budget_config')
    .update({ threshold_warn: thresholdWarn, threshold_critical: thresholdCritical })
    .eq('budget_type', budgetType);
  
  if (error) throw error;
}

export async function clearApiCache() {
  const { data, error } = await supabase
    .from('api_cache_universal')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('id');
  
  if (error) throw error;
  return data?.length || 0;
}
