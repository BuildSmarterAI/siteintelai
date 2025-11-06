/**
 * BuildSmarter™ Feasibility Core
 * Function: fetch-geospatial-layers
 * Purpose: Orchestrate GIS cache refresh using the versioned cache system
 * 
 * PHASE 6 UPDATE: Now uses gis-fetch-with-versioning for intelligent caching
 * - ETag-based change detection
 * - Automatic compression and storage
 * - Version tracking and expiry management
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define layers to refresh (mapped to gis_layers table)
const LAYERS_TO_REFRESH = [
  // County boundaries
  { layer_key: 'hcad:county_boundary', area_key: 'harris', priority: 1 },
  { layer_key: 'fbcad:county_boundary', area_key: 'fort_bend', priority: 1 },
  // FEMA flood zones (on-demand queries now handled by query-fema-by-point)
  // TxDOT traffic data
  { layer_key: 'txdot:aadt', area_key: 'all', priority: 2 },
];

interface RefreshResult {
  layer_key: string;
  area_key: string;
  status: 'success' | 'unchanged' | 'error';
  message?: string;
  record_count?: number;
  duration_ms?: number;
  version_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse optional parameters
    let forceRefresh = false;
    try {
      const body = await req.json();
      forceRefresh = body.force_refresh || false;
    } catch {
      // No body provided - use defaults
    }

    console.log(`[fetch-geospatial-layers] Starting refresh (force: ${forceRefresh})...`);
    
    const results: RefreshResult[] = [];

    // Refresh each layer using the intelligent cache system
    for (const layer of LAYERS_TO_REFRESH) {
      const layerStart = Date.now();
      console.log(`[fetch-geospatial-layers] Refreshing ${layer.layer_key}/${layer.area_key}...`);

      try {
        // Call gis-fetch-with-versioning for intelligent refresh
        const { data, error } = await supabase.functions.invoke('gis-fetch-with-versioning', {
          body: {
            layer_key: layer.layer_key,
            area_key: layer.area_key,
            force_refresh: forceRefresh
          }
        });

        if (error) {
          console.error(`[fetch-geospatial-layers] Error refreshing ${layer.layer_key}:`, error);
          results.push({
            layer_key: layer.layer_key,
            area_key: layer.area_key,
            status: 'error',
            message: error.message || 'Function invocation failed',
            duration_ms: Date.now() - layerStart
          });
          continue;
        }

        // Parse response
        const status = data?.status || 'unknown';
        const recordCount = data?.record_count || 0;
        const versionId = data?.version_id;

        console.log(`[fetch-geospatial-layers] ${layer.layer_key} result: ${status} (${recordCount} records)`);

        results.push({
          layer_key: layer.layer_key,
          area_key: layer.area_key,
          status: status === 'success' ? 'success' : status === 'unchanged' ? 'unchanged' : 'error',
          message: data?.message,
          record_count: recordCount,
          version_id: versionId,
          duration_ms: Date.now() - layerStart
        });

      } catch (err) {
        console.error(`[fetch-geospatial-layers] Exception refreshing ${layer.layer_key}:`, err);
        results.push({
          layer_key: layer.layer_key,
          area_key: layer.area_key,
          status: 'error',
          message: err.message,
          duration_ms: Date.now() - layerStart
        });
      }
    }

    // Generate summary
    const summary = {
      success: true,
      message: 'GIS cache refresh completed',
      total_layers: LAYERS_TO_REFRESH.length,
      refreshed: results.filter(r => r.status === 'success').length,
      unchanged: results.filter(r => r.status === 'unchanged').length,
      errors: results.filter(r => r.status === 'error').length,
      execution_time_ms: Date.now() - startTime,
      results
    };

    console.log(`[fetch-geospatial-layers] Completed: ${summary.refreshed} refreshed, ${summary.unchanged} unchanged, ${summary.errors} errors`);

    // Log errors if any
    if (summary.errors > 0) {
      console.error('[fetch-geospatial-layers] Errors occurred:');
      results.filter(r => r.status === 'error').forEach(r => {
        console.error(`  - ${r.layer_key}/${r.area_key}: ${r.message}`);
      });
    }

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (err) {
    console.error('[fetch-geospatial-layers] Fatal error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message,
        execution_time_ms: Date.now() - startTime
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
