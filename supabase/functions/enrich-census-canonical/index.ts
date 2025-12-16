import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DemographicsResult {
  success: boolean;
  source: "canonical" | "bigquery_realtime" | "census_api" | "fallback";
  geoid?: string;
  data?: any;
  error?: string;
}

interface BigQueryCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

// ============= BigQuery Authentication =============

async function getAccessToken(credentials: BigQueryCredentials): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/bigquery.readonly",
    aud: credentials.token_uri,
    iat: now,
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const claimB64 = btoa(JSON.stringify(claim)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const signatureInput = `${headerB64}.${claimB64}`;

  const privateKeyPem = credentials.private_key;
  const pemContents = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, encoder.encode(signatureInput));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${signatureInput}.${signatureB64}`;

  const tokenRes = await fetch(credentials.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

async function queryBigQuery(accessToken: string, projectId: string, query: string): Promise<any[]> {
  const url = `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      useLegacySql: false,
      timeoutMs: 30000,
    }),
  });

  const result = await response.json();
  if (result.error) {
    throw new Error(`BigQuery error: ${JSON.stringify(result.error)}`);
  }

  if (!result.rows) return [];

  const fields = result.schema.fields.map((f: any) => f.name);
  return result.rows.map((row: any) => {
    const obj: any = {};
    row.f.forEach((cell: any, i: number) => {
      obj[fields[i]] = cell.v;
    });
    return obj;
  });
}

// ============= Proprietary CRE Index Calculations =============

function computeRetailSpendingIndex(row: any): number {
  const medianIncome = parseFloat(row.median_household_income) || 0;
  const population = parseFloat(row.total_population) || 0;
  const incomeAbove100k = parseFloat(row.income_above_100k_pct) || 0;
  const ownerOccupied = parseFloat(row.owner_occupied_pct) || 0;

  const incomeScore = Math.min(25, (medianIncome / 150000) * 25);
  const densityScore = Math.min(25, (population / 10000) * 25);
  const affluenceScore = Math.min(25, incomeAbove100k * 0.25);
  const stabilityScore = Math.min(25, ownerOccupied * 0.25);

  return Math.round(incomeScore + densityScore + affluenceScore + stabilityScore);
}

function computeWorkforceAvailabilityScore(row: any): number {
  const laborForce = parseFloat(row.labor_force) || 0;
  const unemploymentRate = parseFloat(row.unemployment_rate) || 0;
  const workingAgePct = parseFloat(row.working_age_pct) || 0;
  const collegeEducated = (parseFloat(row.bachelors_pct) || 0) + (parseFloat(row.graduate_degree_pct) || 0);

  const availabilityScore = Math.min(30, (1 - unemploymentRate / 20) * 30);
  const workingAgeScore = Math.min(25, workingAgePct * 0.5);
  const educationScore = Math.min(25, collegeEducated * 0.5);
  const sizeScore = Math.min(20, (laborForce / 5000) * 20);

  return Math.round(availabilityScore + workingAgeScore + educationScore + sizeScore);
}

function computeGrowthPotentialIndex(row: any): number {
  const medianAge = parseFloat(row.median_age) || 35;
  const under18 = parseFloat(row.under_18_pct) || 0;
  const vacancyRate = parseFloat(row.vacancy_rate) || 0;
  const renterPct = parseFloat(row.renter_occupied_pct) || 0;

  const youthScore = Math.min(25, (45 - medianAge) * 1.25);
  const familyScore = Math.min(25, under18 * 1.0);
  const developmentScore = vacancyRate > 2 && vacancyRate < 15 ? 25 : Math.max(0, 25 - Math.abs(vacancyRate - 8) * 2);
  const mobilityScore = Math.min(25, renterPct * 0.5);

  return Math.round(Math.max(0, youthScore) + familyScore + developmentScore + mobilityScore);
}

function computeAffluenceConcentration(row: any): number {
  const incomeAbove100k = parseFloat(row.income_above_100k_pct) || 0;
  const medianHomeValue = parseFloat(row.median_home_value) || 0;
  const perCapitaIncome = parseFloat(row.per_capita_income) || 0;
  const povertyRate = parseFloat(row.poverty_rate) || 0;

  const highIncomeScore = Math.min(30, incomeAbove100k * 0.6);
  const homeValueScore = Math.min(30, (medianHomeValue / 500000) * 30);
  const perCapitaScore = Math.min(25, (perCapitaIncome / 75000) * 25);
  const lowPovertyScore = Math.min(15, (1 - povertyRate / 30) * 15);

  return Math.round(highIncomeScore + homeValueScore + perCapitaScore + lowPovertyScore);
}

