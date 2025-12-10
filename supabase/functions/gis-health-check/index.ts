import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Test bounding boxes per jurisdiction (downtown areas)
// Using smaller bbox for scale-restricted layers
const TEST_BBOXES: Record<string, { standard: string; small: string }> = {
  houston: { 
    standard: '-95.375,29.755,-95.365,29.765',
    small: '-95.370,29.759,-95.369,29.760' // ~100m box for scale-restricted
  },
  harris_county: { 
    standard: '-95.375,29.755,-95.365,29.765',
    small: '-95.370,29.759,-95.369,29.760'
  },
  austin: { 
    standard: '-97.75,30.26,-97.74,30.27',
    small: '-97.745,30.265,-97.744,30.266'
  },
  dallas: { 
    standard: '-96.80,32.78,-96.79,32.79',
    small: '-96.795,32.785,-96.794,32.786'
  },
  texas: { 
    standard: '-95.375,29.755,-95.365,29.765',
    small: '-95.370,29.759,-95.369,29.760'
  },
  default: { 
    standard: '-95.375,29.755,-95.365,29.765',
    small: '-95.370,29.759,-95.369,29.760'
  },
};

// Test point for point+distance queries (downtown Houston)
const TEST_POINT = { lat: 29.760, lng: -95.370 };

interface MapServer {
  id: string;
  server_key: string;
  base_url: string;
  health_status: string | null;
  reliability_score: number | null;
  jurisdiction: string | null;
  provider: string | null;
  spatial_reference: number | null;
}

interface HealthCheckResult {
  server_key: string;
  base_url: string;
  status: 'operational' | 'degraded' | 'down';
  http_status?: number;
  response_time_ms: number;
  feature_count?: number;
  error?: string;
  query_method?: string;
  service_info?: {
    service_type: string;
    max_record_count?: number;
    supports_geojson: boolean;
    min_scale?: number;
    native_srid?: number;
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

// Try bbox query first, then point+distance as fallback
async function tryQuery(
  queryUrl: string, 
  bbox: string, 
  useSmallBbox: boolean = false
): Promise<{ response: Response; method: string } | null> {
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${queryUrl}/query?${params.toString()}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeout);
    return { response, method: useSmallBbox ? 'small_bbox' : 'bbox' };
  } catch (err) {
    clearTimeout(timeout);
    return null;
  }
}

