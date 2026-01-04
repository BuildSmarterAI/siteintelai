/**
 * Template Scoring Algorithm
 * Ranks templates based on site envelope and program targets
 */

import type {
  DesignTemplate,
  RiskTolerance,
  TemplateScore,
  ComplianceStatus,
  EnvelopeSummary,
  ProgramBucket,
} from '@/types/wizard';

// Scoring weights
const WEIGHTS = {
  gfaFit: 0.40,
  utilization: 0.30,
  compliance: 0.30,
};

/**
 * Score a single template against envelope and targets
 */
export function scoreTemplate(
  template: DesignTemplate,
  envelope: EnvelopeSummary,
  bucket: ProgramBucket
): TemplateScore {
  const targetGfa = bucket.targetGfa;
  const riskTolerance = bucket.riskTolerance;
  
  // Calculate template's estimated metrics
  const footprintSqft = template.footprint_area_target_sqft || 20000;
  const templateGfa = footprintSqft * template.default_floors;
  const templateHeight = template.default_floors * template.floor_to_floor_ft;
  const coveragePct = (footprintSqft / envelope.parcelSqft) * 100;
  const far = templateGfa / envelope.parcelSqft;
  
  // 1. GFA Fit Score (how close to target GFA)
  const gfaDelta = Math.abs(templateGfa - targetGfa);
  const gfaFitRaw = Math.max(0, 100 - (gfaDelta / Math.max(targetGfa, 1)) * 100);
  
  // 2. Utilization Score (prefer optimal range based on risk tolerance)
  const utilizationPct = (templateGfa / envelope.maxGfa) * 100;
  
  let utilizationScore: number;
  if (riskTolerance === 'safe') {
    // Prefer 50-70%
    utilizationScore = utilizationPct >= 50 && utilizationPct <= 70 
      ? 100 
      : 100 - Math.abs(60 - utilizationPct) * 2;
  } else if (riskTolerance === 'aggressive') {
    // Prefer 85-100%
    utilizationScore = utilizationPct >= 85 && utilizationPct <= 100
      ? 100
      : 100 - Math.abs(92.5 - utilizationPct) * 1.5;
  } else {
    // Balanced: prefer 70-90%
    utilizationScore = utilizationPct >= 70 && utilizationPct <= 90
      ? 100
      : 100 - Math.abs(80 - utilizationPct) * 2;
  }
  utilizationScore = Math.max(0, Math.min(100, utilizationScore));
  
  // 3. Compliance Check
  let compliancePenalty = 0;
  let complianceStatus: ComplianceStatus = 'PASS';
  
  // Height check
  if (templateHeight > envelope.heightCapFt) {
    compliancePenalty += 50;
    complianceStatus = 'FAIL';
  } else if (templateHeight > envelope.heightCapFt * 0.9) {
    compliancePenalty += 10;
    if (complianceStatus === 'PASS') complianceStatus = 'WARN';
  }
  
  // Coverage check
  if (coveragePct > envelope.coverageCapPct) {
    compliancePenalty += 50;
    complianceStatus = 'FAIL';
  } else if (coveragePct > envelope.coverageCapPct * 0.9) {
    compliancePenalty += 10;
    if (complianceStatus === 'PASS') complianceStatus = 'WARN';
  }
  
  // FAR check
  if (far > envelope.farCap) {
    compliancePenalty += 50;
    complianceStatus = 'FAIL';
  } else if (far > envelope.farCap * 0.9) {
    compliancePenalty += 10;
    if (complianceStatus === 'PASS') complianceStatus = 'WARN';
  }
  
  // 4. Risk Adjustment
  let riskAdjustment = 0;
  if (riskTolerance === 'safe' && complianceStatus === 'PASS' && utilizationPct < 75) {
    riskAdjustment = 10; // Bonus for conservative
  }
  if (riskTolerance === 'aggressive' && complianceStatus === 'PASS' && utilizationPct > 85) {
    riskAdjustment = 15; // Bonus for maximizing
  }
  
  // Final Score
  const finalScore = Math.max(0, Math.min(100,
    (gfaFitRaw * WEIGHTS.gfaFit) +
    (utilizationScore * WEIGHTS.utilization) +
    ((100 - compliancePenalty) * WEIGHTS.compliance) +
    riskAdjustment
  ));

  return {
    templateId: template.id,
    templateKey: template.template_key,
    fitScore: Math.round(gfaFitRaw),
    utilizationScore: Math.round(utilizationScore),
    compliancePenalty,
    riskAdjustment,
    finalScore: Math.round(finalScore),
    complianceStatus,
    estimatedGfa: templateGfa,
    estimatedFar: Math.round(far * 100) / 100,
    estimatedHeight: templateHeight,
    estimatedCoverage: Math.round(coveragePct),
  };
}

