/**
 * Affine Transform Utility
 * Pure math functions for computing and applying affine transformations
 * to georectify survey images.
 */

import type { ControlPointPair, AffineTransform, TransformedBounds } from '@/types/surveyCalibration';

/**
 * Compute a 6-parameter affine transformation matrix using least squares.
 * Requires at least 3 non-collinear control points.
 * 
 * The transformation maps image coordinates (pixels) to map coordinates (WGS84):
 *   lng = a * img_x + b * img_y + c
 *   lat = d * img_x + e * img_y + f
 * 
 * Returns matrix [a, b, c, d, e, f]
 */
export function computeAffineMatrix(points: ControlPointPair[]): [number, number, number, number, number, number] | null {
  if (points.length < 3) {
    console.error('At least 3 control points required');
    return null;
  }

  // Check for collinearity
  if (points.length === 3 && arePointsCollinear(points)) {
    console.error('Control points are collinear');
    return null;
  }

  const n = points.length;
  
  // Build the system of equations for least squares
  // For each point: lng = a*x + b*y + c and lat = d*x + e*y + f
  // We solve two separate systems: one for [a,b,c] and one for [d,e,f]
  
  // Matrix A: [[x1, y1, 1], [x2, y2, 1], ...]
  // Vector b_lng: [lng1, lng2, ...]
  // Vector b_lat: [lat1, lat2, ...]
  
  // Using normal equations: A^T * A * x = A^T * b
  
  let sumX = 0, sumY = 0, sumXX = 0, sumYY = 0, sumXY = 0;
  let sumLng = 0, sumLat = 0;
  let sumXLng = 0, sumYLng = 0;
  let sumXLat = 0, sumYLat = 0;
  
  for (const p of points) {
    sumX += p.image_x;
    sumY += p.image_y;
    sumXX += p.image_x * p.image_x;
    sumYY += p.image_y * p.image_y;
    sumXY += p.image_x * p.image_y;
    sumLng += p.map_lng;
    sumLat += p.map_lat;
    sumXLng += p.image_x * p.map_lng;
    sumYLng += p.image_y * p.map_lng;
    sumXLat += p.image_x * p.map_lat;
    sumYLat += p.image_y * p.map_lat;
  }
  
  // Normal equation matrix (same for both lng and lat)
  // [sumXX, sumXY, sumX]
  // [sumXY, sumYY, sumY]
  // [sumX,  sumY,  n   ]
  
  const det = sumXX * (sumYY * n - sumY * sumY) 
            - sumXY * (sumXY * n - sumY * sumX) 
            + sumX * (sumXY * sumY - sumYY * sumX);
  
  if (Math.abs(det) < 1e-10) {
    console.error('Matrix is singular, cannot compute transform');
    return null;
  }
  
  // Compute inverse of 3x3 matrix and multiply by right-hand side
  // Using Cramer's rule for simplicity
  
  // For longitude (a, b, c)
  const a = (
    sumXLng * (sumYY * n - sumY * sumY) -
    sumXY * (sumYLng * n - sumY * sumLng) +
    sumX * (sumYLng * sumY - sumYY * sumLng)
  ) / det;
  
  const b = (
    sumXX * (sumYLng * n - sumY * sumLng) -
    sumXLng * (sumXY * n - sumY * sumX) +
    sumX * (sumXY * sumLng - sumYLng * sumX)
  ) / det;
  
  const c = (
    sumXX * (sumYY * sumLng - sumY * sumYLng) -
    sumXY * (sumXY * sumLng - sumY * sumXLng) +
    sumXLng * (sumXY * sumY - sumYY * sumX)
  ) / det;
  
  // For latitude (d, e, f)
  const d = (
    sumXLat * (sumYY * n - sumY * sumY) -
    sumXY * (sumYLat * n - sumY * sumLat) +
    sumX * (sumYLat * sumY - sumYY * sumLat)
  ) / det;
  
  const e = (
    sumXX * (sumYLat * n - sumY * sumLat) -
    sumXLat * (sumXY * n - sumY * sumX) +
    sumX * (sumXY * sumLat - sumYLat * sumX)
  ) / det;
  
  const f = (
    sumXX * (sumYY * sumLat - sumY * sumYLat) -
    sumXY * (sumXY * sumLat - sumY * sumXLat) +
    sumXLat * (sumXY * sumY - sumYY * sumX)
  ) / det;
  
  return [a, b, c, d, e, f];
}

