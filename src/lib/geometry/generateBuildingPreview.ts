/**
 * Building Preview Generation
 * Deterministic algorithm for generating preview geometry from archetype + envelope
 */

import * as turf from '@turf/turf';
import type { Feature, Polygon } from 'geojson';
import type { 
  IntensityLevel, 
  OrientationMode, 
  BuildingPreviewResult,
  PreviewInput,
  FootprintBias,
} from '@/types/buildingTypes';

/**
 * Intensity multipliers for footprint sizing
 */
const INTENSITY_MULTIPLIERS: Record<IntensityLevel, number> = {
  conservative: 0.70,
  optimal: 0.85,
  aggressive: 0.95,
};

/**
 * Generate a building preview from the envelope and archetype
 * This is a deterministic algorithm that runs client-side
 */
export function generateBuildingPreview(input: PreviewInput): BuildingPreviewResult {
  const { envelope, archetype, intensity, orientation } = input;
  const warnings: string[] = [];

  try {
    // Step 1: Calculate buildable area from envelope
    const buildablePolygon = turf.polygon(envelope.buildableFootprint2d.coordinates);
    const buildableAreaSqm = turf.area(buildablePolygon);
    const buildableSqft = buildableAreaSqm * 10.7639; // Convert m² to ft²

    // Step 2: Get intensity multiplier
    const intensityFactor = INTENSITY_MULTIPLIERS[intensity];

    // Step 3: Calculate max footprint from coverage cap
    const maxFootprintFromCoverage = (envelope.coverageCapPct / 100) * envelope.parcelSqft;

    // Step 4: Determine target footprint (minimum of buildable and coverage-limited)
    let targetFootprintSqft = Math.min(
      buildableSqft * intensityFactor,
      maxFootprintFromCoverage * intensityFactor
    );

    // Step 5: Calculate stories based on archetype and height cap
    const typicalStories = typeof archetype.typicalStories === 'number'
      ? archetype.typicalStories
      : archetype.typicalStories[1]; // Use max of range for optimal

    const maxStoriesByHeight = Math.floor(envelope.heightCapFt / archetype.floorToFloorHeightFt);
    
    let stories: number;
    if (intensity === 'aggressive') {
      stories = maxStoriesByHeight;
    } else if (intensity === 'conservative') {
      stories = Math.min(typicalStories, Math.ceil(maxStoriesByHeight * 0.7));
    } else {
      stories = Math.min(typicalStories, maxStoriesByHeight);
    }
    stories = Math.max(1, stories);

    const heightFt = stories * archetype.floorToFloorHeightFt;

    // Step 6: Calculate GFA and FAR
    let gfa = targetFootprintSqft * stories;
    let far = gfa / envelope.parcelSqft;

    // Step 7: Validate against FAR cap - reduce footprint if needed
    if (far > envelope.farCap) {
      const maxGfa = envelope.farCap * envelope.parcelSqft;
      targetFootprintSqft = maxGfa / stories;
      gfa = maxGfa;
      far = envelope.farCap;
      warnings.push('Footprint reduced to meet FAR cap');
    }

    // Step 8: Validate against coverage cap - reduce if needed
    const coveragePct = (targetFootprintSqft / envelope.parcelSqft) * 100;
    if (coveragePct > envelope.coverageCapPct) {
      targetFootprintSqft = (envelope.coverageCapPct / 100) * envelope.parcelSqft * intensityFactor;
      gfa = targetFootprintSqft * stories;
      far = gfa / envelope.parcelSqft;
      warnings.push('Footprint reduced to meet coverage cap');
    }

    // Step 9: Generate footprint geometry with bias
    const footprint = generateFootprintWithBias(
      envelope.buildableFootprint2d,
      targetFootprintSqft,
      archetype.footprintBias,
      orientation
    );

    if (!footprint) {
      return {
        footprint: null,
        heightFt: 0,
        stories: 0,
        gfa: 0,
        far: 0,
        coveragePct: 0,
        warnings: ['Unable to generate footprint within envelope'],
        isValid: false,
      };
    }

    const finalCoveragePct = (targetFootprintSqft / envelope.parcelSqft) * 100;

    return {
      footprint,
      heightFt,
      stories,
      gfa: Math.round(gfa),
      far: Math.round(far * 100) / 100,
      coveragePct: Math.round(finalCoveragePct * 10) / 10,
      warnings,
      isValid: true,
    };
  } catch (error) {
    console.error('[generateBuildingPreview] Error:', error);
    return {
      footprint: null,
      heightFt: 0,
      stories: 0,
      gfa: 0,
      far: 0,
      coveragePct: 0,
      warnings: ['Error generating preview: ' + (error instanceof Error ? error.message : 'Unknown')],
      isValid: false,
    };
  }
}

/**
 * Generate a footprint polygon with the specified bias
 */
