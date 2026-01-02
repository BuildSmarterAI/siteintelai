// Emergency Cost Mode Handler (F-05)
// Switches to cache-only mode when API costs exceed thresholds
// Version: 1.0.0

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCacheEntry } from './cache.ts';

// =============================================================================
// Types
// =============================================================================
export interface EmergencyModeStatus {
  active: boolean;
  reason?: string;
  activatedAt?: string;
  expiresAt?: string;
  affectedProviders: string[];
}

export interface EmergencyFallbackResult<T> {
  data: T | null;
  emergencyMode: boolean;
  stale: boolean;
  cacheKey?: string;
  reason?: string;
}

// =============================================================================
// Emergency Mode Check
// =============================================================================

/**
 * Check if global emergency mode is active
 */
export async function isEmergencyMode(
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'emergency_cost_mode')
      .single();

    return data?.value === 'true' || data?.value === true;
  } catch {
    // If we can't check, assume not in emergency mode
    return false;
  }
}

/**
 * Get detailed emergency mode status
 */
export async function getEmergencyModeStatus(
  supabase: SupabaseClient
): Promise<EmergencyModeStatus> {
  try {
    const [modeResult, reasonResult, providersResult] = await Promise.all([
      supabase.from('system_config').select('value').eq('key', 'emergency_cost_mode').single(),
      supabase.from('system_config').select('value').eq('key', 'emergency_mode_reason').single(),
      supabase.from('system_config').select('value').eq('key', 'emergency_mode_providers').single(),
    ]);

    const active = modeResult.data?.value === 'true' || modeResult.data?.value === true;

    return {
      active,
      reason: reasonResult.data?.value as string | undefined,
      affectedProviders: active ? 
        (JSON.parse(providersResult.data?.value || '[]') as string[]) : 
        [],
    };
  } catch {
    return {
      active: false,
      affectedProviders: [],
    };
  }
}

/**
 * Check if a specific provider is in emergency mode
 */
export async function isProviderInEmergencyMode(
  supabase: SupabaseClient,
  provider: string
): Promise<boolean> {
  // Check global emergency mode first
  const globalMode = await isEmergencyMode(supabase);
  if (globalMode) return true;

  // Check provider-specific budget
  try {
    const { data } = await supabase
      .from('api_budget_config')
      .select('is_active')
      .eq('source', provider)
      .eq('budget_type', 'emergency')
      .single();

    return data?.is_active === true;
  } catch {
    return false;
  }
}

// =============================================================================
// Emergency Mode Activation/Deactivation
// =============================================================================

/**
 * Activate emergency mode
 */
export async function activateEmergencyMode(
  supabase: SupabaseClient,
  reason: string,
  providers?: string[]
): Promise<void> {
  const now = new Date().toISOString();
  
  await Promise.all([
    supabase.from('system_config').upsert({ key: 'emergency_cost_mode', value: 'true' }),
    supabase.from('system_config').upsert({ key: 'emergency_mode_reason', value: reason }),
    supabase.from('system_config').upsert({ key: 'emergency_mode_activated_at', value: now }),
    providers ? supabase.from('system_config').upsert({ 
      key: 'emergency_mode_providers', 
      value: JSON.stringify(providers) 
    }) : Promise.resolve(),
  ]);

  // Log the activation
  await logEmergencyEvent(supabase, 'activated', reason, providers);
  
  console.log(`[EmergencyMode] ACTIVATED: ${reason}. Providers: ${providers?.join(', ') || 'ALL'}`);
}

/**
 * Deactivate emergency mode
 */
export async function deactivateEmergencyMode(
  supabase: SupabaseClient,
  reason: string
): Promise<void> {
  await Promise.all([
    supabase.from('system_config').upsert({ key: 'emergency_cost_mode', value: 'false' }),
    supabase.from('system_config').upsert({ key: 'emergency_mode_reason', value: '' }),
    supabase.from('system_config').upsert({ key: 'emergency_mode_providers', value: '[]' }),
  ]);

  // Log the deactivation
  await logEmergencyEvent(supabase, 'deactivated', reason);
  
  console.log(`[EmergencyMode] DEACTIVATED: ${reason}`);
}

// =============================================================================
// Emergency Mode Wrapper
// =============================================================================

