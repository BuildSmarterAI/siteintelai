import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Houston Metro incorporated cities WITH their own zoning/development ordinances
// These cities do NOT follow Houston's deed restriction path
const HARRIS_INCORPORATED_WITH_ZONING = [
  'bellaire', 'bunker hill village', 'hedwig village',
  'hunters creek village', 'piney point village', 'spring valley village',
  'west university place', 'southside place', 'jersey village',
  'la porte', 'pasadena', 'baytown', 'deer park', 'humble',
  'katy', 'missouri city', 'pearland', 'league city', 'friendswood',
  'galveston', 'texas city', 'dickinson', 'santa fe'
];

// Fort Bend incorporated cities with zoning
const FORT_BEND_INCORPORATED_WITH_ZONING = [
  'sugar land', 'missouri city', 'rosenberg', 'richmond',
  'stafford', 'meadows place', 'fulshear', 'needville'
];

// Montgomery incorporated cities with zoning
const MONTGOMERY_INCORPORATED_WITH_ZONING = [
  'conroe', 'the woodlands', 'shenandoah', 'oak ridge north',
  'magnolia', 'willis', 'montgomery', 'roman forest'
];

interface JurisdictionRequest {
  lat: number;
  lng: number;
  city?: string;
  county?: string;
  parcel_id?: string;
  application_id?: string;
}

interface GoverningAuthority {
  city: string | null;
  county: string;
  etj_provider: string | null;
  special_districts: string[];
}

interface MetroRegion {
  metro_key: string;
  metro_name: string;
  is_primary_county: boolean;
}

interface Ruleset {
  jurisdiction_key: string;
  jurisdiction_name: string;
  governing_path: string;
  default_setbacks: {
    front: number;
    side: number;
    rear: number;
    street_side: number;
  };
  development_controls: Record<string, any>;
  story_height_assumptions: Record<string, number>;
}

interface ConfidenceResult {
  level: 'High' | 'Medium' | 'Low';
  score: number;
  reasons: string[];
}

type GoverningPath = 'Houston_Deed' | 'Formal_Zoning' | 'County_Standards' | 'ETJ_Standards';

function normalizeCounty(county: string): string {
  return county
    .toLowerCase()
    .replace(/\s+county$/i, '')
    .replace(/\s+/g, '_')
    .trim();
}

function normalizeCity(city: string): string {
  return city.toLowerCase().trim();
}

function isHoustonDeedCity(city: string, county: string): boolean {
  const normalizedCity = normalizeCity(city);
  const normalizedCounty = normalizeCounty(county);

  // City of Houston itself - always Houston Deed path
  if (normalizedCity === 'houston') {
    return true;
  }

  // Check if city has its own zoning ordinance
  if (normalizedCounty === 'harris') {
    return !HARRIS_INCORPORATED_WITH_ZONING.includes(normalizedCity);
  }

  if (normalizedCounty === 'fort_bend') {
    return !FORT_BEND_INCORPORATED_WITH_ZONING.includes(normalizedCity);
  }

  if (normalizedCounty === 'montgomery') {
    return !MONTGOMERY_INCORPORATED_WITH_ZONING.includes(normalizedCity);
  }

  // Unknown city in Houston metro - assume deed restriction path for unincorporated
  return true;
}

function determineGoverningPath(
  metroKey: string | null,
  city: string | null,
  county: string,
  isUnincorporated: boolean
): GoverningPath {
  // Houston Metro special handling
  if (metroKey === 'houston') {
    if (!city || isUnincorporated) {
      // Unincorporated Harris/Fort Bend/Montgomery - Houston Deed path
      return 'Houston_Deed';
    }

    if (isHoustonDeedCity(city, county)) {
      return 'Houston_Deed';
    }

    // Incorporated city with zoning
    return 'Formal_Zoning';
  }

  // All other metros use formal zoning
  if (metroKey === 'austin' || metroKey === 'san_antonio' || metroKey === 'dallas') {
    if (!city || isUnincorporated) {
      return 'County_Standards';
    }
    return 'Formal_Zoning';
  }

  // Unknown metro - default to county standards
  return 'County_Standards';
}

