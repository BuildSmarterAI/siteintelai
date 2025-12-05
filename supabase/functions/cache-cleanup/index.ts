import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupResult {
  geocoder_cache_deleted: number;
  api_logs_deleted: number;
  old_jobs_deleted: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const jobName = 'cache-cleanup';
  
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
    console.log(`[${jobName}] Starting cache cleanup...`);

    const result: CleanupResult = {
      geocoder_cache_deleted: 0,
      api_logs_deleted: 0,
      old_jobs_deleted: 0,
    };

    // 1. Clean expired geocoder_cache entries (30-day TTL)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: expiredCache, error: cacheError } = await supabase
      .from('geocoder_cache')
      .delete()
      .or(`expires_at.lt.${new Date().toISOString()},created_at.lt.${thirtyDaysAgo.toISOString()}`)
      .select('input_hash');

    if (cacheError) {
      console.error(`[${jobName}] Error cleaning geocoder_cache:`, cacheError);
    } else {
      result.geocoder_cache_deleted = expiredCache?.length || 0;
      console.log(`[${jobName}] Deleted ${result.geocoder_cache_deleted} expired geocoder cache entries`);
    }

    // 2. Clean old api_logs (90-day retention)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: oldLogs, error: logsError } = await supabase
      .from('api_logs')
      .delete()
      .lt('timestamp', ninetyDaysAgo.toISOString())
      .select('id');

    if (logsError) {
      console.error(`[${jobName}] Error cleaning api_logs:`, logsError);
    } else {
      result.api_logs_deleted = oldLogs?.length || 0;
      console.log(`[${jobName}] Deleted ${result.api_logs_deleted} old API log entries`);
    }

    // 3. Clean old cron_job_history (30-day retention)
    const { data: oldJobs, error: jobsError } = await supabase
      .from('cron_job_history')
      .delete()
      .lt('started_at', thirtyDaysAgo.toISOString())
      .neq('id', jobId) // Don't delete current job
      .select('id');

    if (jobsError) {
      console.error(`[${jobName}] Error cleaning cron_job_history:`, jobsError);
    } else {
      result.old_jobs_deleted = oldJobs?.length || 0;
      console.log(`[${jobName}] Deleted ${result.old_jobs_deleted} old cron job history entries`);
    }

    // 4. Clean old system_metrics (7-day retention for detailed metrics)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { error: metricsError } = await supabase
      .from('system_metrics')
      .delete()
      .lt('recorded_at', sevenDaysAgo.toISOString());

    if (metricsError) {
      console.error(`[${jobName}] Error cleaning system_metrics:`, metricsError);
    }

    // 5. Clean resolved alerts older than 30 days
    const { error: alertsError } = await supabase
      .from('system_alerts')
      .delete()
      .eq('acknowledged', true)
      .lt('created_at', thirtyDaysAgo.toISOString());

    if (alertsError) {
      console.error(`[${jobName}] Error cleaning old alerts:`, alertsError);
    }

    const executionTime = Date.now() - startTime;
    const totalDeleted = result.geocoder_cache_deleted + result.api_logs_deleted + result.old_jobs_deleted;

    // Record job completion
    if (jobId) {
      await supabase
        .from('cron_job_history')
        .update({
          status: 'success',
          finished_at: new Date().toISOString(),
          records_processed: totalDeleted,
          execution_time_ms: executionTime,
          metadata: result,
        })
        .eq('id', jobId);
    }

    // Record metrics
    await supabase.from('system_metrics').insert([
      {
        metric_name: 'cache_cleanup_total',
        metric_value: totalDeleted,
        metric_unit: 'records',
      },
      {
        metric_name: 'cache_cleanup_duration',
        metric_value: executionTime,
        metric_unit: 'ms',
      },
    ]);

    console.log(`[${jobName}] Completed in ${executionTime}ms. Total deleted: ${totalDeleted}`);

    return new Response(JSON.stringify({
      success: true,
      ...result,
      total_deleted: totalDeleted,
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
