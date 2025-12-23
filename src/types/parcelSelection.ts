/**
 * Parcel Selection Types
 * Strict type definitions for the verification-locked parcel selection flow.
 * This is the truth gate - no feasibility runs before lock.
 */

export type ParcelSelectionInputMode = 'address' | 'cross_streets' | 'cad';

export type ParcelSource = 'canonical' | 'external' | 'mixed';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface SelectedParcel {
  parcel_id: string;
  county: string;
  source: ParcelSource;
  geom: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  acreage: number;
  confidence: ConfidenceLevel;
  input_method: ParcelSelectionInputMode;
  verification_timestamp: string; // ISO date
  geometry_hash: string; // SHA-256 of geometry for immutability
  situs_address?: string;
  owner_name?: string;
  zoning?: string;
  market_value?: number;
}

export interface CandidateParcel {
  parcel_id: string;
  county: string;
  source: ParcelSource;
  geom: GeoJSON.Polygon | GeoJSON.MultiPolygon | null;
  acreage: number | null;
  confidence: ConfidenceLevel;
  situs_address: string | null;
  owner_name: string | null;
  zoning: string | null;
  market_value: number | null;
  // Scoring fields for ranking
  distance_from_query?: number; // meters
  overlap_percentage?: number; // for buffer queries
  thumbnail_bounds?: [number, number, number, number]; // bbox for mini-map
  // Centroid for map operations
  centroid?: { lat: number; lng: number };
}

export interface VerificationChecks {
  correctBoundary: boolean;
  locationMatches: boolean;
  understandsAnalysis: boolean;
}

// Timestamps for when each checkbox was checked
export interface CheckboxTimestamps {
  correctBoundary?: string; // ISO date
  locationMatches?: string; // ISO date
  understandsAnalysis?: string; // ISO date
}

export interface ParcelSelectionState {
  inputMode: ParcelSelectionInputMode;
  candidates: CandidateParcel[];
  selectedCandidate: CandidateParcel | null;
  isVerified: boolean;
  verificationChecks: VerificationChecks;
  checkboxTimestamps: CheckboxTimestamps;
  lockedParcel: SelectedParcel | null;
  warnings: string[];
  isLoading: boolean;
  error: string | null;
  // For low-confidence typed confirmation
  typedConfirmationPhrase: string;
  // Raw input for audit
  rawInput: string;
  // Map state for audit
  mapState?: {
    zoom: number;
    centerLat: number;
    centerLng: number;
  };
}

// Address search input
export interface AddressSearchInput {
  query: string;
  autoExpand?: boolean; // Expand radius from 50m to 150m if no results
}

// Cross-street search input  
export interface CrossStreetSearchInput {
  streetA: string;
  streetB: string;
  city?: string;
  county?: string;
  bufferFeet?: number; // Default 100, expandable to 250
}

// CAD/APN search input
export interface CADSearchInput {
  county: string;
  apn: string;
}

// County CAD format patterns for validation
export interface CADFormatConfig {
  pattern: RegExp;
  name: string;
  hint: string;
  example: string;
}

// Geocode result from search
export interface GeocodeResult {
  lat: number;
  lng: number;
  precision: 'rooftop' | 'range_interpolated' | 'geometric_center' | 'approximate';
  source: 'google' | 'nominatim' | 'texas_911' | 'overture';
  formatted_address: string;
}

// Search response from edge function
export interface ParcelSearchResponse {
  results: Array<{
    type: 'address' | 'cad' | 'intersection' | 'point';
    confidence: number;
    lat: number;
    lng: number;
    formatted_address: string;
    county?: string;
    parcel?: {
      parcel_id: string;
      owner_name: string | null;
      acreage: number | null;
      situs_address: string | null;
      market_value: number | null;
      geometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
    };
  }>;
  query: string;
  search_type: string;
}

// Verification audit log data
export interface VerificationAuditData {
  parcel_id: string;
  county: string;
  geometry_hash: string;
  geometry_wkt?: string;
  input_method: ParcelSelectionInputMode;
  raw_input: string;
  geocode_confidence: ConfidenceLevel;
  geocode_precision?: string;
  geocode_source?: string;
  candidate_count: number;
  candidates_presented: CandidateParcel[];
  warnings_shown: string[];
  checkbox_correct_boundary_at?: string;
  checkbox_location_matches_at?: string;
  checkbox_understands_analysis_at?: string;
  typed_confirmation_phrase?: string;
  user_agent: string;
  map_zoom_level?: number;
  map_center_lat?: number;
  map_center_lng?: number;
}

// Actions for the parcel selection reducer
export type ParcelSelectionAction =
  | { type: 'SET_INPUT_MODE'; mode: ParcelSelectionInputMode }
  | { type: 'SET_CANDIDATES'; candidates: CandidateParcel[] }
  | { type: 'SELECT_CANDIDATE'; candidate: CandidateParcel }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'UPDATE_VERIFICATION_CHECK'; check: keyof VerificationChecks; value: boolean; timestamp: string }
  | { type: 'LOCK_PARCEL'; parcel: SelectedParcel }
  | { type: 'UNLOCK_PARCEL' }
  | { type: 'ADD_WARNING'; warning: string }
  | { type: 'CLEAR_WARNINGS' }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_TYPED_CONFIRMATION'; phrase: string }
  | { type: 'SET_RAW_INPUT'; input: string }
  | { type: 'SET_MAP_STATE'; state: { zoom: number; centerLat: number; centerLng: number } }
  | { type: 'RESET' };
