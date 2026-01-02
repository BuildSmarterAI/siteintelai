import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { logExternalCall } from "../_shared/observability.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a deterministic signature hash for street view parameters
async function generateSVSignature(params: {
  lat: number;
  lng: number;
  heading: number;
  pitch?: number;
  fov?: number;
}): Promise<string> {
  const signatureData = JSON.stringify({
    lat: Math.round(params.lat * 100000) / 100000, // 5 decimal precision (~1m accuracy)
    lng: Math.round(params.lng * 100000) / 100000,
    heading: params.heading,
    pitch: params.pitch || 0,
    fov: params.fov || 90,
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

    // Fetch with retry logic (limited retries)
    async function fetchWithRetry(url: string, maxRetries = 2) {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const response = await fetch(url);
          return response; // Return even if not ok - we'll check status separately
        } catch (error) {
          if (attempt === maxRetries - 1) throw error;
          const delay = Math.pow(2, attempt) * 500;
          console.log(`[render-streetview] Retry ${attempt + 1} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      throw new Error('Max retries exceeded');
    }

    const directionLabels = ['N', 'E', 'S', 'W'];
    const streetviewImages: Array<{ direction: string; heading: number; url: string; pano_id?: string }> = [];
    const assetsToUpsert: any[] = [];

    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      const direction = directionLabels[i];

      // Generate signature for this specific view
      const svSignature = await generateSVSignature({
        lat: location.lat,
        lng: location.lng,
        heading,
        pitch: 0,
        fov: 90,
      });

      // Check for existing cached asset with this signature
      const { data: existingAsset } = await supabase
        .from('google_streetview_assets')
        .select('*')
        .eq('sv_signature_hash', svSignature)
        .single();

      // FALLBACK LADDER: Check existing asset status
      if (existingAsset) {
        // If marked as not_available, skip immediately (don't retry endlessly)
        if (existingAsset.status === 'not_available') {
          console.log(`[render-streetview] ${direction}: SKIP - previously marked not_available`);
          continue;
        }

        // If we have a valid asset with storage path, reuse it
        if (existingAsset.status === 'available' && existingAsset.storage_path) {
          console.log(`[render-streetview] ${direction}: Cache HIT - reusing ${existingAsset.storage_path}`);
          
          const { data: signedUrlData } = await supabase.storage
            .from('reports')
            .createSignedUrl(existingAsset.storage_path, 259200);

          if (signedUrlData?.signedUrl) {
            streetviewImages.push({
              direction,
              heading,
              url: signedUrlData.signedUrl,
              pano_id: existingAsset.pano_id,
            });
            continue;
          }
        }

        // If in error state with too many retries, skip
        if (existingAsset.status === 'error' && existingAsset.retry_count >= 3) {
          console.log(`[render-streetview] ${direction}: SKIP - max retries exceeded (${existingAsset.retry_count})`);
          continue;
        }
      }

      // Cache MISS or need to retry - fetch from Google
      console.log(`[render-streetview] ${direction}: Cache MISS - fetching from Google API`);

      const streetViewUrl = new URL('https://maps.googleapis.com/maps/api/streetview');
      streetViewUrl.searchParams.set('size', size);
      streetViewUrl.searchParams.set('location', `${location.lat},${location.lng}`);
      streetViewUrl.searchParams.set('heading', heading.toString());
      streetViewUrl.searchParams.set('pitch', '0');
      streetViewUrl.searchParams.set('key', googleApiKey);

      const viewStartTime = Date.now();
      
      try {
        const response = await fetchWithRetry(streetViewUrl.toString());
        const apiDuration = Date.now() - viewStartTime;
        
        await logExternalCall(
          supabase,
          'google_street_view',
          streetViewUrl.toString(),
          apiDuration,
          response.ok,
          application_id
        );

        // Check if Street View is available
        const contentType = response.headers.get('content-type');
        const isImage = contentType?.includes('image');
        
        if (!response.ok || !isImage) {
          // Mark as not_available to prevent future retries
          console.log(`[render-streetview] ${direction}: No imagery available - marking not_available`);
          
          assetsToUpsert.push({
            application_id,
            sv_signature_hash: svSignature,
            lat: location.lat,
            lng: location.lng,
            heading,
            pitch: 0,
            fov: 90,
            params_json: { size, direction },
            status: 'not_available',
            error_message: !response.ok ? `HTTP ${response.status}` : 'No Street View imagery at this location',
            retry_count: (existingAsset?.retry_count || 0) + 1,
            fetched_at: new Date().toISOString(),
          });
          continue;
        }

        // Success - upload and store
        const imageBlob = await response.blob();
        const imageArrayBuffer = await imageBlob.arrayBuffer();
        const imageBuffer = new Uint8Array(imageArrayBuffer);
        const imageHash = await generateImageHash(imageBuffer);

        const fileName = `reports/${application_id}/streetview_${direction}_${svSignature.substring(0, 8)}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('reports')
          .upload(fileName, imageBuffer, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          console.error(`[render-streetview] Upload error for ${direction}:`, uploadError);
          
          assetsToUpsert.push({
            application_id,
            sv_signature_hash: svSignature,
            lat: location.lat,
            lng: location.lng,
            heading,
            pitch: 0,
            fov: 90,
            params_json: { size, direction },
            status: 'error',
            error_message: uploadError.message,
            retry_count: (existingAsset?.retry_count || 0) + 1,
            fetched_at: new Date().toISOString(),
          });
          continue;
        }

        // Generate signed URL
        const { data: signedUrlData } = await supabase.storage
          .from('reports')
          .createSignedUrl(fileName, 259200);

        if (signedUrlData?.signedUrl) {
          streetviewImages.push({
            direction,
            heading,
            url: signedUrlData.signedUrl,
          });

          // Store successful asset for future deduplication
          assetsToUpsert.push({
            application_id,
            sv_signature_hash: svSignature,
            lat: location.lat,
            lng: location.lng,
            heading,
            pitch: 0,
            fov: 90,
            params_json: { size, direction },
            status: 'available',
            storage_path: fileName,
            sha256: imageHash,
            retry_count: 0,
            fetched_at: new Date().toISOString(),
          });
        }
      } catch (fetchError) {
        console.error(`[render-streetview] Fetch error for ${direction}:`, fetchError);
        
        assetsToUpsert.push({
          application_id,
          sv_signature_hash: svSignature,
          lat: location.lat,
          lng: location.lng,
          heading,
          pitch: 0,
          fov: 90,
          params_json: { size, direction },
          status: 'error',
          error_message: fetchError instanceof Error ? fetchError.message : 'Unknown error',
          retry_count: (existingAsset?.retry_count || 0) + 1,
          fetched_at: new Date().toISOString(),
        });
      }
    }

    // Batch upsert all asset records
    if (assetsToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('google_streetview_assets')
        .upsert(assetsToUpsert, { onConflict: 'sv_signature_hash' });
      
      if (upsertError) {
        console.warn('[render-streetview] Asset upsert warning:', upsertError);
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
      streetview_directions_available: streetviewImages.map(img => img.direction),
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