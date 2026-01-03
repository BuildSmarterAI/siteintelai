/**
 * Design Wizard Types
 * Types for the "Explore Building Designs" wizard flow
 */

// Use types supported by templates
export type UseType = 'industrial' | 'multifamily' | 'office' | 'retail' | 'medical' | 'hotel';

// Footprint shapes for building massing
export type FootprintShape = 'bar' | 'L' | 'courtyard' | 'tower' | 'pad';

// Risk tolerance levels
export type RiskTolerance = 'safe' | 'balanced' | 'aggressive';

// Sustainability levels
export type SustainabilityLevel = 'low' | 'standard' | 'high';

// Parking types
export type ParkingType = 'surface' | 'structured' | 'ignore';

// Compliance status
export type ComplianceStatus = 'PASS' | 'WARN' | 'FAIL';

// Variant generation strategies
export type VariantStrategy = 
  | 'safe' 
  | 'balanced' 
  | 'max_yield' 
  | 'height_biased' 
  | 'coverage_biased' 
  | 'mixed_program';

/**
 * Design Template from database
 */
export interface DesignTemplate {
  id: string;
  template_key: string;
  use_type: UseType;
  name: string;
  description: string | null;
  default_floors: number;
  floor_to_floor_ft: number;
  footprint_shape: FootprintShape;
  footprint_area_target_sqft: number | null;
  width_depth_ratio: number;
  min_floors: number;
  max_floors: number;
  min_footprint_sqft: number;
  max_footprint_sqft: number;
  render_icon: string;
  sort_order: number;
  is_recommended_default: boolean;
  version: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Program bucket for a single use type
 */
export interface ProgramBucket {
  useType: UseType;
  targetGfa: number;
  targetStories: number;
  riskTolerance: RiskTolerance;
  floorToFloorFt: number;
}

/**
 * Parking configuration
 */
export interface ParkingConfig {
  enabled: boolean;
  type: ParkingType;
  ratio: number; // stalls per 1,000 SF
  estimatedStalls: number;
}

/**
 * Selected template with modifications
 */
export interface SelectedTemplate {
  templateKey: string;
  template: DesignTemplate;
  modifiedFloors?: number;
  modifiedFootprintSqft?: number;
  placementOffset?: { x: number; y: number };
}

/**
 * Template score from ranking algorithm
 */
export interface TemplateScore {
  templateId: string;
  templateKey: string;
  fitScore: number;
  utilizationScore: number;
  compliancePenalty: number;
  riskAdjustment: number;
  finalScore: number;
  complianceStatus: ComplianceStatus;
  estimatedGfa: number;
  estimatedFar: number;
  estimatedHeight: number;
  estimatedCoverage: number;
}

/**
 * Wizard step configuration
 */
export interface WizardStepConfig {
  id: number;
  key: string;
  label: string;
  icon: string;
  isOptional: boolean;
}

/**
 * Wizard state
 */
export interface WizardState {
  currentStep: number;
  maxReachedStep: number;
  
  // Step 1: Site
  siteConfirmed: boolean;
  
  // Step 2: Use Types
  selectedUseTypes: UseType[];
  
  // Step 3: Program Targets
  programBuckets: ProgramBucket[];
  
  // Step 4: Parking
  parkingConfig: ParkingConfig;
  
  // Step 5: Templates
  selectedTemplates: SelectedTemplate[];
  hoveredTemplateKey: string | null;
  
  // Step 6: Sustainability
  sustainabilityEnabled: boolean;
  sustainabilityLevel: SustainabilityLevel;
  
  // Step 7: Generate
  isGenerating: boolean;
  generationProgress: number;
  generatedVariantIds: string[];
}

/**
 * Envelope summary for wizard
 */
export interface EnvelopeSummary {
  parcelAcres: number;
  parcelSqft: number;
  buildableSqft: number;
  farCap: number;
  heightCapFt: number;
  coverageCapPct: number;
  maxGfa: number;
  envelopeQuality: 'high' | 'medium' | 'low';
}

/**
 * Default parking ratios by use type
 */
export const DEFAULT_PARKING_RATIOS: Record<UseType, number> = {
  industrial: 1.0,    // 1 stall per 1,000 SF
  multifamily: 1.5,   // 1.5 stalls per unit (approximate)
  office: 3.5,        // 3.5 stalls per 1,000 SF
  retail: 4.0,        // 4 stalls per 1,000 SF
  medical: 5.0,       // 5 stalls per 1,000 SF
  hotel: 1.0,         // 1 stall per room (approximate)
};

/**
 * Default floor-to-floor heights by use type
 */
export const DEFAULT_FLOOR_HEIGHTS: Record<UseType, number> = {
  industrial: 28,
  multifamily: 11,
  office: 13,
  retail: 14,
  medical: 12,
  hotel: 10,
};

/**
 * Use type display configuration
 */
export const USE_TYPE_CONFIG: Record<UseType, { label: string; icon: string; color: string }> = {
  industrial: { label: 'Industrial', icon: 'Warehouse', color: 'hsl(var(--chart-1))' },
  multifamily: { label: 'Multifamily', icon: 'Home', color: 'hsl(var(--chart-2))' },
  office: { label: 'Office', icon: 'Building2', color: 'hsl(var(--chart-3))' },
  retail: { label: 'Retail', icon: 'Store', color: 'hsl(var(--chart-4))' },
  medical: { label: 'Medical', icon: 'Stethoscope', color: 'hsl(var(--chart-5))' },
  hotel: { label: 'Hotel', icon: 'Hotel', color: 'hsl(var(--primary))' },
};

/**
 * Wizard steps configuration
 */
export const WIZARD_STEPS: WizardStepConfig[] = [
  { id: 1, key: 'site', label: 'Site', icon: 'MapPin', isOptional: false },
  { id: 2, key: 'use-types', label: 'Use Types', icon: 'Layers', isOptional: false },
  { id: 3, key: 'program', label: 'Program', icon: 'Settings2', isOptional: false },
  { id: 4, key: 'parking', label: 'Parking', icon: 'Car', isOptional: true },
  { id: 5, key: 'templates', label: 'Buildings', icon: 'Building', isOptional: false },
  { id: 6, key: 'sustainability', label: 'Sustainability', icon: 'Leaf', isOptional: true },
  { id: 7, key: 'generate', label: 'Generate', icon: 'Sparkles', isOptional: false },
];
