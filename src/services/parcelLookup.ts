/**
 * Parcel Lookup Service
 * 
 * Unified client for parcel search and lookup operations.
 * Implements B-01 through B-07 API calls.
 */

import { supabase } from '@/integrations/supabase/client';

// ============= Types =============

export interface APNLookupParams {
  apn: string;
  county?: string;
  includeGeometry?: boolean;
  includeValuation?: boolean;
}

export interface ParcelResult {
  apn: string;
  owner: string;
  siteAddress: string;
  acreage: number;
  totalValue?: number;
  landValue?: number;
  improvementValue?: number;
  taxYear?: number;
  county: string;
  lat: number;
  lng: number;
  geometry?: GeoJSON.Polygon;
  source: string;
  dataTimestamp?: string;
  traceId?: string;
}

export interface ParcelAtPointParams {
  lat: number;
  lng: number;
  buffer?: number;
  includeAdjacent?: boolean;
}

export interface NearbyParcelsParams {
  center: { lat: number; lng: number } | { apn: string };
  radiusMeters: number;
  limit?: number;
  excludeCenter?: boolean;
}

export interface NearbyParcel {
  apn: string;
  owner: string;
  acreage: number;
  distanceMeters: number;
  bearing: string;
  siteAddress?: string;
}

export interface OwnerSearchParams {
  ownerName: string;
  county?: string;
  exactMatch?: boolean;
  limit?: number;
  offset?: number;
}

export interface OwnerSearchResult {
  apn: string;
  owner: string;
  siteAddress: string;
  acreage: number;
  totalValue: number;
  matchScore: number;
}

export interface RefreshResult {
  updated: boolean;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  dataTimestamp: string;
  source: string;
  stale: boolean;
  traceId: string;
}

// ============= API Functions =============

/**
 * B-01: Lookup parcel by APN/CAD number
 */
export async function lookupByAPN(params: APNLookupParams): Promise<ParcelResult | null> {
  const { data, error } = await supabase.functions.invoke('lookup-parcel-by-apn', {
    body: {
      apn: params.apn,
      county: params.county,
    },
  });

  if (error) {
    console.error('[parcelLookup] APN lookup error:', error);
    throw error;
  }

  if (!data?.parcel) {
    return null;
  }

  const p = data.parcel;
  return {
    apn: p.id || p.apn,
    owner: p.owner || '',
    siteAddress: p.address || p.siteAddress || '',
    acreage: p.acreage || 0,
    totalValue: p.totalValue || p.total_market_val,
    county: p.county || data.searched_county,
    lat: p.lat || 0,
    lng: p.lng || 0,
    geometry: p.geometry,
    source: 'lookup-parcel-by-apn',
    traceId: data.traceId,
  };
}

/**
 * B-02: Search parcels by address
 */
export async function searchByAddress(
  address: string,
  options?: { city?: string; zip?: string; county?: string; limit?: number }
): Promise<OwnerSearchResult[]> {
  const { data, error } = await supabase.functions.invoke('search-parcels', {
    body: {
      address,
      city: options?.city,
      zip: options?.zip,
      county: options?.county,
      limit: options?.limit || 5,
    },
  });

  if (error) {
    console.error('[parcelLookup] Address search error:', error);
    throw error;
  }

  return data?.parcels || [];
}

/**
 * B-03: Find parcel at coordinates (point-in-polygon)
 */
export async function findAtPoint(params: ParcelAtPointParams): Promise<ParcelResult | null> {
  const { data, error } = await supabase.functions.invoke('query-canonical-parcel', {
    body: {
      lat: params.lat,
      lng: params.lng,
      buffer: params.buffer,
      includeAdjacent: params.includeAdjacent,
    },
  });

  if (error) {
    console.error('[parcelLookup] Point query error:', error);
    throw error;
  }

  if (!data?.parcel) {
    return null;
  }

  const p = data.parcel;
  return {
    apn: p.source_parcel_id || p.apn,
    owner: p.owner_name || '',
    siteAddress: p.situs_address || '',
    acreage: p.acreage || 0,
    county: p.jurisdiction || '',
    lat: p.centroid?.coordinates?.[1] || params.lat,
    lng: p.centroid?.coordinates?.[0] || params.lng,
    geometry: p.geom || p.geometry,
    source: data.source,
    dataTimestamp: p.updated_at,
    traceId: data.traceId,
  };
}

/**
 * B-04: Fetch parcel GeoJSON for map display
 */
export async function fetchGeoJSON(
  params: { apn?: string; bbox?: [number, number, number, number]; zoom?: number }
): Promise<GeoJSON.FeatureCollection> {
  const { data, error } = await supabase.functions.invoke('fetch-parcels-geojson', {
    body: {
      bbox: params.bbox,
      zoom: params.zoom || 16,
      apn: params.apn,
    },
  });

  if (error) {
    console.error('[parcelLookup] GeoJSON fetch error:', error);
    throw error;
  }

  return data || { type: 'FeatureCollection', features: [] };
}

/**
 * B-05: Search parcels by owner name
 */
export async function searchByOwner(params: OwnerSearchParams): Promise<{
  parcels: OwnerSearchResult[];
  totalCount: number;
  hasMore: boolean;
}> {
  const { data, error } = await supabase.functions.invoke('search-parcels-by-owner', {
    body: params,
  });

  if (error) {
    console.error('[parcelLookup] Owner search error:', error);
    throw error;
  }

  return {
    parcels: data?.parcels || [],
    totalCount: data?.totalCount || 0,
    hasMore: data?.hasMore || false,
  };
}

/**
 * B-06: Find nearby parcels
 */
export async function findNearby(params: NearbyParcelsParams): Promise<{
  parcels: NearbyParcel[];
  centerCoords: { lat: number; lng: number };
}> {
  const { data, error } = await supabase.functions.invoke('nearby-parcels', {
    body: params,
  });

  if (error) {
    console.error('[parcelLookup] Nearby query error:', error);
    throw error;
  }

  return {
    parcels: data?.parcels || [],
    centerCoords: data?.centerCoords || { lat: 0, lng: 0 },
  };
}

/**
 * B-07: Refresh stale parcel data
 */
export async function refreshParcel(
  apn: string,
  county: string,
  forceRefresh?: boolean
): Promise<RefreshResult> {
  const { data, error } = await supabase.functions.invoke('refresh-parcel-data', {
    body: { apn, county, forceRefresh },
  });

  if (error) {
    console.error('[parcelLookup] Refresh error:', error);
    throw error;
  }

  return data;
}
