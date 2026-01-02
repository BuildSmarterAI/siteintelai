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
  ai: 75,
  rendering: 90,
  complete: 100,
  error: 0
};

// Exponential backoff config
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 2000; // 2s, 4s, 8s

// ===== CIRCUIT BREAKER CONFIG =====
// Maximum retry attempts before marking application as permanently failed
const MAX_APPLICATION_ATTEMPTS = 3;

// API call budget per application - PREVENTS RUNAWAY API COSTS
// Normal enrichment uses ~30-50 API calls, set budget at 150 for buffer
const MAX_API_CALLS_PER_APPLICATION = 150;

// Generate short trace ID for request correlation
function generateTraceId(): string {
  return crypto.randomUUID().slice(0, 8);
}

async function bump(
  appId: string, 
  newStatus: string, 
  currentRev: number,
  traceId: string,
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
    console.error(`[TRACE:${traceId}] [bump] Failed to update status for ${appId}:`, error);
    throw new Error(`Failed to bump status: ${error.message}`);
  }

  console.log(`[TRACE:${traceId}] [bump] ${appId}: ${newStatus} (${STATE_PROGRESS[newStatus]}%)`);

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
  errorCode: string,
  traceId: string
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      console.error(`[TRACE:${traceId}] [retry] Attempt ${i + 1}/${attempts} failed:`, err);
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

/**
 * Verify that required data was written to the database after an enrichment phase
 */
async function verifyDataWritten(
  appId: string, 
  requiredFields: string[], 
  traceId: string
): Promise<{ success: boolean; data: any; missing: string[] }> {
  const { data, error } = await sbAdmin
    .from('applications')
    .select(requiredFields.join(','))
    .eq('id', appId)
    .single();
  
  if (error || !data) {
    console.error(`❌ [TRACE:${traceId}] [VERIFY] Failed to verify data for ${appId}:`, error);
    return { success: false, data: null, missing: requiredFields };
  }
  
  const missing = requiredFields.filter(field => data[field] === null || data[field] === undefined);
  
  if (missing.length > 0) {
    console.warn(`⚠️ [TRACE:${traceId}] [VERIFY] Missing fields for ${appId}:`, missing);
    return { success: false, data, missing };
  }
  
  console.log(`✅ [TRACE:${traceId}] [VERIFY] All required fields present for ${appId}:`, requiredFields);
  return { success: true, data, missing: [] };
}

/**
 * Re-fetch application data from database to get latest state after enrichment
 */
async function refreshAppData(appId: string, traceId: string): Promise<any> {
  console.log(`🔄 [TRACE:${traceId}] [REFRESH] Re-fetching app data for ${appId}...`);
  
  const { data: freshApp, error } = await sbAdmin
    .from('applications')
    .select('*')
    .eq('id', appId)
    .single();
  
  if (error || !freshApp) {
    console.error(`❌ [TRACE:${traceId}] [REFRESH] Failed to re-fetch app data:`, error);
    throw new Error(`Failed to refresh app data: ${error?.message || 'Not found'}`);
  }
  
  console.log(`✅ [TRACE:${traceId}] [REFRESH] Fresh app data retrieved:`, {
    id: freshApp.id,
    status: freshApp.status,
    geo_lat: freshApp.geo_lat,
    geo_lng: freshApp.geo_lng,
    has_coords: !!(freshApp.geo_lat && freshApp.geo_lng),
    parcel_id: freshApp.parcel_id,
    county: freshApp.county,
    city: freshApp.city,
    enrichment_status: freshApp.enrichment_status
  });
  
  return freshApp;
}

