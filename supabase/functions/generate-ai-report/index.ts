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

    // 🚀 PHASE 3: Fetch geospatial intelligence data
    let geospatialData = null;
    try {
      const { data: geoData, error: geoError } = await supabase
        .from('feasibility_geospatial')
        .select('*')
        .eq('application_id', application_id)
        .single();
      
      if (!geoError && geoData) {
        geospatialData = geoData;
        console.log('[generate-ai-report] Geospatial data loaded:', {
          overall_score: geoData.geospatial_score?.overall_geospatial_score,
          flood_zone: geoData.fema_flood_risk?.zone_code
        });
      }
    } catch (geoError) {
      console.log('[generate-ai-report] No geospatial data found (non-blocking)');
    }

    // Build structured prompt based on enriched data
    const systemPrompt = buildSystemPrompt(report_type);
    const userPrompt = buildUserPrompt(application, report_type, geospatialData);

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
      // Strip markdown code fences if present
      const cleanedOutput = stripMarkdownCodeFences(aiOutput);
      reportData = JSON.parse(cleanedOutput);
      console.log('[generate-ai-report] Successfully parsed AI JSON output');
    } catch (e) {
      console.error('[generate-ai-report] Failed to parse AI output as JSON');
      console.error('[generate-ai-report] First 500 chars:', aiOutput.substring(0, 500));
      reportData = { rawText: aiOutput };
    }

    // Calculate feasibility score from AI JSON or application data
    const feasibilityScore = calculateFeasibilityScore(application, reportData);
    const scoreBand = getScoreBand(feasibilityScore);
    
    console.log(`[generate-ai-report] Calculated feasibility score: ${feasibilityScore} (${scoreBand})`);

    // Store report in database
    try {
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          application_id,
          user_id: application.user_id || null,
          report_type,
          json_data: reportData,
          feasibility_score: feasibilityScore,
          score_band: scoreBand,
          status: 'completed'
        })
        .select()
        .single();

      if (reportError) {
        console.error('[generate-ai-report] Database insert failed:', reportError);
        throw new Error(`Failed to save report: ${reportError.message}`);
      }

      console.log('[generate-ai-report] Report saved successfully:', report.id);

      // TODO: RE-ENABLE PDF GENERATION BEFORE PRODUCTION
      // Temporarily disabled during interface development phase
      /*
      // Trigger PDF generation asynchronously (non-blocking)
      try {
        console.log('[generate-ai-report] Triggering PDF generation...');
        const pdfResponse = await supabase.functions.invoke('generate-pdf', {
          body: { 
            report_id: report.id, 
            application_id 
          }
        });
        
        if (pdfResponse.error) {
          console.error('[generate-ai-report] PDF generation failed:', pdfResponse.error);
          // Report is still saved, just without PDF
        } else {
          console.log('[generate-ai-report] PDF generation initiated successfully');
        }
      } catch (pdfError) {
        console.error('[generate-ai-report] Failed to trigger PDF generation:', pdfError);
        // Non-blocking - report is still accessible
      }
      */
      console.log('[generate-ai-report] PDF generation temporarily disabled for development');

      // 🗺️ GENERATE MAP ASSETS (asynchronous, non-blocking)
      const lat = application.geo_lat;
      const lng = application.geo_lng;
      
      if (lat && lng) {
        console.log('[generate-ai-report] Triggering map asset generation...');
        
        // Invoke render-static-map
        supabase.functions.invoke('render-static-map', {
          body: {
            application_id,
            center: { lat, lng },
            zoom: 17,
            size: '1200x800'
          }
        }).then(mapResult => {
          if (mapResult.error) {
            console.error('[generate-ai-report] Static map failed:', mapResult.error);
          } else {
            console.log('[generate-ai-report] Static map generated successfully');
          }
        });
        
        // Invoke render-streetview
        supabase.functions.invoke('render-streetview', {
          body: {
            application_id,
            location: { lat, lng },
            headings: [0, 90, 180, 270],
            size: '640x400'
          }
        }).then(svResult => {
          if (svResult.error) {
            console.error('[generate-ai-report] Street View failed:', svResult.error);
          } else {
            console.log('[generate-ai-report] Street View images generated');
          }
        });
      } else {
        console.warn('[generate-ai-report] No coordinates available for map generation');
      }

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
    } catch (err) {
      console.error('[generate-ai-report] Exception during report creation:', err);
      throw err;
    }

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
- Include data_sources array with timestamp in ISO-8601 format (use current date ${new Date().toISOString()})
- Map each dataset to its corresponding section (zoning, flood, utilities, environmental, traffic, market)

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
    {
      "dataset_name": "Source name",
      "timestamp": "ISO-8601 datetime",
      "endpoint_url": "https://...",
      "section": "zoning|flood|utilities|environmental|traffic|market"
    }
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
- REQUIRED: Include data_sources array with exact timestamp ${new Date().toISOString()}
- Map each dataset to section: zoning, flood, utilities, environmental, traffic, market
- Use official endpoint URLs: FEMA (hazards.fema.gov), TxDOT (txdot.gov), HCAD (hcad.org), etc.

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
  "traffic": {
    "verdict": "markdown analysis of traffic visibility and access",
    "aadt": number,
    "road_name": "...",
    "traffic_score": "high|medium|low",
    "visibility_assessment": "excellent|good|fair|poor",
    "access_points": "description of site access",
    "component_score": number (0-100),
    "citations": [{"source": "TxDOT", "url": "..."}]
  },
  "market_demographics": {
    "verdict": "markdown analysis of workforce accessibility and market demand",
    "primary_employment_centers": [
      {"name": "...", "jobs": number, "distance_mi": number, "industries": ["..."]}
    ],
    "workforce_accessibility": "excellent|good|fair|poor",
    "daytime_population": "high|medium|low",
    "component_score": number (0-100),
    "citations": [{"source": "...", "url": "..."}]
  },
  "project_feasibility": {
    "verdict": "markdown analysis of proposed use fit",
    "zoning_compliance": "permitted|conditional|variance_required|prohibited",
    "building_envelope_analysis": {
      "proposed_height": "proposed stories vs. zoning max",
      "proposed_density": "proposed SF vs. site capacity",
      "parking_requirement": "spaces required based on use"
    },
    "budget_analysis": {
      "estimated_hard_costs": number,
      "estimated_soft_costs": number,
      "budget_adequacy": "adequate|tight|insufficient"
    },
    "use_specific_insights": ["insight 1", "insight 2"],
    "component_score": number (0-100),
    "citations": [{"source": "...", "url": "..."}]
  },
  "cost_schedule": {
    "verdict": "markdown analysis",
    "estimated_timeline_months": number,
    "permitting_complexity": "low|medium|high",
    "component_score": number (0-100),
    "citations": [{"source": "...", "url": "..."}]
  },
  "data_sources": [
    {
      "dataset_name": "FEMA National Flood Hazard Layer",
      "timestamp": "ISO-8601 datetime string",
      "endpoint_url": "https://hazards.fema.gov/gis/nfhl/...",
      "section": "flood"
    }
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
- Traffic: 100 if AADT>20k, 75 if AADT>10k, 50 if AADT>5k, else proportional
- Market Demographics: Based on employment clusters within 10 miles and total jobs
- Schedule: Based on permitting complexity

TRAFFIC & MARKET ANALYSIS GUIDELINES:
- Traffic: Assess visibility from roadway, quality of access points, traffic patterns
- Employment: Evaluate workforce availability, commute times, labor pool quality
- Consider synergies between traffic exposure and nearby employment centers
- High traffic + strong employment = prime location for commercial development

PROJECT INTENT ANALYSIS RULES:
- ALWAYS analyze if proposed project_type is permitted by current zoning
- Calculate if building_size_value fits within lot size (FAR, lot coverage, setbacks)
- Verify stories_height complies with zoning height limits
- Estimate parking requirements based on project_type (retail: 4/1000SF, office: 3/1000SF, industrial: 1/1000SF)
- Compare desired_budget against industry cost benchmarks for project_type
- Assess site suitability for project_type (e.g., retail needs high AADT, industrial needs highway access, healthcare needs residential proximity)
- Provide use-specific recommendations (e.g., "This site is ideal for retail due to 35K AADT, but industrial would struggle due to limited truck access")

Never use placeholders or "TBD" - use actual data or mark as "data unavailable".`;
}

function buildUserPrompt(application: any, reportType: string, geospatialData?: any): string {
  const address = application.formatted_address || application.property_address || 'Unknown';
  
  const dataPoints = [
    `Address: ${address}`,
    `Parcel ID: ${application.parcel_id || 'N/A'}`,
    `Owner: ${application.parcel_owner || 'N/A'}`,
    `Acreage: ${application.acreage_cad || 'N/A'}`,
    `Coordinates: ${application.geo_lat}, ${application.geo_lng}`
  ];
  
  // 🚀 PHASE 3: Include geospatial intelligence in AI context
  if (geospatialData) {
    const geoScore = geospatialData.geospatial_score;
    const floodRisk = geospatialData.fema_flood_risk;
    const trafficExposure = geospatialData.traffic_exposure;
    const countyBoundary = geospatialData.county_boundary;
    
    dataPoints.push('');
    dataPoints.push('=== GEOSPATIAL INTELLIGENCE ===');
    if (geoScore) {
      dataPoints.push(`Overall Geospatial Score: ${geoScore.overall_geospatial_score}/100`);
      dataPoints.push(`- Jurisdiction Confidence: ${geoScore.jurisdiction_confidence}% (${countyBoundary?.county_name || 'Unknown'})`);
      dataPoints.push(`- Flood Risk Index: ${geoScore.flood_risk_index} (${floodRisk?.zone_code || 'Unknown'})`);
      dataPoints.push(`- Traffic Visibility Index: ${geoScore.traffic_visibility_index}`);
      if (geoScore.scoring_notes) {
        dataPoints.push(`- Analysis: ${geoScore.scoring_notes}`);
      }
    }
    if (trafficExposure) {
      dataPoints.push(`Traffic Exposure: ${trafficExposure.roadway_name} (AADT: ${trafficExposure.aadt}, ${trafficExposure.distance_to_segment_ft}ft away)`);
    }
  }
  
  // ⭐ NEW: Property Valuation Section
  if (application.tot_appr_val || application.tot_market_val) {
    dataPoints.push(`\n### Property Valuation (HCAD Official Assessment):`);
    if (application.tot_appr_val) dataPoints.push(`- Total Appraised Value: $${Number(application.tot_appr_val).toLocaleString()}`);
    if (application.tot_market_val) dataPoints.push(`- Total Market Value: $${Number(application.tot_market_val).toLocaleString()}`);
    if (application.land_val) dataPoints.push(`- Land Value: $${Number(application.land_val).toLocaleString()}`);
    if (application.imprv_val) dataPoints.push(`- Improvement Value: $${Number(application.imprv_val).toLocaleString()}`);
    if (application.taxable_value) dataPoints.push(`- Taxable Value: $${Number(application.taxable_value).toLocaleString()}`);
  }
  
  // ⭐ NEW: Existing Building Characteristics Section
  if (application.bldg_sqft || application.year_built) {
    dataPoints.push(`\n### Existing Building Characteristics:`);
    if (application.bldg_sqft) dataPoints.push(`- Building Square Footage: ${Number(application.bldg_sqft).toLocaleString()} SF`);
    if (application.year_built) dataPoints.push(`- Year Built: ${application.year_built}`);
    if (application.effective_yr) dataPoints.push(`- Effective Year Built: ${application.effective_yr}`);
    if (application.num_stories) dataPoints.push(`- Number of Stories: ${application.num_stories}`);
    if (application.state_class) dataPoints.push(`- Texas State Classification: ${application.state_class}`);
    if (application.prop_type) dataPoints.push(`- Property Type: ${application.prop_type}`);
    if (application.land_use_code) dataPoints.push(`- Land Use Code: ${application.land_use_code}`);
  }
  
  // ⭐ NEW: Location & Legal Description
  if (application.subdivision || application.block || application.lot) {
    dataPoints.push(`\n### Legal Location:`);
    if (application.subdivision) dataPoints.push(`- Subdivision: ${application.subdivision}`);
    if (application.block) dataPoints.push(`- Block: ${application.block}`);
    if (application.lot) dataPoints.push(`- Lot: ${application.lot}`);
  }
  
  // ⭐ NEW: Project Intent & Development Goals
  if (application.project_type && application.project_type.length > 0) {
    dataPoints.push(`\n### Proposed Development Intent:`);
    dataPoints.push(`- Project Types: ${application.project_type.join(', ')}`);
    if (application.building_size_value) {
      dataPoints.push(`- Desired Building Size: ${Number(application.building_size_value).toLocaleString()} ${application.building_size_unit || 'SF'}`);
    }
    if (application.stories_height) dataPoints.push(`- Desired Stories/Floors: ${application.stories_height}`);
    if (application.prototype_requirements) dataPoints.push(`- Prototype Requirements: ${application.prototype_requirements}`);
    if (application.quality_level) dataPoints.push(`- Construction Quality Level: ${application.quality_level}`);
    if (application.desired_budget) dataPoints.push(`- Development Budget: $${Number(application.desired_budget).toLocaleString()}`);
    if (application.tenant_requirements) dataPoints.push(`- Tenant Requirements: ${application.tenant_requirements}`);
  }

  // ⭐ NEW: Site Requirements & Constraints
  if (application.access_priorities && application.access_priorities.length > 0) {
    dataPoints.push(`\n### Access Priorities: ${application.access_priorities.join(', ')}`);
  }
  if (application.known_risks && application.known_risks.length > 0) {
    dataPoints.push(`Known Risks/Concerns: ${application.known_risks.join(', ')}`);
  }
  if (application.utility_access && application.utility_access.length > 0) {
    dataPoints.push(`Required Utility Access: ${application.utility_access.join(', ')}`);
  }
  if (application.environmental_constraints && application.environmental_constraints.length > 0) {
    dataPoints.push(`Environmental Constraints: ${application.environmental_constraints.join(', ')}`);
  }
  
  dataPoints.push(
    `\n### Zoning:`,
    `Zoning Code: ${application.zoning_code || 'N/A'}`,
    `Overlay District: ${application.overlay_district || 'None'}`,
    `\n### Flood Zone:`,
    `Zone: ${application.floodplain_zone || 'N/A'}`,
    `Base Flood Elevation: ${application.base_flood_elevation || 'N/A'}`,
    `Site Elevation: ${application.elevation || 'N/A'}`,
    `\n### Utilities:`,
    `Water Lines: ${application.water_lines ? JSON.stringify(application.water_lines).slice(0, 200) : 'N/A'}`,
    `Sewer Lines: ${application.sewer_lines ? JSON.stringify(application.sewer_lines).slice(0, 200) : 'N/A'}`,
    `Storm Lines: ${application.storm_lines ? JSON.stringify(application.storm_lines).slice(0, 200) : 'N/A'}`,
    `\nTraffic Data:`,
    `  AADT: ${application.traffic_aadt || 'N/A'}`,
    `  Road Name: ${application.traffic_road_name || 'N/A'}`,
    `  Data Year: ${application.traffic_year || 'N/A'}`,
    `  Nearest Highway: ${application.nearest_highway || 'N/A'}`,
    `  Distance to Highway: ${application.distance_highway_ft ? (application.distance_highway_ft / 5280).toFixed(2) + ' miles' : 'N/A'}`,
    `\nMarket Demographics:`,
    `  Population 1mi: ${application.population_1mi || 'N/A'}`,
    `  Population 5mi: ${application.population_5mi || 'N/A'}`,
    `  Median Income: ${application.median_income ? '$' + application.median_income.toLocaleString() : 'N/A'}`,
    `  Employment Clusters: ${application.employment_clusters ? JSON.stringify(application.employment_clusters) : 'N/A'}`,
    `  Drive Time 15min Population: ${application.drive_time_15min_population || 'N/A'}`,
    `  Drive Time 30min Population: ${application.drive_time_30min_population || 'N/A'}`,
    `\nSoil Type: ${application.soil_series || 'N/A'}`,
    `Wetlands: ${application.wetlands_type || 'None detected'}`,
    `Environmental Sites: ${application.environmental_sites ? JSON.stringify(application.environmental_sites).slice(0, 100) : 'None'}`,
  );

  return `Generate a ${reportType === 'quickcheck' ? 'QuickCheck summary' : 'full feasibility report'} for:\n\n${dataPoints.join('\n')}`;
}

