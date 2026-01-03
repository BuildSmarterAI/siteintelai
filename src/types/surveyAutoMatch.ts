/**
 * Survey Auto-Match Types
 * Defines interfaces for the zero-click automatic parcel matching pipeline
 * Extended for Survey-First Parcel Identification System
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
  | 'GEOMETRY_OVERLAP'
  | 'ACREAGE_FINGERPRINT'
  | 'ROW_RATIO_MATCH'
  | 'ROAD_FRONTAGE_MATCH'
  | 'MULTI_PARCEL_ASSEMBLY'
  | 'LIVE_QUERY'
  // Legacy codes for backwards compatibility
  | 'APN' 
  | 'ADDRESS' 
  | 'SHAPE' 
  | 'COUNTY' 
  | 'AREA_SIMILAR';

/**
 * Confidence level for extraction and matching
 * HIGH: Lender-ready, auto-selectable
 * MEDIUM: Requires checkbox confirmation
 * LOW: Requires type-to-confirm
 * NONE: Manual selection required
 */
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

/**
 * Report grade based on dual confidence tracks
 * LENDER_READY: Both geometry and identity confidence are HIGH
 * SCREENING_ONLY: One or both confidence levels are below HIGH
 */
export type ReportGrade = 'LENDER_READY' | 'SCREENING_ONLY';

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
  // V2 Enhanced fields
  match_score?: number;
  confidence_tier?: ConfidenceLevel;
  overlap_pct?: number;
  gross_acre_delta?: number;
  net_acre_delta?: number;
  // Enhanced scoring breakdown
  score_breakdown?: {
    geometry_overlap: number;
    gross_acreage_delta: number;
    net_acreage_delta: number;
    legal_description_match: number;
    owner_match: number;
    county_match: number;
  };
  debug?: {
    apn_extracted: string | null;
    address_extracted: string | null;
    match_type: string;
    data_source?: string;
  };
}

export interface LegalDescription {
  lot: string | null;
  block: string | null;
  subdivision: string | null;
  abstract_number?: string | null;
  section_number?: string | null;
  tract_number?: string | null;
}

export interface RoadFrontage {
  road_name: string;
  frontage_ft: number;
  road_classification?: 'highway' | 'arterial' | 'collector' | 'local' | 'unknown';
}

/**
 * Extended Survey Extraction with gross/net acreage and ROW breakdown
 * Supports survey-first parcel identification
 */
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
  
  // Enhanced acreage breakdown (Survey-First)
  gross_acreage?: number | null;
  net_acreage?: number | null;
  row_acreage?: number | null;
  easement_acreage?: number | null;
  
  // Road frontage details
  road_frontages?: RoadFrontage[] | null;
  
  // Confidence indicators
  acreage_confidence?: ConfidenceLevel;
  geometry_confidence?: ConfidenceLevel;
  
  // Rural parcel identifiers (Texas-specific)
  abstract_number?: string | null;
  section_number?: string | null;
  tract_number?: string | null;
}

/**
 * Dual confidence tracking for lender-grade reports
 */
export interface DualConfidence {
  geometry_confidence: ConfidenceLevel;
  parcel_identity_confidence: ConfidenceLevel;
  report_grade: ReportGrade;
}

export interface AutoMatchResult {
  success: boolean;
  status: 'AUTO_SELECTED' | 'NEEDS_REVIEW' | 'NO_MATCH' | 'ERROR';
  selected_parcel_id: string | null;
  confidence: number;
  confidence_tier?: ConfidenceLevel;
  candidates: SurveyMatchCandidate[];
  extraction: SurveyExtraction;
  dual_confidence?: DualConfidence;
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
  // Enhanced fields
  gross_acreage?: number | null;
  net_acreage?: number | null;
  row_acreage?: number | null;
  geometry_confidence_level?: ConfidenceLevel;
  parcel_identity_confidence_level?: ConfidenceLevel;
  report_grade?: ReportGrade;
  created_at: string;
}
