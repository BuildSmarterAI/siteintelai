import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResetResult {
  user_id: string;
  subscription_id: string;
  tier_name: string;
  reports_reset: number;
  quickchecks_reset: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const jobName = 'credit-reset';
  
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
    console.log(`[${jobName}] Starting monthly credit reset...`);

    // Get all active subscriptions with their tier info
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        user_id,
        tier_id,
        reports_used,
        quickchecks_used,
        subscription_tiers (
          name,
          reports_per_month,
          quickchecks_unlimited
        )
      `)
      .eq('status', 'active');

    if (subError) {
      throw new Error(`Failed to fetch subscriptions: ${subError.message}`);
    }

    console.log(`[${jobName}] Found ${subscriptions?.length || 0} active subscriptions`);

    const results: ResetResult[] = [];
    let errorCount = 0;

    for (const sub of subscriptions || []) {
      try {
        const tier = sub.subscription_tiers as any;
        
        // Reset credits to 0 (start of new billing cycle)
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            reports_used: 0,
            quickchecks_used: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.id);

        if (updateError) {
          console.error(`[${jobName}] Failed to reset credits for subscription ${sub.id}:`, updateError);
          errorCount++;
          continue;
        }

        results.push({
          user_id: sub.user_id,
          subscription_id: sub.id,
          tier_name: tier?.name || 'Unknown',
          reports_reset: sub.reports_used || 0,
          quickchecks_reset: sub.quickchecks_used || 0,
        });

        console.log(`[${jobName}] Reset credits for user ${sub.user_id}: ${sub.reports_used} reports, ${sub.quickchecks_used} quickchecks`);
      } catch (err) {
        console.error(`[${jobName}] Error processing subscription ${sub.id}:`, err);
        errorCount++;
      }
    }

    const executionTime = Date.now() - startTime;
    
    // Record job completion
    if (jobId) {
      await supabase
        .from('cron_job_history')
        .update({
          status: errorCount > 0 ? 'error' : 'success',
          finished_at: new Date().toISOString(),
          records_processed: results.length,
          execution_time_ms: executionTime,
          error_message: errorCount > 0 ? `${errorCount} subscriptions failed to reset` : null,
          metadata: {
            total_subscriptions: subscriptions?.length || 0,
            successful_resets: results.length,
            failed_resets: errorCount,
            reset_summary: results.slice(0, 10), // Sample of first 10
          },
        })
        .eq('id', jobId);
    }

    // Record metrics
    await supabase.from('system_metrics').insert([
      {
        metric_name: 'credit_reset_count',
        metric_value: results.length,
        metric_unit: 'subscriptions',
        dimensions: { month: new Date().toISOString().slice(0, 7) },
      },
      {
        metric_name: 'credit_reset_duration',
        metric_value: executionTime,
        metric_unit: 'ms',
      },
    ]);

    console.log(`[${jobName}] Completed in ${executionTime}ms. Reset ${results.length} subscriptions, ${errorCount} errors.`);

    return new Response(JSON.stringify({
      success: true,
      subscriptions_reset: results.length,
      errors: errorCount,
      execution_time_ms: executionTime,
      results: results.slice(0, 20), // Return sample
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

    // Create alert
    await supabase.from('system_alerts').insert({
      alert_type: 'cron_job_failure',
      severity: 'error',
      message: `Credit reset job failed: ${error instanceof Error ? error.message : String(error)}`,
      source: jobName,
      metadata: { execution_time_ms: executionTime },
    });

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
