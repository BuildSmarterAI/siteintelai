import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { formData, currentStep, draftId } = await req.json();
    
    console.log('[SAVE-DRAFT] Saving draft for user:', user.id);

    // Calculate completion percentage based on filled fields
    const requiredFields = [
      'fullName', 'company', 'email', 'phone', // Step 1
      'propertyAddress', // Step 2
      'projectType', // Step 3
      // Steps 4-5 are optional
    ];
    
    const filledFields = requiredFields.filter(field => {
      const value = formData[field];
      return value && (Array.isArray(value) ? value.length > 0 : value.toString().trim() !== '');
    });
    
    const completionPercent = Math.round((filledFields.length / requiredFields.length) * 100);

    // Prepare draft data
    const draftData = {
      user_id: user.id,
      enrichment_status: 'draft',
      draft_saved_at: new Date().toISOString(),
      full_name: formData.fullName || null,
      company: formData.company || null,
      email: formData.email || null,
      phone: formData.phone || null,
      intent_type: formData.intentType || null,
      property_address: formData.propertyAddress ? { text: formData.propertyAddress } : null,
      formatted_address: formData.propertyAddress || null,
      ownership_status: 'not_specified',
      geo_lat: formData.geoLat || null,
      geo_lng: formData.geoLng || null,
      county: formData.county || null,
      city: formData.city || null,
      administrative_area_level_1: formData.state || null,
      postal_code: formData.zipCode || null,
      neighborhood: formData.neighborhood || null,
      sublocality: formData.sublocality || null,
      place_id: formData.placeId || null,
      project_type: formData.projectType || [],
      building_size_value: formData.buildingSize ? parseFloat(formData.buildingSize) : null,
      building_size_unit: formData.buildingSizeUnit || null,
      stories_height: formData.stories || '',
      prototype_requirements: formData.prototypeRequirements || null,
      quality_level: formData.qualityLevel || 'standard',
      desired_budget: formData.budget ? parseFloat(formData.budget.replace(/[^0-9.]/g, '')) : null,
      parcel_id: formData.parcelId || null,
      acreage_cad: formData.lotSize ? parseFloat(formData.lotSize) : null,
      zoning_code: formData.zoning || null,
      heard_about: formData.hearAboutUs || 'not_specified',
      preferred_contact: formData.contactMethod || null,
      best_time: formData.bestTime || null,
      additional_notes: formData.additionalNotes || null,
      nda_confidentiality: formData.ndaConsent || false,
      consent_contact: formData.contactConsent || false,
      consent_terms_privacy: formData.privacyConsent || false,
      marketing_opt_in: formData.marketingOptIn || false,
      existing_improvements: 'unknown',
    };

    let result;
    if (draftId) {
      // Update existing draft
      const { data, error } = await supabaseClient
        .from('applications')
        .update(draftData)
        .eq('id', draftId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new draft
      const { data, error } = await supabaseClient
        .from('applications')
        .insert([draftData])
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    console.log('[SAVE-DRAFT] Draft saved successfully:', result.id);

    return new Response(
      JSON.stringify({
        draft_id: result.id,
        lastSaved: result.draft_saved_at,
        completionPercent,
        currentStep,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SAVE-DRAFT] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
