// Universal Cache Layer (F-01)
// Centralized caching for all external API calls
// Version: 1.0.0

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =============================================================================
// TTL Configuration by Provider
// =============================================================================
export const TTL_HOURS: Record<string, number> = {
  // Google APIs
  google_geocode: 720,        // 30 days
  google_places: 1,           // 1 hour (place details change)
  google_elevation: 720,      // 30 days
  google_address_validation: 720, // 30 days
  
  // Government APIs
  fema_flood: 2160,           // 90 days
  epa_echo: 168,              // 7 days
  usda_soil: 8760,            // 1 year (rarely changes)
  tea_schools: 4320,          // 180 days
  txdot_traffic: 720,         // 30 days
  
  // GIS Services
  arcgis_parcel: 168,         // 7 days
  arcgis_hcad: 168,           // 7 days
  arcgis_fbcad: 720,          // 30 days (annual updates)
  
  // Other
  usgs_elevation: 8760,       // 1 year
  nominatim: 720,             // 30 days
  openstreetmap: 168,         // 7 days
};

// =============================================================================
// Cache Key Generators
// =============================================================================
function sha256(input: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  // Simple hash for cache keys (not cryptographic)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export const CACHE_KEYS = {
  geocode: (query: string) => `geocode:v1:${sha256(query.toLowerCase().trim())}`,
  reverseGeocode: (lat: number, lng: number) => `rgeo:v1:${lat.toFixed(5)}:${lng.toFixed(5)}`,
  parcel: (apn: string, county: string) => `parcel:v1:${county.toLowerCase()}:${apn}`,
  parcelPoint: (lat: number, lng: number) => `parcel:v1:point:${lat.toFixed(6)}:${lng.toFixed(6)}`,
  flood: (lat: number, lng: number) => `flood:v1:${lat.toFixed(5)}:${lng.toFixed(5)}`,
  wetlands: (lat: number, lng: number) => `wetlands:v1:${lat.toFixed(5)}:${lng.toFixed(5)}`,
  elevation: (lat: number, lng: number) => `elev:v1:${lat.toFixed(6)}:${lng.toFixed(6)}`,
  traffic: (lat: number, lng: number, radius: number) => `traffic:v1:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}`,
  epa: (lat: number, lng: number, radius: number) => `epa:v1:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}`,
  soil: (lat: number, lng: number) => `soil:v1:${lat.toFixed(5)}:${lng.toFixed(5)}`,
  schools: (lat: number, lng: number) => `schools:v1:${lat.toFixed(4)}:${lng.toFixed(4)}`,
  zoning: (lat: number, lng: number, county: string) => `zoning:v1:${county}:${lat.toFixed(5)}:${lng.toFixed(5)}`,
  place: (placeId: string) => `place:v1:${placeId}`,
  usps: (address: string) => `usps:v1:${sha256(address.toLowerCase().trim())}`,
  utilities: (lat: number, lng: number, radius: number) => `utils:v1:${lat.toFixed(5)}:${lng.toFixed(5)}:${radius}`,
};

// =============================================================================
// Cache Entry Interface
// =============================================================================
interface CacheEntry<T = unknown> {
  id: string;
  cache_key: string;
  provider: string;
  endpoint: string;
  response: T;
  request_params?: Record<string, unknown>;
  created_at: string;
  expires_at: string;
  hit_count: number;
}

export interface CacheConfig {
  provider: string;
  endpoint: string;
  ttlHours?: number;
  swrHours?: number;  // Stale-while-revalidate window
}

export interface CacheResult<T> {
  data: T;
  cacheHit: boolean;
  stale: boolean;
  source: 'fresh' | 'stale' | 'fetched';
  cacheKey: string;
  age?: number;  // Age in milliseconds
}

// =============================================================================
// Core Cache Functions
// =============================================================================

/**
 * Get a cached entry by key
 */
export async function getCacheEntry<T>(
  supabase: SupabaseClient,
  cacheKey: string
): Promise<CacheEntry<T> | null> {
  const { data, error } = await supabase
    .from('api_cache_universal')
    .select('*')
    .eq('cache_key', cacheKey)
    .single();

  if (error || !data) return null;
  return data as CacheEntry<T>;
}

/**
 * Set a cache entry
 */
