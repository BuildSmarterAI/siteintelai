/**
 * Geocoding Error Types - P4
 * Structured error types and recovery actions
 */

export type GeocodingErrorType = 
  | 'ADDRESS_NOT_FOUND'
  | 'AMBIGUOUS_ADDRESS'
  | 'OUTSIDE_COVERAGE'
  | 'PARCEL_NOT_FOUND'
  | 'GEOCODE_FAILED'
  | 'NETWORK_ERROR'
  | 'LOW_CONFIDENCE'
  | 'INVALID_FORMAT'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE';

export type RecoveryActionType = 
  | 'SEARCH_BY_APN'
  | 'DRAW_BOUNDARY'
  | 'TRY_INTERSECTION'
  | 'REFINE_ADDRESS'
  | 'CHECK_SPELLING'
  | 'ADD_CITY_STATE'
  | 'CONTACT_SUPPORT'
  | 'RETRY'
  | 'USE_DIFFERENT_ADDRESS';

export interface RecoveryAction {
  type: RecoveryActionType;
  label: string;
  description: string;
  icon: string; // Lucide icon name
  primary?: boolean;
}

export interface GeocodingError {
  type: GeocodingErrorType;
  title: string;
  message: string;
  details?: string;
  suggestions: RecoveryAction[];
  severity: 'warning' | 'error' | 'info';
}

export interface GeocodingErrorContext {
  query: string;
  searchMode?: 'address' | 'apn' | 'coordinates' | 'intersection';
  county?: string;
  attemptCount?: number;
  lastError?: string;
}
