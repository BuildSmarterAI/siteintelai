/**
 * SiteIntel™ Design Mode - Unified Compliance Engine
 * 
 * SINGLE SOURCE OF TRUTH for all compliance calculations.
 * Used by: ComplianceDock, Wizard steps, GenerateStep, templateScoring
 * 
 * Target: <500ms per check cycle.
 */

import * as turf from "@turf/turf";

// ============================================================================
// TYPES
// ============================================================================

export interface ComplianceInput {
  /** The building footprint polygon (null if not yet drawn) */
  designGeometry: GeoJSON.Polygon | null;
  /** Building height in feet */
  heightFt: number;
  /** Number of floors */
  floors: number;
  /** Gross floor area in square feet (optional - computed if not provided) */
  gfaSqft?: number;
  /** Regulatory envelope constraints */
  envelope: EnvelopeConstraints;
}

export interface EnvelopeConstraints {
  /** Parcel boundary polygon */
  parcelGeometry: GeoJSON.Polygon;
  /** Buildable area polygon (after setbacks) */
  buildableGeometry: GeoJSON.Polygon;
  /** Maximum FAR allowed */
  farCap: number;
  /** Maximum height in feet */
  heightCapFt: number;
  /** Maximum lot coverage percentage */
  coverageCapPct: number;
  /** Parcel area in square feet */
  parcelSqft: number;
}

export type ComplianceStatus = "PASS" | "WARN" | "FAIL" | "PENDING";

export interface ComplianceCheck {
  id: string;
  name: string;
  status: ComplianceStatus;
  /** Current value (e.g., current FAR) */
  currentValue: number;
  /** Limit value (e.g., FAR cap) */
  limitValue: number;
  /** Unit for display (e.g., "FAR", "ft", "pct") */
  unit: string;
  /** Human-readable message */
  message: string;
  /** Percentage of limit used (0-100+) */
  utilizationPct: number;
  /** Geometry showing violation area (if applicable) */
  violationGeometry?: GeoJSON.Geometry;
}