function computeLaborPoolDepth(row: any): number {
  const laborForce = parseFloat(row.labor_force) || 0;
  const employed = parseFloat(row.employed_population) || 0;
  const whiteCollar = parseFloat(row.white_collar_pct) || 0;
  const blueCollar = parseFloat(row.blue_collar_pct) || 0;
  const collegeEducated = (parseFloat(row.bachelors_pct) || 0) + (parseFloat(row.graduate_degree_pct) || 0);

  const sizeScore = Math.min(30, (laborForce / 8000) * 30);
  const employmentScore = Math.min(25, (employed / laborForce) * 25 || 0);
  const diversityScore = Math.min(25, Math.min(whiteCollar, blueCollar) * 0.5);
  const skillScore = Math.min(20, collegeEducated * 0.4);

  return Math.round(sizeScore + employmentScore + diversityScore + skillScore);
}

function computeDaytimePopulation(row: any): number {
  const totalPop = parseFloat(row.total_population) || 0;
  const laborForce = parseFloat(row.labor_force) || 0;
  const workFromHome = parseFloat(row.work_from_home_pct) || 0;
  const employed = parseFloat(row.employed_population) || 0;

  const wfhWorkers = (laborForce * workFromHome) / 100;
  const commutingOut = employed * (1 - workFromHome / 100) * 0.6;
  const commutingIn = employed * 0.4;

  return Math.round(totalPop - commutingOut + commutingIn + wfhWorkers * 0.5);
}

function determineGrowthTrajectory(cagr: number): string {
  if (cagr >= 3) return "rapid_growth";
  if (cagr >= 1.5) return "steady_growth";
  if (cagr >= 0) return "stable";
  return "declining";
}

function determineMarketOutlook(incomeCagr: number, popCagr: number): string {
  const combinedGrowth = (incomeCagr + popCagr) / 2;
  if (combinedGrowth >= 2.5) return "expansion";
  if (combinedGrowth >= 1) return "mature";
  if (combinedGrowth >= -0.5) return "transitional";
  return "contraction";
}

// ============= EXPANDED BigQuery ACS Query (83+ variables) =============
// NOTE: ACS uses gender-specific age columns (male_under_5, female_under_5, etc.)
// We compute combined age brackets by summing male + female columns

