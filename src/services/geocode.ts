/**
 * Unified Geocode Service
 * Client-side interface for all geocoding operations
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// Types
// ============================================================================

export interface GeocodeParams {
  query: string;
  queryType?: 'address' | 'intersection' | 'poi';
  sessionId?: string;
  forceRefresh?: boolean;
}

export interface GeocodeCandidate {
  formattedAddress: string;
  lat: number;
  lng: number;
  placeId?: string;
  confidence: number;
  source: 'cache' | 'google' | 'nominatim' | 'mapbox';
  locationType?: string;
  addressComponents?: {
    streetNumber?: string;
    street?: string;
    city?: string;
    county?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

export interface GeocodeResponse {
  success: boolean;
  candidates: GeocodeCandidate[];
  cacheHit: boolean;
  traceId: string;
  upstreamProvider?: string;
  requestCost: number;
  error?: string;
}

export interface IntersectionParams {
  street1: string;
  street2: string;
  city?: string;
  state?: string;
  sessionId?: string;
}

export interface IntersectionResponse {
  success: boolean;
  lat: number;
  lng: number;
  formattedIntersection: string;
  confidence: number;
  source: 'cache' | 'google' | 'nominatim';
  nearestAddress?: string;
  traceId: string;
  cacheHit: boolean;
  requestCost: number;
  error?: string;
}

export interface ReverseGeocodeParams {
  lat: number;
  lng: number;
  resultTypes?: string[];
}

export interface ReverseGeocodeResponse {
  success: boolean;
  formattedAddress?: string;
  addressComponents?: {
    streetNumber?: string;
    street?: string;
    city: string;
    county: string;
    state: string;
    zip: string;
    country?: string;
  };
  confidence: number;
  source: 'cache' | 'google' | 'nominatim';
  traceId: string;
  cacheHit: boolean;
  requestCost: number;
  isOutsideTexas?: boolean;
  isWater?: boolean;
  error?: string;
}

export interface BatchGeocodeAddress {
  id: string;
  query: string;
}

export interface BatchGeocodeResult {
  id: string;
  success: boolean;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
  confidence?: number;
  source?: string;
  error?: string;
}

export interface BatchGeocodeResponse {
  results: BatchGeocodeResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    cacheHits: number;
    totalCost: number;
  };
  traceId: string;
  error?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique session ID for request correlation
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Normalize an address query for consistent caching
 */
export function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Check if a query looks like an intersection
 */
export function isIntersectionQuery(query: string): boolean {
  return /\s+(&|and|at|@)\s+/i.test(query);
}

/**
 * Parse intersection query into two street names
 */
