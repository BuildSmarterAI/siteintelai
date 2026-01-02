import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface OverlayEnrichmentRequest {
  applicationId: string;
  lat: number;
  lng: number;
  parcelGeometry?: GeoJSON.Polygon;
  overlays?: string[];
}

interface OverlayEnrichmentResponse {
  flood?: any;
  wetlands?: any;
  utilities?: any;
  traffic?: any;
  epa?: any;
  elevation?: any;
  soil?: any;
  zoning?: any;
  schools?: any;
  completedOverlays: string[];
  failedOverlays: Array<{ overlay: string; error: string }>;
  totalDurationMs: number;
  traceId: string;
}

function generateTraceId(): string {
  return crypto.randomUUID().slice(0, 8);
}

async function invokeOverlay(
  supabase: any, 
  functionName: string, 
  body: any, 
  timeoutMs: number = 15000
): Promise<{ data: any; error: string | null }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
    });
    
    clearTimeout(timeoutId);
    
    if (error) {
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (err) {
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = generateTraceId();
  const startTime = Date.now();

  try {
    const body: OverlayEnrichmentRequest = await req.json();
    const { applicationId, lat, lng, parcelGeometry, overlays } = body;
    
    console.log(`[TRACE:${traceId}] enrich-all-overlays: app=${applicationId}, lat=${lat}, lng=${lng}`);
    
    if (!lat || !lng) {
      return new Response(JSON.stringify({ 
        error: 'lat and lng are required',
        traceId 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Define all overlays to run
    const allOverlays = ['flood', 'wetlands', 'traffic', 'epa', 'elevation', 'soil', 'zoning', 'schools'];
    const overlaysToRun = overlays && overlays.length > 0 
      ? allOverlays.filter(o => overlays.includes(o))
      : allOverlays;

    const completedOverlays: string[] = [];
    const failedOverlays: Array<{ overlay: string; error: string }> = [];
    const results: Record<string, any> = {};

    // Run all overlays in parallel using Promise.allSettled
    const overlayPromises = overlaysToRun.map(async (overlay) => {
      const baseBody = { lat, lng, application_id: applicationId };
      
      let functionName: string;
      let functionBody: any = baseBody;
      
      switch (overlay) {
        case 'flood':
          functionName = 'query-fema-by-point';
          break;
        case 'wetlands':
          functionName = 'enrich-wetlands';
          functionBody = { ...baseBody, parcel_polygon: parcelGeometry };
          break;
        case 'traffic':
          functionName = 'query-traffic';
          functionBody = { ...baseBody, searchRadiusMeters: 1000 };
          break;
        case 'epa':
          functionName = 'query-epa-echo';
          functionBody = { ...baseBody, radiusMiles: 1 };
          break;
        case 'elevation':
          functionName = 'query-elevation';
          functionBody = { ...baseBody, parcelGeometry };
          break;
        case 'soil':
          functionName = 'query-soil';
          break;
        case 'zoning':
          functionName = 'query-zoning';
          break;
        case 'schools':
          functionName = 'query-schools';
          break;
        default:
          return { overlay, data: null, error: `Unknown overlay: ${overlay}` };
      }
      
      console.log(`[TRACE:${traceId}] Starting ${overlay}...`);
      const result = await invokeOverlay(supabase, functionName, functionBody);
      
      return { overlay, ...result };
    });

    const settledResults = await Promise.allSettled(overlayPromises);

    // Process results
    for (const settled of settledResults) {
      if (settled.status === 'fulfilled') {
        const { overlay, data, error } = settled.value;
        if (error) {
          failedOverlays.push({ overlay, error });
          console.log(`[TRACE:${traceId}] ${overlay} FAILED: ${error}`);
        } else {
          results[overlay] = data;
          completedOverlays.push(overlay);
          console.log(`[TRACE:${traceId}] ${overlay} OK`);
        }
      } else {
        // Promise rejected
        const overlay = 'unknown';
        failedOverlays.push({ overlay, error: settled.reason?.message || 'Promise rejected' });
      }
    }

    const totalDurationMs = Date.now() - startTime;

    // Update application with enrichment metadata
    if (applicationId) {
      await supabase
        .from('applications')
        .update({
          enrichment_metadata: {
            lastEnrichment: new Date().toISOString(),
            completedOverlays,
            failedOverlays: failedOverlays.map(f => f.overlay),
            durationMs: totalDurationMs,
            traceId,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId);
    }

    // Log API call
    await supabase.from('api_logs').insert({
      source: 'enrich-all-overlays',
      endpoint: 'composite',
      duration_ms: totalDurationMs,
      success: failedOverlays.length === 0,
      application_id: applicationId,
    });

    const response: OverlayEnrichmentResponse = {
      ...results,
      completedOverlays,
      failedOverlays,
      totalDurationMs,
      traceId,
    };

    console.log(`[TRACE:${traceId}] Completed: ${completedOverlays.length}/${overlaysToRun.length} overlays in ${totalDurationMs}ms`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[TRACE:${traceId}] Error:`, error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      traceId,
      completedOverlays: [],
      failedOverlays: [],
      totalDurationMs: Date.now() - startTime,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
