/**
 * Measurement Snapping Utility
 * Provides snapping to building edges, parcel boundaries, and buildable areas
 */

import * as turf from "@turf/turf";

export interface SnapTarget {
  point: [number, number];
  type: "vertex" | "edge";
  source: "parcel" | "buildable" | "building";
  distance: number; // Distance in feet
}

export interface SnapSettings {
  snapToParcel: boolean;
  snapToBuildable: boolean;
  snapToBuildings: boolean;
  snapThresholdFeet: number;
}

export const DEFAULT_SNAP_SETTINGS: SnapSettings = {
  snapToParcel: true,
  snapToBuildable: true,
  snapToBuildings: true,
  snapThresholdFeet: 15,
};

/**
 * Convert threshold from feet to approximate degrees (at typical mid-latitudes)
 * 1 degree latitude ≈ 364,000 feet
 * 1 degree longitude ≈ 288,000 feet (varies with latitude)
 */
function feetToDegrees(feet: number): number {
  // Using average approximation
  return feet / 326000;
}

/**
 * Calculate distance between two points in feet
 */
function distanceInFeet(from: [number, number], to: [number, number]): number {
  const fromPoint = turf.point(from);
  const toPoint = turf.point(to);
  const distance = turf.distance(fromPoint, toPoint, { units: "feet" });
  return distance;
}

/**
 * Extract vertices from a polygon
 */
export function extractVertices(polygon: GeoJSON.Polygon): [number, number][] {
  const coords = polygon.coordinates[0];
  // Remove the closing point (duplicate of first)
  return coords.slice(0, -1) as [number, number][];
}

/**
 * Find the nearest point on a polygon edge
 */
export function findNearestPointOnEdge(
  point: [number, number],
  polygon: GeoJSON.Polygon
): { point: [number, number]; distance: number } | null {
  try {
    // Convert polygon boundary to linestring
    const ring = polygon.coordinates[0];
    const line = turf.lineString(ring);
    const pt = turf.point(point);
    
    const snapped = turf.nearestPointOnLine(line, pt, { units: "feet" });
    
    return {
      point: snapped.geometry.coordinates as [number, number],
      distance: snapped.properties.dist || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Find the nearest vertex of a polygon
 */
export function findNearestVertex(
  point: [number, number],
  polygon: GeoJSON.Polygon
): { point: [number, number]; distance: number } | null {
  const vertices = extractVertices(polygon);
  if (vertices.length === 0) return null;

  let nearest: { point: [number, number]; distance: number } | null = null;
  
  for (const vertex of vertices) {
    const dist = distanceInFeet(point, vertex);
    if (!nearest || dist < nearest.distance) {
      nearest = { point: vertex, distance: dist };
    }
  }

  return nearest;
}

/**
 * Find the best snap point from multiple geometry sources
 */
export function findSnapPoint(
  cursorPoint: [number, number],
  geometries: {
    parcel?: GeoJSON.Polygon | null;
    buildable?: GeoJSON.Polygon | null;
    buildings?: GeoJSON.Polygon[];
  },
  settings: SnapSettings
): SnapTarget | null {
  const candidates: SnapTarget[] = [];
  const threshold = settings.snapThresholdFeet;

  // Check parcel boundary
  if (settings.snapToParcel && geometries.parcel) {
    // Check vertices first (higher priority)
    const nearestVertex = findNearestVertex(cursorPoint, geometries.parcel);
    if (nearestVertex && nearestVertex.distance <= threshold) {
      candidates.push({
        point: nearestVertex.point,
        type: "vertex",
        source: "parcel",
        distance: nearestVertex.distance,
      });
    }

    // Check edges
    const nearestEdge = findNearestPointOnEdge(cursorPoint, geometries.parcel);
    if (nearestEdge && nearestEdge.distance <= threshold) {
      candidates.push({
        point: nearestEdge.point,
        type: "edge",
        source: "parcel",
        distance: nearestEdge.distance,
      });
    }
  }

  // Check buildable area
  if (settings.snapToBuildable && geometries.buildable) {
    const nearestVertex = findNearestVertex(cursorPoint, geometries.buildable);
    if (nearestVertex && nearestVertex.distance <= threshold) {
      candidates.push({
        point: nearestVertex.point,
        type: "vertex",
        source: "buildable",
        distance: nearestVertex.distance,
      });
    }

    const nearestEdge = findNearestPointOnEdge(cursorPoint, geometries.buildable);
    if (nearestEdge && nearestEdge.distance <= threshold) {
      candidates.push({
        point: nearestEdge.point,
        type: "edge",
        source: "buildable",
        distance: nearestEdge.distance,
      });
    }
  }

  // Check building footprints
  if (settings.snapToBuildings && geometries.buildings) {
    for (const building of geometries.buildings) {
      const nearestVertex = findNearestVertex(cursorPoint, building);
      if (nearestVertex && nearestVertex.distance <= threshold) {
        candidates.push({
          point: nearestVertex.point,
          type: "vertex",
          source: "building",
          distance: nearestVertex.distance,
        });
      }

      const nearestEdge = findNearestPointOnEdge(cursorPoint, building);
      if (nearestEdge && nearestEdge.distance <= threshold) {
        candidates.push({
          point: nearestEdge.point,
          type: "edge",
          source: "building",
          distance: nearestEdge.distance,
        });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Sort candidates: vertices first, then by distance
  candidates.sort((a, b) => {
    // Prefer vertices over edges (easier to hit exact corners)
    if (a.type === "vertex" && b.type !== "vertex") return -1;
    if (a.type !== "vertex" && b.type === "vertex") return 1;
    // Then by distance
    return a.distance - b.distance;
  });

  return candidates[0];
}

/**
 * Format snap source for display
 */
export function formatSnapSource(source: SnapTarget["source"]): string {
  switch (source) {
    case "parcel":
      return "Parcel Boundary";
    case "buildable":
      return "Buildable Area";
    case "building":
      return "Building Edge";
  }
}

/**
 * Format snap type for display
 */
export function formatSnapType(type: SnapTarget["type"]): string {
  switch (type) {
    case "vertex":
      return "Corner";
    case "edge":
      return "Edge";
  }
}
