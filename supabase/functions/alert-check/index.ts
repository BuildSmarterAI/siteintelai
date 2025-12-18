import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertCondition {
  name: string;
  check: (supabase: any) => Promise<{ triggered: boolean; value: number; message: string }>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  threshold?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const jobName = 'alert-check';
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Record job start
  const { data: jobRecord } = await supabase
    .from('cron_job_history')
    .insert({
      job_name: jobName,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  const jobId = jobRecord?.id;

  try {
    console.log(`[${jobName}] Starting alert checks...`);

    const alertsCreated: any[] = [];

    // Define alert conditions
    const conditions: AlertCondition[] = [
      // 1. Daily spend warning
      {
        name: 'daily_spend_warning',
        severity: 'warning',
        threshold: 50,
        check: async (supabase) => {
          const today = new Date().toISOString().split('T')[0];
          
          const { data: costData } = await supabase
            .from('api_cost_snapshots')
            .select('estimated_cost')
            .gte('hour', `${today}T00:00:00`)
            .lte('hour', `${today}T23:59:59`);
          
          const dailySpend = costData?.reduce((sum: number, row: any) => sum + (row.estimated_cost || 0), 0) || 0;
          
          const { data: thresholdData } = await supabase
            .from('api_budget_config')
            .select('threshold_warn')
            .eq('budget_type', 'daily')
            .eq('is_active', true)
            .single();
          
          const threshold = thresholdData?.threshold_warn || 50;
          
          return {
            triggered: dailySpend >= threshold,
            value: dailySpend,
            message: `Daily API spend: $${dailySpend.toFixed(2)} (warning threshold: $${threshold})`,
          };
        },
      },
      // 2. Daily spend critical
      {
        name: 'daily_spend_critical',
        severity: 'critical',
        threshold: 100,
        check: async (supabase) => {
          const today = new Date().toISOString().split('T')[0];
          
          const { data: costData } = await supabase
            .from('api_cost_snapshots')
            .select('estimated_cost')
            .gte('hour', `${today}T00:00:00`)
            .lte('hour', `${today}T23:59:59`);
          
          const dailySpend = costData?.reduce((sum: number, row: any) => sum + (row.estimated_cost || 0), 0) || 0;
          
          const { data: thresholdData } = await supabase
            .from('api_budget_config')
            .select('threshold_critical')
            .eq('budget_type', 'daily')
            .eq('is_active', true)
            .single();
          
          const threshold = thresholdData?.threshold_critical || 100;
          
          return {
            triggered: dailySpend >= threshold,
            value: dailySpend,
            message: `CRITICAL: Daily API spend $${dailySpend.toFixed(2)} exceeds $${threshold}`,
          };
        },
      },
      // 3. Monthly spend warning
      {
        name: 'monthly_spend_warning',
        severity: 'warning',
        threshold: 1000,
        check: async (supabase) => {
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          
          const { data: costData } = await supabase
            .from('api_cost_snapshots')
            .select('estimated_cost')
            .gte('hour', monthStart.toISOString());
          
          const monthlySpend = costData?.reduce((sum: number, row: any) => sum + (row.estimated_cost || 0), 0) || 0;
          
          const { data: thresholdData } = await supabase
            .from('api_budget_config')
            .select('threshold_warn')
            .eq('budget_type', 'monthly')
            .eq('is_active', true)
            .single();
          
          const threshold = thresholdData?.threshold_warn || 1000;
          
          return {
            triggered: monthlySpend >= threshold,
            value: monthlySpend,
            message: `Monthly API spend: $${monthlySpend.toFixed(2)} (warning threshold: $${threshold})`,
          };
        },
      },
      // 4. Emergency mode active
      {
        name: 'emergency_mode_active',
        severity: 'critical',
        check: async (supabase) => {
          const { data } = await supabase
            .from('system_config')
            .select('value')
            .eq('key', 'emergency_cost_mode')
            .single();
          
          const isActive = data?.value === 'true';
          
          return {
            triggered: isActive,
            value: isActive ? 1 : 0,
            message: isActive ? 'Emergency cost mode is ACTIVE - API calls are being throttled' : 'Normal operation',
          };
        },
      },
      // 5. Enrichment queue depth
      {
        name: 'enrichment_queue_depth',
        severity: 'warning',
        threshold: 50,
        check: async (supabase) => {
          const { count } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .in('status', ['queued', 'enriching'])
            .lt('next_run_at', new Date().toISOString());
          
          const queueDepth = count || 0;
          return {
            triggered: queueDepth > 50,
            value: queueDepth,
            message: `Enrichment queue has ${queueDepth} pending items (threshold: 50)`,
          };
        },
      },
      // 6. API failure rate (last hour)
      {
        name: 'api_failure_rate',
        severity: 'error',
        threshold: 10,
        check: async (supabase) => {
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
          
          const { data: logs } = await supabase
            .from('api_logs')
            .select('success')
            .gte('timestamp', oneHourAgo);
          
          if (!logs || logs.length === 0) {
            return { triggered: false, value: 0, message: 'No API calls in last hour' };
          }
          
          const failureCount = logs.filter((l: any) => !l.success).length;
          const failureRate = (failureCount / logs.length) * 100;
          
          return {
            triggered: failureRate > 10,
            value: Math.round(failureRate * 10) / 10,
            message: `API failure rate is ${failureRate.toFixed(1)}% (${failureCount}/${logs.length} calls failed)`,
          };
        },
      },
      // 7. Pipeline stuck (application in enriching state > 10 minutes)
      {
        name: 'pipeline_stuck',
        severity: 'error',
        threshold: 10,
        check: async (supabase) => {
          const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
          
          const { count } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'enriching')
            .lt('updated_at', tenMinAgo);
          
          const stuck = count || 0;
          return {
            triggered: stuck > 0,
            value: stuck,
            message: `${stuck} application(s) stuck in enriching state for more than 10 minutes`,
          };
        },
      },
      // 8. Queue backlog (more than 20 applications queued)
      {
        name: 'queue_backlog',
        severity: 'warning',
        threshold: 20,
        check: async (supabase) => {
          const { count } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'queued');
          
          const queued = count || 0;
          return {
            triggered: queued > 20,
            value: queued,
            message: `${queued} applications queued (threshold: 20)`,
          };
        },
      },
      // 9. API latency spike
      {
        name: 'api_latency_spike',
        severity: 'warning',
        threshold: 5000,
        check: async (supabase) => {
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
          
          const { data } = await supabase
            .from('api_health_snapshots')
            .select('p95_duration_ms')
            .gte('hour', oneHourAgo)
            .not('p95_duration_ms', 'is', null);
          
          const avgP95 = data && data.length > 0
            ? data.reduce((sum: number, row: any) => sum + row.p95_duration_ms, 0) / data.length
            : 0;
          
          return {
            triggered: avgP95 > 5000,
            value: avgP95,
            message: `API P95 latency: ${avgP95.toFixed(0)}ms (threshold: 5000ms)`,
          };
        },
      },
      // 10. Critical API down (Google or FEMA 0% for 30 minutes)
      {
        name: 'critical_api_down',
        severity: 'critical',
        check: async (supabase) => {
          const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
          
          const { data: logs } = await supabase
            .from('api_logs')
            .select('source, success')
            .in('source', ['google_places', 'google_geocoding', 'google_places_nearby', 'google_elevation_api', 'fema_nfhl', 'fema_openfema'])
            .gte('timestamp', thirtyMinAgo);
          
          if (!logs || logs.length === 0) {
            return { triggered: false, value: 0, message: 'No critical API calls in last 30 minutes' };
          }
          
          // Group by source
          const bySource: Record<string, { total: number; success: number }> = {};
          for (const log of logs) {
            const src = log.source;
            if (!bySource[src]) bySource[src] = { total: 0, success: 0 };
            bySource[src].total++;
            if (log.success) bySource[src].success++;
          }
          
          // Check for any source at 0%
          const downSources: string[] = [];
          for (const [source, stats] of Object.entries(bySource)) {
            if (stats.total >= 3 && stats.success === 0) {
              downSources.push(source);
            }
          }
          
          return {
            triggered: downSources.length > 0,
            value: downSources.length,
            message: downSources.length > 0 
              ? `Critical API(s) down: ${downSources.join(', ')}`
              : 'All critical APIs operational',
          };
        },
      },
    ];

    // Run all checks
    for (const condition of conditions) {
      try {
        const result = await condition.check(supabase);
        
        console.log(`[${jobName}] Check '${condition.name}': value=${result.value}, triggered=${result.triggered}`);

        // Record metric
        await supabase.from('system_metrics').insert({
          metric_name: condition.name,
          metric_value: result.value,
          metric_unit: 'count',
        }).catch(() => {}); // Ignore metric insert errors

        if (result.triggered) {
          // Check if similar unacknowledged alert exists (to avoid duplicates)
          const { count: existingCount } = await supabase
            .from('system_alerts')
            .select('*', { count: 'exact', head: true })
            .eq('alert_type', condition.name)
            .eq('acknowledged', false)
            .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour

          if ((existingCount || 0) === 0) {
            // Create new alert
            const { data: alert } = await supabase
              .from('system_alerts')
              .insert({
                alert_type: condition.name,
                severity: condition.severity,
                message: result.message,
                source: jobName,
                metadata: {
                  value: result.value,
                  threshold: condition.threshold,
                  checked_at: new Date().toISOString(),
                },
              })
              .select()
              .single();

            if (alert) {
              alertsCreated.push(alert);
              console.log(`[${jobName}] Created ${condition.severity} alert: ${condition.name}`);
            }

            // Send Slack alert for critical issues
            if (condition.severity === 'critical') {
              try {
                const today = new Date().toISOString().split('T')[0];
                const { data: costData } = await supabase
                  .from('api_cost_snapshots')
                  .select('estimated_cost')
                  .gte('hour', `${today}T00:00:00`);
                
                const dailySpend = costData?.reduce((sum: number, row: any) => sum + (row.estimated_cost || 0), 0) || 0;

                await supabase.functions.invoke('send-cost-alert', {
                  body: {
                    severity: 'critical',
                    title: result.message,
                    daily_spend: dailySpend,
                    monthly_spend: 0,
                    threshold_breached: condition.name,
                    recommended_actions: ['Check system health dashboard', 'Review recent deployments']
                  }
                });
              } catch (e) {
                console.error(`[${jobName}] Failed to send Slack alert:`, e);
              }
            }
          } else {
            console.log(`[${jobName}] Skipping duplicate alert for ${condition.name}`);
          }
        }
      } catch (checkError) {
        console.error(`[${jobName}] Error running check '${condition.name}':`, checkError);
      }
    }

    const executionTime = Date.now() - startTime;

    // Record job completion
    if (jobId) {
      await supabase
        .from('cron_job_history')
        .update({
          status: 'success',
          finished_at: new Date().toISOString(),
          records_processed: alertsCreated.length,
          execution_time_ms: executionTime,
          metadata: {
            checks_run: conditions.length,
            alerts_created: alertsCreated.length,
            alert_types: alertsCreated.map((a: any) => a.alert_type),
          },
        })
        .eq('id', jobId);
    }

    console.log(`[${jobName}] Completed in ${executionTime}ms. Created ${alertsCreated.length} alerts.`);

    return new Response(JSON.stringify({
      success: true,
      checks_run: conditions.length,
      alerts_created: alertsCreated.length,
      alerts: alertsCreated,
      execution_time_ms: executionTime,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[${jobName}] Fatal error:`, error);

    // Record job failure
    if (jobId) {
      await supabase
        .from('cron_job_history')
        .update({
          status: 'error',
          finished_at: new Date().toISOString(),
          execution_time_ms: executionTime,
          error_message: error instanceof Error ? error.message : String(error),
        })
        .eq('id', jobId);
    }

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
