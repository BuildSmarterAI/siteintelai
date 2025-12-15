/**
 * PRD-Compliant Utility Layer Configuration
 * Per PRD: Utility Infrastructure Map Layers (Water, Sewer, Stormwater)
 * 
 * Color System (Non-Negotiable per PRD §6.1):
 * - Water: Blue #1F6AE1
 * - Sewer: Brown #7A4A2E
 * - Stormwater: Teal #1C7C7C
 */

import type { UtilityType, FeatureType, ConfidenceLevel } from '@/types/utilities';

// ============================================================================
// PRD Color System (§6.1 - Non-Negotiable)
// ============================================================================

export const UTILITY_COLORS = {
  water: '#1F6AE1',      // Blue
  sewer: '#7A4A2E',      // Brown
  stormwater: '#1C7C7C', // Teal
  // Darker variants for force mains
  sewer_force: '#5A3A1E',
} as const;

// ============================================================================
// Layer Naming Convention (§5.2)
// ============================================================================

export const UTILITY_LAYER_IDS = {
  // Water
  water_mains: 'utilities-water-mains',
  water_valves: 'utilities-water-valves',
  water_pump_stations: 'utilities-water-pump-stations',
  // Sewer
  sewer_gravity: 'utilities-sewer-gravity',
  sewer_force: 'utilities-sewer-force',
  sewer_manholes: 'utilities-sewer-manholes',
  sewer_lift_stations: 'utilities-sewer-lift-stations',
  // Stormwater
  storm_trunks: 'utilities-storm-trunks',
  storm_inlets: 'utilities-storm-inlets',
  storm_outfalls: 'utilities-storm-outfalls',
} as const;

// ============================================================================
// Line Width by Zoom (§6.2)
// ============================================================================

export const LINE_WIDTH_BY_ZOOM = [
  'interpolate',
  ['linear'],
  ['zoom'],
  12, 0.75,
  13, 1.0,
  14, 1.5,
  15, 2.0,
  16, 2.5,
] as const;

// ============================================================================
// Line Styling Rules (§6.2)
// ============================================================================

export interface LineStyle {
  color: string;
  dasharray?: number[];
  opacity: number;
  widthByZoom: readonly (string | number | readonly string[])[];
}

export const LINE_STYLES: Record<string, LineStyle> = {
  // Water Mains - Solid line
  water_main: {
    color: UTILITY_COLORS.water,
    opacity: 0.9,
    widthByZoom: LINE_WIDTH_BY_ZOOM,
  },
  // Gravity Sewer - Dashed line [4,2]
  sewer_gravity: {
    color: UTILITY_COLORS.sewer,
    dasharray: [4, 2],
    opacity: 0.9,
    widthByZoom: LINE_WIDTH_BY_ZOOM,
  },
  // Force Mains - Dashed line [1,1], darker brown
  sewer_force: {
    color: UTILITY_COLORS.sewer_force,
    dasharray: [1, 1],
    opacity: 0.9,
    widthByZoom: LINE_WIDTH_BY_ZOOM,
  },
  // Stormwater - Dotted [2,3]
  storm_trunk: {
    color: UTILITY_COLORS.stormwater,
    dasharray: [2, 3],
    opacity: 0.8,
    widthByZoom: LINE_WIDTH_BY_ZOOM,
  },
};

// ============================================================================
// Point Symbology (§6.3)
// ============================================================================

export interface PointStyle {
  shape: 'circle' | 'square' | 'triangle';
  size: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
}

