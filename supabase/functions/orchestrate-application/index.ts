import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// State transition map with progress percentages
const STATE_PROGRESS: Record<string, number> = {
  queued: 5,
  enriching: 40,
  validating: 60,
  ai: 75,
  rendering: 90,
  complete: 100,
  error: 0
};

// Exponential backoff config
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 2000; // 2s, 4s, 8s

async function bump(
  appId: string, 
  newStatus: string, 
  currentRev: number,
  errorCode?: string,
  errorMessage?: string,
  substepMessage?: string
) {
  const updates: any = {
    status: newStatus,
    status_rev: currentRev + 1,
    status_percent: STATE_PROGRESS[newStatus] || 0,
    updated_at: new Date().toISOString(),
    error_code: errorCode || null,
    attempts: 0 // Reset on successful transition or error
  };

  const { error } = await sbAdmin
    .from('applications')
    .update(updates)
    .eq('id', appId)
    .eq('status_rev', currentRev); // Idempotent: only update if rev matches

  if (error) {
    console.error(`[bump] Failed to update status for ${appId}:`, error);
    throw new Error(`Failed to bump status: ${error.message}`);
  }

  console.log(`[bump] ${appId}: ${newStatus} (${STATE_PROGRESS[newStatus]}%)`);

  // Publish realtime event to app channel with enhanced metadata
  await publishEvent(appId, {
    ...updates,
    stage_label: getStageLabel(newStatus),
    stage_message: getStageMessage(newStatus)
  });
}

function getStageLabel(status: string): string {
  const labels: Record<string, string> = {
    queued: 'Queued',
    enriching: 'Gathering Data',
    validating: 'Validating Data',
    ai: 'AI Analysis',
    rendering: 'Generating PDF',
    complete: 'Complete',
    error: 'Error'
  };
  return labels[status] || 'Processing';
}

function getStageMessage(status: string): string {
  const messages: Record<string, string> = {
    queued: 'Your report is in queue',
    enriching: 'Fetching parcel, zoning, and utility data',
    validating: 'Verifying data completeness',
    ai: 'Analyzing feasibility with AI',
    rendering: 'Building your PDF report',
    complete: 'Your report is ready',
    error: 'An error occurred'
  };
  return messages[status] || 'Processing your request';
}

async function publishEvent(appId: string, payload: any) {
  try {
    const channel = sbAdmin.channel(`app:${appId}`);
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'status_update',
      payload
    });
    await channel.unsubscribe();
  } catch (err) {
    console.error(`[publishEvent] Failed to broadcast for ${appId}:`, err);
    // Don't throw - realtime failure shouldn't break orchestration
  }
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  attempts: number,
  errorCode: string
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      console.error(`[retry] Attempt ${i + 1}/${attempts} failed:`, err);
      if (i === attempts - 1) {
        // Final attempt failed
        throw { code: errorCode, message: String(err) };
      }
      // Exponential backoff: 2s, 4s, 8s
      await new Promise(resolve => setTimeout(resolve, BASE_DELAY_MS * Math.pow(2, i)));
    }
  }
  throw new Error('Retry exhausted');
}

// Phase implementations (call existing edge functions)
async function doGeocodeAndParcel(app: any) {
  console.log(`[doGeocodeAndParcel] Starting GEOCODE-ONLY mode for app ${app.id}`);
  return retryWithBackoff(
    async () => {
      // Fetch address from application record (robust fallback across schemas)
      const { data: appData, error: fetchError } = await sbAdmin
        .from('applications')
        .select('formatted_address, property_address')
        .eq('id', app.id)
        .single();
      
      const derivedAddress = appData?.formatted_address
        || (appData?.property_address && typeof appData.property_address === 'object'
            ? appData.property_address.formatted_address
            : null);
      
      if (fetchError || !derivedAddress) {
        throw { code: 'E003-1', message: 'Failed to fetch application address' };
      }
      
      console.log(`[doGeocodeAndParcel] Fetched address: ${derivedAddress}`);
      
      const response = await sbAdmin.functions.invoke('enrich-feasibility', {
        body: { 
          application_id: app.id,
          address: derivedAddress,
          mode: 'geocode_only'  // Only fetch geocode + parcel, skip flood/zoning validation
        }
      });
      
      if (response.error) {
        throw { code: 'E003-2', message: response.error.message || 'Parcel lookup failed' };
      }
      
      console.log(`[doGeocodeAndParcel] ✅ Geocode-only completed for ${app.id}`);
      return response.data;
    },
    MAX_ATTEMPTS,
    'E003'
  );
}

