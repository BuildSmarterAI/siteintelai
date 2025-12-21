/**
 * Parcel Lock Utilities
 * Handles geometry hashing and persistence for verified parcels.
 * Ensures parcel integrity across the selection → feasibility flow.
 */

import type { SelectedParcel, CandidateParcel, ConfidenceLevel, ParcelSelectionInputMode, ParcelSource } from '@/types/parcelSelection';

const STORAGE_KEY = 'siteintel_locked_parcel';

/**
 * Generate SHA-256 hash of geometry for immutability verification.
 * This prevents parcel tampering after verification.
 */
export async function generateGeometryHash(geometry: GeoJSON.Geometry): Promise<string> {
  const encoder = new TextEncoder();
  // Canonical JSON stringify - sorted keys for consistency
  const canonical = JSON.stringify(geometry, Object.keys(geometry).sort());
  const data = encoder.encode(canonical);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate that a parcel's geometry hasn't changed since lock.
 */
export async function validateParcelIntegrity(parcel: SelectedParcel): Promise<boolean> {
  if (!parcel.geom || !parcel.geometry_hash) return false;
  
  const currentHash = await generateGeometryHash(parcel.geom);
  return currentHash === parcel.geometry_hash;
}

/**
 * Create a locked parcel from a verified candidate.
 */
export async function createLockedParcel(
  candidate: CandidateParcel,
  inputMethod: ParcelSelectionInputMode
): Promise<SelectedParcel> {
  if (!candidate.geom) {
    throw new Error('Cannot lock parcel without geometry');
  }

  const geometryHash = await generateGeometryHash(candidate.geom);
  
  return {
    parcel_id: candidate.parcel_id,
    county: candidate.county,
    source: candidate.source,
    geom: candidate.geom,
    acreage: candidate.acreage || 0,
    confidence: candidate.confidence,
    input_method: inputMethod,
    verification_timestamp: new Date().toISOString(),
    geometry_hash: geometryHash,
    situs_address: candidate.situs_address || undefined,
    owner_name: candidate.owner_name || undefined,
    zoning: candidate.zoning || undefined,
    market_value: candidate.market_value || undefined,
  };
}

/**
 * Persist locked parcel to localStorage for draft recovery.
 */
export function persistLockedParcel(parcel: SelectedParcel): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parcel));
  } catch (e) {
    console.error('[parcelLock] Failed to persist to localStorage:', e);
  }
}

/**
 * Retrieve locked parcel from localStorage.
 */
export function retrieveLockedParcel(): SelectedParcel | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as SelectedParcel;
  } catch (e) {
    console.error('[parcelLock] Failed to retrieve from localStorage:', e);
    return null;
  }
}

/**
 * Clear locked parcel from localStorage.
 */
export function clearLockedParcel(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('[parcelLock] Failed to clear localStorage:', e);
  }
}

/**
 * Generate URL params for sharing a locked parcel.
 */
export function generateParcelUrlParams(parcel: SelectedParcel): URLSearchParams {
  const params = new URLSearchParams();
  params.set('parcel', parcel.parcel_id);
  params.set('county', parcel.county);
  params.set('locked', 'true');
  params.set('hash', parcel.geometry_hash.substring(0, 12)); // Short hash for URL
  return params;
}

/**
 * Calculate confidence level from numeric score.
 */
export function scoreToConfidence(score: number): ConfidenceLevel {
  if (score >= 0.85) return 'high';
  if (score >= 0.6) return 'medium';
  return 'low';
}

/**
 * Determine parcel source from data origin.
 */
export function determineParcelSource(
  fromCanonical: boolean,
  fromExternal: boolean
): ParcelSource {
  if (fromCanonical && fromExternal) return 'mixed';
  if (fromCanonical) return 'canonical';
  return 'external';
}

/**
 * Convert search result to CandidateParcel format.
 */
export function searchResultToCandidate(
  result: {
    parcel_id: string;
    owner_name: string | null;
    acreage: number | null;
    situs_address: string | null;
    market_value: number | null;
    geometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  },
  county: string,
  confidence: number,
  source: ParcelSource = 'external'
): CandidateParcel {
  let centroid: { lat: number; lng: number } | undefined;
  
  // Calculate centroid from geometry
  if (result.geometry) {
    const coords = result.geometry.type === 'Polygon' 
      ? result.geometry.coordinates[0]
      : result.geometry.coordinates[0][0];
    
    if (coords && coords.length > 0) {
      const sumLat = coords.reduce((sum, c) => sum + c[1], 0);
      const sumLng = coords.reduce((sum, c) => sum + c[0], 0);
      centroid = {
        lat: sumLat / coords.length,
        lng: sumLng / coords.length,
      };
    }
  }
  
  return {
    parcel_id: result.parcel_id,
    county,
    source,
    geom: result.geometry || null,
    acreage: result.acreage,
    confidence: scoreToConfidence(confidence),
    situs_address: result.situs_address,
    owner_name: result.owner_name,
    zoning: null,
    market_value: result.market_value,
    centroid,
  };
}
