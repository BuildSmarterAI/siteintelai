/**
 * Survey Calibration API Service
 * Handles saving calibration data and matching parcels
 */

import { supabase } from "@/integrations/supabase/client";
import type { 
  ControlPointPair, 
  AffineTransform, 
  ParcelMatch, 
  TransformedBounds,
  CalibrationResult 
} from "@/types/surveyCalibration";
import { transformImageCorners, boundsToGeoJSON } from "@/lib/affineTransform";

const SUPABASE_URL = "https://mcmfwlgovubpdcfiqfvk.supabase.co";

/**
 * Save control points to the survey_uploads record
 */
export async function saveControlPoints(
  surveyId: string,
  points: ControlPointPair[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Cast to JSON-compatible format for Supabase
    const pointsJson = points.map(p => ({
      id: p.id,
      image_x: p.image_x,
      image_y: p.image_y,
      map_lat: p.map_lat,
      map_lng: p.map_lng,
      label: p.label,
    }));
    
    const { error } = await supabase
      .from('survey_uploads')
      .update({
        control_points: pointsJson,
        calibration_status: 'uncalibrated',
      })
      .eq('id', surveyId);

    if (error) {
      console.error('Failed to save control points:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('saveControlPoints exception:', err);
    return { success: false, error: 'Unexpected error saving control points' };
  }
}

/**
 * Submit completed calibration (transform matrix + residual error)
 */
export async function submitCalibration(
  surveyId: string,
  transform: AffineTransform,
  imageWidth: number,
  imageHeight: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Calculate and store the transformed bounds
    const transformedBounds = transformImageCorners(
      transform.matrix,
      imageWidth,
      imageHeight
    );

    // Cast bounds to JSON-compatible format
    const boundsJson = {
      topLeft: transformedBounds.topLeft,
      topRight: transformedBounds.topRight,
      bottomRight: transformedBounds.bottomRight,
      bottomLeft: transformedBounds.bottomLeft,
    };

    const { error } = await supabase
      .from('survey_uploads')
      .update({
        transform_matrix: transform.matrix,
        residual_error_meters: transform.residualErrorMeters,
        calibration_status: transform.confidence === 'low' ? 'failed' : 'calibrated',
        geometry_confidence: transform.confidence,
        calibrated_bounds: boundsJson,
      })
      .eq('id', surveyId);

    if (error) {
      console.error('Failed to submit calibration:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('submitCalibration exception:', err);
    return { success: false, error: 'Unexpected error submitting calibration' };
  }
}

/**
 * Find matching parcels using PostGIS intersection
 */
export async function findMatchingParcels(
  surveyId: string,
  transformedBounds: TransformedBounds
): Promise<{ success: boolean; parcels?: ParcelMatch[]; error?: string }> {
  try {
    const surveyPolygon = boundsToGeoJSON(transformedBounds);
    
    console.log('[surveyCalibrationApi] Calling match-survey-parcels for survey:', surveyId);
    console.log('[surveyCalibrationApi] Bounds:', JSON.stringify(transformedBounds));
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/match-survey-parcels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbWZ3bGdvdnVicGRjZmlxZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0OTg3NTksImV4cCI6MjA3NDA3NDc1OX0.-4LKtcmp8zdVnLSEFsHcQYWvAxDNfCBNM-6aEiF_2gw',
      },
      body: JSON.stringify({
        survey_id: surveyId,
        survey_polygon: surveyPolygon,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Match parcels error:', errorText);
      return { success: false, error: `Server error: ${response.status}` };
    }

    const result = await response.json();
    
    console.log('[surveyCalibrationApi] Match result:', result.success, 
                'parcels found:', result.parcels?.length || 0);
    
    if (!result.success) {
      return { success: false, error: result.error || 'Matching failed' };
    }

    return { success: true, parcels: result.parcels };
  } catch (err) {
    console.error('findMatchingParcels exception:', err);
    return { success: false, error: 'Unexpected error finding matches' };
  }
}

/**
 * Get the calibrated bounds for a survey
 */
export async function getSurveyCalibration(surveyId: string): Promise<{
  success: boolean;
  transform?: AffineTransform;
  bounds?: TransformedBounds;
  error?: string;
}> {
  try {
    // Query only columns that exist in the types
    const { data, error } = await supabase
      .from('survey_uploads')
      .select('transform_matrix, residual_error_meters, geometry_confidence')
      .eq('id', surveyId)
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Survey not found' };
    }

    if (!data.transform_matrix) {
      return { success: false, error: 'Survey not calibrated' };
    }

    // Cast the JSON to our types
    const matrix = data.transform_matrix as unknown as [number, number, number, number, number, number];

    return {
      success: true,
      transform: {
        matrix,
        residualErrorMeters: data.residual_error_meters || 0,
        confidence: (data.geometry_confidence as 'high' | 'medium' | 'low') || 'low',
      },
    };
  } catch (err) {
    console.error('getSurveyCalibration exception:', err);
    return { success: false, error: 'Unexpected error getting calibration' };
  }
}

/**
 * Full calibration workflow: compute, save, and find matches
 */
export async function performFullCalibration(
  surveyId: string,
  points: ControlPointPair[],
  transform: AffineTransform,
  imageWidth: number,
  imageHeight: number
): Promise<CalibrationResult> {
  // Save control points
  const saveResult = await saveControlPoints(surveyId, points);
  if (!saveResult.success) {
    return { success: false, error: saveResult.error };
  }

  // Submit calibration
  const calibResult = await submitCalibration(surveyId, transform, imageWidth, imageHeight);
  if (!calibResult.success) {
    return { success: false, error: calibResult.error };
  }

  // Calculate transformed bounds
  const bounds = transformImageCorners(transform.matrix, imageWidth, imageHeight);

  // Find matching parcels
  const matchResult = await findMatchingParcels(surveyId, bounds);
  if (!matchResult.success) {
    // Calibration succeeded but matching failed - still return partial success
    return {
      success: true,
      transform,
      matchedParcels: [],
      error: `Calibration complete, but parcel matching failed: ${matchResult.error}`,
    };
  }

  return {
    success: true,
    transform,
    matchedParcels: matchResult.parcels,
  };
}
