// deno-lint-ignore-file no-explicit-any
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface RefreshResult {
  layer_key: string;
  status: 'refreshed' | 'unchanged' | 'error';
  records?: number;
  error?: string;
  transformed?: boolean;
}

interface SchedulerSummary {
  success: boolean;
  layers_checked: number;
  layers_refreshed: number;
  layers_unchanged: number;
  layers_errored: number;
  layers_transformed: number;
  duration_ms: number;
  results: RefreshResult[];
}

async function refreshLayer(
  supabase: any,
  layer: any
): Promise<RefreshResult> {
  const result: RefreshResult = {
    layer_key: layer.layer_key,
    status: 'unchanged',
    transformed: false,
  };

  try {
    console.log(`[gis-refresh] Fetching layer: ${layer.layer_key}`);

    // Call the fetch function
    const fetchUrl = `${SUPABASE_URL}/functions/v1/gis-fetch-with-versioning`;
    const fetchResponse = await fetch(fetchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        layer_key: layer.layer_key,
        force_refresh: false,
      }),
    });

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      throw new Error(`Fetch failed: ${errorText}`);
    }

    const fetchResult = await fetchResponse.json();
    
    if (fetchResult.status === 'unchanged') {
      result.status = 'unchanged';
      return result;
    }

    result.status = 'refreshed';
    result.records = fetchResult.record_count;

    // Trigger transform for the new version
    console.log(`[gis-refresh] Triggering transform for: ${layer.layer_key}`);
    
    const transformUrl = `${SUPABASE_URL}/functions/v1/gis-transform-to-canonical`;
    const transformResponse = await fetch(transformUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        layer_key: layer.layer_key,
        version_id: fetchResult.version_id,
      }),
    });

    if (transformResponse.ok) {
      const transformResult = await transformResponse.json();
      result.transformed = transformResult.success;
      console.log(`[gis-refresh] Transform result for ${layer.layer_key}:`, transformResult.success ? 'success' : 'failed');
    } else {
      console.error(`[gis-refresh] Transform failed for ${layer.layer_key}`);
    }

  } catch (err) {
    result.status = 'error';
    result.error = err instanceof Error ? err.message : String(err);
    console.error(`[gis-refresh] Error refreshing ${layer.layer_key}:`, result.error);
  }

  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[gis-refresh-scheduler] Starting scheduled refresh');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body for optional filters
    let body: { force_refresh?: boolean; layer_keys?: string[]; category?: string } = {};
    try {
      body = await req.json();
    } catch {
      // No body provided
    }

    // Get active layers to refresh
    let query = supabase
      .from('gis_layers')
      .select('*')
      .eq('status', 'active');

    if (body.layer_keys && body.layer_keys.length > 0) {
      query = query.in('layer_key', body.layer_keys);
    }

    if (body.category) {
      query = query.eq('category', body.category);
    }

    const { data: layers, error: layersError } = await query;

    if (layersError) {
      throw new Error(`Failed to fetch layers: ${layersError.message}`);
    }

    if (!layers || layers.length === 0) {
      console.log('[gis-refresh-scheduler] No active layers to refresh');
      return new Response(JSON.stringify({
        success: true,
        message: 'No active layers to refresh',
        layers_checked: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[gis-refresh-scheduler] Found ${layers.length} layers to check`);

    // Check which layers need refresh based on their update policy
    const layersToRefresh: any[] = [];
    const now = new Date();

    for (const layer of layers) {
      if (body.force_refresh) {
        layersToRefresh.push(layer);
        continue;
      }

      // Get latest version to check expiry
      const { data: latestVersion } = await supabase
        .from('gis_layer_versions')
        .select('expires_at, fetched_at')
        .eq('layer_id', layer.id)
        .eq('is_active', true)
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single();

      if (!latestVersion) {
        // No version exists, needs refresh
        layersToRefresh.push(layer);
        continue;
      }

      // Check if expired
      if (latestVersion.expires_at && new Date(latestVersion.expires_at) < now) {
        layersToRefresh.push(layer);
        continue;
      }

      // Check based on update frequency
      const policy = layer.update_policy as { frequency?: string };
      const lastFetch = new Date(latestVersion.fetched_at);
      const hoursSinceFetch = (now.getTime() - lastFetch.getTime()) / (1000 * 60 * 60);

      const frequencyHours: Record<string, number> = {
        hourly: 1,
        daily: 24,
        weekly: 168,
        monthly: 720,
        quarterly: 2160,
        yearly: 8760,
      };

      const thresholdHours = frequencyHours[policy.frequency || 'daily'] || 24;
      
      if (hoursSinceFetch >= thresholdHours) {
        layersToRefresh.push(layer);
      }
    }

    console.log(`[gis-refresh-scheduler] ${layersToRefresh.length} layers need refresh`);

    // Process layers with concurrency limit
    const CONCURRENCY = 3;
    const results: RefreshResult[] = [];
    
    for (let i = 0; i < layersToRefresh.length; i += CONCURRENCY) {
      const batch = layersToRefresh.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map(layer => refreshLayer(supabase, layer))
      );
      results.push(...batchResults);
    }

    const summary: SchedulerSummary = {
      success: true,
      layers_checked: layers.length,
      layers_refreshed: results.filter(r => r.status === 'refreshed').length,
      layers_unchanged: results.filter(r => r.status === 'unchanged').length,
      layers_errored: results.filter(r => r.status === 'error').length,
      layers_transformed: results.filter(r => r.transformed).length,
      duration_ms: Date.now() - startTime,
      results,
    };

    console.log(`[gis-refresh-scheduler] Completed: ${summary.layers_refreshed} refreshed, ${summary.layers_transformed} transformed, ${summary.layers_errored} errors`);

    // Log to cron_job_history
    await supabase.from('cron_job_history').insert({
      job_name: 'gis-refresh-scheduler',
      status: summary.layers_errored > 0 ? 'partial' : 'success',
      started_at: new Date(startTime).toISOString(),
      finished_at: new Date().toISOString(),
      execution_time_ms: summary.duration_ms,
      records_processed: summary.layers_refreshed,
      metadata: {
        layers_checked: summary.layers_checked,
        layers_unchanged: summary.layers_unchanged,
        layers_transformed: summary.layers_transformed,
        errors: results.filter(r => r.error).map(r => ({ layer: r.layer_key, error: r.error })),
      },
    });

    return new Response(JSON.stringify(summary, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[gis-refresh-scheduler] Fatal error:', errorMsg);

    return new Response(JSON.stringify({
      success: false,
      error: errorMsg,
      duration_ms: Date.now() - startTime,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