async function enrichOverlays(app: any) {
  console.log(`[enrichOverlays] Starting for app ${app.id}`);
  
  // Check if we have coordinates - proceed even without parcel
  const hasCoordinates = app.geo_lat && app.geo_lng;
  if (!hasCoordinates) {
    throw { code: 'E402-1', message: 'Missing coordinates - cannot enrich utilities' };
  }
  
  return retryWithBackoff(
    async () => {
      const response = await sbAdmin.functions.invoke('enrich-utilities', {
        body: { application_id: app.id }
      });
      
      if (response.error) {
        throw { code: 'E402-2', message: response.error.message || 'Utilities API failed' };
      }
      
      // Check if utilities function returned failure flags (but with 200 status)
      const data = response.data;
      if (data && data.success === false) {
        console.warn(`[enrichOverlays] Utilities enrichment failed with flags:`, data.flags);
        // Don't throw - continue with partial/failed data
        // The validation phase will catch critical missing data
      }
      
      return data;
    },
    MAX_ATTEMPTS,
    'E402'
  );
}

async function runFeasibilityAI(app: any) {
  console.log(`[runFeasibilityAI] Starting for app ${app.id}`);
  return retryWithBackoff(
    async () => {
      const response = await sbAdmin.functions.invoke('generate-ai-report', {
        body: { application_id: app.id }
      });
      
      if (response.error) throw new Error(response.error.message || 'AI generation failed');
      
      const json = response.data;
      
      // Validate JSON schema
      const { data: isValid, error } = await sbAdmin.rpc('validate_report_json_schema', { 
        data: json 
      });
      
      if (error || !isValid) {
        throw new Error('JSON schema validation failed');
      }
      
      return json;
    },
    MAX_ATTEMPTS,
    'E901'
  );
}

async function renderAndStorePDF(app: any) {
  console.log(`[renderAndStorePDF] Starting for app ${app.id}`);
  return retryWithBackoff(
    async () => {
      const response = await sbAdmin.functions.invoke('generate-pdf', {
        body: { application_id: app.id }
      });
      
      if (response.error) throw new Error(response.error.message || 'PDF render failed');
      return response.data;
    },
    MAX_ATTEMPTS,
    'E999'
  );
}

async function validateData(app: any) {
  console.log(`[validateData] Validating critical data for app ${app.id}`);
  
  // Check for critical data completeness
  const hasGeocode = app.geo_lat && app.geo_lng;
  const hasParcel = app.parcel_id || app.enrichment_metadata?.parcel_geometry;
  const hasWater = (
    app.enrichment_metadata?.water_laterals_count > 0 ||
    app.enrichment_metadata?.water_count > 0
  );
  const hasSewer = (
    app.enrichment_metadata?.sewer_gravity_count > 0 ||
    app.enrichment_metadata?.sewer_force_count > 0 ||
    app.enrichment_metadata?.sewer_count > 0
  );
  const hasZoning = app.zoning_category || app.enrichment_metadata?.zoning;
  const hasFlood = app.floodplain_zone || app.enrichment_metadata?.flood_zone;
  
  const missingCritical = [];
  if (!hasGeocode) missingCritical.push('geocode');
  if (!hasParcel) missingCritical.push('parcel');
  if (!hasWater) missingCritical.push('utilities.water');
  if (!hasSewer) missingCritical.push('utilities.sewer');
  if (!hasZoning) missingCritical.push('zoning');
  if (!hasFlood) missingCritical.push('flood');
  
  // Check for critical error flags
  const criticalFlags = [
    'geocode_failed',
    'parcel_not_found',
    'critical_utilities_missing',
    'critical_feasibility_data_missing',
    'utilities_api_timeout',
    'zoning_unavailable',
    'flood_data_error'
  ];
  
  const hasCriticalErrors = (app.data_flags || []).some(
    (flag: string) => criticalFlags.includes(flag)
  );
  
  if (missingCritical.length > 0 || hasCriticalErrors) {
    console.error(`[validateData] Validation FAILED for ${app.id}:`, {
      missingCritical,
      hasCriticalErrors,
      data_flags: app.data_flags
    });
    throw {
      code: 'E400',
      message: `Missing critical data: ${missingCritical.join(', ')}`,
      details: { missingCritical, hasCriticalErrors }
    };
  }
  
  console.log(`[validateData] ✅ Validation PASSED for ${app.id}`);
  return { isComplete: true, missingCritical: [], hasCriticalErrors: false };
}