function generateFootprintWithBias(
  buildable: GeoJSON.Polygon,
  targetSqft: number,
  bias: FootprintBias,
  orientation: OrientationMode
): GeoJSON.Polygon | null {
  try {
    const buildablePolygon = turf.polygon(buildable.coordinates);
    const buildableAreaSqm = turf.area(buildablePolygon);
    const buildableAreaSqft = buildableAreaSqm * 10.7639;

    // Calculate scale factor to achieve target area
    const areaRatio = targetSqft / buildableAreaSqft;
    const scaleFactor = Math.sqrt(areaRatio); // Scale linearly in both dimensions

    // Get centroid for scaling operations
    const centroid = turf.centroid(buildablePolygon);
    const [cx, cy] = centroid.geometry.coordinates;

    // Apply bias-specific transformation
    let transformedPolygon: Feature<Polygon>;

    switch (bias) {
      case 'compact':
        // Scale uniformly toward centroid
        transformedPolygon = scalePolygon(buildablePolygon, scaleFactor, cx, cy);
        break;

      case 'linear':
        // Stretch along the long axis
        transformedPolygon = stretchPolygonLinear(buildablePolygon, scaleFactor, orientation);
        break;

      case 'deep':
        // Maximize depth (perpendicular to street)
        transformedPolygon = stretchPolygonDeep(buildablePolygon, scaleFactor, orientation);
        break;

      case 'stacked':
        // Smaller footprint (for taller buildings)
        const stackedFactor = scaleFactor * 0.85; // Reduce further for stacked
        transformedPolygon = scalePolygon(buildablePolygon, stackedFactor, cx, cy);
        break;

      case 'modular':
        // Create a rectangular footprint within the buildable
        transformedPolygon = createModularFootprint(buildablePolygon, targetSqft);
        break;

      default:
        transformedPolygon = scalePolygon(buildablePolygon, scaleFactor, cx, cy);
    }

    // Ensure the result is within the buildable envelope
    const clipped = turf.intersect(
      turf.featureCollection([transformedPolygon, buildablePolygon])
    );

    if (!clipped || clipped.geometry.type !== 'Polygon') {
      // Fallback: just use scaled version
      return transformedPolygon.geometry;
    }

    return clipped.geometry as GeoJSON.Polygon;
  } catch (error) {
    console.error('[generateFootprintWithBias] Error:', error);
    return null;
  }
}

/**
 * Scale a polygon uniformly from a center point
 */
function scalePolygon(
  polygon: Feature<Polygon>,
  factor: number,
  cx: number,
  cy: number
): Feature<Polygon> {
  const coords = polygon.geometry.coordinates[0];
  const scaledCoords = coords.map(([x, y]) => [
    cx + (x - cx) * factor,
    cy + (y - cy) * factor,
  ]);
  return turf.polygon([scaledCoords]);
}

/**
 * Stretch polygon along its long axis (linear bias)
 */
function stretchPolygonLinear(
  polygon: Feature<Polygon>,
  scaleFactor: number,
  orientation: OrientationMode
): Feature<Polygon> {
  // For linear, we want more width than depth
  const bbox = turf.bbox(polygon);
  const width = bbox[2] - bbox[0];
  const height = bbox[3] - bbox[1];
  
  const centroid = turf.centroid(polygon);
  const [cx, cy] = centroid.geometry.coordinates;

  // Scale more in X (width) direction for linear buildings
  const xScale = scaleFactor * 1.2;
  const yScale = scaleFactor * 0.8;

  const coords = polygon.geometry.coordinates[0];
  const scaledCoords = coords.map(([x, y]) => [
    cx + (x - cx) * (width > height ? xScale : yScale),
    cy + (y - cy) * (width > height ? yScale : xScale),
  ]);
  
  return turf.polygon([scaledCoords]);
}

/**
 * Stretch polygon perpendicular to street (deep bias)
 */
function stretchPolygonDeep(
  polygon: Feature<Polygon>,
  scaleFactor: number,
  orientation: OrientationMode
): Feature<Polygon> {
  // For deep, we want more depth than width
  const bbox = turf.bbox(polygon);
  const width = bbox[2] - bbox[0];
  const height = bbox[3] - bbox[1];
  
  const centroid = turf.centroid(polygon);
  const [cx, cy] = centroid.geometry.coordinates;

  // Scale more in Y (depth) direction for deep buildings
  const xScale = scaleFactor * 0.8;
  const yScale = scaleFactor * 1.2;

  const coords = polygon.geometry.coordinates[0];
  const scaledCoords = coords.map(([x, y]) => [
    cx + (x - cx) * (width > height ? xScale : yScale),
    cy + (y - cy) * (width > height ? yScale : xScale),
  ]);
  
  return turf.polygon([scaledCoords]);
}

/**
 * Create a modular (rectangular) footprint within the buildable area
 */
function createModularFootprint(
  polygon: Feature<Polygon>,
  targetSqft: number
): Feature<Polygon> {
  const bbox = turf.bbox(polygon);
  const centroid = turf.centroid(polygon);
  const [cx, cy] = centroid.geometry.coordinates;

  // Calculate dimensions for a rectangle with 2:1 aspect ratio
  const targetSqm = targetSqft / 10.7639;
  const width = Math.sqrt(targetSqm * 2); // Wider than deep
  const depth = width / 2;

  // Convert to degrees (approximate for small areas)
  const metersPerDegLng = 111320 * Math.cos((cy * Math.PI) / 180);
  const metersPerDegLat = 110540;

  const halfWidthDeg = (width / 2) / metersPerDegLng;
  const halfDepthDeg = (depth / 2) / metersPerDegLat;

  // Create rectangle centered on centroid
  const rectCoords = [
    [cx - halfWidthDeg, cy - halfDepthDeg],
    [cx + halfWidthDeg, cy - halfDepthDeg],
    [cx + halfWidthDeg, cy + halfDepthDeg],
    [cx - halfWidthDeg, cy + halfDepthDeg],
    [cx - halfWidthDeg, cy - halfDepthDeg],
  ];

  return turf.polygon([rectCoords]);
}
