import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestData = await req.json();
    console.log('Received application submission:', requestData);

    // Extract UTM parameters and page URL from headers if available
    const utmSource = req.headers.get('utm-source') || requestData.utm_source;
    const utmMedium = req.headers.get('utm-medium') || requestData.utm_medium;
    const utmCampaign = req.headers.get('utm-campaign') || requestData.utm_campaign;
    const utmTerm = req.headers.get('utm-term') || requestData.utm_term;
    const pageUrl = req.headers.get('referer') || requestData.page_url || 'unknown';

    // Prepare the application data
    const applicationData = {
      // Step 1: Contact Information
      full_name: requestData.fullName,
      company: requestData.company,
      email: requestData.email,
      phone: requestData.phone,
      
      // Step 2: Property Information
      property_address: requestData.propertyAddress, // Should be JSONB object
      parcel_id_apn: requestData.parcelId || null,
      lot_size_value: requestData.lotSizeValue ? parseFloat(requestData.lotSizeValue) : null,
      lot_size_unit: requestData.lotSizeUnit || null,
      existing_improvements: requestData.existingImprovements,
      zoning_classification: requestData.zoningClassification || null,
      ownership_status: requestData.ownershipStatus,
      
      // Step 3: Project Intent & Building Parameters
      project_type: requestData.projectType || [], // Array
      building_size_value: requestData.buildingSizeValue ? parseFloat(requestData.buildingSizeValue) : null,
      building_size_unit: requestData.buildingSizeUnit || null,
      stories_height: requestData.storiesHeight,
      prototype_requirements: requestData.prototypeRequirements || null,
      quality_level: requestData.qualityLevel,
      desired_budget: requestData.desiredBudget ? parseFloat(requestData.desiredBudget) : null,
      
      // Step 4: Market & Risks
      submarket: requestData.submarket,
      access_priorities: requestData.accessPriorities || [], // Array
      known_risks: requestData.knownRisks || [], // Array
      utility_access: requestData.utilityAccess || [], // Array
      environmental_constraints: requestData.environmentalConstraints || [], // Array
      tenant_requirements: requestData.tenantRequirements || null,
      
      // Step 5: Final Questions
      heard_about: requestData.heardAbout,
      preferred_contact: requestData.preferredContact || null,
      best_time: requestData.bestTime || null,
      additional_notes: requestData.additionalNotes || null,
      attachments: requestData.attachments || null, // JSONB for file metadata
      
      // Consent & Legal
      nda_confidentiality: requestData.ndaConfidentiality !== false,
      consent_contact: requestData.consentContact !== false,
      consent_terms_privacy: requestData.consentTermsPrivacy !== false,
      marketing_opt_in: requestData.marketingOptIn === true,
      
      // Tracking Fields
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_term: utmTerm,
      page_url: pageUrl,
      submission_timestamp: new Date().toISOString(),
    };

    console.log('Inserting application data:', applicationData);

    // Insert the application into the database
    const { data, error } = await supabase
      .from('applications')
      .insert(applicationData)
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Database insertion error:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to submit application',
        details: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Application submitted successfully:', data);

    // Return success response
    return new Response(JSON.stringify({
      id: data.id,
      created_at: data.created_at,
      status: 'success',
      message: 'Application submitted successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in submit-application function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});