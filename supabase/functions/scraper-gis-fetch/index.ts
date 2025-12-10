/**
 * ScraperAPI-powered GIS Layer Fetch
 * Fetches GIS data through ScraperAPI with tiered strategy
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { smartFetch, SmartFetchOptions } from "../_shared/scraper-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FetchRequest {
  layer_key?: string;
  map_server_id?: string;
  query_params?: Record<string, string>;
  force_scraper?: boolean;
  bbox?: string;
  max_records?: number;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: FetchRequest = await req.json();
    const { layer_key, map_server_id, query_params, force_scraper, bbox, max_records } = body;

    console.log(`[scraper-gis-fetch] Request for layer: ${layer_key || map_server_id}`);

    // Get map server configuration
    let mapServer: any;
    
    if (map_server_id) {
      const { data, error } = await supabase
        .from('map_servers')
        .select('*')
        .eq('id', map_server_id)
        .single();
      
      if (error || !data) {
        throw new Error(`Map server not found: ${map_server_id}`);
      }
      mapServer = data;
    } else if (layer_key) {
      const { data, error } = await supabase
        .from('map_servers')
        .select('*')
        .eq('server_key', layer_key)
        .single();
      
      if (error || !data) {
        throw new Error(`Layer not found: ${layer_key}`);
      }
      mapServer = data;
    } else {
      throw new Error('Either layer_key or map_server_id is required');
    }

    console.log(`[scraper-gis-fetch] Found map server: ${mapServer.server_key}, mode: ${mapServer.scraper_mode}`);

    // Build ArcGIS REST query URL
    const baseUrl = mapServer.base_url;
    const params = new URLSearchParams({
      f: 'geojson',
      outFields: '*',
      where: '1=1',
      returnGeometry: 'true',
      resultRecordCount: String(max_records || mapServer.max_record_count || 1000),
      ...query_params
    });

    if (bbox) {
      params.set('geometry', bbox);
      params.set('geometryType', 'esriGeometryEnvelope');
      params.set('spatialRel', 'esriSpatialRelIntersects');
    }

    const queryUrl = `${baseUrl}/query?${params.toString()}`;
    console.log(`[scraper-gis-fetch] Query URL: ${queryUrl.substring(0, 100)}...`);

    // Determine scraper mode
    let scraperMode: 'disabled' | 'fallback' | 'primary' = mapServer.scraper_mode || 'fallback';
    
    // Override to primary if force_scraper is set
    if (force_scraper) {
      scraperMode = 'primary';
    }

    // Parse scraper config from map server
    const scraperConfig = mapServer.scraper_config || {};

    const fetchOptions: SmartFetchOptions = {
      scraperMode,
      scraperConfig: {
        render: scraperConfig.render || false,
        country_code: scraperConfig.country_code || 'us',
        premium: scraperConfig.premium || false
      },
      timeout: 45000,
      retries: 3,
      mapServerId: mapServer.id,
      endpointType: 'gis',
      cacheTtlHours: scraperConfig.cache_ttl_hours || 24
    };

    // Execute fetch with smart strategy
    const result = await smartFetch(queryUrl, fetchOptions);

    console.log(`[scraper-gis-fetch] Fetch completed via ${result.source} in ${result.responseTimeMs}ms, credits: ${result.apiCreditsUsed}`);

    // Validate GeoJSON response
    const geojson = result.data;
    if (!geojson || (geojson.type !== 'FeatureCollection' && !geojson.features)) {
      console.warn('[scraper-gis-fetch] Response is not valid GeoJSON:', JSON.stringify(geojson).substring(0, 200));
      throw new Error('Invalid GeoJSON response from server');
    }

    const featureCount = geojson.features?.length || 0;
    console.log(`[scraper-gis-fetch] Retrieved ${featureCount} features`);

    return new Response(
      JSON.stringify({
        success: true,
        data: geojson,
        meta: {
          layer_key: mapServer.server_key,
          feature_count: featureCount,
          source: result.source,
          response_time_ms: result.responseTimeMs,
          api_credits_used: result.apiCreditsUsed,
          scraper_mode: scraperMode,
          query_url: queryUrl
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[scraper-gis-fetch] Error:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        meta: {
          duration_ms: Date.now() - startTime
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
