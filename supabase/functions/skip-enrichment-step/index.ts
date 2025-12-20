import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SkipRequest {
  applicationId: string;
  step: string;
}

const VALID_STEPS = [
  'parcel',
  'utilities',
  'traffic',
  'demographics',
  'wetlands',
  'epa',
  'fema',
];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { applicationId, step }: SkipRequest = await req.json();

    if (!applicationId || !step) {
      return new Response(
        JSON.stringify({ error: 'applicationId and step are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!VALID_STEPS.includes(step)) {
      return new Response(
        JSON.stringify({ error: `Invalid step. Valid steps: ${VALID_STEPS.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[skip-enrichment-step] Skipping ${step} for application ${applicationId}`);

    // Fetch current application state
    const { data: app, error: fetchError } = await supabase
      .from('applications')
      .select('id, status, enrichment_status, status_percent, data_flags, enrichment_metadata')
      .eq('id', applicationId)
      .single();

    if (fetchError || !app) {
      console.error(`[skip-enrichment-step] Application not found:`, fetchError);
      return new Response(
        JSON.stringify({ error: 'Application not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build updated data_flags with skipped step info
    const currentFlags = (app.data_flags as Record<string, unknown>) || {};
    const skippedSteps = (currentFlags.skipped_steps as string[]) || [];
    
    if (!skippedSteps.includes(step)) {
      skippedSteps.push(step);
    }

    const updatedFlags = {
      ...currentFlags,
      skipped_steps: skippedSteps,
      [`${step}_skipped_at`]: new Date().toISOString(),
    };

    // Update enrichment_metadata to mark step as skipped
    const currentMetadata = (app.enrichment_metadata as Record<string, unknown>) || {};
    const updatedMetadata = {
      ...currentMetadata,
      [`${step}_status`]: 'skipped',
      [`${step}_skipped_at`]: new Date().toISOString(),
    };

    // Reset status to allow pipeline to continue
    const { error: updateError } = await supabase
      .from('applications')
      .update({
        status: 'queued',
        enrichment_status: 'pending',
        error_code: null,
        data_flags: updatedFlags,
        enrichment_metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error(`[skip-enrichment-step] Failed to update application:`, updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update application' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[skip-enrichment-step] Successfully skipped ${step}, triggering orchestration`);

    // Trigger orchestration to continue pipeline
    const { error: invokeError } = await supabase.functions.invoke('orchestrate-application', {
      body: { applicationId },
    });

    if (invokeError) {
      console.warn(`[skip-enrichment-step] Warning: Failed to trigger orchestration:`, invokeError);
      // Don't fail - the cron job will pick it up
    }

    // Log to pipeline_phase_metrics
    try {
      await supabase.from('pipeline_phase_metrics').insert({
        application_id: applicationId,
        phase: `skip_${step}`,
        status: 'success',
        duration_ms: 0,
        metadata: { skipped_by: 'admin', reason: 'manual_skip' },
      });
    } catch (logError) {
      console.warn(`[skip-enrichment-step] Failed to log metric:`, logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Skipped ${step} step for application ${applicationId}`,
        skippedSteps,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[skip-enrichment-step] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
