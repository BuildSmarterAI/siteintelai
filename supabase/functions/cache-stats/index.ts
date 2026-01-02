// Cache Statistics Endpoint (F-07)
// Exposes cache performance metrics for monitoring
// Version: 1.0.0

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { isEmergencyMode } from '../_shared/emergency-mode.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CacheStatsResponse {
  totalEntries: number;
  totalSizeBytes: number;
  hitRate: {
    last1h: number;
    last24h: number;
    last7d: number;
  };
  byProvider: Array<{
    provider: string;
    entries: number;
    hitRate: number;
    avgAgeHours: number;
    oldestEntry: string | null;
  }>;
  staleEntries: number;
  expiringIn24h: number;
  emergencyModeActive: boolean;
  traceId: string;
}

function generateTraceId(): string {
  return `cst-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = generateTraceId();
  const startTime = Date.now();

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log(`[CacheStats] ${traceId}: Fetching cache statistics`);

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 3600 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const in24Hours = new Date(now.getTime() + 24 * 3600 * 1000);

    // Run queries in parallel
    const [
      cacheEntries,
      staleCount,
      expiringCount,
      logs1h,
      logs24h,
      logs7d,
      emergencyMode,
    ] = await Promise.all([
      // Get all cache entries grouped by provider
      supabase
        .from('api_cache_universal')
        .select('provider, created_at, expires_at, hit_count, response')
        .order('created_at', { ascending: true }),

      // Count stale entries (expired)
      supabase
        .from('api_cache_universal')
        .select('id', { count: 'exact', head: true })
        .lt('expires_at', now.toISOString()),

      // Count entries expiring in 24h
      supabase
        .from('api_cache_universal')
        .select('id', { count: 'exact', head: true })
        .gt('expires_at', now.toISOString())
        .lt('expires_at', in24Hours.toISOString()),

      // Get logs for hit rate calculation - last 1h
      supabase
        .from('api_logs')
        .select('cache_key')
        .gte('timestamp', oneHourAgo.toISOString()),

      // Get logs for hit rate calculation - last 24h
      supabase
        .from('api_logs')
        .select('cache_key')
        .gte('timestamp', oneDayAgo.toISOString()),

      // Get logs for hit rate calculation - last 7d
      supabase
        .from('api_logs')
        .select('cache_key')
        .gte('timestamp', sevenDaysAgo.toISOString()),

      // Check emergency mode
      isEmergencyMode(supabase),
    ]);

    // Process cache entries
    const entries = cacheEntries.data || [];
    const totalEntries = entries.length;

    // Estimate total size (rough estimate based on JSON length)
    let totalSizeBytes = 0;
    const providerStats: Record<string, {
      entries: number;
      totalHits: number;
      totalAge: number;
      oldestCreated: string | null;
    }> = {};

    for (const entry of entries) {
      // Estimate size
      totalSizeBytes += JSON.stringify(entry.response).length * 2; // UTF-16

      // Aggregate by provider
      const provider = entry.provider || 'unknown';
      if (!providerStats[provider]) {
        providerStats[provider] = {
          entries: 0,
          totalHits: 0,
          totalAge: 0,
          oldestCreated: null,
        };
      }

      providerStats[provider].entries++;
      providerStats[provider].totalHits += entry.hit_count || 0;
      
      const ageHours = (now.getTime() - new Date(entry.created_at).getTime()) / 3600000;
      providerStats[provider].totalAge += ageHours;

      if (!providerStats[provider].oldestCreated || entry.created_at < providerStats[provider].oldestCreated) {
        providerStats[provider].oldestCreated = entry.created_at;
      }
    }

    // Calculate hit rates
    const calculateHitRate = (logs: { cache_key: string | null }[]): number => {
      if (!logs || logs.length === 0) return 0;
      const hits = logs.filter(l => l.cache_key === 'HIT').length;
      return Math.round((hits / logs.length) * 100);
    };

    const hitRate = {
      last1h: calculateHitRate(logs1h.data || []),
      last24h: calculateHitRate(logs24h.data || []),
      last7d: calculateHitRate(logs7d.data || []),
    };

    // Build provider breakdown
    const byProvider = Object.entries(providerStats).map(([provider, stats]) => ({
      provider,
      entries: stats.entries,
      hitRate: stats.entries > 0 ? Math.round((stats.totalHits / stats.entries) * 10) : 0, // Rough estimate
      avgAgeHours: stats.entries > 0 ? Math.round(stats.totalAge / stats.entries) : 0,
      oldestEntry: stats.oldestCreated,
    })).sort((a, b) => b.entries - a.entries);

    const response: CacheStatsResponse = {
      totalEntries,
      totalSizeBytes,
      hitRate,
      byProvider,
      staleEntries: staleCount.count || 0,
      expiringIn24h: expiringCount.count || 0,
      emergencyModeActive: emergencyMode,
      traceId,
    };

    const executionMs = Date.now() - startTime;
    console.log(`[CacheStats] ${traceId}: Complete in ${executionMs}ms (${totalEntries} entries, ${Math.round(totalSizeBytes / 1024)}KB)`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[CacheStats] ${traceId}: Error:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      traceId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
