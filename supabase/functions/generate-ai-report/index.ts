import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { application_id, report_type = 'full_report' } = await req.json();

    console.log(`[generate-ai-report] Starting for application: ${application_id}, type: ${report_type}`);

    // Fetch application data
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', application_id)
      .single();

    if (appError || !application) {
      throw new Error(`Application not found: ${appError?.message}`);
    }

    // Build structured prompt based on enriched data
    const systemPrompt = buildSystemPrompt(report_type);
    const userPrompt = buildUserPrompt(application, report_type);

    console.log('[generate-ai-report] Calling Lovable AI...');

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[generate-ai-report] AI API error:', aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiOutput = aiData.choices?.[0]?.message?.content;

    if (!aiOutput) {
      throw new Error('No AI output received');
    }

    console.log('[generate-ai-report] AI generation complete');

    // Parse AI response (expecting JSON)
    let reportData;
    try {
      reportData = JSON.parse(aiOutput);
    } catch (e) {
      console.error('[generate-ai-report] Failed to parse AI output as JSON, using text wrapper');
      reportData = { rawText: aiOutput };
    }

    // Calculate feasibility score
    const feasibilityScore = calculateFeasibilityScore(application, reportData);

    // Store report in database
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        application_id,
        user_id: application.user_id || null,
        report_type,
        json_data: reportData,
        feasibility_score: feasibilityScore,
        status: 'completed'
      })
      .select()
      .single();

    if (reportError) {
      throw new Error(`Failed to save report: ${reportError.message}`);
    }

    console.log('[generate-ai-report] Report saved successfully:', report.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        report_id: report.id,
        feasibility_score: feasibilityScore
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[generate-ai-report] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function buildSystemPrompt(reportType: string): string {
  if (reportType === 'quickcheck') {
    return `You are BuildSmarter™ AI, a feasibility analyst specializing in Texas commercial real estate.

CRITICAL GUIDELINES:
- Output ONLY valid JSON
- Use US customary units (feet, acres, miles)
- Cite sources for every claim (e.g., "Per FEMA NFHL...", "TxDOT AADT shows...")
- Never invent data
- Round to 2 decimals max

QuickCheck JSON schema:
{
  "summary": {
    "feasibility_score": number (0-100),
    "score_band": "A"|"B"|"C",
    "executive_summary": "2-3 sentence verdict"
  },
  "zoning": {
    "zoning_summary": "Current zoning and primary permitted uses",
    "citations": [{"source": "...", "url": "..."}]
  },
  "flood": {
    "flood_summary": "Zone, BFE, risk level",
    "citations": [{"source": "...", "url": "..."}]
  },
  "data_sources": [
    {"provider": "...", "dataset": "...", "accessed": "YYYY-MM-DD"}
  ]
}`;
  }

  return `You are BuildSmarter™ AI, a feasibility analyst for commercial real estate development in Texas.

CRITICAL GUIDELINES:
- Output ONLY valid JSON (no markdown, no preamble)
- Use US customary units exclusively (feet, acres, miles, sq ft)
- Cite authoritative sources for every statement (FEMA NFHL, TxDOT, HCAD, etc.)
- Never hallucinate data - use only provided sources
- Round to 2 decimals maximum
- Do not fabricate URLs or dates

Full Report JSON schema:
{
  "summary": {
    "feasibility_score": number (0-100, calculated deterministically),
    "score_band": "A"|"B"|"C" (A: 80+, B: 60-79, C: <60),
    "executive_summary": "markdown paragraph",
    "key_risks": ["risk 1", "risk 2"],
    "key_opportunities": ["opportunity 1", "opportunity 2"]
  },
  "zoning": {
    "verdict": "markdown analysis",
    "code": "actual zoning code",
    "overlay_districts": ["district 1"],
    "permitted_uses": ["use 1", "use 2"],
    "component_score": number (0-100),
    "citations": [{"source": "HCAD", "url": "..."}]
  },
  "flood": {
    "verdict": "markdown analysis",
    "zone": "actual FEMA zone",
    "base_flood_elevation_ft": number,
    "site_elevation_ft": number,
    "component_score": number (0-100),
    "citations": [{"source": "FEMA NFHL", "url": "..."}]
  },
  "utilities": {
    "verdict": "markdown analysis",
    "water_proximity_ft": number,
    "sewer_proximity_ft": number,
    "storm_proximity_ft": number,
    "component_score": number (0-100),
    "citations": [{"source": "...", "url": "..."}]
  },
  "environmental": {
    "verdict": "markdown analysis",
    "wetlands": "present|absent",
    "soil_type": "...",
    "contaminated_sites": ["site 1"],
    "component_score": number (0-100),
    "citations": [{"source": "USFWS", "url": "..."}]
  },
  "cost_schedule": {
    "verdict": "markdown analysis",
    "estimated_timeline_months": number,
    "permitting_complexity": "low|medium|high",
    "component_score": number (0-100),
    "citations": [{"source": "...", "url": "..."}]
  },
  "data_sources": [
    {"provider": "FEMA", "dataset": "NFHL", "accessed": "YYYY-MM-DD"}
  ],
  "figures": [
    {"title": "...", "caption": "...", "type": "map|chart|photo", "url": "..."}
  ]
}

SCORING RULES (deterministic):
- Zoning: 100 if commercial/mixed, 50 if residential, 0 if agricultural
- Flood: 100 if Zone X, 50 if Zone AE with elevation>BFE, 0 if in floodway
- Utilities: 100 if all within 500ft, 50 if within 1000ft, 0 if >1000ft
- Environmental: 100 if no wetlands/contamination, 50 if minor issues, 0 if major
- Schedule: Based on permitting complexity
- Market: Based on AADT and population density

Never use placeholders or "TBD" - use actual data or mark as "data unavailable".`;
}

function buildUserPrompt(application: any, reportType: string): string {
  const address = application.formatted_address || application.property_address || 'Unknown';
  
  const dataPoints = [
    `Address: ${address}`,
    `Parcel ID: ${application.parcel_id || 'N/A'}`,
    `Owner: ${application.parcel_owner || 'N/A'}`,
    `Acreage: ${application.acreage_cad || 'N/A'}`,
    `Coordinates: ${application.geo_lat}, ${application.geo_lng}`,
    `\nZoning: ${application.zoning_code || 'N/A'}`,
    `Overlay District: ${application.overlay_district || 'None'}`,
    `\nFlood Zone: ${application.floodplain_zone || 'N/A'}`,
    `Base Flood Elevation: ${application.base_flood_elevation || 'N/A'}`,
    `Elevation: ${application.elevation || 'N/A'}`,
    `\nWater Lines: ${application.water_lines ? JSON.stringify(application.water_lines).slice(0, 200) : 'N/A'}`,
    `Sewer Lines: ${application.sewer_lines ? JSON.stringify(application.sewer_lines).slice(0, 200) : 'N/A'}`,
    `Storm Lines: ${application.storm_lines ? JSON.stringify(application.storm_lines).slice(0, 200) : 'N/A'}`,
    `\nTraffic AADT: ${application.traffic_aadt || 'N/A'}`,
    `Nearest Highway: ${application.nearest_highway || 'N/A'}`,
    `Distance to Highway: ${application.distance_highway_ft ? (application.distance_highway_ft / 5280).toFixed(2) + ' miles' : 'N/A'}`,
    `\nPopulation 1mi: ${application.population_1mi || 'N/A'}`,
    `Population 5mi: ${application.population_5mi || 'N/A'}`,
    `Median Income: ${application.median_income ? '$' + application.median_income.toLocaleString() : 'N/A'}`,
    `\nSoil Type: ${application.soil_series || 'N/A'}`,
    `Wetlands: ${application.wetlands_type || 'None detected'}`,
    `Environmental Sites: ${application.environmental_sites ? JSON.stringify(application.environmental_sites).slice(0, 100) : 'None'}`,
  ];

  return `Generate a ${reportType === 'quickcheck' ? 'QuickCheck summary' : 'full feasibility report'} for:\n\n${dataPoints.join('\n')}`;
}

function calculateFeasibilityScore(application: any, reportData: any): number {
  // Get weights from application or use defaults
  const weights = application.scoring_weights || {
    zoning: 25,
    flood: 20,
    utilities: 20,
    environmental: 15,
    schedule: 10,
    market: 10
  };

  // Calculate component scores deterministically
  const componentScores = {
    zoning: calculateZoningScore(application),
    flood: calculateFloodScore(application),
    utilities: calculateUtilitiesScore(application),
    environmental: calculateEnvironmentalScore(application),
    schedule: calculateScheduleScore(application),
    market: calculateMarketScore(application)
  };

  // Weighted sum
  const totalScore = Object.entries(componentScores).reduce((sum, [key, score]) => {
    return sum + (score * weights[key] / 100);
  }, 0);

  return Math.round(Math.max(0, Math.min(100, totalScore)));
}

function calculateZoningScore(app: any): number {
  const zoning = app.zoning_code?.toLowerCase() || '';
  
  if (zoning.includes('commercial') || zoning.includes('mixed') || zoning.includes('c-')) return 100;
  if (zoning.includes('industrial') || zoning.includes('i-')) return 90;
  if (zoning.includes('residential') || zoning.includes('r-')) return 50;
  if (zoning.includes('agricultural') || zoning.includes('a-')) return 20;
  
  return 50; // Unknown
}

function calculateFloodScore(app: any): number {
  const zone = app.floodplain_zone?.toUpperCase() || '';
  const siteElev = app.elevation || 0;
  const bfe = app.base_flood_elevation || 0;
  
  if (zone === 'X' || zone === 'C' || !zone) return 100;
  if (zone === 'AE' || zone === 'A') {
    if (siteElev > bfe + 2) return 80; // 2ft freeboard
    if (siteElev > bfe) return 60;
    return 20;
  }
  if (zone.includes('FLOODWAY')) return 0;
  
  return 40;
}

function calculateUtilitiesScore(app: any): number {
  const hasWater = app.water_lines && app.water_lines.length > 0;
  const hasSewer = app.sewer_lines && app.sewer_lines.length > 0;
  const hasStorm = app.storm_lines && app.storm_lines.length > 0;
  
  let score = 0;
  if (hasWater) score += 35;
  if (hasSewer) score += 40;
  if (hasStorm) score += 25;
  
  return score;
}

function calculateEnvironmentalScore(app: any): number {
  let score = 100;
  
  if (app.wetlands_type && app.wetlands_type !== 'None') score -= 30;
  if (app.environmental_sites && app.environmental_sites.length > 0) {
    score -= app.environmental_sites.length * 20;
  }
  
  return Math.max(0, score);
}

function calculateScheduleScore(app: any): number {
  // Based on complexity indicators
  const hasOverlay = app.overlay_district && app.overlay_district !== 'None';
  const inFloodzone = app.floodplain_zone && app.floodplain_zone !== 'X';
  
  let score = 100;
  if (hasOverlay) score -= 20;
  if (inFloodzone) score -= 15;
  
  return Math.max(0, score);
}

function calculateMarketScore(app: any): number {
  const aadt = app.traffic_aadt || 0;
  const pop5mi = app.population_5mi || 0;
  
  let score = 0;
  
  // Traffic score (max 50)
  if (aadt > 20000) score += 50;
  else if (aadt > 10000) score += 35;
  else if (aadt > 5000) score += 20;
  
  // Population score (max 50)
  if (pop5mi > 100000) score += 50;
  else if (pop5mi > 50000) score += 35;
  else if (pop5mi > 20000) score += 20;
  
  return Math.min(100, score);
}