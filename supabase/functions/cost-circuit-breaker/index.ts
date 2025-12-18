import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BudgetConfig {
  threshold_warn: number;
  threshold_critical: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[cost-circuit-breaker] Running cost check...');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get today's date in UTC
    const today = new Date().toISOString().split('T')[0];

    // Get today's total spend from api_cost_snapshots
    const { data: costData, error: costError } = await supabase
      .from('api_cost_snapshots')
      .select('estimated_cost, source, call_count')
      .gte('hour', `${today}T00:00:00`)
      .lte('hour', `${today}T23:59:59`);

    if (costError) {
      console.error('[cost-circuit-breaker] Error fetching cost data:', costError);
      throw costError;
    }

    // Calculate totals
    const dailySpend = costData?.reduce((sum, row) => sum + (row.estimated_cost || 0), 0) || 0;
    const totalCalls = costData?.reduce((sum, row) => sum + (row.call_count || 0), 0) || 0;

    // Get top cost drivers
    const driverMap = new Map<string, { cost: number; calls: number }>();
    costData?.forEach(row => {
      const existing = driverMap.get(row.source) || { cost: 0, calls: 0 };
      driverMap.set(row.source, {
        cost: existing.cost + (row.estimated_cost || 0),
        calls: existing.calls + (row.call_count || 0)
      });
    });
    const topDrivers = Array.from(driverMap.entries())
      .map(([source, data]) => ({ source, ...data }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    console.log(`[cost-circuit-breaker] Daily spend: $${dailySpend.toFixed(2)}, Total calls: ${totalCalls}`);
    console.log('[cost-circuit-breaker] Top drivers:', topDrivers);

    // Get budget thresholds
    const { data: budgetData } = await supabase
      .from('api_budget_config')
      .select('budget_type, threshold_warn, threshold_critical')
      .eq('is_active', true);

    const budgets: Record<string, BudgetConfig> = {};
    budgetData?.forEach(b => {
      budgets[b.budget_type] = {
        threshold_warn: b.threshold_warn,
        threshold_critical: b.threshold_critical
      };
    });

    const dailyWarn = budgets['daily']?.threshold_warn || 50;
    const dailyCritical = budgets['daily']?.threshold_critical || 100;

    // Get current emergency mode status
    const { data: configData } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'emergency_cost_mode')
      .single();

    const currentEmergencyMode = configData?.value === 'true';
    let newEmergencyMode = currentEmergencyMode;
    let alertSeverity: 'warning' | 'critical' | 'emergency' | null = null;
    let alertTitle = '';

    // Determine alert level
    if (dailySpend >= dailyCritical) {
      newEmergencyMode = true;
      alertSeverity = 'emergency';
      alertTitle = 'EMERGENCY: Daily API spend exceeded critical threshold';
    } else if (dailySpend >= dailyWarn) {
      alertSeverity = 'warning';
      alertTitle = 'WARNING: Daily API spend approaching limit';
    }

    // Update emergency mode if changed
    if (newEmergencyMode !== currentEmergencyMode) {
      const { error: updateError } = await supabase
        .from('system_config')
        .upsert({
          key: 'emergency_cost_mode',
          value: newEmergencyMode.toString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (updateError) {
        console.error('[cost-circuit-breaker] Failed to update emergency mode:', updateError);
      } else {
        console.log(`[cost-circuit-breaker] Emergency mode ${newEmergencyMode ? 'ACTIVATED' : 'DEACTIVATED'}`);
      }
    }

    // Send alert if threshold breached
    if (alertSeverity) {
      // Get monthly spend estimate
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const { data: monthData } = await supabase
        .from('api_cost_snapshots')
        .select('estimated_cost')
        .gte('hour', monthStart.toISOString());
      
      const monthlySpend = monthData?.reduce((sum, row) => sum + (row.estimated_cost || 0), 0) || 0;

      // Call send-cost-alert function
      const alertPayload = {
        severity: alertSeverity,
        title: alertTitle,
        daily_spend: dailySpend,
        monthly_spend: monthlySpend,
        threshold_breached: alertSeverity === 'emergency' 
          ? `$${dailyCritical}/day (critical)` 
          : `$${dailyWarn}/day (warning)`,
        top_drivers: topDrivers,
        recommended_actions: newEmergencyMode 
          ? [
              'Emergency mode activated - API calls are being throttled',
              'Only cached responses will be served',
              'Review top cost drivers and optimize queries',
              'Consider raising budget thresholds if this is expected'
            ]
          : [
              'Monitor spend closely',
              'Review top cost drivers',
              'Ensure caching is working properly'
            ]
      };

      try {
        await supabase.functions.invoke('send-cost-alert', {
          body: alertPayload
        });
        console.log('[cost-circuit-breaker] Alert sent');
      } catch (e) {
        console.error('[cost-circuit-breaker] Failed to send alert:', e);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[cost-circuit-breaker] Complete in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        daily_spend: dailySpend,
        total_calls: totalCalls,
        emergency_mode: newEmergencyMode,
        alert_sent: !!alertSeverity,
        thresholds: { warn: dailyWarn, critical: dailyCritical },
        top_drivers: topDrivers,
        duration_ms: duration
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[cost-circuit-breaker] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