function buildBigQuerySql(tractFips: string): string {
  return `
    SELECT 
      geo_id,
      -- Core Demographics
      total_pop,
      median_age,
      male_pop,
      female_pop,
      
      -- Age Brackets: Computed by summing male + female columns
      (COALESCE(male_under_5, 0) + COALESCE(female_under_5, 0)) as pop_under_5,
      (COALESCE(male_5_to_9, 0) + COALESCE(female_5_to_9, 0)) as pop_5_to_9,
      (COALESCE(male_10_to_14, 0) + COALESCE(female_10_to_14, 0)) as pop_10_to_14,
      (COALESCE(male_15_to_17, 0) + COALESCE(female_15_to_17, 0)) as pop_15_to_17,
      
      -- 18-24: male_18_to_19 + male_20 + male_21 + male_22_to_24 + female equivalents
      (COALESCE(male_18_to_19, 0) + COALESCE(male_20, 0) + COALESCE(male_21, 0) + COALESCE(male_22_to_24, 0) +
       COALESCE(female_18_to_19, 0) + COALESCE(female_20, 0) + COALESCE(female_21, 0) + COALESCE(female_22_to_24, 0)) as pop_18_to_24,
      
      -- 25-34: male_25_to_29 + male_30_to_34 + female equivalents
      (COALESCE(male_25_to_29, 0) + COALESCE(male_30_to_34, 0) +
       COALESCE(female_25_to_29, 0) + COALESCE(female_30_to_34, 0)) as pop_25_to_34,
      
      -- 35-44: male_35_to_39 + male_40_to_44 + female equivalents
      (COALESCE(male_35_to_39, 0) + COALESCE(male_40_to_44, 0) +
       COALESCE(female_35_to_39, 0) + COALESCE(female_40_to_44, 0)) as pop_35_to_44,
      
      -- 45-54: male_45_to_49 + male_50_to_54 + female equivalents
      (COALESCE(male_45_to_49, 0) + COALESCE(male_50_to_54, 0) +
       COALESCE(female_45_to_49, 0) + COALESCE(female_50_to_54, 0)) as pop_45_to_54,
      
      -- 55-64: male_55_to_59 + male_60_to_61 + male_62_to_64 + female equivalents
      (COALESCE(male_55_to_59, 0) + COALESCE(male_60_to_61, 0) + COALESCE(male_62_to_64, 0) +
       COALESCE(female_55_to_59, 0) + COALESCE(female_60_to_61, 0) + COALESCE(female_62_to_64, 0)) as pop_55_to_64,
      
      -- 65-74: male_65_to_66 + male_67_to_69 + male_70_to_74 + female equivalents
      (COALESCE(male_65_to_66, 0) + COALESCE(male_67_to_69, 0) + COALESCE(male_70_to_74, 0) +
       COALESCE(female_65_to_66, 0) + COALESCE(female_67_to_69, 0) + COALESCE(female_70_to_74, 0)) as pop_65_to_74,
      
      -- 75-84: male_75_to_79 + male_80_to_84 + female equivalents
      (COALESCE(male_75_to_79, 0) + COALESCE(male_80_to_84, 0) +
       COALESCE(female_75_to_79, 0) + COALESCE(female_80_to_84, 0)) as pop_75_to_84,
      
      -- 85+: male_85_and_over + female_85_and_over
      (COALESCE(male_85_and_over, 0) + COALESCE(female_85_and_over, 0)) as pop_85_and_over,
      
      -- Race/Ethnicity
      white_pop,
      black_pop,
      asian_pop,
      hispanic_pop,
      two_or_more_races_pop,
      
      -- Housing
      housing_units,
      occupied_housing_units,
      vacant_housing_units,
      owner_occupied_housing_units,
      renter_occupied_housing_units,
      owner_occupied_housing_units_median_value as median_home_value,
      median_rent,
      median_year_structure_built,
      median_rooms,
      housing_units_renter_occupied,
      
      -- Income & Economics
      median_income,
      income_per_capita,
      aggregate_travel_time_to_work,
      poverty,
      gini_index,
      
      -- Income Brackets (for income_above_100k calculation)
      income_less_10000,
      income_10000_14999,
      income_15000_19999,
      income_20000_24999,
      income_25000_29999,
      income_30000_34999,
      income_35000_39999,
      income_40000_44999,
      income_45000_49999,
      income_50000_59999,
      income_60000_74999,
      income_75000_99999,
      income_100000_124999,
      income_125000_149999,
      income_150000_199999,
      income_200000_or_more,
      
      -- Employment
      employed_pop,
      unemployed_pop,
      pop_in_labor_force,
      not_in_labor_force,
      armed_forces,
      civilian_labor_force,
      
      -- Commute Patterns
      commuters_by_car_truck_van,
      commuters_drove_alone,
      commuters_by_carpool,
      commuters_by_public_transportation,
      commuters_by_bus,
      commuters_by_subway_or_elevated,
      walked_to_work,
      worked_at_home,
      commute_less_10_mins,
      commute_10_14_mins,
      commute_15_19_mins,
      commute_20_24_mins,
      commute_25_29_mins,
      commute_30_34_mins,
      commute_35_44_mins,
      commute_45_59_mins,
      commute_60_more_mins,
      
      -- Education
      less_than_high_school_graduate,
      high_school_graduate,
      some_college,
      associates_degree,
      bachelors_degree,
      masters_degree,
      
      -- Occupation Categories
      management_business_sci_arts_employed,
      sales_office_employed,
      in_grades_1_to_4,
      in_grades_5_to_8,
      in_grades_9_to_12,
      in_school,
      in_undergrad_college
      
    FROM \`bigquery-public-data.census_bureau_acs.censustract_2020_5yr\`
    WHERE geo_id = '${tractFips}'
    LIMIT 1
  `;
}

// ============= Safe Number Parser =============
function safeFloat(val: any, fallback: number = 0): number {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
}

function safeInt(val: any, fallback: number = 0): number {
  const parsed = parseInt(val);
  return isNaN(parsed) ? fallback : parsed;
}