// Phase implementations (call existing edge functions)
async function doGeocodeAndParcel(app: any, traceId: string) {
  console.log(`🗺️ [TRACE:${traceId}] [doGeocodeAndParcel] ================== ENTRY ==================`);
  console.log(`🗺️ [TRACE:${traceId}] [doGeocodeAndParcel] Starting full enrichment for app ${app.id}`);
  console.log(`🗺️ [TRACE:${traceId}] [doGeocodeAndParcel] Initial app state:`, {
    geo_lat: app.geo_lat,
    geo_lng: app.geo_lng,
    has_coords: !!(app.geo_lat && app.geo_lng),
    parcel_id: app.parcel_id,
    county: app.county,
    formatted_address: app.formatted_address?.substring(0, 50)
  });
  
  const phaseStart = Date.now();
  
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
        console.error(`❌ [TRACE:${traceId}] [doGeocodeAndParcel] Failed to fetch address:`, fetchError);
        throw { code: 'E003-1', message: 'Failed to fetch application address' };
      }
      
      console.log(`📍 [TRACE:${traceId}] [doGeocodeAndParcel] Fetched address: ${derivedAddress}`);
      console.log(`📤 [TRACE:${traceId}] [doGeocodeAndParcel] Invoking enrich-feasibility with:`, {
        application_id: app.id,
        address: derivedAddress.substring(0, 50) + '...',
        trace_id: traceId
      });
      
      const response = await sbAdmin.functions.invoke('enrich-feasibility', {
        body: { 
          application_id: app.id,
          address: derivedAddress,
          trace_id: traceId
        }
      });
      
      if (response.error) {
        console.error(`❌ [TRACE:${traceId}] [doGeocodeAndParcel] enrich-feasibility failed:`, response.error);
        throw { code: 'E003-2', message: response.error.message || 'Parcel lookup failed' };
      }
      
      console.log(`📥 [TRACE:${traceId}] [doGeocodeAndParcel] enrich-feasibility response:`, {
        success: response.data?.success,
        has_data: !!response.data?.data,
        data_flags: response.data?.data_flags
      });
      
      // CRITICAL: Verify coordinates were written to database
      const verification = await verifyDataWritten(app.id, ['geo_lat', 'geo_lng'], traceId);
      
      if (!verification.success) {
        console.error(`❌ [TRACE:${traceId}] [doGeocodeAndParcel] POST-ENRICHMENT VERIFICATION FAILED:`, {
          missing: verification.missing,
          data: verification.data
        });
        throw { code: 'E003-VERIFY', message: `enrich-feasibility did not write coordinates. Missing: ${verification.missing.join(', ')}` };
      }
      
      console.log(`✅ [TRACE:${traceId}] [doGeocodeAndParcel] Post-enrichment verification PASSED:`, {
        geo_lat: verification.data?.geo_lat,
        geo_lng: verification.data?.geo_lng,
        has_coords: !!(verification.data?.geo_lat && verification.data?.geo_lng)
      });
      
      // Fetch elevation immediately after coordinates are available
      console.log(`🏔️ [TRACE:${traceId}] [doGeocodeAndParcel] Fetching elevation...`);
      try {
        const { data: appCoords } = await sbAdmin
          .from('applications')
          .select('geo_lat, geo_lng, enrichment_metadata')
          .eq('id', app.id)
          .single();
        
        if (appCoords?.geo_lat && appCoords?.geo_lng) {
          const elevResponse = await sbAdmin.functions.invoke('fetch-elevation', {
            body: { 
              lat: appCoords.geo_lat, 
              lng: appCoords.geo_lng, 
              application_id: app.id,
              trace_id: traceId
            }
          });
          
          if (elevResponse.data?.elevation_ft) {
            // Update application with elevation data
            const { error: updateErr } = await sbAdmin
              .from('applications')
              .update({ 
                elevation: elevResponse.data.elevation_ft,
                enrichment_metadata: {
                  ...(appCoords.enrichment_metadata || {}),
                  elevation_ft: elevResponse.data.elevation_ft,
                  elevation_source: elevResponse.data.source,
                  elevation_resolution: elevResponse.data.resolution
                }
              })
              .eq('id', app.id);
            
            if (!updateErr) {
              console.log(`✅ [TRACE:${traceId}] [doGeocodeAndParcel] Elevation: ${elevResponse.data.elevation_ft} ft (${elevResponse.data.source})`);
            }
          }
        }
      } catch (elevErr) {
        console.warn(`⚠️ [TRACE:${traceId}] [doGeocodeAndParcel] Elevation fetch failed (non-blocking):`, elevErr);
        // Don't throw - elevation is nice-to-have, not critical
      }
      
      const elapsed = Date.now() - phaseStart;
      console.log(`🗺️ [TRACE:${traceId}] [doGeocodeAndParcel] ================== EXIT ==================`);
      console.log(`🗺️ [TRACE:${traceId}] [doGeocodeAndParcel] Phase complete in ${elapsed}ms`);
      
      return response.data;
    },
    MAX_ATTEMPTS,
    'E003',
    traceId
  );
}

