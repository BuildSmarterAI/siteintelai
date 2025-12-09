// deno-lint-ignore-file no-explicit-any
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Transform functions for field mappings
const transformFunctions: Record<string, (val: any) => any> = {
  trim: (val) => typeof val === 'string' ? val.trim() : val,
  uppercase: (val) => typeof val === 'string' ? val.toUpperCase() : val,
  lowercase: (val) => typeof val === 'string' ? val.toLowerCase() : val,
  parse_int: (val) => {
    const num = parseInt(String(val), 10);
    return isNaN(num) ? null : num;
  },
  parse_float: (val) => {
    const num = parseFloat(String(val));
    return isNaN(num) ? null : num;
  },
  parse_bool: (val) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
      return ['true', 'yes', '1', 'y'].includes(val.toLowerCase());
    }
    return Boolean(val);
  },
  parse_date: (val) => {
    if (!val) return null;
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date.toISOString();
  },
  identity: (val) => val,
};

interface TransformConfig {
  source: { layer_key: string; geometry_field: string };
  target: { table: string; upsert_key: string };
  geometry: { reproject?: { from: number; to: number }; validate?: boolean; repair?: boolean };
  field_mappings: Array<{ source: string; target: string; transform?: string }>;
  constants?: Record<string, any>;
  deduplication?: { strategy: string; key: string };
}

interface TransformResult {
  success: boolean;
  layer_key: string;
  version_id: string;
  records_processed: number;
  records_inserted: number;
  records_updated: number;
  records_failed: number;
  duration_ms: number;
  error?: string;
}

async function logOperation(
  supabase: any,
  layerId: string | null,
  versionId: string | null,
  operation: string,
  status: string,
  details: Record<string, any>
) {
  try {
    await supabase.from('gis_fetch_logs').insert({
      layer_id: layerId,
      layer_version_id: versionId,
      operation,
      status,
      records_processed: details.records_processed || null,
      duration_ms: details.duration_ms || null,
      error_message: details.error || null,
      metadata: details,
    });
  } catch (err) {
    console.error('[gis-transform] Failed to log operation:', err);
  }
}

function applyFieldMappings(
  feature: any,
  mappings: Array<{ source: string; target: string; transform?: string }>,
  constants?: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = {};

  // Apply field mappings
  for (const mapping of mappings) {
    const sourceValue = feature.properties?.[mapping.source];
    const transformFn = transformFunctions[mapping.transform || 'identity'];
    result[mapping.target] = transformFn(sourceValue);
  }

  // Apply constants
  if (constants) {
    for (const [key, value] of Object.entries(constants)) {
      result[key] = value;
    }
  }

  return result;
}