function buildJurisdictionKey(
  governingPath: GoverningPath,
  city: string | null,
  county: string,
  metroKey: string | null
): string {
  const normalizedCounty = normalizeCounty(county);

  switch (governingPath) {
    case 'Houston_Deed':
      return 'city_of_houston'; // Houston deed restrictions apply to entire Houston metro unincorporated

    case 'Formal_Zoning':
      if (city) {
        const normalizedCity = normalizeCity(city);
        // Map common cities to their jurisdiction keys
        if (normalizedCity === 'austin') return 'city_of_austin';
        if (normalizedCity === 'san antonio') return 'city_of_san_antonio';
        if (normalizedCity === 'dallas') return 'city_of_dallas';
        if (normalizedCity === 'fort worth') return 'city_of_fort_worth';
        if (normalizedCity === 'sugar land') return 'city_of_sugar_land';
        if (normalizedCity === 'the woodlands') return 'the_woodlands_township';
        // Return a constructed key for other cities
        return `city_of_${normalizedCity.replace(/\s+/g, '_')}`;
      }
      return `${normalizedCounty}_county`;

    case 'County_Standards':
      return `${normalizedCounty}_county`;

    case 'ETJ_Standards':
      if (city) {
        return `${normalizeCity(city).replace(/\s+/g, '_')}_etj`;
      }
      return `${normalizedCounty}_county_etj`;

    default:
      return `${normalizedCounty}_county`;
  }
}