async function enrichOverlays(app: any, traceId: string) {
  console.log(`🔌 [TRACE:${traceId}] [enrichOverlays] ================== ENTRY ==================`);
  console.log(`🔌 [TRACE:${traceId}] [enrichOverlays] Starting for app ${app.id}`);
  
  // CRITICAL: Re-fetch app data to get fresh coordinates after enrich-feasibility
  const freshApp = await refreshAppData(app.id, traceId);
  
  console.log(`🔍 [TRACE:${traceId}] [enrichOverlays] Fresh app data for utilities:`, {
    geo_lat: freshApp.geo_lat,
    geo_lng: freshApp.geo_lng,
    has_coords: !!(freshApp.geo_lat && freshApp.geo_lng),
    county: freshApp.county,
    city: freshApp.city
  });
  
  // Check if we have coordinates - proceed even without parcel
  const hasCoordinates = freshApp.geo_lat && freshApp.geo_lng;
  if (!hasCoordinates) {
    console.error(`❌ [TRACE:${traceId}] [enrichOverlays] CRITICAL: Missing coordinates after enrich-feasibility`, {
      expected: 'geo_lat and geo_lng should have been populated by enrich-feasibility',
      actual: { geo_lat: freshApp.geo_lat, geo_lng: freshApp.geo_lng }
    });
    throw { code: 'E402-1', message: 'Missing coordinates - cannot enrich utilities. enrich-feasibility did not write coordinates.' };
  }
  
  const phaseStart = Date.now();
  
  // LENIENT UTILITIES ENRICHMENT: Catch all errors and continue with empty utilities
  // This ensures utility API failures don't block report generation
  try {
    console.log(`📤 [TRACE:${traceId}] [enrichOverlays] Invoking enrich-utilities with:`, {
      application_id: freshApp.id,
      trace_id: traceId
    });
    
    const response = await sbAdmin.functions.invoke('enrich-utilities', {
      body: { 
        application_id: freshApp.id,
        trace_id: traceId
      }
    });
    
    if (response.error) {
      console.warn(`⚠️ [TRACE:${traceId}] [enrichOverlays] enrich-utilities failed, continuing with empty utilities:`, response.error);
      
      // Update data_flags to indicate utility enrichment failed but continue
      await sbAdmin
        .from('applications')
        .update({
          data_flags: [...(freshApp.data_flags || []), 'utilities_api_error'],
          utilities_summary: { water: 0, sewer: 0, storm: 0, error: true }
        })
        .eq('id', freshApp.id);
      
      const elapsed = Date.now() - phaseStart;
      console.log(`🔌 [TRACE:${traceId}] [enrichOverlays] ================== EXIT (with warnings) ==================`);
      console.log(`🔌 [TRACE:${traceId}] [enrichOverlays] Phase complete in ${elapsed}ms (utilities unavailable)`);
      
      return { utilities: { water: 0, sewer: 0, storm: 0 }, success: false, error: response.error.message };
    }
    
    const utilsData = response.data;
    
    console.log(`📥 [TRACE:${traceId}] [enrichOverlays] enrich-utilities response:`, {
      success: utilsData?.success,
      utilities: utilsData?.utilities,
      flags: utilsData?.flags
    });
    
    // Check if we got ANY utility data (partial success is still success!)
    const hasAnyUtilities = 
      (utilsData?.utilities?.water || 0) > 0 ||
      (utilsData?.utilities?.sewer || 0) > 0 ||
      (utilsData?.utilities?.storm || 0) > 0;
    
    if (hasAnyUtilities || utilsData?.success) {
      console.log(`✅ [TRACE:${traceId}] [enrichOverlays] Utilities retrieved (may be partial):`, utilsData?.utilities);
    } else {
      // Truly no utilities at all - log warning but don't fail
      console.warn(`⚠️ [TRACE:${traceId}] [enrichOverlays] No utilities available - continuing anyway`);
    }
    
    const elapsed = Date.now() - phaseStart;
    console.log(`🔌 [TRACE:${traceId}] [enrichOverlays] ================== EXIT ==================`);
    console.log(`🔌 [TRACE:${traceId}] [enrichOverlays] Phase complete in ${elapsed}ms`);
    
    return utilsData || { utilities: { water: 0, sewer: 0, storm: 0 }, success: false };
    
  } catch (err: any) {
    // CATCH ALL: Any exception should not block the pipeline
    console.warn(`⚠️ [TRACE:${traceId}] [enrichOverlays] Exception caught, continuing with empty utilities:`, err);
    
    // Update data_flags to indicate utility enrichment failed
    try {
      await sbAdmin
        .from('applications')
        .update({
          data_flags: [...(freshApp.data_flags || []), 'utilities_exception'],
          utilities_summary: { water: 0, sewer: 0, storm: 0, error: true }
        })
        .eq('id', freshApp.id);
    } catch (updateErr) {
      console.warn(`⚠️ [TRACE:${traceId}] [enrichOverlays] Failed to update data_flags:`, updateErr);
    }
    
    const elapsed = Date.now() - phaseStart;
    console.log(`🔌 [TRACE:${traceId}] [enrichOverlays] ================== EXIT (exception handled) ==================`);
    console.log(`🔌 [TRACE:${traceId}] [enrichOverlays] Phase complete in ${elapsed}ms (utilities unavailable due to exception)`);
    
    return { utilities: { water: 0, sewer: 0, storm: 0 }, success: false, error: String(err) };
  }
}

async function enrichTraffic(app: any, traceId: string) {
  console.log(`🚗 [TRACE:${traceId}] [enrichTraffic] ================== ENTRY ==================`);
  console.log(`🚗 [TRACE:${traceId}] [enrichTraffic] Starting for app ${app.id}`);
  
  const phaseStart = Date.now();
  
  // Re-fetch app data to get fresh coordinates
  const freshApp = await refreshAppData(app.id, traceId);
  
  if (!freshApp.geo_lat || !freshApp.geo_lng) {
    console.warn(`⚠️ [TRACE:${traceId}] [enrichTraffic] Missing coordinates, skipping`);
    return { success: false, error: 'Missing coordinates' };
  }
  
  try {
    console.log(`📤 [TRACE:${traceId}] [enrichTraffic] Invoking enrich-traffic with:`, {
      application_id: freshApp.id,
      trace_id: traceId
    });
    
    const response = await sbAdmin.functions.invoke('enrich-traffic', {
      body: { 
        application_id: freshApp.id,
        trace_id: traceId
      }
    });
    
    if (response.error) {
      console.warn(`⚠️ [TRACE:${traceId}] [enrichTraffic] enrich-traffic failed, continuing:`, response.error);
      
      // Update data_flags to indicate traffic enrichment failed but continue
      await sbAdmin
        .from('applications')
        .update({
          data_flags: [...(freshApp.data_flags || []), 'traffic_api_error']
        })
        .eq('id', freshApp.id);
      
      return { success: false, error: response.error.message };
    }
    
    const trafficData = response.data;
    
    console.log(`📥 [TRACE:${traceId}] [enrichTraffic] enrich-traffic response:`, {
      success: trafficData?.success,
      aadt: trafficData?.traffic_aadt,
      road_class: trafficData?.road_classification,
      peak_hour: trafficData?.peak_hour_volume
    });
    
    const elapsed = Date.now() - phaseStart;
    console.log(`🚗 [TRACE:${traceId}] [enrichTraffic] ================== EXIT ==================`);
    console.log(`🚗 [TRACE:${traceId}] [enrichTraffic] Phase complete in ${elapsed}ms`);
    
    return trafficData || { success: false };
    
  } catch (err: any) {
    console.warn(`⚠️ [TRACE:${traceId}] [enrichTraffic] Exception caught, continuing:`, err);
    
    try {
      await sbAdmin
        .from('applications')
        .update({
          data_flags: [...(freshApp.data_flags || []), 'traffic_exception']
        })
        .eq('id', freshApp.id);
    } catch (updateErr) {
      console.warn(`⚠️ [TRACE:${traceId}] [enrichTraffic] Failed to update data_flags:`, updateErr);
    }
    
    return { success: false, error: String(err) };
  }
}

