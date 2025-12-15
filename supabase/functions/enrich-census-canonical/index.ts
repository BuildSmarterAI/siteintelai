import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DemographicsResult {
  success: boolean;
  source: "canonical" | "census_api" | "fallback";
  geoid?: string;
  data?: any;
  error?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log("[enrich-census-canonical] Starting demographics lookup...");

  try {
    const { lat, lng, application_id } = await req.json();

    if (!lat || !lng) {
      throw new Error("lat and lng are required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[enrich-census-canonical] Looking up demographics for (${lat}, ${lng})`);

    // Call the RPC function for spatial lookup
    const { data: canonicalData, error: rpcError } = await supabase
      .rpc("get_demographics_for_point", { p_lat: lat, p_lng: lng });

    if (rpcError) {
      console.error("[enrich-census-canonical] RPC error:", rpcError);
    }

    // If we have canonical data, return it
    if (canonicalData && canonicalData.length > 0) {
      const row = canonicalData[0];
      const elapsedMs = Date.now() - startTime;

      console.log(`[enrich-census-canonical] Found canonical data for geoid ${row.geoid} in ${elapsedMs}ms`);

      const result: DemographicsResult = {
        success: true,
        source: "canonical",
        geoid: row.geoid,
        data: {
          // Core identification
          census_block_group: row.geoid,
          census_vintage: row.acs_vintage,
          county_fips: row.county_fips,

          // Population & Age
          population_block_group: row.total_population,
          population_density_sqmi: row.population_density_sqmi,
          median_age: row.median_age,
          under_18_pct: row.under_18_pct,
          working_age_pct: row.working_age_pct,
          over_65_pct: row.over_65_pct,

          // Race & Ethnicity
          white_pct: row.white_pct,
          black_pct: row.black_pct,
          asian_pct: row.asian_pct,
          hispanic_pct: row.hispanic_pct,
          two_or_more_races_pct: row.two_or_more_races_pct,

          // Housing
          total_housing_units: row.total_housing_units,
          occupied_housing_units: row.occupied_housing_units,
          vacant_housing_units: row.vacant_housing_units,
          vacancy_rate: row.vacancy_rate,
          owner_occupied_pct: row.owner_occupied_pct,
          renter_occupied_pct: row.renter_occupied_pct,
          median_home_value: row.median_home_value,
          median_rent: row.median_rent,
          median_year_built: row.median_year_built,
          median_rooms: row.median_rooms,
          avg_household_size: row.avg_household_size,
          single_family_pct: row.single_family_pct,
          multi_family_pct: row.multi_family_pct,

          // Economics
          median_income: row.median_household_income,
          median_household_income: row.median_household_income,
          per_capita_income: row.per_capita_income,
          mean_household_income: row.mean_household_income,
          median_earnings: row.median_earnings,
          poverty_rate: row.poverty_rate,
          snap_recipients_pct: row.snap_recipients_pct,
          gini_index: row.gini_index,
          income_below_50k_pct: row.income_below_50k_pct,
          income_50k_100k_pct: row.income_50k_100k_pct,
          income_above_100k_pct: row.income_above_100k_pct,

          // Employment
          labor_force: row.labor_force,
          employed_population: row.employed_population,
          unemployment_rate: row.unemployment_rate,
          work_from_home_pct: row.work_from_home_pct,
          white_collar_pct: row.white_collar_pct,
          blue_collar_pct: row.blue_collar_pct,
          service_sector_pct: row.service_sector_pct,
          retail_workers: row.retail_workers,
          healthcare_workers: row.healthcare_workers,
          professional_services_workers: row.professional_services_workers,
          manufacturing_workers: row.manufacturing_workers,
          top_industries: row.top_industries,

          // Commute Patterns
          mean_commute_time_min: row.mean_commute_time_min,
          drive_alone_pct: row.drive_alone_pct,
          carpool_pct: row.carpool_pct,
          public_transit_pct: row.public_transit_pct,
          walk_bike_pct: row.walk_bike_pct,
          work_from_home_commute_pct: row.work_from_home_commute_pct,
          commute_under_30min_pct: row.commute_under_30min_pct,
          commute_over_60min_pct: row.commute_over_60min_pct,

          // Education
          less_than_high_school_pct: row.less_than_high_school_pct,
          high_school_only_pct: row.high_school_only_pct,
          some_college_pct: row.some_college_pct,
          bachelors_pct: row.bachelors_pct,
          graduate_degree_pct: row.graduate_degree_pct,
          college_attainment_pct: (row.bachelors_pct || 0) + (row.graduate_degree_pct || 0),
          stem_degree_pct: row.stem_degree_pct,

          // PROPRIETARY CRE INDICES
          retail_spending_index: row.retail_spending_index,
          workforce_availability_score: row.workforce_availability_score,
          growth_potential_index: row.growth_potential_index,
          affluence_concentration: row.affluence_concentration,
          labor_pool_depth: row.labor_pool_depth,
          daytime_population_estimate: row.daytime_population_estimate,

          // 5-Year Projections
          population_cagr: row.population_cagr,
          income_cagr: row.income_cagr,
          housing_value_cagr: row.housing_value_cagr,
          rent_cagr: row.rent_cagr,
          population_5yr_projection: row.population_5yr_projection,
          median_income_5yr_projection: row.median_income_5yr_projection,
          median_home_value_5yr_projection: row.median_home_value_5yr_projection,
          median_rent_5yr_projection: row.median_rent_5yr_projection,
          growth_trajectory: row.growth_trajectory,
          market_outlook: row.market_outlook,
          projection_confidence: row.projection_confidence,

          // Metadata
          demographics_source: "canonical",
          accuracy_tier: row.accuracy_tier,
          confidence: row.confidence,
          source_dataset: row.source_dataset,
        },
      };

      // If application_id provided, update the application with demographics data
      if (application_id) {
        const updateData = {
          census_block_group: result.data.census_block_group,
          census_vintage: result.data.census_vintage,
          population_block_group: result.data.population_block_group,
          population_density_sqmi: result.data.population_density_sqmi,
          median_age: result.data.median_age,
          under_18_pct: result.data.under_18_pct,
          working_age_pct: result.data.working_age_pct,
          over_65_pct: result.data.over_65_pct,
          white_pct: result.data.white_pct,
          black_pct: result.data.black_pct,
          asian_pct: result.data.asian_pct,
          hispanic_pct: result.data.hispanic_pct,
          owner_occupied_pct: result.data.owner_occupied_pct,
          renter_occupied_pct: result.data.renter_occupied_pct,
          vacancy_rate: result.data.vacancy_rate,
          median_home_value: result.data.median_home_value,
          median_rent: result.data.median_rent,
          total_housing_units: result.data.total_housing_units,
          median_income: result.data.median_income,
          per_capita_income: result.data.per_capita_income,
          mean_household_income: result.data.mean_household_income,
          poverty_rate: result.data.poverty_rate,
          gini_index: result.data.gini_index,
          labor_force: result.data.labor_force,
          unemployment_rate: result.data.unemployment_rate,
          work_from_home_pct: result.data.work_from_home_pct,
          white_collar_pct: result.data.white_collar_pct,
          blue_collar_pct: result.data.blue_collar_pct,
          service_sector_pct: result.data.service_sector_pct,
          mean_commute_time_min: result.data.mean_commute_time_min,
          drive_alone_pct: result.data.drive_alone_pct,
          public_transit_pct: result.data.public_transit_pct,
          walk_bike_pct: result.data.walk_bike_pct,
          high_school_only_pct: result.data.high_school_only_pct,
          some_college_pct: result.data.some_college_pct,
          bachelors_pct: result.data.bachelors_pct,
          graduate_degree_pct: result.data.graduate_degree_pct,
          college_attainment_pct: result.data.college_attainment_pct,
          retail_spending_index: result.data.retail_spending_index,
          workforce_availability_score: result.data.workforce_availability_score,
          growth_potential_index: result.data.growth_potential_index,
          affluence_concentration: result.data.affluence_concentration,
          labor_pool_depth: result.data.labor_pool_depth,
          daytime_population_estimate: result.data.daytime_population_estimate,
          population_5yr_projection: result.data.population_5yr_projection,
          median_income_5yr_projection: result.data.median_income_5yr_projection,
          median_home_value_5yr_projection: result.data.median_home_value_5yr_projection,
          population_cagr: result.data.population_cagr,
          growth_trajectory: result.data.growth_trajectory,
          market_outlook: result.data.market_outlook,
          demographics_source: "canonical",
        };

        const { error: updateError } = await supabase
          .from("applications")
          .update(updateData)
          .eq("id", application_id);

        if (updateError) {
          console.error("[enrich-census-canonical] Error updating application:", updateError);
        } else {
          console.log(`[enrich-census-canonical] Updated application ${application_id} with demographics`);
        }
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: Census API (existing logic)
    console.log("[enrich-census-canonical] No canonical data found, falling back to Census API...");

    const censusApiKey = Deno.env.get("CENSUS_API_KEY");
    if (!censusApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          source: "fallback",
          error: "No canonical data and no Census API key configured",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Basic Census API fallback
    const fccUrl = `https://geo.fcc.gov/api/census/block/find?latitude=${lat}&longitude=${lng}&format=json`;
    const fccRes = await fetch(fccUrl);
    const fccData = await fccRes.json();
    const tractCode = fccData?.Block?.FIPS?.substring(0, 11);
    const stateCode = tractCode?.substring(0, 2);
    const countyCode = tractCode?.substring(2, 5);

    if (!tractCode || !stateCode || !countyCode) {
      return new Response(
        JSON.stringify({
          success: false,
          source: "fallback",
          error: "Could not determine Census tract for location",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const censusUrl = `https://api.census.gov/data/2022/acs/acs5?get=B01003_001E,B19013_001E,B25001_001E&for=tract:${tractCode.substring(5)}&in=state:${stateCode}%20county:${countyCode}&key=${censusApiKey}`;
    const censusRes = await fetch(censusUrl);
    const censusData = await censusRes.json();

    if (!censusData || censusData.length < 2) {
      return new Response(
        JSON.stringify({
          success: false,
          source: "fallback",
          error: "Census API returned no data",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const [, totalPop, medianIncome, totalHousing] = censusData[1];

    return new Response(
      JSON.stringify({
        success: true,
        source: "census_api",
        data: {
          population_block_group: parseInt(totalPop) || null,
          median_income: parseInt(medianIncome) || null,
          total_housing_units: parseInt(totalHousing) || null,
          demographics_source: "census_api",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[enrich-census-canonical] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
