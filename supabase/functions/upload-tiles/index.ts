import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AWS signing helpers
async function hmacSha256(key: Uint8Array, message: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message));
  return new Uint8Array(signature);
}

async function sha256(message: string | Uint8Array): Promise<string> {
  const data = typeof message === 'string' ? new TextEncoder().encode(message) : message;
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function toHex(arr: Uint8Array): string {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSignatureKey(
  secretKey: string, dateStamp: string, region: string, service: string
): Promise<Uint8Array> {
  const kDate = await hmacSha256(new TextEncoder().encode("AWS4" + secretKey), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, "aws4_request");
}

interface UploadRequest {
  layer: string;
  version: string;
  jurisdiction: string;
  tiles: Array<{
    z: number;
    x: number;
    y: number;
    data: string; // base64-encoded .pbf
  }>;
  invalidate_cache?: boolean;
  register_tileset?: boolean;
  metadata?: {
    min_zoom?: number;
    max_zoom?: number;
    bounds?: number[];
    record_count?: number;
  };
}

async function uploadToS3(
  bucket: string,
  key: string,
  body: Uint8Array,
  contentType: string,
  accessKeyId: string,
  secretAccessKey: string,
  region: string
): Promise<{ success: boolean; error?: string }> {
  const host = `${bucket}.s3.${region}.amazonaws.com`;
  const method = "PUT";
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  
  const payloadHash = await sha256(body);
  
  const canonicalUri = '/' + key;
  const canonicalQuerystring = '';
  const canonicalHeaders = 
    `cache-control:public, max-age=31536000, immutable\n` +
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  
  const signedHeaders = 'cache-control;content-type;host;x-amz-content-sha256;x-amz-date';
  
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuerystring,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    await sha256(canonicalRequest)
  ].join('\n');
  
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, 's3');
  const signature = toHex(await hmacSha256(signingKey, stringToSign));
  
  const authorizationHeader = 
    `${algorithm} Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  try {
    const response = await fetch(`https://${host}${canonicalUri}`, {
      method,
      headers: {
        'Host': host,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'x-amz-date': amzDate,
        'x-amz-content-sha256': payloadHash,
        'Authorization': authorizationHeader,
      },
      body,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`S3 upload failed for ${key}:`, errorText);
      return { success: false, error: errorText };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`S3 upload error for ${key}:`, error);
    return { success: false, error: error.message };
  }
}