/**
 * Census Moat: Enrich application with comprehensive demographics from BigQuery
 * Provides 83+ ACS variables and 6 proprietary CRE indices
 */
async function enrichCensusData(app: any, traceId: string) {
  console.log(`📊 [TRACE:${traceId}] [enrichCensusData] ================== ENTRY ==================`);
  
  const phaseStart = Date.now();
  
  // Re-fetch app to get latest coordinates
  const freshApp = await refreshAppData(app.id, traceId);
  
  if (!freshApp.geo_lat || !freshApp.geo_lng) {
    console.warn(`⚠️ [TRACE:${traceId}] [enrichCensusData] Missing coordinates, skipping census enrichment`);
    return { success: false, error: 'Missing coordinates' };
  }
  
  try {
    console.log(`📤 [TRACE:${traceId}] [enrichCensusData] Invoking enrich-census-canonical with:`, {
      application_id: freshApp.id,
      lat: freshApp.geo_lat,
      lng: freshApp.geo_lng,
      trace_id: traceId
    });
    
    const response = await sbAdmin.functions.invoke('enrich-census-canonical', {
      body: { 
        application_id: freshApp.id,
        lat: freshApp.geo_lat,
        lng: freshApp.geo_lng,
        trace_id: traceId
      }
    });
    
    if (response.error) {
      console.warn(`⚠️ [TRACE:${traceId}] [enrichCensusData] enrich-census-canonical failed (non-blocking):`, response.error);
      
      // Update data_flags to indicate census enrichment failed but continue
      await sbAdmin
        .from('applications')
        .update({
          data_flags: [...(freshApp.data_flags || []), 'census_enrichment_failed']
        })
        .eq('id', freshApp.id);
      
      return { success: false, error: response.error.message };
    }
    
    const censusData = response.data;
    
    console.log(`📥 [TRACE:${traceId}] [enrichCensusData] enrich-census-canonical response:`, {
      success: censusData?.success,
      source: censusData?.source,
      geoid: censusData?.geoid,
      has_indices: !!(censusData?.data?.retail_spending_index || censusData?.retail_spending_index)
    });
    
    const elapsed = Date.now() - phaseStart;
    console.log(`📊 [TRACE:${traceId}] [enrichCensusData] ================== EXIT ==================`);
    console.log(`📊 [TRACE:${traceId}] [enrichCensusData] Phase complete in ${elapsed}ms, source: ${censusData?.source || 'unknown'}`);
    
    return censusData || { success: false };
    
  } catch (err: any) {
    console.warn(`⚠️ [TRACE:${traceId}] [enrichCensusData] Exception caught (non-blocking):`, err);
    
    try {
      await sbAdmin
        .from('applications')
        .update({
          data_flags: [...(freshApp.data_flags || []), 'census_exception']
        })
        .eq('id', freshApp.id);
    } catch (updateErr) {
      console.warn(`⚠️ [TRACE:${traceId}] [enrichCensusData] Failed to update data_flags:`, updateErr);
    }
    
    return { success: false, error: String(err) };
  }
}

