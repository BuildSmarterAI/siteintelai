/**
 * Error Recovery Mapping - P4
 * Maps geocoding errors to actionable recovery suggestions
 */

import type { 
  GeocodingError, 
  GeocodingErrorType, 
  GeocodingErrorContext,
  RecoveryAction 
} from '@/types/geocodingErrors';

// Recovery action definitions
const RECOVERY_ACTIONS: Record<string, RecoveryAction> = {
  SEARCH_BY_APN: {
    type: 'SEARCH_BY_APN',
    label: 'Search by Parcel ID',
    description: 'Use the property\'s APN/account number instead',
    icon: 'Hash',
    primary: true,
  },
  DRAW_BOUNDARY: {
    type: 'DRAW_BOUNDARY',
    label: 'Draw on Map',
    description: 'Manually draw the property boundary',
    icon: 'PenTool',
    primary: true,
  },
  TRY_INTERSECTION: {
    type: 'TRY_INTERSECTION',
    label: 'Search by Intersection',
    description: 'Use nearby cross streets to locate',
    icon: 'Navigation',
  },
  REFINE_ADDRESS: {
    type: 'REFINE_ADDRESS',
    label: 'Refine Address',
    description: 'Add more details like unit number or building name',
    icon: 'Edit',
  },
  CHECK_SPELLING: {
    type: 'CHECK_SPELLING',
    label: 'Check Spelling',
    description: 'Verify street name and city spelling',
    icon: 'SpellCheck',
  },
  ADD_CITY_STATE: {
    type: 'ADD_CITY_STATE',
    label: 'Add City & State',
    description: 'Include city and state for better accuracy',
    icon: 'MapPin',
  },
  CONTACT_SUPPORT: {
    type: 'CONTACT_SUPPORT',
    label: 'Contact Support',
    description: 'Get help from our team',
    icon: 'MessageCircle',
  },
  RETRY: {
    type: 'RETRY',
    label: 'Try Again',
    description: 'Retry the search',
    icon: 'RefreshCw',
  },
  USE_DIFFERENT_ADDRESS: {
    type: 'USE_DIFFERENT_ADDRESS',
    label: 'Try Different Address',
    description: 'Use an alternative or neighboring address',
    icon: 'ArrowRight',
  },
};

// Error type to recovery actions mapping
const ERROR_RECOVERY_MAP: Record<GeocodingErrorType, {
  title: string;
  message: string;
  severity: 'warning' | 'error' | 'info';
  actions: string[]; // Keys from RECOVERY_ACTIONS
}> = {
  ADDRESS_NOT_FOUND: {
    title: 'Address Not Found',
    message: 'We couldn\'t locate this address in our database.',
    severity: 'warning',
    actions: ['CHECK_SPELLING', 'ADD_CITY_STATE', 'SEARCH_BY_APN', 'TRY_INTERSECTION', 'DRAW_BOUNDARY'],
  },
  AMBIGUOUS_ADDRESS: {
    title: 'Multiple Matches Found',
    message: 'This address matches multiple locations. Please be more specific.',
    severity: 'info',
    actions: ['REFINE_ADDRESS', 'ADD_CITY_STATE', 'SEARCH_BY_APN'],
  },
  OUTSIDE_COVERAGE: {
    title: 'Outside Coverage Area',
    message: 'This location is outside our current Texas coverage area.',
    severity: 'error',
    actions: ['USE_DIFFERENT_ADDRESS', 'CONTACT_SUPPORT'],
  },
  PARCEL_NOT_FOUND: {
    title: 'Parcel Not Found',
    message: 'No parcel data found at this location.',
    severity: 'warning',
    actions: ['SEARCH_BY_APN', 'DRAW_BOUNDARY', 'TRY_INTERSECTION'],
  },
  GEOCODE_FAILED: {
    title: 'Geocoding Failed',
    message: 'We couldn\'t process the address. Please check the format.',
    severity: 'error',
    actions: ['CHECK_SPELLING', 'ADD_CITY_STATE', 'RETRY'],
  },
  NETWORK_ERROR: {
    title: 'Connection Error',
    message: 'Unable to reach our servers. Please check your connection.',
    severity: 'error',
    actions: ['RETRY', 'CONTACT_SUPPORT'],
  },
  LOW_CONFIDENCE: {
    title: 'Low Confidence Match',
    message: 'The location match has low confidence. Please verify.',
    severity: 'warning',
    actions: ['REFINE_ADDRESS', 'SEARCH_BY_APN', 'DRAW_BOUNDARY'],
  },
  INVALID_FORMAT: {
    title: 'Invalid Format',
    message: 'The input format is not recognized.',
    severity: 'warning',
    actions: ['CHECK_SPELLING', 'REFINE_ADDRESS'],
  },
  RATE_LIMITED: {
    title: 'Too Many Requests',
    message: 'Please wait a moment before trying again.',
    severity: 'info',
    actions: ['RETRY'],
  },
  SERVICE_UNAVAILABLE: {
    title: 'Service Temporarily Unavailable',
    message: 'Our geocoding service is temporarily down.',
    severity: 'error',
    actions: ['RETRY', 'SEARCH_BY_APN', 'DRAW_BOUNDARY', 'CONTACT_SUPPORT'],
  },
};

/**
 * Map an error type to a structured error with recovery suggestions
 */
export function mapErrorToRecovery(
  errorType: GeocodingErrorType,
  context?: GeocodingErrorContext
): GeocodingError {
  const mapping = ERROR_RECOVERY_MAP[errorType];
  
  // Build suggestions from action keys
  const suggestions: RecoveryAction[] = mapping.actions
    .map(key => RECOVERY_ACTIONS[key])
    .filter(Boolean);
  
  // Customize message based on context
  let message = mapping.message;
  let details: string | undefined;
  
  if (context?.query) {
    details = `Searched: "${context.query}"`;
  }
  
  if (context?.attemptCount && context.attemptCount > 1) {
    details = `${details || ''} (Attempt ${context.attemptCount})`.trim();
  }
  
  return {
    type: errorType,
    title: mapping.title,
    message,
    details,
    suggestions,
    severity: mapping.severity,
  };
}

/**
 * Parse an error message and determine the error type
 */
export function parseErrorMessage(error: string | Error): GeocodingErrorType {
  const message = typeof error === 'string' ? error.toLowerCase() : error.message.toLowerCase();
  
  if (message.includes('not found') || message.includes('no results')) {
    return 'ADDRESS_NOT_FOUND';
  }
  if (message.includes('ambiguous') || message.includes('multiple')) {
    return 'AMBIGUOUS_ADDRESS';
  }
  if (message.includes('outside') || message.includes('coverage')) {
    return 'OUTSIDE_COVERAGE';
  }
  if (message.includes('parcel')) {
    return 'PARCEL_NOT_FOUND';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'NETWORK_ERROR';
  }
  if (message.includes('confidence') || message.includes('approximate')) {
    return 'LOW_CONFIDENCE';
  }
  if (message.includes('format') || message.includes('invalid')) {
    return 'INVALID_FORMAT';
  }
  if (message.includes('rate') || message.includes('limit') || message.includes('429')) {
    return 'RATE_LIMITED';
  }
  if (message.includes('unavailable') || message.includes('503') || message.includes('500')) {
    return 'SERVICE_UNAVAILABLE';
  }
  
  return 'GEOCODE_FAILED';
}

/**
 * Get recovery actions for a raw error
 */
export function getRecoveryForError(
  error: string | Error,
  context?: GeocodingErrorContext
): GeocodingError {
  const errorType = parseErrorMessage(error);
  return mapErrorToRecovery(errorType, context);
}
