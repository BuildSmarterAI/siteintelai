// Per-Provider Rate Limiting (F-03)
// Prevents 429 errors by tracking requests per minute
// Version: 1.0.0

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =============================================================================
// Rate Limit Configuration by Provider
// =============================================================================
export interface RateLimitConfig {
  requestsPerMinute: number;
  burstAllowed: number;  // Extra requests allowed in burst
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Google APIs
  google_geocoding: { requestsPerMinute: 50, burstAllowed: 10 },
  google_places: { requestsPerMinute: 60, burstAllowed: 15 },
  google_elevation: { requestsPerMinute: 100, burstAllowed: 20 },
  google_address_validation: { requestsPerMinute: 50, burstAllowed: 10 },
  
  // OSM (strict rate limit)
  nominatim: { requestsPerMinute: 60, burstAllowed: 1 },
  
  // Government APIs
  fema: { requestsPerMinute: 30, burstAllowed: 5 },
  epa_echo: { requestsPerMinute: 30, burstAllowed: 5 },
  usda: { requestsPerMinute: 30, burstAllowed: 5 },
  txdot: { requestsPerMinute: 100, burstAllowed: 20 },
  tea: { requestsPerMinute: 30, burstAllowed: 5 },
  
  // GIS Services
  arcgis: { requestsPerMinute: 100, burstAllowed: 20 },
  arcgis_hcad: { requestsPerMinute: 50, burstAllowed: 10 },
  arcgis_fbcad: { requestsPerMinute: 50, burstAllowed: 10 },
  
  // AI
  openai: { requestsPerMinute: 10, burstAllowed: 3 },
};

// =============================================================================
// Rate Limit Functions
// =============================================================================

/**
 * Get current minute key for rate limiting
 */
function getCurrentMinuteKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}-${now.getUTCMinutes()}`;
}

/**
 * Check if a request is allowed under rate limits
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  provider: string
): Promise<{ allowed: boolean; current: number; limit: number; retryAfterMs?: number }> {
  const config = RATE_LIMITS[provider];
  if (!config) {
    // Unknown provider - allow by default
    return { allowed: true, current: 0, limit: 1000 };
  }

  const minuteKey = getCurrentMinuteKey();
  const cacheKey = `rate:${provider}:${minuteKey}`;
  const limit = config.requestsPerMinute + config.burstAllowed;

  // Try to get current count
  const { data: cached } = await supabase
    .from('api_cache_universal')
    .select('response')
    .eq('cache_key', cacheKey)
    .single();

  const current = (cached?.response as number) || 0;

  if (current >= limit) {
    // Calculate retry after (ms until next minute)
    const now = new Date();
    const secondsRemaining = 60 - now.getSeconds();
    const retryAfterMs = secondsRemaining * 1000;

    return {
      allowed: false,
      current,
      limit,
      retryAfterMs,
    };
  }

  return { allowed: true, current, limit };
}

/**
 * Increment rate limit counter
 */
export async function incrementRateCounter(
  supabase: SupabaseClient,
  provider: string
): Promise<void> {
  const minuteKey = getCurrentMinuteKey();
  const cacheKey = `rate:${provider}:${minuteKey}`;

  // Upsert with increment
  const { data: existing } = await supabase
    .from('api_cache_universal')
    .select('response')
    .eq('cache_key', cacheKey)
    .single();

  const currentCount = (existing?.response as number) || 0;
  const expiresAt = new Date(Date.now() + 120000).toISOString(); // 2 min expiry

  await supabase
    .from('api_cache_universal')
    .upsert({
      cache_key: cacheKey,
      provider: 'rate_limit',
      endpoint: provider,
      response: currentCount + 1,
      expires_at: expiresAt,
    }, { onConflict: 'cache_key' });
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute function with rate limiting and retry on 429
 */
export async function withRateLimit<T>(
  supabase: SupabaseClient,
  provider: string,
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    baseDelayMs?: number;
    onRateLimited?: (attempt: number, retryAfterMs: number) => void;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 1000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Check rate limit before making request
    const { allowed, retryAfterMs } = await checkRateLimit(supabase, provider);

    if (!allowed) {
      if (attempt >= maxRetries) {
        throw new RateLimitError(provider, retryAfterMs || 60000);
      }

      const waitTime = retryAfterMs || (baseDelayMs * Math.pow(2, attempt));
      console.log(`[RateLimit] ${provider}: Rate limited, waiting ${waitTime}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      options?.onRateLimited?.(attempt, waitTime);
      await sleep(waitTime);
      continue;
    }

    try {
      // Increment counter before making request
      await incrementRateCounter(supabase, provider);
      
      return await fn();
    } catch (error) {
      // Check if it's a 429 error from the API
      const is429 = (error as { status?: number }).status === 429 ||
                    (error as { message?: string }).message?.includes('429') ||
                    (error as { message?: string }).message?.includes('rate limit');

      if (is429 && attempt < maxRetries) {
        const waitTime = baseDelayMs * Math.pow(2, attempt);
        console.log(`[RateLimit] ${provider}: Got 429, backing off ${waitTime}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        await sleep(waitTime);
        continue;
      }

      throw error;
    }
  }

  throw new RateLimitError(provider, 60000);
}

// =============================================================================
// Rate Limit Error
// =============================================================================
export class RateLimitError extends Error {
  public readonly provider: string;
  public readonly retryAfterMs: number;

  constructor(provider: string, retryAfterMs: number) {
    super(`Rate limit exceeded for ${provider}. Retry after ${Math.ceil(retryAfterMs / 1000)}s`);
    this.name = 'RateLimitError';
    this.provider = provider;
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Get rate limit status for a provider (for monitoring)
 */
export async function getRateLimitStatus(
  supabase: SupabaseClient,
  provider: string
): Promise<{
  provider: string;
  currentMinute: number;
  limit: number;
  remaining: number;
  percentUsed: number;
}> {
  const config = RATE_LIMITS[provider] || { requestsPerMinute: 100, burstAllowed: 20 };
  const limit = config.requestsPerMinute + config.burstAllowed;

  const minuteKey = getCurrentMinuteKey();
  const cacheKey = `rate:${provider}:${minuteKey}`;

  const { data } = await supabase
    .from('api_cache_universal')
    .select('response')
    .eq('cache_key', cacheKey)
    .single();

  const currentMinute = (data?.response as number) || 0;
  const remaining = Math.max(0, limit - currentMinute);
  const percentUsed = (currentMinute / limit) * 100;

  return {
    provider,
    currentMinute,
    limit,
    remaining,
    percentUsed,
  };
}
