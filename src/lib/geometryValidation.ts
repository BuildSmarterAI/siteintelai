/**
 * Geometry Validation Utilities
 * Validates GeoJSON geometry objects to ensure they are usable for mapping and analysis.
 */

import type { GeoJSON } from 'geojson';

interface GeometryValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates that a geometry object is usable for parcel selection and mapping.
 * A valid geometry must have:
 * - A recognized type (Polygon or MultiPolygon)
 * - At least one ring with 4+ coordinates (to form a closed polygon)
 */
export function isValidParcelGeometry(geometry: unknown): GeometryValidationResult {
  if (!geometry || typeof geometry !== 'object') {
    return { valid: false, reason: 'Geometry is null or not an object' };
  }

  const geom = geometry as { type?: string; coordinates?: unknown };

  if (!geom.type) {
    return { valid: false, reason: 'Geometry missing type property' };
  }

  if (!geom.coordinates) {
    return { valid: false, reason: 'Geometry missing coordinates property' };
  }

  if (geom.type === 'Polygon') {
    const coords = geom.coordinates as number[][][];
    if (!Array.isArray(coords) || coords.length === 0) {
      return { valid: false, reason: 'Polygon has no coordinate rings' };
    }
    const outerRing = coords[0];
    if (!Array.isArray(outerRing) || outerRing.length < 4) {
      return { valid: false, reason: `Polygon outer ring has only ${outerRing?.length ?? 0} points (need at least 4)` };
    }
    return { valid: true };
  }

  if (geom.type === 'MultiPolygon') {
    const coords = geom.coordinates as number[][][][];
    if (!Array.isArray(coords) || coords.length === 0) {
      return { valid: false, reason: 'MultiPolygon has no polygons' };
    }
    const firstPolygon = coords[0];
    if (!Array.isArray(firstPolygon) || firstPolygon.length === 0) {
      return { valid: false, reason: 'MultiPolygon first polygon has no rings' };
    }
    const outerRing = firstPolygon[0];
    if (!Array.isArray(outerRing) || outerRing.length < 4) {
      return { valid: false, reason: `MultiPolygon first ring has only ${outerRing?.length ?? 0} points (need at least 4)` };
    }
    return { valid: true };
  }

  return { valid: false, reason: `Unsupported geometry type: ${geom.type}` };
}

/**
 * Quick boolean check for valid parcel geometry
 */
export function hasValidGeometry(geometry: unknown): boolean {
  return isValidParcelGeometry(geometry).valid;
}
