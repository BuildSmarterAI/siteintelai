/**
 * Variant Generation Engine
 * Creates design variants based on templates and strategies
 */

import type {
  VariantStrategy,
  DesignTemplate,
  EnvelopeSummary,
  ProgramBucket,
  SelectedTemplate,
  SustainabilityLevel,
} from '@/types/wizard';
import { generateFootprintPolygon, getPolygonCentroid, clampToEnvelope } from './footprintGeometry';

interface GenerateConfig {
  envelope: EnvelopeSummary;
  buildablePolygon: GeoJSON.Polygon;
  selectedTemplates: SelectedTemplate[];
  programBuckets: ProgramBucket[];
  sustainabilityLevel: SustainabilityLevel | null;
}

interface GeneratedVariant {
  name: string;
  strategy: VariantStrategy;
  footprint: GeoJSON.Polygon;
  heightFt: number;
  floors: number;
  gfa: number;
  far: number;
  coverage: number;
  templateKey: string;
  useType: string;
  notes: string;
  sustainabilityLevel: SustainabilityLevel | null;
}

/**
 * Determine which strategies to use based on envelope and templates
 */
function getActiveStrategies(config: GenerateConfig): VariantStrategy[] {
  const strategies: VariantStrategy[] = ['safe', 'balanced', 'max_yield'];
  
  // Add height-biased if we have headroom
  if (config.envelope.heightCapFt > 40) {
    strategies.push('height_biased');
  }
  
  // Add coverage-biased if we have coverage headroom
  if (config.envelope.coverageCapPct > 60) {
    strategies.push('coverage_biased');
  }
  
  // Add mixed program if multiple use types
  if (config.selectedTemplates.length >= 2) {
    strategies.push('mixed_program');
  }
  
  return strategies.slice(0, 6);
}

/**
 * Format GFA for display
 */
function formatGfa(gfa: number): string {
  if (gfa >= 1000000) {
    return `${(gfa / 1000000).toFixed(1)}M`;
  }
  return `${Math.round(gfa / 1000)}K`;
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

/**
 * Generate a single variant for a strategy
 */
function createVariantForStrategy(
  config: GenerateConfig,
  strategy: VariantStrategy
): GeneratedVariant | null {
  const { envelope, buildablePolygon, selectedTemplates, programBuckets } = config;
  
  // Get primary template and bucket
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
      // 60% of max capacity, centered placement
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
      // 80% of max capacity
      footprintSqft = Math.min(
        baseFootprint,
        (envelope.coverageCapPct * 0.8 / 100) * envelope.parcelSqft
      );
      floors = baseFloors;
      heightFt = floors * template.floor_to_floor_ft;
      break;
      
    case 'max_yield':
      // Push to 95% of limits
      footprintSqft = Math.min(
        baseFootprint * 1.2,
        (envelope.coverageCapPct * 0.95 / 100) * envelope.parcelSqft
      );
      floors = Math.floor((envelope.heightCapFt * 0.95) / template.floor_to_floor_ft);
      floors = Math.max(1, floors);
      heightFt = Math.min(envelope.heightCapFt * 0.95, floors * template.floor_to_floor_ft);
      break;
      
    case 'height_biased':
      // Maximize height, reduce footprint
      floors = Math.floor(envelope.heightCapFt / template.floor_to_floor_ft);
      floors = Math.max(1, floors);
      heightFt = floors * template.floor_to_floor_ft;
      footprintSqft = Math.max(
        template.min_footprint_sqft,
        bucket.targetGfa / floors
      );
      break;
      
    case 'coverage_biased':
      // Maximize footprint, minimize floors
      footprintSqft = Math.min(
        template.max_footprint_sqft,
        (envelope.coverageCapPct * 0.9 / 100) * envelope.parcelSqft
      );
      floors = Math.max(1, Math.ceil(bucket.targetGfa / footprintSqft));
      floors = Math.min(floors, template.max_floors);
      heightFt = floors * template.floor_to_floor_ft;
      break;
      
    case 'mixed_program':
      // Use first template for now, could be expanded
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
  const rawFootprint = generateFootprintPolygon({
    targetSqft: footprintSqft,
    shape: template.footprint_shape,
    widthDepthRatio: template.width_depth_ratio,
    centerLng: centroid.lng,
    centerLat: centroid.lat,
  });
  
  // Clamp to buildable envelope
  const footprint = clampToEnvelope(rawFootprint, buildablePolygon);
  
  // Calculate metrics
  const gfa = footprintSqft * floors;
  const far = gfa / envelope.parcelSqft;
  const coverage = (footprintSqft / envelope.parcelSqft) * 100;
  
  // Build name
  const useTypeLabel = capitalizeFirst(template.use_type);
  const strategyLabel = capitalizeFirst(strategy);
  const name = `${strategyLabel} — ${useTypeLabel} — ${formatGfa(gfa)} — ${Math.round(heightFt)}'`;
  
  return {
    name,
    strategy,
    footprint,
    heightFt,
    floors,
    gfa,
    far: Math.round(far * 100) / 100,
    coverage: Math.round(coverage),
    templateKey: template.template_key,
    useType: template.use_type,
    notes: `Generated via ${strategy} strategy`,
    sustainabilityLevel: config.sustainabilityLevel,
  };
}

/**
 * Generate all variants based on configuration
 */
export function generateVariantPack(config: GenerateConfig): GeneratedVariant[] {
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

/**
 * Get the "Best Overall" variant from a pack
 */
export function getBestOverallVariant(variants: GeneratedVariant[]): GeneratedVariant | null {
  if (variants.length === 0) return null;
  
  // Score each variant
  const scored = variants.map(v => {
    let score = 0;
    
    // Prefer balanced strategy
    if (v.strategy === 'balanced') score += 20;
    if (v.strategy === 'safe') score += 10;
    
    // Prefer moderate utilization (70-90% coverage is good)
    if (v.coverage >= 70 && v.coverage <= 90) score += 15;
    
    // Prefer FAR between 0.5 and 0.8
    if (v.far >= 0.5 && v.far <= 0.8) score += 15;
    
    // Bonus for larger GFA
    score += Math.min(20, v.gfa / 10000);
    
    return { variant: v, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.variant || null;
}