function calculateFeasibilityScore(application: any, reportData: any): number {
  // If AI provided a summary with feasibility_score, use it
  if (reportData?.summary?.feasibility_score) {
    return Math.round(Math.max(0, Math.min(100, reportData.summary.feasibility_score)));
  }
  
  // Otherwise, calculate from component scores in AI JSON if available
  if (reportData && typeof reportData === 'object') {
    const componentScores: any = {};
    let hasAnyScore = false;
    
    // Extract component scores from AI JSON
    if (reportData.zoning?.component_score !== undefined) {
      componentScores.zoning = reportData.zoning.component_score;
      hasAnyScore = true;
    }
    if (reportData.flood?.component_score !== undefined) {
      componentScores.flood = reportData.flood.component_score;
      hasAnyScore = true;
    }
    if (reportData.utilities?.component_score !== undefined) {
      componentScores.utilities = reportData.utilities.component_score;
      hasAnyScore = true;
    }
    if (reportData.environmental?.component_score !== undefined) {
      componentScores.environmental = reportData.environmental.component_score;
      hasAnyScore = true;
    }
    if (reportData.traffic?.component_score !== undefined) {
      componentScores.traffic = reportData.traffic.component_score;
      hasAnyScore = true;
    }
    if (reportData.market_demographics?.component_score !== undefined) {
      componentScores.market = reportData.market_demographics.component_score;
      hasAnyScore = true;
    }
    if (reportData.cost_schedule?.component_score !== undefined) {
      componentScores.schedule = reportData.cost_schedule.component_score;
      hasAnyScore = true;
    }
    if (reportData.project_feasibility?.component_score !== undefined) {
      componentScores.project_fit = reportData.project_feasibility.component_score;
      hasAnyScore = true;
    }
    
    // If we found component scores in JSON, calculate weighted average
    if (hasAnyScore) {
      const weights = application.scoring_weights || {
        zoning: 18,
        flood: 18,
        utilities: 13,
        environmental: 13,
        traffic: 13,
        market: 13,
        schedule: 6,
        project_fit: 6
      };
      
      let totalScore = 0;
      let totalWeight = 0;
      
      Object.entries(componentScores).forEach(([key, score]) => {
        if (weights[key] !== undefined && typeof score === 'number') {
          totalScore += score * (weights[key] / 100);
          totalWeight += weights[key];
        }
      });
      
      if (totalWeight > 0) {
        return Math.round(Math.max(0, Math.min(100, (totalScore / totalWeight) * 100)));
      }
    }
  }
  
  // Fallback: Calculate from application data
  const weights = application.scoring_weights || {
    zoning: 18,
    flood: 18,
    utilities: 13,
    environmental: 13,
    traffic: 13,
    market: 13,
    project_fit: 12
  };

  const componentScores = {
    zoning: calculateZoningScore(application),
    flood: calculateFloodScore(application),
    utilities: calculateUtilitiesScore(application),
    environmental: calculateEnvironmentalScore(application),
    traffic: calculateTrafficScore(application),
    market: calculateMarketScore(application),
    project_fit: calculateProjectFitScore(application)
  };

  const totalScore = Object.entries(componentScores).reduce((sum, [key, score]) => {
    return sum + (score * weights[key] / 100);
  }, 0);

  return Math.round(Math.max(0, Math.min(100, totalScore)));
}

