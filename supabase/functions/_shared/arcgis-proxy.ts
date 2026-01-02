// ArcGIS Query Proxy with Retry Logic (F-04)
// Unified ArcGIS query wrapper with caching and error handling
// Version: 1.0.0

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCached, CACHE_KEYS, TTL_HOURS, type CacheResult } from './cache.ts';
import { withRateLimit } from './rate-limiter.ts';

// =============================================================================
// Types
// =============================================================================
export interface ArcGISQueryOptions {
  url: string;
  where?: string;
  geometry?: { x: number; y: number } | { rings: number[][][] } | { paths: number[][][] };
  geometryType?: 'esriGeometryPoint' | 'esriGeometryPolygon' | 'esriGeometryPolyline' | 'esriGeometryEnvelope';
  spatialRel?: 'esriSpatialRelIntersects' | 'esriSpatialRelContains' | 'esriSpatialRelWithin';
  outFields?: string;
  returnGeometry?: boolean;
  outSR?: number;  // Output spatial reference, default: 4326 (WGS84)
  inSR?: number;   // Input spatial reference
  distance?: number;  // Buffer distance
  units?: string;     // Distance units
  resultOffset?: number;
  resultRecordCount?: number;
  orderByFields?: string;
}

export interface ArcGISQueryResult<T = unknown> {
  features: Array<{
    attributes: T;
    geometry?: {
      x?: number;
      y?: number;
      rings?: number[][][];
      paths?: number[][][];
    };
  }>;
  exceededTransferLimit?: boolean;
  fields?: Array<{ name: string; type: string; alias?: string }>;
}

export interface ArcGISProxyResult<T> {
  data: ArcGISQueryResult<T>;
  cacheHit: boolean;
  traceId: string;
  executionMs: number;
}

// =============================================================================
// Error Classes
// =============================================================================
export class ArcGISError extends Error {
  public readonly code: number;
  public readonly details?: string;

