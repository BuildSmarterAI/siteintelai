import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { generateTraceId } from '../_shared/observability.ts';

/**
 * Admin Cost Dashboard (H-05)
 * Provides aggregated cost data for admin dashboard
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

interface CostDashboardResponse {
  summary: {
    today: number;
    yesterday: number;
    thisWeek: number;
    thisMonth: number;
    projectedMonthEnd: number;
  };
  byProvider: Array<{
    provider: string;
    cost: number;
    calls: number;
    cacheHitRate: number;
  }>;
  timeSeries: Array<{
    hour: string;
    cost: number;
    calls: number;
  }>;
  topApplications: Array<{
    applicationId: string;
    address: string;
    cost: number;
    calls: number;
  }>;
  budgetStatus: {
    daily: { used: number; limit: number; percentage: number };
    monthly: { used: number; limit: number; percentage: number };
  };
  traceId: string;
}

// Cost per call by provider (USD)
const COST_PER_CALL: Record<string, number> = {
  google_geocoding: 0.005,
  google_places: 0.00283,
  google_elevation: 0.005,
  google_static_maps: 0.002,
  nominatim: 0,
  mapbox: 0.0007,
  fema: 0,
  arcgis: 0,
  usgs: 0,
  openai: 0.01,
  epa: 0,
  txdot: 0,
  usda: 0,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = generateTraceId();

  try {
    // Verify admin access
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify user is admin
    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    ).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Date boundaries
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Get cost snapshots for time series (last 48 hours)
    const { data: snapshots } = await supabase
      .from('api_cost_snapshots')
      .select('*')
      .gte('hour', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .order('hour', { ascending: true });

    // Get today's API logs for real-time data
    const { data: todayLogs } = await supabase
      .from('api_logs')
      .select('source, success, application_id, timestamp')
      .gte('timestamp', todayStart);

    // Get yesterday's logs
    const { data: yesterdayLogs } = await supabase
      .from('api_logs')
      .select('source')
      .gte('timestamp', yesterdayStart)
      .lt('timestamp', todayStart);

    // Get this week's logs
    const { data: weekLogs } = await supabase
      .from('api_logs')
      .select('source')
      .gte('timestamp', weekStart);

    // Get this month's logs
    const { data: monthLogs } = await supabase
      .from('api_logs')
      .select('source')
      .gte('timestamp', monthStart);

    // Calculate costs
    const calculateCost = (logs: Array<{ source: string }> | null): number => {
      if (!logs) return 0;
      return logs.reduce((sum, log) => sum + (COST_PER_CALL[log.source] || 0), 0);
    };

    const todayCost = calculateCost(todayLogs);
    const yesterdayCost = calculateCost(yesterdayLogs);
    const weekCost = calculateCost(weekLogs);
    const monthCost = calculateCost(monthLogs);

    // Project month end cost
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const projectedMonthEnd = dayOfMonth > 0 ? (monthCost / dayOfMonth) * daysInMonth : 0;

    // Aggregate by provider
    const providerStats = new Map<string, { calls: number; cost: number; cacheHits: number }>();
    for (const log of todayLogs || []) {
      const stats = providerStats.get(log.source) || { calls: 0, cost: 0, cacheHits: 0 };
      stats.calls++;
      stats.cost += COST_PER_CALL[log.source] || 0;
      providerStats.set(log.source, stats);
    }

    const byProvider = Array.from(providerStats.entries()).map(([provider, stats]) => ({
      provider,
      cost: Math.round(stats.cost * 100) / 100,
      calls: stats.calls,
      cacheHitRate: 0, // Would need cache hit data
    })).sort((a, b) => b.cost - a.cost);

    // Time series from snapshots
    const timeSeries = (snapshots || []).map(s => ({
      hour: s.hour,
      cost: s.estimated_cost || 0,
      calls: s.call_count || 0,
    }));

    // Top applications by cost
    const appCalls = new Map<string, number>();
    for (const log of todayLogs || []) {
      if (log.application_id) {
        appCalls.set(log.application_id, (appCalls.get(log.application_id) || 0) + 1);
      }
    }

    const topAppIds = Array.from(appCalls.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    // Get application addresses
    const { data: apps } = await supabase
      .from('applications')
      .select('id, formatted_address')
      .in('id', topAppIds);

    const appAddresses = new Map((apps || []).map(a => [a.id, a.formatted_address || 'Unknown']));

    const topApplications = topAppIds.map(id => {
      const calls = appCalls.get(id) || 0;
      return {
        applicationId: id,
        address: appAddresses.get(id) || 'Unknown',
        cost: Math.round(calls * 0.01 * 100) / 100, // Estimated average cost
        calls,
      };
    });

    // Get budget limits
    const { data: budgetConfig } = await supabase
      .from('api_budget_config')
      .select('*')
      .eq('is_active', true);

    const dailyLimit = budgetConfig?.find(c => c.budget_type === 'daily')?.threshold_critical || 100;
    const monthlyLimit = budgetConfig?.find(c => c.budget_type === 'monthly')?.threshold_critical || 2000;

    const response: CostDashboardResponse = {
      summary: {
        today: Math.round(todayCost * 100) / 100,
        yesterday: Math.round(yesterdayCost * 100) / 100,
        thisWeek: Math.round(weekCost * 100) / 100,
        thisMonth: Math.round(monthCost * 100) / 100,
        projectedMonthEnd: Math.round(projectedMonthEnd * 100) / 100,
      },
      byProvider,
      timeSeries,
      topApplications,
      budgetStatus: {
        daily: {
          used: Math.round(todayCost * 100) / 100,
          limit: dailyLimit,
          percentage: Math.round((todayCost / dailyLimit) * 100),
        },
        monthly: {
          used: Math.round(monthCost * 100) / 100,
          limit: monthlyLimit,
          percentage: Math.round((monthCost / monthlyLimit) * 100),
        },
      },
      traceId,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[admin-cost-dashboard] Error:', err);
    return new Response(
      JSON.stringify({ error: String(err), traceId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
