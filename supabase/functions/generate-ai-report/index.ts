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
    return `You are an AI feasibility analyst. Generate a concise QuickCheck summary focusing ONLY on:
- Zoning classification and primary use
- Flood risk zone and base flood elevation
- Major red flags or opportunities

Output format: JSON with keys: zoning_summary, flood_summary, quick_verdict (Buildable/Caution/Not Recommended)`;
  }

  return `You are an AI feasibility analyst for commercial real estate development in Texas. 
Generate a comprehensive, lender-ready feasibility report based on authoritative data sources.

Output format: JSON with the following sections (each as markdown text):
- executive_summary: 2-3 paragraphs summarizing buildability, risks, and opportunities
- property_overview: Parcel details, ownership, acreage, location context
- zoning_analysis: Zoning code, permitted uses, overlay districts, entitlement notes
- utilities_analysis: Water, sewer, storm infrastructure proximity and capacity
- environmental_analysis: Flood zones, wetlands, soil conditions, historical flood events
- traffic_market: AADT counts, nearby highways, population demographics
- financial_jurisdictional: Tax rates, opportunity zones, permitting timeline
- highest_best_use: Recommended development types with reasoning
- feasibility_verdict: Clear recommendation with risk factors

Always cite data sources (e.g., "Per FEMA NFHL...", "TxDOT AADT data shows...")`;
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
  let score = 50; // Base score

  // Positive factors
  if (application.zoning_code && !application.zoning_code.includes('VACANT')) score += 10;
  if (!application.floodplain_zone || application.floodplain_zone === 'X') score += 15;
  if (application.water_lines?.length > 0) score += 5;
  if (application.sewer_lines?.length > 0) score += 5;
  if (application.traffic_aadt && application.traffic_aadt > 10000) score += 10;
  if (application.population_5mi && application.population_5mi > 50000) score += 5;

  // Negative factors
  if (application.floodplain_zone === 'A' || application.floodplain_zone === 'AE') score -= 20;
  if (application.wetlands_type && application.wetlands_type !== 'None') score -= 10;
  if (application.environmental_sites && application.environmental_sites.length > 0) score -= 10;

  return Math.max(0, Math.min(100, score));
}