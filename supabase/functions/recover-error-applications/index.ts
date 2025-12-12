import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecoveryResult {
  recovered: number;
  skipped: number;
  triggered: number;
  details: Array<{
    id: string;
    error_code: string | null;
    recovery_path: 'skip_geocode' | 'full_retry';
    triggered: boolean;
  }>;
}

/**
 * Recover error applications by resetting their status based on progress.
 * - Applications with coordinates can skip geocode phase (reset to 'enriching')
 * - Applications without coordinates need full retry (reset to 'queued')
 */
async function recoverErrorApplications(
  limit: number = 50,
  triggerOrchestration: boolean = false,
  dryRun: boolean = false
): Promise<RecoveryResult> {
  console.log(`🔄 [recover-error-applications] Starting recovery (limit: ${limit}, trigger: ${triggerOrchestration}, dryRun: ${dryRun})`);
  
  // Fetch all error applications
  const { data: errorApps, error: fetchError } = await sbAdmin
    .from('applications')
    .select('id, status, enrichment_status, geo_lat, geo_lng, parcel_id, error_code, attempts, data_flags, formatted_address, county')
    .or('status.eq.error,enrichment_status.eq.failed')
    .order('created_at', { ascending: true })
    .limit(limit);
  
  if (fetchError) {
    console.error('❌ Failed to fetch error applications:', fetchError);
    throw new Error(`Failed to fetch applications: ${fetchError.message}`);
  }
  
  console.log(`📊 Found ${errorApps?.length || 0} error applications`);
  
  const result: RecoveryResult = {
    recovered: 0,
    skipped: 0,
    triggered: 0,
    details: []
  };
  
  if (!errorApps || errorApps.length === 0) {
    return result;
  }
  
  for (const app of errorApps) {
    const hasCoordinates = app.geo_lat && app.geo_lng;
    const hasAddress = !!app.formatted_address;
    
    // Skip apps without an address - they can't be recovered
    if (!hasAddress) {
      console.warn(`⚠️ Skipping ${app.id}: No formatted_address available`);
      result.skipped++;
      continue;
    }
    
    // Determine recovery path
    const recoveryPath: 'skip_geocode' | 'full_retry' = hasCoordinates ? 'skip_geocode' : 'full_retry';
    const newStatus = hasCoordinates ? 'enriching' : 'queued';
    const newStatusPercent = hasCoordinates ? 40 : 5;
    
    console.log(`🔧 [${app.id}] Recovery path: ${recoveryPath}, error_code: ${app.error_code}, has_coords: ${hasCoordinates}`);
    
    if (!dryRun) {
      // Reset the application status
      const { error: updateError } = await sbAdmin
        .from('applications')
        .update({
          status: newStatus,
          status_rev: 0,
          status_percent: newStatusPercent,
          error_code: null,
          enrichment_status: 'pending',
          attempts: 0,
          data_flags: [],
          updated_at: new Date().toISOString()
        })
        .eq('id', app.id);
      
      if (updateError) {
        console.error(`❌ Failed to reset ${app.id}:`, updateError);
        result.skipped++;
        continue;
      }
      
      result.recovered++;
      
      // Optionally trigger orchestration immediately
      let triggered = false;
      if (triggerOrchestration) {
        try {
          const response = await sbAdmin.functions.invoke('orchestrate-application', {
            body: { application_id: app.id }
          });
          
          if (!response.error) {
            triggered = true;
            result.triggered++;
            console.log(`✅ [${app.id}] Orchestration triggered successfully`);
          } else {
            console.warn(`⚠️ [${app.id}] Orchestration invoke failed:`, response.error);
          }
        } catch (orchErr) {
          console.warn(`⚠️ [${app.id}] Orchestration trigger exception:`, orchErr);
        }
      }
      
      result.details.push({
        id: app.id,
        error_code: app.error_code,
        recovery_path: recoveryPath,
        triggered
      });
    } else {
      // Dry run - just record what would happen
      result.details.push({
        id: app.id,
        error_code: app.error_code,
        recovery_path: recoveryPath,
        triggered: false
      });
      result.recovered++;
    }
  }
  
  console.log(`📊 [recover-error-applications] Summary:`, {
    total: errorApps.length,
    recovered: result.recovered,
    skipped: result.skipped,
    triggered: result.triggered
  });
  
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let limit = 50;
    let triggerOrchestration = false;
    let dryRun = false;

    // Parse query params or body
    const url = new URL(req.url);
    limit = parseInt(url.searchParams.get('limit') || '50', 10);
    triggerOrchestration = url.searchParams.get('trigger') === 'true';
    dryRun = url.searchParams.get('dry_run') === 'true';

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        limit = body.limit || limit;
        triggerOrchestration = body.trigger ?? triggerOrchestration;
        dryRun = body.dry_run ?? dryRun;
      } catch (_) {
        // Ignore JSON parse errors
      }
    }

    console.log(`📥 [recover-error-applications] Request received:`, { limit, triggerOrchestration, dryRun });

    const result = await recoverErrorApplications(limit, triggerOrchestration, dryRun);

    return new Response(JSON.stringify({
      success: true,
      dry_run: dryRun,
      ...result
    }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });

  } catch (err) {
    console.error('❌ [recover-error-applications] Error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: String(err)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });
  }
});
