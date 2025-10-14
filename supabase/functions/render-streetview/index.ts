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

    const { application_id, location, headings = [0, 90, 180, 270], size = '640x400' } = await req.json();
    console.log('[render-streetview] Request received:', {
      application_id,
      location,
      headings,
      size,
      timestamp: new Date().toISOString()
    });

    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleApiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY not configured');
    }

    // Fetch with retry logic
    async function fetchWithRetry(url: string, maxRetries = 3) {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const response = await fetch(url);
          if (response.ok) return response;
          
          if (attempt < maxRetries - 1) {
            const delay = Math.pow(2, attempt) * 500;
            console.log(`[render-streetview] Retry ${attempt + 1} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } catch (error) {
          if (attempt === maxRetries - 1) throw error;
        }
      }
      throw new Error('Max retries exceeded');
    }

    const directionLabels = ['N', 'E', 'S', 'W'];
    const streetviewImages: Array<{ direction: string; heading: number; url: string }> = [];

    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      const direction = directionLabels[i];

      const streetViewUrl = new URL('https://maps.googleapis.com/maps/api/streetview');
      streetViewUrl.searchParams.set('size', size);
      streetViewUrl.searchParams.set('location', `${location.lat},${location.lng}`);
      streetViewUrl.searchParams.set('heading', heading.toString());
      streetViewUrl.searchParams.set('pitch', '0');
      streetViewUrl.searchParams.set('key', googleApiKey);

      console.log(`[render-streetview] Fetching ${direction} view (heading ${heading})`);
      const viewStartTime = Date.now();
      
      const response = await fetchWithRetry(streetViewUrl.toString());
      await logExternalCall(
        supabase,
        'google_street_view',
        streetViewUrl.toString(),
        Date.now() - viewStartTime,
        response.ok,
        application_id
      );

      if (!response.ok) {
        console.warn(`[render-streetview] Failed to fetch ${direction} view:`, response.status);
        continue; // Skip this view if unavailable
      }

      // Check if Street View is available (Google returns a 200 even when no imagery)
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('image')) {
        console.warn(`[render-streetview] No Street View imagery available for ${direction}`);
        continue;
      }

      // Upload to Supabase Storage
      const imageBlob = await response.blob();
      const imageArrayBuffer = await imageBlob.arrayBuffer();
      const imageBuffer = new Uint8Array(imageArrayBuffer);

      const fileName = `reports/${application_id}/streetview_${direction}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(fileName, imageBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error(`[render-streetview] Upload error for ${direction}:`, uploadError);
        continue;
      }

      // Generate signed URL
      const { data: signedUrlData } = await supabase.storage
        .from('reports')
        .createSignedUrl(fileName, 259200); // 72 hours

      if (signedUrlData?.signedUrl) {
        streetviewImages.push({
          direction,
          heading,
          url: signedUrlData.signedUrl,
        });
      }
    }

    // Update report_assets
    const { data: report } = await supabase
      .from('reports')
      .select('report_assets')
      .eq('application_id', application_id)
      .single();

    const updatedAssets = {
      ...(report?.report_assets || {}),
      streetview: streetviewImages,
      streetview_available: streetviewImages.length > 0,
      streetview_generated_at: new Date().toISOString(),
    };

    await supabase
      .from('reports')
      .update({ report_assets: updatedAssets })
      .eq('application_id', application_id);

    console.log(`[render-streetview] Success! Generated ${streetviewImages.length} views in ${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify({
        streetview: streetviewImages,
        streetview_available: streetviewImages.length > 0,
        generated_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[render-streetview] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
