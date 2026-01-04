/**
 * Building Type Archetype Types
 * Types for the Building Type Selector step in the design wizard
 */

// Building type categories
export type BuildingTypeCategory = "commercial" | "industrial" | "residential" | "hospitality";

// Footprint bias determines how the building shape is generated
export type FootprintBias = "compact" | "linear" | "deep" | "stacked" | "modular";

// Intensity level for building preview
export type IntensityLevel = "conservative" | "optimal" | "aggressive";

// Orientation mode for building placement
export type OrientationMode = "street" | "parcel";

// Parking mode for preview
export type PreviewParkingMode = "surface" | "structured" | "ignored";

// Yield and risk profiles
export type YieldProfile = "low" | "medium" | "high";
export type RiskProfile = "low" | "medium" | "high";

/**
 * Building Type Archetype
 * Immutable definition of a building type for selection
 */
export interface BuildingTypeArchetype {
  id: string;
  name: string;
  description: string;
  category: BuildingTypeCategory;
  typicalStories: number | [number, number]; // Fixed or [min, max] range
  floorToFloorHeightFt: number;
  footprintBias: FootprintBias;
  roofForm: "flat";
  parkingBias: "low" | "medium" | "high" | "queue";
  yieldProfile: YieldProfile;
  riskProfile: RiskProfile;
  icon: string; // Lucide icon name
  color: string; // HSL color for accent
}

/**
 * Building Preview Result
 * Output from the preview generation algorithm
 */
export interface BuildingPreviewResult {
  footprint: GeoJSON.Polygon | null;
  heightFt: number;
  stories: number;
  gfa: number;
  far: number;
  coveragePct: number;
  warnings: string[];
  isValid: boolean;
}

/**
 * Preview Input
 * Input parameters for generating a building preview
 */
export interface PreviewInput {
  envelope: {
    buildableFootprint2d: GeoJSON.Polygon;
    heightCapFt: number;
    farCap: number;
    coverageCapPct: number;
    parcelSqft: number;
  };
  archetype: BuildingTypeArchetype;
  intensity: IntensityLevel;
  orientation: OrientationMode;
}

/**
 * Preview Metrics
 * Computed metrics for the building preview
 */
export interface PreviewMetrics {
  gfa: number;
  far: number;
  coveragePct: number;
}

/**
 * Preview Geometry State
 * State for storing ephemeral preview geometry
 */
export interface PreviewGeometryState {
  footprint: GeoJSON.Polygon | null;
  heightFt: number | null;
  stories: number | null;
  metrics: PreviewMetrics | null;
}
