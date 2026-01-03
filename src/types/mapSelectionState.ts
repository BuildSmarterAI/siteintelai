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
    /** Pan restriction: 'unrestricted' = free, 'restricted' = limited radius, 'disabled' = no pan */
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
 * Parcel Polygon Style Variants (Figma-aligned)
 * Exact color specifications from design system
 */
export const PARCEL_STYLE_VARIANTS = {
  default: {
    fill: 'rgba(255, 255, 255, 0.06)', // #FFFFFF @ 6%
    stroke: 'rgba(156, 163, 175, 0.6)', // #9CA3AF @ 60%
    strokeWidth: 1,
    opacity: 1.0,
  },
  hover: {
    fill: 'rgba(255, 255, 255, 0.08)', // #FFFFFF @ 8%
    stroke: '#FF7A00', // accent-600 @ 90%
    strokeWidth: 2,
    opacity: 1.0,
  },
  dimmed: {
    fill: 'rgba(255, 255, 255, 0.06)',
    stroke: 'rgba(156, 163, 175, 0.35)', // #9CA3AF @ 35%
    strokeWidth: 1,
    opacity: 0.3,
  },
  selected: {
    fill: 'rgba(255, 122, 0, 0.1)', // accent-500 @ 10%
    stroke: '#FF7A00', // accent-600 @ 100%
    strokeWidth: 4,
    opacity: 1.0,
    innerStroke: 'rgba(255, 255, 255, 0.4)', // optional crisp edge
  },
  locked: {
    // Same as selected but can shift to accent-700 for finality
    fill: 'rgba(255, 122, 0, 0.1)',
    stroke: '#EA6A00', // accent-700 for finality
    strokeWidth: 4,
    opacity: 1.0,
  },
} as const;

/**
 * Glow Layer Configuration (Multi-layer simulation for blur effect)
 */
export const GLOW_LAYER_CONFIG = {
  /** Stack of concentric line layers for simulated blur */
  layers: [
    { id: 'glow-outer', width: 14, opacity: 0.08 },
    { id: 'glow-mid', width: 10, opacity: 0.12 },
    { id: 'glow-inner', width: 6, opacity: 0.18 },
  ],
  color: '#FF7A00',
  animation: {
    durationMs: 2000,
    easing: 'easeInOut' as const,
    opacityMin: 0.15,
    opacityMax: 0.35,
    loop: true,
    disableOnLocked: true,
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
 * Camera fit configuration for parcel selection
 */
export const CAMERA_FIT_CONFIG = {
  /** Padding around parcel bounds (percentage) */
  paddingPercent: 15,
  /** Padding in pixels (minimum) */
  paddingPx: { top: 60, bottom: 60, left: 60, right: 60 },
  /** Animation duration in ms */
  durationMs: 350,
  /** Max zoom level */
  maxZoom: 18,
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

/**
 * Tooltip styling configuration (Figma-aligned)
 */
export const TOOLTIP_STYLE_CONFIG = {
  width: { min: 280, max: 340 },
  padding: 12,
  gap: 8,
  borderRadius: 12,
  background: {
    light: 'rgba(255, 255, 255, 0.96)', // #FFFFFF @ 96%
    dark: 'rgba(17, 24, 39, 0.92)', // #111827 @ 92%
  },
  shadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
  typography: {
    title: { size: 14, weight: 600 },
    body: { size: 12, weight: 400 },
    warning: { size: 12, weight: 500 },
  },
} as const;