export async function setCacheEntry<T>(
  supabase: SupabaseClient,
  cacheKey: string,
  response: T,
  config: CacheConfig
): Promise<void> {
  const ttlHours = config.ttlHours || TTL_HOURS[config.provider] || 24;
  const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();

  await supabase
    .from('api_cache_universal')
    .upsert({
      cache_key: cacheKey,
      provider: config.provider,
      endpoint: config.endpoint,
      response,
      expires_at: expiresAt,
      hit_count: 0,
      created_at: new Date().toISOString(),
    }, { onConflict: 'cache_key' });
}

/**
 * Increment hit count for a cache entry
 */
export async function incrementCacheHit(
  supabase: SupabaseClient,
  cacheKey: string
): Promise<void> {
  await supabase.rpc('increment_cache_hit', { p_cache_key: cacheKey }).catch(() => {
    // Fallback if RPC doesn't exist
    supabase
      .from('api_cache_universal')
      .update({ hit_count: supabase.rpc('increment_field', { field: 'hit_count' }) })
      .eq('cache_key', cacheKey);
  });
}

/**
 * Delete a cache entry
 */
export async function deleteCacheEntry(
  supabase: SupabaseClient,
  cacheKey: string
): Promise<void> {
  await supabase
    .from('api_cache_universal')
    .delete()
    .eq('cache_key', cacheKey);
}

/**
 * Main cache getter with SWR support
 */
export async function getCached<T>(
  supabase: SupabaseClient,
  cacheKey: string,
  fetcher: () => Promise<T>,
  config: CacheConfig
): Promise<CacheResult<T>> {
  const ttlHours = config.ttlHours || TTL_HOURS[config.provider] || 24;
  const swrHours = config.swrHours || ttlHours * 0.5; // Default SWR window is 50% of TTL

  // Check cache first
  const cached = await getCacheEntry<T>(supabase, cacheKey);

  if (cached) {
    const now = Date.now();
    const createdAt = new Date(cached.created_at).getTime();
    const expiresAt = new Date(cached.expires_at).getTime();
    const age = now - createdAt;
    const isFresh = now < expiresAt;
    const isInSWRWindow = now < expiresAt + swrHours * 3600 * 1000;

    // Fresh cache hit
    if (isFresh) {
      // Increment hit count in background
      incrementCacheHit(supabase, cacheKey).catch(() => {});
      
      return {
        data: cached.response,
        cacheHit: true,
        stale: false,
        source: 'fresh',
        cacheKey,
        age,
      };
    }

    // Stale but within SWR window - return stale, refresh in background
    if (isInSWRWindow) {
      // Background refresh using EdgeRuntime.waitUntil if available
      const refreshPromise = (async () => {
        try {
          const fresh = await fetcher();
          await setCacheEntry(supabase, cacheKey, fresh, config);
          console.log(`[Cache] Background refresh complete for ${cacheKey}`);
        } catch (e) {
          console.error(`[Cache] Background refresh failed for ${cacheKey}:`, e);
        }
      })();

      // Try to use EdgeRuntime.waitUntil for background processing
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
        EdgeRuntime.waitUntil(refreshPromise);
      }

      return {
        data: cached.response,
        cacheHit: true,
        stale: true,
        source: 'stale',
        cacheKey,
        age,
      };
    }
  }

  // Cache miss or beyond SWR window - fetch fresh
  const fresh = await fetcher();
  await setCacheEntry(supabase, cacheKey, fresh, config);

  return {
    data: fresh,
    cacheHit: false,
    stale: false,
    source: 'fetched',
    cacheKey,
  };
}

/**
 * Log cache operation to api_logs
 */
export async function logCacheOperation(
  supabase: SupabaseClient,
  config: CacheConfig,
  cacheHit: boolean,
  durationMs: number,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  await supabase.from('api_logs').insert({
    source: config.provider,
    endpoint: config.endpoint,
    cache_key: cacheHit ? 'HIT' : 'MISS',
    duration_ms: durationMs,
    success,
    error_message: errorMessage,
  }).catch(() => {}); // Don't fail on log errors
}

// Declare EdgeRuntime for TypeScript
declare const EdgeRuntime: { waitUntil?: (promise: Promise<unknown>) => void } | undefined;
