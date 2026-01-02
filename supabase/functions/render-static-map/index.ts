import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { logExternalCall } from "../_shared/observability.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a deterministic signature hash for map parameters
async function generateMapSignature(params: {
  center: { lat: number; lng: number };
  zoom: number;
  size: string;
  parcel_geometry?: any;
  flood_geometry?: any;
}): Promise<string> {
  const signatureData = JSON.stringify({
    lat: Math.round(params.center.lat * 1000000) / 1000000, // 6 decimal precision
    lng: Math.round(params.center.lng * 1000000) / 1000000,
    zoom: params.zoom,
    size: params.size,
    parcel: params.parcel_geometry ? JSON.stringify(params.parcel_geometry) : null,
    flood: params.flood_geometry ? JSON.stringify(params.flood_geometry) : null,
  });
  
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureData);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate SHA-256 hash for image content
async function generateImageHash(buffer: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { application_id, center, zoom = 17, size = '800x600', parcel_geometry, flood_geometry } = await req.json();
    console.log('[render-static-map] Request received:', {
      application_id,
      center,
      zoom,
      size,
      has_parcel_geometry: !!parcel_geometry,
      has_flood_geometry: !!flood_geometry,
      timestamp: new Date().toISOString()
    });

    // Generate signature for deduplication
    const mapSignature = await generateMapSignature({ center, zoom, size, parcel_geometry, flood_geometry });
    console.log(`[render-static-map] Map signature: ${mapSignature.substring(0, 16)}...`);

    // Check for existing cached asset with this signature
    const { data: existingAsset } = await supabase
      .from('google_static_maps_assets')
      .select('*')
      .eq('map_signature_hash', mapSignature)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingAsset) {
      console.log(`[render-static-map] Cache HIT - returning existing asset from ${existingAsset.fetched_at}`);
      
      // Generate fresh signed URL from storage path
      const { data: signedUrlData } = await supabase.storage
        .from('reports')
        .createSignedUrl(existingAsset.storage_path, 259200);

      if (signedUrlData?.signedUrl) {
        // Update report_assets with cached URL
        const { data: report } = await supabase
          .from('reports')
          .select('report_assets')
          .eq('application_id', application_id)
          .single();

        const updatedAssets = {
          ...(report?.report_assets || {}),
          static_map_url: signedUrlData.signedUrl,
          static_map_generated_at: existingAsset.fetched_at,
          static_map_center: center,
          static_map_zoom: zoom,
          has_flood_overlay: !!flood_geometry,
          cache_hit: true,
        };

        await supabase
          .from('reports')
          .update({ report_assets: updatedAssets })
          .eq('application_id', application_id);

        return new Response(
          JSON.stringify({
            static_map_url: signedUrlData.signedUrl,
            generated_at: existingAsset.fetched_at,
            cache_hit: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('[render-static-map] Cache MISS - fetching from Google API');

    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleApiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY not configured');
    }

    // Build Google Static Maps URL with enhanced styling
    const baseUrl = new URL('https://maps.googleapis.com/maps/api/staticmap');
    baseUrl.searchParams.set('center', `${center.lat},${center.lng}`);
    baseUrl.searchParams.set('zoom', zoom.toString());
    baseUrl.searchParams.set('size', size);
    baseUrl.searchParams.set('scale', '2');
    baseUrl.searchParams.set('maptype', 'hybrid');
    baseUrl.searchParams.set('key', googleApiKey);

    // Add custom styling to simplify the map
    baseUrl.searchParams.append('style', 'feature:poi|visibility:off');
    baseUrl.searchParams.append('style', 'feature:transit|visibility:off');

    // Add flood zone overlay first (so it renders under parcel boundary)
    if (flood_geometry && flood_geometry.coordinates && flood_geometry.coordinates.length > 0) {
      try {
        const floodCoords = flood_geometry.type === 'Polygon' 
          ? flood_geometry.coordinates[0] 
          : flood_geometry.coordinates;
        
        const floodPath = floodCoords
          .map((coord: number[]) => `${coord[1]},${coord[0]}`)
          .join('|');
        
        baseUrl.searchParams.append('path', `fillcolor:0x330000FF|color:0x00FFFFFF|weight:2|${floodPath}`);
        console.log('[render-static-map] Added flood zone overlay with', floodCoords.length, 'points');
      } catch (error) {
        console.warn('[render-static-map] Failed to add flood zone overlay:', error);
      }
    }

    // Add parcel boundary path if geometry is available
    if (parcel_geometry && parcel_geometry.coordinates && parcel_geometry.coordinates.length > 0) {
      try {
        const coords = parcel_geometry.type === 'Polygon' 
          ? parcel_geometry.coordinates[0] 
          : parcel_geometry.coordinates;
        
        const pathCoords = coords
          .map((coord: number[]) => `${coord[1]},${coord[0]}`)
          .join('|');
        
        baseUrl.searchParams.append('path', `color:0xff0000ff|weight:3|${pathCoords}`);
        console.log('[render-static-map] Added parcel boundary path with', coords.length, 'points');
      } catch (error) {
        console.warn('[render-static-map] Failed to add parcel boundary:', error);
      }
    }

    // Add center marker
    baseUrl.searchParams.set('markers', `color:red|${center.lat},${center.lng}`);

    console.log('[render-static-map] Fetching from Google Static Maps API...');
    const mapStartTime = Date.now();
    
    // Fetch with retry logic
    async function fetchWithRetry(url: string, maxRetries = 3) {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const response = await fetch(url);
          if (response.ok) return response;
          
          if (attempt < maxRetries - 1) {
            const delay = Math.pow(2, attempt) * 500;
            console.log(`[render-static-map] Retry ${attempt + 1} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } catch (error) {
          if (attempt === maxRetries - 1) throw error;
        }
      }
      throw new Error('Max retries exceeded');
    }
    
    const mapResponse = await fetchWithRetry(baseUrl.toString());
    const apiDuration = Date.now() - mapStartTime;
    console.log(`[render-static-map] Google API response: ${mapResponse.status} in ${apiDuration}ms`);
    
    await logExternalCall(
      supabase,
      'google_static_maps',
      baseUrl.toString(),
      apiDuration,
      mapResponse.ok,
      application_id
    );

    if (!mapResponse.ok) {
      throw new Error(`Google Static Maps API error: ${mapResponse.status}`);
    }

    // Upload to Supabase Storage
    const mapBlob = await mapResponse.blob();
    const mapArrayBuffer = await mapBlob.arrayBuffer();
    const mapBuffer = new Uint8Array(mapArrayBuffer);

    // Generate image hash for provenance
    const imageHash = await generateImageHash(mapBuffer);

    // Parse size for storage
    const [width, height] = size.split('x').map(Number);
    const hasFloodOverlay = !!flood_geometry;
    const fileName = `reports/${application_id}/static_map_${mapSignature.substring(0, 12)}.png`;
    
    console.log(`[render-static-map] Uploading to Supabase Storage: ${fileName}`);

    const { error: uploadError } = await supabase.storage
      .from('reports')
      .upload(fileName, mapBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('[render-static-map] Upload error:', uploadError);
      throw uploadError;
    }

    // Generate signed URL (valid for 72 hours)
    const { data: signedUrlData } = await supabase.storage
      .from('reports')
      .createSignedUrl(fileName, 259200);

    if (!signedUrlData?.signedUrl) {
      throw new Error('Failed to generate signed URL');
    }

    // Store asset in google_static_maps_assets for future deduplication
    await supabase
      .from('google_static_maps_assets')
      .upsert({
        application_id,
        map_signature_hash: mapSignature,
        params_json: { center, zoom, size, has_parcel: !!parcel_geometry, has_flood: hasFloodOverlay },
        storage_path: fileName,
        sha256: imageHash,
        width,
        height,
        map_type: 'hybrid',
        fetched_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      }, { onConflict: 'map_signature_hash' });

    // Update report_assets in reports table
    const { data: report } = await supabase
      .from('reports')
      .select('report_assets')
      .eq('application_id', application_id)
      .single();

    const updatedAssets = {
      ...(report?.report_assets || {}),
      static_map_url: signedUrlData.signedUrl,
      static_map_generated_at: new Date().toISOString(),
      static_map_center: center,
      static_map_zoom: zoom,
      has_flood_overlay: hasFloodOverlay,
      flood_geometry_included: hasFloodOverlay,
      cache_hit: false,
    };

    await supabase
      .from('reports')
      .update({ report_assets: updatedAssets })
      .eq('application_id', application_id);

    console.log(`[render-static-map] Success! Generated map in ${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify({
        static_map_url: signedUrlData.signedUrl,
        generated_at: new Date().toISOString(),
        cache_hit: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[render-static-map] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});