// Try count-only query for scale-restricted layers (validates data exists without rendering)
async function tryCountQuery(queryUrl: string): Promise<{ count: number; error?: string }> {
  const params = new URLSearchParams({
    f: 'json',
    where: '1=1',
    returnCountOnly: 'true',
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${queryUrl}/query?${params.toString()}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeout);
    
    if (response.ok) {
      const data = await response.json();
      if (data.error) {
        return { count: 0, error: data.error.message };
      }
      return { count: data.count || 0 };
    }
    return { count: 0, error: `HTTP ${response.status}` };
  } catch (err) {
    clearTimeout(timeout);
    return { count: 0, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Try point + distance query (for CRS 2278 services that fail with bbox)
async function tryPointDistanceQuery(queryUrl: string): Promise<{ response: Response; method: string } | null> {
  const params = new URLSearchParams({
    f: 'geojson',
    where: '1=1',
    outFields: '*',
    geometry: `${TEST_POINT.lng},${TEST_POINT.lat}`,
    geometryType: 'esriGeometryPoint',
    spatialRel: 'esriSpatialRelIntersects',
    distance: '500',
    units: 'esriSRUnit_Meter',
    inSR: '4326',
    outSR: '4326',
    resultRecordCount: '5',
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${queryUrl}/query?${params.toString()}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeout);
    return { response, method: 'point_distance' };
  } catch (err) {
    clearTimeout(timeout);
    return null;
  }
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
    const bboxes = TEST_BBOXES[jurisdiction] || TEST_BBOXES.default;

    // Build query URL - ensure proper layer index
    let queryUrl = server.base_url;
    if (!queryUrl.includes('/MapServer/') || queryUrl.endsWith('/MapServer')) {
      queryUrl = queryUrl.replace(/\/MapServer\/?$/, '/MapServer/0');
    }

    console.log(`[gis-health-check] Testing: ${server.server_key} -> ${queryUrl}`);

    // First, try to get service metadata to check for scale restrictions
    let minScale: number | undefined;
    let nativeSrid: number | undefined;
    
    try {
      const metadataUrl = queryUrl + '?f=json';
      const metaController = new AbortController();
      const metaTimeout = setTimeout(() => metaController.abort(), 8000);
      
      const metaResponse = await fetch(metadataUrl, {
        signal: metaController.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(metaTimeout);
      
      if (metaResponse.ok) {
        const meta = await metaResponse.json();
        minScale = meta.minScale;
        nativeSrid = meta.sourceSpatialReference?.wkid || meta.extent?.spatialReference?.wkid;
        
        result.service_info = {
          service_type: meta.type || 'Feature Layer',
          max_record_count: meta.maxRecordCount,
          supports_geojson: meta.supportedQueryFormats?.includes('geoJSON') ?? true,
          min_scale: minScale,
          native_srid: nativeSrid,
        };
      }
    } catch {
      // Metadata fetch is optional, continue with query
    }

    // Try standard bbox query first
    let queryResult = await tryQuery(queryUrl, bboxes.standard);
    let data: any = null;

    if (queryResult?.response.ok) {
      data = await queryResult.response.json();
      result.query_method = queryResult.method;
      
      // Check for ArcGIS error response (often CRS or parameter issues)
      if (data.error) {
        console.log(`[gis-health-check] ${server.server_key} bbox failed: ${data.error.message}, trying point+distance`);
        
        // Try point+distance query as fallback
        queryResult = await tryPointDistanceQuery(queryUrl);
        if (queryResult?.response.ok) {
          data = await queryResult.response.json();
          result.query_method = queryResult.method;
        }
      }
    } else if (!queryResult) {
      // Timeout or network error, try point+distance
      queryResult = await tryPointDistanceQuery(queryUrl);
      if (queryResult?.response.ok) {
        data = await queryResult.response.json();
        result.query_method = queryResult.method;
      }
    }

    result.response_time_ms = Date.now() - startTime;
    result.http_status = queryResult?.response.status;

    if (!queryResult?.response.ok && !data) {
      result.status = 'down';
      result.error = queryResult ? `HTTP ${queryResult.response.status}` : 'Connection failed';
      return result;
    }

    // Check for ArcGIS error response or no features
    const features = data?.features || (data?.type === 'FeatureCollection' ? data.features : null);
    const hasError = data?.error;
    const hasNoFeatures = Array.isArray(features) && features.length === 0;

    // If scale-restricted and no features returned, try count query to verify data exists
    if ((hasError || hasNoFeatures) && minScale && minScale > 0) {
      console.log(`[gis-health-check] ${server.server_key} scale-restricted (1:${minScale}), trying count query...`);
      
      const countResult = await tryCountQuery(queryUrl);
      
      if (countResult.count > 0) {
        // Data exists, just not at this zoom level - mark as operational
        result.status = 'operational';
        result.feature_count = countResult.count;
        result.query_method = 'count_only';
        result.error = `Scale-restricted (1:${minScale.toLocaleString()}) - ${countResult.count.toLocaleString()} total features`;
        console.log(`[gis-health-check] ${server.server_key} verified operational via count: ${countResult.count} features`);
      } else {
        result.status = 'degraded';
        result.error = countResult.error 
          ? `Scale-restricted + count failed: ${countResult.error}`
          : `Scale-restricted (1:${minScale.toLocaleString()}) - 0 features found`;
      }
    } else if (hasError) {
      result.status = 'degraded';
      result.error = data.error.message || JSON.stringify(data.error);
    } else if (Array.isArray(features)) {
      result.feature_count = features.length;
      
      if (result.feature_count > 0) {
        result.status = 'operational';
      } else {
        result.status = 'degraded';
        result.error = 'No features returned for test location';
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
      .select('id, server_key, base_url, health_status, reliability_score, jurisdiction, provider, spatial_reference')
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
