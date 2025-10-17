import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// EPA ECHO All-Programs Facility Search API
// Research doc: Section 2.8 - EPA ECHO Facility Proximity (1-Mile Radius)
const EPA_ECHO_URL = "https://echo.epa.gov/tools/web-services/facility_search";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { application_id, lat, lng } = await req.json();
    
    if (!lat || !lng) {
      throw new Error('Latitude and longitude are required');
    }

    console.log(`[EPA ECHO] Searching facilities near ${lat}, ${lng} (1-mile radius)`);

    // Query EPA ECHO for facilities within 1-mile radius
    const params = new URLSearchParams({
      output: 'JSON',
      p_lat: String(lat),
      p_long: String(lng),
      p_radius: '1', // 1 mile
      p_program: 'all' // All programs (NPDES, RCRA, Air, etc.)
    });

    const response = await fetch(`${EPA_ECHO_URL}?${params}`);
    
    if (!response.ok) {
      console.error(`EPA ECHO API error: ${response.status}`);
      throw new Error(`EPA ECHO API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Parse results per research doc Section 2.8
    const facilitiesCount = data.Results?.QueryRows || 0;
    const facilities = data.Results?.FacilitiesReturned || [];
    
    const nearestFacility = facilities.length > 0 ? facilities[0] : null;
    const nearestDist = nearestFacility?.Distance || null;
    const nearestType = nearestFacility?.FacProgramDesc || null;

    console.log(`[EPA ECHO] Found ${facilitiesCount} facilities`);
    if (nearestFacility) {
      console.log(`[EPA ECHO] Nearest: ${nearestFacility.FacName} (${nearestDist} mi, ${nearestType})`);
    }

    // Update application record if application_id provided
    if (application_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error: updateError } = await supabase
        .from('applications')
        .update({
          epa_facilities_count: facilitiesCount,
          nearest_facility_dist: nearestDist,
          nearest_facility_type: nearestType,
          updated_at: new Date().toISOString()
        })
        .eq('id', application_id);

      if (updateError) {
        console.error('Failed to update application:', updateError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      epa_facilities_count: facilitiesCount,
      nearest_facility_dist: nearestDist,
      nearest_facility_type: nearestType,
      facilities: facilities.slice(0, 10) // Return top 10 for reference
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('EPA ECHO enrichment error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        epa_facilities_count: null,
        nearest_facility_dist: null,
        nearest_facility_type: null
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
