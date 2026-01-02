/**
 * React Hooks for Geocoding Operations
 * Provides declarative interface for geocoding with automatic caching via TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import {
  geocodeAddress,
  geocodeIntersection,
  reverseGeocode,
  batchGeocode,
  smartGeocode,
  normalizeQuery,
  type GeocodeParams,
  type GeocodeResponse,
  type IntersectionParams,
  type IntersectionResponse,
  type ReverseGeocodeParams,
  type ReverseGeocodeResponse,
  type BatchGeocodeAddress,
  type BatchGeocodeResponse,
} from '@/services/geocode';

// ============================================================================
// Query Keys
// ============================================================================

const GEOCODE_KEYS = {
  all: ['geocode'] as const,
  address: (query: string) => [...GEOCODE_KEYS.all, 'address', normalizeQuery(query)] as const,
  intersection: (street1: string, street2: string) => 
    [...GEOCODE_KEYS.all, 'intersection', normalizeQuery(`${street1}&${street2}`)] as const,
  reverse: (lat: number, lng: number) => 
    [...GEOCODE_KEYS.all, 'reverse', lat.toFixed(6), lng.toFixed(6)] as const,
  batch: () => [...GEOCODE_KEYS.all, 'batch'] as const,
};

// ============================================================================
// Address Geocoding Hook
// ============================================================================

export interface UseGeocodeOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

export function useGeocode(query: string, options: UseGeocodeOptions = {}) {
  const { enabled = true, staleTime = 1000 * 60 * 60, cacheTime = 1000 * 60 * 60 * 24 } = options;

  const normalizedQuery = useMemo(() => normalizeQuery(query), [query]);

  return useQuery({
    queryKey: GEOCODE_KEYS.address(normalizedQuery),
    queryFn: () => smartGeocode(query),
    enabled: enabled && normalizedQuery.length >= 3,
    staleTime,
    gcTime: cacheTime,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

// ============================================================================
// Intersection Geocoding Hook
// ============================================================================

export function useIntersectionGeocode(
  street1: string,
  street2: string,
  options: UseGeocodeOptions = {}
) {
  const { enabled = true, staleTime = 1000 * 60 * 60, cacheTime = 1000 * 60 * 60 * 24 } = options;

  return useQuery({
    queryKey: GEOCODE_KEYS.intersection(street1, street2),
    queryFn: () => geocodeIntersection({ street1, street2 }),
    enabled: enabled && street1.length >= 2 && street2.length >= 2,
    staleTime,
    gcTime: cacheTime,
    retry: 2,
  });
}

// ============================================================================
// Reverse Geocoding Hook
// ============================================================================

export interface UseReverseGeocodeOptions extends UseGeocodeOptions {
  resultTypes?: string[];
}

export function useReverseGeocode(
  lat: number | null,
  lng: number | null,
  options: UseReverseGeocodeOptions = {}
) {
  const { enabled = true, staleTime = 1000 * 60 * 60 * 24, cacheTime = 1000 * 60 * 60 * 24 * 7, resultTypes } = options;

  return useQuery({
    queryKey: lat !== null && lng !== null ? GEOCODE_KEYS.reverse(lat, lng) : ['geocode', 'reverse', 'null'],
    queryFn: () => reverseGeocode({ lat: lat!, lng: lng!, resultTypes }),
    enabled: enabled && lat !== null && lng !== null,
    staleTime,
    gcTime: cacheTime,
    retry: 2,
  });
}

// ============================================================================
// Batch Geocoding Hook
// ============================================================================

export interface UseBatchGeocodeOptions {
  maxConcurrency?: number;
  onSuccess?: (data: BatchGeocodeResponse) => void;
  onError?: (error: Error) => void;
}

export function useBatchGeocode(options: UseBatchGeocodeOptions = {}) {
  const { maxConcurrency = 5, onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (addresses: BatchGeocodeAddress[]) => batchGeocode(addresses, maxConcurrency),
    onSuccess: (data) => {
      // Cache individual results
      data.results.forEach((result) => {
        if (result.success && result.formattedAddress) {
          const queryKey = GEOCODE_KEYS.address(normalizeQuery(result.formattedAddress));
          queryClient.setQueryData(queryKey, {
            success: true,
            candidates: [{
              formattedAddress: result.formattedAddress,
              lat: result.lat,
              lng: result.lng,
              confidence: result.confidence,
              source: result.source,
            }],
            cacheHit: true,
            traceId: data.traceId,
            requestCost: 0,
          } as GeocodeResponse);
        }
      });

      onSuccess?.(data);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return {
    geocodeBatch: mutation.mutate,
    geocodeBatchAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    data: mutation.data,
    error: mutation.error,
    reset: mutation.reset,
  };
}

// ============================================================================
// Lazy Geocoding Hook (for on-demand geocoding)
// ============================================================================

export function useLazyGeocode() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<GeocodeResponse | null>(null);

  const geocode = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cached = queryClient.getQueryData<GeocodeResponse>(GEOCODE_KEYS.address(normalizeQuery(query)));
      if (cached) {
        setData(cached);
        setIsLoading(false);
        return cached;
      }

      const result = await smartGeocode(query);
      setData(result);

      // Cache the result
      queryClient.setQueryData(GEOCODE_KEYS.address(normalizeQuery(query)), result);

      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Unknown error');
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    geocode,
    isLoading,
    data,
    error,
    reset,
  };
}

// ============================================================================
// Lazy Reverse Geocoding Hook
// ============================================================================

export function useLazyReverseGeocode() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ReverseGeocodeResponse | null>(null);

  const geocode = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cached = queryClient.getQueryData<ReverseGeocodeResponse>(GEOCODE_KEYS.reverse(lat, lng));
      if (cached) {
        setData(cached);
        setIsLoading(false);
        return cached;
      }

      const result = await reverseGeocode({ lat, lng });
      setData(result);

      // Cache the result
      queryClient.setQueryData(GEOCODE_KEYS.reverse(lat, lng), result);

      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Unknown error');
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    reverseGeocode: geocode,
    isLoading,
    data,
    error,
    reset,
  };
}
