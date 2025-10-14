import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { logExternalCall } from "../_shared/observability.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { application_id, center, zoom = 17, size = '800x600' } = await req.json();
    console.log(`[render-static-map] Generating map for application ${application_id}`);

    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleApiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY not configured');
    }

    // Build Google Static Maps URL with styling
    const baseUrl = new URL('https://maps.googleapis.com/maps/api/staticmap');
    baseUrl.searchParams.set('center', `${center.lat},${center.lng}`);
    baseUrl.searchParams.set('zoom', zoom.toString());
    baseUrl.searchParams.set('size', size);
    baseUrl.searchParams.set('maptype', 'roadmap');
    baseUrl.searchParams.set('key', googleApiKey);

    // Add styled basemap
    baseUrl.searchParams.set('style', 'feature:all|element:labels|visibility:on');

    // Add center marker (property location)
    baseUrl.searchParams.set('markers', `color:blue|${center.lat},${center.lng}`);

    console.log('[render-static-map] Fetching from Google Static Maps API');
    const mapStartTime = Date.now();
    
    const mapResponse = await fetch(baseUrl.toString());
    await logExternalCall(
      supabase,
      'google_static_maps',
      baseUrl.toString(),
      Date.now() - mapStartTime,
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

    const fileName = `reports/${application_id}/static_map.png`;
    console.log(`[render-static-map] Uploading to Supabase Storage: ${fileName}`);

    const { data: uploadData, error: uploadError } = await supabase.storage
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
      .createSignedUrl(fileName, 259200); // 72 hours

    if (!signedUrlData?.signedUrl) {
      throw new Error('Failed to generate signed URL');
    }

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
