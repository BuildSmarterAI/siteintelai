import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertCondition {
  name: string;
  check: () => Promise<{ triggered: boolean; value: number; message: string }>;
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
      // 1. Enrichment queue depth
      {
        name: 'enrichment_queue_depth',
        severity: 'warning',
        threshold: 50,
        check: async () => {
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
      // 2. API failure rate (last hour)
      {
        name: 'api_failure_rate',
        severity: 'error',
        threshold: 10,
        check: async () => {
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
          
          const { data: logs } = await supabase
            .from('api_logs')
            .select('success')
            .gte('timestamp', oneHourAgo);
          
          if (!logs || logs.length === 0) {
            return { triggered: false, value: 0, message: 'No API calls in last hour' };
          }
          
          const failureCount = logs.filter(l => !l.success).length;
          const failureRate = (failureCount / logs.length) * 100;
          
          return {
            triggered: failureRate > 10,
            value: Math.round(failureRate * 10) / 10,
            message: `API failure rate is ${failureRate.toFixed(1)}% (${failureCount}/${logs.length} calls failed)`,
          };
        },
      },
      // 3. Failed cron jobs (last 24 hours)
      {
        name: 'cron_job_failures',
        severity: 'warning',
        check: async () => {
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          
          const { count } = await supabase
            .from('cron_job_history')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'error')
            .gte('started_at', oneDayAgo);
          
          const failures = count || 0;
          return {
            triggered: failures > 3,
            value: failures,
            message: `${failures} cron jobs failed in the last 24 hours`,
          };
        },
      },
      // 4. Stale GIS data
      {
        name: 'stale_gis_layers',
        severity: 'info',
        check: async () => {
          const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
          
          // Check gis_layer_versions if exists
          const { count, error } = await supabase
            .from('api_logs')
            .select('*', { count: 'exact', head: true })
            .eq('endpoint', 'gis-refresh-scheduler')
            .eq('success', true)
            .gte('timestamp', twoDaysAgo);
          
          // If no successful refresh in 2 days, alert
          const hasRecentRefresh = (count || 0) > 0;
          return {
            triggered: !hasRecentRefresh,
            value: count || 0,
            message: hasRecentRefresh 
              ? `GIS layers refreshed ${count} times in last 48 hours`
              : 'No GIS layer refresh in the last 48 hours',
          };
        },
      },
      // 5. High response times
      {
        name: 'high_api_latency',
        severity: 'warning',
        threshold: 5000,
        check: async () => {
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
          
          const { data: logs } = await supabase
            .from('api_logs')
            .select('duration_ms')
            .gte('timestamp', oneHourAgo)
            .gt('duration_ms', 5000);
          
          const slowCalls = logs?.length || 0;
          return {
            triggered: slowCalls > 10,
            value: slowCalls,
            message: `${slowCalls} API calls exceeded 5 second threshold in last hour`,
          };
        },
      },
      // 6. Unacknowledged critical alerts
      {
        name: 'unacknowledged_critical',
        severity: 'critical',
        check: async () => {
          const { count } = await supabase
            .from('system_alerts')
            .select('*', { count: 'exact', head: true })
            .eq('severity', 'critical')
            .eq('acknowledged', false);
          
          const unacked = count || 0;
          return {
            triggered: unacked > 0,
            value: unacked,
            message: `${unacked} critical alerts require attention`,
          };
        },
      },
    ];

    // Run all checks
    for (const condition of conditions) {
      try {
        const result = await condition.check();
        
        console.log(`[${jobName}] Check '${condition.name}': value=${result.value}, triggered=${result.triggered}`);

        // Record metric
        await supabase.from('system_metrics').insert({
          metric_name: condition.name,
          metric_value: result.value,
          metric_unit: 'count',
        });

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
            alert_types: alertsCreated.map(a => a.alert_type),
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
