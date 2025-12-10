import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';

interface FetchRequest {
  layer_key: string;
  area_key?: string;
  force_refresh?: boolean;
}

interface GISLayer {
  id: string;
  provider: string;
  layer_key: string;
  source_url: string;
  license: string;
  update_policy: {
    frequency: string;
    method: string;
  };
  category: string;
}

interface LayerVersion {
  id: string;
  etag: string | null;
  checksum_sha256: string | null;
  expires_at: string | null;
  is_active: boolean;
}

// ArcGIS query configuration
const ARCGIS_QUERY_PARAMS = {
  where: '1=1',
  outFields: '*',
  f: 'geojson',
  resultRecordCount: '2000',
  returnGeometry: 'true',
  outSR: '4326'
};

const MAX_PAGINATION_ITERATIONS = 50; // Safety limit

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { layer_key, area_key = 'all', force_refresh = false }: FetchRequest = await req.json();

    if (!layer_key) {
      return new Response(
        JSON.stringify({ error: 'layer_key is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[gis-fetch] Starting fetch for layer: ${layer_key}, area: ${area_key}`);
    const startTime = Date.now();

    // Step 1: Fetch layer metadata
    const { data: layer, error: layerError } = await supabase
      .from('gis_layers')
      .select('*')
      .eq('layer_key', layer_key)
      .eq('status', 'active')
      .single();

    if (layerError || !layer) {
      console.error('[gis-fetch] Layer not found:', layerError);
      return new Response(
        JSON.stringify({ error: 'Layer not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Get latest version for change detection
    const { data: latestVersion } = await supabase
      .from('gis_layer_versions')
      .select('id, etag, checksum_sha256, expires_at, is_active')
      .eq('layer_id', layer.id)
      .eq('area_key', area_key)
      .eq('is_active', true)
      .single();

    // Step 3: Check if refresh is needed
    if (!force_refresh && latestVersion?.expires_at) {
      const expiresAt = new Date(latestVersion.expires_at);
      if (expiresAt > new Date()) {
        console.log('[gis-fetch] Cache still valid, skipping fetch');
        await logFetch(supabase, layer.id, null, 'unchanged', 200, 0, Date.now() - startTime, null);
        return new Response(
          JSON.stringify({
            status: 'unchanged',
            message: 'Cache still valid',
            expires_at: latestVersion.expires_at,
            version_id: latestVersion.id
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Step 4: Build proper fetch URL based on endpoint type
    const fetchUrl = buildFetchUrl(layer.source_url);
    const isArcGIS = isArcGISEndpoint(layer.source_url);
    
    console.log(`[gis-fetch] Fetching from: ${fetchUrl} (ArcGIS: ${isArcGIS})`);
    
    const fetchHeaders: Record<string, string> = {
      'Accept': 'application/json, application/geo+json',
      'User-Agent': 'SiteIntel-GIS-Fetcher/1.0',
    };

    // Add ETag for conditional requests
    if (latestVersion?.etag && layer.update_policy.method === 'etag') {
      fetchHeaders['If-None-Match'] = latestVersion.etag;
    }

    let geojson: any;
    let totalRecordCount = 0;
    let dataSize = 0;
    let newEtag: string | null = null;

    if (isArcGIS) {
      // Fetch with pagination for ArcGIS
      const result = await fetchArcGISWithPagination(fetchUrl, fetchHeaders);
      geojson = result.geojson;
      totalRecordCount = result.totalRecords;
      dataSize = result.dataSize;
      newEtag = result.etag;
      
      if (result.error) {
        console.error('[gis-fetch] ArcGIS fetch failed:', result.error);
        await logFetch(supabase, layer.id, null, 'error', result.httpStatus || 500, 0, Date.now() - startTime, result.error);
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: result.httpStatus || 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Standard fetch for non-ArcGIS endpoints
      const response = await fetch(fetchUrl, { headers: fetchHeaders });

      // Handle 304 Not Modified
      if (response.status === 304) {
        console.log('[gis-fetch] Source returned 304 Not Modified');
        
        const newExpiresAt = calculateExpiryDate(layer.update_policy.frequency);
        await supabase
          .from('gis_layer_versions')
          .update({ expires_at: newExpiresAt.toISOString() })
          .eq('id', latestVersion!.id);

        await logFetch(supabase, layer.id, latestVersion!.id, 'unchanged', 304, 0, Date.now() - startTime, null);

        return new Response(
          JSON.stringify({
            status: 'unchanged',
            message: 'Source data not modified (304)',
            version_id: latestVersion!.id
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!response.ok) {
        const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        console.error('[gis-fetch] Fetch failed:', errorMsg);
        await logFetch(supabase, layer.id, null, 'error', response.status, 0, Date.now() - startTime, errorMsg);
        
        return new Response(
          JSON.stringify({ error: errorMsg }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const rawData = await response.text();
      dataSize = new TextEncoder().encode(rawData).length;
      newEtag = response.headers.get('etag');

      try {
        geojson = JSON.parse(rawData);
        geojson = normalizeGeoJSON(geojson);
        totalRecordCount = geojson.features?.length || 0;
      } catch (e) {
        const errorMsg = `Invalid GeoJSON: ${e.message}`;
        console.error('[gis-fetch]', errorMsg);
        await logFetch(supabase, layer.id, null, 'error', response.status, dataSize, Date.now() - startTime, errorMsg);
        
        return new Response(
          JSON.stringify({ error: errorMsg }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Step 7: Compute checksum
    const checksum = await computeSHA256(JSON.stringify(geojson));

    // Step 8: Check if content actually changed
    if (!force_refresh && latestVersion?.checksum_sha256 === checksum) {
      console.log('[gis-fetch] Content unchanged (checksum match), extending expiry');
      
      const newExpiresAt = calculateExpiryDate(layer.update_policy.frequency);
      await supabase
        .from('gis_layer_versions')
        .update({ 
          expires_at: newExpiresAt.toISOString(),
          etag: newEtag 
        })
        .eq('id', latestVersion.id);

      await logFetch(supabase, layer.id, latestVersion.id, 'unchanged', 200, dataSize, Date.now() - startTime, null);

      return new Response(
        JSON.stringify({
          status: 'unchanged',
          message: 'Content checksum unchanged',
          version_id: latestVersion.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 9: Calculate bbox
    const bbox = calculateBoundingBox(geojson);

    // Step 10: Determine storage strategy
    const INLINE_THRESHOLD = 100 * 1024; // 100KB
    let storagePath: string | null = null;
    let inlineGeoJSON: any = null;

    if (dataSize > INLINE_THRESHOLD) {
      // Compress and upload to storage
      console.log(`[gis-fetch] Data size ${dataSize} bytes, uploading to storage`);
      const compressed = await compressGeoJSON(geojson);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      storagePath = `${layer_key}/${area_key}/${timestamp}.geojson.gz`;

      const { error: uploadError } = await supabase.storage
        .from('gis-data')
        .upload(storagePath, compressed, {
          contentType: 'application/gzip',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[gis-fetch] Upload failed:', uploadError);
        await logFetch(supabase, layer.id, null, 'error', 200, dataSize, Date.now() - startTime, `Upload failed: ${uploadError.message}`);
        
        return new Response(
          JSON.stringify({ error: `Storage upload failed: ${uploadError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[gis-fetch] Uploaded to: ${storagePath}`);
    } else {
      // Store inline
      console.log(`[gis-fetch] Data size ${dataSize} bytes, storing inline`);
      inlineGeoJSON = geojson;
    }

    // Step 11: Deactivate old version
    if (latestVersion) {
      await supabase
        .from('gis_layer_versions')
        .update({ is_active: false })
        .eq('id', latestVersion.id);
    }

    // Step 12: Insert new version
    const recordCount = geojson.features?.length || 0;
    const expiresAt = calculateExpiryDate(layer.update_policy.frequency);

    const { data: newVersion, error: versionError } = await supabase
      .from('gis_layer_versions')
      .insert({
        layer_id: layer.id,
        area_key,
        etag: newEtag,
        checksum_sha256: checksum,
        expires_at: expiresAt.toISOString(),
        record_count: recordCount,
        bbox: bbox ? `SRID=4326;${bbox}` : null,
        storage_path: storagePath,
        geojson: inlineGeoJSON,
        size_bytes: dataSize,
        is_active: true
      })
      .select()
      .single();

    if (versionError) {
      console.error('[gis-fetch] Failed to insert version:', versionError);
      await logFetch(supabase, layer.id, null, 'error', 200, dataSize, Date.now() - startTime, `DB insert failed: ${versionError.message}`);
      
      return new Response(
        JSON.stringify({ error: `Failed to save version: ${versionError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 13: Log success
    const duration = Date.now() - startTime;
    await logFetch(supabase, layer.id, newVersion.id, 'success', 200, dataSize, duration, null);

    console.log(`[gis-fetch] Success! Version ${newVersion.id}, ${recordCount} records, ${duration}ms`);

    return new Response(
      JSON.stringify({
        status: 'success',
        version_id: newVersion.id,
        record_count: recordCount,
        size_bytes: dataSize,
        storage_path: storagePath,
        checksum: checksum,
        expires_at: expiresAt.toISOString(),
        duration_ms: duration
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[gis-fetch] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Detect if URL is an ArcGIS endpoint
function isArcGISEndpoint(url: string): boolean {
  return url.includes('/MapServer/') || 
         url.includes('/FeatureServer/') || 
         url.includes('/arcgis/') ||
         url.includes('arcgisonline.com') ||
         url.includes('gis.hctx.net');
}

// Build proper fetch URL with query parameters for ArcGIS
function buildFetchUrl(sourceUrl: string): string {
  // If URL already has query parameters, use as-is
  if (sourceUrl.includes('?')) {
    return sourceUrl;
  }

  // For ArcGIS endpoints, append /query with params
  if (isArcGISEndpoint(sourceUrl)) {
    // Ensure URL ends with layer index
    let baseUrl = sourceUrl;
    
    // If URL ends with MapServer or FeatureServer without layer index, add /0
    if (baseUrl.match(/\/(MapServer|FeatureServer)\/?$/)) {
      baseUrl = baseUrl.replace(/\/?$/, '/0');
    }
    
    // Append /query if not already present
    if (!baseUrl.endsWith('/query')) {
      baseUrl = baseUrl.replace(/\/?$/, '/query');
    }

    // Build query string
    const params = new URLSearchParams(ARCGIS_QUERY_PARAMS);
    return `${baseUrl}?${params.toString()}`;
  }

  return sourceUrl;
}

// Fetch ArcGIS endpoint with pagination support
async function fetchArcGISWithPagination(
  baseUrl: string,
  headers: Record<string, string>
): Promise<{
  geojson: any;
  totalRecords: number;
  dataSize: number;
  etag: string | null;
  error?: string;
  httpStatus?: number;
}> {
  const allFeatures: any[] = [];
  let offset = 0;
  let totalDataSize = 0;
  let etag: string | null = null;
  let iteration = 0;
  
  const pageSize = parseInt(ARCGIS_QUERY_PARAMS.resultRecordCount);

  console.log(`[gis-fetch] Starting ArcGIS pagination from: ${baseUrl}`);

  while (iteration < MAX_PAGINATION_ITERATIONS) {
    iteration++;
    
    // Build URL with offset
    const url = new URL(baseUrl);
    url.searchParams.set('resultOffset', offset.toString());
    
    console.log(`[gis-fetch] Page ${iteration}: offset=${offset}`);

    try {
      const response = await fetch(url.toString(), { headers });

      if (!response.ok) {
        // Check if this is actually an HTML error page
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          return {
            geojson: { type: 'FeatureCollection', features: [] },
            totalRecords: 0,
            dataSize: 0,
            etag: null,
            error: `ArcGIS returned HTML instead of JSON (status ${response.status}). Check endpoint URL.`,
            httpStatus: response.status
          };
        }
        return {
          geojson: { type: 'FeatureCollection', features: [] },
          totalRecords: 0,
          dataSize: 0,
          etag: null,
          error: `HTTP ${response.status}: ${response.statusText}`,
          httpStatus: response.status
        };
      }

      if (iteration === 1) {
        etag = response.headers.get('etag');
      }

      const rawData = await response.text();
      totalDataSize += new TextEncoder().encode(rawData).length;

      // Check for HTML response (common error)
      if (rawData.trim().startsWith('<!') || rawData.trim().startsWith('<html')) {
        return {
          geojson: { type: 'FeatureCollection', features: [] },
          totalRecords: 0,
          dataSize: totalDataSize,
          etag: null,
          error: 'ArcGIS returned HTML instead of JSON. Check endpoint URL and parameters.',
          httpStatus: 200
        };
      }

      let data: any;
      try {
        data = JSON.parse(rawData);
      } catch (e) {
        return {
          geojson: { type: 'FeatureCollection', features: [] },
          totalRecords: 0,
          dataSize: totalDataSize,
          etag: null,
          error: `Failed to parse JSON: ${e.message}. Response: ${rawData.substring(0, 200)}`,
          httpStatus: 200
        };
      }

      // Check for ArcGIS error response
      if (data.error) {
        return {
          geojson: { type: 'FeatureCollection', features: [] },
          totalRecords: 0,
          dataSize: totalDataSize,
          etag: null,
          error: `ArcGIS error: ${data.error.message || JSON.stringify(data.error)}`,
          httpStatus: data.error.code || 400
        };
      }

      // Extract features - handle both GeoJSON and ArcGIS JSON formats
      let pageFeatures: any[] = [];
      
      if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
        // Standard GeoJSON response (when f=geojson works)
        pageFeatures = data.features;
      } else if (Array.isArray(data.features)) {
        // ArcGIS JSON format - convert to GeoJSON
        pageFeatures = data.features.map((f: any) => ({
          type: 'Feature',
          geometry: convertArcGISGeometry(f.geometry),
          properties: f.attributes || f.properties || {}
        }));
      }

      console.log(`[gis-fetch] Page ${iteration}: ${pageFeatures.length} features`);
      allFeatures.push(...pageFeatures);

      // Check if we've retrieved all records
      const exceededTransferLimit = data.exceededTransferLimit === true;
      
      if (!exceededTransferLimit || pageFeatures.length < pageSize) {
        // No more pages
        break;
      }

      offset += pageSize;
    } catch (e) {
      console.error(`[gis-fetch] Pagination error at offset ${offset}:`, e);
      if (allFeatures.length > 0) {
        // Return what we have
        console.log(`[gis-fetch] Returning ${allFeatures.length} features despite error`);
        break;
      }
      return {
        geojson: { type: 'FeatureCollection', features: [] },
        totalRecords: 0,
        dataSize: totalDataSize,
        etag: null,
        error: `Fetch error: ${e.message}`,
        httpStatus: 500
      };
    }
  }

  console.log(`[gis-fetch] Pagination complete: ${allFeatures.length} total features in ${iteration} pages`);

  return {
    geojson: {
      type: 'FeatureCollection',
      features: allFeatures
    },
    totalRecords: allFeatures.length,
    dataSize: totalDataSize,
    etag
  };
}

// Convert ArcGIS geometry to GeoJSON geometry
function convertArcGISGeometry(arcgisGeom: any): any {
  if (!arcgisGeom) return null;

  // Already GeoJSON format
  if (arcgisGeom.type && ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'].includes(arcgisGeom.type)) {
    return arcgisGeom;
  }

  // ArcGIS Point
  if (arcgisGeom.x !== undefined && arcgisGeom.y !== undefined) {
    return {
      type: 'Point',
      coordinates: [arcgisGeom.x, arcgisGeom.y]
    };
  }

  // ArcGIS Polyline
  if (arcgisGeom.paths) {
    if (arcgisGeom.paths.length === 1) {
      return {
        type: 'LineString',
        coordinates: arcgisGeom.paths[0]
      };
    }
    return {
      type: 'MultiLineString',
      coordinates: arcgisGeom.paths
    };
  }

  // ArcGIS Polygon
  if (arcgisGeom.rings) {
    // Single ring = Polygon, multiple rings = check for holes or MultiPolygon
    if (arcgisGeom.rings.length === 1) {
      return {
        type: 'Polygon',
        coordinates: arcgisGeom.rings
      };
    }
    // For simplicity, treat as Polygon with holes
    // (proper handling would check ring orientation for multi-part)
    return {
      type: 'Polygon',
      coordinates: arcgisGeom.rings
    };
  }

  // Unknown format
  console.warn('[gis-fetch] Unknown ArcGIS geometry format:', JSON.stringify(arcgisGeom).substring(0, 100));
  return null;
}

// Helper: Normalize GeoJSON to FeatureCollection
function normalizeGeoJSON(data: any): any {
  // Handle ArcGIS REST response
  if (data.features && Array.isArray(data.features) && !data.type) {
    return {
      type: 'FeatureCollection',
      features: data.features.map((f: any) => ({
        type: 'Feature',
        geometry: convertArcGISGeometry(f.geometry) || f.geometry || null,
        properties: f.attributes || f.properties || {}
      }))
    };
  }

  // Already valid GeoJSON FeatureCollection
  if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
    return data;
  }

  // Single Feature
  if (data.type === 'Feature') {
    return {
      type: 'FeatureCollection',
      features: [data]
    };
  }

  // Geometry only
  if (data.type && ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'].includes(data.type)) {
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: data,
        properties: {}
      }]
    };
  }

  throw new Error('Unsupported GeoJSON format');
}

// Helper: Calculate bounding box in WKT format
function calculateBoundingBox(geojson: any): string | null {
  if (!geojson.features || geojson.features.length === 0) return null;

  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;

  for (const feature of geojson.features) {
    if (!feature.geometry || !feature.geometry.coordinates) continue;

    const coords = flattenCoordinates(feature.geometry.coordinates);
    for (const [lng, lat] of coords) {
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    }
  }

  if (!isFinite(minLng)) return null;

  // Return WKT POLYGON
  return `POLYGON((${minLng} ${minLat},${maxLng} ${minLat},${maxLng} ${maxLat},${minLng} ${maxLat},${minLng} ${minLat}))`;
}

function flattenCoordinates(coords: any): number[][] {
  if (typeof coords[0] === 'number') return [coords];
  return coords.flatMap(flattenCoordinates);
}

// Helper: Compress GeoJSON with gzip
async function compressGeoJSON(geojson: any): Promise<Uint8Array> {
  const jsonString = JSON.stringify(geojson);
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);
  
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(data);
  writer.close();

  const compressed: Uint8Array[] = [];
  const reader = cs.readable.getReader();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    compressed.push(value);
  }

  // Concatenate all chunks
  const totalLength = compressed.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of compressed) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

// Helper: Compute SHA256 checksum
async function computeSHA256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper: Calculate expiry date based on frequency
function calculateExpiryDate(frequency: string): Date {
  const now = new Date();
  
  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case 'quarterly':
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to daily
  }
}

// Helper: Log fetch to gis_fetch_logs
async function logFetch(
  supabase: any,
  layerId: string,
  versionId: string | null,
  status: string,
  httpStatus: number,
  bytes: number,
  durationMs: number,
  errorMessage: string | null
): Promise<void> {
  try {
    await supabase.from('gis_fetch_logs').insert({
      layer_id: layerId,
      layer_version_id: versionId,
      status,
      http_status: httpStatus,
      bytes_processed: bytes,
      duration_ms: durationMs,
      error_message: errorMessage,
      retry_count: 0
    });
  } catch (e) {
    console.error('[gis-fetch] Failed to log fetch:', e);
  }
}
