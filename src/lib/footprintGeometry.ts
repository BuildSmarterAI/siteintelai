/**
 * Footprint Geometry Generation
 * Creates GeoJSON polygons for building footprints
 */

import * as turf from '@turf/turf';
import type { FootprintShape } from '@/types/wizard';

interface FootprintOptions {
  targetSqft: number;
  shape: FootprintShape;
  widthDepthRatio: number;
  centerLng: number;
  centerLat: number;
  rotation?: number; // degrees
}

/**
 * Generate a building footprint polygon
 */
export function generateFootprintPolygon(options: FootprintOptions): GeoJSON.Polygon {
  const { targetSqft, shape, widthDepthRatio, centerLng, centerLat, rotation = 0 } = options;
  
  // Convert sqft to sqm
  const targetSqM = targetSqft / 10.7639;
  
  // Calculate dimensions
  const depth = Math.sqrt(targetSqM / widthDepthRatio);
  const width = depth * widthDepthRatio;
  
  // Conversion factors (approximate for Texas ~29.5°N)
  const metersToDegLng = 1 / (111320 * Math.cos(centerLat * Math.PI / 180));
  const metersToDegLat = 1 / 110540;
  
  const halfW = (width / 2) * metersToDegLng;
  const halfD = (depth / 2) * metersToDegLat;
  
  let polygon: GeoJSON.Polygon;
  
  switch (shape) {
    case 'bar':
    case 'pad':
    case 'tower':
      polygon = createRectangle(centerLng, centerLat, halfW, halfD);
      break;
    case 'L':
      polygon = createLShape(centerLng, centerLat, halfW, halfD);
      break;
    case 'courtyard':
      polygon = createCourtyard(centerLng, centerLat, halfW, halfD);
      break;
    default:
      polygon = createRectangle(centerLng, centerLat, halfW, halfD);
  }
  
  // Apply rotation if specified
  if (rotation !== 0) {
    const rotated = turf.transformRotate(
      turf.polygon(polygon.coordinates),
      rotation,
      { pivot: [centerLng, centerLat] }
    );
    return rotated.geometry as GeoJSON.Polygon;
  }
  
  return polygon;
}

/**
 * Create a simple rectangle
 */
function createRectangle(cx: number, cy: number, halfW: number, halfD: number): GeoJSON.Polygon {
  return {
    type: 'Polygon',
    coordinates: [[
      [cx - halfW, cy - halfD],
      [cx + halfW, cy - halfD],
      [cx + halfW, cy + halfD],
      [cx - halfW, cy + halfD],
      [cx - halfW, cy - halfD]
    ]]
  };
}

/**
 * Create an L-shape footprint
 */
function createLShape(cx: number, cy: number, halfW: number, halfD: number): GeoJSON.Polygon {
  const notchW = halfW * 0.5;
  const notchD = halfD * 0.5;
  
  return {
    type: 'Polygon',
    coordinates: [[
      [cx - halfW, cy - halfD],
      [cx + halfW, cy - halfD],
      [cx + halfW, cy + notchD],
      [cx + notchW, cy + notchD],
      [cx + notchW, cy + halfD],
      [cx - halfW, cy + halfD],
      [cx - halfW, cy - halfD]
    ]]
  };
}

/**
 * Create a courtyard (hollow rectangle) footprint
 */
function createCourtyard(cx: number, cy: number, halfW: number, halfD: number): GeoJSON.Polygon {
  const innerW = halfW * 0.4;
  const innerD = halfD * 0.4;
  
  return {
    type: 'Polygon',
    coordinates: [
      // Outer ring (counter-clockwise for exterior)
      [
        [cx - halfW, cy - halfD],
        [cx + halfW, cy - halfD],
        [cx + halfW, cy + halfD],
        [cx - halfW, cy + halfD],
        [cx - halfW, cy - halfD]
      ],
      // Inner ring (clockwise for hole)
      [
        [cx - innerW, cy - innerD],
        [cx - innerW, cy + innerD],
        [cx + innerW, cy + innerD],
        [cx + innerW, cy - innerD],
        [cx - innerW, cy - innerD]
      ]
    ]
  };
}

/**
 * Clamp a footprint polygon to stay within the buildable envelope
 */
export function clampToEnvelope(
  footprint: GeoJSON.Polygon,
  envelope: GeoJSON.Polygon
): GeoJSON.Polygon {
  try {
    const footprintFeature = turf.polygon(footprint.coordinates);
    const envelopeFeature = turf.polygon(envelope.coordinates);
    
    // Check if footprint is within envelope
    if (turf.booleanWithin(footprintFeature, envelopeFeature)) {
      return footprint;
    }
    
    // Intersect to clamp
    const intersection = turf.intersect(
      turf.featureCollection([footprintFeature, envelopeFeature])
    );
    
    if (intersection && intersection.geometry.type === 'Polygon') {
      return intersection.geometry as GeoJSON.Polygon;
    }
    
    // Fallback: scale down to fit
    const footprintArea = turf.area(footprintFeature);
    const envelopeArea = turf.area(envelopeFeature);
    
    if (footprintArea > envelopeArea) {
      const scaleFactor = Math.sqrt(envelopeArea / footprintArea) * 0.9;
      const centroid = turf.centroid(footprintFeature);
      const scaled = turf.transformScale(footprintFeature, scaleFactor, {
        origin: centroid.geometry.coordinates as [number, number]
      });
      return scaled.geometry as GeoJSON.Polygon;
    }
    
    return footprint;
  } catch (error) {
    console.error('[FootprintGeometry] Clamp error:', error);
    return footprint;
  }
}

/**
 * Get the centroid of a polygon
 */
export function getPolygonCentroid(polygon: GeoJSON.Polygon): { lng: number; lat: number } {
  const centroid = turf.centroid(turf.polygon(polygon.coordinates));
  return {
    lng: centroid.geometry.coordinates[0],
    lat: centroid.geometry.coordinates[1]
  };
}

/**
 * Calculate approximate area of a polygon in square feet
 */
export function getPolygonAreaSqft(polygon: GeoJSON.Polygon): number {
  const area = turf.area(turf.polygon(polygon.coordinates));
  return area * 10.7639; // sqm to sqft
}

/**
 * Convert feet to meters
 */
export function feetToMeters(ft: number): number {
  return ft * 0.3048;
}

/**
 * Convert meters to feet
 */
export function metersToFeet(m: number): number {
  return m / 0.3048;
}
