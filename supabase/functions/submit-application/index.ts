import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const formData = await req.json();
    console.log('Received form submission:', formData);

    // Extract UTM parameters and page URL from headers/request
    const referer = req.headers.get('referer') || '';
    const userAgent = req.headers.get('user-agent') || '';
    
    // Prepare data for insertion
    const applicationData = {
      // Step 1: Contact Information
      full_name: formData.fullName,
      company: formData.company,
      email: formData.email,
      phone: formData.phone,
      
      // Step 2: Property Information
      property_address: formData.propertyAddress,
      parcel_id_apn: formData.parcelIdApn || null,
      lot_size_value: formData.lotSizeValue ? parseFloat(formData.lotSizeValue) : null,
      lot_size_unit: formData.lotSizeUnit || null,
      existing_improvements: formData.existingImprovements,
      zoning_classification: formData.zoningClassification || null,
      ownership_status: formData.ownershipStatus,
      
      // Step 3: Project Intent & Building Parameters
      project_type: formData.projectType || [],
      building_size_value: formData.buildingSizeValue ? parseFloat(formData.buildingSizeValue) : null,
      building_size_unit: formData.buildingSizeUnit || null,
      stories_height: formData.storiesHeight,
      prototype_requirements: formData.prototypeRequirements || null,
      quality_level: formData.qualityLevel,
      desired_budget: formData.desiredBudget ? parseFloat(formData.desiredBudget) : null,
      
      // Step 4: Market & Risks
      submarket: formData.submarket,
      access_priorities: formData.accessPriorities || [],
      known_risks: formData.knownRisks || [],
      utility_access: formData.utilityAccess || [],
      environmental_constraints: formData.environmentalConstraints || [],
      tenant_requirements: formData.tenantRequirements || null,
      
      // Step 5: Final Questions
      heard_about: formData.heardAbout,
      preferred_contact: formData.preferredContact || null,
      best_time: formData.bestTime || null,
      additional_notes: formData.additionalNotes || null,
      attachments: formData.attachments || null,
      
      // Consent & Legal
      nda_confidentiality: formData.ndaConfidentiality || true,
      consent_contact: formData.consentContact || true,
      consent_terms_privacy: formData.consentTermsPrivacy || true,
      marketing_opt_in: formData.marketingOptIn || false,
      
      // Tracking Fields
      utm_source: formData.utmSource || null,
      utm_medium: formData.utmMedium || null,
      utm_campaign: formData.utmCampaign || null,
      utm_term: formData.utmTerm || null,
      page_url: referer || formData.pageUrl || null,
    };

    // Insert into applications table
    const { data, error } = await supabaseClient
      .from('applications')
      .insert(applicationData)
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save application', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Application saved successfully:', data);

    return new Response(
      JSON.stringify({ 
        id: data.id,
        created_at: data.created_at,
        status: 'success',
        message: 'Application submitted successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in submit-application function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});