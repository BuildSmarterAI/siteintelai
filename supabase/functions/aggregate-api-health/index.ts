import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const jobName = 'aggregate-api-health';

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
    console.log(`[${jobName}] Starting API health aggregation...`);

    // Get the current hour (truncated)
    const now = new Date();
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    const oneHourAgo = new Date(currentHour.getTime() - 60 * 60 * 1000);

    // Fetch all API logs from the last hour
    const { data: logs, error: logsError } = await supabase
      .from('api_logs')
      .select('source, success, duration_ms, error_message, timestamp')
      .gte('timestamp', oneHourAgo.toISOString())
      .lt('timestamp', currentHour.toISOString());

    if (logsError) {
      throw new Error(`Failed to fetch api_logs: ${logsError.message}`);
    }

    if (!logs || logs.length === 0) {
      console.log(`[${jobName}] No API logs found for the hour ${oneHourAgo.toISOString()}`);
      
      // Update job as success with 0 records
      if (jobId) {
        await supabase
          .from('cron_job_history')
          .update({
            status: 'success',
            finished_at: new Date().toISOString(),
            records_processed: 0,
            execution_time_ms: Date.now() - startTime,
          })
          .eq('id', jobId);
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'No logs to aggregate',
        hour: oneHourAgo.toISOString(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Group logs by source
    const bySource: Record<string, typeof logs> = {};
    for (const log of logs) {
      const source = log.source || 'unknown';
      if (!bySource[source]) {
        bySource[source] = [];
      }
      bySource[source].push(log);
    }

    // Calculate aggregations per source
    const snapshots: any[] = [];
    for (const [source, sourceLogs] of Object.entries(bySource)) {
      const totalCalls = sourceLogs.length;
      const successfulCalls = sourceLogs.filter(l => l.success).length;
      const durations = sourceLogs.map(l => l.duration_ms).filter(d => d != null).sort((a, b) => a - b);
      
      // Calculate avg and p95 duration
      const avgDuration = durations.length > 0 
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
        : null;
      
      const p95Index = Math.floor(durations.length * 0.95);
      const p95Duration = durations.length > 0 ? durations[p95Index] || durations[durations.length - 1] : null;

      // Count errors and get top error messages
      const errorLogs = sourceLogs.filter(l => !l.success && l.error_message);
      const errorCounts: Record<string, number> = {};
      for (const log of errorLogs) {
        const msg = log.error_message?.substring(0, 100) || 'Unknown error';
        errorCounts[msg] = (errorCounts[msg] || 0) + 1;
      }
      
      const topErrors = Object.entries(errorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([message, count]) => ({ message, count }));

      snapshots.push({
        hour: oneHourAgo.toISOString(),
        source,
        total_calls: totalCalls,
        successful_calls: successfulCalls,
        avg_duration_ms: avgDuration ? Math.round(avgDuration) : null,
        p95_duration_ms: p95Duration ? Math.round(p95Duration) : null,
        error_count: totalCalls - successfulCalls,
        top_errors: topErrors.length > 0 ? topErrors : null,
      });

      console.log(`[${jobName}] ${source}: ${totalCalls} calls, ${successfulCalls} successful, avg ${avgDuration?.toFixed(0)}ms`);
    }

    // Upsert snapshots (update if exists, insert if not)
    for (const snapshot of snapshots) {
      const { error: upsertError } = await supabase
        .from('api_health_snapshots')
        .upsert(snapshot, {
          onConflict: 'hour,source',
        });

      if (upsertError) {
        console.error(`[${jobName}] Failed to upsert snapshot for ${snapshot.source}:`, upsertError);
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
          records_processed: snapshots.length,
          execution_time_ms: executionTime,
          metadata: {
            hour: oneHourAgo.toISOString(),
            sources_processed: Object.keys(bySource).length,
            total_logs: logs.length,
          },
        })
        .eq('id', jobId);
    }

    console.log(`[${jobName}] Completed in ${executionTime}ms. Processed ${snapshots.length} source snapshots.`);

    return new Response(JSON.stringify({
      success: true,
      hour: oneHourAgo.toISOString(),
      snapshots_created: snapshots.length,
      total_logs_processed: logs.length,
      execution_time_ms: executionTime,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[${jobName}] Fatal error:`, error);

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
