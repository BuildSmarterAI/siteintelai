/**
 * Survey Auto-Match Types
 * Defines interfaces for the zero-click automatic parcel matching pipeline
 */

export type SurveyMatchStatus = 
  | 'pending' 
  | 'analyzing' 
  | 'matching' 
  | 'matched' 
  | 'needs_review' 
  | 'no_match' 
  | 'error';

export type SurveyType = 
  | 'LAND_TITLE_SURVEY' 
  | 'RECORDED_PLAT' 
  | 'BOUNDARY_ONLY' 
  | 'UNKNOWN';

export type MatchReasonCode = 
  | 'APN_MATCH'
  | 'ADDRESS_MATCH' 
  | 'OWNER_MATCH'
  | 'LEGAL_DESC_MATCH'
  | 'AREA_MATCH'
  | 'COUNTY_MATCH'
  // Legacy codes for backwards compatibility
  | 'APN' 
  | 'ADDRESS' 
  | 'SHAPE' 
  | 'COUNTY' 
  | 'AREA_SIMILAR';

export interface SurveyMatchCandidate {
  parcel_id: string;
  source_parcel_id: string;
  confidence: number;
  reason_codes: MatchReasonCode[];
  situs_address: string | null;
  owner_name: string | null;
  acreage: number | null;
  county: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | null;
  debug?: {
    apn_extracted: string | null;
    address_extracted: string | null;
    match_type: string;
  };
}

export interface LegalDescription {
  lot: string | null;
  block: string | null;
  subdivision: string | null;
}

export interface SurveyExtraction {
  apn_extracted: string | null;
  address_extracted: string | null;
  county_extracted: string | null;
  owner_extracted?: string | null;
  acreage_extracted?: number | null;
  legal_description?: LegalDescription | null;
  survey_type?: SurveyType;
  ocr_used?: boolean;
  extraction_source?: string;
}

export interface AutoMatchResult {
  success: boolean;
  status: 'AUTO_SELECTED' | 'NEEDS_REVIEW' | 'NO_MATCH' | 'ERROR';
  selected_parcel_id: string | null;
  confidence: number;
  candidates: SurveyMatchCandidate[];
  extraction: SurveyExtraction;
  error?: string;
}

export interface SurveyWithMatchData {
  id: string;
  user_id: string;
  filename: string;
  title: string | null;
  county: string | null;
  storage_path: string;
  file_size: number;
  file_type: string;
  match_status: SurveyMatchStatus;
  match_confidence: number | null;
  match_candidates: SurveyMatchCandidate[] | null;
  match_reason_codes: MatchReasonCode[] | null;
  selected_parcel_id: string | null;
  survey_type?: SurveyType;
  extraction_json: SurveyExtraction | null;
  created_at: string;
}
