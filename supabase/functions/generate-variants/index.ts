/**
 * SiteIntel™ Design Mode - Atomic Variant Generation
 * 
 * Server-side variant generation with batch insert for atomic persistence.
 * Ensures all-or-nothing variant creation and consistent state.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProgramBucket {
  useType: string;
  targetGfa: number;
  targetStories: number;
  riskTolerance: string;
  floorToFloorFt: number;
}

interface SelectedTemplate {
  templateKey: string;
  template: {
    id: string;
    template_key: string;
    use_type: string;
    name: string;
    default_floors: number;
    floor_to_floor_ft: number;
    footprint_shape: string;
    footprint_area_target_sqft: number | null;
    width_depth_ratio: number;
    min_footprint_sqft: number;
    max_footprint_sqft: number;
    min_floors: number;
    max_floors: number;
  };
  modifiedFloors?: number;
  modifiedFootprintSqft?: number;
}

interface EnvelopeSummary {
  parcelAcres: number;
  parcelSqft: number;
  buildableSqft: number;
  farCap: number;
  heightCapFt: number;
  coverageCapPct: number;
  maxGfa: number;
}

interface GenerateRequest {
  sessionId: string;
  envelopeId: string;
  envelope: EnvelopeSummary;
  buildablePolygon: GeoJSON.Polygon;
  selectedTemplates: SelectedTemplate[];
  programBuckets: ProgramBucket[];
  sustainabilityLevel: string | null;
  designIntent?: Record<string, unknown>;
}

interface GeneratedVariant {
  name: string;
  strategy: string;
  footprint: GeoJSON.Polygon;
  height_ft: number;
  floors: number;
  gfa: number;
  far: number;
  coverage: number;
  notes: string;
  compliance_status: string;
  preset_type: string | null;
}

type VariantStrategy = 'safe' | 'balanced' | 'max_yield' | 'height_biased' | 'coverage_biased' | 'mixed_program';

// ============================================================================
// VARIANT GENERATION LOGIC (server-side implementation)
// ============================================================================

function getActiveStrategies(config: {
  envelope: EnvelopeSummary;
  selectedTemplates: SelectedTemplate[];
}): VariantStrategy[] {
  const strategies: VariantStrategy[] = ['safe', 'balanced', 'max_yield'];
  
  if (config.envelope.heightCapFt > 40) {
    strategies.push('height_biased');
  }
  
  if (config.envelope.coverageCapPct > 60) {
    strategies.push('coverage_biased');
  }
  
  if (config.selectedTemplates.length >= 2) {
    strategies.push('mixed_program');
  }
  
  return strategies.slice(0, 6);
}

function formatGfa(gfa: number): string {
  if (gfa >= 1000000) return `${(gfa / 1000000).toFixed(1)}M`;
  return `${Math.round(gfa / 1000)}K`;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

function generateSimpleRectangle(
  centerLng: number,
  centerLat: number,
  widthFt: number,
  depthFt: number
): GeoJSON.Polygon {
  // Approximate conversion: 1 degree lat = 364,000 ft, 1 degree lng = 288,200 ft at ~30°N
  const latPerFt = 1 / 364000;
  const lngPerFt = 1 / 288200;
  
  const halfWidth = (widthFt / 2) * lngPerFt;
  const halfDepth = (depthFt / 2) * latPerFt;
  
  return {
    type: 'Polygon',
    coordinates: [[
      [centerLng - halfWidth, centerLat - halfDepth],
      [centerLng + halfWidth, centerLat - halfDepth],
      [centerLng + halfWidth, centerLat + halfDepth],
      [centerLng - halfWidth, centerLat + halfDepth],
      [centerLng - halfWidth, centerLat - halfDepth],
    ]],
  };
}

function getPolygonCentroid(polygon: GeoJSON.Polygon): { lng: number; lat: number } {
  const coords = polygon.coordinates[0];
  let sumLng = 0;
  let sumLat = 0;
  const n = coords.length - 1; // Skip closing point
  
  for (let i = 0; i < n; i++) {
    sumLng += coords[i][0];
    sumLat += coords[i][1];
  }
  
  return { lng: sumLng / n, lat: sumLat / n };
}

function createVariantForStrategy(
  config: GenerateRequest,
  strategy: VariantStrategy
): GeneratedVariant | null {
  const { envelope, buildablePolygon, selectedTemplates, programBuckets, sustainabilityLevel } = config;
  
  const primaryTemplate = selectedTemplates[0];
  if (!primaryTemplate) return null;
  
  const template = primaryTemplate.template;
  const bucket = programBuckets.find(b => b.useType === template.use_type) || programBuckets[0];
  if (!bucket) return null;
  
  const centroid = getPolygonCentroid(buildablePolygon);
  
  let footprintSqft: number;
  let floors: number;
  let heightFt: number;
  
  const baseFootprint = primaryTemplate.modifiedFootprintSqft || template.footprint_area_target_sqft || 20000;
  const baseFloors = primaryTemplate.modifiedFloors || template.default_floors;
  
  switch (strategy) {
    case 'safe':
      footprintSqft = Math.min(
        baseFootprint * 0.8,
        (envelope.coverageCapPct * 0.6 / 100) * envelope.parcelSqft
      );
      floors = Math.min(baseFloors, 
        Math.floor((envelope.heightCapFt * 0.7) / template.floor_to_floor_ft));
      floors = Math.max(1, floors);
      heightFt = floors * template.floor_to_floor_ft;
      break;
      
    case 'balanced':
      footprintSqft = Math.min(
        baseFootprint,
        (envelope.coverageCapPct * 0.8 / 100) * envelope.parcelSqft
      );
      floors = baseFloors;
      heightFt = floors * template.floor_to_floor_ft;
      break;
      
    case 'max_yield':
      footprintSqft = Math.min(
        baseFootprint * 1.2,
        (envelope.coverageCapPct * 0.95 / 100) * envelope.parcelSqft
      );
      floors = Math.floor((envelope.heightCapFt * 0.95) / template.floor_to_floor_ft);
      floors = Math.max(1, floors);
      heightFt = Math.min(envelope.heightCapFt * 0.95, floors * template.floor_to_floor_ft);
      break;
      
    case 'height_biased':
      floors = Math.floor(envelope.heightCapFt / template.floor_to_floor_ft);
      floors = Math.max(1, floors);
      heightFt = floors * template.floor_to_floor_ft;
      footprintSqft = Math.max(
        template.min_footprint_sqft,
        bucket.targetGfa / floors
      );
      break;
      
    case 'coverage_biased':
      footprintSqft = Math.min(
        template.max_footprint_sqft,
        (envelope.coverageCapPct * 0.9 / 100) * envelope.parcelSqft
      );
      floors = Math.max(1, Math.ceil(bucket.targetGfa / footprintSqft));
      floors = Math.min(floors, template.max_floors);
      heightFt = floors * template.floor_to_floor_ft;
      break;
      
    case 'mixed_program':
      footprintSqft = baseFootprint;
      floors = baseFloors;
      heightFt = floors * template.floor_to_floor_ft;
      break;
      
    default:
      footprintSqft = baseFootprint;
      floors = baseFloors;
      heightFt = floors * template.floor_to_floor_ft;
  }
  
  // Generate footprint geometry
  const aspectRatio = template.width_depth_ratio || 1.5;
  const area = footprintSqft;
  const width = Math.sqrt(area * aspectRatio);
  const depth = area / width;
  
  const footprint = generateSimpleRectangle(centroid.lng, centroid.lat, width, depth);
  
  // Calculate metrics
  const gfa = footprintSqft * floors;
  const far = gfa / envelope.parcelSqft;
  const coverage = (footprintSqft / envelope.parcelSqft) * 100;
  
  // Determine compliance status
  let complianceStatus = 'PASS';
  if (far > envelope.farCap || heightFt > envelope.heightCapFt || coverage > envelope.coverageCapPct) {
    complianceStatus = 'FAIL';
  } else if (far > envelope.farCap * 0.9 || heightFt > envelope.heightCapFt * 0.9 || coverage > envelope.coverageCapPct * 0.9) {
    complianceStatus = 'WARN';
  }
  
  // Build name
  const useTypeLabel = capitalizeFirst(template.use_type);
  const strategyLabel = capitalizeFirst(strategy);
  const name = `${strategyLabel} — ${useTypeLabel} — ${formatGfa(gfa)} — ${Math.round(heightFt)}'`;
  
  return {
    name,
    strategy,
    footprint,
    height_ft: heightFt,
    floors,
    gfa,
    far: Math.round(far * 100) / 100,
    coverage: Math.round(coverage),
    notes: `Generated via ${strategy} strategy${sustainabilityLevel ? ` | Sustainability: ${sustainabilityLevel}` : ''}`,
    compliance_status: complianceStatus,
    preset_type: template.template_key,
  };
}

function generateVariantPack(config: GenerateRequest): GeneratedVariant[] {
  const strategies = getActiveStrategies(config);
  const variants: GeneratedVariant[] = [];
  
  for (const strategy of strategies) {
    const variant = createVariantForStrategy(config, strategy);
    if (variant) {
      variants.push(variant);
    }
  }
  
  return variants;
}

function getBestOverallVariant(variants: GeneratedVariant[]): GeneratedVariant | null {
  if (variants.length === 0) return null;
  
  const scored = variants.map(v => {
    let score = 0;
    
    if (v.strategy === 'balanced') score += 20;
    if (v.strategy === 'safe') score += 10;
    
    if (v.coverage >= 70 && v.coverage <= 90) score += 15;
    if (v.far >= 0.5 && v.far <= 0.8) score += 15;
    
    score += Math.min(20, v.gfa / 10000);
    
    // Penalty for non-compliant
    if (v.compliance_status === 'FAIL') score -= 50;
    if (v.compliance_status === 'WARN') score -= 10;
    
    return { variant: v, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.variant || null;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's auth
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      console.error('[generate-variants] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: GenerateRequest = await req.json();
    const { sessionId, envelopeId, envelope, buildablePolygon, selectedTemplates, programBuckets, sustainabilityLevel, designIntent } = body;

    console.log('[generate-variants] Starting generation for session:', sessionId);
    console.log('[generate-variants] Templates:', selectedTemplates.length, 'Program buckets:', programBuckets.length);

    // Validate session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('design_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('[generate-variants] Session not found:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (session.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create generation job
    const inputHash = JSON.stringify({ envelopeId, templateKeys: selectedTemplates.map(t => t.templateKey) })
      .split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)
      .toString(16);

    const { data: job, error: jobError } = await supabase
      .from('design_generation_jobs')
      .insert({
        session_id: sessionId,
        status: 'processing',
        input_hash: inputHash,
        design_intent: designIntent || null,
      })
      .select()
      .single();

    if (jobError) {
      console.error('[generate-variants] Failed to create job:', jobError);
      return new Response(
        JSON.stringify({ error: 'Failed to create generation job' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[generate-variants] Created job:', job.id);

    // Generate variants
    const variants = generateVariantPack(body);
    const bestVariant = getBestOverallVariant(variants);
    
    console.log('[generate-variants] Generated', variants.length, 'variants');

    if (variants.length === 0) {
      // Mark job as failed
      await supabase
        .from('design_generation_jobs')
        .update({ status: 'failed', error_message: 'No variants generated', completed_at: new Date().toISOString() })
        .eq('id', job.id);

      return new Response(
        JSON.stringify({ error: 'No variants could be generated' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark best variant
    const variantsForInsert = variants.map(v => ({
      ...v,
      name: v === bestVariant ? `★ ${v.name}` : v.name,
    }));

    // Batch insert using RPC
    const { data: insertedVariants, error: insertError } = await supabase
      .rpc('insert_variants_batch', {
        p_session_id: sessionId,
        p_variants: variantsForInsert,
        p_best_variant_id: null, // Will be set after insert
        p_generation_job_id: job.id,
      });

    if (insertError) {
      console.error('[generate-variants] Batch insert failed:', insertError);
      
      // Mark job as failed
      await supabase
        .from('design_generation_jobs')
        .update({ status: 'failed', error_message: insertError.message, completed_at: new Date().toISOString() })
        .eq('id', job.id);

      return new Response(
        JSON.stringify({ error: 'Failed to save variants', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find best variant ID
    const bestVariantId = insertedVariants?.find((v: { name: string }) => 
      v.name.startsWith('★')
    )?.id || insertedVariants?.[0]?.id || null;

    // Update job with best variant
    await supabase
      .from('design_generation_jobs')
      .update({ best_variant_id: bestVariantId })
      .eq('id', job.id);

    // Update design intent on session if provided
    if (designIntent) {
      await supabase
        .from('design_sessions')
        .update({ design_intent: designIntent, updated_at: new Date().toISOString() })
        .eq('id', sessionId);
    }

    console.log('[generate-variants] Success! Inserted', insertedVariants?.length, 'variants. Best:', bestVariantId);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        variants: insertedVariants,
        variantsCount: insertedVariants?.length || 0,
        bestVariantId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-variants] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