export function parseIntersection(query: string): { street1: string; street2: string } | null {
  const match = query.match(/(.+?)\s+(?:&|and|at|@)\s+(.+)/i);
  if (match) {
    return {
      street1: match[1].trim(),
      street2: match[2].trim(),
    };
  }
  return null;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Geocode an address with multi-provider fallback
 */
export async function geocodeAddress(params: GeocodeParams): Promise<GeocodeResponse> {
  const { query, queryType = 'address' } = params;

  if (!query || query.trim().length < 3) {
    return {
      success: false,
      candidates: [],
      cacheHit: false,
      traceId: '',
      requestCost: 0,
      error: 'Query must be at least 3 characters',
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('geocode-with-cache', {
      body: {
        query: query.trim(),
        query_type: queryType,
      },
    });

    if (error) throw error;

    // Transform legacy response to new format
    if (data.lat && data.lng) {
      return {
        success: true,
        candidates: [{
          formattedAddress: data.formatted_address,
          lat: data.lat,
          lng: data.lng,
          confidence: data.confidence || 0.8,
          source: data.source || 'google',
        }],
        cacheHit: data.cache_hit || false,
        traceId: data.traceId || '',
        upstreamProvider: data.source,
        requestCost: data.requestCost || 0,
      };
    }

    // Handle error response
    return {
      success: false,
      candidates: [],
      cacheHit: false,
      traceId: data.traceId || '',
      requestCost: 0,
      error: data.error || 'Geocoding failed',
    };
  } catch (error) {
    console.error('[geocode] Error:', error);
    return {
      success: false,
      candidates: [],
      cacheHit: false,
      traceId: '',
      requestCost: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Geocode an intersection (cross-street)
 */
export async function geocodeIntersection(params: IntersectionParams): Promise<IntersectionResponse> {
  const { street1, street2, city = 'Houston', state = 'TX' } = params;

  const intersection = `${street1} & ${street2}`;

  try {
    const { data, error } = await supabase.functions.invoke('geocode-intersection', {
      body: { intersection },
    });

    if (error) throw error;

    return {
      success: !!data.lat,
      lat: data.lat,
      lng: data.lng,
      formattedIntersection: data.formatted_address || `${intersection}, ${city}, ${state}`,
      confidence: data.confidence || 0.8,
      source: data.source || 'google',
      traceId: data.traceId || '',
      cacheHit: data.cache_hit || false,
      requestCost: data.requestCost || 0,
      error: data.error,
    };
  } catch (error) {
    console.error('[geocodeIntersection] Error:', error);
    return {
      success: false,
      lat: 0,
      lng: 0,
      formattedIntersection: intersection,
      confidence: 0,
      source: 'google',
      traceId: '',
      cacheHit: false,
      requestCost: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(params: ReverseGeocodeParams): Promise<ReverseGeocodeResponse> {
  const { lat, lng, resultTypes } = params;

  try {
    const { data, error } = await supabase.functions.invoke('reverse-geocode', {
      body: { lat, lng, resultTypes },
    });

    if (error) throw error;

    return {
      success: data.success,
      formattedAddress: data.formattedAddress,
      addressComponents: data.addressComponents,
      confidence: data.confidence || 0,
      source: data.source || 'google',
      traceId: data.traceId || '',
      cacheHit: data.cacheHit || false,
      requestCost: data.requestCost || 0,
      isOutsideTexas: data.isOutsideTexas,
      isWater: data.isWater,
      error: data.error,
    };
  } catch (error) {
    console.error('[reverseGeocode] Error:', error);
    return {
      success: false,
      confidence: 0,
      source: 'google',
      traceId: '',
      cacheHit: false,
      requestCost: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch geocode multiple addresses
 */
export async function batchGeocode(
  addresses: BatchGeocodeAddress[],
  maxConcurrency?: number
): Promise<BatchGeocodeResponse> {
  if (!addresses || addresses.length === 0) {
    return {
      results: [],
      summary: { total: 0, successful: 0, failed: 0, cacheHits: 0, totalCost: 0 },
      traceId: '',
    };
  }

  if (addresses.length > 50) {
    return {
      results: [],
      summary: { total: addresses.length, successful: 0, failed: addresses.length, cacheHits: 0, totalCost: 0 },
      traceId: '',
      error: 'Maximum 50 addresses per request',
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('batch-geocode', {
      body: { 
        addresses,
        maxConcurrency: maxConcurrency || 5,
      },
    });

    if (error) throw error;

    return {
      results: data.results || [],
      summary: data.summary || { total: 0, successful: 0, failed: 0, cacheHits: 0, totalCost: 0 },
      traceId: data.traceId || '',
      error: data.error,
    };
  } catch (error) {
    console.error('[batchGeocode] Error:', error);
    return {
      results: [],
      summary: { total: addresses.length, successful: 0, failed: addresses.length, cacheHits: 0, totalCost: 0 },
      traceId: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Smart geocode - automatically routes to appropriate function based on query
 */
export async function smartGeocode(query: string): Promise<GeocodeResponse> {
  // Check if it looks like an intersection
  const parsed = parseIntersection(query);
  if (parsed) {
    const result = await geocodeIntersection(parsed);
    return {
      success: result.success,
      candidates: result.success ? [{
        formattedAddress: result.formattedIntersection,
        lat: result.lat,
        lng: result.lng,
        confidence: result.confidence,
        source: result.source,
      }] : [],
      cacheHit: result.cacheHit,
      traceId: result.traceId,
      requestCost: result.requestCost,
      error: result.error,
    };
  }

  // Default to address geocoding
  return geocodeAddress({ query });
}
