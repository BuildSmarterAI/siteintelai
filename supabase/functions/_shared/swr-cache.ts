// Stale-While-Revalidate Cache Implementation (F-02)
// Returns stale data immediately while refreshing in background
// Version: 1.0.0

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCacheEntry, setCacheEntry, TTL_HOURS } from './cache.ts';

export interface SWROptions {
  ttlHours: number;
  swrHours: number;  // Additional window after TTL where stale is acceptable
  provider: string;
  endpoint: string;
}

export interface SWRResult<T> {
  data: T;
  source: 'fresh' | 'stale' | 'fetched';
  age?: number;
  willRefresh: boolean;
}

/**
 * Get data with stale-while-revalidate strategy
 * 
 * Timeline:
 * |--- TTL (fresh) ---|--- SWR Window (stale OK) ---|--- Expired (refetch required) ---|
 * 
 * @param supabase - Supabase client
 * @param cacheKey - Unique cache key
 * @param fetcher - Function to fetch fresh data
 * @param options - SWR configuration
 */
export async function getWithSWR<T>(
  supabase: SupabaseClient,
  cacheKey: string,
  fetcher: () => Promise<T>,
  options: SWROptions
): Promise<SWRResult<T>> {
  const { ttlHours, swrHours, provider, endpoint } = options;

  // Check cache
  const cached = await getCacheEntry<T>(supabase, cacheKey);

  if (cached) {
    const now = Date.now();
    const createdAt = new Date(cached.created_at).getTime();
    const age = now - createdAt;
    
    const ttlMs = ttlHours * 3600 * 1000;
    const swrWindowMs = (ttlHours + swrHours) * 3600 * 1000;

    const isFresh = age < ttlMs;
    const isInSWRWindow = age < swrWindowMs;

    // Fresh data - return immediately
    if (isFresh) {
      return {
        data: cached.response,
        source: 'fresh',
        age,
        willRefresh: false,
      };
    }

    // Stale but within SWR window - return stale, refresh in background
    if (isInSWRWindow) {
      // Trigger background refresh
      const refreshPromise = refreshCache(supabase, cacheKey, fetcher, { provider, endpoint, ttlHours });
      
      // Use EdgeRuntime.waitUntil for async background processing
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
        EdgeRuntime.waitUntil(refreshPromise);
      }

      return {
        data: cached.response,
        source: 'stale',
        age,
        willRefresh: true,
      };
    }
  }

  // Cache miss or expired beyond SWR window - must fetch fresh
  const fresh = await fetcher();
  await setCacheEntry(supabase, cacheKey, fresh, { provider, endpoint, ttlHours });

  return {
    data: fresh,
    source: 'fetched',
    willRefresh: false,
  };
}

/**
 * Background cache refresh
 */
async function refreshCache<T>(
  supabase: SupabaseClient,
  cacheKey: string,
  fetcher: () => Promise<T>,
  config: { provider: string; endpoint: string; ttlHours: number }
): Promise<void> {
  try {
    console.log(`[SWR] Starting background refresh for ${cacheKey}`);
    const startTime = Date.now();
    
    const fresh = await fetcher();
    await setCacheEntry(supabase, cacheKey, fresh, config);
    
    const duration = Date.now() - startTime;
    console.log(`[SWR] Background refresh complete for ${cacheKey} (${duration}ms)`);
  } catch (error) {
    console.error(`[SWR] Background refresh failed for ${cacheKey}:`, error);
    // Don't throw - this is a background operation
  }
}

/**
 * Prefetch data into cache (useful for warming cache)
 */
export async function prefetch<T>(
  supabase: SupabaseClient,
  cacheKey: string,
  fetcher: () => Promise<T>,
  options: Pick<SWROptions, 'provider' | 'endpoint' | 'ttlHours'>
): Promise<void> {
  const cached = await getCacheEntry<T>(supabase, cacheKey);
  
  if (cached) {
    const now = Date.now();
    const expiresAt = new Date(cached.expires_at).getTime();
    
    // Only prefetch if cache is expired or will expire soon (within 10% of TTL)
    const ttlMs = options.ttlHours * 3600 * 1000;
    const refreshThreshold = expiresAt - (ttlMs * 0.1);
    
    if (now < refreshThreshold) {
      console.log(`[SWR] Skipping prefetch for ${cacheKey} - still fresh`);
      return;
    }
  }

  console.log(`[SWR] Prefetching ${cacheKey}`);
  const fresh = await fetcher();
  await setCacheEntry(supabase, cacheKey, fresh, options);
}

/**
 * Get default SWR options for a provider
 */
export function getDefaultSWROptions(provider: string, endpoint: string): SWROptions {
  const ttlHours = TTL_HOURS[provider] || 24;
  
  // SWR window is typically 50% of TTL, capped at 24 hours
  const swrHours = Math.min(ttlHours * 0.5, 24);

  return {
    ttlHours,
    swrHours,
    provider,
    endpoint,
  };
}

// Declare EdgeRuntime for TypeScript
declare const EdgeRuntime: { waitUntil?: (promise: Promise<unknown>) => void } | undefined;