export const POINT_STYLES: Record<string, PointStyle> = {
  manhole: {
    shape: 'circle',
    size: 6,
    color: UTILITY_COLORS.sewer,
    strokeColor: '#FFFFFF',
    strokeWidth: 1,
  },
  inlet: {
    shape: 'square',
    size: 6,
    color: UTILITY_COLORS.stormwater,
    strokeColor: '#FFFFFF',
    strokeWidth: 1,
  },
  lift_station: {
    shape: 'triangle',
    size: 8,
    color: UTILITY_COLORS.sewer,
    strokeColor: '#FFFFFF',
    strokeWidth: 1.5,
  },
  valve: {
    shape: 'circle',
    size: 5,
    color: UTILITY_COLORS.water,
    strokeColor: '#FFFFFF',
    strokeWidth: 1,
  },
  pump_station: {
    shape: 'triangle',
    size: 8,
    color: UTILITY_COLORS.water,
    strokeColor: '#FFFFFF',
    strokeWidth: 1.5,
  },
  outfall: {
    shape: 'circle',
    size: 7,
    color: UTILITY_COLORS.stormwater,
    strokeColor: '#FFFFFF',
    strokeWidth: 1,
  },
};

// ============================================================================
// Confidence Badge Styling (§9.1)
// ============================================================================

export interface ConfidenceBadgeStyle {
  label: string;
  bgColor: string;
  textColor: string;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  icon?: string;
}

export const CONFIDENCE_BADGE_STYLES: Record<ConfidenceLevel, ConfidenceBadgeStyle> = {
  high: {
    label: 'High',
    bgColor: '#10B981',
    textColor: '#FFFFFF',
    borderStyle: 'solid',
  },
  medium: {
    label: 'Medium',
    bgColor: '#F59E0B',
    textColor: '#FFFFFF',
    borderStyle: 'dashed',
  },
  low: {
    label: 'Low',
    bgColor: '#EF4444',
    textColor: '#FFFFFF',
    borderStyle: 'dotted',
    icon: '⚠',
  },
};

// ============================================================================
// MapLibre Layer Specifications
// ============================================================================

export interface UtilityLayerSpec {
  id: string;
  type: 'line' | 'circle' | 'symbol';
  sourceLayer: string;
  filter?: any[];
  paint: Record<string, any>;
  layout?: Record<string, any>;
  minzoom?: number;
  maxzoom?: number;
}

/**
 * Generate MapLibre-compatible layer specs for all utility layers
 * Follows PRD §6 styling requirements
 */