async function runFeasibilityAI(app: any, traceId: string) {
  console.log(`🤖 [TRACE:${traceId}] [runFeasibilityAI] ================== ENTRY ==================`);
  console.log(`🤖 [TRACE:${traceId}] [runFeasibilityAI] Starting for app ${app.id}`);
  
  const phaseStart = Date.now();
  
  return retryWithBackoff(
    async () => {
      console.log(`📤 [TRACE:${traceId}] [runFeasibilityAI] Invoking generate-ai-report...`);
      
      const response = await sbAdmin.functions.invoke('generate-ai-report', {
        body: { 
          application_id: app.id,
          trace_id: traceId
        }
      });
      
      if (response.error) {
        console.error(`❌ [TRACE:${traceId}] [runFeasibilityAI] generate-ai-report failed:`, response.error);
        throw new Error(response.error.message || 'AI generation failed');
      }
      
      const json = response.data;
      
      console.log(`📥 [TRACE:${traceId}] [runFeasibilityAI] AI report generated successfully`);
      
      // Schema validation is now NON-BLOCKING with graceful fallback
      // If validation fails, we still proceed with the report
      try {
        const { data: isValid, error } = await sbAdmin.rpc('validate_report_json_schema', { 
          data: json 
        });
        
        if (error) {
          console.warn(`⚠️ [TRACE:${traceId}] [runFeasibilityAI] Schema validation RPC error (non-blocking):`, error.message);
          // Log warning but don't throw - report is still usable
        } else if (!isValid) {
          console.warn(`⚠️ [TRACE:${traceId}] [runFeasibilityAI] Schema validation returned false (non-blocking)`);
          // Log warning but don't throw - report generation succeeded, just schema mismatch
        } else {
          console.log(`✅ [TRACE:${traceId}] [runFeasibilityAI] Schema validation passed`);
        }
      } catch (validationErr) {
        // RPC might not exist or throw - this is non-blocking
        console.warn(`⚠️ [TRACE:${traceId}] [runFeasibilityAI] Schema validation unavailable (non-blocking):`, validationErr);
      }
      
      const elapsed = Date.now() - phaseStart;
      console.log(`🤖 [TRACE:${traceId}] [runFeasibilityAI] ================== EXIT ==================`);
      console.log(`🤖 [TRACE:${traceId}] [runFeasibilityAI] Phase complete in ${elapsed}ms`);
      
      return json;
    },
    MAX_ATTEMPTS,
    'E901',
    traceId
  );
}

async function renderAndStorePDF(app: any, traceId: string) {
  console.log(`📄 [TRACE:${traceId}] [renderAndStorePDF] ================== ENTRY ==================`);
  console.log(`📄 [TRACE:${traceId}] [renderAndStorePDF] Starting for app ${app.id}`);
  
  const phaseStart = Date.now();
  
  return retryWithBackoff(
    async () => {
      console.log(`📤 [TRACE:${traceId}] [renderAndStorePDF] Invoking generate-pdf...`);
      
      const response = await sbAdmin.functions.invoke('generate-pdf', {
        body: { 
          application_id: app.id,
          trace_id: traceId
        }
      });
      
      if (response.error) {
        console.error(`❌ [TRACE:${traceId}] [renderAndStorePDF] generate-pdf failed:`, response.error);
        throw new Error(response.error.message || 'PDF render failed');
      }
      
      const elapsed = Date.now() - phaseStart;
      console.log(`📄 [TRACE:${traceId}] [renderAndStorePDF] ================== EXIT ==================`);
      console.log(`📄 [TRACE:${traceId}] [renderAndStorePDF] Phase complete in ${elapsed}ms`);
      
      return response.data;
    },
    MAX_ATTEMPTS,
    'E999',
    traceId
  );
}

async function validateData(app: any, traceId: string) {
  console.log(`✅ [TRACE:${traceId}] [validateData] Validating critical data for app ${app.id}`);
  
  // CRITICAL: Re-fetch app data to get latest state
  const freshApp = await refreshAppData(app.id, traceId);
  
  // Check for critical data completeness
  const hasGeocode = freshApp.geo_lat && freshApp.geo_lng;
  const hasParcel = freshApp.parcel_id || freshApp.enrichment_metadata?.parcel_geometry;
  const hasWater = (
    freshApp.enrichment_metadata?.water_laterals_count > 0 ||
    freshApp.enrichment_metadata?.water_count > 0
  );
  const hasSewer = (
    freshApp.enrichment_metadata?.sewer_gravity_count > 0 ||
    freshApp.enrichment_metadata?.sewer_force_count > 0 ||
    freshApp.enrichment_metadata?.sewer_count > 0
  );
  const hasAnyUtility = hasWater || hasSewer;
  const hasZoning = freshApp.zoning_category || freshApp.enrichment_metadata?.zoning;
  const hasFlood = freshApp.floodplain_zone || freshApp.enrichment_metadata?.flood_zone;
  
  console.log(`🔍 [TRACE:${traceId}] [validateData] Data presence check:`, {
    hasGeocode,
    hasParcel,
    hasWater,
    hasSewer,
    hasAnyUtility,
    hasZoning,
    hasFlood
  });
  
  const missingCritical: string[] = [];
  if (!hasGeocode) missingCritical.push('geocode');

  // Parcel is IMPORTANT but not always available; treat as non-blocking.
  if (!hasParcel) {
    console.warn(`⚠️ [TRACE:${traceId}] [validateData] No parcel data available, continuing with partial report...`);

    // Ensure we record a flag for downstream UI/reporting.
    const nextFlags = Array.from(new Set([...(freshApp.data_flags || []), 'parcel_not_found']));
    try {
      await sbAdmin
        .from('applications')
        .update({ data_flags: nextFlags })
        .eq('id', freshApp.id);
    } catch (flagErr) {
      console.warn(`⚠️ [TRACE:${traceId}] [validateData] Failed to persist parcel_not_found flag:`, flagErr);
    }
  }

  // Utilities, zoning, and flood are optional - log warnings but don't fail
  if (!hasAnyUtility) {
    console.warn(`⚠️ [TRACE:${traceId}] [validateData] No utility data available, but continuing...`);
  }
  if (!hasZoning) {
    console.warn(`⚠️ [TRACE:${traceId}] [validateData] No zoning data available (Houston has no zoning), continuing...`);
  }
  if (!hasFlood) {
    console.warn(`⚠️ [TRACE:${traceId}] [validateData] No flood data available, continuing...`);
  }

  // Only geocode is truly critical for proceeding.
  const criticalFlags = ['geocode_failed'];

  const hasCriticalErrors = (freshApp.data_flags || []).some(
    (flag: string) => criticalFlags.includes(flag)
  );

  if (missingCritical.length > 0 || hasCriticalErrors) {
    console.error(`❌ [TRACE:${traceId}] [validateData] Validation FAILED for ${freshApp.id}:`, {
      missingCritical,
      hasCriticalErrors,
      data_flags: freshApp.data_flags
    });
    throw {
      code: 'E400',
      message: `Missing critical data: ${missingCritical.join(', ')}`,
      details: { missingCritical, hasCriticalErrors }
    };
  }

  console.log(`✅ [TRACE:${traceId}] [validateData] Validation PASSED for ${freshApp.id}`);
  return { isComplete: true, missingCritical: [], hasCriticalErrors: false };
}

