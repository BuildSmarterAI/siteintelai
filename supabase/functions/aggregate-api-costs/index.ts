import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    console.log('[aggregate-api-costs] Starting hourly cost aggregation...');

    // Record job start
    const { data: jobRecord } = await supabase
      .from('cron_job_history')
      .insert({
        job_name: 'aggregate-api-costs',
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Get current hour (truncated)
    const now = new Date();
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    const previousHour = new Date(currentHour.getTime() - 60 * 60 * 1000);

    console.log(`[aggregate-api-costs] Aggregating for hour: ${previousHour.toISOString()}`);

    // Fetch API logs for the previous hour
    const { data: apiLogs, error: logsError } = await supabase
      .from('api_logs')
      .select('source, success')
      .gte('timestamp', previousHour.toISOString())
      .lt('timestamp', currentHour.toISOString());

    if (logsError) {
      throw new Error(`Failed to fetch api_logs: ${logsError.message}`);
    }

    console.log(`[aggregate-api-costs] Found ${apiLogs?.length || 0} API calls in previous hour`);

    // Fetch cost config
    const { data: costConfig, error: configError } = await supabase
      .from('api_cost_config')
      .select('source, cost_per_call');

    if (configError) {
      throw new Error(`Failed to fetch cost config: ${configError.message}`);
    }

    // Create cost lookup map
    const costMap = new Map<string, number>();
    costConfig?.forEach(c => costMap.set(c.source, Number(c.cost_per_call)));

    // Aggregate by source
    const sourceStats = new Map<string, { total: number; success: number; error: number }>();
    
    apiLogs?.forEach(log => {
      const stats = sourceStats.get(log.source) || { total: 0, success: 0, error: 0 };
      stats.total++;
      if (log.success) {
        stats.success++;
      } else {
        stats.error++;
      }
      sourceStats.set(log.source, stats);
    });

    // Get today's start for cumulative calculation
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Fetch existing snapshots for today (for cumulative)
    const { data: todaySnapshots } = await supabase
      .from('api_cost_snapshots')
      .select('source, estimated_cost')
      .gte('hour', todayStart.toISOString())
      .lt('hour', previousHour.toISOString());

    // Calculate cumulative costs per source
    const cumulativeCosts = new Map<string, number>();
    todaySnapshots?.forEach(s => {
      const current = cumulativeCosts.get(s.source) || 0;
      cumulativeCosts.set(s.source, current + Number(s.estimated_cost));
    });

    // Insert snapshots
    let totalCost = 0;
    let recordsInserted = 0;

    for (const [source, stats] of sourceStats) {
      const costPerCall = costMap.get(source) || 0;
      const estimatedCost = stats.total * costPerCall;
      const previousCumulative = cumulativeCosts.get(source) || 0;
      const cumulativeDailyCost = previousCumulative + estimatedCost;

      totalCost += estimatedCost;

      const { error: insertError } = await supabase
        .from('api_cost_snapshots')
        .upsert({
          hour: previousHour.toISOString(),
          source,
          call_count: stats.total,
          success_count: stats.success,
          error_count: stats.error,
          estimated_cost: estimatedCost,
          cumulative_daily_cost: cumulativeDailyCost,
        }, {
          onConflict: 'hour,source'
        });

      if (!insertError) {
        recordsInserted++;
      }
    }

    console.log(`[aggregate-api-costs] Inserted ${recordsInserted} cost snapshots, total cost: $${totalCost.toFixed(4)}`);

    // Check budget thresholds and create alerts if exceeded
    const { data: budgetConfig } = await supabase
      .from('api_budget_config')
      .select('*')
      .eq('is_active', true);

    // Calculate today's total spend
    const { data: todayTotalData } = await supabase
      .from('api_cost_snapshots')
      .select('estimated_cost')
      .gte('hour', todayStart.toISOString());

    const todayTotalSpend = todayTotalData?.reduce((sum, s) => sum + Number(s.estimated_cost), 0) || 0;

    // Check daily budget
    const dailyBudget = budgetConfig?.find(b => b.budget_type === 'daily' && !b.source);
    
    if (dailyBudget) {
      if (todayTotalSpend >= Number(dailyBudget.threshold_critical)) {
        // Create critical alert
        await supabase.from('system_alerts').upsert({
          alert_type: 'daily_spend_critical',
          severity: 'critical',
          message: `CRITICAL: Daily API spend ($${todayTotalSpend.toFixed(2)}) exceeds critical threshold ($${dailyBudget.threshold_critical})`,
          source: 'aggregate-api-costs',
          acknowledged: false,
          metadata: { spend: todayTotalSpend, threshold: dailyBudget.threshold_critical }
        }, {
          onConflict: 'alert_type,source'
        });
      } else if (todayTotalSpend >= Number(dailyBudget.threshold_warn)) {
        // Create warning alert
        await supabase.from('system_alerts').upsert({
          alert_type: 'daily_spend_warning',
          severity: 'warning',
          message: `Warning: Daily API spend ($${todayTotalSpend.toFixed(2)}) exceeds warning threshold ($${dailyBudget.threshold_warn})`,
          source: 'aggregate-api-costs',
          acknowledged: false,
          metadata: { spend: todayTotalSpend, threshold: dailyBudget.threshold_warn }
        }, {
          onConflict: 'alert_type,source'
        });
      }
    }

    const executionTime = Date.now() - startTime;

    // Update job record
    if (jobRecord) {
      await supabase
        .from('cron_job_history')
        .update({
          status: 'success',
          finished_at: new Date().toISOString(),
          execution_time_ms: executionTime,
          records_processed: recordsInserted,
          metadata: {
            total_cost: totalCost,
            today_spend: todayTotalSpend,
            sources_processed: sourceStats.size,
          }
        })
        .eq('id', jobRecord.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        hour: previousHour.toISOString(),
        sources_processed: sourceStats.size,
        records_inserted: recordsInserted,
        total_cost_this_hour: totalCost,
        today_total_spend: todayTotalSpend,
        execution_time_ms: executionTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[aggregate-api-costs] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