export function generateUtilityLayerSpecs(sourceId: string): UtilityLayerSpec[] {
  return [
    // ========== WATER LAYERS ==========
    // Water Mains (solid blue line)
    {
      id: UTILITY_LAYER_IDS.water_mains,
      type: 'line',
      sourceLayer: 'utilities',
      filter: ['all', 
        ['==', ['get', 'utility_type'], 'water'],
        ['in', ['get', 'feature_type'], ['literal', ['main', 'transmission']]],
      ],
      paint: {
        'line-color': UTILITY_COLORS.water,
        'line-width': LINE_WIDTH_BY_ZOOM,
        'line-opacity': 0.9,
      },
      minzoom: 12,
    },
    // Water Valves (small blue circles)
    {
      id: UTILITY_LAYER_IDS.water_valves,
      type: 'circle',
      sourceLayer: 'utilities',
      filter: ['all',
        ['==', ['get', 'utility_type'], 'water'],
        ['==', ['get', 'feature_type'], 'valve'],
      ],
      paint: {
        'circle-radius': 5,
        'circle-color': UTILITY_COLORS.water,
        'circle-stroke-color': '#FFFFFF',
        'circle-stroke-width': 1,
      },
      minzoom: 15,
    },
    // Water Pump Stations (larger blue circles)
    {
      id: UTILITY_LAYER_IDS.water_pump_stations,
      type: 'circle',
      sourceLayer: 'utilities',
      filter: ['all',
        ['==', ['get', 'utility_type'], 'water'],
        ['==', ['get', 'feature_type'], 'pump_station'],
      ],
      paint: {
        'circle-radius': 8,
        'circle-color': UTILITY_COLORS.water,
        'circle-stroke-color': '#FFFFFF',
        'circle-stroke-width': 1.5,
      },
      minzoom: 13,
    },

    // ========== SEWER LAYERS ==========
    // Gravity Sewer (dashed brown line)
    {
      id: UTILITY_LAYER_IDS.sewer_gravity,
      type: 'line',
      sourceLayer: 'utilities',
      filter: ['all',
        ['==', ['get', 'utility_type'], 'sewer'],
        ['in', ['get', 'feature_type'], ['literal', ['main', 'gravity']]],
      ],
      paint: {
        'line-color': UTILITY_COLORS.sewer,
        'line-width': LINE_WIDTH_BY_ZOOM,
        'line-opacity': 0.9,
        'line-dasharray': [4, 2],
      },
      minzoom: 12,
    },
    // Force Mains (tight dashed, darker brown)
    {
      id: UTILITY_LAYER_IDS.sewer_force,
      type: 'line',
      sourceLayer: 'utilities',
      filter: ['all',
        ['==', ['get', 'utility_type'], 'sewer'],
        ['==', ['get', 'feature_type'], 'force_main'],
      ],
      paint: {
        'line-color': UTILITY_COLORS.sewer_force,
        'line-width': LINE_WIDTH_BY_ZOOM,
        'line-opacity': 0.9,
        'line-dasharray': [1, 1],
      },
      minzoom: 12,
    },
    // Manholes (brown circles)
    {
      id: UTILITY_LAYER_IDS.sewer_manholes,
      type: 'circle',
      sourceLayer: 'utilities',
      filter: ['all',
        ['==', ['get', 'utility_type'], 'sewer'],
        ['==', ['get', 'feature_type'], 'manhole'],
      ],
      paint: {
        'circle-radius': 6,
        'circle-color': UTILITY_COLORS.sewer,
        'circle-stroke-color': '#FFFFFF',
        'circle-stroke-width': 1,
      },
      minzoom: 15,
    },
    // Lift Stations (larger brown circles - triangles would require custom icon)
    {
      id: UTILITY_LAYER_IDS.sewer_lift_stations,
      type: 'circle',
      sourceLayer: 'utilities',
      filter: ['all',
        ['==', ['get', 'utility_type'], 'sewer'],
        ['==', ['get', 'feature_type'], 'lift_station'],
      ],
      paint: {
        'circle-radius': 8,
        'circle-color': UTILITY_COLORS.sewer,
        'circle-stroke-color': '#FFFFFF',
        'circle-stroke-width': 1.5,
      },
      minzoom: 13,
    },

    // ========== STORMWATER LAYERS ==========
    // Storm Trunks (dotted teal line)
    {
      id: UTILITY_LAYER_IDS.storm_trunks,
      type: 'line',
      sourceLayer: 'utilities',
      filter: ['all',
        ['==', ['get', 'utility_type'], 'storm'],
        ['in', ['get', 'feature_type'], ['literal', ['trunk', 'main']]],
      ],
      paint: {
        'line-color': UTILITY_COLORS.stormwater,
        'line-width': LINE_WIDTH_BY_ZOOM,
        'line-opacity': 0.8,
        'line-dasharray': [2, 3],
      },
      minzoom: 12,
    },
    // Storm Inlets (teal squares - using circles as fallback)
    {
      id: UTILITY_LAYER_IDS.storm_inlets,
      type: 'circle',
      sourceLayer: 'utilities',
      filter: ['all',
        ['==', ['get', 'utility_type'], 'storm'],
        ['==', ['get', 'feature_type'], 'inlet'],
      ],
      paint: {
        'circle-radius': 6,
        'circle-color': UTILITY_COLORS.stormwater,
        'circle-stroke-color': '#FFFFFF',
        'circle-stroke-width': 1,
      },
      minzoom: 15,
    },
    // Storm Outfalls (larger teal circles)
    {
      id: UTILITY_LAYER_IDS.storm_outfalls,
      type: 'circle',
      sourceLayer: 'utilities',
      filter: ['all',
        ['==', ['get', 'utility_type'], 'storm'],
        ['==', ['get', 'feature_type'], 'outfall'],
      ],
      paint: {
        'circle-radius': 7,
        'circle-color': UTILITY_COLORS.stormwater,
        'circle-stroke-color': '#FFFFFF',
        'circle-stroke-width': 1,
      },
      minzoom: 14,
    },
  ];
}