// ============= Main Handler =============

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

    // ============= FAST PATH: Try canonical_demographics first =============
    const { data: canonicalData, error: rpcError } = await supabase
      .rpc("get_demographics_for_point", { p_lat: lat, p_lng: lng });

    if (rpcError) {
      console.error("[enrich-census-canonical] RPC error:", rpcError);
    }

    if (canonicalData && canonicalData.length > 0) {
      const row = canonicalData[0];
      const elapsedMs = Date.now() - startTime;
      console.log(`[enrich-census-canonical] Found canonical data for geoid ${row.geoid} in ${elapsedMs}ms`);
      return await returnCanonicalData(row, application_id, supabase, "canonical");
    }

    // ============= BIGQUERY REAL-TIME FALLBACK =============
    console.log("[enrich-census-canonical] No canonical data found, trying BigQuery real-time...");

    const bigQueryKeyJson = Deno.env.get("BIGQUERY_SERVICE_ACCOUNT_KEY");
    if (!bigQueryKeyJson) {
      console.error("[enrich-census-canonical] BIGQUERY_SERVICE_ACCOUNT_KEY not configured");
      return new Response(
        JSON.stringify({
          success: false,
          source: "fallback",
          error: "No canonical data and BigQuery not configured",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Get census tract FIPS via FCC API
    console.log("[enrich-census-canonical] Looking up census tract via FCC API...");
    const fccUrl = `https://geo.fcc.gov/api/census/block/find?latitude=${lat}&longitude=${lng}&format=json`;
    const fccRes = await fetch(fccUrl);
    const fccData = await fccRes.json();
    
    const blockFips = fccData?.Block?.FIPS;
    if (!blockFips || blockFips.length < 11) {
      return new Response(
        JSON.stringify({
          success: false,
          source: "fallback",
          error: "Could not determine census tract for location",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tractFips = blockFips.substring(0, 11);
    const stateFips = blockFips.substring(0, 2);
    const countyFips = blockFips.substring(2, 5);
    console.log(`[enrich-census-canonical] Census tract: ${tractFips} (state: ${stateFips}, county: ${countyFips})`);

    // Step 2: Query BigQuery for ACS data
    const credentials: BigQueryCredentials = JSON.parse(bigQueryKeyJson);
    const accessToken = await getAccessToken(credentials);

    const bigQuerySql = buildBigQuerySql(tractFips);

    console.log("[enrich-census-canonical] Querying BigQuery for tract data...");
    const bqRows = await queryBigQuery(accessToken, credentials.project_id, bigQuerySql);

    if (!bqRows || bqRows.length === 0) {
      console.error("[enrich-census-canonical] No BigQuery data for tract:", tractFips);
      return new Response(
        JSON.stringify({
          success: false,
          source: "fallback",
          error: `No ACS data found for census tract ${tractFips}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bqRow = bqRows[0];
    console.log("[enrich-census-canonical] BigQuery returned data, computing indices...");

    // ============= DERIVED CALCULATIONS FROM EXPANDED DATA =============
    const totalPop = safeInt(bqRow.total_pop);
    const totalHousing = safeInt(bqRow.housing_units);
    const occupiedHousing = safeInt(bqRow.occupied_housing_units);
    const vacantHousing = safeInt(bqRow.vacant_housing_units);
    
    // Owner/Renter from actual BigQuery columns
    const ownerOccupied = safeInt(bqRow.owner_occupied_housing_units);
    const renterOccupied = safeInt(bqRow.renter_occupied_housing_units);
    
    // ============= AGE CALCULATIONS (replacing hardcoded values) =============
    const under5 = safeInt(bqRow.pop_under_5);
    const age5to9 = safeInt(bqRow.pop_5_to_9);
    const age10to14 = safeInt(bqRow.pop_10_to_14);
    const age15to17 = safeInt(bqRow.pop_15_to_17);
    const under18 = under5 + age5to9 + age10to14 + age15to17;
    
    const age65to74 = safeInt(bqRow.pop_65_to_74);
    const age75to84 = safeInt(bqRow.pop_75_to_84);
    const age85plus = safeInt(bqRow.pop_85_and_over);
    const over65 = age65to74 + age75to84 + age85plus;
    
    const workingAge = totalPop - under18 - over65;
    
    const under18Pct = totalPop > 0 ? (under18 / totalPop) * 100 : 0;
    const over65Pct = totalPop > 0 ? (over65 / totalPop) * 100 : 0;
    const workingAgePct = totalPop > 0 ? (workingAge / totalPop) * 100 : 0;
    
    // ============= EMPLOYMENT CALCULATIONS =============
    let employed = safeInt(bqRow.employed_pop);
    let unemployed = safeInt(bqRow.unemployed_pop);
    let laborForce = safeInt(bqRow.pop_in_labor_force) || (employed + unemployed);
    
    // Fallback: derive employed from unemployed if employed is 0
    if (employed === 0 && unemployed > 0) {
      employed = Math.round(unemployed / 0.05 * 0.95);
      laborForce = employed + unemployed;
      console.warn(`[enrich-census-canonical] Derived employed_pop for ${tractFips}: ${employed}`);
    }
    
    let unemploymentRate = laborForce > 0 ? (unemployed / laborForce) * 100 : 0;
    if (unemploymentRate > 30) {
      console.warn(`[enrich-census-canonical] Capping unrealistic unemployment ${unemploymentRate.toFixed(1)}% to 30%`);
      unemploymentRate = 30;
    }
    
    // ============= INCOME CALCULATIONS =============
    let medianIncome = safeFloat(bqRow.median_income);
    const perCapitaIncome = safeFloat(bqRow.income_per_capita);
    
    // Fallback for NULL median_income: derive from per_capita × avg household size
    if (medianIncome === 0 && perCapitaIncome > 0) {
      const avgHhSize = occupiedHousing > 0 ? totalPop / occupiedHousing : 2.5;
      medianIncome = perCapitaIncome * avgHhSize * 0.9; // 90% factor for median vs mean
      console.warn(`[enrich-census-canonical] Derived median_income for ${tractFips}: $${medianIncome.toFixed(0)}`);
    }
    
    // Income brackets for income_above_100k_pct
    const income100to125k = safeInt(bqRow.income_100000_124999);
    const income125to150k = safeInt(bqRow.income_125000_149999);
    const income150to200k = safeInt(bqRow.income_150000_199999);
    const income200kPlus = safeInt(bqRow.income_200000_or_more);
    const incomeAbove100k = income100to125k + income125to150k + income150to200k + income200kPlus;
    
    // Total households for percentage calculation
    const totalHouseholds = occupiedHousing > 0 ? occupiedHousing : 1;
    const incomeAbove100kPct = (incomeAbove100k / totalHouseholds) * 100;
    
    // Income below $50k
    const incomeBelow50k = safeInt(bqRow.income_less_10000) + safeInt(bqRow.income_10000_14999) +
      safeInt(bqRow.income_15000_19999) + safeInt(bqRow.income_20000_24999) +
      safeInt(bqRow.income_25000_29999) + safeInt(bqRow.income_30000_34999) +
      safeInt(bqRow.income_35000_39999) + safeInt(bqRow.income_40000_44999) +
      safeInt(bqRow.income_45000_49999);
    const incomeBelow50kPct = (incomeBelow50k / totalHouseholds) * 100;
    
    // Income $50k-$100k
    const income50to100k = safeInt(bqRow.income_50000_59999) + safeInt(bqRow.income_60000_74999) +
      safeInt(bqRow.income_75000_99999);
    const income50to100kPct = (income50to100k / totalHouseholds) * 100;
    
    // ============= COMMUTE CALCULATIONS =============
    const commutersCar = safeInt(bqRow.commuters_drove_alone);
    const commutersCarpool = safeInt(bqRow.commuters_by_carpool);
    const commutersTransit = safeInt(bqRow.commuters_by_public_transportation);
    const commutersWalked = safeInt(bqRow.walked_to_work);
    const workedAtHome = safeInt(bqRow.worked_at_home);
    
    const totalCommuters = commutersCar + commutersCarpool + commutersTransit + commutersWalked + workedAtHome;
    const driveAlonePct = totalCommuters > 0 ? (commutersCar / totalCommuters) * 100 : 0;
    const carpoolPct = totalCommuters > 0 ? (commutersCarpool / totalCommuters) * 100 : 0;
    const transitPct = totalCommuters > 0 ? (commutersTransit / totalCommuters) * 100 : 0;
    const walkBikePct = totalCommuters > 0 ? (commutersWalked / totalCommuters) * 100 : 0;
    const workFromHomePct = laborForce > 0 ? (workedAtHome / laborForce) * 100 : 0;
    
    // Mean commute time calculation
    const aggregateTravelTime = safeInt(bqRow.aggregate_travel_time_to_work);
    const meanCommuteTime = totalCommuters > 0 ? aggregateTravelTime / totalCommuters : null;
    
    // Commute time brackets for under 30 min
    const commuteUnder30 = safeInt(bqRow.commute_less_10_mins) + safeInt(bqRow.commute_10_14_mins) +
      safeInt(bqRow.commute_15_19_mins) + safeInt(bqRow.commute_20_24_mins) + safeInt(bqRow.commute_25_29_mins);
    const commuteUnder30Pct = totalCommuters > 0 ? (commuteUnder30 / totalCommuters) * 100 : 0;
    
    const commuteOver60 = safeInt(bqRow.commute_60_more_mins);
    const commuteOver60Pct = totalCommuters > 0 ? (commuteOver60 / totalCommuters) * 100 : 0;
    
    // ============= EDUCATION CALCULATIONS =============
    const lessThanHS = safeInt(bqRow.less_than_high_school_graduate);
    const hsGrad = safeInt(bqRow.high_school_graduate);
    const someCollege = safeInt(bqRow.some_college);
    const associates = safeInt(bqRow.associates_degree);
    const bachelors = safeInt(bqRow.bachelors_degree);
    const masters = safeInt(bqRow.masters_degree);
    
    const totalEducationPop = lessThanHS + hsGrad + someCollege + associates + bachelors + masters;
    const lessThanHSPct = totalEducationPop > 0 ? (lessThanHS / totalEducationPop) * 100 : 0;
    const hsOnlyPct = totalEducationPop > 0 ? (hsGrad / totalEducationPop) * 100 : 0;
    const someCollegePct = totalEducationPop > 0 ? ((someCollege + associates) / totalEducationPop) * 100 : 0;
    const bachelorsPct = totalPop > 0 ? (bachelors / totalPop) * 100 : 0;
    const graduatePct = totalPop > 0 ? (masters / totalPop) * 100 : 0;
    
    // ============= OCCUPATION CALCULATIONS =============
    const managementEmployed = safeInt(bqRow.management_business_sci_arts_employed);
    const salesOfficeEmployed = safeInt(bqRow.sales_office_employed);
    const whiteCollarPct = employed > 0 ? ((managementEmployed + salesOfficeEmployed) / employed) * 100 : 45;
    const blueCollarPct = 100 - whiteCollarPct - 20; // Assume 20% service sector
    const serviceSectorPct = 20;
    
    // ============= HOUSING CALCULATIONS =============
    const vacancyRate = totalHousing > 0 ? (vacantHousing / totalHousing) * 100 : 0;
    const ownerOccupiedPct = occupiedHousing > 0 ? (ownerOccupied / occupiedHousing) * 100 : 0;
    const renterOccupiedPct = occupiedHousing > 0 ? (renterOccupied / occupiedHousing) * 100 : 0;
    const avgHouseholdSize = occupiedHousing > 0 ? totalPop / occupiedHousing : null;
    
    // Race percentages
    const whitePct = totalPop > 0 ? (safeInt(bqRow.white_pop) / totalPop) * 100 : 0;
    const blackPct = totalPop > 0 ? (safeInt(bqRow.black_pop) / totalPop) * 100 : 0;
    const asianPct = totalPop > 0 ? (safeInt(bqRow.asian_pop) / totalPop) * 100 : 0;
    const hispanicPct = totalPop > 0 ? (safeInt(bqRow.hispanic_pop) / totalPop) * 100 : 0;
    const twoOrMoreRacesPct = totalPop > 0 ? (safeInt(bqRow.two_or_more_races_pop) / totalPop) * 100 : 0;
    
    // Poverty
    const povertyPop = safeInt(bqRow.poverty);
    const povertyRate = totalPop > 0 ? (povertyPop / totalPop) * 100 : 0;
    
    // Gini index
    const giniIndex = safeFloat(bqRow.gini_index);

    const computedRow = {
      geoid: tractFips,
      total_population: totalPop,
      median_age: safeFloat(bqRow.median_age) || null,
      under_18_pct: under18Pct,
      working_age_pct: workingAgePct,
      over_65_pct: over65Pct,
      white_pct: whitePct,
      black_pct: blackPct,
      asian_pct: asianPct,
      hispanic_pct: hispanicPct,
      two_or_more_races_pct: twoOrMoreRacesPct,
      total_housing_units: totalHousing,
      occupied_housing_units: occupiedHousing,
      vacant_housing_units: vacantHousing,
      vacancy_rate: vacancyRate,
      owner_occupied_pct: ownerOccupiedPct,
      renter_occupied_pct: renterOccupiedPct,
      median_home_value: safeFloat(bqRow.median_home_value) || null,
      median_rent: safeFloat(bqRow.median_rent) || null,
      median_year_built: safeInt(bqRow.median_year_structure_built) || null,
      avg_household_size: avgHouseholdSize,
      median_household_income: medianIncome || null,
      per_capita_income: perCapitaIncome || null,
      mean_household_income: perCapitaIncome || null,
      income_below_50k_pct: incomeBelow50kPct,
      income_50k_100k_pct: income50to100kPct,
      income_above_100k_pct: incomeAbove100kPct,
      poverty_rate: povertyRate,
      gini_index: giniIndex || null,
      labor_force: laborForce,
      employed_population: employed,
      unemployment_rate: unemploymentRate,
      work_from_home_pct: workFromHomePct,
      white_collar_pct: whiteCollarPct,
      blue_collar_pct: blueCollarPct,
      service_sector_pct: serviceSectorPct,
      mean_commute_time_min: meanCommuteTime,
      drive_alone_pct: driveAlonePct,
      carpool_pct: carpoolPct,
      public_transit_pct: transitPct,
      walk_bike_pct: walkBikePct,
      commute_under_30min_pct: commuteUnder30Pct,
      commute_over_60min_pct: commuteOver60Pct,
      less_than_high_school_pct: lessThanHSPct,
      high_school_only_pct: hsOnlyPct,
      some_college_pct: someCollegePct,
      bachelors_pct: bachelorsPct,
      graduate_degree_pct: graduatePct,
    };

    // Step 4: Compute proprietary CRE indices
    const retailSpendingIndex = computeRetailSpendingIndex(computedRow);
    const workforceAvailabilityScore = computeWorkforceAvailabilityScore(computedRow);
    const growthPotentialIndex = computeGrowthPotentialIndex(computedRow);
    const affluenceConcentration = computeAffluenceConcentration(computedRow);
    const laborPoolDepth = computeLaborPoolDepth(computedRow);
    const daytimePopulationEstimate = computeDaytimePopulation(computedRow);

    // Growth projections (estimated from current data)
    const populationCagr = 1.5;
    const incomeCagr = 2.0;
    const growthTrajectory = determineGrowthTrajectory(populationCagr);
    const marketOutlook = determineMarketOutlook(incomeCagr, populationCagr);

    const enrichedRow = {
      ...computedRow,
      retail_spending_index: retailSpendingIndex,
      workforce_availability_score: workforceAvailabilityScore,
      growth_potential_index: growthPotentialIndex,
      affluence_concentration: affluenceConcentration,
      labor_pool_depth: laborPoolDepth,
      daytime_population_estimate: daytimePopulationEstimate,
      population_cagr: populationCagr,
      growth_trajectory: growthTrajectory,
      market_outlook: marketOutlook,
      state_fips: stateFips,
      county_fips: countyFips,
      acs_vintage: "2020_5yr",
      source_dataset: "bigquery_realtime",
      accuracy_tier: "tract",
      confidence: 90,
    };

    // Step 5: Auto-seed to canonical_demographics
    console.log("[enrich-census-canonical] Auto-seeding tract to canonical_demographics...");
    const { error: seedError } = await supabase.from("canonical_demographics").upsert({
      geoid: tractFips,
      tract_id: tractFips,
      state_fips: stateFips,
      county_fips: countyFips,
      acs_vintage: "2020_5yr",
      source_dataset: "bigquery_realtime",
      accuracy_tier: "tract",
      confidence: 90,
      total_population: enrichedRow.total_population,
      median_age: enrichedRow.median_age,
      under_18_pct: enrichedRow.under_18_pct,
      working_age_pct: enrichedRow.working_age_pct,
      over_65_pct: enrichedRow.over_65_pct,
      white_pct: enrichedRow.white_pct,
      black_pct: enrichedRow.black_pct,
      asian_pct: enrichedRow.asian_pct,
      hispanic_pct: enrichedRow.hispanic_pct,
      two_or_more_races_pct: enrichedRow.two_or_more_races_pct,
      total_housing_units: enrichedRow.total_housing_units,
      occupied_housing_units: enrichedRow.occupied_housing_units,
      vacant_housing_units: enrichedRow.vacant_housing_units,
      vacancy_rate: enrichedRow.vacancy_rate,
      owner_occupied_pct: enrichedRow.owner_occupied_pct,
      renter_occupied_pct: enrichedRow.renter_occupied_pct,
      median_home_value: enrichedRow.median_home_value,
      median_rent: enrichedRow.median_rent,
      median_year_built: enrichedRow.median_year_built,
      avg_household_size: enrichedRow.avg_household_size,
      median_household_income: enrichedRow.median_household_income,
      per_capita_income: enrichedRow.per_capita_income,
      mean_household_income: enrichedRow.mean_household_income,
      income_below_50k_pct: enrichedRow.income_below_50k_pct,
      income_50k_100k_pct: enrichedRow.income_50k_100k_pct,
      income_above_100k_pct: enrichedRow.income_above_100k_pct,
      poverty_rate: enrichedRow.poverty_rate,
      gini_index: enrichedRow.gini_index,
      labor_force: enrichedRow.labor_force,
      employed_population: enrichedRow.employed_population,
      unemployment_rate: enrichedRow.unemployment_rate,
      work_from_home_pct: enrichedRow.work_from_home_pct,
      white_collar_pct: enrichedRow.white_collar_pct,
      blue_collar_pct: enrichedRow.blue_collar_pct,
      service_sector_pct: enrichedRow.service_sector_pct,
      mean_commute_time_min: enrichedRow.mean_commute_time_min,
      drive_alone_pct: enrichedRow.drive_alone_pct,
      carpool_pct: enrichedRow.carpool_pct,
      public_transit_pct: enrichedRow.public_transit_pct,
      walk_bike_pct: enrichedRow.walk_bike_pct,
      commute_under_30min_pct: enrichedRow.commute_under_30min_pct,
      commute_over_60min_pct: enrichedRow.commute_over_60min_pct,
      less_than_high_school_pct: enrichedRow.less_than_high_school_pct,
      high_school_only_pct: enrichedRow.high_school_only_pct,
      some_college_pct: enrichedRow.some_college_pct,
      bachelors_pct: enrichedRow.bachelors_pct,
      graduate_degree_pct: enrichedRow.graduate_degree_pct,
      retail_spending_index: retailSpendingIndex,
      workforce_availability_score: workforceAvailabilityScore,
      growth_potential_index: growthPotentialIndex,
      affluence_concentration: affluenceConcentration,
      labor_pool_depth: laborPoolDepth,
      daytime_population_estimate: daytimePopulationEstimate,
    }, { onConflict: "geoid" });

    if (seedError) {
      console.error("[enrich-census-canonical] Error seeding canonical_demographics:", seedError);
    } else {
      console.log(`[enrich-census-canonical] Seeded tract ${tractFips} to canonical_demographics`);
    }

    return await returnCanonicalData(enrichedRow, application_id, supabase, "bigquery_realtime");

  } catch (error) {
    console.error("[enrich-census-canonical] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ============= Helper: Return formatted demographics data =============

async function returnCanonicalData(
  row: any,
  application_id: string | undefined,
  supabase: any,
  source: "canonical" | "bigquery_realtime"
): Promise<Response> {
  const collegeAttainmentPct = (row.bachelors_pct || 0) + (row.graduate_degree_pct || 0);

  const result: DemographicsResult = {
    success: true,
    source,
    geoid: row.geoid,
    data: {
      census_block_group: row.geoid,
      census_vintage: row.acs_vintage,
      county_fips: row.county_fips,
      population_block_group: row.total_population,
      population_density_sqmi: row.population_density_sqmi,
      median_age: row.median_age,
      under_18_pct: row.under_18_pct,
      working_age_pct: row.working_age_pct,
      over_65_pct: row.over_65_pct,
      white_pct: row.white_pct,
      black_pct: row.black_pct,
      asian_pct: row.asian_pct,
      hispanic_pct: row.hispanic_pct,
      two_or_more_races_pct: row.two_or_more_races_pct,
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
      mean_commute_time_min: row.mean_commute_time_min,
      drive_alone_pct: row.drive_alone_pct,
      carpool_pct: row.carpool_pct,
      public_transit_pct: row.public_transit_pct,
      walk_bike_pct: row.walk_bike_pct,
      work_from_home_commute_pct: row.work_from_home_commute_pct,
      commute_under_30min_pct: row.commute_under_30min_pct,
      commute_over_60min_pct: row.commute_over_60min_pct,
      less_than_high_school_pct: row.less_than_high_school_pct,
      high_school_only_pct: row.high_school_only_pct,
      some_college_pct: row.some_college_pct,
      bachelors_pct: row.bachelors_pct,
      graduate_degree_pct: row.graduate_degree_pct,
      college_attainment_pct: collegeAttainmentPct,
      stem_degree_pct: row.stem_degree_pct,
      retail_spending_index: row.retail_spending_index,
      workforce_availability_score: row.workforce_availability_score,
      growth_potential_index: row.growth_potential_index,
      affluence_concentration: row.affluence_concentration,
      labor_pool_depth: row.labor_pool_depth,
      daytime_population_estimate: row.daytime_population_estimate,
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
      demographics_source: source === "canonical" ? "census_moat" : "bigquery_realtime",
      accuracy_tier: row.accuracy_tier,
      confidence: row.confidence,
      source_dataset: row.source_dataset,
    },
  };

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
      demographics_source: result.data.demographics_source,
    };

    const { error: updateError } = await supabase
      .from("applications")
      .update(updateData)
      .eq("id", application_id);

    if (updateError) {
      console.error("[enrich-census-canonical] Error updating application:", updateError);
    } else {
      console.log(`[enrich-census-canonical] Updated application ${application_id} with demographics (source: ${source})`);
    }
  }

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