  constructor(code: number, message: string, details?: string) {
    super(message);
    this.name = 'ArcGISError';
    this.code = code;
    this.details = details;
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Build query URL from options
 */
function buildQueryUrl(options: ArcGISQueryOptions): string {
  const url = new URL(options.url.endsWith('/query') ? options.url : `${options.url}/query`);
  
  // Set format
  url.searchParams.set('f', 'json');
  
  // Where clause
  url.searchParams.set('where', options.where || '1=1');
  
  // Output fields
  url.searchParams.set('outFields', options.outFields || '*');
  
  // Geometry
  url.searchParams.set('returnGeometry', String(options.returnGeometry ?? true));
  url.searchParams.set('outSR', String(options.outSR ?? 4326));
  
  if (options.geometry) {
    url.searchParams.set('geometry', JSON.stringify(options.geometry));
    url.searchParams.set('geometryType', options.geometryType || 'esriGeometryPoint');
    url.searchParams.set('spatialRel', options.spatialRel || 'esriSpatialRelIntersects');
    
    if (options.inSR) {
      url.searchParams.set('inSR', String(options.inSR));
    }
  }
  
  // Distance buffer
  if (options.distance) {
    url.searchParams.set('distance', String(options.distance));
    url.searchParams.set('units', options.units || 'esriSRUnit_Foot');
  }
  
  // Pagination
  if (options.resultOffset !== undefined) {
    url.searchParams.set('resultOffset', String(options.resultOffset));
  }
  if (options.resultRecordCount !== undefined) {
    url.searchParams.set('resultRecordCount', String(options.resultRecordCount));
  }
  
  // Ordering
  if (options.orderByFields) {
    url.searchParams.set('orderByFields', options.orderByFields);
  }

  return url.toString();
}

/**
 * Generate cache key from options
 */
function generateCacheKey(options: ArcGISQueryOptions): string {
  const parts = [
    options.url,
    options.where || '1=1',
    options.outFields || '*',
    options.geometry ? JSON.stringify(options.geometry) : '',
    options.distance || '',
  ];
  
  // Simple hash
  const str = parts.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  
  return `arcgis:v1:${Math.abs(hash).toString(16)}`;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate trace ID
 */
function generateTraceId(): string {
  return `arc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

// =============================================================================
// Main Query Function
// =============================================================================

/**
 * Query ArcGIS REST API with retry, caching, and error handling
 */
export async function queryArcGIS<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  options: ArcGISQueryOptions,
  cacheConfig?: {
    ttlHours?: number;
    skipCache?: boolean;
    provider?: string;
  }
): Promise<ArcGISProxyResult<T>> {
  const startTime = Date.now();
  const traceId = generateTraceId();
  const provider = cacheConfig?.provider || 'arcgis';
  
  console.log(`[ArcGIS] ${traceId}: Starting query to ${options.url}`);

  // Generate cache key
  const cacheKey = generateCacheKey(options);

  // Fetcher function
  const fetcher = async (): Promise<ArcGISQueryResult<T>> => {
    return await withRateLimit(supabase, provider, async () => {
      const url = buildQueryUrl(options);
      console.log(`[ArcGIS] ${traceId}: Fetching ${url.substring(0, 100)}...`);

      const response = await fetchWithRetry(url, {
        maxAttempts: 3,
        baseDelayMs: 1000,
        traceId,
      });

      const data = await response.json();

      // Check for ArcGIS error response
      if (data.error) {
        throw new ArcGISError(
          data.error.code || 500,
          data.error.message || 'Unknown ArcGIS error',
          data.error.details?.join(', ')
        );
      }

      return data as ArcGISQueryResult<T>;
    });
  };

  // Use cache if not skipped
  if (!cacheConfig?.skipCache) {
    const result = await getCached<ArcGISQueryResult<T>>(
      supabase,
      cacheKey,
      fetcher,
      {
        provider,
        endpoint: options.url,
        ttlHours: cacheConfig?.ttlHours || TTL_HOURS[provider] || 168, // 7 days default
      }
    );

    const executionMs = Date.now() - startTime;
    console.log(`[ArcGIS] ${traceId}: Complete (${result.source}, ${executionMs}ms, ${result.data.features?.length || 0} features)`);

    return {
      data: result.data,
      cacheHit: result.cacheHit,
      traceId,
      executionMs,
    };
  }

  // Skip cache - fetch directly
  const data = await fetcher();
  const executionMs = Date.now() - startTime;
  
  console.log(`[ArcGIS] ${traceId}: Complete (fresh, ${executionMs}ms, ${data.features?.length || 0} features)`);

  return {
    data,
    cacheHit: false,
    traceId,
    executionMs,
  };
}

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(
  url: string,
  options: {
    maxAttempts: number;
    baseDelayMs: number;
    traceId: string;
  }
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SiteIntel/1.0',
        },
      });

      // Handle server errors (5xx) with retry
      if (response.status >= 500 && attempt < options.maxAttempts) {
        const delay = options.baseDelayMs * Math.pow(2, attempt - 1);
        console.log(`[ArcGIS] ${options.traceId}: Server error ${response.status}, retrying in ${delay}ms (attempt ${attempt}/${options.maxAttempts})`);
        await sleep(delay);
        continue;
      }

      // Handle rate limiting
      if (response.status === 429 && attempt < options.maxAttempts) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10) * 1000;
        console.log(`[ArcGIS] ${options.traceId}: Rate limited, waiting ${retryAfter}ms`);
        await sleep(retryAfter);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < options.maxAttempts) {
        const delay = options.baseDelayMs * Math.pow(2, attempt - 1);
        console.log(`[ArcGIS] ${options.traceId}: Network error, retrying in ${delay}ms (attempt ${attempt}/${options.maxAttempts}):`, error);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Failed to fetch after all retries');
}

// =============================================================================
// Pagination Helper
// =============================================================================

/**
 * Query ArcGIS with automatic pagination for large result sets
 */
export async function queryArcGISPaginated<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  options: ArcGISQueryOptions,
  paginationConfig?: {
    pageSize?: number;
    maxPages?: number;
    ttlHours?: number;
  }
): Promise<{
  features: Array<{ attributes: T; geometry?: unknown }>;
  totalCount: number;
  pagesFetched: number;
  traceId: string;
}> {
  const pageSize = paginationConfig?.pageSize || 1000;
  const maxPages = paginationConfig?.maxPages || 10;
  const traceId = generateTraceId();
  
  const allFeatures: Array<{ attributes: T; geometry?: unknown }> = [];
  let offset = 0;
  let pagesFetched = 0;
  let hasMore = true;

  while (hasMore && pagesFetched < maxPages) {
    const result = await queryArcGIS<T>(supabase, {
      ...options,
      resultOffset: offset,
      resultRecordCount: pageSize,
    }, { ttlHours: paginationConfig?.ttlHours });

    allFeatures.push(...(result.data.features || []));
    pagesFetched++;

    // Check if there are more results
    hasMore = result.data.exceededTransferLimit === true || 
              (result.data.features?.length === pageSize);
    offset += pageSize;

    console.log(`[ArcGIS] ${traceId}: Page ${pagesFetched} fetched, ${allFeatures.length} total features`);
  }

  return {
    features: allFeatures,
    totalCount: allFeatures.length,
    pagesFetched,
    traceId,
  };
}

// =============================================================================
// Convenience Functions for Common Queries
// =============================================================================

/**
 * Query parcel by point (intersects)
 */
export async function queryParcelByPoint(
  supabase: SupabaseClient,
  serviceUrl: string,
  lat: number,
  lng: number,
  options?: { outFields?: string; ttlHours?: number }
): Promise<ArcGISProxyResult<unknown>> {
  return queryArcGIS(supabase, {
    url: serviceUrl,
    geometry: { x: lng, y: lat },
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: options?.outFields || '*',
    returnGeometry: true,
    outSR: 4326,
  }, { ttlHours: options?.ttlHours || 168 });
}

/**
 * Query features within distance of point
 */
export async function queryWithinDistance(
  supabase: SupabaseClient,
  serviceUrl: string,
  lat: number,
  lng: number,
  distanceFeet: number,
  options?: { outFields?: string; ttlHours?: number; where?: string }
): Promise<ArcGISProxyResult<unknown>> {
  return queryArcGIS(supabase, {
    url: serviceUrl,
    geometry: { x: lng, y: lat },
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    distance: distanceFeet,
    units: 'esriSRUnit_Foot',
    where: options?.where,
    outFields: options?.outFields || '*',
    returnGeometry: true,
    outSR: 4326,
  }, { ttlHours: options?.ttlHours || 168 });
}
