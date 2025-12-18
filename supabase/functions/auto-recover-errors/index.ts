import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Automatic error recovery cron job
 * Runs every 30 minutes to recover stuck applications
 * Recovers up to 10 applications per run to avoid overloading the pipeline
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_RECOVERY_PER_RUN = 5; // Reduced from 10 to limit blast radius
const ERROR_AGE_THRESHOLD_HOURS = 2; // Increased from 1 to reduce retry frequency
const MAX_ATTEMPTS_BEFORE_PERMANENT = 3; // CIRCUIT BREAKER: Stop retrying after 3 attempts

async function autoRecoverErrors(): Promise<{
  recovered: number;
  triggered: number;
  skipped_permanent: number;
  errors: string[];
}> {
  const result = {
    recovered: 0,
    triggered: 0,
    skipped_permanent: 0,
    errors: [] as string[]
  };

  console.log(`🔄 [auto-recover-errors] Starting automatic error recovery cron`);
  console.log(`⏰ [auto-recover-errors] Current time: ${new Date().toISOString()}`);
  console.log(`🛡️ [auto-recover-errors] Circuit breaker: max ${MAX_ATTEMPTS_BEFORE_PERMANENT} attempts`);

  // Calculate threshold time (2 hours ago)
  const thresholdTime = new Date();
  thresholdTime.setHours(thresholdTime.getHours() - ERROR_AGE_THRESHOLD_HOURS);

  // CIRCUIT BREAKER: Only fetch apps with attempts < MAX_ATTEMPTS_BEFORE_PERMANENT
  // This prevents infinite retry loops that cause API cost explosions
  const { data: errorApps, error: fetchError } = await sbAdmin
    .from('applications')
    .select('id, status, geo_lat, geo_lng, error_code, updated_at, formatted_address, attempts')
    .or('status.eq.error,enrichment_status.eq.failed')
    .lt('updated_at', thresholdTime.toISOString())
    .lt('attempts', MAX_ATTEMPTS_BEFORE_PERMANENT) // CRITICAL: Skip apps that have already failed too many times
    .not('formatted_address', 'is', null)
    .order('updated_at', { ascending: true })
    .limit(MAX_RECOVERY_PER_RUN);

  if (fetchError) {
    console.error('❌ Failed to fetch error applications:', fetchError);
    result.errors.push(fetchError.message);
    return result;
  }

  console.log(`📊 Found ${errorApps?.length || 0} recoverable applications (older than ${ERROR_AGE_THRESHOLD_HOURS}h)`);

  if (!errorApps || errorApps.length === 0) {
    console.log('✅ No applications to recover');
    return result;
  }

  for (const app of errorApps) {
    try {
      // CIRCUIT BREAKER: Double-check attempts count
      const currentAttempts = app.attempts || 0;
      if (currentAttempts >= MAX_ATTEMPTS_BEFORE_PERMANENT) {
        console.log(`⛔ [${app.id}] Skipping - already at ${currentAttempts} attempts (max: ${MAX_ATTEMPTS_BEFORE_PERMANENT})`);
        result.skipped_permanent++;
        
        // Mark as permanently failed to prevent future recovery attempts
        await sbAdmin
          .from('applications')
          .update({
            status: 'error_permanent',
            error_code: 'MAX_RETRIES_EXCEEDED',
            updated_at: new Date().toISOString()
          })
          .eq('id', app.id);
        
        continue;
      }

      const hasCoordinates = app.geo_lat && app.geo_lng;
      const newStatus = hasCoordinates ? 'enriching' : 'queued';
      const newStatusPercent = hasCoordinates ? 40 : 5;

      console.log(`🔧 [${app.id}] Recovering (error: ${app.error_code}, has_coords: ${hasCoordinates}, attempt: ${currentAttempts + 1}/${MAX_ATTEMPTS_BEFORE_PERMANENT})`);

      // Reset application status but INCREMENT attempts counter
      const { error: updateError } = await sbAdmin
        .from('applications')
        .update({
          status: newStatus,
          status_rev: 0,
          status_percent: newStatusPercent,
          error_code: null,
          enrichment_status: 'pending',
          attempts: currentAttempts + 1, // INCREMENT, not reset!
          data_flags: [],
          updated_at: new Date().toISOString()
        })
        .eq('id', app.id);

      if (updateError) {
        console.error(`❌ [${app.id}] Failed to reset:`, updateError);
        result.errors.push(`${app.id}: ${updateError.message}`);
        continue;
      }

      result.recovered++;

      // Trigger orchestration
      try {
        const response = await sbAdmin.functions.invoke('orchestrate-application', {
          body: { application_id: app.id }
        });

        if (!response.error) {
          result.triggered++;
          console.log(`✅ [${app.id}] Orchestration triggered`);
        } else {
          console.warn(`⚠️ [${app.id}] Orchestration failed:`, response.error);
        }
      } catch (orchErr) {
        console.warn(`⚠️ [${app.id}] Orchestration exception:`, orchErr);
      }

      // Small delay between recoveries to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (appErr) {
      console.error(`❌ [${app.id}] Recovery failed:`, appErr);
      result.errors.push(`${app.id}: ${String(appErr)}`);
    }
  }

  // Log to cron_job_history
  try {
    await sbAdmin.from('cron_job_history').insert({
      job_name: 'auto-recover-errors',
      status: result.errors.length === 0 ? 'success' : 'partial',
      result: {
        recovered: result.recovered,
        triggered: result.triggered,
        skipped_permanent: result.skipped_permanent,
        errors: result.errors
      },
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString()
    });
  } catch (logErr) {
    console.warn('⚠️ Failed to log to cron_job_history:', logErr);
  }

  console.log(`📊 [auto-recover-errors] Summary:`, {
    recovered: result.recovered,
    triggered: result.triggered,
    skipped_permanent: result.skipped_permanent,
    errors: result.errors.length
  });

  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const result = await autoRecoverErrors();

    return new Response(JSON.stringify({
      success: true,
      ...result
    }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });

  } catch (err) {
    console.error('❌ [auto-recover-errors] Fatal error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: String(err)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });
  }
});
