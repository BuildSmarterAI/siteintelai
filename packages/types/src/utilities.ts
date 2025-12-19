/**
 * Canonical Utility Infrastructure Types
 * Per PRD: Utility Infrastructure Map Layers (Water, Sewer, Stormwater)
 * 
 * All utility layers MUST be normalized to this schema for frontend consumption.
 */

// ============================================================================
// Core Enums
// ============================================================================

export type UtilityType = 'water' | 'sewer' | 'storm';

export type FeatureType = 
  | 'main'           // Water/sewer gravity main
  | 'force_main'     // Pressurized sewer main (tap prohibited)
  | 'trunk'          // Stormwater trunk line
  | 'manhole'        // Access point
  | 'inlet'          // Stormwater inlet
  | 'lift_station'   // Pump station
  | 'valve'          // Water valve
  | 'cleanout'       // Sewer cleanout
  | 'outfall'        // Stormwater outfall
  | 'pump_station';  // Water pump station

export type UtilityStatus = 'active' | 'abandoned' | 'unknown';

export type MaterialType = 
  | 'PVC' 
  | 'DIP'      // Ductile Iron Pipe
  | 'CMP'      // Corrugated Metal Pipe
  | 'HDPE'     // High-density polyethylene
  | 'RCP'      // Reinforced Concrete Pipe
  | 'VCP'      // Vitrified Clay Pipe
  | 'STEEL'
  | 'CAST_IRON'
  | 'UNKNOWN';

export type ServiceStatus = 'SERVED' | 'NEAR' | 'NOT SERVED' | 'UNKNOWN';
export type StormServiceStatus = 'ON-SITE' | 'CONNECTION REQUIRED';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

// ============================================================================
// Canonical Feature Schema (PRD §4)
// ============================================================================

export interface UtilityFeature {
  id: string;
  utility_type: UtilityType;
  feature_type: FeatureType;
  geometry: GeoJSON.LineString | GeoJSON.Point;
  diameter_in: number | null;
  material: MaterialType | null;
  status: UtilityStatus;
  install_year: number | null;
  owner: string | null;
  source: string | null;
  confidence_score: number; // 0.0-1.0
  last_updated: string; // ISO date
}

// ============================================================================
// Line Feature (Water/Sewer/Storm Mains)
// ============================================================================

export interface UtilityLineFeature extends UtilityFeature {
  geometry: GeoJSON.LineString;
  feature_type: 'main' | 'force_main' | 'trunk';
  length_ft?: number;
  upstream_id?: string;
  downstream_id?: string;
}

// ============================================================================
// Point Feature (Manholes, Inlets, Lift Stations)
// ============================================================================

export interface UtilityPointFeature extends UtilityFeature {
  geometry: GeoJSON.Point;
  feature_type: 'manhole' | 'inlet' | 'lift_station' | 'valve' | 'cleanout' | 'outfall' | 'pump_station';
  rim_elevation?: number;
  invert_elevation?: number;
  condition?: string;
  capacity?: number; // For lift stations
  service_area?: string; // For lift stations
}

// ============================================================================
// Service Status Assessment (PRD §8.2)
// ============================================================================

export interface UtilityServiceAssessment {
  water: ServiceStatus;
  sewer: ServiceStatus;
  storm: StormServiceStatus;
  water_distance_ft: number | null;
  sewer_distance_ft: number | null;
  storm_on_site: boolean;
  confidence: ConfidenceLevel;
}

// ============================================================================
// Distance Buffer Configuration (PRD §8.1)
// ============================================================================

export interface DistanceBuffer {
  distance_ft: number;
  status: ServiceStatus;
  color: string;
  opacity: number;
}

export const UTILITY_DISTANCE_BUFFERS: DistanceBuffer[] = [
  { distance_ft: 100, status: 'SERVED', color: '#10B981', opacity: 0.15 },      // Green
  { distance_ft: 300, status: 'NEAR', color: '#F59E0B', opacity: 0.10 },        // Yellow
  { distance_ft: 600, status: 'NOT SERVED', color: '#EF4444', opacity: 0.05 },  // Red
];

// ============================================================================
// Confidence Thresholds (PRD §9.1)
// ============================================================================

export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score > 0.8) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

export function getConfidenceLabel(score: number): string {
  const level = getConfidenceLevel(score);
  switch (level) {
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
  }
}

export function requiresFieldVerification(score: number): boolean {
  return score < 0.5;
}

// ============================================================================
// Service Status Logic (PRD §8.2)
// ============================================================================

export function getServiceStatus(distanceFt: number | null): ServiceStatus {
  if (distanceFt === null || distanceFt === undefined) return 'UNKNOWN';
  if (distanceFt <= 100) return 'SERVED';
  if (distanceFt <= 300) return 'NEAR';
  return 'NOT SERVED';
}

export function getServiceStatusColor(status: ServiceStatus): string {
  switch (status) {
    case 'SERVED': return '#10B981';      // Green
    case 'NEAR': return '#F59E0B';         // Yellow/Amber
    case 'NOT SERVED': return '#EF4444';   // Red
    case 'UNKNOWN': return '#6B7280';      // Gray
  }
}

export function getStormServiceStatusColor(status: StormServiceStatus): string {
  switch (status) {
    case 'ON-SITE': return '#10B981';           // Green
    case 'CONNECTION REQUIRED': return '#F59E0B'; // Yellow
  }
}

// ============================================================================
// Popup Data Structures (PRD §11)
// ============================================================================

export interface UtilityPopupData {
  title: string;
  utility_type: UtilityType;
  feature_type: FeatureType;
  diameter_in: number | null;
  material: string | null;
  owner: string | null;
  install_year: number | null;
  status: UtilityStatus;
  confidence: ConfidenceLevel;
  confidence_score: number;
  is_force_main: boolean;
  warning_message?: string;
}

export function createPopupData(feature: UtilityFeature): UtilityPopupData {
  const isForceMain = feature.feature_type === 'force_main';
  
  return {
    title: getFeatureTitle(feature),
    utility_type: feature.utility_type,
    feature_type: feature.feature_type,
    diameter_in: feature.diameter_in,
    material: feature.material,
    owner: feature.owner,
    install_year: feature.install_year,
    status: feature.status,
    confidence: getConfidenceLevel(feature.confidence_score),
    confidence_score: feature.confidence_score,
    is_force_main: isForceMain,
    warning_message: isForceMain 
      ? '⚠ Force main – direct connections typically prohibited' 
      : undefined,
  };
}

function getFeatureTitle(feature: UtilityFeature): string {
  const typeLabels: Record<FeatureType, string> = {
    main: 'Main',
    force_main: 'Force Main',
    trunk: 'Storm Trunk',
    manhole: 'Manhole',
    inlet: 'Storm Inlet',
    lift_station: 'Lift Station',
    valve: 'Valve',
    cleanout: 'Cleanout',
    outfall: 'Outfall',
    pump_station: 'Pump Station',
  };
  
  const utilityLabels: Record<UtilityType, string> = {
    water: 'Water',
    sewer: 'Sewer',
    storm: 'Storm',
  };
  
  return `${utilityLabels[feature.utility_type]} ${typeLabels[feature.feature_type]}`;
}
