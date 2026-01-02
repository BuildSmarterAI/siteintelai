import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const DEFAULT_WEIGHTS = {
  flood: 0.20,
  soil: 0.15,
  utilities: 0.20,
  environmental: 0.15,
  traffic: 0.10,
  zoning: 0.10,
  topography: 0.10,
};

const KILL_FACTORS = {
  FLOOD_VE: { severity: 'critical', title: 'Coastal High Hazard Zone', maxScore: 20 },
  WETLAND_100PCT: { severity: 'critical', title: 'Entire Parcel is Wetland', maxScore: 15 },
  EPA_SUPERFUND: { severity: 'critical', title: 'Superfund Site Proximity', maxScore: 20 },
  NO_UTILITIES: { severity: 'warning', title: 'No Utilities Within 2km', maxScore: 50 },
  SHRINK_SWELL_HIGH: { severity: 'warning', title: 'High Shrink-Swell Soil', maxScore: 60 },
};

function generateTraceId(): string {
  return crypto.randomUUID().slice(0, 8);
}

function scoreFlood(zone: string | null, bfeDelta: number | null): number {
  if (!zone) return 50;
  const z = zone.toUpperCase();
  if (z === 'X' || z === 'X500') return 100;
  if (z === 'AE' && bfeDelta && bfeDelta > 0) return 70;
  if (z === 'AE') return 40;
  if (z === 'A' || z === 'AO' || z === 'AH') return 35;
  if (z === 'VE' || z === 'V') return 10;
  return 50;
}

function scoreSoil(buildability: string | null): number {
  if (!buildability) return 50;
  if (buildability === 'favorable') return 100;
  if (buildability === 'moderate') return 60;
  if (buildability === 'severe') return 20;
  return 50;
}

function scoreUtilities(waterDist: number | null, sewerDist: number | null): number {
  const avgDist = ((waterDist || 5000) + (sewerDist || 5000)) / 2;
  if (avgDist <= 150) return 100;
  if (avgDist <= 300) return 90;
  if (avgDist <= 500) return 80;
  if (avgDist <= 1000) return 60;
  if (avgDist <= 2000) return 40;
  return 20;
}

function scoreEnvironmental(wetlandsPct: number | null, epaRisk: string | null): number {
  let score = 100;
  if (wetlandsPct && wetlandsPct > 0) score -= Math.min(50, wetlandsPct);
  if (epaRisk === 'high') score -= 30;
  else if (epaRisk === 'moderate') score -= 15;
  return Math.max(0, score);
}

function scoreTraffic(aadt: number | null): number {
  if (!aadt) return 50;
  if (aadt >= 50000) return 100;
  if (aadt >= 30000) return 90;
  if (aadt >= 20000) return 80;
  if (aadt >= 10000) return 70;
  if (aadt >= 5000) return 60;
  return 40 + Math.min(20, aadt / 250);
}

function scoreZoning(code: string | null): number {
  if (!code) return 50;
  const c = code.toUpperCase();
  if (c.includes('C-') || c.includes('COMMERCIAL') || c.includes('MU')) return 100;
  if (c.includes('I-') || c.includes('INDUSTRIAL')) return 90;
  if (c.includes('R-') || c.includes('RESIDENTIAL')) return 50;
  if (c.includes('AG') || c.includes('AGRICULTURAL')) return 30;
  return 60;
}

function scoreTopography(slope: number | null): number {
  if (!slope) return 70;
  if (slope <= 2) return 100;
  if (slope <= 5) return 85;
  if (slope <= 10) return 70;
  if (slope <= 15) return 50;
  return 30;
}

function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function detectKillFactors(app: any): string[] {
  const factors: string[] = [];
  if (app.floodplain_zone?.toUpperCase() === 'VE') factors.push('FLOOD_VE');
  if (app.wetlands_area_pct && app.wetlands_area_pct >= 95) factors.push('WETLAND_100PCT');
  if (app.nearest_facility_type?.toLowerCase().includes('superfund')) factors.push('EPA_SUPERFUND');
  return factors;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = generateTraceId();

  try {
    const { applicationId, weights } = await req.json();
    
    if (!applicationId) {
      return new Response(JSON.stringify({ error: 'applicationId required', traceId }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: app, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();
    
    if (error || !app) {
      throw new Error('Application not found');
    }

    const w = { ...DEFAULT_WEIGHTS, ...weights };
    
    // Calculate component scores
    const components = {
      flood: { score: scoreFlood(app.floodplain_zone, app.elevation - app.base_flood_elevation), weight: w.flood, weighted: 0 },
      soil: { score: scoreSoil(app.building_site_rating), weight: w.soil, weighted: 0 },
      utilities: { score: scoreUtilities(app.water_lines?.[0]?.distance, app.sewer_lines?.[0]?.distance), weight: w.utilities, weighted: 0 },
      environmental: { score: scoreEnvironmental(app.wetlands_area_pct, app.nearest_facility_type), weight: w.environmental, weighted: 0 },
      traffic: { score: scoreTraffic(app.traffic_aadt), weight: w.traffic, weighted: 0 },
      zoning: { score: scoreZoning(app.zoning_code), weight: w.zoning, weighted: 0 },
      topography: { score: scoreTopography(app.soil_slope_percent), weight: w.topography, weighted: 0 },
    };

    // Calculate weighted scores
    let overallScore = 0;
    for (const [key, comp] of Object.entries(components)) {
      comp.weighted = parseFloat((comp.score * comp.weight).toFixed(2));
      overallScore += comp.weighted;
    }

    const killFactors = detectKillFactors(app);
    if (killFactors.length > 0) {
      const killFactor = KILL_FACTORS[killFactors[0] as keyof typeof KILL_FACTORS];
      overallScore = Math.min(overallScore, killFactor?.maxScore || 30);
    }

    overallScore = Math.round(Math.max(0, Math.min(100, overallScore)));
    const grade = getGrade(overallScore);
    
    // Calculate confidence
    const dataPoints = [app.floodplain_zone, app.zoning_code, app.traffic_aadt, app.elevation].filter(Boolean).length;
    const confidenceLevel = parseFloat((dataPoints / 10).toFixed(2));

    // Update application
    await supabase.from('applications').update({
      confidence_score: overallScore,
      kill_factors_triggered: killFactors,
      updated_at: new Date().toISOString(),
    }).eq('id', applicationId);

    return new Response(JSON.stringify({
      overallScore,
      grade,
      components,
      killFactors,
      confidenceLevel,
      traceId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[TRACE:${traceId}] Error:`, error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      traceId,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
