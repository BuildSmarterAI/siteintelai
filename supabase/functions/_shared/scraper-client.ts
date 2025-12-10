/**
 * ScraperAPI Client for SiteIntel GIS Data Ingestion
 * Provides tiered fetch strategy: direct -> scraper fallback -> primary scraper
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SCRAPER_API_BASE = "https://api.scraperapi.com";

export interface ScraperConfig {
  render?: boolean;           // Enable JavaScript rendering
  country_code?: string;      // Geo-targeting (default: 'us')
  premium?: boolean;          // Use residential proxies
  session_number?: number;    // Sticky sessions for multi-page
  device_type?: 'desktop' | 'mobile';
  keep_headers?: boolean;     // Preserve original headers
}

export interface SmartFetchOptions {
  scraperMode?: 'disabled' | 'fallback' | 'primary';
  scraperConfig?: ScraperConfig;
  timeout?: number;
  retries?: number;
  mapServerId?: string;
  endpointType?: string;
  cacheTtlHours?: number;
}

export interface FetchResult {
  data: any;
  source: 'direct' | 'scraper' | 'cache';
  responseTimeMs: number;
  apiCreditsUsed: number;
}

/**
 * Generate SHA-256 hash for URL caching
 */
async function hashUrl(url: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(url);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check cache for existing response
 */
async function checkCache(supabase: any, urlHash: string): Promise<{ hit: boolean; data?: any }> {
  try {
    const { data, error } = await supabase
      .from('scraper_cache')
      .select('response_body, expires_at')
      .eq('url_hash', urlHash)
      .single();
    
    if (error || !data) return { hit: false };
    
    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      return { hit: false };
    }
    
    return { hit: true, data: JSON.parse(data.response_body) };
  } catch {
    return { hit: false };
  }
}

/**
 * Store response in cache
 */
async function storeInCache(
  supabase: any, 
  url: string, 
  urlHash: string, 
  responseBody: any, 
  ttlHours: number = 24,
  apiCredits: number = 1
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);
    
    await supabase
      .from('scraper_cache')
      .upsert({
        url_hash: urlHash,
        url,
        response_body: JSON.stringify(responseBody),
        content_type: 'application/json',
        api_credits_used: apiCredits,
        expires_at: expiresAt.toISOString(),
        scraped_at: new Date().toISOString()
      }, { onConflict: 'url_hash' });
  } catch (err) {
    console.warn('[ScraperClient] Failed to store in cache:', err);
  }
}

/**
 * Log scraper usage for cost tracking
 */
async function logUsage(
  supabase: any,
  url: string,
  options: SmartFetchOptions,
  result: { status: number; timeMs: number; cacheHit: boolean; credits: number; error?: string }
): Promise<void> {
  try {
    await supabase
      .from('scraper_usage_log')
      .insert({
        url,
        endpoint_type: options.endpointType || 'gis',
        map_server_id: options.mapServerId || null,
        scraper_mode: options.scraperMode || 'fallback',
        api_credits_used: result.credits,
        response_status: result.status,
        response_time_ms: result.timeMs,
        cache_hit: result.cacheHit,
        error_message: result.error || null
      });
  } catch (err) {
    console.warn('[ScraperClient] Failed to log usage:', err);
  }
}

/**
 * Direct fetch without ScraperAPI
 */
async function directFetch(url: string, timeout: number = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SiteIntel-GIS-Fetcher/1.0',
        'Accept': 'application/json, application/geo+json'
      }
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch through ScraperAPI proxy
 */
async function scraperFetch(url: string, config: ScraperConfig = {}): Promise<Response> {
  const apiKey = Deno.env.get('SCRAPERAPI_KEY');
  if (!apiKey) {
    throw new Error('SCRAPERAPI_KEY not configured');
  }
  
  const params = new URLSearchParams({
    api_key: apiKey,
    url: url,
    country_code: config.country_code || 'us'
  });
  
  if (config.render) params.append('render', 'true');
  if (config.premium) params.append('premium', 'true');
  if (config.session_number) params.append('session_number', config.session_number.toString());
  if (config.device_type) params.append('device_type', config.device_type);
  if (config.keep_headers) params.append('keep_headers', 'true');
  
  const scraperUrl = `${SCRAPER_API_BASE}?${params.toString()}`;
  
  const response = await fetch(scraperUrl, {
    headers: {
      'Accept': 'application/json, application/geo+json'
    }
  });
  
  return response;
}

/**
 * Smart fetch with tiered strategy based on scraper_mode
 * - 'disabled': Direct fetch only
 * - 'fallback': Try direct first, fallback to scraper on failure
 * - 'primary': Use scraper as primary method
 */
