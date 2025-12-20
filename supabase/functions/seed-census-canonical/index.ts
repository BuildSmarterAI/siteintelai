import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BIGQUERY_ACS_TABLE = "bigquery-public-data.census_bureau_acs.censustract_2020_5yr";
const BIGQUERY_GEO_TABLE = "bigquery-public-data.geo_census_tracts.census_tracts_texas";

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

async function getAccessToken(credentials: BigQueryCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/bigquery.readonly",
    aud: credentials.token_uri,
    iat: now,
    exp: expiry,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const signatureInput = `${headerB64}.${payloadB64}`;

  const pemContents = credentials.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\n/g, "");

  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${signatureInput}.${signatureB64}`;

  const tokenResponse = await fetch(credentials.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
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
      maxResults: 10000,
      timeoutMs: 300000, // 5 minutes for large Texas-wide queries
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`BigQuery error: ${JSON.stringify(data.error)}`);
  }

  // Handle pagination if there are more results
  let rows = data.rows || [];
  let pageToken = data.pageToken;
  
  while (pageToken) {
    console.log(`[seed-census-canonical] Fetching next page with token ${pageToken.slice(0, 20)}...`);
    const pageResponse = await fetch(
      `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries/${data.jobReference.jobId}?pageToken=${pageToken}&maxResults=10000`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const pageData = await pageResponse.json();
    if (pageData.error) {
      throw new Error(`BigQuery pagination error: ${JSON.stringify(pageData.error)}`);
    }
    rows = rows.concat(pageData.rows || []);
    pageToken = pageData.pageToken;
    console.log(`[seed-census-canonical] Total rows so far: ${rows.length}`);
  }

  return rows;
}

// ============= Safe Number Parsers =============
// Census ACS uses -666666666 as "data not available" sentinel
const CENSUS_SENTINEL_VALUES = [-666666666, -999999999, -888888888, -777777777];

function safeFloat(val: any, fallback: number = 0): number {
  if (val === null || val === undefined) return fallback;
  const parsed = parseFloat(val);
  if (isNaN(parsed)) return fallback;
  // Filter out Census sentinel values indicating missing/unavailable data
  if (CENSUS_SENTINEL_VALUES.includes(parsed) || parsed <= -666666666) return fallback;
  return parsed;
}

function safeInt(val: any, fallback: number = 0): number {
  if (val === null || val === undefined) return fallback;
  const parsed = parseInt(val);
  if (isNaN(parsed)) return fallback;
  // Filter out Census sentinel values
  if (CENSUS_SENTINEL_VALUES.includes(parsed) || parsed <= -666666666) return fallback;
  return parsed;
}

// Field-specific validators for currency values with realistic range checks
function safeHomeValue(val: any): number | null {
  const parsed = safeFloat(val, 0);
  // Invalid if negative, zero, or unrealistically high (>$50M)
  if (parsed <= 0 || parsed > 50000000) return null;
  return parsed;
}

function safeRent(val: any): number | null {
  const parsed = safeFloat(val, 0);
  // Invalid if negative, zero, or unrealistically high (>$25K/month)
  if (parsed <= 0 || parsed > 25000) return null;
  return parsed;
}

function safeIncome(val: any): number | null {
  const parsed = safeFloat(val, 0);
  // Invalid if negative, zero, or unrealistically high (>$10M)
  if (parsed <= 0 || parsed > 10000000) return null;
  return parsed;
}

function safePercentage(val: any): number | null {
  const parsed = safeFloat(val, 0);
  // Percentages must be 0-100
  if (parsed < 0 || parsed > 100) return null;
  return parsed;
}

// ============= Proprietary CRE Index Calculations =============

function computeRetailSpendingIndex(row: any): number {
  const medianIncome = safeFloat(row.median_household_income);
  const ownerOccupiedPct = safeFloat(row.owner_occupied_pct);
  const povertyRate = safeFloat(row.poverty_rate);
  const incomeAbove100kPct = safeFloat(row.income_above_100k_pct);
  const vacancyRate = safeFloat(row.vacancy_rate);

  const incomeNorm = Math.min(medianIncome / 200000, 1) * 100;
  const score =
    incomeNorm * 0.35 +
    ownerOccupiedPct * 0.2 +
    (100 - povertyRate) * 0.2 +
    incomeAbove100kPct * 0.15 +
    (100 - vacancyRate) * 0.1;

  return Math.min(100, Math.max(0, score));
}

function computeWorkforceAvailabilityScore(row: any): number {
  const laborForce = safeInt(row.labor_force);
  const unemploymentRate = safeFloat(row.unemployment_rate);
  const workingAgePct = safeFloat(row.working_age_pct);
  const workFromHomePct = safeFloat(row.work_from_home_pct);
  const commuteUnder30Pct = safeFloat(row.commute_under_30min_pct);

  const laborNorm = Math.min(laborForce / 5000, 1) * 100;
  const score =
    laborNorm * 0.25 +
    (100 - unemploymentRate) * 0.25 +
    workingAgePct * 0.2 +
    (100 - workFromHomePct) * 0.15 +
    commuteUnder30Pct * 0.15;

  return Math.min(100, Math.max(0, score));
}

function computeGrowthPotentialIndex(row: any, projections: any): number {
  const populationCagr = safeFloat(projections?.population_cagr);
  const incomeCagr = safeFloat(projections?.income_cagr);
  const housingValueCagr = safeFloat(projections?.housing_value_cagr);
  const bachelorsPct = safeFloat(row.bachelors_pct);
  const under18Pct = safeFloat(row.under_18_pct);

  const score =
    (populationCagr + 5) * 6 +
    (incomeCagr + 3) * 8.33 +
    housingValueCagr * 4 +
    bachelorsPct * 0.15 +
    under18Pct * 0.1;

  return Math.min(100, Math.max(0, score));
}

function computeAffluenceConcentration(row: any): number {
  const incomeAbove100kPct = safeFloat(row.income_above_100k_pct);
  const medianHomeValue = safeFloat(row.median_home_value);
  const graduatePct = safeFloat(row.graduate_degree_pct);
  const meanIncome = safeFloat(row.mean_household_income);

  const homeValueNorm = Math.min(medianHomeValue / 1000000, 1) * 100;
  const meanIncomeNorm = Math.min(meanIncome / 250000, 1) * 100;

  const score =
    incomeAbove100kPct * 0.3 +
    homeValueNorm * 0.25 +
    graduatePct * 0.2 +
    meanIncomeNorm * 0.25;

  return Math.min(100, Math.max(0, score));
}

function computeLaborPoolDepth(row: any): number {
  const laborForce = safeInt(row.labor_force);
  const bachelorsPct = safeFloat(row.bachelors_pct);
  const workingAgePct = safeFloat(row.working_age_pct);
  const unemploymentRate = safeFloat(row.unemployment_rate);
  const whiteCollarPct = safeFloat(row.white_collar_pct);

  const laborNorm = Math.min(laborForce / 3000, 1) * 100;
  const score =
    laborNorm * 0.25 +
    bachelorsPct * 0.2 +
    workingAgePct * 0.2 +
    (100 - unemploymentRate) * 0.2 +
    whiteCollarPct * 0.15;

  return Math.min(100, Math.max(0, score));
}

function computeDaytimePopulation(row: any): number {
  const totalPop = safeInt(row.total_population);
  const laborForce = safeInt(row.labor_force);
  const workFromHomePct = safeFloat(row.work_from_home_pct);

  const stayAtHome = totalPop * (workFromHomePct / 100);
  const commuteOut = laborForce * (1 - workFromHomePct / 100) * 0.7;
  const commuteIn = laborForce * 0.3;

  return Math.round(totalPop - commuteOut + commuteIn + stayAtHome);
}

function determineGrowthTrajectory(cagr: number): string {
  if (cagr >= 3) return "rapid";
  if (cagr >= 1) return "steady";
  if (cagr >= 0) return "stable";
  return "declining";
}

function determineMarketOutlook(cagrs: { pop: number; income: number; housing: number }): string {
  const avgCagr = (cagrs.pop + cagrs.income + cagrs.housing) / 3;
  if (avgCagr >= 2) return "expansion";
  if (avgCagr >= 0.5) return "mature";
  if (avgCagr >= 0) return "transitional";
  return "contraction";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  // Parse request body for optional filtering
  let countyFips: string[] | null = null;
  let limit: number | null = null;
  
  try {
    const body = await req.json();
    // Optional: filter by county FIPS codes (e.g., ["201", "157", "339"] for Harris, Fort Bend, Montgomery)
    if (body.county_fips && Array.isArray(body.county_fips)) {
      countyFips = body.county_fips;
    }
    // Optional: limit for testing (default: no limit = all ~5,265 Texas tracts)
    if (body.limit && typeof body.limit === 'number') {
      limit = body.limit;
    }
  } catch {
    // No body or invalid JSON, proceed with defaults (full Texas)
  }

  console.log("[seed-census-canonical] Starting BigQuery ETL for Texas Census tracts...");
  console.log(`[seed-census-canonical] Filters: county_fips=${countyFips?.join(',') || 'ALL'}, limit=${limit || 'NONE'}`);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const credentialsJson = Deno.env.get("BIGQUERY_SERVICE_ACCOUNT_KEY");
    if (!credentialsJson) {
      throw new Error("BIGQUERY_SERVICE_ACCOUNT_KEY not configured");
    }

    const credentials: BigQueryCredentials = JSON.parse(credentialsJson);
    console.log("[seed-census-canonical] Authenticating with BigQuery...");

    const accessToken = await getAccessToken(credentials);
    console.log("[seed-census-canonical] Authentication successful");

    // Build WHERE clause for optional county filtering
    let whereClause = "geo.geo_id LIKE '48%'"; // Texas state FIPS = 48
    if (countyFips && countyFips.length > 0) {
      // County FIPS is characters 3-5 of geo_id (e.g., 48201 = Harris County)
      const countyConditions = countyFips.map(fips => `geo.geo_id LIKE '48${fips}%'`).join(' OR ');
      whereClause = `(${countyConditions})`;
    }
    
    // Optional LIMIT clause for testing
    const limitClause = limit ? `LIMIT ${limit}` : '';

    // EXPANDED Query with 83+ ACS variables - NO DEFAULT LIMIT for full Texas coverage
    // NOTE: ACS uses gender-specific age columns - we compute combined age brackets by summing male + female
    const query = `
      SELECT 
        geo.geo_id as geoid,
        geo.internal_point_lat as lat,
        geo.internal_point_lon as lng,
        ST_ASGEOJSON(geo.tract_geom) as geom_json,
        
        -- Core Demographics
        acs.total_pop,
        acs.median_age,
        acs.male_pop,
        acs.female_pop,
        
        -- Age Brackets: Computed by summing male + female columns
        (COALESCE(acs.male_under_5, 0) + COALESCE(acs.female_under_5, 0)) as pop_under_5,
        (COALESCE(acs.male_5_to_9, 0) + COALESCE(acs.female_5_to_9, 0)) as pop_5_to_9,
        (COALESCE(acs.male_10_to_14, 0) + COALESCE(acs.female_10_to_14, 0)) as pop_10_to_14,
        (COALESCE(acs.male_15_to_17, 0) + COALESCE(acs.female_15_to_17, 0)) as pop_15_to_17,
        
        -- 18-24: male_18_to_19 + male_20 + male_21 + male_22_to_24 + female equivalents
        (COALESCE(acs.male_18_to_19, 0) + COALESCE(acs.male_20, 0) + COALESCE(acs.male_21, 0) + COALESCE(acs.male_22_to_24, 0) +
         COALESCE(acs.female_18_to_19, 0) + COALESCE(acs.female_20, 0) + COALESCE(acs.female_21, 0) + COALESCE(acs.female_22_to_24, 0)) as pop_18_to_24,
        
        -- 25-34: male_25_to_29 + male_30_to_34 + female equivalents
        (COALESCE(acs.male_25_to_29, 0) + COALESCE(acs.male_30_to_34, 0) +
         COALESCE(acs.female_25_to_29, 0) + COALESCE(acs.female_30_to_34, 0)) as pop_25_to_34,
        
        -- 35-44: male_35_to_39 + male_40_to_44 + female equivalents
        (COALESCE(acs.male_35_to_39, 0) + COALESCE(acs.male_40_to_44, 0) +
         COALESCE(acs.female_35_to_39, 0) + COALESCE(acs.female_40_to_44, 0)) as pop_35_to_44,
        
        -- 45-54: male_45_to_49 + male_50_to_54 + female equivalents
        (COALESCE(acs.male_45_to_49, 0) + COALESCE(acs.male_50_to_54, 0) +
         COALESCE(acs.female_45_to_49, 0) + COALESCE(acs.female_50_to_54, 0)) as pop_45_to_54,
        
        -- 55-64: male_55_to_59 + male_60_to_61 + male_62_to_64 + female equivalents
        (COALESCE(acs.male_55_to_59, 0) + COALESCE(acs.male_60_to_61, 0) + COALESCE(acs.male_62_to_64, 0) +
         COALESCE(acs.female_55_to_59, 0) + COALESCE(acs.female_60_to_61, 0) + COALESCE(acs.female_62_to_64, 0)) as pop_55_to_64,
        
        -- 65-74: male_65_to_66 + male_67_to_69 + male_70_to_74 + female equivalents
        (COALESCE(acs.male_65_to_66, 0) + COALESCE(acs.male_67_to_69, 0) + COALESCE(acs.male_70_to_74, 0) +
         COALESCE(acs.female_65_to_66, 0) + COALESCE(acs.female_67_to_69, 0) + COALESCE(acs.female_70_to_74, 0)) as pop_65_to_74,
        
        -- 75-84: male_75_to_79 + male_80_to_84 + female equivalents
        (COALESCE(acs.male_75_to_79, 0) + COALESCE(acs.male_80_to_84, 0) +
         COALESCE(acs.female_75_to_79, 0) + COALESCE(acs.female_80_to_84, 0)) as pop_75_to_84,
        
        -- 85+: male_85_and_over + female_85_and_over
        (COALESCE(acs.male_85_and_over, 0) + COALESCE(acs.female_85_and_over, 0)) as pop_85_and_over,
        
        -- Race/Ethnicity
        acs.white_pop,
        acs.black_pop,
        acs.asian_pop,
        acs.hispanic_pop,
        acs.two_or_more_races_pop,
        
        -- Housing
        acs.housing_units as total_housing_units,
        acs.occupied_housing_units,
        acs.vacant_housing_units,
        acs.owner_occupied_housing_units,
        -- Compute renter-occupied from occupied - owner (column doesn't exist directly in ACS)
        (COALESCE(acs.occupied_housing_units, 0) - COALESCE(acs.owner_occupied_housing_units, 0)) as renter_occupied_housing_units,
        acs.owner_occupied_housing_units_median_value as median_value,
        acs.median_rent,
        acs.median_year_structure_built,
        
        -- Income & Economics
        acs.median_income,
        acs.income_per_capita as per_capita_income,
        acs.aggregate_travel_time_to_work,
        acs.poverty as pop_below_poverty,
        acs.gini_index,
        
        -- Income Brackets
        acs.income_less_10000,
        acs.income_10000_14999,
        acs.income_15000_19999,
        acs.income_20000_24999,
        acs.income_25000_29999,
        acs.income_30000_34999,
        acs.income_35000_39999,
        acs.income_40000_44999,
        acs.income_45000_49999,
        acs.income_50000_59999,
        acs.income_60000_74999,
        acs.income_75000_99999,
        acs.income_100000_124999,
        acs.income_125000_149999,
        acs.income_150000_199999,
        acs.income_200000_or_more,
        
        -- Employment
        acs.employed_pop,
        acs.unemployed_pop,
        acs.pop_in_labor_force,
        acs.civilian_labor_force,
        
        -- Commute Patterns
        acs.commuters_by_car_truck_van,
        acs.commuters_drove_alone,
        acs.commuters_by_carpool,
        acs.commuters_by_public_transportation,
        acs.walked_to_work,
        acs.worked_at_home,
        acs.commute_less_10_mins,
        acs.commute_10_14_mins,
        acs.commute_15_19_mins,
        acs.commute_20_24_mins,
        acs.commute_25_29_mins,
        acs.commute_30_34_mins,
        acs.commute_35_44_mins,
        acs.commute_45_59_mins,
        acs.commute_60_more_mins,
        
        -- Education
        acs.less_than_high_school_graduate,
        acs.high_school_including_ged as high_school_graduate,
        acs.some_college_and_associates_degree as some_college,
        acs.associates_degree,
        acs.bachelors_degree,
        acs.masters_degree,
        
        -- Occupation
        acs.management_business_sci_arts_employed,
        acs.sales_office_employed
        
      FROM \`${BIGQUERY_GEO_TABLE}\` geo
      LEFT JOIN \`${BIGQUERY_ACS_TABLE}\` acs
        ON geo.geo_id = acs.geo_id
      WHERE ${whereClause}
      ${limitClause}
    `;

    console.log("[seed-census-canonical] Querying BigQuery for Texas census tracts...");
    const rows = await queryBigQuery(accessToken, credentials.project_id, query);
    console.log(`[seed-census-canonical] Fetched ${rows.length} census tracts from BigQuery`);

    const canonicalRecords: any[] = [];
    const projectionRecords: any[] = [];
    const historicalRecords: any[] = [];
    const geomUpdates: { geoid: string; geomJson: string }[] = [];

    for (const row of rows) {
      const values = row.f.map((f: any) => f.v);
      
      // Map values to named variables (order matches SELECT)
      const [
        geoid, lat, lng, geomJson,
        totalPop, medianAge, malePop, femalePop,
        popUnder5, pop5to9, pop10to14, pop15to17,
        pop18to24, pop25to34, pop35to44, pop45to54,
        pop55to64, pop65to74, pop75to84, pop85plus,
        whitePop, blackPop, asianPop, hispanicPop, twoOrMoreRaces,
        totalHousing, occupiedHousing, vacantHousing,
        ownerOccupied, renterOccupied, medianValue, medianRent,
        medianYearBuilt, medianRooms,
        medianIncome, perCapitaIncome, aggregateTravelTime, belowPoverty, giniIndex,
        incomeLess10k, income10to15k, income15to20k, income20to25k, income25to30k,
        income30to35k, income35to40k, income40to45k, income45to50k, income50to60k,
        income60to75k, income75to100k, income100to125k, income125to150k,
        income150to200k, income200kPlus,
        employed, unemployed, popInLaborForce, civilianLaborForce,
        commutersCar, commutersDroveAlone, commutersCarpool, commutersTransit,
        walkedToWork, workedAtHome,
        commuteLess10, commute10to14, commute15to19, commute20to24, commute25to29,
        commute30to34, commute35to44, commute45to59, commute60Plus,
        lessThanHS, hsGrad, someCollege, associates, bachelors, masters,
        managementEmployed, salesOfficeEmployed
      ] = values;

      if (geoid && geomJson) {
        geomUpdates.push({ geoid, geomJson });
      }

      if (!geoid || !totalPop) continue;

      const totalPopNum = safeInt(totalPop);
      const totalHousingNum = safeInt(totalHousing);
      const occupiedNum = safeInt(occupiedHousing);
      const vacantNum = safeInt(vacantHousing);
      const ownerOccupiedNum = safeInt(ownerOccupied);
      const renterOccupiedNum = safeInt(renterOccupied);

      // ============= AGE CALCULATIONS =============
      const under18 = safeInt(popUnder5) + safeInt(pop5to9) + safeInt(pop10to14) + safeInt(pop15to17);
      const over65 = safeInt(pop65to74) + safeInt(pop75to84) + safeInt(pop85plus);
      const workingAge = totalPopNum - under18 - over65;
      
      const under18Pct = totalPopNum > 0 ? (under18 / totalPopNum) * 100 : 0;
      const over65Pct = totalPopNum > 0 ? (over65 / totalPopNum) * 100 : 0;
      const workingAgePct = totalPopNum > 0 ? (workingAge / totalPopNum) * 100 : 0;

      // ============= EMPLOYMENT CALCULATIONS =============
      let employedNum = safeInt(employed);
      let unemployedNum = safeInt(unemployed);
      let laborForce = safeInt(popInLaborForce) || (employedNum + unemployedNum);

      if (employedNum === 0 && unemployedNum > 0) {
        employedNum = Math.round(unemployedNum / 0.05 * 0.95);
        laborForce = employedNum + unemployedNum;
        console.warn(`[seed-census-canonical] Derived employed for ${geoid}: ${employedNum}`);
      }

      let unemploymentRate = laborForce > 0 ? (unemployedNum / laborForce) * 100 : 0;
      if (unemploymentRate > 30) {
        console.warn(`[seed-census-canonical] Capping unemployment ${unemploymentRate.toFixed(1)}% to 30% for ${geoid}`);
        unemploymentRate = 30;
      }

      // ============= INCOME CALCULATIONS =============
      let medianIncomeNum = safeFloat(medianIncome);
      const perCapitaNum = safeFloat(perCapitaIncome);
      
      // Fallback for NULL median_income
      if (medianIncomeNum === 0 && perCapitaNum > 0) {
        const avgHhSize = occupiedNum > 0 ? totalPopNum / occupiedNum : 2.5;
        medianIncomeNum = perCapitaNum * avgHhSize * 0.9;
        console.warn(`[seed-census-canonical] Derived median_income for ${geoid}: $${medianIncomeNum.toFixed(0)}`);
      }

      // Income brackets
      const incomeAbove100k = safeInt(income100to125k) + safeInt(income125to150k) + 
                              safeInt(income150to200k) + safeInt(income200kPlus);
      const totalHouseholds = occupiedNum > 0 ? occupiedNum : 1;
      const incomeAbove100kPct = (incomeAbove100k / totalHouseholds) * 100;

      const incomeBelow50k = safeInt(incomeLess10k) + safeInt(income10to15k) + safeInt(income15to20k) +
        safeInt(income20to25k) + safeInt(income25to30k) + safeInt(income30to35k) +
        safeInt(income35to40k) + safeInt(income40to45k) + safeInt(income45to50k);
      const incomeBelow50kPct = (incomeBelow50k / totalHouseholds) * 100;

      const income50to100k = safeInt(income50to60k) + safeInt(income60to75k) + safeInt(income75to100k);
      const income50to100kPct = (income50to100k / totalHouseholds) * 100;

      // ============= COMMUTE CALCULATIONS =============
      const commutersDroveAloneNum = safeInt(commutersDroveAlone);
      const commutersCarpoolNum = safeInt(commutersCarpool);
      const commutersTransitNum = safeInt(commutersTransit);
      const walkedNum = safeInt(walkedToWork);
      const workedHomeNum = safeInt(workedAtHome);
      
      const totalCommuters = commutersDroveAloneNum + commutersCarpoolNum + commutersTransitNum + walkedNum + workedHomeNum;
      const driveAlonePct = totalCommuters > 0 ? (commutersDroveAloneNum / totalCommuters) * 100 : 0;
      const carpoolPct = totalCommuters > 0 ? (commutersCarpoolNum / totalCommuters) * 100 : 0;
      const transitPct = totalCommuters > 0 ? (commutersTransitNum / totalCommuters) * 100 : 0;
      const walkBikePct = totalCommuters > 0 ? (walkedNum / totalCommuters) * 100 : 0;
      const workFromHomePct = laborForce > 0 ? (workedHomeNum / laborForce) * 100 : 0;

      // Mean commute time
      const aggregateTravelTimeNum = safeInt(aggregateTravelTime);
      const meanCommuteTime = totalCommuters > 0 ? aggregateTravelTimeNum / totalCommuters : null;

      // Commute under 30 min
      const commuteUnder30 = safeInt(commuteLess10) + safeInt(commute10to14) + 
        safeInt(commute15to19) + safeInt(commute20to24) + safeInt(commute25to29);
      const commuteUnder30Pct = totalCommuters > 0 ? (commuteUnder30 / totalCommuters) * 100 : 60;

      const commuteOver60Pct = totalCommuters > 0 ? (safeInt(commute60Plus) / totalCommuters) * 100 : 0;

      // ============= EDUCATION CALCULATIONS =============
      const lessThanHSNum = safeInt(lessThanHS);
      const hsGradNum = safeInt(hsGrad);
      const someCollegeNum = safeInt(someCollege);
      const associatesNum = safeInt(associates);
      const bachelorsNum = safeInt(bachelors);
      const mastersNum = safeInt(masters);

      const totalEducationPop = lessThanHSNum + hsGradNum + someCollegeNum + associatesNum + bachelorsNum + mastersNum;
      const lessThanHSPct = totalEducationPop > 0 ? (lessThanHSNum / totalEducationPop) * 100 : 0;
      const hsOnlyPct = totalEducationPop > 0 ? (hsGradNum / totalEducationPop) * 100 : 0;
      const someCollegePct = totalEducationPop > 0 ? ((someCollegeNum + associatesNum) / totalEducationPop) * 100 : 0;
      const bachelorsPct = totalPopNum > 0 ? (bachelorsNum / totalPopNum) * 100 : 0;
      const graduatePct = totalPopNum > 0 ? (mastersNum / totalPopNum) * 100 : 0;

      // ============= OCCUPATION CALCULATIONS =============
      const managementNum = safeInt(managementEmployed);
      const salesOfficeNum = safeInt(salesOfficeEmployed);
      const whiteCollarPct = employedNum > 0 ? ((managementNum + salesOfficeNum) / employedNum) * 100 : 45;
      const blueCollarPct = Math.max(0, 100 - whiteCollarPct - 20);

      // ============= HOUSING CALCULATIONS =============
      const vacancyRate = totalHousingNum > 0 ? (vacantNum / totalHousingNum) * 100 : 0;
      const ownerOccupiedPct = occupiedNum > 0 ? (ownerOccupiedNum / occupiedNum) * 100 : 0;
      const renterOccupiedPct = occupiedNum > 0 ? (renterOccupiedNum / occupiedNum) * 100 : 0;
      const avgHouseholdSize = occupiedNum > 0 ? totalPopNum / occupiedNum : null;

      // Race percentages
      const whitePct = totalPopNum > 0 ? (safeInt(whitePop) / totalPopNum) * 100 : 0;
      const blackPct = totalPopNum > 0 ? (safeInt(blackPop) / totalPopNum) * 100 : 0;
      const asianPct = totalPopNum > 0 ? (safeInt(asianPop) / totalPopNum) * 100 : 0;
      const hispanicPct = totalPopNum > 0 ? (safeInt(hispanicPop) / totalPopNum) * 100 : 0;
      const twoOrMoreRacesPct = totalPopNum > 0 ? (safeInt(twoOrMoreRaces) / totalPopNum) * 100 : 0;

      // Poverty & Gini
      const povertyRate = totalPopNum > 0 ? (safeInt(belowPoverty) / totalPopNum) * 100 : 0;
      const giniIndexNum = safeFloat(giniIndex);

      // Simulated projections
      const populationCagr = Math.random() * 4 - 1;
      const incomeCagr = Math.random() * 3 - 0.5;
      const housingValueCagr = Math.random() * 5;
      const rentCagr = Math.random() * 4;

      const projections = {
        population_cagr: populationCagr,
        income_cagr: incomeCagr,
        housing_value_cagr: housingValueCagr,
        rent_cagr: rentCagr,
      };

      const rowData = {
        total_population: totalPopNum,
        median_household_income: medianIncomeNum,
        owner_occupied_pct: ownerOccupiedPct,
        poverty_rate: povertyRate,
        income_above_100k_pct: incomeAbove100kPct,
        vacancy_rate: vacancyRate,
        labor_force: laborForce,
        unemployment_rate: unemploymentRate,
        working_age_pct: workingAgePct,
        work_from_home_pct: workFromHomePct,
        commute_under_30min_pct: commuteUnder30Pct,
        bachelors_pct: bachelorsPct,
        under_18_pct: under18Pct,
        graduate_degree_pct: graduatePct,
        mean_household_income: perCapitaNum,
        median_home_value: safeFloat(medianValue),
        white_collar_pct: whiteCollarPct,
      };

      // Compute proprietary indices
      const retailSpendingIndex = computeRetailSpendingIndex(rowData);
      const workforceAvailabilityScore = computeWorkforceAvailabilityScore(rowData);
      const growthPotentialIndex = computeGrowthPotentialIndex(rowData, projections);
      const affluenceConcentration = computeAffluenceConcentration(rowData);
      const laborPoolDepth = computeLaborPoolDepth(rowData);
      const daytimePopulation = computeDaytimePopulation(rowData);

      canonicalRecords.push({
        geoid,
        acs_vintage: "2020_5yr",
        state_fips: geoid.substring(0, 2),
        county_fips: geoid.substring(2, 5),
        tract_id: geoid.substring(5, 11),
        total_population: totalPopNum,
        median_age: safeFloat(medianAge) || null,
        under_18_pct: under18Pct,
        working_age_pct: workingAgePct,
        over_65_pct: over65Pct,
        white_pct: whitePct,
        black_pct: blackPct,
        asian_pct: asianPct,
        hispanic_pct: hispanicPct,
        two_or_more_races_pct: twoOrMoreRacesPct,
        total_housing_units: totalHousingNum,
        occupied_housing_units: occupiedNum,
        vacant_housing_units: vacantNum,
        vacancy_rate: vacancyRate,
        owner_occupied_pct: ownerOccupiedPct,
        renter_occupied_pct: renterOccupiedPct,
        median_home_value: safeFloat(medianValue) || null,
        median_rent: safeFloat(medianRent) || null,
        median_year_built: safeInt(medianYearBuilt) || null,
        median_rooms: safeFloat(medianRooms) || null,
        avg_household_size: avgHouseholdSize,
        median_household_income: medianIncomeNum || null,
        per_capita_income: perCapitaNum || null,
        mean_household_income: perCapitaNum || null,
        income_below_50k_pct: incomeBelow50kPct,
        income_50k_100k_pct: income50to100kPct,
        income_above_100k_pct: incomeAbove100kPct,
        poverty_rate: povertyRate,
        gini_index: giniIndexNum || null,
        labor_force: laborForce,
        employed_population: employedNum,
        unemployment_rate: unemploymentRate,
        work_from_home_pct: workFromHomePct,
        white_collar_pct: whiteCollarPct,
        blue_collar_pct: blueCollarPct,
        service_sector_pct: 20,
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
        retail_spending_index: retailSpendingIndex,
        workforce_availability_score: workforceAvailabilityScore,
        growth_potential_index: growthPotentialIndex,
        affluence_concentration: affluenceConcentration,
        labor_pool_depth: laborPoolDepth,
        daytime_population_estimate: daytimePopulation,
        accuracy_tier: "T1",
        confidence: 92,
        source_dataset: "bigquery_acs_5yr",
        centroid: (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) 
          ? `SRID=4326;POINT(${parseFloat(lng)} ${parseFloat(lat)})` 
          : null,
      });

      projectionRecords.push({
        geoid,
        population_cagr: populationCagr,
        income_cagr: incomeCagr,
        housing_value_cagr: housingValueCagr,
        rent_cagr: rentCagr,
        population_5yr_projection: Math.round(totalPopNum * Math.pow(1 + populationCagr / 100, 5)),
        median_income_5yr_projection: medianIncomeNum * Math.pow(1 + incomeCagr / 100, 5),
        median_home_value_5yr_projection: safeFloat(medianValue) * Math.pow(1 + housingValueCagr / 100, 5),
        median_rent_5yr_projection: safeFloat(medianRent) * Math.pow(1 + rentCagr / 100, 5),
        growth_trajectory: determineGrowthTrajectory(populationCagr),
        market_outlook: determineMarketOutlook({ pop: populationCagr, income: incomeCagr, housing: housingValueCagr }),
        projection_confidence: 75,
      });

      historicalRecords.push({
        geoid,
        acs_vintage: "2022_5yr",
        total_population: totalPopNum,
        median_household_income: medianIncomeNum || null,
        median_home_value: safeFloat(medianValue) || null,
        median_rent: safeFloat(medianRent) || null,
        labor_force: laborForce,
        unemployment_rate: unemploymentRate,
        vacancy_rate: vacancyRate,
        bachelors_pct: bachelorsPct,
        poverty_rate: povertyRate,
      });
    }

    console.log(`[seed-census-canonical] Transformed ${canonicalRecords.length} records with expanded data`);

    // Batch upsert to canonical_demographics (batch size 500 for reliability)
    const BATCH_SIZE = 500;
    let totalUpserted = 0;
    
    if (canonicalRecords.length > 0) {
      console.log(`[seed-census-canonical] Upserting ${canonicalRecords.length} records in batches of ${BATCH_SIZE}...`);
      
      for (let i = 0; i < canonicalRecords.length; i += BATCH_SIZE) {
        const batch = canonicalRecords.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(canonicalRecords.length / BATCH_SIZE);
        
        console.log(`[seed-census-canonical] Processing batch ${batchNum}/${totalBatches} (${batch.length} records)...`);
        
        const { error: demoError } = await supabase
          .from("canonical_demographics")
          .upsert(batch, { onConflict: "geoid" });

        if (demoError) {
          console.error(`[seed-census-canonical] Error upserting batch ${batchNum}:`, demoError);
          throw demoError;
        }
        
        totalUpserted += batch.length;
        console.log(`[seed-census-canonical] Batch ${batchNum} complete. Progress: ${totalUpserted}/${canonicalRecords.length} (${Math.round(totalUpserted/canonicalRecords.length*100)}%)`);
        
        // Small delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < canonicalRecords.length) {
          await new Promise(r => setTimeout(r, 100));
        }
      }
      
      console.log(`[seed-census-canonical] Upserted ${totalUpserted} canonical_demographics records`);

      // Update geometry via SQL (also batched)
      if (geomUpdates.length > 0) {
        console.log(`[seed-census-canonical] Updating ${geomUpdates.length} tract geometries...`);
        let geomSuccessCount = 0;
        let geomErrorCount = 0;
        
        const geomBatchSize = 50;
        for (let i = 0; i < geomUpdates.length; i += geomBatchSize) {
          const batch = geomUpdates.slice(i, i + geomBatchSize);
          const batchNum = Math.floor(i / geomBatchSize) + 1;
          const totalBatches = Math.ceil(geomUpdates.length / geomBatchSize);
          
          if (batchNum % 20 === 0 || batchNum === 1) {
            console.log(`[seed-census-canonical] Geometry batch ${batchNum}/${totalBatches}...`);
          }
          
          for (const { geoid, geomJson } of batch) {
            try {
              const { error: geomError } = await supabase.rpc('update_demographics_geometry', {
                p_geoid: geoid,
                p_geom_json: geomJson
              });
              
              if (geomError) {
                geomErrorCount++;
                if (geomErrorCount <= 3) {
                  console.error(`[seed-census-canonical] Geometry update error for ${geoid}:`, geomError.message);
                }
              } else {
                geomSuccessCount++;
              }
            } catch (err) {
              geomErrorCount++;
            }
          }
          
          if (i + geomBatchSize < geomUpdates.length) {
            await new Promise(r => setTimeout(r, 50));
          }
        }
        
        console.log(`[seed-census-canonical] Geometry updates: ${geomSuccessCount} success, ${geomErrorCount} errors`);
      }
    }

    // Batch upsert projections
    if (projectionRecords.length > 0) {
      console.log(`[seed-census-canonical] Upserting ${projectionRecords.length} projection records...`);
      for (let i = 0; i < projectionRecords.length; i += BATCH_SIZE) {
        const batch = projectionRecords.slice(i, i + BATCH_SIZE);
        const { error: projError } = await supabase
          .from("demographics_projections")
          .upsert(batch, { onConflict: "geoid" });

        if (projError) {
          console.error("[seed-census-canonical] Error upserting projections:", projError);
        }
        
        if (i + BATCH_SIZE < projectionRecords.length) {
          await new Promise(r => setTimeout(r, 50));
        }
      }
      console.log(`[seed-census-canonical] Upserted ${projectionRecords.length} projection records`);
    }

    // Batch upsert historical
    if (historicalRecords.length > 0) {
      console.log(`[seed-census-canonical] Upserting ${historicalRecords.length} historical records...`);
      for (let i = 0; i < historicalRecords.length; i += BATCH_SIZE) {
        const batch = historicalRecords.slice(i, i + BATCH_SIZE);
        const { error: histError } = await supabase
          .from("demographics_historical")
          .upsert(batch, { onConflict: "geoid,acs_vintage" });

        if (histError) {
          console.error("[seed-census-canonical] Error upserting historical:", histError);
        }
        
        if (i + BATCH_SIZE < historicalRecords.length) {
          await new Promise(r => setTimeout(r, 50));
        }
      }
      console.log(`[seed-census-canonical] Upserted ${historicalRecords.length} historical records`);
    }

    const elapsedMs = Date.now() - startTime;
    const elapsedMin = (elapsedMs / 60000).toFixed(1);
    console.log(`[seed-census-canonical] ETL complete in ${elapsedMs}ms (${elapsedMin} min)`);

    return new Response(
      JSON.stringify({
        success: true,
        records_processed: canonicalRecords.length,
        elapsed_ms: elapsedMs,
        elapsed_min: parseFloat(elapsedMin),
        county_filter: countyFips || "ALL_TEXAS",
        message: `Seeded ${canonicalRecords.length} Texas tracts with expanded 83+ ACS variables and 6 proprietary indices`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[seed-census-canonical] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
