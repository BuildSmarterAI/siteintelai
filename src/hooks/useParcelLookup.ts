/**
 * Parcel Lookup Hooks
 * 
 * React hooks for parcel search and lookup operations.
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  lookupByAPN,
  searchByAddress,
  findAtPoint,
  fetchGeoJSON,
  searchByOwner,
  findNearby,
  refreshParcel,
  type APNLookupParams,
  type ParcelAtPointParams,
  type NearbyParcelsParams,
  type OwnerSearchParams,
} from '@/services/parcelLookup';

/**
 * B-01: Hook to lookup parcel by APN
 */
export function useParcelByAPN(apn: string | undefined, county?: string) {
  return useQuery({
    queryKey: ['parcel', 'apn', apn, county],
    queryFn: () => lookupByAPN({ apn: apn!, county }),
    enabled: !!apn && apn.length >= 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * B-02: Hook to search parcels by address
 */
export function useAddressSearch(
  address: string,
  options?: { city?: string; zip?: string; county?: string; limit?: number }
) {
  return useQuery({
    queryKey: ['parcel', 'address', address, options],
    queryFn: () => searchByAddress(address, options),
    enabled: !!address && address.length >= 3,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * B-03: Hook to find parcel at coordinates
 */
export function useParcelAtPoint(lat: number | undefined, lng: number | undefined, options?: {
  buffer?: number;
  includeAdjacent?: boolean;
}) {
  return useQuery({
    queryKey: ['parcel', 'point', lat, lng, options],
    queryFn: () => findAtPoint({ lat: lat!, lng: lng!, ...options }),
    enabled: lat !== undefined && lng !== undefined,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * B-04: Hook to fetch parcel GeoJSON for map
 */
export function useParcelGeoJSON(
  bbox: [number, number, number, number] | undefined,
  zoom: number
) {
  return useQuery({
    queryKey: ['parcel', 'geojson', bbox, zoom],
    queryFn: () => fetchGeoJSON({ bbox, zoom }),
    enabled: !!bbox && zoom >= 14,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * B-05: Hook to search parcels by owner name
 */
export function useOwnerSearch(params: OwnerSearchParams | null) {
  return useQuery({
    queryKey: ['parcel', 'owner', params?.ownerName, params?.county, params?.exactMatch],
    queryFn: () => searchByOwner(params!),
    enabled: !!params?.ownerName && params.ownerName.length >= 2,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * B-06: Hook to find nearby parcels
 */
export function useNearbyParcels(params: NearbyParcelsParams | null) {
  return useQuery({
    queryKey: ['parcel', 'nearby', params],
    queryFn: () => findNearby(params!),
    enabled: !!params && params.radiusMeters > 0,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * B-07: Hook to refresh parcel data (mutation)
 */
export function useRefreshParcel() {
  return useMutation({
    mutationFn: ({ apn, county, forceRefresh }: { apn: string; county: string; forceRefresh?: boolean }) =>
      refreshParcel(apn, county, forceRefresh),
  });
}

/**
 * Combined hook for parcel lookup with multiple strategies
 */
export function useParcelLookup(params: {
  apn?: string;
  lat?: number;
  lng?: number;
  county?: string;
}) {
  const { apn, lat, lng, county } = params;

  // Try APN first
  const apnQuery = useParcelByAPN(apn, county);

  // Fallback to point query if no APN
  const pointQuery = useParcelAtPoint(
    apnQuery.data === null ? lat : undefined,
    apnQuery.data === null ? lng : undefined
  );

  // Return the first successful result
  if (apnQuery.isLoading || apnQuery.data) {
    return {
      parcel: apnQuery.data,
      isLoading: apnQuery.isLoading,
      error: apnQuery.error,
      source: 'apn' as const,
    };
  }

  return {
    parcel: pointQuery.data,
    isLoading: pointQuery.isLoading,
    error: pointQuery.error,
    source: 'point' as const,
  };
}
