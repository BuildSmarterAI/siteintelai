/**
 * Survey Calibration Types
 * Defines interfaces for the control point calibration wizard
 * and affine transformation matrix operations.
 */

export interface ControlPointPair {
  id: string;
  /** X coordinate in image pixels (from left edge) */
  image_x: number;
  /** Y coordinate in image pixels (from top edge) */
  image_y: number;
  /** Latitude in WGS84 */
  map_lat: number;
  /** Longitude in WGS84 */
  map_lng: number;
  /** Display label (A, B, C, D) */
  label: string;
}

/**
 * 6-parameter affine transformation matrix
 * Transforms image coordinates to map coordinates:
 *   map_x = a * img_x + b * img_y + c
 *   map_y = d * img_x + e * img_y + f
 */
export interface AffineTransform {
  /** Matrix parameters [a, b, c, d, e, f] */
  matrix: [number, number, number, number, number, number];
  /** Root mean square error in meters */
  residualErrorMeters: number;
  /** Confidence based on residual error */
  confidence: 'high' | 'medium' | 'low';
}

export interface ParcelMatch {
  parcel_id: string;
  source_parcel_id: string;
  county: string;
  /** Percentage of survey polygon inside this parcel */
  overlapPercentage: number;
  /** Distance from survey center to parcel centroid in meters */
  centroidDistance: number;
  /** Confidence based on overlap and distance */
  confidence: 'high' | 'medium' | 'low';
  /** Parcel boundary in GeoJSON */
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  situs_address: string | null;
  owner_name: string | null;
  acreage: number | null;
}

export interface CalibrationResult {
  success: boolean;
  transform?: AffineTransform;
  matchedParcels?: ParcelMatch[];
  error?: string;
}

export interface TransformedBounds {
  /** Four corners of the calibrated survey in WGS84 [lng, lat] */
  topLeft: [number, number];
  topRight: [number, number];
  bottomRight: [number, number];
  bottomLeft: [number, number];
}

export type CalibrationStep = 
  | 'instructions' 
  | 'mark-points' 
  | 'review-transform' 
  | 'select-parcel';