/**
 * Rank all templates and return recommended + more options
 */
export function rankTemplates(
  templates: DesignTemplate[],
  envelope: EnvelopeSummary,
  bucket: ProgramBucket
): { recommended: TemplateScore[]; moreOptions: TemplateScore[] } {
  // Filter by use type
  const filtered = templates.filter(t => t.use_type === bucket.useType);
  
  // Score all templates
  const scored = filtered.map(t => scoreTemplate(t, envelope, bucket));
  
  // Sort by finalScore descending
  scored.sort((a, b) => b.finalScore - a.finalScore);
  
  // Top 3 as recommended (preferring PASS/WARN over FAIL)
  const passing = scored.filter(s => s.complianceStatus !== 'FAIL');
  const failing = scored.filter(s => s.complianceStatus === 'FAIL');
  
  const recommended = passing.slice(0, 3);
  // If we don't have 3 passing, add from failing (but they'll show as FAIL)
  if (recommended.length < 3) {
    recommended.push(...failing.slice(0, 3 - recommended.length));
  }
  
  const moreOptions = [...passing.slice(3), ...failing.slice(recommended.length - passing.length)].slice(0, 12);
  
  return { recommended, moreOptions };
}

/**
 * Create envelope summary from design store envelope
 */
export function createEnvelopeSummary(envelope: any): EnvelopeSummary | null {
  if (!envelope) return null;
  
  // Try to calculate parcel acres from geometry if not directly available
  let parcelAcres = 1;
  if (envelope.parcelGeometry) {
    try {
      const turf = require('@turf/turf');
      const geom = envelope.parcelGeometry;
      
      // Handle both GeoJSON Geometry and Feature formats
      let feature;
      if (geom.type === 'Feature') {
        feature = geom;
      } else if (geom.type === 'Polygon' && geom.coordinates) {
        feature = turf.polygon(geom.coordinates);
      } else if (geom.type === 'MultiPolygon' && geom.coordinates) {
        feature = turf.multiPolygon(geom.coordinates);
      } else {
        console.warn('[EnvelopeSummary] Unknown geometry type:', geom.type);
        throw new Error('Unknown geometry type');
      }
      
      const area = turf.area(feature);
      parcelAcres = area / 4046.86; // sqm to acres
    } catch (err) {
      console.warn('[EnvelopeSummary] Failed to calculate parcel area from geometry:', err, 
        'Geometry preview:', JSON.stringify(envelope.parcelGeometry).slice(0, 200));
      parcelAcres = 1;
    }
  } else {
    console.warn('[EnvelopeSummary] No parcel geometry provided, defaulting to 1 acre');
  }
  
  const parcelSqft = parcelAcres * 43560;
  const farCap = envelope.farCap || 0.75;
  const heightCapFt = envelope.heightCapFt || 55;
  const coverageCapPct = envelope.coverageCapPct || 85;
  
  // Calculate buildable area from buildableFootprint2d if available
  let buildableSqft = parcelSqft * 0.7;
  if (envelope.buildableFootprint2d) {
    try {
      const turf = require('@turf/turf');
      const geom = envelope.buildableFootprint2d;
      
      // Handle both GeoJSON Geometry and Feature formats
      let feature;
      if (geom.type === 'Feature') {
        feature = geom;
      } else if (geom.type === 'Polygon' && geom.coordinates) {
        feature = turf.polygon(geom.coordinates);
      } else if (geom.type === 'MultiPolygon' && geom.coordinates) {
        feature = turf.multiPolygon(geom.coordinates);
      } else {
        throw new Error('Unknown geometry type');
      }
      
      const area = turf.area(feature);
      buildableSqft = area * 10.7639; // sqm to sqft
    } catch {
      buildableSqft = parcelSqft * (coverageCapPct / 100);
    }
  }
  
  const maxGfa = farCap * parcelSqft;
  
  // Envelope quality - default to medium for now
  const envelopeQuality: 'high' | 'medium' | 'low' = 'medium';
  
  return {
    parcelAcres,
    parcelSqft,
    buildableSqft,
    farCap,
    heightCapFt,
    coverageCapPct,
    maxGfa,
    envelopeQuality,
  };
}