// Main orchestration switch
async function orchestrate(appId: string): Promise<any> {
  const { data: app, error } = await sbAdmin
    .from('applications')
    .select('*')
    .eq('id', appId)
    .single();

  if (error || !app) {
    throw new Error(`Application not found: ${appId}`);
  }

  const currentRev = app.status_rev || 0;
  console.log(`[orchestrate] ${appId} - Current status: ${app.status}, rev: ${currentRev}`);

  try {
    switch (app.status) {
      case 'queued':
        console.log(`[orchestrate] ${appId} - Phase: Geocode & Parcel`);
        await doGeocodeAndParcel(app);
        await bump(appId, 'enriching', currentRev);
        // Continue immediately to next phase
        return orchestrate(appId);

      case 'enriching':
        console.log(`[orchestrate] ${appId} - Phase: Enrich Overlays`);
        await enrichOverlays(app);
        await bump(appId, 'validating', currentRev);
        return orchestrate(appId);

      case 'validating':
        console.log(`[orchestrate] ${appId} - Phase: Data Validation`);
        await validateData(app);
        await bump(appId, 'ai', currentRev);
        return orchestrate(appId);

      case 'ai':
        console.log(`[orchestrate] ${appId} - Phase: AI Analysis`);
        await runFeasibilityAI(app);
        await bump(appId, 'rendering', currentRev);
        return orchestrate(appId);

      case 'rendering':
        console.log(`[orchestrate] ${appId} - Phase: PDF Render`);
        await renderAndStorePDF(app);
        await bump(appId, 'complete', currentRev);
        return { ok: true, status: 'complete', application_id: appId };

      case 'complete':
        console.log(`[orchestrate] ${appId} - Already complete`);
        return { ok: true, status: 'complete', application_id: appId };

      case 'error':
        console.log(`[orchestrate] ${appId} - In error state, skipping`);
        return { 
          ok: false, 
          status: 'error', 
          error_code: app.error_code,
          application_id: appId 
        };

      default:
        throw new Error(`Unknown status: ${app.status}`);
    }
  } catch (err: any) {
    const errorCode = err.code || 'E999';
    const errorMessage = err.message || String(err);
    console.error(`[orchestrate] ${appId} - Error in phase ${app.status}:`, err);
    await bump(appId, 'error', currentRev, errorCode, errorMessage);
    throw err;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let appId = url.searchParams.get('application_id');

    // Fallback: accept application_id from POST/PUT body as well
    if (!appId && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      try {
        const body = await req.json();
        appId = body?.application_id || body?.app_id || null;
      } catch (_) {
        // ignore JSON parse errors here
      }
    }
    
    if (!appId) {
      return new Response(JSON.stringify({ error: 'Missing application_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' }
      });
    }

    console.log(`[orchestrate-application] Starting orchestration for ${appId}`);
    const result = await orchestrate(appId);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });
  } catch (err) {
    console.error('[orchestrate-application] Error:', err);
    return new Response(JSON.stringify({ 
      error: String(err),
      message: err instanceof Error ? err.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });
  }
});
