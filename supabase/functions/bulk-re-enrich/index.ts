import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log('[bulk-re-enrich] Starting bulk re-enrichment for failed applications');

    // Find all applications with:
    // 1. enrichment_status = 'failed' OR error_code starts with 'E003'
    // 2. Have valid geo_lat and geo_lng (can skip geocode phase)
    const { data: failedApps, error: queryError } = await sbAdmin
      .from('applications')
      .select('id, formatted_address, geo_lat, geo_lng, parcel_id, error_code, enrichment_status, created_at')
      .or('error_code.like.E003%,enrichment_status.eq.failed')
      .not('geo_lat', 'is', null)
      .not('geo_lng', 'is', null)
      .order('created_at', { ascending: false });

    if (queryError) {
      console.error('[bulk-re-enrich] Query error:', queryError);
      throw new Error(`Failed to query applications: ${queryError.message}`);
    }

    if (!failedApps || failedApps.length === 0) {
      console.log('[bulk-re-enrich] No failed applications with coordinates found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No failed applications with coordinates found',
          count: 0,
          applications: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[bulk-re-enrich] Found ${failedApps.length} applications to re-enrich:`, {
      with_error_code: failedApps.filter(a => a.error_code).length,
      with_failed_status: failedApps.filter(a => a.enrichment_status === 'failed').length
    });

    const results = [];
    for (const app of failedApps) {
      try {
        console.log(`[bulk-re-enrich] Processing ${app.id} - ${app.formatted_address}`);

        // Reset to enriching status (skip geocode phase since we have coordinates)
        const { error: updateError } = await sbAdmin
          .from('applications')
          .update({
            status: 'enriching',
            status_percent: 40,
            error_code: null,
            error_message: null,
            attempts: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', app.id);

        if (updateError) {
          console.error(`[bulk-re-enrich] Failed to reset ${app.id}:`, updateError);
          results.push({
            id: app.id,
            address: app.formatted_address,
            success: false,
            error: updateError.message
          });
          continue;
        }

        // Trigger utilities enrichment directly
        const { error: enrichError } = await sbAdmin.functions.invoke('enrich-utilities', {
          body: { application_id: app.id }
        });

        if (enrichError) {
          console.error(`[bulk-re-enrich] Enrichment failed for ${app.id}:`, enrichError);
          results.push({
            id: app.id,
            address: app.formatted_address,
            success: false,
            error: enrichError.message
          });
          continue;
        }

        // Trigger orchestration to continue through validation/AI/PDF
        const { error: orchestrateError } = await sbAdmin.functions.invoke('orchestrate-application', {
          body: { application_id: app.id }
        });

        if (orchestrateError) {
          console.warn(`[bulk-re-enrich] Orchestration warning for ${app.id}:`, orchestrateError);
          // Still mark as success since enrichment worked
        }

        results.push({
          id: app.id,
          address: app.formatted_address,
          success: true
        });

        console.log(`[bulk-re-enrich] ✅ Re-enriched ${app.id}`);
      } catch (err) {
        console.error(`[bulk-re-enrich] Error processing ${app.id}:`, err);
        results.push({
          id: app.id,
          address: app.formatted_address,
          success: false,
          error: String(err)
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[bulk-re-enrich] Complete: ${successCount}/${failedApps.length} successful`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Re-enriched ${successCount}/${failedApps.length} applications`,
        count: failedApps.length,
        successCount,
        applications: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[bulk-re-enrich] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : String(error) 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
