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


/**
 * Save control points to the survey_uploads record
 */
export async function saveControlPoints(
  surveyId: string,
  points: ControlPointPair[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Cast to JSON-compatible format for Supabase
    const pointsJson = points.map((p) => ({
      id: p.id,
      image_x: p.image_x,
      image_y: p.image_y,
      map_lat: p.map_lat,
      map_lng: p.map_lng,
      label: p.label,
    }));

    const { error } = await supabase
      .from("survey_uploads")
      .update({
        control_points: pointsJson,
        calibration_status: "uncalibrated",
      })
      .eq("id", surveyId);

    if (error) {
      console.error("Failed to save control points:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("saveControlPoints exception:", err);
    return { success: false, error: "Unexpected error saving control points" };
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
      .from("survey_uploads")
      .update({
        transform_matrix: transform.matrix,
        residual_error_meters: transform.residualErrorMeters,
        calibration_status: transform.confidence === "low" ? "failed" : "calibrated",
        geometry_confidence: transform.confidence,
        calibrated_bounds: boundsJson,
      })
      .eq("id", surveyId);

    if (error) {
      console.error("Failed to submit calibration:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("submitCalibration exception:", err);
    return { success: false, error: "Unexpected error submitting calibration" };
  }
}

/**
 * Find matching parcels using the Edge Function.
 *
 * IMPORTANT: Use supabase.functions.invoke so the user's session JWT is sent.
 * A raw fetch with only the anon key can fail (401) depending on function config.
 */
export async function findMatchingParcels(
  surveyId: string,
  transformedBounds: TransformedBounds
): Promise<{ success: boolean; parcels?: ParcelMatch[]; error?: string }> {
  try {
    const surveyPolygon = boundsToGeoJSON(transformedBounds);

    console.log(
      "[surveyCalibrationApi] Invoking match-survey-parcels for survey:",
      surveyId
    );

    const { data, error } = await supabase.functions.invoke("match-survey-parcels", {
      body: {
        survey_id: surveyId,
        survey_polygon: surveyPolygon,
      },
    });

    if (error) {
      console.error("[surveyCalibrationApi] match-survey-parcels invoke error:", error);
      return { success: false, error: error.message };
    }

    const result = data as any;

    console.log(
      "[surveyCalibrationApi] Match result:",
      result?.success,
      "parcels found:",
      result?.parcels?.length || 0
    );

    if (!result?.success) {
      return { success: false, error: result?.error || "Matching failed" };
    }

    return { success: true, parcels: result.parcels as ParcelMatch[] };
  } catch (err) {
    console.error("findMatchingParcels exception:", err);
    return { success: false, error: "Unexpected error finding matches" };
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
  console.log('[surveyCalibrationApi] performFullCalibration START', { surveyId, pointsCount: points.length });
  
  // Save control points
  console.log('[surveyCalibrationApi] Saving control points...');
  const saveResult = await saveControlPoints(surveyId, points);
  console.log('[surveyCalibrationApi] saveControlPoints result:', saveResult);
  if (!saveResult.success) {
    return { success: false, error: saveResult.error };
  }

  // Submit calibration
  console.log('[surveyCalibrationApi] Submitting calibration...');
  const calibResult = await submitCalibration(surveyId, transform, imageWidth, imageHeight);
  console.log('[surveyCalibrationApi] submitCalibration result:', calibResult);
  if (!calibResult.success) {
    return { success: false, error: calibResult.error };
  }

  // Calculate transformed bounds
  const bounds = transformImageCorners(transform.matrix, imageWidth, imageHeight);
  console.log('[surveyCalibrationApi] Transformed bounds:', bounds);

  // Find matching parcels
  console.log('[surveyCalibrationApi] Finding matching parcels...');
  const matchResult = await findMatchingParcels(surveyId, bounds);
  console.log('[surveyCalibrationApi] findMatchingParcels result:', {
    success: matchResult.success,
    error: matchResult.error,
    parcelsCount: matchResult.parcels?.length || 0,
    firstParcelGeometry: matchResult.parcels?.[0]?.geometry ? {
      type: matchResult.parcels[0].geometry.type,
      coordsLength: matchResult.parcels[0].geometry.coordinates?.length
    } : null
  });
  
  if (!matchResult.success) {
    // Matching failed - return failure so UI can show error clearly
    return {
      success: false,
      transform,
      matchedParcels: [],
      error: `Parcel matching failed: ${matchResult.error}`,
    };
  }

  return {
    success: true,
    transform,
    matchedParcels: matchResult.parcels,
  };
}
