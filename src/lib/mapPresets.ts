/**
 * Map Layer Presets - Decision-Driven Layer Control
 * 
 * Each preset answers ONE feasibility question.
 * Max 3-4 layers visible at once.
 * No "everything-on" mode.
 */

export type PresetAudience = "DEVELOPER" | "LENDER" | "IC";

export interface MapLayerPreset {
  id: string;
  label: string;
  audience: PresetAudience;
  purpose: string;
  description: string;
  defaultZoom: number;
  layers: {
    on: string[];
    off: string[];
  };
  interactionRules: {
    clickableLayers: string[];
    highlightOnHover: boolean;
    syncWithKillFactors: boolean;
  };
  visualPriority: {
    primary: string[];
    secondary: string[];
    muted: string[];
  };
}

// Canonical layer IDs used across the system
export const LAYER_IDS = {
  parcel: 'parcel',
  floodZones: 'floodZones',
  floodway: 'floodway',
  wetlands: 'wetlands',
  waterLines: 'waterLines',
  sewerLines: 'sewerLines',
  stormLines: 'stormLines',
  powerLines: 'powerLines',
  utilityBuffers: 'utilityBuffers',
  zoningDistricts: 'zoningDistricts',
  overlayDistricts: 'overlayDistricts',
  adjacentZoning: 'adjacentZoning',
  roadClassification: 'roadClassification',
  drivewayPoints: 'drivewayPoints',
  trafficCounts: 'trafficCounts',
  submarketBoundary: 'submarketBoundary',
  comparableUses: 'comparableUses',
  environmental: 'environmental',
  topography: 'topography',
  satellite: 'satellite',
  hcadParcels: 'hcadParcels',
  forceMain: 'forceMain',
  stormManholes: 'stormManholes',
} as const;

/**
 * PRESET 1 — Decision Mode (Default)
 * Justifies the verdict visually
 */
export const DECISION_MODE: MapLayerPreset = {
  id: 'decision_mode',
  label: 'Decision Mode',
  audience: 'DEVELOPER',
  purpose: 'Justify the verdict visually',
  description: 'Default view highlights critical constraints affecting feasibility.',
  defaultZoom: 15,
  layers: {
    on: [
      LAYER_IDS.parcel,
      LAYER_IDS.floodZones,
      LAYER_IDS.floodway,
      LAYER_IDS.wetlands,
      LAYER_IDS.utilityBuffers,
    ],
    off: [
      LAYER_IDS.submarketBoundary,
      LAYER_IDS.comparableUses,
      LAYER_IDS.trafficCounts,
      LAYER_IDS.zoningDistricts,
      LAYER_IDS.satellite,
      LAYER_IDS.topography,
    ],
  },
  interactionRules: {
    clickableLayers: [LAYER_IDS.parcel, LAYER_IDS.floodZones, LAYER_IDS.wetlands],
    highlightOnHover: true,
    syncWithKillFactors: true,
  },
  visualPriority: {
    primary: [LAYER_IDS.parcel, LAYER_IDS.floodway],
    secondary: [LAYER_IDS.floodZones, LAYER_IDS.utilityBuffers],
    muted: [LAYER_IDS.wetlands],
  },
};

/**
 * PRESET 2 — Lender Risk View
 * Surfaces regulatory and insurability risk
 */
export const LENDER_RISK: MapLayerPreset = {
  id: 'lender_risk',
  label: 'Lender Risk',
  audience: 'LENDER',
  purpose: 'Surface regulatory and insurability risk',
  description: 'Regulatory and environmental constraints affecting insurability and underwriting.',
  defaultZoom: 15,
  layers: {
    on: [
      LAYER_IDS.parcel,
      LAYER_IDS.floodZones,
      LAYER_IDS.floodway,
      LAYER_IDS.wetlands,
      LAYER_IDS.environmental,
    ],
    off: [
      LAYER_IDS.waterLines,
      LAYER_IDS.sewerLines,
      LAYER_IDS.submarketBoundary,
      LAYER_IDS.trafficCounts,
      LAYER_IDS.zoningDistricts,
      LAYER_IDS.satellite,
    ],
  },
  interactionRules: {
    clickableLayers: [LAYER_IDS.floodZones, LAYER_IDS.floodway, LAYER_IDS.wetlands],
    highlightOnHover: true,
    syncWithKillFactors: true,
  },
  visualPriority: {
    primary: [LAYER_IDS.floodway, LAYER_IDS.floodZones],
    secondary: [LAYER_IDS.wetlands, LAYER_IDS.environmental],
    muted: [LAYER_IDS.parcel],
  },
};

/**
 * PRESET 3 — Utilities Feasibility View
 * Confirms serviceability risk early
 */
export const UTILITIES_FEASIBILITY: MapLayerPreset = {
  id: 'utilities_feasibility',
  label: 'Utilities Feasibility',
  audience: 'DEVELOPER',
  purpose: 'Confirm serviceability risk early',
  description: 'Infrastructure proximity does not guarantee available capacity.',
  defaultZoom: 16,
  layers: {
    on: [
      LAYER_IDS.parcel,
      LAYER_IDS.waterLines,
      LAYER_IDS.sewerLines,
      LAYER_IDS.powerLines,
      LAYER_IDS.utilityBuffers,
    ],
    off: [
      LAYER_IDS.floodZones,
      LAYER_IDS.submarketBoundary,
      LAYER_IDS.trafficCounts,
      LAYER_IDS.zoningDistricts,
    ],
  },
  interactionRules: {
    clickableLayers: [LAYER_IDS.waterLines, LAYER_IDS.sewerLines, LAYER_IDS.powerLines],
    highlightOnHover: true,
    syncWithKillFactors: false,
  },
  visualPriority: {
    primary: [LAYER_IDS.waterLines, LAYER_IDS.sewerLines, LAYER_IDS.utilityBuffers],
    secondary: [LAYER_IDS.parcel],
    muted: [],
  },
};

