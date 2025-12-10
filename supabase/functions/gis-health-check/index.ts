import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Test bounding boxes per jurisdiction (downtown areas)
const TEST_BBOXES: Record<string, string> = {
  houston: '-95.375,29.755,-95.365,29.765',
  harris_county: '-95.375,29.755,-95.365,29.765',
  austin: '-97.75,30.26,-97.74,30.27',
  dallas: '-96.80,32.78,-96.79,32.79',
  texas: '-95.375,29.755,-95.365,29.765',
  default: '-95.375,29.755,-95.365,29.765',
};

interface MapServer {
  id: string;
  server_key: string;
  base_url: string;
  health_status: string | null;
  reliability_score: number | null;
  jurisdiction: string | null;
  provider: string | null;
}

interface HealthCheckResult {
  server_key: string;
  base_url: string;
  status: 'operational' | 'degraded' | 'down';
  http_status?: number;
  response_time_ms: number;
  feature_count?: number;
  error?: string;
  service_info?: {
    service_type: string;
    max_record_count?: number;
    supports_geojson: boolean;
  };
}

interface HealthCheckSummary {
  timestamp: string;
  summary: {
    total_endpoints: number;
    operational: number;
    degraded: number;
    down: number;
  };
  avg_response_time_ms: number;
  results: HealthCheckResult[];
}

async function checkEndpoint(server: MapServer): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const result: HealthCheckResult = {
    server_key: server.server_key,
    base_url: server.base_url,
    status: 'down',
    response_time_ms: 0,
  };

  try {
    // Determine test bbox based on jurisdiction
    const jurisdiction = server.jurisdiction?.toLowerCase() || 'default';
    const bbox = TEST_BBOXES[jurisdiction] || TEST_BBOXES.default;

    // Build query URL - ensure proper layer index
    let queryUrl = server.base_url;
    if (!queryUrl.includes('/MapServer/') || queryUrl.endsWith('/MapServer')) {
      queryUrl = queryUrl.replace(/\/MapServer\/?$/, '/MapServer/0');
    }
    
    const params = new URLSearchParams({
      f: 'geojson',
      where: '1=1',
      outFields: '*',
      geometry: bbox,
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      inSR: '4326',
      outSR: '4326',
      resultRecordCount: '5',
    });

    const fullUrl = `${queryUrl}/query?${params.toString()}`;
    console.log(`[gis-health-check] Testing: ${server.server_key} -> ${fullUrl}`);

    // Fetch with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(fullUrl, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeout);

    result.response_time_ms = Date.now() - startTime;
    result.http_status = response.status;

    if (!response.ok) {
      result.status = 'down';
      result.error = `HTTP ${response.status}: ${response.statusText}`;
      return result;
    }

    const data = await response.json();

    // Check for ArcGIS error response
    if (data.error) {
      result.status = 'degraded';
      result.error = data.error.message || JSON.stringify(data.error);
      return result;
    }

    // Check for features
    if (data.features && Array.isArray(data.features)) {
      result.feature_count = data.features.length;
      
      if (result.feature_count > 0) {
        result.status = 'operational';
      } else {
        // No features but endpoint works - might be scale/bbox issue
        result.status = 'degraded';
        result.error = 'No features returned for test bbox';
      }
    } else if (data.type === 'FeatureCollection') {
      result.feature_count = data.features?.length || 0;
      result.status = result.feature_count > 0 ? 'operational' : 'degraded';
      if (result.feature_count === 0) {
        result.error = 'No features returned for test bbox';
      }
    } else {
      result.status = 'degraded';
      result.error = 'Unexpected response format';
    }

    // Check response time - degraded if very slow
    if (result.response_time_ms > 10000 && result.status === 'operational') {
      result.status = 'degraded';
      result.error = `Slow response: ${result.response_time_ms}ms`;
    }

    // Try to get service metadata
    try {
      const metadataUrl = queryUrl.replace(/\/\d+$/, '') + '?f=json';
      const metaResponse = await fetch(metadataUrl, {
        headers: { 'Accept': 'application/json' },
      });
      if (metaResponse.ok) {
        const meta = await metaResponse.json();
        result.service_info = {
          service_type: meta.type || 'MapServer',
          max_record_count: meta.maxRecordCount,
          supports_geojson: meta.supportedQueryFormats?.includes('geoJSON') || true,
        };
      }
    } catch {
      // Metadata fetch is optional, ignore errors
    }

  } catch (err) {
    result.response_time_ms = Date.now() - startTime;
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        result.error = 'Timeout after 15000ms';
      } else {
        result.error = err.message;
      }
    } else {
      result.error = 'Unknown error';
    }
    result.status = 'down';
  }

  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  console.log('[gis-health-check] Starting comprehensive health check...');

  try {
    // Fetch all active map servers
    const { data: mapServers, error: fetchError } = await supabase
      .from('map_servers')
      .select('id, server_key, base_url, health_status, reliability_score, jurisdiction, provider')
      .eq('is_active', true)
      .order('server_key');

    if (fetchError) {
      throw new Error(`Failed to fetch map servers: ${fetchError.message}`);
    }

    if (!mapServers || mapServers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No active map servers found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[gis-health-check] Checking ${mapServers.length} endpoints...`);

    // Check all endpoints in parallel (with concurrency limit)
    const CONCURRENCY = 5;
    const results: HealthCheckResult[] = [];
    
    for (let i = 0; i < mapServers.length; i += CONCURRENCY) {
      const batch = mapServers.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(batch.map(checkEndpoint));
      results.push(...batchResults);
    }

    // Update database for each result
    for (const result of results) {
      const server = mapServers.find(s => s.server_key === result.server_key);
      if (!server) continue;

      // Calculate new reliability score
      const currentScore = server.reliability_score || 50;
      let newScore: number;
      
      if (result.status === 'operational') {
        newScore = Math.min(currentScore + 5, 100);
      } else if (result.status === 'degraded') {
        newScore = Math.max(currentScore - 5, 0);
      } else {
        newScore = Math.max(currentScore - 20, 0);
      }

      // Update map_servers
      const { error: updateError } = await supabase
        .from('map_servers')
        .update({
          health_status: result.status,
          last_health_check: new Date().toISOString(),
          reliability_score: newScore,
        })
        .eq('id', server.id);

      if (updateError) {
        console.error(`[gis-health-check] Failed to update ${result.server_key}:`, updateError);
      }

      // Log errors to data_source_errors for non-operational endpoints
      if (result.status !== 'operational' && result.error) {
        const { error: logError } = await supabase
          .from('data_source_errors')
          .insert({
            map_server_id: server.id,
            error_type: result.status === 'down' ? 'connection_failure' : 'query_failure',
            error_message: result.error,
            status_code: result.http_status,
            endpoint_url: result.base_url,
          });

        if (logError) {
          console.error(`[gis-health-check] Failed to log error for ${result.server_key}:`, logError);
        }
      }
    }

    // Build summary
    const summary: HealthCheckSummary = {
      timestamp: new Date().toISOString(),
      summary: {
        total_endpoints: results.length,
        operational: results.filter(r => r.status === 'operational').length,
        degraded: results.filter(r => r.status === 'degraded').length,
        down: results.filter(r => r.status === 'down').length,
      },
      avg_response_time_ms: Math.round(
        results.reduce((sum, r) => sum + r.response_time_ms, 0) / results.length
      ),
      results,
    };

    console.log(`[gis-health-check] Complete: ${summary.summary.operational} operational, ${summary.summary.degraded} degraded, ${summary.summary.down} down`);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[gis-health-check] Error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
