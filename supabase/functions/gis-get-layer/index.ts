import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';

interface GetLayerRequest {
  layer_key: string;
  area_key?: string;
  bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  include_expired?: boolean;
}

interface LayerResponse {
  version_id: string;
  layer_key: string;
  area_key: string;
  record_count: number;
  fetched_at: string;
  expires_at: string;
  is_expired: boolean;
  storage_url?: string;
  geojson?: any;
  bbox?: any;
  checksum: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse query parameters
    const url = new URL(req.url);
    const layer_key = url.searchParams.get('layer_key');
    const area_key = url.searchParams.get('area_key') || 'all';
    const include_expired = url.searchParams.get('include_expired') === 'true';
    const bboxParam = url.searchParams.get('bbox');

    if (!layer_key) {
      return new Response(
        JSON.stringify({ error: 'layer_key query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let bbox: [number, number, number, number] | undefined;
    if (bboxParam) {
      try {
        const coords = bboxParam.split(',').map(Number);
        if (coords.length === 4 && coords.every(n => !isNaN(n))) {
          bbox = coords as [number, number, number, number];
        }
      } catch (e) {
        console.warn('[gis-get-layer] Invalid bbox format:', bboxParam);
      }
    }

    console.log(`[gis-get-layer] Fetching layer: ${layer_key}, area: ${area_key}`);

    // Step 1: Fetch layer metadata
    const { data: layer, error: layerError } = await supabase
      .from('gis_layers')
      .select('id, layer_key, provider, category')
      .eq('layer_key', layer_key)
      .eq('status', 'active')
      .single();

    if (layerError || !layer) {
      console.error('[gis-get-layer] Layer not found:', layerError);
      return new Response(
        JSON.stringify({ error: 'Layer not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Fetch latest active version
    let versionQuery = supabase
      .from('gis_layer_versions')
      .select('*')
      .eq('layer_id', layer.id)
      .eq('area_key', area_key)
      .eq('is_active', true);

    // Optional: Spatial filter by bbox
    if (bbox) {
      const bboxWKT = `POLYGON((${bbox[0]} ${bbox[1]},${bbox[2]} ${bbox[1]},${bbox[2]} ${bbox[3]},${bbox[0]} ${bbox[3]},${bbox[0]} ${bbox[1]}))`;
      versionQuery = versionQuery.overlaps('bbox', bboxWKT);
    }

    const { data: version, error: versionError } = await versionQuery.single();

    if (versionError || !version) {
      console.error('[gis-get-layer] Version not found:', versionError);
      return new Response(
        JSON.stringify({ 
          error: 'No cached data available for this layer/area',
          layer_key,
          area_key,
          hint: 'Run gis-fetch-with-versioning to populate cache'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Check expiry status
    const now = new Date();
    const expiresAt = version.expires_at ? new Date(version.expires_at) : null;
    const isExpired = expiresAt ? expiresAt < now : false;

    if (isExpired && !include_expired) {
      console.warn('[gis-get-layer] Cache expired, returning stale data with warning');
    }

    // Step 4: Prepare response
    const response: LayerResponse = {
      version_id: version.id,
      layer_key: layer.layer_key,
      area_key: version.area_key,
      record_count: version.record_count || 0,
      fetched_at: version.fetched_at,
      expires_at: version.expires_at,
      is_expired: isExpired,
      checksum: version.checksum_sha256,
      bbox: version.bbox
    };

    // Step 5: Handle storage vs inline data
    if (version.storage_path) {
      // Large dataset: Generate signed URL
      console.log(`[gis-get-layer] Generating signed URL for: ${version.storage_path}`);
      
      const { data: signedUrlData, error: signedError } = await supabase.storage
        .from('gis')
        .createSignedUrl(version.storage_path, 3600); // 1 hour expiry

      if (signedError) {
        console.error('[gis-get-layer] Failed to generate signed URL:', signedError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to generate download URL',
            details: signedError.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      response.storage_url = signedUrlData.signedUrl;
      
      console.log(`[gis-get-layer] Success! Signed URL generated (expires in 1h)`);
    } else if (version.geojson) {
      // Small dataset: Return inline
      console.log(`[gis-get-layer] Returning inline GeoJSON (${JSON.stringify(version.geojson).length} bytes)`);
      response.geojson = version.geojson;
    } else {
      // No data available
      console.error('[gis-get-layer] Version exists but has no data');
      return new Response(
        JSON.stringify({ 
          error: 'Data version exists but contains no data',
          version_id: version.id
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 6: Add caching headers for CDN
    const cacheHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': isExpired 
        ? 'public, max-age=300, stale-while-revalidate=86400' // 5min cache, 1 day stale
        : 'public, max-age=3600, stale-while-revalidate=86400' // 1h cache, 1 day stale
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: cacheHeaders }
    );

  } catch (error) {
    console.error('[gis-get-layer] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
