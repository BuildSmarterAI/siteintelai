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

    // Parse request body - accept direct form data
    const body = await req.json();
    
    // Check if this is the new draft-based flow or legacy direct submission
    if (body.draftId) {
      // Draft-based submission flow
      return await handleDraftSubmission(supabase, user.id, body.draftId, traceId);
    }
    
    // Legacy direct submission flow - accept form data directly
    console.log(`📋 [TRACE:${traceId}] Processing direct form submission`);
    
    // Extract required fields from the body
    const {
      fullName,
      company,
      email,
      phone,
      propertyAddress,
      geoLat,
      geoLng,
      county,
      city,
      state,
      zipCode,
      parcelId,
      projectType,
      ownershipStatus,
      existingImprovements,
      storiesHeight,
      qualityLevel,
      ndaConfidentiality,
      consentContact,
      consentTermsPrivacy,
      marketingOptIn,
      heardAbout,
      additionalNotes,
      intentType,
      // Optional fields
      buildingSizeValue,
      buildingSizeUnit,
      desiredBudget,
      prototypeRequirements,
      accessPriorities,
      knownRisks,
      utilityAccess,
      environmentalConstraints,
      tenantRequirements,
      submarket,
      preferredContact,
      bestTime,
      drawnParcelGeometry,
      drawnParcelName,
      // GIS enriched fields
      situsAddress,
      parcelOwner,
      acreageCad,
      zoningCode,
      overlayDistrict,
      floodplainZone,
      baseFloodElevation,
      dataFlags,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      pageUrl,
    } = body;

    // Validate required property address - CRITICAL: prevents data-less submissions
    if (!propertyAddress || !geoLat || !geoLng) {
      console.error(`❌ [TRACE:${traceId}] Missing property address or coordinates:`, {
        propertyAddress: !!propertyAddress,
        geoLat: !!geoLat,
        geoLng: !!geoLng
      });
      return new Response(
        JSON.stringify({ 
          error: "Property address with coordinates is required",
          code: "MISSING_PROPERTY_ADDRESS",
          missing: {
            propertyAddress: !propertyAddress,
            geoLat: !geoLat,
            geoLng: !geoLng
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== IDEMPOTENCY CHECK: Prevent duplicate applications for same address =====
    // This stops the duplicate application problem that caused API cost explosion
    const formattedAddress = typeof propertyAddress === 'object' 
      ? propertyAddress.formatted_address 
      : propertyAddress;
    
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const { data: existingApps, error: dupeCheckError } = await supabase
      .from('applications')
      .select('id, status, created_at')
      .eq('user_id', user.id)
      .eq('formatted_address', formattedAddress)
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (!dupeCheckError && existingApps && existingApps.length > 0) {
      const existing = existingApps[0];
      console.log(`⚠️ [TRACE:${traceId}] Duplicate application detected:`, {
        existing_id: existing.id,
        existing_status: existing.status,
        created_at: existing.created_at
      });
      
      // If existing app is still processing, return it instead of creating duplicate
      if (['queued', 'enriching', 'ai', 'rendering'].includes(existing.status)) {
        return new Response(
          JSON.stringify({ 
            success: true,
            application_id: existing.id,
            message: "Application already in progress for this address",
            duplicate: true,
            status: existing.status
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // If existing app completed or errored, check if they really want another
      if (existing.status === 'complete') {
        return new Response(
          JSON.stringify({ 
            error: "A report for this address was already generated in the last 24 hours",
            code: "DUPLICATE_ADDRESS",
            existing_application_id: existing.id
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    // ===== END IDEMPOTENCY CHECK =====

    // Validate required consents
    if (!ndaConfidentiality || !consentContact || !consentTermsPrivacy) {
      console.error(`❌ [TRACE:${traceId}] Missing consents`);
      return new Response(
        JSON.stringify({ error: "All consents must be granted" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build application payload
    const applicationPayload: Record<string, unknown> = {
      user_id: user.id,
      
      // Contact info
      full_name: fullName || '',
      company: company || '',
      email: email || '',
      phone: phone || '',
      
      // Consents
      nda_confidentiality: ndaConfidentiality,
      consent_contact: consentContact,
      consent_terms_privacy: consentTermsPrivacy,
      marketing_opt_in: marketingOptIn || false,
      
      // Property info
      intent_type: intentType || null,
      parcel_id: parcelId || null,
      formatted_address: propertyAddress || null,
      geo_lat: geoLat || null,
      geo_lng: geoLng || null,
      city: city || null,
      county: county || null,
      postal_code: zipCode || null,
      administrative_area_level_1: state || 'TX',
      
      // Project details
      project_type: projectType || [],
      ownership_status: ownershipStatus || 'unknown',
      existing_improvements: existingImprovements || 'unknown',
      stories_height: storiesHeight || 'unknown',
      quality_level: qualityLevel || 'standard',
      building_size_value: buildingSizeValue ? parseFloat(buildingSizeValue) : null,
      building_size_unit: buildingSizeUnit || null,
      desired_budget: desiredBudget ? parseFloat(String(desiredBudget).replace(/[^0-9.]/g, '')) : null,
      prototype_requirements: prototypeRequirements || null,
      access_priorities: accessPriorities || [],
      known_risks: knownRisks || [],
      utility_access: utilityAccess || [],
      environmental_constraints: environmentalConstraints || [],
      tenant_requirements: tenantRequirements || null,
      submarket_enriched: submarket || null,
      
      // Final questions
      heard_about: heardAbout || 'unknown',
      preferred_contact: preferredContact || null,
      best_time: bestTime || null,
      additional_notes: additionalNotes || null,
      
      // GIS enriched data
      situs_address: situsAddress || null,
      parcel_owner: parcelOwner || null,
      acreage_cad: acreageCad ? parseFloat(acreageCad) : null,
      zoning_code: zoningCode || null,
      overlay_district: overlayDistrict || null,
      floodplain_zone: floodplainZone || null,
      base_flood_elevation: baseFloodElevation ? parseFloat(baseFloodElevation) : null,
      
      // Data flags for conflict tracking
      data_flags: dataFlags || null,
      
      // UTM tracking
      utm_source: utmSource || null,
      utm_medium: utmMedium || null,
      utm_campaign: utmCampaign || null,
      utm_term: utmTerm || null,
      page_url: pageUrl || null,
      
      // Status - use 'queued' which is valid per applications_status_check constraint
      status: 'queued',
      enrichment_status: 'pending',
    };

    console.log(`📝 [TRACE:${traceId}] Creating application:`, {
      user_id: user.id,
      parcel_id: parcelId,
      intent_type: intentType,
      geo_lat: geoLat,
      geo_lng: geoLng
    });

    // Handle drawn parcel if provided
    let drawnParcelId: string | null = null;
    if (drawnParcelGeometry) {
      console.log(`🖊️ [TRACE:${traceId}] Saving drawn parcel`);
      const { data: drawnParcel, error: drawnError } = await supabase
        .from("drawn_parcels")
        .insert({
          user_id: user.id,
          name: drawnParcelName || 'Custom Parcel',
          geometry: drawnParcelGeometry,
          source: 'application_form'
        })
        .select("id")
        .single();
      
      if (drawnError) {
        console.error(`⚠️ [TRACE:${traceId}] Failed to save drawn parcel:`, drawnError.message);
      } else {
        drawnParcelId = drawnParcel.id;
        console.log(`✅ [TRACE:${traceId}] Drawn parcel saved: ${drawnParcelId}`);
      }
    }

    // Insert application
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

    // Link drawn parcel to application if created
    if (drawnParcelId) {
      await supabase
        .from("drawn_parcels")
        .update({ application_id: applicationId })
        .eq("id", drawnParcelId);
    }

    // Trigger orchestrate-application for enrichment pipeline
    console.log(`🚀 [TRACE:${traceId}] Triggering orchestrate-application for ${applicationId}`);
    
    try {
      const orchestrateResponse = await supabase.functions.invoke('orchestrate-application', {
        body: { application_id: applicationId }
      });
      
      if (orchestrateResponse.error) {
        console.error(`⚠️ [TRACE:${traceId}] Orchestration trigger failed:`, orchestrateResponse.error);
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
        id: applicationId,
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

// Handle draft-based submission (for future use when draft workflow is fully implemented)
async function handleDraftSubmission(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  draftId: string,
  traceId: string
): Promise<Response> {
  console.log(`📋 [TRACE:${traceId}] Loading draft: ${draftId}`);

  // Load draft
  const { data: draft, error: draftErr } = await supabase
    .from("applications_draft")
    .select("*")
    .eq("draft_id", draftId)
    .eq("user_id", userId)
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

  // Basic server-side validation
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

  // Build dataset_version_summary from GIS provenance
  const gisProvenance = draft.gis_provenance as Record<string, unknown> || {};
  const datasetVersionSummary: Record<string, unknown> = {};
  
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

  // Build override_stats from application_overrides
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
      const fieldKey = override.field_name || 'unknown';
      (overrideStats.by_field as Record<string, number>)[fieldKey] = 
        ((overrideStats.by_field as Record<string, number>)[fieldKey] || 0) + 1;
      
      const sourceKey = override.source_dataset || 'unknown';
      (overrideStats.by_source as Record<string, number>)[sourceKey] = 
        ((overrideStats.by_source as Record<string, number>)[sourceKey] || 0) + 1;
    }
  }

  // Insert final application
  const applicationPayload = {
    user_id: draft.user_id,
    full_name: contactInfo.full_name as string || '',
    company: contactInfo.company as string || '',
    email: contactInfo.email as string || '',
    phone: contactInfo.phone as string || '',
    nda_confidentiality: ndaConsent,
    consent_contact: contactConsent,
    consent_terms_privacy: privacyConsent,
    marketing_opt_in: contactInfo.marketing_opt_in === true,
    intent_type: draft.intent_type,
    parcel_id: draft.parcel_id,
    parcel_source_id: draft.parcel_source_id,
    geo_lat: propertyInfo.geo_lat as number || null,
    geo_lng: propertyInfo.geo_lng as number || null,
    formatted_address: propertyInfo.formatted_address as string || null,
    city: propertyInfo.city as string || null,
    county: propertyInfo.county as string || null,
    postal_code: propertyInfo.postal_code as string || null,
    administrative_area_level_1: propertyInfo.state as string || 'TX',
    project_type: projectIntent.project_types as string[] || [],
    ownership_status: projectIntent.ownership_status as string || 'unknown',
    existing_improvements: projectIntent.existing_improvements as string || 'unknown',
    stories_height: projectIntent.stories_height as string || 'unknown',
    quality_level: projectIntent.quality_level as string || 'standard',
    heard_about: finalQuestions.heard_about as string || 'unknown',
    additional_notes: finalQuestions.additional_notes as string || null,
    coverage_flags: draft.coverage_flags,
    gis_provenance: draft.gis_provenance,
    dataset_version_summary: datasetVersionSummary,
    override_stats: overrideStats,
    initial_feasibility_score: draft.initial_feasibility_score,
    status: 'queued',
    enrichment_status: 'pending',
  };

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

  // Mark draft as submitted
  await supabase
    .from("applications_draft")
    .update({ 
      submitted_at: new Date().toISOString(),
      application_id: applicationId
    })
    .eq("draft_id", draftId);

  // Link any overrides to the final application
  if (overrides && overrides.length > 0) {
    await supabase
      .from("application_overrides")
      .update({ application_id: applicationId })
      .eq("application_draft_id", draftId);
  }

  // Trigger orchestrate-application for enrichment pipeline
  console.log(`🚀 [TRACE:${traceId}] Triggering orchestrate-application for ${applicationId}`);
  
  try {
    const orchestrateResponse = await supabase.functions.invoke('orchestrate-application', {
      body: { application_id: applicationId }
    });
    
    if (orchestrateResponse.error) {
      console.error(`⚠️ [TRACE:${traceId}] Orchestration trigger failed:`, orchestrateResponse.error);
    } else {
      console.log(`✅ [TRACE:${traceId}] Orchestration triggered successfully`);
    }
  } catch (orchErr) {
    console.error(`⚠️ [TRACE:${traceId}] Orchestration invoke error:`, orchErr);
  }

  console.log(`✅ [TRACE:${traceId}] [SUBMIT] ================== SUBMISSION COMPLETE ==================`);

  return new Response(
    JSON.stringify({ 
      id: applicationId,
      applicationId,
      trace_id: traceId,
      message: "Application submitted successfully"
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