async function invalidateCloudFront(
  distributionId: string,
  paths: string[],
  accessKeyId: string,
  secretAccessKey: string,
  region: string
): Promise<{ success: boolean; invalidationId?: string; error?: string }> {
  const host = 'cloudfront.amazonaws.com';
  const method = 'POST';
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  
  const callerReference = `siteintel-${Date.now()}`;
  const invalidationBatch = `<?xml version="1.0" encoding="UTF-8"?>
<InvalidationBatch xmlns="http://cloudfront.amazonaws.com/doc/2020-05-31/">
  <CallerReference>${callerReference}</CallerReference>
  <Paths>
    <Quantity>${paths.length}</Quantity>
    <Items>
      ${paths.map(p => `<Path>${p}</Path>`).join('\n      ')}
    </Items>
  </Paths>
</InvalidationBatch>`;
  
  const body = new TextEncoder().encode(invalidationBatch);
  const payloadHash = await sha256(body);
  const canonicalUri = `/2020-05-31/distribution/${distributionId}/invalidation`;
  
  const canonicalHeaders = 
    `content-type:application/xml\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  
  const canonicalRequest = [
    method,
    canonicalUri,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/cloudfront/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    await sha256(canonicalRequest)
  ].join('\n');
  
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, 'cloudfront');
  const signature = toHex(await hmacSha256(signingKey, stringToSign));
  
  const authorizationHeader = 
    `${algorithm} Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  try {
    const response = await fetch(`https://${host}${canonicalUri}`, {
      method,
      headers: {
        'Host': host,
        'Content-Type': 'application/xml',
        'x-amz-date': amzDate,
        'x-amz-content-sha256': payloadHash,
        'Authorization': authorizationHeader,
      },
      body,
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('CloudFront invalidation failed:', responseText);
      return { success: false, error: responseText };
    }
    
    // Extract invalidation ID from response
    const idMatch = responseText.match(/<Id>([^<]+)<\/Id>/);
    const invalidationId = idMatch ? idMatch[1] : undefined;
    
    return { success: true, invalidationId };
  } catch (error) {
    console.error('CloudFront invalidation error:', error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get AWS credentials from environment
    const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID');
    const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const AWS_REGION = Deno.env.get('AWS_REGION') || 'us-east-1';
    const S3_BUCKET = Deno.env.get('TILE_S3_BUCKET') || 'siteintel-tiles';
    const CLOUDFRONT_DISTRIBUTION_ID = Deno.env.get('CLOUDFRONT_DISTRIBUTION_ID');
    const CLOUDFRONT_URL = Deno.env.get('TILE_CDN_URL') || 'https://d1s5qe1loulzm6.cloudfront.net';
    
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not configured');
    }
    
    const body: UploadRequest = await req.json();
    const { layer, version, jurisdiction, tiles, invalidate_cache = true, register_tileset = true, metadata } = body;
    
    if (!layer || !version || !jurisdiction || !tiles?.length) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: layer, version, jurisdiction, tiles' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[upload-tiles] Starting upload: ${layer}/${version} (${tiles.length} tiles)`);
    
    const s3Prefix = `us/${jurisdiction}/${layer}/${version}`;
    let uploaded = 0;
    let failed = 0;
    const errors: string[] = [];
    
    // Upload tiles in batches to avoid overwhelming connections
    const BATCH_SIZE = 10;
    for (let i = 0; i < tiles.length; i += BATCH_SIZE) {
      const batch = tiles.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (tile) => {
          const key = `${s3Prefix}/${tile.z}/${tile.x}/${tile.y}.pbf`;
          const tileData = Uint8Array.from(atob(tile.data), c => c.charCodeAt(0));
          
          const result = await uploadToS3(
            S3_BUCKET,
            key,
            tileData,
            'application/x-protobuf',
            AWS_ACCESS_KEY_ID,
            AWS_SECRET_ACCESS_KEY,
            AWS_REGION
          );
          
          return { key, ...result };
        })
      );
      
      for (const result of results) {
        if (result.success) {
          uploaded++;
        } else {
          failed++;
          errors.push(`${result.key}: ${result.error}`);
        }
      }
    }
    
    console.log(`[upload-tiles] Upload complete: ${uploaded} success, ${failed} failed`);
    
    // Invalidate CloudFront cache if requested
    let invalidationId: string | undefined;
    if (invalidate_cache && CLOUDFRONT_DISTRIBUTION_ID && uploaded > 0) {
      const invalidationPaths = [`/us/${jurisdiction}/${layer}/${version}/*`];
      const invalidateResult = await invalidateCloudFront(
        CLOUDFRONT_DISTRIBUTION_ID,
        invalidationPaths,
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        'us-east-1' // CloudFront always uses us-east-1
      );
      
      if (invalidateResult.success) {
        invalidationId = invalidateResult.invalidationId;
        console.log(`[upload-tiles] CloudFront invalidation created: ${invalidationId}`);
      } else {
        console.warn(`[upload-tiles] CloudFront invalidation failed: ${invalidateResult.error}`);
      }
    }
    
    // Register tileset in Supabase if requested
    let tilesetKey: string | undefined;
    if (register_tileset && uploaded > 0) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      tilesetKey = `us_${jurisdiction}_${layer}_${version}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const tileUrlTemplate = `${CLOUDFRONT_URL}/${s3Prefix}/{z}/{x}/{y}.pbf`;
      
      const { error: upsertError } = await supabase
        .from('tilesets')
        .upsert({
          tileset_key: tilesetKey,
          name: `${layer} (${version})`,
          category: layer,
          jurisdiction: `us/${jurisdiction}`,
          tile_url_template: tileUrlTemplate,
          min_zoom: metadata?.min_zoom || 0,
          max_zoom: metadata?.max_zoom || 16,
          bounds: metadata?.bounds || null,
          record_count: metadata?.record_count || tiles.length,
          generated_at: new Date().toISOString(),
          is_active: true,
        }, { onConflict: 'tileset_key' });
      
      if (upsertError) {
        console.error('[upload-tiles] Failed to register tileset:', upsertError);
      } else {
        console.log(`[upload-tiles] Registered tileset: ${tilesetKey}`);
      }
    }
    
    const response = {
      success: failed === 0,
      uploaded,
      failed,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limit errors in response
      s3_prefix: s3Prefix,
      cdn_url: `${CLOUDFRONT_URL}/${s3Prefix}/{z}/{x}/{y}.pbf`,
      invalidation_id: invalidationId,
      tileset_key: tilesetKey,
    };
    
    return new Response(
      JSON.stringify(response),
      { 
        status: failed === 0 ? 200 : 207, // 207 Multi-Status for partial success
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('[upload-tiles] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
