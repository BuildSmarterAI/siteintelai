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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { application_id, lat, lng } = await req.json();

    if (!application_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'application_id is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[admin-trigger-enrich] Starting for application: ${application_id}`);

    // Get application coordinates if not provided
    let appLat = lat;
    let appLng = lng;
    
    if (!appLat || !appLng) {
      const { data: app } = await supabase
        .from('applications')
        .select('geo_lat, geo_lng')
        .eq('id', application_id)
        .single();
      
      appLat = app?.geo_lat;
      appLng = app?.geo_lng;
    }

    if (!appLat || !appLng) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No coordinates found for application' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[admin-trigger-enrich] Coordinates: ${appLat}, ${appLng}`);

    // Call the demographics RPC directly
    const { data: demoData, error: demoError } = await supabase.rpc('get_demographics_for_point', {
      p_lat: appLat,
      p_lng: appLng
    });

    console.log(`[admin-trigger-enrich] Demographics RPC result:`, demoData, demoError);

    if (demoError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Demographics RPC failed',
        details: demoError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!demoData || demoData.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No canonical demographics found for location',
        lat: appLat,
        lng: appLng
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const demo = demoData[0];
    console.log(`[admin-trigger-enrich] Found canonical demographics:`, demo);

    // Update the application with Census Data Moat data
    // Map RPC field names to application column names
    const updatePayload: Record<string, unknown> = {
      demographics_source: 'census_moat',
      // Proprietary CRE indices
      retail_spending_index: demo.retail_spending_index,
      workforce_availability_score: demo.workforce_availability_score,
      growth_potential_index: demo.growth_potential_index,
      affluence_concentration: demo.affluence_concentration,
      labor_pool_depth: demo.labor_pool_depth,
      daytime_population_estimate: demo.daytime_population_estimate,
      // Growth metrics
      growth_trajectory: demo.growth_trajectory,
      market_outlook: demo.market_outlook,
      population_cagr: demo.population_cagr,
      growth_rate_5yr: demo.population_cagr, // Use CAGR as 5yr rate
      // Demographics - map RPC names to application column names
      median_income: demo.median_household_income, // RPC returns median_household_income
      median_home_value: demo.median_home_value,
      median_rent: demo.median_rent,
      vacancy_rate: demo.vacancy_rate,
      unemployment_rate: demo.unemployment_rate,
      median_age: demo.median_age,
      college_attainment_pct: demo.bachelors_pct, // RPC returns bachelors_pct
      total_housing_units: demo.total_housing_units,
      labor_force: demo.labor_force,
      population_density_sqmi: demo.population_density_sqmi,
      per_capita_income: demo.per_capita_income,
      mean_household_income: demo.mean_household_income,
      // Census reference
      census_block_group: demo.geoid,
      census_vintage: demo.acs_vintage || '2022',
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('applications')
      .update(updatePayload)
      .eq('id', application_id);

    if (updateError) {
      console.error(`[admin-trigger-enrich] Update failed:`, updateError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to update application',
        details: updateError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[admin-trigger-enrich] Successfully updated application with Census Data Moat`);

    return new Response(JSON.stringify({
      success: true,
      application_id,
      demographics_source: 'census_moat',
      indices: {
        retail_spending_index: demo.retail_spending_index,
        workforce_availability_score: demo.workforce_availability_score,
        growth_potential_index: demo.growth_potential_index,
        affluence_concentration: demo.affluence_concentration,
        labor_pool_depth: demo.labor_pool_depth,
        daytime_population_estimate: demo.daytime_population_estimate
      },
      growth: {
        growth_trajectory: demo.growth_trajectory,
        market_outlook: demo.market_outlook,
        population_cagr: demo.population_cagr
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[admin-trigger-enrich] Error:', error);
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