function getScoreBand(score: number): string {
  // Returns only A, B, or C as per database constraint
  if (score >= 70) return 'A';
  if (score >= 55) return 'B';
  return 'C';
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

function calculateTrafficScore(app: any): number {
  const aadt = app.traffic_aadt || 0;
  
  // Score based on AADT thresholds
  if (aadt >= 30000) return 100;
  if (aadt >= 20000) return 90;
  if (aadt >= 15000) return 80;
  if (aadt >= 10000) return 70;
  if (aadt >= 5000) return 50;
  if (aadt >= 2500) return 30;
  if (aadt > 0) return 20;
  
  return 0; // No traffic data
}

function calculateMarketScore(app: any): number {
  const pop5mi = app.population_5mi || 0;
  const employmentClusters = app.employment_clusters || [];
  
  let score = 0;
  
  // Population score (max 50 points)
  if (pop5mi > 150000) score += 50;
  else if (pop5mi > 100000) score += 40;
  else if (pop5mi > 50000) score += 30;
  else if (pop5mi > 20000) score += 20;
  else if (pop5mi > 0) score += 10;
  
  // Employment accessibility score (max 50 points)
  if (Array.isArray(employmentClusters) && employmentClusters.length > 0) {
    // Calculate total nearby jobs
    const totalJobs = employmentClusters.reduce((sum: number, cluster: any) => {
      return sum + (cluster.jobs || 0);
    }, 0);
    
    // Major employment center within 5 miles
    const nearbyMajorCenter = employmentClusters.some((cluster: any) => 
      cluster.jobs > 10000 && cluster.distance < 5
    );
    
    if (totalJobs > 100000) score += 50;
    else if (totalJobs > 50000) score += 40;
    else if (totalJobs > 25000) score += 30;
    else if (totalJobs > 10000) score += 20;
    else if (totalJobs > 0) score += 10;
    
    // Bonus for proximity to major center
    if (nearbyMajorCenter) score += 10;
  }
  
  return Math.min(100, score);
}

function calculateProjectFitScore(app: any): number {
  if (!app.project_type || app.project_type.length === 0) return 75; // Neutral if not specified
  
  let score = 50; // Base score
  
  // High-traffic retail/hospitality benefit from AADT
  const isTrafficDependent = app.project_type.some((t: string) => 
    ['shopping_center', 'strip_mall', 'restaurant_qsr', 'hotel', 'gas_station_convenience'].includes(t)
  );
  if (isTrafficDependent && app.traffic_aadt > 20000) score += 30;
  
  // Industrial/logistics benefit from highway proximity
  const isLogisticsDependent = app.project_type.some((t: string) => 
    ['warehouse', 'distribution_center', 'manufacturing_facility'].includes(t)
  );
  if (isLogisticsDependent && app.distance_highway_ft < 5280) score += 25; // Within 1 mile
  
  // Office/healthcare benefit from employment clusters
  const isEmploymentDependent = app.project_type.some((t: string) => 
    ['office_class_a', 'medical_office_building', 'corporate_headquarters'].includes(t)
  );
  if (isEmploymentDependent && app.employment_clusters?.length > 0) score += 20;
  
  return Math.min(100, score);
}

function stripMarkdownCodeFences(text: string): string {
  // Remove ```json ... ``` or ``` ... ```
  const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  return text.trim();
}