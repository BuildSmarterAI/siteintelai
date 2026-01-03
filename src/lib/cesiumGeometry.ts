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
  parcelBoundary: Color.fromCssColorString("#FF7A00").withAlpha(0.2), // Brand Orange
  parcelOutline: Color.fromCssColorString("#FF7A00"),
  parcelGlow: [
    { color: Color.fromCssColorString("#FF7A00").withAlpha(0.08), width: 14 },
    { color: Color.fromCssColorString("#FF7A00").withAlpha(0.12), width: 10 },
    { color: Color.fromCssColorString("#FF7A00").withAlpha(0.18), width: 6 },
  ],
  envelope: Color.fromCssColorString("#64748B").withAlpha(0.15), // Slate
  envelopeOutline: Color.fromCssColorString("#64748B").withAlpha(0.5),
  footprint: Color.fromCssColorString("#FF7A00").withAlpha(0.6), // Feasibility Orange
  footprintOutline: Color.fromCssColorString("#FF7A00"),
  violation: Color.fromCssColorString("#EF4444").withAlpha(0.5), // Red
  violationOutline: Color.fromCssColorString("#EF4444"),
};

/**
 * Variant colors for multi-variant 3D display (Google Earth style)
 * Each variant gets a distinct color when rendered simultaneously
 */
export const VARIANT_COLORS = [
  Color.fromCssColorString("#FF7A00").withAlpha(0.85), // Orange (primary)
  Color.GOLD.withAlpha(0.85),                          // Gold
  Color.CYAN.withAlpha(0.85),                          // Cyan
  Color.fromCssColorString("#F472B6").withAlpha(0.85), // Pink
  Color.LIME.withAlpha(0.85),                          // Lime
  Color.fromCssColorString("#8B5CF6").withAlpha(0.85), // Purple
  Color.fromCssColorString("#10B981").withAlpha(0.85), // Emerald
];

/**
 * Get variant color by index (wraps around if more variants than colors)
 */
export function getVariantColor(index: number): Color {
  return VARIANT_COLORS[index % VARIANT_COLORS.length];
}

/**
 * Get variant outline color (slightly darker/more saturated)
 */
export function getVariantOutlineColor(index: number): Color {
  return VARIANT_COLORS[index % VARIANT_COLORS.length].withAlpha(1.0);
}
