/**
 * SiteIntel™ Design Mode - Real-Time Compliance Engine
 * 
 * Performs client-side compliance checks against regulatory envelope.
 * Target: <500ms per check cycle.
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

export interface ComplianceCheck {
  id: string;
  name: string;
  status: "PASS" | "WARN" | "FAIL";
  currentValue: number;
  limitValue: number;
  unit: string;
  message: string;
  violationGeometry?: GeoJSON.Geometry;
}

export interface ComplianceResult {
  overall: "PASS" | "WARN" | "FAIL";
  checks: ComplianceCheck[];
  violations: string[];
  checkedAt: string;
}

/**
 * Check if design geometry is fully contained within envelope
 */
function checkEnvelopeContainment(
  designGeometry: GeoJSON.Polygon,
  envelopeGeometry: GeoJSON.Polygon
): ComplianceCheck {
  try {
    const designFeature = turf.polygon(designGeometry.coordinates);
    const envelopeFeature = turf.polygon(envelopeGeometry.coordinates);
    
    const isContained = turf.booleanContains(envelopeFeature, designFeature);
    
    if (isContained) {
      return {
        id: "envelope_containment",
        name: "Envelope Containment",
        status: "PASS",
        currentValue: 100,
        limitValue: 100,
        unit: "pct",
        message: "Design is fully within regulatory envelope"
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
      message: `Design extends outside regulatory envelope (${100 - containedPct}% outside)`,
      violationGeometry: difference?.geometry
    };
  } catch (error) {
    console.error("Envelope containment check error:", error);
    return {
      id: "envelope_containment",
      name: "Envelope Containment",
      status: "WARN",
      currentValue: 0,
      limitValue: 100,
      unit: "pct",
      message: "Unable to verify envelope containment"
    };
  }
}

/**
 * Check FAR (Floor Area Ratio) compliance
 */
function checkFARLimit(
  designGeometry: GeoJSON.Polygon,
  floors: number,
  parcelGeometry: GeoJSON.Polygon,
  farCap: number
): ComplianceCheck {
  try {
    const designFeature = turf.polygon(designGeometry.coordinates);
    const parcelFeature = turf.polygon(parcelGeometry.coordinates);
    
    // Area in square meters, convert to square feet
    const footprintAreaSqM = turf.area(designFeature);
    const parcelAreaSqM = turf.area(parcelFeature);
    
    const footprintSqFt = footprintAreaSqM * 10.7639;
    const parcelSqFt = parcelAreaSqM * 10.7639;
    
    const gfa = footprintSqFt * floors;
    const farUsed = gfa / parcelSqFt;
    const farPct = (farUsed / farCap) * 100;

    if (farUsed <= farCap) {
      return {
        id: "far_limit",
        name: "Floor Area Ratio",
        status: farPct > 90 ? "WARN" : "PASS",
        currentValue: Math.round(farUsed * 100) / 100,
        limitValue: farCap,
        unit: "FAR",
        message: farPct > 90 
          ? `FAR at ${Math.round(farPct)}% of maximum (${farUsed.toFixed(2)} of ${farCap})`
          : `FAR compliant (${farUsed.toFixed(2)} of ${farCap} max)`
      };
    }

    return {
      id: "far_limit",
      name: "Floor Area Ratio",
      status: "FAIL",
      currentValue: Math.round(farUsed * 100) / 100,
      limitValue: farCap,
      unit: "FAR",
      message: `FAR exceeds maximum (${farUsed.toFixed(2)} vs ${farCap} allowed)`
    };
  } catch (error) {
    console.error("FAR check error:", error);
    return {
      id: "far_limit",
      name: "Floor Area Ratio",
      status: "WARN",
      currentValue: 0,
      limitValue: farCap,
      unit: "FAR",
      message: "Unable to calculate FAR"
    };
  }
}

/**
 * Check height limit compliance
 */
function checkHeightLimit(
  heightFt: number,
  heightCapFt: number
): ComplianceCheck {
  const heightPct = (heightFt / heightCapFt) * 100;

  if (heightFt <= heightCapFt) {
    return {
      id: "height_limit",
      name: "Height Limit",
      status: heightPct > 90 ? "WARN" : "PASS",
      currentValue: heightFt,
      limitValue: heightCapFt,
      unit: "ft",
      message: heightPct > 90
        ? `Height at ${Math.round(heightPct)}% of maximum (${heightFt}' of ${heightCapFt}')`
        : `Height compliant (${heightFt}' of ${heightCapFt}' max)`
    };
  }

  return {
    id: "height_limit",
    name: "Height Limit",
    status: "FAIL",
    currentValue: heightFt,
    limitValue: heightCapFt,
    unit: "ft",
    message: `Height exceeds maximum (${heightFt}' vs ${heightCapFt}' allowed)`
  };
}

/**
 * Check lot coverage compliance
 */
function checkCoverageLimit(
  designGeometry: GeoJSON.Polygon,
  parcelGeometry: GeoJSON.Polygon,
  coverageCapPct: number
): ComplianceCheck {
  try {
    const designFeature = turf.polygon(designGeometry.coordinates);
    const parcelFeature = turf.polygon(parcelGeometry.coordinates);
    
    const designArea = turf.area(designFeature);
    const parcelArea = turf.area(parcelFeature);
    
    const coveragePct = (designArea / parcelArea) * 100;
    const coverageRatio = coveragePct / coverageCapPct;

    if (coveragePct <= coverageCapPct) {
      return {
        id: "coverage_limit",
        name: "Lot Coverage",
        status: coverageRatio > 0.9 ? "WARN" : "PASS",
        currentValue: Math.round(coveragePct * 10) / 10,
        limitValue: coverageCapPct,
        unit: "pct",
        message: coverageRatio > 0.9
          ? `Coverage at ${Math.round(coverageRatio * 100)}% of maximum (${coveragePct.toFixed(1)}%)`
          : `Coverage compliant (${coveragePct.toFixed(1)}% of ${coverageCapPct}% max)`
      };
    }

    return {
      id: "coverage_limit",
      name: "Lot Coverage",
      status: "FAIL",
      currentValue: Math.round(coveragePct * 10) / 10,
      limitValue: coverageCapPct,
      unit: "pct",
      message: `Coverage exceeds maximum (${coveragePct.toFixed(1)}% vs ${coverageCapPct}% allowed)`
    };
  } catch (error) {
    console.error("Coverage check error:", error);
    return {
      id: "coverage_limit",
      name: "Lot Coverage",
      status: "WARN",
      currentValue: 0,
      limitValue: coverageCapPct,
      unit: "pct",
      message: "Unable to calculate coverage"
    };
  }
}

/**
 * Main compliance check function
 * Runs all checks and returns aggregated result
 */
export function checkCompliance(
  designGeometry: GeoJSON.Polygon,
  heightFt: number,
  floors: number,
  constraints: DesignConstraints
): ComplianceResult {
  const checks: ComplianceCheck[] = [];
  const violations: string[] = [];

  // Run all compliance checks
  const envelopeCheck = checkEnvelopeContainment(
    designGeometry,
    constraints.envelopeGeometry
  );
  checks.push(envelopeCheck);
  if (envelopeCheck.status === "FAIL") violations.push(envelopeCheck.message);

  const farCheck = checkFARLimit(
    designGeometry,
    floors,
    constraints.parcelGeometry,
    constraints.farCap
  );
  checks.push(farCheck);
  if (farCheck.status === "FAIL") violations.push(farCheck.message);

  const heightCheck = checkHeightLimit(heightFt, constraints.heightCapFt);
  checks.push(heightCheck);
  if (heightCheck.status === "FAIL") violations.push(heightCheck.message);

  const coverageCheck = checkCoverageLimit(
    designGeometry,
    constraints.parcelGeometry,
    constraints.coverageCapPct
  );
  checks.push(coverageCheck);
  if (coverageCheck.status === "FAIL") violations.push(coverageCheck.message);

  // Determine overall status
  let overall: "PASS" | "WARN" | "FAIL" = "PASS";
  
  if (checks.some(c => c.status === "FAIL")) {
    overall = "FAIL";
  } else if (checks.some(c => c.status === "WARN")) {
    overall = "WARN";
  }

  return {
    overall,
    checks,
    violations,
    checkedAt: new Date().toISOString()
  };
}

/**
 * Quick validation check - returns true if design is valid
 */
export function isDesignValid(
  designGeometry: GeoJSON.Polygon,
  heightFt: number,
  floors: number,
  constraints: DesignConstraints
): boolean {
  const result = checkCompliance(designGeometry, heightFt, floors, constraints);
  return result.overall !== "FAIL";
}