/**
 * Apply affine transform to get map coordinates from image coordinates
 */
export function applyTransform(
  matrix: [number, number, number, number, number, number],
  imageX: number,
  imageY: number
): { lng: number; lat: number } {
  const [a, b, c, d, e, f] = matrix;
  return {
    lng: a * imageX + b * imageY + c,
    lat: d * imageX + e * imageY + f,
  };
}

/**
 * Calculate residual error (RMS) in meters
 */
export function calculateResidualError(
  matrix: [number, number, number, number, number, number],
  points: ControlPointPair[]
): number {
  let sumSquaredError = 0;
  
  for (const p of points) {
    const predicted = applyTransform(matrix, p.image_x, p.image_y);
    const errorLng = predicted.lng - p.map_lng;
    const errorLat = predicted.lat - p.map_lat;
    
    // Convert to approximate meters (using equirectangular approximation)
    // At ~30° latitude (Texas), 1 degree ≈ 111km lat, ~96km lng
    const errorMetersLng = errorLng * 96000;
    const errorMetersLat = errorLat * 111000;
    
    sumSquaredError += errorMetersLng * errorMetersLng + errorMetersLat * errorMetersLat;
  }
  
  return Math.sqrt(sumSquaredError / points.length);
}

/**
 * Transform the four corners of an image to get georeferenced bounds
 */
export function transformImageCorners(
  matrix: [number, number, number, number, number, number],
  imageWidth: number,
  imageHeight: number
): TransformedBounds {
  const topLeft = applyTransform(matrix, 0, 0);
  const topRight = applyTransform(matrix, imageWidth, 0);
  const bottomRight = applyTransform(matrix, imageWidth, imageHeight);
  const bottomLeft = applyTransform(matrix, 0, imageHeight);
  
  return {
    topLeft: [topLeft.lng, topLeft.lat],
    topRight: [topRight.lng, topRight.lat],
    bottomRight: [bottomRight.lng, bottomRight.lat],
    bottomLeft: [bottomLeft.lng, bottomLeft.lat],
  };
}

/**
 * Get confidence level based on residual error
 */
export function getConfidenceFromError(residualMeters: number): 'high' | 'medium' | 'low' {
  if (residualMeters < 2) return 'high';
  if (residualMeters < 5) return 'medium';
  return 'low';
}

/**
 * Build full AffineTransform object
 */
export function buildAffineTransform(
  points: ControlPointPair[]
): AffineTransform | null {
  const matrix = computeAffineMatrix(points);
  if (!matrix) return null;
  
  const residualErrorMeters = calculateResidualError(matrix, points);
  const confidence = getConfidenceFromError(residualErrorMeters);
  
  return {
    matrix,
    residualErrorMeters,
    confidence,
  };
}

/**
 * Check if three points are collinear (would produce invalid transform)
 */
function arePointsCollinear(points: ControlPointPair[]): boolean {
  if (points.length < 3) return true;
  
  const [p1, p2, p3] = points;
  
  // Calculate cross product of vectors (p2-p1) and (p3-p1)
  const v1x = p2.image_x - p1.image_x;
  const v1y = p2.image_y - p1.image_y;
  const v2x = p3.image_x - p1.image_x;
  const v2y = p3.image_y - p1.image_y;
  
  const crossProduct = v1x * v2y - v1y * v2x;
  
  // If cross product is near zero, points are collinear
  // Use a threshold based on typical image dimensions
  const threshold = 100; // pixels squared
  return Math.abs(crossProduct) < threshold;
}

/**
 * Convert bounds to GeoJSON polygon for PostGIS queries
 */
export function boundsToGeoJSON(bounds: TransformedBounds): GeoJSON.Polygon {
  return {
    type: 'Polygon',
    coordinates: [[
      bounds.topLeft,
      bounds.topRight,
      bounds.bottomRight,
      bounds.bottomLeft,
      bounds.topLeft, // Close the ring
    ]],
  };
}