function calculateConfidence(
  metroRegion: MetroRegion | null,
  city: string | null,
  county: string,
  ruleset: Ruleset | null,
  governingPath: GoverningPath
): ConfidenceResult {
  const reasons: string[] = [];
  let score = 100;

  // Metro region confidence
  if (!metroRegion) {
    score -= 20;
    reasons.push('County not in known metro region mapping');
  } else if (!metroRegion.is_primary_county) {
    score -= 5;
    reasons.push('Secondary metro county - may have edge cases');
  }

  // City resolution confidence
  if (!city) {
    score -= 15;
    reasons.push('No city provided - assuming unincorporated');
  }

  // Ruleset availability
  if (!ruleset) {
    score -= 25;
    reasons.push('No jurisdiction-specific ruleset found - using defaults');
  }

  // Path-specific confidence adjustments
  if (governingPath === 'Houston_Deed') {
    // Houston deed path requires deed restriction lookup which isn't done here
    score -= 10;
    reasons.push('Houston Deed path - requires deed restriction document lookup');
  }

  if (governingPath === 'ETJ_Standards') {
    score -= 15;
    reasons.push('ETJ area - standards may vary by annexation status');
  }

  // Determine level
  let level: 'High' | 'Medium' | 'Low';
  if (score >= 80) {
    level = 'High';
  } else if (score >= 50) {
    level = 'Medium';
  } else {
    level = 'Low';
  }

  return { level, score: Math.max(0, score), reasons };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const traceId = crypto.randomUUID().slice(0, 8);

  console.log(`[${traceId}] resolve-jurisdiction: Starting`);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: JurisdictionRequest = await req.json();
    const { lat, lng, city, county, parcel_id, application_id } = body;

    console.log(`[${traceId}] Input: lat=${lat}, lng=${lng}, city=${city}, county=${county}`);

    // Validate required inputs
    if (!county) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'County is required for jurisdiction resolution',
          code: 'MISSING_COUNTY'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedCounty = normalizeCounty(county);
    console.log(`[${traceId}] Normalized county: ${normalizedCounty}`);

    // Step 1: Lookup metro region from county mapping
    const { data: countyMapping, error: mappingError } = await supabase
      .from('county_metro_mapping')
      .select('metro_key, county_name, is_primary_county')
      .ilike('county_name', `%${normalizedCounty.replace(/_/g, ' ')}%`)
      .maybeSingle();

    if (mappingError) {
      console.error(`[${traceId}] County mapping error:`, mappingError);
    }

    let metroRegion: MetroRegion | null = null;
    let metroKey: string | null = null;

    if (countyMapping?.metro_key) {
      metroKey = countyMapping.metro_key;

      // Get metro region details
      const { data: metro } = await supabase
        .from('metro_regions')
        .select('metro_key, metro_name')
        .eq('metro_key', metroKey)
        .maybeSingle();

      if (metro) {
        metroRegion = {
          metro_key: metro.metro_key,
          metro_name: metro.metro_name,
          is_primary_county: countyMapping.is_primary_county ?? false
        };
      }
    }

    console.log(`[${traceId}] Metro region: ${metroRegion?.metro_key ?? 'none'}`);

    // Step 2: Determine if unincorporated
    const isUnincorporated = !city || 
      city.toLowerCase().includes('unincorporated') ||
      city.toLowerCase() === county.toLowerCase();

    // Step 3: Determine governing path
    const governingPath = determineGoverningPath(
      metroKey,
      city ?? null,
      county,
      isUnincorporated
    );

    console.log(`[${traceId}] Governing path: ${governingPath}`);

    // Step 4: Build jurisdiction key and lookup ruleset
    const jurisdictionKey = buildJurisdictionKey(governingPath, city ?? null, county, metroKey);
    console.log(`[${traceId}] Jurisdiction key: ${jurisdictionKey}`);

    const { data: rulesetData, error: rulesetError } = await supabase
      .from('buildability_rulesets')
      .select('*')
      .eq('jurisdiction_key', jurisdictionKey)
      .eq('is_active', true)
      .maybeSingle();

    if (rulesetError) {
      console.error(`[${traceId}] Ruleset lookup error:`, rulesetError);
    }

    // Fallback to Houston defaults for Houston_Deed path
    let ruleset: Ruleset | null = null;
    if (rulesetData) {
      ruleset = {
        jurisdiction_key: rulesetData.jurisdiction_key,
        jurisdiction_name: rulesetData.jurisdiction_name,
        governing_path: rulesetData.governing_path,
        default_setbacks: rulesetData.default_setbacks ?? { front: 25, side: 5, rear: 5, street_side: 15 },
        development_controls: rulesetData.development_controls ?? {},
        story_height_assumptions: rulesetData.story_height_assumptions ?? { residential: 10, commercial: 12, industrial: 16 }
      };
    } else if (governingPath === 'Houston_Deed') {
      // Try Houston fallback
      const { data: houstonRuleset } = await supabase
        .from('buildability_rulesets')
        .select('*')
        .eq('jurisdiction_key', 'city_of_houston')
        .eq('is_active', true)
        .maybeSingle();

      if (houstonRuleset) {
        ruleset = {
          jurisdiction_key: houstonRuleset.jurisdiction_key,
          jurisdiction_name: houstonRuleset.jurisdiction_name,
          governing_path: houstonRuleset.governing_path,
          default_setbacks: houstonRuleset.default_setbacks ?? { front: 25, side: 5, rear: 5, street_side: 15 },
          development_controls: houstonRuleset.development_controls ?? {},
          story_height_assumptions: houstonRuleset.story_height_assumptions ?? { residential: 10, commercial: 12, industrial: 16 }
        };
      }
    }

    // Step 5: Build governing authority
    const governingAuthority: GoverningAuthority = {
      city: city ?? null,
      county: county,
      etj_provider: null, // Future: lookup from ETJ boundaries
      special_districts: [] // Future: MUD, WCID, TIRZ lookups
    };

    // Step 6: Calculate confidence
    const confidence = calculateConfidence(
      metroRegion,
      city ?? null,
      county,
      ruleset,
      governingPath
    );

    // Step 7: Optionally update application with jurisdiction data
    if (application_id) {
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          governing_path: governingPath,
          updated_at: new Date().toISOString()
        })
        .eq('id', application_id);

      if (updateError) {
        console.error(`[${traceId}] Failed to update application:`, updateError);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[${traceId}] resolve-jurisdiction complete in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          governing_path: governingPath,
          governing_authority: governingAuthority,
          metro_region: metroRegion,
          ruleset: ruleset ?? {
            jurisdiction_key: jurisdictionKey,
            jurisdiction_name: `${county} County (Default)`,
            governing_path: governingPath,
            default_setbacks: { front: 25, side: 10, rear: 10, street_side: 15 },
            development_controls: {},
            story_height_assumptions: { residential: 10, commercial: 12, industrial: 16 }
          },
          confidence
        },
        meta: {
          trace_id: traceId,
          duration_ms: duration,
          input: { lat, lng, city, county }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[${traceId}] Error:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message ?? 'Internal server error',
        code: 'INTERNAL_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
