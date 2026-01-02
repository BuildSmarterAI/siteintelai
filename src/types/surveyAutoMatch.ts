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

export type MatchReasonCode = 'APN' | 'ADDRESS' | 'SHAPE' | 'COUNTY' | 'AREA_SIMILAR';

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

export interface AutoMatchResult {
  success: boolean;
  status: 'AUTO_SELECTED' | 'NEEDS_REVIEW' | 'NO_MATCH' | 'ERROR';
  selected_parcel_id: string | null;
  confidence: number;
  candidates: SurveyMatchCandidate[];
  extraction: {
    apn_extracted: string | null;
    address_extracted: string | null;
    county_extracted: string | null;
  };
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
  extraction_json: {
    apn: string | null;
    address: string | null;
    county: string | null;
  } | null;
  created_at: string;
}
