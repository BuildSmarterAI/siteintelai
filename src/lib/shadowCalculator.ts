/**
 * Shadow Projection Calculator
 * Computes shadow polygons for buildings at different times of day
 */

import * as turf from "@turf/turf";
import { calculateSunPosition } from "./solarPosition";

export interface ShadowProjection {
  sunAzimuth: number;      // Degrees from north
  sunAltitude: number;     // Degrees above horizon
  shadowDirection: number; // Opposite of sun azimuth
  shadowLengthFactor: number; // Multiplier of object height
}

/**
 * Calculate shadow projection parameters for a given time and location
 */
export function calculateShadowProjection(
  date: Date,
  latitude: number,
  longitude: number
): ShadowProjection {
  const sunPos = calculateSunPosition(date, latitude, longitude);
  
  // Shadow direction is opposite to sun azimuth
  const shadowDirection = (sunPos.azimuth + 180) % 360;
  
  // Shadow length factor = cot(altitude) = 1 / tan(altitude)
  // When sun is at 45°, shadow = object height
  // When sun is at 30°, shadow = 1.73x object height
  // When sun is at 15°, shadow = 3.73x object height
  const altitudeRad = (sunPos.altitude * Math.PI) / 180;
  const shadowLengthFactor = sunPos.altitude > 2 
    ? 1 / Math.tan(altitudeRad)
    : 10; // Cap at 10x for very low sun angles

  return {
    sunAzimuth: sunPos.azimuth,
    sunAltitude: sunPos.altitude,
    shadowDirection,
    shadowLengthFactor: Math.min(shadowLengthFactor, 10),
  };
}

/**
 * Generate shadow polygon for a building footprint
 */
export function generateShadowPolygon(
  buildingFootprint: GeoJSON.Polygon,
  buildingHeightMeters: number,
  projection: ShadowProjection
): GeoJSON.Polygon | null {
  // Don't generate shadows when sun is below horizon
  if (projection.sunAltitude < 2) {
    return null;
  }

  try {
    // Calculate shadow offset in meters
    const shadowLength = buildingHeightMeters * projection.shadowLengthFactor;
    
    // Convert direction to radians (from north, clockwise)
    const directionRad = (projection.shadowDirection * Math.PI) / 180;
    
    // Calculate offset in lat/lng degrees (approximate)
    // 1 degree latitude ≈ 111,000 meters
    // 1 degree longitude varies by latitude
    const latOffset = (shadowLength * Math.cos(directionRad)) / 111000;
    const lngOffset = (shadowLength * Math.sin(directionRad)) / (111000 * Math.cos(
      (buildingFootprint.coordinates[0][0][1] * Math.PI) / 180
    ));

    // Create the shadow polygon by projecting each vertex
    const originalCoords = buildingFootprint.coordinates[0];
    const projectedCoords = originalCoords.map(([lng, lat]) => [
      lng + lngOffset,
      lat + latOffset,
    ]);

    // The shadow is the union of the original footprint and the projected footprint
    // connected by quadrilaterals on each edge
    const shadowCoords: [number, number][] = [];
    
    // Add projected vertices
    for (let i = 0; i < projectedCoords.length - 1; i++) {
      shadowCoords.push(projectedCoords[i] as [number, number]);
    }
    
    // Add original vertices in reverse to complete the polygon
    for (let i = originalCoords.length - 2; i >= 0; i--) {
      shadowCoords.push(originalCoords[i] as [number, number]);
    }
    
    // Close the polygon
    shadowCoords.push(shadowCoords[0]);

    // Create shadow polygon
    const shadowPoly = turf.polygon([shadowCoords]);
    
    // Use convex hull for smoother shadow
    const hull = turf.convex(turf.explode(shadowPoly));
    
    if (hull) {
      return hull.geometry as GeoJSON.Polygon;
    }
    
    return shadowPoly.geometry as GeoJSON.Polygon;
  } catch (e) {
    console.warn("Error generating shadow polygon:", e);
    return null;
  }
}

/**
 * Default comparison times for shadow analysis
 */
export const DEFAULT_COMPARISON_TIMES = [
  { id: "9am", hour: 9, label: "9 AM", color: "#3B82F6", visible: true },   // Blue
  { id: "12pm", hour: 12, label: "12 PM", color: "#EAB308", visible: true }, // Yellow
  { id: "3pm", hour: 15, label: "3 PM", color: "#F97316", visible: true },   // Orange
  { id: "6pm", hour: 18, label: "6 PM", color: "#EF4444", visible: true },   // Red
];

/**
 * Preset time configurations for quick selection
 */
export const SHADOW_COMPARISON_PRESETS = {
  standard: DEFAULT_COMPARISON_TIMES,
  morning: [
    { id: "7am", hour: 7, label: "7 AM", color: "#6366F1", visible: true },
    { id: "9am", hour: 9, label: "9 AM", color: "#3B82F6", visible: true },
    { id: "11am", hour: 11, label: "11 AM", color: "#06B6D4", visible: true },
  ],
  afternoon: [
    { id: "1pm", hour: 13, label: "1 PM", color: "#10B981", visible: true },
    { id: "3pm", hour: 15, label: "3 PM", color: "#F97316", visible: true },
    { id: "5pm", hour: 17, label: "5 PM", color: "#EF4444", visible: true },
  ],
  peak: [
    { id: "10am", hour: 10, label: "10 AM", color: "#3B82F6", visible: true },
    { id: "12pm", hour: 12, label: "12 PM", color: "#EAB308", visible: true },
    { id: "2pm", hour: 14, label: "2 PM", color: "#F97316", visible: true },
  ],
};