export async function smartFetch(
  url: string,
  options: SmartFetchOptions = {}
): Promise<FetchResult> {
  const startTime = Date.now();
  const mode = options.scraperMode || 'fallback';
  const timeout = options.timeout || 30000;
  const retries = options.retries || 3;
  
  // Initialize Supabase client for caching
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const urlHash = await hashUrl(url);
  
  // Check cache first (for non-disabled modes)
  if (mode !== 'disabled') {
    const cached = await checkCache(supabase, urlHash);
    if (cached.hit) {
      console.log(`[ScraperClient] Cache hit for: ${url.substring(0, 80)}...`);
      await logUsage(supabase, url, options, { 
        status: 200, 
        timeMs: Date.now() - startTime, 
        cacheHit: true, 
        credits: 0 
      });
      return {
        data: cached.data,
        source: 'cache',
        responseTimeMs: Date.now() - startTime,
        apiCreditsUsed: 0
      };
    }
  }
  
  let lastError: Error | null = null;
  
  // Strategy based on mode
  if (mode === 'primary') {
    // Primary mode: Use scraper directly
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[ScraperClient] Scraper primary fetch attempt ${attempt}/${retries}: ${url.substring(0, 80)}...`);
        const response = await scraperFetch(url, options.scraperConfig);
        
        if (response.ok) {
          const data = await response.json();
          const timeMs = Date.now() - startTime;
          
          await storeInCache(supabase, url, urlHash, data, options.cacheTtlHours || 24, 1);
          await logUsage(supabase, url, options, { status: response.status, timeMs, cacheHit: false, credits: 1 });
          
          return { data, source: 'scraper', responseTimeMs: timeMs, apiCreditsUsed: 1 };
        }
        
        lastError = new Error(`Scraper returned ${response.status}`);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`[ScraperClient] Scraper attempt ${attempt} failed:`, lastError.message);
        
        // Exponential backoff
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
        }
      }
    }
  } else {
    // Disabled or Fallback mode: Try direct first
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[ScraperClient] Direct fetch attempt ${attempt}/${retries}: ${url.substring(0, 80)}...`);
        const response = await directFetch(url, timeout);
        
        if (response.ok) {
          const data = await response.json();
          const timeMs = Date.now() - startTime;
          
          // Cache successful direct fetches too
          if (mode !== 'disabled') {
            await storeInCache(supabase, url, urlHash, data, options.cacheTtlHours || 24, 0);
          }
          await logUsage(supabase, url, options, { status: response.status, timeMs, cacheHit: false, credits: 0 });
          
          return { data, source: 'direct', responseTimeMs: timeMs, apiCreditsUsed: 0 };
        }
        
        // On 403/429/5xx, break early for fallback
        if (mode === 'fallback' && [403, 429, 500, 502, 503, 504].includes(response.status)) {
          console.log(`[ScraperClient] Direct fetch returned ${response.status}, attempting scraper fallback...`);
          break;
        }
        
        lastError = new Error(`Direct fetch returned ${response.status}`);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`[ScraperClient] Direct attempt ${attempt} failed:`, lastError.message);
        
        // For fallback mode, break on DNS/timeout errors to try scraper
        if (mode === 'fallback' && (lastError.name === 'AbortError' || lastError.message.includes('DNS'))) {
          console.log(`[ScraperClient] Direct fetch error (${lastError.name}), attempting scraper fallback...`);
          break;
        }
        
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    // Fallback to scraper if mode allows
    if (mode === 'fallback') {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`[ScraperClient] Scraper fallback attempt ${attempt}/${retries}: ${url.substring(0, 80)}...`);
          const response = await scraperFetch(url, options.scraperConfig);
          
          if (response.ok) {
            const data = await response.json();
            const timeMs = Date.now() - startTime;
            
            await storeInCache(supabase, url, urlHash, data, options.cacheTtlHours || 24, 1);
            await logUsage(supabase, url, options, { status: response.status, timeMs, cacheHit: false, credits: 1 });
            
            return { data, source: 'scraper', responseTimeMs: timeMs, apiCreditsUsed: 1 };
          }
          
          lastError = new Error(`Scraper fallback returned ${response.status}`);
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.warn(`[ScraperClient] Scraper fallback attempt ${attempt} failed:`, lastError.message);
          
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
          }
        }
      }
    }
  }
  
  // All attempts failed
  const timeMs = Date.now() - startTime;
  await logUsage(supabase, url, options, { 
    status: 0, 
    timeMs, 
    cacheHit: false, 
    credits: mode === 'primary' ? 1 : 0,
    error: lastError?.message 
  });
  
  throw lastError || new Error('All fetch attempts failed');
}

/**
 * Batch fetch multiple URLs with smart strategy
 */
export async function batchSmartFetch(
  urls: string[],
  options: SmartFetchOptions = {},
  concurrency: number = 3
): Promise<Map<string, FetchResult | Error>> {
  const results = new Map<string, FetchResult | Error>();
  
  // Process in batches
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const promises = batch.map(async (url) => {
      try {
        const result = await smartFetch(url, options);
        results.set(url, result);
      } catch (err) {
        results.set(url, err instanceof Error ? err : new Error(String(err)));
      }
    });
    
    await Promise.all(promises);
  }
  
  return results;
}

export default { smartFetch, batchSmartFetch };
