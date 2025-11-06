import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';

interface RefreshResult {
  layer_key: string;
  area_key: string;
  status: 'success' | 'unchanged' | 'error' | 'skipped';
  message: string;
  duration_ms?: number;
}

interface SchedulerSummary {
  total_layers: number;
  refreshed: number;
  unchanged: number;
  errors: number;
  skipped: number;
  results: RefreshResult[];
  execution_time_ms: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[gis-scheduler] Starting automated GIS refresh cycle');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse optional request body
    let forceRefresh = false;
    let specificLayers: string[] | undefined;

    try {
      const body = await req.json();
      forceRefresh = body.force_refresh || false;
      specificLayers = body.layer_keys;
    } catch {
      // No body or invalid JSON - use defaults
    }

    // Step 1: Get all active layers with their latest versions
    const { data: layers, error: layersError } = await supabase
      .from('gis_layers')
      .select(`
        id,
        layer_key,
        provider,
        category,
        update_policy,
        gis_layer_versions!inner (
          id,
          area_key,
          expires_at,
          is_active,
          fetched_at
        )
      `)
      .eq('status', 'active')
      .eq('gis_layer_versions.is_active', true);

    if (layersError) {
      console.error('[gis-scheduler] Failed to fetch layers:', layersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch layers', details: layersError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!layers || layers.length === 0) {
      console.log('[gis-scheduler] No active layers found');
      return new Response(
        JSON.stringify({
          message: 'No active layers to refresh',
          total_layers: 0,
          results: []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[gis-scheduler] Found ${layers.length} active layer versions`);

    // Step 2: Filter layers that need refresh
    const now = new Date();
    const layersToRefresh: Array<{ layer: any; version: any }> = [];

    for (const layer of layers) {
      // Handle layers with multiple versions (different areas)
      const versions = Array.isArray(layer.gis_layer_versions) 
        ? layer.gis_layer_versions 
        : [layer.gis_layer_versions];

      for (const version of versions) {
        // Skip if specific layers requested and this isn't one of them
        if (specificLayers && !specificLayers.includes(layer.layer_key)) {
          continue;
        }

        // Check if expired or force refresh
        const expiresAt = version.expires_at ? new Date(version.expires_at) : null;
        const isExpired = expiresAt ? expiresAt < now : true;

        if (forceRefresh || isExpired) {
          layersToRefresh.push({ layer, version });
          console.log(`[gis-scheduler] Queuing refresh: ${layer.layer_key}/${version.area_key} (expired: ${isExpired})`);
        } else {
          console.log(`[gis-scheduler] Skipping ${layer.layer_key}/${version.area_key} (expires: ${expiresAt?.toISOString()})`);
        }
      }
    }

    if (layersToRefresh.length === 0) {
      console.log('[gis-scheduler] No layers need refresh');
      return new Response(
        JSON.stringify({
          message: 'All layers are up to date',
          total_layers: layers.length,
          refreshed: 0,
          unchanged: 0,
          errors: 0,
          skipped: layers.length,
          execution_time_ms: Date.now() - startTime
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[gis-scheduler] Refreshing ${layersToRefresh.length} layer versions`);

    // Step 3: Refresh each layer (with concurrency control)
    const MAX_CONCURRENT = 3; // Limit concurrent refreshes to avoid overwhelming external APIs
    const results: RefreshResult[] = [];

    for (let i = 0; i < layersToRefresh.length; i += MAX_CONCURRENT) {
      const batch = layersToRefresh.slice(i, i + MAX_CONCURRENT);
      const batchResults = await Promise.all(
        batch.map(({ layer, version }) => refreshLayer(supabase, layer, version.area_key))
      );
      results.push(...batchResults);
    }

    // Step 4: Generate summary
    const summary: SchedulerSummary = {
      total_layers: layers.length,
      refreshed: results.filter(r => r.status === 'success').length,
      unchanged: results.filter(r => r.status === 'unchanged').length,
      errors: results.filter(r => r.status === 'error').length,
      skipped: layers.length - layersToRefresh.length,
      results,
      execution_time_ms: Date.now() - startTime
    };

    console.log(`[gis-scheduler] Completed: ${summary.refreshed} refreshed, ${summary.unchanged} unchanged, ${summary.errors} errors, ${summary.skipped} skipped`);

    // Step 5: If there are errors, log to console for monitoring
    if (summary.errors > 0) {
      console.error('[gis-scheduler] Errors occurred:');
      results.filter(r => r.status === 'error').forEach(r => {
        console.error(`  - ${r.layer_key}/${r.area_key}: ${r.message}`);
      });
    }

    return new Response(
      JSON.stringify(summary),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[gis-scheduler] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Scheduler failed', 
        details: error.message,
        execution_time_ms: Date.now() - startTime
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper: Refresh a single layer/area
async function refreshLayer(
  supabase: any,
  layer: any,
  areaKey: string
): Promise<RefreshResult> {
  const startTime = Date.now();
  const layerKey = layer.layer_key;

  try {
    console.log(`[gis-scheduler] Refreshing ${layerKey}/${areaKey}`);

    // Call gis-fetch-with-versioning function
    const { data, error } = await supabase.functions.invoke('gis-fetch-with-versioning', {
      body: {
        layer_key: layerKey,
        area_key: areaKey,
        force_refresh: false // Use change detection
      }
    });

    if (error) {
      console.error(`[gis-scheduler] Failed to refresh ${layerKey}/${areaKey}:`, error);
      return {
        layer_key: layerKey,
        area_key: areaKey,
        status: 'error',
        message: error.message || 'Function invocation failed',
        duration_ms: Date.now() - startTime
      };
    }

    // Parse the response
    const status = data?.status || 'unknown';
    const message = data?.message || JSON.stringify(data);

    console.log(`[gis-scheduler] ${layerKey}/${areaKey} result: ${status}`);

    return {
      layer_key: layerKey,
      area_key: areaKey,
      status: status === 'success' ? 'success' : status === 'unchanged' ? 'unchanged' : 'error',
      message,
      duration_ms: Date.now() - startTime
    };

  } catch (error) {
    console.error(`[gis-scheduler] Exception refreshing ${layerKey}/${areaKey}:`, error);
    return {
      layer_key: layerKey,
      area_key: areaKey,
      status: 'error',
      message: error.message,
      duration_ms: Date.now() - startTime
    };
  }
}
