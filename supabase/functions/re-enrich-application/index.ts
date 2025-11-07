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

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized: No auth token provided' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader);
    if (userError || !user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized: Invalid token' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user has admin role
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized: Admin role required' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const { application_id } = await req.json();

    if (!application_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'application_id is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Re-enriching application: ${application_id}`);

    // Fetch the application to get its address
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select('formatted_address, property_address')
      .eq('id', application_id)
      .single();

    if (fetchError || !application) {
      console.error('Application not found:', fetchError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Application not found',
        details: fetchError?.message 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the address to re-enrich
    const address = application.formatted_address || 
                    (application.property_address && typeof application.property_address === 'object' 
                      ? application.property_address.formatted_address 
                      : null);

    if (!address) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No valid address found for this application' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Re-enriching address: ${address}`);

    // Reset status to allow orchestration to run from the beginning
    const { error: resetError } = await supabase
      .from('applications')
      .update({ 
        status: 'queued',
        error_code: null,
        attempts: 0,
        data_flags: []
      })
      .eq('id', application_id);

    if (resetError) {
      console.error('Failed to reset application status:', resetError);
    }

    // Call orchestrate-application to run the full enrichment pipeline with validation
    const { data: enrichmentResult, error: enrichmentError } = await supabase.functions.invoke(
      'orchestrate-application',
      {
        body: {
          application_id: application_id
        }
      }
    );

    if (enrichmentError) {
      console.error('Enrichment failed:', enrichmentError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Enrichment failed',
        details: enrichmentError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Re-enrichment completed successfully');

    return new Response(JSON.stringify({
      success: true,
      application_id: application_id,
      enrichment_result: enrichmentResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in re-enrich-application function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
