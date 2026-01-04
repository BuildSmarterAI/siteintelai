/**
 * Building Type Registry
 * Static, immutable registry of 8 MVP building archetypes
 */

import type { BuildingTypeArchetype, BuildingTypeCategory } from '@/types/buildingTypes';

/**
 * MVP Building Archetypes
 * These are immutable at runtime and define the core building types
 */
export const BUILDING_ARCHETYPES: readonly BuildingTypeArchetype[] = [
  {
    id: 'single_story_retail_pad',
    name: 'Single-Story Retail Pad',
    description: 'Freestanding retail building with dedicated parking, ideal for national tenants.',
    category: 'commercial',
    typicalStories: 1,
    floorToFloorHeightFt: 18,
    footprintBias: 'compact',
    roofForm: 'flat',
    parkingBias: 'medium',
    yieldProfile: 'low',
    riskProfile: 'low',
    icon: 'Store',
    color: 'hsl(var(--chart-4))',
  },
  {
    id: 'multi_tenant_retail_strip',
    name: 'Multi-Tenant Retail Strip',
    description: 'Linear inline retail with multiple tenant spaces and front parking.',
    category: 'commercial',
    typicalStories: 1,
    floorToFloorHeightFt: 16,
    footprintBias: 'linear',
    roofForm: 'flat',
    parkingBias: 'high',
    yieldProfile: 'medium',
    riskProfile: 'low',
    icon: 'ShoppingBag',
    color: 'hsl(var(--chart-4))',
  },
  {
    id: 'medical_office',
    name: 'Medical Office Building',
    description: 'Multi-story medical office with high parking requirements.',
    category: 'commercial',
    typicalStories: [2, 4],
    floorToFloorHeightFt: 12,
    footprintBias: 'compact',
    roofForm: 'flat',
    parkingBias: 'high',
    yieldProfile: 'medium',
    riskProfile: 'medium',
    icon: 'Stethoscope',
    color: 'hsl(var(--chart-5))',
  },
  {
    id: 'industrial_warehouse',
    name: 'Industrial Warehouse',
    description: 'Large footprint distribution or manufacturing facility with clear heights.',
    category: 'industrial',
    typicalStories: 1,
    floorToFloorHeightFt: 32,
    footprintBias: 'deep',
    roofForm: 'flat',
    parkingBias: 'low',
    yieldProfile: 'medium',
    riskProfile: 'low',
    icon: 'Warehouse',
    color: 'hsl(var(--chart-1))',
  },
  {
    id: 'low_rise_multifamily',
    name: 'Low-Rise Multifamily',
    description: 'Garden-style apartments or townhomes with surface parking.',
    category: 'residential',
    typicalStories: [2, 4],
    floorToFloorHeightFt: 11,
    footprintBias: 'modular',
    roofForm: 'flat',
    parkingBias: 'medium',
    yieldProfile: 'high',
    riskProfile: 'medium',
    icon: 'Home',
    color: 'hsl(var(--chart-2))',
  },
  {
    id: 'hotel_hospitality',
    name: 'Hotel / Hospitality',
    description: 'Multi-story hotel with lobby, rooms, and amenity spaces.',
    category: 'hospitality',
    typicalStories: [3, 6],
    floorToFloorHeightFt: 10,
    footprintBias: 'stacked',
    roofForm: 'flat',
    parkingBias: 'medium',
    yieldProfile: 'high',
    riskProfile: 'high',
    icon: 'Hotel',
    color: 'hsl(var(--primary))',
  },
  {
    id: 'qsr_drive_thru',
    name: 'QSR / Drive-Thru',
    description: 'Quick service restaurant with drive-thru lane and queue stacking.',
    category: 'commercial',
    typicalStories: 1,
    floorToFloorHeightFt: 15,
    footprintBias: 'compact',
    roofForm: 'flat',
    parkingBias: 'queue',
    yieldProfile: 'low',
    riskProfile: 'low',
    icon: 'UtensilsCrossed',
    color: 'hsl(var(--chart-1))',
  },
  {
    id: 'flex_light_mixed_use',
    name: 'Flex / Light Mixed-Use',
    description: 'Flexible space combining office, showroom, and light industrial.',
    category: 'commercial',
    typicalStories: [1, 3],
    floorToFloorHeightFt: 14,
    footprintBias: 'linear',
    roofForm: 'flat',
    parkingBias: 'medium',
    yieldProfile: 'medium',
    riskProfile: 'medium',
    icon: 'Building2',
    color: 'hsl(var(--chart-3))',
  },
] as const;

/**
 * Get all building archetypes
 */
export function getAllArchetypes(): readonly BuildingTypeArchetype[] {
  return BUILDING_ARCHETYPES;
}

/**
 * Get archetype by ID
 */
export function getArchetypeById(id: string): BuildingTypeArchetype | undefined {
  return BUILDING_ARCHETYPES.find((a) => a.id === id);
}

/**
 * Get archetypes by category
 */
export function getArchetypesByCategory(category: BuildingTypeCategory): BuildingTypeArchetype[] {
  return BUILDING_ARCHETYPES.filter((a) => a.category === category);
}

/**
 * Category display configuration
 */
export const CATEGORY_CONFIG: Record<BuildingTypeCategory, { label: string; icon: string }> = {
  commercial: { label: 'Commercial', icon: 'Building2' },
  industrial: { label: 'Industrial', icon: 'Warehouse' },
  residential: { label: 'Residential', icon: 'Home' },
  hospitality: { label: 'Hospitality', icon: 'Hotel' },
};

/**
 * Intensity level display configuration
 */
export const INTENSITY_CONFIG: Record<string, { label: string; description: string; multiplier: number }> = {
  conservative: { 
    label: 'Conservative', 
    description: 'Lower density, more buffer',
    multiplier: 0.70,
  },
  optimal: { 
    label: 'Optimal', 
    description: 'Balanced utilization',
    multiplier: 0.85,
  },
  aggressive: { 
    label: 'Aggressive', 
    description: 'Maximum allowable',
    multiplier: 0.95,
  },
};

/**
 * Yield profile colors
 */
export const YIELD_COLORS: Record<string, string> = {
  low: 'text-muted-foreground',
  medium: 'text-yellow-600 dark:text-yellow-500',
  high: 'text-green-600 dark:text-green-500',
};

/**
 * Risk profile colors
 */
export const RISK_COLORS: Record<string, string> = {
  low: 'text-green-600 dark:text-green-500',
  medium: 'text-yellow-600 dark:text-yellow-500',
  high: 'text-red-600 dark:text-red-500',
};
