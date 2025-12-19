/**
 * Parcel Types
 * Core types for parcel data normalization across data sources.
 */

export type ParcelSource = 'hcad' | 'fbcad' | 'mcad' | 'vectorTile' | 'canonical' | 'drawn' | 'auto';

export interface NormalizedParcel {
  parcelId: string;
  apn: string | null;
  situsAddress: string | null;
  ownerName: string | null;
  acreage: number | null;
  areaSqft: number | null;
  county: string;
  city: string | null;
  zipCode: string | null;
  zoning: string | null;
  marketValue: number | null;
  legalDescription: string | null;
  landUseCode: string | null;
  yearBuilt: number | null;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | null;
  source: ParcelSource;
  centroid: { lat: number; lng: number } | null;
}

export interface ParcelSummary {
  id: string;
  address: string;
  acres: string;
  owner: string;
}

export interface CountyTileSource {
  id: string;
  name: string;
  state: string;
  /** ArcGIS MapServer base URL (without /export) */
  mapServerUrl: string;
  /** FeatureServer URL for click-to-query (can be same service or different) */
  featureServerUrl?: string;
  /** Layer ID within the service */
  layerId: number;
  /** Bounding box [west, south, east, north] in WGS84 */
  bounds: [number, number, number, number];
  /** Min zoom level to show tiles */
  minZoom: number;
  /** Max zoom level */
  maxZoom: number;
  /** Attribution text */
  attribution: string;
  /** Whether service is known to be active */
  isActive: boolean;
  /** Optional: specific fields to request */
  outFields?: string[];
}

export interface CountyBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}
