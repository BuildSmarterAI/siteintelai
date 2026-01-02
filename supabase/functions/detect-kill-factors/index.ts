import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const KILL_FACTORS: Record<string, { severity: 'warning' | 'critical'; title: string; description: string; remediation?: string }> = {
  FLOOD_VE: { severity: 'critical', title: 'Coastal High Hazard Zone', description: 'Property in VE flood zone with wave action risk.', remediation: 'Requires elevated construction per FEMA standards' },
  FLOOD_FLOODWAY: { severity: 'critical', title: 'Within Regulatory Floodway', description: 'No development permitted in floodway.', remediation: 'Seek LOMR or alternative site' },
  WETLAND_100PCT: { severity: 'critical', title: 'Entire Parcel is Wetland', description: '100% wetland coverage prevents development.', remediation: 'Corps of Engineers 404 permit unlikely' },
  WETLAND_50PCT: { severity: 'warning', title: 'Significant Wetland Coverage', description: '>50% wetland requires mitigation.' },
  NO_UTILITIES_2000M: { severity: 'warning', title: 'No Utilities Within 2km', description: 'Extension costs may be prohibitive.' },
  EPA_SUPERFUND: { severity: 'critical', title: 'Superfund Site Proximity', description: 'Property on or adjacent to EPA Superfund site.' },
  EPA_SIGNIFICANT_VIOLATOR: { severity: 'warning', title: 'EPA Significant Violator Nearby', description: 'Facility with significant violations within 1 mile.' },
  SHRINK_SWELL_HIGH: { severity: 'warning', title: 'High Shrink-Swell Soil', description: 'Expansive clay requires engineered foundation.' },
  SLOPE_SEVERE: { severity: 'warning', title: 'Severe Slope (>15%)', description: 'Grading costs and erosion risk elevated.' },
  ZONING_PROHIBITED: { severity: 'critical', title: 'Use Prohibited by Zoning', description: 'Proposed use not permitted in current zone.' },
};

function generateTraceId(): string {
  return crypto.randomUUID().slice(0, 8);
}

function detectKillFactors(app: any): Array<{ code: string; severity: 'warning' | 'critical'; title: string; description: string; remediation?: string }> {
  const detected: Array<{ code: string; severity: 'warning' | 'critical'; title: string; description: string; remediation?: string }> = [];

  // Flood checks
  const zone = (app.floodplain_zone || '').toUpperCase();
  if (zone === 'VE' || zone === 'V') {
    detected.push({ code: 'FLOOD_VE', ...KILL_FACTORS.FLOOD_VE });
  }
  if (zone.includes('FLOODWAY')) {
    detected.push({ code: 'FLOOD_FLOODWAY', ...KILL_FACTORS.FLOOD_FLOODWAY });
  }

  // Wetland checks
  const wetlandsPct = app.wetlands_area_pct || 0;
  if (wetlandsPct >= 95) {
    detected.push({ code: 'WETLAND_100PCT', ...KILL_FACTORS.WETLAND_100PCT });
  } else if (wetlandsPct >= 50) {
    detected.push({ code: 'WETLAND_50PCT', ...KILL_FACTORS.WETLAND_50PCT });
  }

  // EPA checks
  const facilityType = (app.nearest_facility_type || '').toLowerCase();
  if (facilityType.includes('superfund') || facilityType.includes('npl')) {
    detected.push({ code: 'EPA_SUPERFUND', ...KILL_FACTORS.EPA_SUPERFUND });
  }

  // Soil checks
  if (app.shrink_swell_potential === 'high') {
    detected.push({ code: 'SHRINK_SWELL_HIGH', ...KILL_FACTORS.SHRINK_SWELL_HIGH });
  }

  // Slope checks
  if (app.soil_slope_percent && app.soil_slope_percent > 15) {
    detected.push({ code: 'SLOPE_SEVERE', ...KILL_FACTORS.SLOPE_SEVERE });
  }

  return detected;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = generateTraceId();

  try {
    const { applicationId } = await req.json();
    
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

    const killFactors = detectKillFactors(app);
    const hasKillFactor = killFactors.length > 0;
    const hasCritical = killFactors.some(f => f.severity === 'critical');
    const proceedable = !hasCritical;

    // Update application
    await supabase.from('applications').update({
      kill_factors_triggered: killFactors.map(f => f.code),
      updated_at: new Date().toISOString(),
    }).eq('id', applicationId);

    return new Response(JSON.stringify({
      hasKillFactor,
      killFactors,
      proceedable,
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
