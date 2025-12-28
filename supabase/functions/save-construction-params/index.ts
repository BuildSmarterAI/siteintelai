import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConstructionParams {
  building_type: string;
  quality_tier: 'economy' | 'standard' | 'premium' | 'luxury';
  proposed_gfa_sf: number;
  num_stories: number;
  project_timeline_months: number;
  include_sitework: boolean;
  include_parking_structure: boolean;
  parking_spaces?: number;
}

// Cost benchmarks per SF (2024 RSMeans Houston MSA)
const COST_BENCHMARKS: Record<string, { low: number; high: number }> = {
  'retail_strip': { low: 85, high: 150 },
  'retail_freestanding': { low: 100, high: 180 },
  'office_low_rise': { low: 120, high: 200 },
  'office_mid_rise': { low: 150, high: 250 },
  'industrial_warehouse': { low: 60, high: 100 },
  'industrial_flex': { low: 80, high: 140 },
  'multifamily_garden': { low: 130, high: 200 },
  'multifamily_midrise': { low: 160, high: 250 },
  'hotel_select': { low: 150, high: 220 },
  'hotel_full': { low: 200, high: 350 },
  'medical_clinic': { low: 180, high: 300 },
  'healthcare_hospital': { low: 350, high: 600 },
};

const QUALITY_MULTIPLIERS: Record<string, number> = {
  'economy': 0.8,
  'standard': 1.0,
  'premium': 1.25,
  'luxury': 1.5,
};

// Parking structure cost per space
const PARKING_STRUCTURE_COST_PER_SPACE = 25000;
// Sitework as % of hard costs
const SITEWORK_PERCENTAGE = 0.12;
// Soft costs as % of hard costs
const SOFT_COST_PERCENTAGE = 0.25;

function calculateCostEstimate(params: ConstructionParams) {
  const benchmark = COST_BENCHMARKS[params.building_type] || { low: 100, high: 200 };
  const qualityMultiplier = QUALITY_MULTIPLIERS[params.quality_tier] || 1.0;
  
  // Base hard costs
  const baseLowPerSf = benchmark.low * qualityMultiplier;
  const baseHighPerSf = benchmark.high * qualityMultiplier;
  
  const baseLowCost = baseLowPerSf * params.proposed_gfa_sf;
  const baseHighCost = baseHighPerSf * params.proposed_gfa_sf;
  
  // Sitework
  let siteworkLow = 0;
  let siteworkHigh = 0;
  if (params.include_sitework) {
    siteworkLow = baseLowCost * SITEWORK_PERCENTAGE;
    siteworkHigh = baseHighCost * SITEWORK_PERCENTAGE;
  }
  
  // Parking structure
  let parkingCost = 0;
  if (params.include_parking_structure && params.parking_spaces) {
    parkingCost = params.parking_spaces * PARKING_STRUCTURE_COST_PER_SPACE;
  }
  
  // Total hard costs
  const hardCostLow = baseLowCost + siteworkLow + parkingCost;
  const hardCostHigh = baseHighCost + siteworkHigh + parkingCost;
  
  // Soft costs
  const softCostLow = hardCostLow * SOFT_COST_PERCENTAGE;
  const softCostHigh = hardCostHigh * SOFT_COST_PERCENTAGE;
  
  // Total project cost
  const totalLow = hardCostLow + softCostLow;
  const totalHigh = hardCostHigh + softCostHigh;
  
  // Confidence based on data completeness
  let confidence = 70; // Base
  if (params.building_type) confidence += 10;
  if (params.quality_tier) confidence += 5;
  if (params.proposed_gfa_sf) confidence += 10;
  if (params.num_stories) confidence += 3;
  if (params.project_timeline_months) confidence += 2;
  
  return {
    hard_cost_range: {
      low: Math.round(hardCostLow),
      high: Math.round(hardCostHigh),
      per_sf_low: Math.round(baseLowPerSf),
      per_sf_high: Math.round(baseHighPerSf),
    },
    soft_cost_range: {
      low: Math.round(softCostLow),
      high: Math.round(softCostHigh),
    },
    total_project_cost_range: {
      low: Math.round(totalLow),
      high: Math.round(totalHigh),
    },
    sitework_cost: params.include_sitework ? {
      low: Math.round(siteworkLow),
      high: Math.round(siteworkHigh),
    } : null,
    parking_structure_cost: parkingCost > 0 ? Math.round(parkingCost) : null,
    confidence_score: Math.min(confidence, 95),
    methodology: 'RSMeans 2024 Houston MSA benchmarks with quality and scope adjustments',
    assumptions: [
      `Building type: ${params.building_type.replace(/_/g, ' ')}`,
      `Quality tier: ${params.quality_tier} (${QUALITY_MULTIPLIERS[params.quality_tier]}x multiplier)`,
      `GFA: ${params.proposed_gfa_sf.toLocaleString()} SF`,
      `Stories: ${params.num_stories}`,
      `Timeline: ${params.project_timeline_months} months`,
      params.include_sitework ? 'Sitework included (12% of hard costs)' : 'Sitework excluded',
      params.include_parking_structure && params.parking_spaces 
        ? `Parking structure: ${params.parking_spaces} spaces @ $25k/space`
        : 'Surface parking assumed',
    ],
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { application_id, construction_params } = await req.json();

    if (!application_id || !construction_params) {
      throw new Error('Missing application_id or construction_params');
    }

    console.log(`[save-construction-params] Processing for application: ${application_id}`);
    console.log(`[save-construction-params] Params:`, construction_params);

    // Calculate cost estimate
    const costEstimate = calculateCostEstimate(construction_params);
    console.log(`[save-construction-params] Calculated estimate:`, costEstimate);

    // Update application with construction params and cost estimate
    const { error: updateError } = await supabase
      .from('applications')
      .update({
        api_meta: supabase.rpc('jsonb_set_nested', {
          target: 'api_meta',
          path: ['construction_params'],
          value: construction_params,
        }),
        // Store the cost estimate in ai_context for report regeneration
        ai_context: {
          construction_params,
          cost_estimate: costEstimate,
          cost_estimate_generated_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', application_id);

    if (updateError) {
      // Fallback: direct update without RPC
      console.log('[save-construction-params] RPC failed, using direct update');
      
      const { data: existing } = await supabase
        .from('applications')
        .select('api_meta, ai_context')
        .eq('id', application_id)
        .single();

      const updatedApiMeta = {
        ...(existing?.api_meta || {}),
        construction_params,
      };

      const updatedAiContext = {
        ...(existing?.ai_context || {}),
        construction_params,
        cost_estimate: costEstimate,
        cost_estimate_generated_at: new Date().toISOString(),
      };

      const { error: directUpdateError } = await supabase
        .from('applications')
        .update({
          api_meta: updatedApiMeta,
          ai_context: updatedAiContext,
          updated_at: new Date().toISOString(),
        })
        .eq('id', application_id);

      if (directUpdateError) {
        throw new Error(`Failed to update application: ${directUpdateError.message}`);
      }
    }

    console.log(`[save-construction-params] Successfully saved params for ${application_id}`);

    // Optionally trigger report regeneration with enhanced cost data
    // This could be a separate endpoint or flag
    
    return new Response(
      JSON.stringify({
        success: true,
        cost_estimate: costEstimate,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[save-construction-params] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
