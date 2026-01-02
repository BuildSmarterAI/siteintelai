/**
 * Survey Upload API Service
 * Handles upload, retrieval, and management of survey/plat documents
 * for parcel selection visual confirmation.
 */

import { supabase } from "@/integrations/supabase/client";

export interface SurveyUploadMetadata {
  id: string;
  filename: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  title?: string;
  recording_info?: string;
  surveyor_name?: string;
  survey_date?: string;
  county?: string;
  calibration_status: 'uncalibrated' | 'calibrated' | 'failed';
  geometry_confidence: 'high' | 'medium' | 'low';
  application_id?: string;
  draft_id?: string;
}

export interface UploadSurveyResult {
  success: boolean;
  survey?: SurveyUploadMetadata;
  error?: string;
}

const BUCKET_NAME = 'surveys';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];

/**
 * Upload a survey/plat file to storage and create metadata record
 */
export async function uploadSurvey(
  file: File,
  options?: {
    title?: string;
    county?: string;
    draftId?: string;
  }
): Promise<UploadSurveyResult> {
  try {
    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'File exceeds 50MB limit' };
    }
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Allowed: PDF, JPEG, PNG, TIFF' };
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Generate storage path: {user_id}/{timestamp}_{filename}
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${user.id}/${timestamp}_${sanitizedFilename}`;

    // Upload to storage bucket
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Survey upload error:', uploadError);
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Create metadata record
    const { data: survey, error: insertError } = await supabase
      .from('survey_uploads')
      .insert({
        user_id: user.id,
        filename: file.name,
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.type,
        title: options?.title,
        county: options?.county,
        draft_id: options?.draftId,
        calibration_status: 'uncalibrated',
        geometry_confidence: 'low',
      })
      .select()
      .single();

    if (insertError) {
      // Clean up uploaded file on metadata failure
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      console.error('Survey metadata insert error:', insertError);
      return { success: false, error: `Failed to save metadata: ${insertError.message}` };
    }

    return {
      success: true,
      survey: {
        id: survey.id,
        filename: survey.filename,
        storage_path: survey.storage_path,
        file_size: survey.file_size,
        mime_type: survey.mime_type,
        uploaded_at: survey.uploaded_at,
        title: survey.title ?? undefined,
        recording_info: survey.recording_info ?? undefined,
        surveyor_name: survey.surveyor_name ?? undefined,
        survey_date: survey.survey_date ?? undefined,
        county: survey.county ?? undefined,
        calibration_status: survey.calibration_status as 'uncalibrated' | 'calibrated' | 'failed',
        geometry_confidence: survey.geometry_confidence as 'high' | 'medium' | 'low',
        application_id: survey.application_id ?? undefined,
        draft_id: survey.draft_id ?? undefined,
      },
    };
  } catch (err) {
    console.error('Survey upload exception:', err);
    return { success: false, error: 'Unexpected error during upload' };
  }
}

/**
 * Get a signed URL for viewing a survey file
 */
export async function getSurveyUrl(storagePath: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (error) {
      console.error('Failed to create signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error('getSurveyUrl exception:', err);
    return null;
  }
}

/**
 * Get surveys for the current user
 */
export async function getUserSurveys(): Promise<SurveyUploadMetadata[]> {
  try {
    const { data, error } = await supabase
      .from('survey_uploads')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch surveys:', error);
      return [];
    }

    return data.map((s) => ({
      id: s.id,
      filename: s.filename,
      storage_path: s.storage_path,
      file_size: s.file_size,
      mime_type: s.mime_type,
      uploaded_at: s.uploaded_at,
      title: s.title ?? undefined,
      recording_info: s.recording_info ?? undefined,
      surveyor_name: s.surveyor_name ?? undefined,
      survey_date: s.survey_date ?? undefined,
      county: s.county ?? undefined,
      calibration_status: s.calibration_status as 'uncalibrated' | 'calibrated' | 'failed',
      geometry_confidence: s.geometry_confidence as 'high' | 'medium' | 'low',
      application_id: s.application_id ?? undefined,
      draft_id: s.draft_id ?? undefined,
    }));
  } catch (err) {
    console.error('getUserSurveys exception:', err);
    return [];
  }
}

/**
 * Delete a survey upload
 */
export async function deleteSurvey(surveyId: string): Promise<boolean> {
  try {
    // Get the survey first to know the storage path
    const { data: survey, error: fetchError } = await supabase
      .from('survey_uploads')
      .select('storage_path')
      .eq('id', surveyId)
      .single();

    if (fetchError || !survey) {
      console.error('Survey not found:', fetchError);
      return false;
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([survey.storage_path]);

    if (storageError) {
      console.error('Failed to delete from storage:', storageError);
      // Continue to delete metadata anyway
    }

    // Delete metadata record
    const { error: deleteError } = await supabase
      .from('survey_uploads')
      .delete()
      .eq('id', surveyId);

    if (deleteError) {
      console.error('Failed to delete survey metadata:', deleteError);
      return false;
    }

    return true;
  } catch (err) {
    console.error('deleteSurvey exception:', err);
    return false;
  }
}

/**
 * Link a survey to an application
 */
export async function linkSurveyToApplication(
  surveyId: string,
  applicationId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('survey_uploads')
      .update({ application_id: applicationId })
      .eq('id', surveyId);

    if (error) {
      console.error('Failed to link survey:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('linkSurveyToApplication exception:', err);
    return false;
  }
}
