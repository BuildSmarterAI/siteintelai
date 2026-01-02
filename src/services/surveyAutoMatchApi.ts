/**
 * Survey Auto-Match API Service
 * Handles automatic parcel matching for uploaded surveys
 */

import { supabase } from "@/integrations/supabase/client";
import type { 
  AutoMatchResult, 
  SurveyMatchCandidate, 
  SurveyMatchStatus,
  SurveyWithMatchData,
  MatchReasonCode
} from "@/types/surveyAutoMatch";

/**
 * Trigger automatic parcel matching for a survey
 */
export async function triggerAutoMatch(
  surveyUploadId: string
): Promise<AutoMatchResult> {
  try {
    console.log("[surveyAutoMatchApi] Triggering auto-match for:", surveyUploadId);

    const { data, error } = await supabase.functions.invoke("auto-match-survey-parcel", {
      body: { survey_upload_id: surveyUploadId },
    });

    if (error) {
      console.error("[surveyAutoMatchApi] Auto-match invoke error:", error);
      return {
        success: false,
        status: "ERROR",
        selected_parcel_id: null,
        confidence: 0,
        candidates: [],
        extraction: { apn_extracted: null, address_extracted: null, county_extracted: null },
        error: error.message,
      };
    }

    console.log("[surveyAutoMatchApi] Auto-match result:", data);
    return data as AutoMatchResult;
  } catch (err) {
    console.error("[surveyAutoMatchApi] triggerAutoMatch exception:", err);
    return {
      success: false,
      status: "ERROR",
      selected_parcel_id: null,
      confidence: 0,
      candidates: [],
      extraction: { apn_extracted: null, address_extracted: null, county_extracted: null },
      error: "Unexpected error during auto-match",
    };
  }
}

/**
 * Get the current match status for a survey
 */
export async function getMatchStatus(
  surveyUploadId: string
): Promise<{ 
  success: boolean; 
  status?: SurveyMatchStatus;
  confidence?: number;
  candidates?: SurveyMatchCandidate[];
  selectedParcelId?: string;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("survey_uploads")
      .select("match_status, match_confidence, match_candidates, selected_parcel_id")
      .eq("id", surveyUploadId)
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Survey not found" };
    }

    return {
      success: true,
      status: data.match_status as SurveyMatchStatus,
      confidence: data.match_confidence || 0,
      candidates: (data.match_candidates as unknown as SurveyMatchCandidate[]) || [],
      selectedParcelId: data.selected_parcel_id || undefined,
    };
  } catch (err) {
    console.error("[surveyAutoMatchApi] getMatchStatus exception:", err);
    return { success: false, error: "Unexpected error getting match status" };
  }
}

/**
 * Manually select a parcel from the candidates list
 */
export async function selectMatchedParcel(
  surveyUploadId: string,
  parcelId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("survey_uploads")
      .update({
        selected_parcel_id: parcelId,
        match_status: "matched",
      })
      .eq("id", surveyUploadId);

    if (error) {
      console.error("[surveyAutoMatchApi] selectMatchedParcel error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[surveyAutoMatchApi] selectMatchedParcel exception:", err);
    return { success: false, error: "Unexpected error selecting parcel" };
  }
}

/**
 * Get survey with full match data
 */
export async function getSurveyWithMatchData(
  surveyUploadId: string
): Promise<{ success: boolean; survey?: SurveyWithMatchData; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("survey_uploads")
      .select("*")
      .eq("id", surveyUploadId)
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Survey not found" };
    }

    return {
      success: true,
      survey: {
        id: data.id,
        user_id: data.user_id,
        filename: data.filename,
        title: data.title,
        county: data.county,
        storage_path: data.storage_path,
        file_size: data.file_size,
        file_type: data.mime_type || 'application/pdf',
        match_status: (data.match_status || 'pending') as SurveyMatchStatus,
        match_confidence: data.match_confidence,
        match_candidates: data.match_candidates as unknown as SurveyMatchCandidate[] | null,
        match_reason_codes: data.match_reason_codes as unknown as MatchReasonCode[] | null,
        selected_parcel_id: data.selected_parcel_id,
        extraction_json: data.extraction_json as unknown as SurveyWithMatchData['extraction_json'],
        created_at: data.created_at,
      },
    };
  } catch (err) {
    console.error("[surveyAutoMatchApi] getSurveyWithMatchData exception:", err);
    return { success: false, error: "Unexpected error getting survey data" };
  }
}