/**
 * PRESET 4 — Zoning & Entitlements View
 * Confirms legal buildability context
 */
export const ZONING_ENTITLEMENTS: MapLayerPreset = {
  id: 'zoning_entitlements',
  label: 'Zoning & Entitlements',
  audience: 'DEVELOPER',
  purpose: 'Confirm legal buildability context',
  description: 'Legal development context for the subject parcel.',
  defaultZoom: 15,
  layers: {
    on: [
      LAYER_IDS.parcel,
      LAYER_IDS.zoningDistricts,
      LAYER_IDS.overlayDistricts,
      LAYER_IDS.adjacentZoning,
    ],
    off: [
      LAYER_IDS.floodZones,
      LAYER_IDS.waterLines,
      LAYER_IDS.submarketBoundary,
      LAYER_IDS.trafficCounts,
    ],
  },
  interactionRules: {
    clickableLayers: [LAYER_IDS.zoningDistricts, LAYER_IDS.overlayDistricts],
    highlightOnHover: true,
    syncWithKillFactors: false,
  },
  visualPriority: {
    primary: [LAYER_IDS.parcel, LAYER_IDS.zoningDistricts],
    secondary: [LAYER_IDS.adjacentZoning],
    muted: [LAYER_IDS.overlayDistricts],
  },
};

/**
 * PRESET 5 — Access & Traffic View
 * Identifies access and TIA risk
 */
export const ACCESS_TRAFFIC: MapLayerPreset = {
  id: 'access_traffic',
  label: 'Access & Traffic',
  audience: 'DEVELOPER',
  purpose: 'Identify access and TIA risk',
  description: 'Roadway access and traffic review considerations.',
  defaultZoom: 15,
  layers: {
    on: [
      LAYER_IDS.parcel,
      LAYER_IDS.roadClassification,
      LAYER_IDS.drivewayPoints,
      LAYER_IDS.trafficCounts,
    ],
    off: [
      LAYER_IDS.floodZones,
      LAYER_IDS.waterLines,
      LAYER_IDS.submarketBoundary,
      LAYER_IDS.zoningDistricts,
    ],
  },
  interactionRules: {
    clickableLayers: [LAYER_IDS.roadClassification, LAYER_IDS.trafficCounts],
    highlightOnHover: true,
    syncWithKillFactors: false,
  },
  visualPriority: {
    primary: [LAYER_IDS.roadClassification],
    secondary: [LAYER_IDS.drivewayPoints, LAYER_IDS.trafficCounts],
    muted: [LAYER_IDS.parcel],
  },
};

/**
 * PRESET 6 — Market Context (Advisory Only)
 * Provides prioritization context
 */
export const MARKET_CONTEXT: MapLayerPreset = {
  id: 'market_context',
  label: 'Market Context',
  audience: 'IC',
  purpose: 'Provide prioritization context only',
  description: 'Advisory signals only. Market data does not override feasibility constraints.',
  defaultZoom: 13,
  layers: {
    on: [
      LAYER_IDS.parcel,
      LAYER_IDS.submarketBoundary,
      LAYER_IDS.comparableUses,
    ],
    off: [
      LAYER_IDS.floodZones,
      LAYER_IDS.waterLines,
      LAYER_IDS.zoningDistricts,
      LAYER_IDS.trafficCounts,
    ],
  },
  interactionRules: {
    clickableLayers: [LAYER_IDS.comparableUses],
    highlightOnHover: false,
    syncWithKillFactors: false,
  },
  visualPriority: {
    primary: [LAYER_IDS.parcel],
    secondary: [LAYER_IDS.submarketBoundary],
    muted: [LAYER_IDS.comparableUses],
  },
};

// Registry of all presets
export const MAP_PRESETS: Record<string, MapLayerPreset> = {
  decision_mode: DECISION_MODE,
  lender_risk: LENDER_RISK,
  utilities_feasibility: UTILITIES_FEASIBILITY,
  zoning_entitlements: ZONING_ENTITLEMENTS,
  access_traffic: ACCESS_TRAFFIC,
  market_context: MARKET_CONTEXT,
};

// Ordered list for UI rendering
export const PRESET_ORDER = [
  'decision_mode',
  'lender_risk',
  'utilities_feasibility',
  'zoning_entitlements',
  'access_traffic',
  'market_context',
] as const;

// Default preset ID
export const DEFAULT_PRESET = 'decision_mode';

/**
 * Get layers that should be visible for a preset
 */
export function getVisibleLayers(presetId: string): string[] {
  const preset = MAP_PRESETS[presetId];
  return preset?.layers.on || [];
}

/**
 * Check if a layer is visible in a preset
 */
export function isLayerVisible(presetId: string, layerId: string): boolean {
  const preset = MAP_PRESETS[presetId];
  if (!preset) return false;
  return preset.layers.on.includes(layerId);
}

/**
 * Get preset by audience type
 */
export function getPresetsForAudience(audience: PresetAudience): MapLayerPreset[] {
  return Object.values(MAP_PRESETS).filter(p => p.audience === audience);
}
