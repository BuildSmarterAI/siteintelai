/**
 * SiteIntel™ Design Mode - Metrics Engine
 * 
 * Calculates design metrics in real-time.
 * Target: <100ms per calculation.
 */

import * as turf from "@turf/turf";

export interface DesignConstraints {
  envelopeGeometry: GeoJSON.Polygon;
  parcelGeometry: GeoJSON.Polygon;
  farCap: number;
  heightCapFt: number;
  coverageCapPct: number;
  parcelAcres: number;
}

export interface DesignMetrics {
  grossFloorAreaSf: number;
  footprintSf: number;
  farUsed: number;
  farUsedPct: number;
  coveragePct: number;
  envelopeUtilizationPct: number;
  heightUsedPct: number;
  violationCount: number;
  efficiencyScore: number;
}

/**
 * Calculate all design metrics
 */
export function calculateMetrics(
  footprintGeometry: GeoJSON.Polygon | null,
  floors: number,
  heightFt: number,
  constraints: DesignConstraints,
  violationCount: number = 0
): DesignMetrics {
  // Default empty metrics
  if (!footprintGeometry) {
    return {
      grossFloorAreaSf: 0,
      footprintSf: 0,
      farUsed: 0,
      farUsedPct: 0,
      coveragePct: 0,
      envelopeUtilizationPct: 0,
      heightUsedPct: 0,
      violationCount: 0,
      efficiencyScore: 0
    };
  }

  try {
    const footprintFeature = turf.polygon(footprintGeometry.coordinates);
    const parcelFeature = turf.polygon(constraints.parcelGeometry.coordinates);
    const envelopeFeature = turf.polygon(constraints.envelopeGeometry.coordinates);

    // Calculate areas in square meters, then convert to square feet
    const footprintAreaSqM = turf.area(footprintFeature);
    const parcelAreaSqM = turf.area(parcelFeature);
    const envelopeAreaSqM = turf.area(envelopeFeature);

    const footprintSf = Math.round(footprintAreaSqM * 10.7639);
    const parcelSf = parcelAreaSqM * 10.7639;
    const envelopeSf = envelopeAreaSqM * 10.7639;

    // Gross Floor Area
    const grossFloorAreaSf = Math.round(footprintSf * floors);

    // FAR calculations
    const farUsed = grossFloorAreaSf / parcelSf;
    const farUsedPct = Math.round((farUsed / constraints.farCap) * 100);

    // Coverage percentage
    const coveragePct = Math.round((footprintSf / parcelSf) * 1000) / 10;

    // Envelope utilization
    const envelopeUtilizationPct = Math.round((footprintSf / envelopeSf) * 100);

    // Height utilization
    const heightUsedPct = Math.round((heightFt / constraints.heightCapFt) * 100);

    // Efficiency score (0-100) - how well the design uses available capacity
    // Weighted average of utilization metrics, penalized by violations
    const rawEfficiency = (
      (farUsedPct * 0.4) +
      (envelopeUtilizationPct * 0.3) +
      (heightUsedPct * 0.2) +
      (Math.min(coveragePct / constraints.coverageCapPct * 100, 100) * 0.1)
    );
    const efficiencyScore = Math.max(0, Math.round(rawEfficiency - (violationCount * 25)));

    return {
      grossFloorAreaSf,
      footprintSf,
      farUsed: Math.round(farUsed * 100) / 100,
      farUsedPct: Math.min(farUsedPct, 999), // Cap display at 999%
      coveragePct,
      envelopeUtilizationPct: Math.min(envelopeUtilizationPct, 100),
      heightUsedPct: Math.min(heightUsedPct, 999),
      violationCount,
      efficiencyScore
    };
  } catch (error) {
    console.error("Metrics calculation error:", error);
    return {
      grossFloorAreaSf: 0,
      footprintSf: 0,
      farUsed: 0,
      farUsedPct: 0,
      coveragePct: 0,
      envelopeUtilizationPct: 0,
      heightUsedPct: 0,
      violationCount,
      efficiencyScore: 0
    };
  }
}

/**
 * Format number with thousands separator
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

/**
 * Format square footage display
 */
export function formatSqFt(sqft: number): string {
  if (sqft >= 1000000) {
    return `${(sqft / 1000000).toFixed(2)}M SF`;
  }
  if (sqft >= 1000) {
    return `${(sqft / 1000).toFixed(1)}K SF`;
  }
  return `${sqft} SF`;
}

/**
 * Calculate potential GFA based on FAR cap
 */
export function calculateMaxGFA(
  parcelAcres: number,
  farCap: number
): number {
  const parcelSf = parcelAcres * 43560;
  return Math.round(parcelSf * farCap);
}

/**
 * Calculate remaining buildable capacity
 */
export function calculateRemainingCapacity(
  currentGfa: number,
  parcelAcres: number,
  farCap: number
): number {
  const maxGfa = calculateMaxGFA(parcelAcres, farCap);
  return Math.max(0, maxGfa - currentGfa);
}

/**
 * Estimate floors needed to reach target GFA
 */
export function estimateFloorsForGFA(
  targetGfa: number,
  footprintSf: number
): number {
  if (footprintSf <= 0) return 1;
  return Math.ceil(targetGfa / footprintSf);
}

/**
 * Calculate buildable envelope area in square feet
 */
export function calculateEnvelopeArea(
  envelopeGeometry: GeoJSON.Polygon
): number {
  try {
    const feature = turf.polygon(envelopeGeometry.coordinates);
    const areaSqM = turf.area(feature);
    return Math.round(areaSqM * 10.7639);
  } catch {
    return 0;
  }
}
