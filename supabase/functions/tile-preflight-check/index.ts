import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LayerCheck {
  layer: string;
  table: string;
  record_count: number;
  has_geometry: boolean;
  sample_bounds: number[] | null;
  ready_for_tiles: boolean;
  issues: string[];
}

interface PreflightResult {
  timestamp: string;
  overall_ready: boolean;
  layers: LayerCheck[];
  cdn_status: {
    url: string;
    reachable: boolean;
    error?: string;
  };
  github_secrets_checklist: {
    name: string;
    description: string;
    required: boolean;
  }[];
  next_steps: string[];
}

const CANONICAL_LAYERS = [
  { layer: 'parcels', table: 'canonical_parcels', geomColumn: 'geom' },
  { layer: 'zoning', table: 'zoning_canonical', geomColumn: 'geom' },
  { layer: 'utilities', table: 'utilities_canonical', geomColumn: 'geom' },
  { layer: 'flood', table: 'flood_zones_canonical', geomColumn: 'geom' },
  { layer: 'wetlands', table: 'wetlands_canonical', geomColumn: 'geom' },
];

const REQUIRED_SECRETS = [
  { name: 'SUPABASE_URL', description: 'Supabase project URL', required: true },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Supabase service role key for DB access', required: true },
  { name: 'AWS_ACCESS_KEY_ID', description: 'AWS credentials for S3 upload', required: true },
  { name: 'AWS_SECRET_ACCESS_KEY', description: 'AWS credentials for S3 upload', required: true },
  { name: 'AWS_REGION', description: 'AWS region (default: us-east-1)', required: true },
  { name: 'TILE_S3_BUCKET', description: 'S3 bucket name for tiles (e.g., siteintel-tiles)', required: true },
  { name: 'CLOUDFRONT_DISTRIBUTION_ID', description: 'CloudFront distribution ID for cache invalidation', required: true },
  { name: 'TILE_CDN_DOMAIN', description: 'CDN domain (e.g., tiles.siteintel.ai)', required: false },
];

async function checkLayer(
  supabase: any,
  layer: { layer: string; table: string; geomColumn: string }
): Promise<LayerCheck> {
  const issues: string[] = [];
  let recordCount = 0;
  let hasGeometry = false;
  let sampleBounds: number[] | null = null;

  try {
    // Get record count
    const { count, error: countError } = await supabase
      .from(layer.table)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      issues.push(`Table query failed: ${countError.message}`);
    } else {
      recordCount = count || 0;
      if (recordCount === 0) {
        issues.push('No records in table');
      }
    }

    // Check for geometry by sampling
    if (recordCount > 0) {
      const { data: sample, error: sampleError } = await supabase
        .from(layer.table)
        .select(`id, ${layer.geomColumn}`)
        .not(layer.geomColumn, 'is', null)
        .limit(1);

      if (sampleError) {
        issues.push(`Geometry check failed: ${sampleError.message}`);
      } else if (!sample || sample.length === 0) {
        issues.push('No records with geometry found');
      } else {
        hasGeometry = true;
      }

      // Get approximate bounds using a raw query via RPC if available
      // For now, we'll mark bounds as unknown
      sampleBounds = null;
    }
  } catch (err) {
    issues.push(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown'}`);
  }

  return {
    layer: layer.layer,
    table: layer.table,
    record_count: recordCount,
    has_geometry: hasGeometry,
    sample_bounds: sampleBounds,
    ready_for_tiles: recordCount > 0 && hasGeometry,
    issues,
  };
}

async function checkCDN(cdnUrl: string): Promise<{ reachable: boolean; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    // Try to fetch a non-existent tile - we expect 403 (Access Denied) or 404, which means CDN is working
    const response = await fetch(`${cdnUrl}/health-check-test.txt`, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    // 403/404 means CloudFront is responding (no tile exists, which is expected)
    // 200 would mean the file exists
    // 5xx or timeout would indicate issues
    if (response.status < 500) {
      return { reachable: true };
    }
    return { reachable: false, error: `CDN returned ${response.status}` };
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return { reachable: false, error: 'CDN timeout after 5s' };
      }
      return { reachable: false, error: err.message };
    }
    return { reachable: false, error: 'Unknown error' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  console.log('[tile-preflight-check] Starting pre-flight verification...');

  try {
    // Check all canonical layers
    const layerChecks = await Promise.all(
      CANONICAL_LAYERS.map((layer) => checkLayer(supabase, layer))
    );

    // Check CDN accessibility
    const cdnDomain = 'https://tiles.siteintel.ai';
    const cdnStatus = await checkCDN(cdnDomain);

    // Determine overall readiness
    const readyLayers = layerChecks.filter((l) => l.ready_for_tiles);
    const overallReady = readyLayers.length > 0 && cdnStatus.reachable;

    // Generate next steps
    const nextSteps: string[] = [];

    if (readyLayers.length === 0) {
      nextSteps.push('Run data ingestion: invoke seed-houston-canonical edge function to populate canonical tables');
    }

    if (!cdnStatus.reachable) {
      nextSteps.push('Verify CloudFront distribution is deployed and tiles.siteintel.ai DNS is configured');
    }

    const layersWithoutGeom = layerChecks.filter((l) => l.record_count > 0 && !l.has_geometry);
    if (layersWithoutGeom.length > 0) {
      nextSteps.push(`Fix geometry issues in: ${layersWithoutGeom.map((l) => l.layer).join(', ')}`);
    }

    if (overallReady) {
      nextSteps.push('Ready to generate tiles! Run GitHub Actions workflow: gh workflow run generate-tiles.yml');
      nextSteps.push(`Layers ready for tiles: ${readyLayers.map((l) => l.layer).join(', ')}`);
    }

    const result: PreflightResult = {
      timestamp: new Date().toISOString(),
      overall_ready: overallReady,
      layers: layerChecks,
      cdn_status: {
        url: cdnDomain,
        reachable: cdnStatus.reachable,
        error: cdnStatus.error,
      },
      github_secrets_checklist: REQUIRED_SECRETS,
      next_steps: nextSteps,
    };

    console.log(`[tile-preflight-check] Complete: ${readyLayers.length}/${layerChecks.length} layers ready, CDN ${cdnStatus.reachable ? 'OK' : 'FAIL'}`);

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[tile-preflight-check] Error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
