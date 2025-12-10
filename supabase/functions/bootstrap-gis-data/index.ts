import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GISLayer {
  id: string;
  layer_key: string;
  display_name: string;
  source_url: string;
  provider: string;
  category: string;
  map_server_id: string | null;
  is_active: boolean;
}

interface BootstrapResult {
  layer_key: string;
  display_name: string;
  status: 'success' | 'error' | 'skipped';
  fetch_status?: string;
  transform_status?: string;
  records_inserted?: number;
  dataset_created?: boolean;
  error?: string;
  duration_ms?: number;
}

interface BootstrapSummary {
  started_at: string;
  finished_at: string;
  total_layers: number;
  successful: number;
  failed: number;
  skipped: number;
  datasets_created: number;
  total_records: number;
  results: BootstrapResult[];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('[bootstrap-gis-data] Starting ETL bootstrap process...');

  try {
    // Parse optional filters from request body
    const body = await req.json().catch(() => ({}));
    const { layer_keys, category, force_refresh = false } = body;

    // Fetch all active GIS layers
    let query = supabase
      .from('gis_layers')
      .select('*')
      .eq('is_active', true);

    if (layer_keys && Array.isArray(layer_keys) && layer_keys.length > 0) {
      query = query.in('layer_key', layer_keys);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const { data: layers, error: layersError } = await query;

    if (layersError) {
      console.error('[bootstrap-gis-data] Failed to fetch GIS layers:', layersError);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch GIS layers', 
        details: layersError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!layers || layers.length === 0) {
      console.log('[bootstrap-gis-data] No active GIS layers found');
      return new Response(JSON.stringify({ 
        message: 'No active GIS layers found',
        hint: 'Ensure gis_layers table has entries with is_active = true'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[bootstrap-gis-data] Found ${layers.length} active layers to bootstrap`);

    const results: BootstrapResult[] = [];
    let datasetsCreated = 0;
    let totalRecords = 0;

    // Process each layer sequentially to avoid overwhelming external APIs
    for (const layer of layers as GISLayer[]) {
      const layerStart = Date.now();
      const result: BootstrapResult = {
        layer_key: layer.layer_key,
        display_name: layer.display_name,
        status: 'success',
      };

      console.log(`[bootstrap-gis-data] Processing layer: ${layer.layer_key}`);

      try {
        // Check if we already have a recent version (skip if not force_refresh)
        if (!force_refresh) {
          const { data: existingVersion } = await supabase
            .from('gis_layer_versions')
            .select('id, fetched_at')
            .eq('layer_id', layer.id)
            .eq('is_active', true)
            .single();

          if (existingVersion) {
            const fetchedAt = new Date(existingVersion.fetched_at);
            const hoursSinceRefresh = (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60);
            
            if (hoursSinceRefresh < 24) {
              console.log(`[bootstrap-gis-data] ${layer.layer_key} has recent version (${hoursSinceRefresh.toFixed(1)}h old), skipping`);
              result.status = 'skipped';
              result.error = `Recent version exists (${hoursSinceRefresh.toFixed(1)}h old). Use force_refresh: true to override`;
              result.duration_ms = Date.now() - layerStart;
              results.push(result);
              continue;
            }
          }
        }

        // Step 1: Fetch data with versioning
        console.log(`[bootstrap-gis-data] Fetching data for ${layer.layer_key}...`);
        const fetchResponse = await supabase.functions.invoke('gis-fetch-with-versioning', {
          body: { layer_key: layer.layer_key }
        });

        if (fetchResponse.error) {
          throw new Error(`Fetch failed: ${fetchResponse.error.message}`);
        }

        result.fetch_status = fetchResponse.data?.status || 'unknown';
        
        if (fetchResponse.data?.status === 'error') {
          throw new Error(`Fetch error: ${fetchResponse.data?.error || 'Unknown error'}`);
        }

        console.log(`[bootstrap-gis-data] Fetch complete for ${layer.layer_key}: ${fetchResponse.data?.status}`);

        // Step 2: Transform to canonical (if data changed or is new)
        if (fetchResponse.data?.status === 'changed' || fetchResponse.data?.status === 'new') {
          console.log(`[bootstrap-gis-data] Transforming ${layer.layer_key} to canonical...`);
          
          const transformResponse = await supabase.functions.invoke('gis-transform-to-canonical', {
            body: { 
              layer_key: layer.layer_key,
              version_id: fetchResponse.data?.version_id 
            }
          });

          if (transformResponse.error) {
            throw new Error(`Transform failed: ${transformResponse.error.message}`);
          }

          result.transform_status = transformResponse.data?.status || 'unknown';
          result.records_inserted = transformResponse.data?.records_inserted || 0;
          totalRecords += result.records_inserted;

          console.log(`[bootstrap-gis-data] Transform complete for ${layer.layer_key}: ${result.records_inserted} records`);
        } else {
          result.transform_status = 'skipped_unchanged';
          console.log(`[bootstrap-gis-data] No transform needed for ${layer.layer_key} (data unchanged)`);
        }

        // Step 3: Ensure dataset record exists
        const datasetVersion = new Date().toISOString().split('T')[0].replace(/-/g, '_');
        
        const { data: existingDataset } = await supabase
          .from('datasets')
          .select('id')
          .eq('dataset_key', layer.layer_key)
          .single();

        if (!existingDataset) {
          const { error: datasetError } = await supabase
            .from('datasets')
            .insert({
              dataset_key: layer.layer_key,
              dataset_type: layer.category as 'parcel' | 'zoning' | 'flood' | 'utility' | 'environmental' | 'transportation',
              dataset_version: datasetVersion,
              jurisdiction: layer.provider || 'Unknown',
              layer_name: layer.display_name,
              mapserver_id: layer.map_server_id,
              status: 'active',
              record_count: result.records_inserted || 0,
              metadata: {
                source_url: layer.source_url,
                provider: layer.provider,
                bootstrap_run: true,
                bootstrapped_at: new Date().toISOString(),
              }
            });

          if (datasetError) {
            console.warn(`[bootstrap-gis-data] Failed to create dataset record for ${layer.layer_key}:`, datasetError);
          } else {
            result.dataset_created = true;
            datasetsCreated++;
            console.log(`[bootstrap-gis-data] Created dataset record for ${layer.layer_key}`);
          }
        } else {
          // Update existing dataset
          await supabase
            .from('datasets')
            .update({
              dataset_version: datasetVersion,
              record_count: result.records_inserted || 0,
              status: 'active',
              updated_at: new Date().toISOString(),
              metadata: {
                source_url: layer.source_url,
                provider: layer.provider,
                last_bootstrap: new Date().toISOString(),
              }
            })
            .eq('dataset_key', layer.layer_key);
          
          result.dataset_created = false;
          console.log(`[bootstrap-gis-data] Updated dataset record for ${layer.layer_key}`);
        }

        result.status = 'success';
        result.duration_ms = Date.now() - layerStart;

      } catch (err) {
        console.error(`[bootstrap-gis-data] Error processing ${layer.layer_key}:`, err);
        result.status = 'error';
        result.error = err instanceof Error ? err.message : 'Unknown error';
        result.duration_ms = Date.now() - layerStart;
      }

      results.push(result);
    }

    const summary: BootstrapSummary = {
      started_at: new Date(startTime).toISOString(),
      finished_at: new Date().toISOString(),
      total_layers: layers.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      datasets_created: datasetsCreated,
      total_records: totalRecords,
      results,
    };

    // Log to cron_job_history for tracking
    await supabase.from('cron_job_history').insert({
      job_name: 'bootstrap-gis-data',
      status: summary.failed === 0 ? 'completed' : 'partial',
      started_at: summary.started_at,
      finished_at: summary.finished_at,
      records_processed: summary.total_records,
      execution_time_ms: Date.now() - startTime,
      metadata: {
        total_layers: summary.total_layers,
        successful: summary.successful,
        failed: summary.failed,
        skipped: summary.skipped,
        datasets_created: summary.datasets_created,
      }
    });

    console.log(`[bootstrap-gis-data] Bootstrap complete: ${summary.successful}/${summary.total_layers} successful, ${summary.datasets_created} datasets created, ${summary.total_records} total records`);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[bootstrap-gis-data] Fatal error:', err);
    return new Response(JSON.stringify({ 
      error: 'Bootstrap failed', 
      details: err instanceof Error ? err.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