/**
 * Execute API call with emergency mode fallback to cache
 */
export async function withEmergencyFallback<T>(
  supabase: SupabaseClient,
  cacheKey: string,
  fetcher: () => Promise<T>,
  options?: {
    provider?: string;
    allowStale?: boolean;
    swrHours?: number;
  }
): Promise<EmergencyFallbackResult<T>> {
  const provider = options?.provider;
  const allowStale = options?.allowStale ?? true;

  // Check emergency mode
  const inEmergencyMode = provider 
    ? await isProviderInEmergencyMode(supabase, provider)
    : await isEmergencyMode(supabase);

  if (inEmergencyMode) {
    console.log(`[EmergencyMode] ${provider || 'global'}: Emergency mode active, checking cache for ${cacheKey}`);

    // Try to get cached data
    const cached = await getCacheEntry<T>(supabase, cacheKey);

    if (cached) {
      const now = Date.now();
      const expiresAt = new Date(cached.expires_at).getTime();
      const swrMs = (options?.swrHours || 24) * 3600 * 1000;
      const isWithinSWR = now < expiresAt + swrMs;

      if (allowStale || now < expiresAt || isWithinSWR) {
        console.log(`[EmergencyMode] Returning ${now < expiresAt ? 'fresh' : 'stale'} cache for ${cacheKey}`);
        return {
          data: cached.response,
          emergencyMode: true,
          stale: now >= expiresAt,
          cacheKey,
          reason: 'emergency_mode_cache_hit',
        };
      }
    }

    console.log(`[EmergencyMode] No usable cache for ${cacheKey}`);
    return {
      data: null,
      emergencyMode: true,
      stale: false,
      cacheKey,
      reason: 'emergency_mode_no_cache',
    };
  }

  // Normal operation - execute fetcher
  try {
    const data = await fetcher();
    return {
      data,
      emergencyMode: false,
      stale: false,
      cacheKey,
    };
  } catch (error) {
    console.error(`[EmergencyMode] Fetcher failed for ${cacheKey}:`, error);
    throw error;
  }
}

// =============================================================================
// Logging
// =============================================================================

/**
 * Log emergency mode events to system_alerts
 */
async function logEmergencyEvent(
  supabase: SupabaseClient,
  event: 'activated' | 'deactivated',
  reason: string,
  providers?: string[]
): Promise<void> {
  try {
    await supabase.from('system_alerts').insert({
      alert_type: 'emergency_mode',
      severity: event === 'activated' ? 'critical' : 'info',
      source: 'emergency-mode-handler',
      message: `Emergency mode ${event}: ${reason}`,
      payload: {
        event,
        reason,
        providers,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[EmergencyMode] Failed to log event:', error);
  }
}

// =============================================================================
// Cost Threshold Check
// =============================================================================

/**
 * Check if costs have exceeded threshold and auto-activate emergency mode
 */
export async function checkCostThreshold(
  supabase: SupabaseClient
): Promise<{ exceeded: boolean; current: number; threshold: number }> {
  try {
    // Get current day's costs
    const today = new Date().toISOString().split('T')[0];
    
    const { data: costs } = await supabase
      .from('api_cost_snapshots')
      .select('estimated_cost')
      .gte('hour', `${today}T00:00:00`)
      .lte('hour', `${today}T23:59:59`);

    const totalCost = costs?.reduce((sum, c) => sum + (c.estimated_cost || 0), 0) || 0;

    // Get threshold from config
    const { data: thresholdConfig } = await supabase
      .from('api_budget_config')
      .select('threshold_critical')
      .eq('budget_type', 'daily')
      .eq('is_active', true)
      .single();

    const threshold = thresholdConfig?.threshold_critical || 100; // Default $100/day

    const exceeded = totalCost >= threshold;

    if (exceeded) {
      const isAlreadyActive = await isEmergencyMode(supabase);
      if (!isAlreadyActive) {
        await activateEmergencyMode(
          supabase,
          `Daily cost threshold exceeded: $${totalCost.toFixed(2)} >= $${threshold}`
        );
      }
    }

    return { exceeded, current: totalCost, threshold };
  } catch (error) {
    console.error('[EmergencyMode] Failed to check cost threshold:', error);
    return { exceeded: false, current: 0, threshold: 100 };
  }
}