async function transformVersion(
  supabase: any,
  version: any,
  layer: any,
  config: TransformConfig
): Promise<TransformResult> {
  const startTime = Date.now();
  const result: TransformResult = {
    success: false,
    layer_key: layer.layer_key,
    version_id: version.id,
    records_processed: 0,
    records_inserted: 0,
    records_updated: 0,
    records_failed: 0,
    duration_ms: 0,
  };

  try {
    // Mark version as processing
    await supabase
      .from('gis_layer_versions')
      .update({ transform_status: 'processing' })
      .eq('id', version.id);

    await logOperation(supabase, layer.id, version.id, 'transform', 'started', {
      target_table: config.target.table,
    });

    // Get GeoJSON data
    let geojson = version.geojson;
    
    // If stored in storage, fetch it
    if (!geojson && version.storage_path) {
      const { data: fileData, error: fileError } = await supabase.storage
        .from('gis-layers')
        .download(version.storage_path);
      
      if (fileError) throw new Error(`Failed to download GeoJSON: ${fileError.message}`);
      
      const text = await fileData.text();
      geojson = JSON.parse(text);
    }

    if (!geojson || !geojson.features) {
      throw new Error('No valid GeoJSON features found');
    }

    const features = geojson.features;
    result.records_processed = features.length;

    // Generate dataset version tag
    const datasetVersion = `${layer.layer_key}_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}`;

    // Process features in batches
    const BATCH_SIZE = 100;
    const transformedRecords: any[] = [];

    for (const feature of features) {
      try {
        const mapped = applyFieldMappings(feature, config.field_mappings, config.constants);
        
        // Build canonical record
        const record: any = {
          ...mapped,
          source_id: `${layer.layer_key}_${mapped.parcel_id || mapped.station_id || crypto.randomUUID().slice(0, 8)}`,
          source_layer_id: layer.id,
          source_dataset: layer.layer_key,
          dataset_version: datasetVersion,
          etl_job_id: version.id,
        };

        // Handle geometry - store as GeoJSON for now (PostGIS will handle conversion)
        if (feature.geometry) {
          record.geom = feature.geometry;
        }

        transformedRecords.push(record);
      } catch (err) {
        result.records_failed++;
        console.error(`[gis-transform] Feature transform error:`, err);
      }
    }

    // Insert/upsert in batches
    for (let i = 0; i < transformedRecords.length; i += BATCH_SIZE) {
      const batch = transformedRecords.slice(i, i + BATCH_SIZE);
      
      // Use upsert with conflict handling
      const { data, error } = await supabase
        .from(config.target.table)
        .upsert(batch, { 
          onConflict: 'source_id',
          ignoreDuplicates: false 
        })
        .select('id');

      if (error) {
        console.error(`[gis-transform] Batch insert error:`, error);
        result.records_failed += batch.length;
      } else {
        result.records_inserted += data?.length || batch.length;
      }
    }

    // Mark version as completed
    await supabase
      .from('gis_layer_versions')
      .update({ 
        transform_status: 'completed',
        transformed_at: new Date().toISOString()
      })
      .eq('id', version.id);

    // Update transform_configs last_run
    await supabase
      .from('transform_configs')
      .update({ 
        last_run_at: new Date().toISOString(),
        last_run_status: 'success'
      })
      .eq('layer_key', layer.layer_key);

    // Log to datasets table
    await supabase.from('datasets').upsert({
      dataset_key: layer.layer_key,
      dataset_type: layer.category,
      dataset_version: datasetVersion,
      jurisdiction: config.constants?.jurisdiction || 'Unknown',
      layer_name: layer.display_name,
      status: 'active',
      record_count: result.records_inserted,
      metadata: {
        source_url: layer.source_url,
        provider: layer.provider,
        transform_config_id: config.target.table,
      }
    }, { onConflict: 'dataset_key' });

    result.success = true;
    result.duration_ms = Date.now() - startTime;

    await logOperation(supabase, layer.id, version.id, 'transform', 'success', {
      records_processed: result.records_processed,
      records_inserted: result.records_inserted,
      records_failed: result.records_failed,
      duration_ms: result.duration_ms,
    });

  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    result.duration_ms = Date.now() - startTime;

    // Mark version as failed
    await supabase
      .from('gis_layer_versions')
      .update({ transform_status: 'failed' })
      .eq('id', version.id);

    await supabase
      .from('transform_configs')
      .update({ 
        last_run_at: new Date().toISOString(),
        last_run_status: 'failed'
      })
      .eq('layer_key', layer.layer_key);

    await logOperation(supabase, layer.id, version.id, 'transform', 'error', {
      error: result.error,
      duration_ms: result.duration_ms,
    });

    console.error(`[gis-transform] Transform failed for ${layer.layer_key}:`, result.error);
  }

  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[gis-transform] Starting transform job');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body for optional filters
    let body: { layer_key?: string; version_id?: string; force?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      // No body provided, process all pending
    }

    // Get pending versions to transform
    let query = supabase
      .from('gis_layer_versions')
      .select(`
        id,
        layer_id,
        geojson,
        storage_path,
        record_count,
        gis_layers!inner (
          id,
          layer_key,
          display_name,
          provider,
          source_url,
          category,
          native_srid
        )
      `)
      .eq('is_active', true);

    if (body.version_id) {
      query = query.eq('id', body.version_id);
    } else if (body.force) {
      // Process all active versions when forced
      query = query.in('transform_status', ['pending', 'failed']);
    } else {
      // Only process pending versions
      query = query.eq('transform_status', 'pending');
    }

    if (body.layer_key) {
      query = query.eq('gis_layers.layer_key', body.layer_key);
    }

    const { data: versions, error: versionsError } = await query.limit(50);

    if (versionsError) {
      throw new Error(`Failed to fetch versions: ${versionsError.message}`);
    }

    if (!versions || versions.length === 0) {
      console.log('[gis-transform] No pending versions to transform');
      return new Response(JSON.stringify({
        success: true,
        message: 'No pending versions to transform',
        processed: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[gis-transform] Found ${versions.length} versions to transform`);

    const results: TransformResult[] = [];

    for (const version of versions) {
      const layer = version.gis_layers as any;

      // Get transform config for this layer
      const { data: configData, error: configError } = await supabase
        .from('transform_configs')
        .select('*')
        .eq('layer_key', layer.layer_key)
        .eq('enabled', true)
        .single();

      if (configError || !configData) {
        console.log(`[gis-transform] No transform config for ${layer.layer_key}, skipping`);
        
        await supabase
          .from('gis_layer_versions')
          .update({ transform_status: 'skipped' })
          .eq('id', version.id);
        
        continue;
      }

      const config = configData.config as TransformConfig;
      const result = await transformVersion(supabase, version, layer, config);
      results.push(result);
    }

    const summary = {
      success: true,
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      total_records: results.reduce((sum, r) => sum + r.records_processed, 0),
      total_inserted: results.reduce((sum, r) => sum + r.records_inserted, 0),
      duration_ms: Date.now() - startTime,
      results,
    };

    console.log(`[gis-transform] Completed: ${summary.successful}/${summary.processed} successful`);

    return new Response(JSON.stringify(summary, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[gis-transform] Fatal error:', errorMsg);
    
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
