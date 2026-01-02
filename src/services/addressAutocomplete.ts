import { supabase } from '@/integrations/supabase/client';

export interface AddressComponents {
  streetNumber?: string;
  street?: string;
  city?: string;
  county?: string;
  state?: string;
  zip?: string;
}

export interface AutocompletePrediction {
  description: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  source: 'nominatim' | 'google';
  confidence: number;
  addressComponents?: AddressComponents;
}

export interface AutocompleteResponse {
  predictions: AutocompletePrediction[];
  provider: 'nominatim' | 'google' | 'none';
  cacheHit: boolean;
  traceId: string;
  requestCost: number;
  error?: string;
  retryAfter?: number;
}

export interface AutocompleteParams {
  input: string;
  sessionToken?: string;
  userId?: string;
  preferredProvider?: 'nominatim' | 'google' | 'auto';
  limit?: number;
}

// Session token management
let currentSessionToken: string | null = null;
let sessionTokenExpiry: number = 0;

export function generateSessionToken(): string {
  // Session tokens should be reused for a "session" (~3 minutes of typing)
  const now = Date.now();
  if (!currentSessionToken || now > sessionTokenExpiry) {
    currentSessionToken = crypto.randomUUID();
    sessionTokenExpiry = now + 3 * 60 * 1000; // 3 minute session
  }
  return currentSessionToken;
}

export function resetSessionToken(): void {
  currentSessionToken = null;
  sessionTokenExpiry = 0;
}

export function normalizeQuery(input: string): string {
  return input.toLowerCase().trim().replace(/\s+/g, ' ');
}

export async function fetchAutocompleteSuggestions(
  params: AutocompleteParams
): Promise<AutocompleteResponse> {
  const { 
    input, 
    sessionToken = generateSessionToken(),
    userId,
    preferredProvider = 'auto',
    limit = 5 
  } = params;

  // Validate input
  if (!input || input.trim().length < 3) {
    return {
      predictions: [],
      provider: 'none',
      cacheHit: false,
      traceId: '',
      requestCost: 0,
      error: 'Input must be at least 3 characters'
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('address-autocomplete', {
      body: {
        input: input.trim(),
        sessionToken,
        userId,
        preferredProvider,
        limit: Math.min(limit, 10)
      }
    });

    if (error) {
      console.error('[addressAutocomplete] Edge function error:', error);
      return {
        predictions: [],
        provider: 'none',
        cacheHit: false,
        traceId: '',
        requestCost: 0,
        error: error.message
      };
    }

    return data as AutocompleteResponse;
  } catch (err) {
    console.error('[addressAutocomplete] Network error:', err);
    return {
      predictions: [],
      provider: 'none',
      cacheHit: false,
      traceId: '',
      requestCost: 0,
      error: err instanceof Error ? err.message : 'Network error'
    };
  }
}

// Helper to detect input type
export function detectInputType(input: string): 'address' | 'intersection' | 'coordinates' | 'apn' | 'unknown' {
  const trimmed = input.trim();
  
  // Coordinates: "29.7604, -95.3698" or "29.7604 -95.3698"
  if (/^-?\d+\.?\d*[,\s]+-?\d+\.?\d*$/.test(trimmed)) {
    return 'coordinates';
  }
  
  // Intersection: "Main St & Oak Ave" or "Main St and Oak Ave"
  if (/\s+(&|and)\s+/i.test(trimmed)) {
    return 'intersection';
  }
  
  // APN/Parcel ID: alphanumeric with dashes (e.g., "123-456-789")
  if (/^[\dA-Z]+-[\dA-Z]+-[\dA-Z]+$/i.test(trimmed)) {
    return 'apn';
  }
  
  // Standard address starts with number
  if (/^\d+\s+\w/.test(trimmed)) {
    return 'address';
  }
  
  return 'unknown';
}