// ============================================================================
// Layer Group Structure (§5.1)
// ============================================================================

export interface LayerGroupItem {
  id: string;
  label: string;
  layerIds: string[];
}

export interface LayerGroup {
  id: string;
  label: string;
  items: LayerGroupItem[];
}

export const UTILITY_LAYER_GROUPS: LayerGroup[] = [
  {
    id: 'water',
    label: 'Water',
    items: [
      { id: 'water-mains', label: 'Water Mains', layerIds: [UTILITY_LAYER_IDS.water_mains] },
      { id: 'water-valves', label: 'Water Valves', layerIds: [UTILITY_LAYER_IDS.water_valves] },
      { id: 'water-pumps', label: 'Pump Stations', layerIds: [UTILITY_LAYER_IDS.water_pump_stations] },
    ],
  },
  {
    id: 'sewer',
    label: 'Sewer',
    items: [
      { id: 'sewer-gravity', label: 'Gravity Sewer', layerIds: [UTILITY_LAYER_IDS.sewer_gravity] },
      { id: 'sewer-force', label: 'Force Mains', layerIds: [UTILITY_LAYER_IDS.sewer_force] },
      { id: 'sewer-manholes', label: 'Manholes', layerIds: [UTILITY_LAYER_IDS.sewer_manholes] },
      { id: 'sewer-lift', label: 'Lift Stations', layerIds: [UTILITY_LAYER_IDS.sewer_lift_stations] },
    ],
  },
  {
    id: 'stormwater',
    label: 'Stormwater',
    items: [
      { id: 'storm-trunks', label: 'Storm Trunks', layerIds: [UTILITY_LAYER_IDS.storm_trunks] },
      { id: 'storm-inlets', label: 'Inlets', layerIds: [UTILITY_LAYER_IDS.storm_inlets] },
      { id: 'storm-outfalls', label: 'Outfalls', layerIds: [UTILITY_LAYER_IDS.storm_outfalls] },
    ],
  },
];

// ============================================================================
// Get All Utility Layer IDs
// ============================================================================

export function getAllUtilityLayerIds(): string[] {
  return Object.values(UTILITY_LAYER_IDS);
}

// ============================================================================
// Preset Views (§7.2)
// ============================================================================

export type PresetView = 'lender' | 'civil_engineer' | 'developer';

export interface PresetViewConfig {
  label: string;
  description: string;
  visibleLayers: string[];
  showPoints: boolean;
  showBuffers: boolean;
}

export const PRESET_VIEWS: Record<PresetView, PresetViewConfig> = {
  lender: {
    label: 'Lender View',
    description: 'Mains only, parcel overlay, confidence warnings',
    visibleLayers: [
      UTILITY_LAYER_IDS.water_mains,
      UTILITY_LAYER_IDS.sewer_gravity,
      UTILITY_LAYER_IDS.sewer_force,
      UTILITY_LAYER_IDS.storm_trunks,
    ],
    showPoints: false,
    showBuffers: false,
  },
  civil_engineer: {
    label: 'Civil Engineer View',
    description: 'All utility layers + points + distance buffers',
    visibleLayers: getAllUtilityLayerIds(),
    showPoints: true,
    showBuffers: true,
  },
  developer: {
    label: 'Developer Quick Scan',
    description: 'Distance-to-parcel bands, highest-risk highlighted',
    visibleLayers: [
      UTILITY_LAYER_IDS.water_mains,
      UTILITY_LAYER_IDS.sewer_gravity,
      UTILITY_LAYER_IDS.sewer_force,
      UTILITY_LAYER_IDS.storm_trunks,
    ],
    showPoints: false,
    showBuffers: true,
  },
};
