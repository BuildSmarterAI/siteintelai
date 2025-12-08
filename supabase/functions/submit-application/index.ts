import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = crypto.randomUUID().slice(0, 8);
  console.log(`📥 [TRACE:${traceId}] [SUBMIT] ================== APPLICATION SUBMISSION ==================`);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error(`❌ [TRACE:${traceId}] Auth error:`, authError?.message);
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ [TRACE:${traceId}] User authenticated: ${user.id}`);

    const { draftId } = await req.json();
    if (!draftId) {
      return new Response(JSON.stringify({ error: "draftId required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 [TRACE:${traceId}] Loading draft: ${draftId}`);

    // 1) Load draft
    const { data: draft, error: draftErr } = await supabase
      .from("applications_draft")
      .select("*")
      .eq("draft_id", draftId)
      .eq("user_id", user.id) // Ensure user owns this draft
      .single();

    if (draftErr || !draft) {
      console.error(`❌ [TRACE:${traceId}] Draft not found:`, draftErr?.message);
      return new Response(
        JSON.stringify({ error: "Draft not found or access denied" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 [TRACE:${traceId}] Draft loaded:`, {
      parcel_id: draft.parcel_id,
      parcel_source_id: draft.parcel_source_id,
      intent_type: draft.intent_type,
      current_step: draft.current_step
    });

    // 2) Basic server-side validation
    if (!draft.parcel_id && !draft.drawn_parcel_id) {
      return new Response(
        JSON.stringify({ error: "Parcel not set on draft application" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract contact info from draft
    const contactInfo = draft.contact_info as Record<string, unknown> || {};
    const propertyInfo = draft.property_info as Record<string, unknown> || {};
    const projectIntent = draft.project_intent as Record<string, unknown> || {};
    const finalQuestions = draft.final_questions as Record<string, unknown> || {};

    // Validate required consents from contact_info
    const ndaConsent = contactInfo.nda_confidentiality === true;
    const contactConsent = contactInfo.consent_contact === true;
    const privacyConsent = contactInfo.consent_terms_privacy === true;

    if (!ndaConsent || !contactConsent || !privacyConsent) {
      console.error(`❌ [TRACE:${traceId}] Missing consents:`, { ndaConsent, contactConsent, privacyConsent });
      return new Response(
        JSON.stringify({ error: "All consents must be granted" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3) Build dataset_version_summary from GIS provenance
    const gisProvenance = draft.gis_provenance as Record<string, unknown> || {};
    const datasetVersionSummary: Record<string, unknown> = {};
    
    // Extract dataset versions from provenance if available
    if (gisProvenance.layers && Array.isArray(gisProvenance.layers)) {
      for (const layer of gisProvenance.layers) {
        if (layer.dataset_key && layer.dataset_version) {
          datasetVersionSummary[layer.dataset_key] = {
            version: layer.dataset_version,
            fetched_at: layer.fetched_at || new Date().toISOString()
          };
        }
      }
    }

    // 4) Build override_stats from application_overrides
    const { data: overrides } = await supabase
      .from("application_overrides")
      .select("field_name, delta_percent, source_dataset")
      .eq("application_draft_id", draftId);

    const overrideStats: Record<string, unknown> = {
      total_overrides: overrides?.length || 0,
      by_field: {} as Record<string, number>,
      by_source: {} as Record<string, number>
    };

    if (overrides && overrides.length > 0) {
      for (const override of overrides) {
        // Count by field
        const fieldKey = override.field_name || 'unknown';
        (overrideStats.by_field as Record<string, number>)[fieldKey] = 
          ((overrideStats.by_field as Record<string, number>)[fieldKey] || 0) + 1;
        
        // Count by source
        const sourceKey = override.source_dataset || 'unknown';
        (overrideStats.by_source as Record<string, number>)[sourceKey] = 
          ((overrideStats.by_source as Record<string, number>)[sourceKey] || 0) + 1;
      }
    }

    console.log(`📊 [TRACE:${traceId}] Dataset summary:`, datasetVersionSummary);
    console.log(`📊 [TRACE:${traceId}] Override stats:`, overrideStats);

    // 5) Insert final application
    const applicationPayload = {
      user_id: draft.user_id,
      
      // Contact info
      full_name: contactInfo.full_name as string || '',
      company: contactInfo.company as string || '',
      email: contactInfo.email as string || '',
      phone: contactInfo.phone as string || '',
      
      // Consents
      nda_confidentiality: ndaConsent,
      consent_contact: contactConsent,
      consent_terms_privacy: privacyConsent,
      marketing_opt_in: contactInfo.marketing_opt_in === true,
      
      // Property info
      intent_type: draft.intent_type,
      parcel_id: draft.parcel_id,
      parcel_source_id: draft.parcel_source_id,
      
      // Location data from property_info
      geo_lat: propertyInfo.geo_lat as number || null,
      geo_lng: propertyInfo.geo_lng as number || null,
      formatted_address: propertyInfo.formatted_address as string || null,
      city: propertyInfo.city as string || null,
      county: propertyInfo.county as string || null,
      postal_code: propertyInfo.postal_code as string || null,
      administrative_area_level_1: propertyInfo.state as string || 'TX',
      
      // Project details
      project_type: projectIntent.project_types as string[] || [],
      ownership_status: projectIntent.ownership_status as string || 'unknown',
      existing_improvements: projectIntent.existing_improvements as string || 'unknown',
      stories_height: projectIntent.stories_height as string || 'unknown',
      quality_level: projectIntent.quality_level as string || 'standard',
      heard_about: finalQuestions.heard_about as string || 'unknown',
      additional_notes: finalQuestions.additional_notes as string || null,
      
      // GIS/Coverage metadata
      coverage_flags: draft.coverage_flags,
      gis_provenance: draft.gis_provenance,
      dataset_version_summary: datasetVersionSummary,
      override_stats: overrideStats,
      
      // Scores from draft
      initial_feasibility_score: draft.initial_feasibility_score,
      
      // Status
      status: 'pending',
      enrichment_status: 'pending',
    };

    console.log(`📝 [TRACE:${traceId}] Creating application with payload:`, {
      user_id: applicationPayload.user_id,
      parcel_id: applicationPayload.parcel_id,
      intent_type: applicationPayload.intent_type,
      geo_lat: applicationPayload.geo_lat,
      geo_lng: applicationPayload.geo_lng
    });

    const { data: app, error: appErr } = await supabase
      .from("applications")
      .insert(applicationPayload)
      .select("id")
      .single();

    if (appErr || !app) {
      console.error(`❌ [TRACE:${traceId}] Failed to create application:`, appErr?.message);
      throw appErr ?? new Error("Failed to create application");
    }

    const applicationId = app.id;
    console.log(`✅ [TRACE:${traceId}] Application created: ${applicationId}`);

    // 6) Mark draft as submitted
    await supabase
      .from("applications_draft")
      .update({ 
        submitted_at: new Date().toISOString(),
        application_id: applicationId
      })
      .eq("draft_id", draftId);

    // 7) Link any overrides to the final application
    if (overrides && overrides.length > 0) {
      await supabase
        .from("application_overrides")
        .update({ application_id: applicationId })
        .eq("application_draft_id", draftId);
    }

    // 8) Trigger orchestrate-application for enrichment pipeline
    console.log(`🚀 [TRACE:${traceId}] Triggering orchestrate-application for ${applicationId}`);
    
    try {
      const orchestrateResponse = await supabase.functions.invoke('orchestrate-application', {
        body: { application_id: applicationId }
      });
      
      if (orchestrateResponse.error) {
        console.error(`⚠️ [TRACE:${traceId}] Orchestration trigger failed:`, orchestrateResponse.error);
        // Don't fail the submission - orchestration can be retried
      } else {
        console.log(`✅ [TRACE:${traceId}] Orchestration triggered successfully`);
      }
    } catch (orchErr) {
      console.error(`⚠️ [TRACE:${traceId}] Orchestration invoke error:`, orchErr);
      // Don't fail - application is created, enrichment can be retried
    }

    console.log(`✅ [TRACE:${traceId}] [SUBMIT] ================== SUBMISSION COMPLETE ==================`);

    return new Response(
      JSON.stringify({ 
        applicationId,
        trace_id: traceId,
        message: "Application submitted successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error(`❌ [TRACE:${traceId}] submit-application error:`, err);
    return new Response(
      JSON.stringify({ error: "Internal error", trace_id: traceId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
