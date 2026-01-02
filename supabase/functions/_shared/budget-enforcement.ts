import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

/**
 * Budget Enforcement (H-03)
 * Enforces API call limits per application to prevent runaway costs
 */

const MAX_API_CALLS_PER_APPLICATION = 150;
const BUDGET_WINDOW_HOURS = 24;

export interface BudgetCheckResult {
  withinBudget: boolean;
  callCount: number;
  remaining: number;
  maxCalls: number;
  windowHours: number;
}

/**
 * Check if an application is within its API call budget
 */
export async function checkApplicationBudget(
  supabase: SupabaseClient,
  applicationId: string
): Promise<BudgetCheckResult> {
  const windowStart = new Date(Date.now() - BUDGET_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from('api_logs')
    .select('*', { count: 'exact', head: true })
    .eq('application_id', applicationId)
    .gte('timestamp', windowStart);

  if (error) {
    console.error('[budget-enforcement] Error checking budget:', error);
    // Allow on error to prevent blocking
    return {
      withinBudget: true,
      callCount: 0,
      remaining: MAX_API_CALLS_PER_APPLICATION,
      maxCalls: MAX_API_CALLS_PER_APPLICATION,
      windowHours: BUDGET_WINDOW_HOURS,
    };
  }

  const callCount = count || 0;
  const remaining = Math.max(0, MAX_API_CALLS_PER_APPLICATION - callCount);

  return {
    withinBudget: callCount < MAX_API_CALLS_PER_APPLICATION,
    callCount,
    remaining,
    maxCalls: MAX_API_CALLS_PER_APPLICATION,
    windowHours: BUDGET_WINDOW_HOURS,
  };
}

/**
 * Enforce application budget - throws if exceeded, updates application status
 */
export async function enforceApplicationBudget(
  supabase: SupabaseClient,
  applicationId: string
): Promise<void> {
  const budget = await checkApplicationBudget(supabase, applicationId);

  if (!budget.withinBudget) {
    // Update application status to error
    const { data: app, error: fetchError } = await supabase
      .from('applications')
      .select('data_flags')
      .eq('id', applicationId)
      .single();

    if (!fetchError && app) {
      const existingFlags = Array.isArray(app.data_flags) ? app.data_flags : [];
      
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status: 'error',
          error_code: 'API_BUDGET_EXCEEDED',
          data_flags: [...existingFlags, 'api_budget_exceeded'],
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (updateError) {
        console.error('[budget-enforcement] Failed to update application:', updateError);
      }
    }

    throw new Error(
      `Application exceeded API budget: ${budget.callCount}/${budget.maxCalls} calls in ${budget.windowHours}h window`
    );
  }
}

/**
 * Get budget status for multiple applications
 */
export async function getBulkBudgetStatus(
  supabase: SupabaseClient,
  applicationIds: string[]
): Promise<Map<string, BudgetCheckResult>> {
  const results = new Map<string, BudgetCheckResult>();
  const windowStart = new Date(Date.now() - BUDGET_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  // Get counts for all applications in one query
  const { data, error } = await supabase
    .from('api_logs')
    .select('application_id')
    .in('application_id', applicationIds)
    .gte('timestamp', windowStart);

  if (error) {
    console.error('[budget-enforcement] Error getting bulk budget:', error);
    // Return all as within budget on error
    for (const id of applicationIds) {
      results.set(id, {
        withinBudget: true,
        callCount: 0,
        remaining: MAX_API_CALLS_PER_APPLICATION,
        maxCalls: MAX_API_CALLS_PER_APPLICATION,
        windowHours: BUDGET_WINDOW_HOURS,
      });
    }
    return results;
  }

  // Count by application
  const counts = new Map<string, number>();
  for (const row of data || []) {
    if (row.application_id) {
      counts.set(row.application_id, (counts.get(row.application_id) || 0) + 1);
    }
  }

  // Build results
  for (const id of applicationIds) {
    const callCount = counts.get(id) || 0;
    const remaining = Math.max(0, MAX_API_CALLS_PER_APPLICATION - callCount);
    results.set(id, {
      withinBudget: callCount < MAX_API_CALLS_PER_APPLICATION,
      callCount,
      remaining,
      maxCalls: MAX_API_CALLS_PER_APPLICATION,
      windowHours: BUDGET_WINDOW_HOURS,
    });
  }

  return results;
}