export interface ComplianceResult {
  /** Overall compliance status */
  overall: ComplianceStatus;
  /** Individual check results */
  checks: ComplianceCheck[];
  /** List of violation messages */
  violations: string[];
  /** List of warning messages */
  warnings: string[];
  /** ISO timestamp when checked */
  checkedAt: string;
  /** Hash of inputs for cache invalidation */
  inputHash: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Threshold for WARN status (percentage of limit) */
const WARN_THRESHOLD_PCT = 90;

/** Square meters to square feet conversion */
const SQM_TO_SQFT = 10.7639;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a simple hash of compliance inputs for cache invalidation
 */
function hashInputs(input: ComplianceInput): string {
  const key = JSON.stringify({
    geom: input.designGeometry?.coordinates?.[0]?.slice(0, 2),
    h: input.heightFt,
    f: input.floors,
    far: input.envelope.farCap,
    hCap: input.envelope.heightCapFt,
    cov: input.envelope.coverageCapPct,
  });
  // Simple hash
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Calculate area of a polygon in square feet
 */
function calculateAreaSqft(geometry: GeoJSON.Polygon): number {
  try {
    const feature = turf.polygon(geometry.coordinates);
    const areaSqm = turf.area(feature);
    return areaSqm * SQM_TO_SQFT;
  } catch (error) {
    console.error("[ComplianceEngine] Area calculation error:", error);
    return 0;
  }
}

// ============================================================================
// INDIVIDUAL CHECK FUNCTIONS
// ============================================================================

/**
 * Check if design geometry is fully contained within buildable envelope
 */
function checkEnvelopeContainment(
  designGeometry: GeoJSON.Polygon,
  buildableGeometry: GeoJSON.Polygon
): ComplianceCheck {
  try {
    const designFeature = turf.polygon(designGeometry.coordinates);
    const envelopeFeature = turf.polygon(buildableGeometry.coordinates);
    
    const isContained = turf.booleanContains(envelopeFeature, designFeature);
    
    if (isContained) {
      return {
        id: "envelope_containment",
        name: "Envelope Containment",
        status: "PASS",
        currentValue: 100,
        limitValue: 100,
        unit: "pct",
        utilizationPct: 100,
        message: "Design is fully within buildable envelope"
      };
    }

    // Calculate how much is outside
    const difference = turf.difference(
      turf.featureCollection([designFeature, envelopeFeature])
    );
    
    const outsideArea = difference ? turf.area(difference) : 0;
    const designArea = turf.area(designFeature);
    const containedPct = Math.round(((designArea - outsideArea) / designArea) * 100);

    return {
      id: "envelope_containment",
      name: "Envelope Containment",
      status: "FAIL",
      currentValue: containedPct,
      limitValue: 100,
      unit: "pct",
      utilizationPct: containedPct,
      message: `Design extends outside buildable envelope (${100 - containedPct}% outside)`,
      violationGeometry: difference?.geometry
    };
  } catch (error) {
    console.error("[ComplianceEngine] Envelope containment check error:", error);
    return {
      id: "envelope_containment",
      name: "Envelope Containment",
      status: "WARN",
      currentValue: 0,
      limitValue: 100,
      unit: "pct",
      utilizationPct: 0,
      message: "Unable to verify envelope containment"
    };
  }
}

/**
 * Check FAR (Floor Area Ratio) compliance
 */
function checkFARLimit(
  footprintSqft: number,
  floors: number,
  parcelSqft: number,
  farCap: number
): ComplianceCheck {
  const gfa = footprintSqft * floors;
  const farUsed = parcelSqft > 0 ? gfa / parcelSqft : 0;
  const utilizationPct = farCap > 0 ? (farUsed / farCap) * 100 : 0;

  let status: ComplianceStatus = "PASS";
  let message: string;

  if (farUsed > farCap) {
    status = "FAIL";
    message = `FAR exceeds maximum (${farUsed.toFixed(2)} vs ${farCap} allowed)`;
  } else if (utilizationPct > WARN_THRESHOLD_PCT) {
    status = "WARN";
    message = `FAR at ${Math.round(utilizationPct)}% of maximum (${farUsed.toFixed(2)} of ${farCap})`;
  } else {
    message = `FAR compliant (${farUsed.toFixed(2)} of ${farCap} max)`;
  }

  return {
    id: "far_limit",
    name: "Floor Area Ratio",
    status,
    currentValue: Math.round(farUsed * 100) / 100,
    limitValue: farCap,
    unit: "FAR",
    utilizationPct: Math.round(utilizationPct),
    message
  };
}

/**
 * Check height limit compliance
 */
function checkHeightLimit(
  heightFt: number,
  heightCapFt: number
): ComplianceCheck {
  const utilizationPct = heightCapFt > 0 ? (heightFt / heightCapFt) * 100 : 0;

  let status: ComplianceStatus = "PASS";
  let message: string;

  if (heightFt > heightCapFt) {
    status = "FAIL";
    message = `Height exceeds maximum (${heightFt}' vs ${heightCapFt}' allowed)`;
  } else if (utilizationPct > WARN_THRESHOLD_PCT) {
    status = "WARN";
    message = `Height at ${Math.round(utilizationPct)}% of maximum (${heightFt}' of ${heightCapFt}')`;
  } else {
    message = `Height compliant (${heightFt}' of ${heightCapFt}' max)`;
  }

  return {
    id: "height_limit",
    name: "Height Limit",
    status,
    currentValue: heightFt,
    limitValue: heightCapFt,
    unit: "ft",
    utilizationPct: Math.round(utilizationPct),
    message
  };
}

/**
 * Check lot coverage compliance
 */
function checkCoverageLimit(
  footprintSqft: number,
  parcelSqft: number,
  coverageCapPct: number
): ComplianceCheck {
  const coveragePct = parcelSqft > 0 ? (footprintSqft / parcelSqft) * 100 : 0;
  const utilizationPct = coverageCapPct > 0 ? (coveragePct / coverageCapPct) * 100 : 0;

  let status: ComplianceStatus = "PASS";
  let message: string;

  if (coveragePct > coverageCapPct) {
    status = "FAIL";
    message = `Coverage exceeds maximum (${coveragePct.toFixed(1)}% vs ${coverageCapPct}% allowed)`;
  } else if (utilizationPct > WARN_THRESHOLD_PCT) {
    status = "WARN";
    message = `Coverage at ${Math.round(utilizationPct)}% of maximum (${coveragePct.toFixed(1)}%)`;
  } else {
    message = `Coverage compliant (${coveragePct.toFixed(1)}% of ${coverageCapPct}% max)`;
  }

  return {
    id: "coverage_limit",
    name: "Lot Coverage",
    status,
    currentValue: Math.round(coveragePct * 10) / 10,
    limitValue: coverageCapPct,
    unit: "pct",
    utilizationPct: Math.round(utilizationPct),
    message
  };
}

// ============================================================================
// MAIN COMPLIANCE FUNCTIONS
// ============================================================================

/**
 * Compute compliance for a design against an envelope.
 * This is the SINGLE SOURCE OF TRUTH for all compliance calculations.
 */
export function computeCompliance(input: ComplianceInput): ComplianceResult {
  const { designGeometry, heightFt, floors, envelope } = input;
  
  // If no design geometry, return pending status
  if (!designGeometry) {
    return {
      overall: "PENDING",
      checks: [],
      violations: [],
      warnings: [],
      checkedAt: new Date().toISOString(),
      inputHash: "no-geometry"
    };
  }

  const checks: ComplianceCheck[] = [];
  const violations: string[] = [];
  const warnings: string[] = [];

  // Calculate footprint area
  const footprintSqft = calculateAreaSqft(designGeometry);

  // 1. Envelope Containment Check
  const envelopeCheck = checkEnvelopeContainment(
    designGeometry,
    envelope.buildableGeometry
  );
  checks.push(envelopeCheck);
  if (envelopeCheck.status === "FAIL") violations.push(envelopeCheck.message);
  if (envelopeCheck.status === "WARN") warnings.push(envelopeCheck.message);

  // 2. FAR Check
  const farCheck = checkFARLimit(
    footprintSqft,
    floors,
    envelope.parcelSqft,
    envelope.farCap
  );
  checks.push(farCheck);
  if (farCheck.status === "FAIL") violations.push(farCheck.message);
  if (farCheck.status === "WARN") warnings.push(farCheck.message);

  // 3. Height Check
  const heightCheck = checkHeightLimit(heightFt, envelope.heightCapFt);
  checks.push(heightCheck);
  if (heightCheck.status === "FAIL") violations.push(heightCheck.message);
  if (heightCheck.status === "WARN") warnings.push(heightCheck.message);

  // 4. Coverage Check
  const coverageCheck = checkCoverageLimit(
    footprintSqft,
    envelope.parcelSqft,
    envelope.coverageCapPct
  );
  checks.push(coverageCheck);
  if (coverageCheck.status === "FAIL") violations.push(coverageCheck.message);
  if (coverageCheck.status === "WARN") warnings.push(coverageCheck.message);

  // Determine overall status
  let overall: ComplianceStatus = "PASS";
  if (checks.some(c => c.status === "FAIL")) {
    overall = "FAIL";
  } else if (checks.some(c => c.status === "WARN")) {
    overall = "WARN";
  }

  return {
    overall,
    checks,
    violations,
    warnings,
    checkedAt: new Date().toISOString(),
    inputHash: hashInputs(input)
  };
}

/**
 * Quick check if design passes compliance (no FAIL status)
 */
export function isDesignCompliant(input: ComplianceInput): boolean {
  const result = computeCompliance(input);
  return result.overall !== "FAIL";
}

/**
 * Check compliance for template scoring (simplified - no geometry needed)
 * Used by templateScoring.ts to score templates without full geometry
 */
export function checkTemplateCompliance(params: {
  estimatedGfa: number;
  estimatedHeight: number;
  estimatedCoverage: number;
  envelope: {
    parcelSqft: number;
    farCap: number;
    heightCapFt: number;
    coverageCapPct: number;
  };
}): { status: ComplianceStatus; penalty: number } {
  const { estimatedGfa, estimatedHeight, estimatedCoverage, envelope } = params;
  
  let penalty = 0;
  let status: ComplianceStatus = "PASS";

  // FAR check
  const far = estimatedGfa / envelope.parcelSqft;
  if (far > envelope.farCap) {
    penalty += 50;
    status = "FAIL";
  } else if (far > envelope.farCap * 0.9) {
    penalty += 10;
    if (status === "PASS") status = "WARN";
  }

  // Height check
  if (estimatedHeight > envelope.heightCapFt) {
    penalty += 50;
    status = "FAIL";
  } else if (estimatedHeight > envelope.heightCapFt * 0.9) {
    penalty += 10;
    if (status === "PASS") status = "WARN";
  }

  // Coverage check
  if (estimatedCoverage > envelope.coverageCapPct) {
    penalty += 50;
    status = "FAIL";
  } else if (estimatedCoverage > envelope.coverageCapPct * 0.9) {
    penalty += 10;
    if (status === "PASS") status = "WARN";
  }

  return { status, penalty };
}

/**
 * Create EnvelopeConstraints from store envelope data
 */
export function createEnvelopeConstraints(envelope: {
  parcelGeometry: GeoJSON.Polygon;
  buildableFootprint2d: GeoJSON.Polygon;
  farCap: number;
  heightCapFt: number;
  coverageCapPct: number;
}): EnvelopeConstraints {
  const parcelSqft = calculateAreaSqft(envelope.parcelGeometry);
  
  return {
    parcelGeometry: envelope.parcelGeometry,
    buildableGeometry: envelope.buildableFootprint2d,
    farCap: envelope.farCap,
    heightCapFt: envelope.heightCapFt,
    coverageCapPct: envelope.coverageCapPct,
    parcelSqft
  };
}

/**
 * Get the worst status from a list of checks
 */
export function getWorstStatus(checks: ComplianceCheck[]): ComplianceStatus {
  if (checks.some(c => c.status === "FAIL")) return "FAIL";
  if (checks.some(c => c.status === "WARN")) return "WARN";
  if (checks.some(c => c.status === "PENDING")) return "PENDING";
  return "PASS";
}

// Re-export types for backward compatibility
export type { ComplianceResult as DesignComplianceResult };
