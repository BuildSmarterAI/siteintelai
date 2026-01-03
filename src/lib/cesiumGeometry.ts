/**
 * SiteIntel™ Design Mode - Cesium Geometry Utilities
 * 
 * Conversion utilities between GeoJSON and Cesium primitives.
 */

import { Cartesian3, Color, ColorMaterialProperty } from "cesium";
import type { Entity } from "cesium";

/**
 * Convert feet to meters for Cesium height values
 */
export function feetToMeters(feet: number): number {
  return feet * 0.3048;
}

/**
 * Convert GeoJSON polygon coordinates to Cesium Cartesian3 array
 */
export function geojsonToCesiumPositions(polygon: GeoJSON.Polygon): Cartesian3[] {
  // GeoJSON polygons have outer ring at index 0
  const coordinates = polygon.coordinates[0];
  
  return coordinates.map(([lng, lat]) => 
    Cartesian3.fromDegrees(lng, lat)
  );
}

/**
 * Get the centroid of a GeoJSON polygon (simple average)
 */
export function getPolygonCentroid(polygon: GeoJSON.Polygon): { lng: number; lat: number } {
  const coordinates = polygon.coordinates[0];
  const count = coordinates.length - 1; // Last point is same as first
  
  let sumLng = 0;
  let sumLat = 0;
  
  for (let i = 0; i < count; i++) {
    sumLng += coordinates[i][0];
    sumLat += coordinates[i][1];
  }
  
  return {
    lng: sumLng / count,
    lat: sumLat / count,
  };
}

/**
 * Create extruded polygon graphics options for Cesium Entity
 */
export function createExtrudedPolygonOptions(
  polygon: GeoJSON.Polygon,
  heightFt: number,
  options: {
    color: Color;
    outlineColor?: Color;
    showOutline?: boolean;
  }
) {
  const positions = geojsonToCesiumPositions(polygon);
  const heightMeters = feetToMeters(heightFt);
  
  return {
    hierarchy: positions,
    extrudedHeight: heightMeters,
    height: 0,
    material: new ColorMaterialProperty(options.color),
    outline: options.showOutline ?? true,
    outlineColor: options.outlineColor ?? Color.WHITE,
    outlineWidth: 2,
  };
}

/**
 * Create ground polygon graphics options (no extrusion)
 */
export function createGroundPolygonOptions(
  polygon: GeoJSON.Polygon,
  options: {
    color: Color;
    outlineColor?: Color;
  }
) {
  const positions = geojsonToCesiumPositions(polygon);
  
  return {
    hierarchy: positions,
    material: new ColorMaterialProperty(options.color),
    outline: true,
    outlineColor: options.outlineColor ?? Color.WHITE,
    outlineWidth: 2,
    clampToGround: true,
  };
}

/**
 * Design Mode color palette for Cesium entities
 */
export const DESIGN_COLORS = {
  parcelBoundary: Color.fromCssColorString("#3B82F6").withAlpha(0.3), // Blue
  parcelOutline: Color.fromCssColorString("#3B82F6"),
  envelope: Color.fromCssColorString("#64748B").withAlpha(0.15), // Slate
  envelopeOutline: Color.fromCssColorString("#64748B").withAlpha(0.5),
  footprint: Color.fromCssColorString("#FF7A00").withAlpha(0.6), // Feasibility Orange
  footprintOutline: Color.fromCssColorString("#FF7A00"),
  violation: Color.fromCssColorString("#EF4444").withAlpha(0.5), // Red
  violationOutline: Color.fromCssColorString("#EF4444"),
};