// Main orchestration switch
async function orchestrate(appId: string, traceId: string): Promise<any> {
  console.log(`🔄 [TRACE:${traceId}] [orchestrate] ================== ORCHESTRATION START ==================`);
  
  const orchestrationMetrics = {
    start: Date.now(),
    phases: {} as Record<string, number>
  };
  
  const { data: app, error } = await sbAdmin
    .from('applications')
    .select('*')
    .eq('id', appId)
    .single();

  if (error || !app) {
    console.error(`❌ [TRACE:${traceId}] [orchestrate] Application not found: ${appId}`);
    throw new Error(`Application not found: ${appId}`);
  }

  const currentRev = app.status_rev || 0;
  const currentAttempts = app.attempts || 0;
  
  // ===== CIRCUIT BREAKER: Check if app has exceeded max attempts =====
  if (currentAttempts >= MAX_APPLICATION_ATTEMPTS) {
    console.error(`⛔ [TRACE:${traceId}] [orchestrate] CIRCUIT BREAKER TRIGGERED: App ${appId} has ${currentAttempts} attempts (max: ${MAX_APPLICATION_ATTEMPTS})`);
    
    await sbAdmin
      .from('applications')
      .update({
        status: 'error_permanent',
        error_code: 'MAX_RETRIES_EXCEEDED',
        updated_at: new Date().toISOString()
      })
      .eq('id', appId);
    
    throw new Error(`Application exceeded max retry attempts: ${currentAttempts}/${MAX_APPLICATION_ATTEMPTS}`);
  }
  
  // ===== API BUDGET CHECK: Count recent API calls for this application =====
  // Count is limited to a rolling 24h window so historic logs don't permanently block re-runs.
  const budgetWindowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: apiCallCount, error: countError } = await sbAdmin
    .from('api_logs')
    .select('*', { count: 'exact', head: true })
    .eq('application_id', appId)
    .gte('timestamp', budgetWindowStart);

  if (!countError && apiCallCount !== null && apiCallCount >= MAX_API_CALLS_PER_APPLICATION) {
    console.error(`💸 [TRACE:${traceId}] [orchestrate] API BUDGET EXCEEDED: App ${appId} has ${apiCallCount} API calls (24h, max: ${MAX_API_CALLS_PER_APPLICATION})`);
    
    await sbAdmin
      .from('applications')
      .update({
        status: 'error',
        error_code: 'API_BUDGET_EXCEEDED',
        data_flags: [...(app.data_flags || []), 'api_budget_exceeded'],
        updated_at: new Date().toISOString()
      })
      .eq('id', appId);
    
    throw new Error(`Application exceeded API budget: ${apiCallCount}/${MAX_API_CALLS_PER_APPLICATION} calls`);
  }
  
  console.log(`📊 [TRACE:${traceId}] [orchestrate] Budget check: ${apiCallCount || 0}/${MAX_API_CALLS_PER_APPLICATION} API calls used`);
  // ===== END BUDGET CHECK =====
  
  console.log(`🔄 [TRACE:${traceId}] [orchestrate] Application State:`, JSON.stringify({
    id: app.id,
    status: app.status,
    status_rev: currentRev,
    attempts: currentAttempts,
    api_calls_used: apiCallCount || 0,
    geo_lat: app.geo_lat,
    geo_lng: app.geo_lng,
    has_coords: !!(app.geo_lat && app.geo_lng),
    parcel_id: app.parcel_id,
    county: app.county,
    city: app.city,
    enrichment_status: app.enrichment_status,
    data_flags: app.data_flags
  }, null, 2));

  try {
    switch (app.status) {
      case 'queued': {
        console.log(`🔄 [TRACE:${traceId}] [orchestrate] ========== PHASE: queued → enriching ==========`);
        const phaseStart = Date.now();
        
        await doGeocodeAndParcel(app, traceId);
        
        orchestrationMetrics.phases['geocode_parcel'] = Date.now() - phaseStart;
        
        await bump(appId, 'enriching', currentRev, traceId);
        // Continue immediately to next phase
        return orchestrate(appId, traceId);
      }

      case 'enriching': {
        console.log(`🔄 [TRACE:${traceId}] [orchestrate] ========== PHASE: enriching → ai ==========`);
        const phaseStart = Date.now();
        
        // Enrich utilities (water, sewer, storm)
        await enrichOverlays(app, traceId);
        
        orchestrationMetrics.phases['enrich_overlays'] = Date.now() - phaseStart;
        
        // Enrich traffic data (AADT, roadway classification, peak hour)
        console.log(`🔄 [TRACE:${traceId}] [orchestrate] Running traffic enrichment...`);
        const trafficStart = Date.now();
        await enrichTraffic(app, traceId);
        orchestrationMetrics.phases['enrich_traffic'] = Date.now() - trafficStart;
        
        // CENSUS MOAT: Enrich demographics from BigQuery (83+ variables + proprietary indices)
        console.log(`📊 [TRACE:${traceId}] [orchestrate] Running Census Moat enrichment...`);
        const censusStart = Date.now();
        await enrichCensusData(app, traceId);
        orchestrationMetrics.phases['enrich_census'] = Date.now() - censusStart;
        
        // Validate data before moving to AI phase
        console.log(`🔄 [TRACE:${traceId}] [orchestrate] Running data validation...`);
        const validationStart = Date.now();
        await validateData(app, traceId);
        orchestrationMetrics.phases['validation'] = Date.now() - validationStart;
        
        await bump(appId, 'ai', currentRev, traceId);
        return orchestrate(appId, traceId);
      }

      case 'ai': {
        console.log(`🔄 [TRACE:${traceId}] [orchestrate] ========== PHASE: ai → rendering ==========`);
        const phaseStart = Date.now();
        
        await runFeasibilityAI(app, traceId);
        
        orchestrationMetrics.phases['ai_generation'] = Date.now() - phaseStart;
        
        await bump(appId, 'rendering', currentRev, traceId);
        return orchestrate(appId, traceId);
      }

      case 'rendering': {
        console.log(`🔄 [TRACE:${traceId}] [orchestrate] ========== PHASE: rendering → complete ==========`);
        const phaseStart = Date.now();
        
        // PDF generation is NON-BLOCKING - attempt but don't fail the whole pipeline
        try {
          await renderAndStorePDF(app, traceId);
          console.log(`✅ [TRACE:${traceId}] PDF generated successfully`);
        } catch (pdfErr: any) {
          console.warn(`⚠️ [TRACE:${traceId}] PDF generation failed (non-blocking):`, pdfErr?.message || pdfErr);
          // Add flag indicating PDF failed but continue to complete
          const existingFlags = app.data_flags || [];
          await sbAdmin
            .from('applications')
            .update({
              data_flags: [...existingFlags, 'pdf_generation_failed']
            })
            .eq('id', appId);
        }
        
        orchestrationMetrics.phases['pdf_render'] = Date.now() - phaseStart;
        
        // ALWAYS proceed to complete - the UI report is ready, PDF is optional
        await bump(appId, 'complete', currentRev, traceId);
        
        // Log final timing metrics
        orchestrationMetrics.phases['total'] = Date.now() - orchestrationMetrics.start;
        console.log(`⏱️ [TRACE:${traceId}] [orchestrate] ================== TIMING METRICS ==================`);
        console.log(`⏱️ [TRACE:${traceId}] [orchestrate] Phase Timings:`, orchestrationMetrics.phases);
        console.log(`⏱️ [TRACE:${traceId}] [orchestrate] Total Duration: ${orchestrationMetrics.phases['total']}ms`);
        
        return { ok: true, status: 'complete', application_id: appId, trace_id: traceId };
      }

      case 'complete':
        console.log(`✅ [TRACE:${traceId}] [orchestrate] Already complete`);
        return { ok: true, status: 'complete', application_id: appId, trace_id: traceId };

      case 'error': {
        // Error recovery: allow retry if attempts < MAX_ATTEMPTS
        const attempts = app.attempts || 0;
        if (attempts < MAX_ATTEMPTS) {
          console.log(`🔄 [TRACE:${traceId}] [orchestrate] Retrying from error state (attempt ${attempts + 1}/${MAX_ATTEMPTS})`);
          
          // Increment attempts and reset to queued for fresh retry
          await sbAdmin
            .from('applications')
            .update({ 
              status: 'queued', 
              status_rev: currentRev + 1,
              attempts: attempts + 1,
              error_code: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', appId);
          
          // Restart orchestration from queued
          return orchestrate(appId, traceId);
        }
        
        console.log(`❌ [TRACE:${traceId}] [orchestrate] In error state after ${MAX_ATTEMPTS} attempts, giving up`);
        return { 
          ok: false, 
          status: 'error', 
          error_code: app.error_code,
          attempts: attempts,
          application_id: appId,
          trace_id: traceId
        };
      }

      default:
        throw new Error(`Unknown status: ${app.status}`);
    }
  } catch (err: any) {
    const errorCode = err.code || 'E999';
    const errorMessage = err.message || String(err);
    console.error(`❌ [TRACE:${traceId}] [orchestrate] Error in phase ${app.status}:`, {
      error_code: errorCode,
      error_message: errorMessage,
      error_details: err.details || null
    });
    await bump(appId, 'error', currentRev, traceId, errorCode, errorMessage);
    throw err;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Generate trace ID for this orchestration run
  const traceId = generateTraceId();

  try {
    const url = new URL(req.url);
    let appId = url.searchParams.get('application_id');
    let forceRetry = url.searchParams.get('force_retry') === 'true';

    // Fallback: accept application_id from POST/PUT body as well
    if (!appId && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      try {
        const body = await req.json();
        appId = body?.application_id || body?.app_id || null;
        forceRetry = forceRetry || body?.force_retry === true;
      } catch (_) {
        // ignore JSON parse errors here
      }
    }
    
    // If force_retry is set, reset the application to queued state first
    if (appId && forceRetry) {
      console.log(`🔄 [TRACE:${traceId}] [orchestrate-application] Force retry requested, resetting to queued`);
      await sbAdmin
        .from('applications')
        .update({ 
          status: 'queued', 
          status_rev: 0,
          attempts: 0,
          error_code: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', appId);
    }
    
    if (!appId) {
      console.error(`❌ [TRACE:${traceId}] [orchestrate-application] Missing application_id`);
      return new Response(JSON.stringify({ error: 'Missing application_id', trace_id: traceId }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' }
      });
    }

    console.log(`📥 [TRACE:${traceId}] [orchestrate-application] ================== REQUEST RECEIVED ==================`);
    console.log(`📥 [TRACE:${traceId}] [orchestrate-application] Starting orchestration for ${appId}`);
    console.log(`📥 [TRACE:${traceId}] [orchestrate-application] Timestamp: ${new Date().toISOString()}`);
    
    // ===== IDEMPOTENCY CHECK: Verify application is not already being processed =====
    const { data: appCheck, error: checkError } = await sbAdmin
      .from('applications')
      .select('status, orchestration_lock_at, status_rev')
      .eq('id', appId)
      .single();
    
    if (checkError || !appCheck) {
      console.error(`❌ [TRACE:${traceId}] [orchestrate-application] Application not found: ${appId}`);
      return new Response(JSON.stringify({ error: 'Application not found', trace_id: traceId }), {
        status: 404,
        headers: { ...corsHeaders, 'content-type': 'application/json' }
      });
    }
    
    // Check if already in a terminal or advanced state (skip if not queued/pending)
    const processingStates = ['enriching', 'ai', 'rendering'];
    const terminalStates = ['complete', 'error', 'error_permanent'];
    
    if (terminalStates.includes(appCheck.status)) {
      console.log(`⏭️ [TRACE:${traceId}] [orchestrate-application] App already in terminal state: ${appCheck.status}, skipping`);
      return new Response(JSON.stringify({ 
        skipped: true, 
        reason: `Already in terminal state: ${appCheck.status}`,
        trace_id: traceId 
      }), {
        headers: { ...corsHeaders, 'content-type': 'application/json' }
      });
    }
    
    // Check orchestration lock - if locked within last 5 minutes by another process, skip
    if (appCheck.orchestration_lock_at && !forceRetry) {
      const lockAge = Date.now() - new Date(appCheck.orchestration_lock_at).getTime();
      const lockAgeMinutes = lockAge / 1000 / 60;
      
      if (lockAgeMinutes < 5 && processingStates.includes(appCheck.status)) {
        console.log(`🔒 [TRACE:${traceId}] [orchestrate-application] App locked ${lockAgeMinutes.toFixed(1)} min ago and in ${appCheck.status}, skipping duplicate`);
        return new Response(JSON.stringify({ 
          skipped: true, 
          reason: `Orchestration in progress (locked ${lockAgeMinutes.toFixed(1)} min ago)`,
          trace_id: traceId 
        }), {
          headers: { ...corsHeaders, 'content-type': 'application/json' }
        });
      }
    }
    
    // Acquire/refresh the orchestration lock
    const { error: lockError } = await sbAdmin
      .from('applications')
      .update({ orchestration_lock_at: new Date().toISOString() })
      .eq('id', appId);
    
    if (lockError) {
      console.warn(`⚠️ [TRACE:${traceId}] [orchestrate-application] Failed to acquire lock, proceeding anyway`);
    }
    
    const result = await orchestrate(appId, traceId);
    
    console.log(`📤 [TRACE:${traceId}] [orchestrate-application] ================== REQUEST COMPLETE ==================`);
    console.log(`📤 [TRACE:${traceId}] [orchestrate-application] Result:`, result);
    
    return new Response(JSON.stringify({ ...result, trace_id: traceId }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });
  } catch (err) {
    console.error(`❌ [TRACE:${traceId}] [orchestrate-application] Fatal Error:`, err);
    return new Response(JSON.stringify({ 
      error: String(err),
      message: err instanceof Error ? err.message : 'Unknown error',
      trace_id: traceId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });
  }
});
