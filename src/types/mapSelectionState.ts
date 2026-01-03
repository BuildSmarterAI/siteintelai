/**
 * Map Selection State Types
 * Defines the three explicit map states for parcel selection:
 * - exploration: browsing parcels, full visibility, unrestricted interaction
 * - candidate-focus: soft hover/pre-select, slight dimming, no commitment
 * - locked: binding selection, strong dimming, restricted zoom/pan
 */

export type MapSelectionState = 'exploration' | 'candidate-focus' | 'locked';

export interface MapSelectionConfig {
  state: MapSelectionState;
  selectedParcelId: string | null;
  selectedGeometry: GeoJSON.Geometry | null;
  confidence?: 'high' | 'medium' | 'low';
  isPostConfirmation?: boolean; // After "Confirm & Lock"
}

/**
 * Visual and behavioral configuration for each map state
 */
export const MAP_STATE_CONFIG = {
  exploration: {
    /** Opacity for non-selected parcels (1.0 = full visibility) */
    nonSelectedOpacity: 1.0,
    /** Opacity for selected parcel fill */
    selectedFillOpacity: 0.35,
    /** Whether hover highlights are enabled */
    hoverEnabled: true,
    /** Whether scroll zoom is enabled */
    scrollZoomEnabled: true,
    /** Pan restriction: true = unrestricted, 'restricted' = limited radius, false = disabled */
    panMode: 'unrestricted' as const,
    /** Whether the selection glow should pulse */
    glowPulsing: false,
    /** Cursor style */
    cursor: 'pointer',
  },
  'candidate-focus': {
    nonSelectedOpacity: 0.7,
    selectedFillOpacity: 0.35,
    hoverEnabled: true,
    scrollZoomEnabled: true,
    panMode: 'unrestricted' as const,
    glowPulsing: false,
    cursor: 'pointer',
  },
  locked: {
    nonSelectedOpacity: 0.3,
    selectedFillOpacity: 0.25,
    hoverEnabled: false,
    scrollZoomEnabled: false,
    panMode: 'restricted' as const, // ±15% of view
    glowPulsing: true,
    cursor: 'default',
  },
} as const;

/**
 * Spotlight layer styling based on selection state
 */
export const SPOTLIGHT_STYLE = {
  exploration: {
    glowWidth: 8,
    glowOpacity: 0.2,
    lineWidth: 3,
    lineColor: '#FF7A00', // Feasibility Orange
    fillColor: '#FF7A00',
    fillOpacity: 0.1,
  },
  'candidate-focus': {
    glowWidth: 10,
    glowOpacity: 0.3,
    lineWidth: 4,
    lineColor: '#FF7A00', // Feasibility Orange
    fillColor: '#FF7A00',
    fillOpacity: 0.15,
  },
  locked: {
    glowWidth: 14,
    glowOpacity: 0.35,
    lineWidth: 5,
    lineColor: '#FF7A00', // Feasibility Orange - consistent brand
    fillColor: '#FF7A00',
    fillOpacity: 0.2,
    // Pulse animation parameters
    pulseMinOpacity: 0.15,
    pulseMaxOpacity: 0.35,
    pulseDuration: 2000, // 2s loop
  },
  verified: {
    glowWidth: 16,
    glowOpacity: 0.4,
    lineWidth: 6,
    lineColor: '#10B981', // Success green
    fillColor: '#10B981',
    fillOpacity: 0.25,
    // No pulsing after confirmation
    glowPulsing: false,
  },
} as const;

/**
 * Get the appropriate spotlight style for the current state
 */
export function getSpotlightStyle(
  selectionState: MapSelectionState,
  isVerified: boolean
): typeof SPOTLIGHT_STYLE[keyof typeof SPOTLIGHT_STYLE] {
  if (isVerified) {
    return SPOTLIGHT_STYLE.verified;
  }
  return SPOTLIGHT_STYLE[selectionState];
}

/**
 * Tooltip copy based on selection state
 */
export const SELECTION_TOOLTIP_COPY = {
  'candidate-focus': {
    title: 'Selected Parcel',
    subtitle: 'This parcel is currently selected for feasibility analysis.',
  },
  locked: {
    title: 'Selected Parcel',
    subtitle: 'This parcel is currently selected for feasibility analysis.',
    warning: '⚠ Boundary-based selection — verify before proceeding',
  },
  verified: {
    title: '🔒 Parcel locked for feasibility analysis',
    subtitle: null,
  },
} as const;
