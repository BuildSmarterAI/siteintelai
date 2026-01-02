import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

// USGS National Elevation Dataset (NED) fallback
const USGS_EPQS_URL = 'https://epqs.nationalmap.gov/v1/json';

interface ElevationRequest {
  lat: number;
  lng: number;
  parcelGeometry?: GeoJSON.Polygon;
  sampleCount?: number;
}

interface ElevationPoint {
  lat: number;
  lng: number;
  elevation: number;
  distanceFt: number;
}

interface ElevationResponse {
  elevation: number;
  source: 'google' | 'usgs' | 'cache';
  resolution: string;
  profile?: ElevationPoint[];
  statistics?: {
    min: number;
    max: number;
    avg: number;
    range: number;
    slope: number;
  };
  bfeDelta?: number;
  traceId: string;
  cacheHit: boolean;
}

function generateTraceId(): string {
  return crypto.randomUUID().slice(0, 8);
}

function metersToFeet(meters: number): number {
  return meters * 3.28084;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 20902231; // Earth radius in feet
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function getSamplePoints(polygon: any, count: number): Array<{lat: number; lng: number}> {
  const coords = polygon.coordinates?.[0] || [];
  if (coords.length < 3) return [];
  
  // Get bounding box
  const lats = coords.map((c: number[]) => c[1]);
  const lngs = coords.map((c: number[]) => c[0]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  // Create diagonal transect
  const points: Array<{lat: number; lng: number}> = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    points.push({
      lat: minLat + (maxLat - minLat) * t,
      lng: minLng + (maxLng - minLng) * t,
    });
  }
  return points;
}

async function queryGoogleElevation(lat: number, lng: number): Promise<{ elevation: number; resolution: string } | null> {
  if (!GOOGLE_MAPS_API_KEY) return null;
  
  const url = `https://maps.googleapis.com/maps/api/elevation/json?locations=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
  
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.status !== 'OK' || !data.results?.[0]) return null;
    
    return {
      elevation: metersToFeet(data.results[0].elevation),
      resolution: `${Math.round(data.results[0].resolution)}m`,
    };
  } catch {
    return null;
  }
}

async function queryUSGSElevation(lat: number, lng: number): Promise<{ elevation: number; resolution: string } | null> {
  const url = `${USGS_EPQS_URL}?x=${lng}&y=${lat}&units=Feet&output=json`;
  
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return null;
    
    const data = await response.json();
    const elevation = data.value;
    
    if (elevation === null || elevation === -1000000) return null;
    
    return {
      elevation: parseFloat(elevation),
      resolution: '10m',
    };
  } catch {
    return null;
  }
}

async function queryGoogleElevationPath(points: Array<{lat: number; lng: number}>): Promise<Array<{lat: number; lng: number; elevation: number}> | null> {
  if (!GOOGLE_MAPS_API_KEY || points.length === 0) return null;
  
  const path = points.map(p => `${p.lat},${p.lng}`).join('|');
  const url = `https://maps.googleapis.com/maps/api/elevation/json?path=${path}&samples=${points.length}&key=${GOOGLE_MAPS_API_KEY}`;
  
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.status !== 'OK' || !data.results?.length) return null;
    
    return data.results.map((r: any) => ({
      lat: r.location.lat,
      lng: r.location.lng,
      elevation: metersToFeet(r.elevation),
    }));
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = generateTraceId();
  const startTime = Date.now();

  try {
    const body: ElevationRequest = await req.json();
    const { lat, lng, parcelGeometry, sampleCount = 16 } = body;
    
    console.log(`[TRACE:${traceId}] query-elevation: lat=${lat}, lng=${lng}`);
    
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
    
    // Check cache first
    const cacheKey = `elevation:v1:${lat.toFixed(5)}:${lng.toFixed(5)}`;
    const { data: cached } = await supabase
      .from('api_cache_universal')
      .select('response')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (cached?.response) {
      console.log(`[TRACE:${traceId}] Cache HIT`);
      return new Response(JSON.stringify({
        ...cached.response,
        traceId,
        cacheHit: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Query elevation - try Google first, fallback to USGS
    let elevation: number | null = null;
    let source: 'google' | 'usgs' = 'usgs';
    let resolution = '10m';

    const googleResult = await queryGoogleElevation(lat, lng);
    if (googleResult) {
      elevation = googleResult.elevation;
      source = 'google';
      resolution = googleResult.resolution;
      console.log(`[TRACE:${traceId}] Google elevation: ${elevation.toFixed(2)} ft`);
    } else {
      const usgsResult = await queryUSGSElevation(lat, lng);
      if (usgsResult) {
        elevation = usgsResult.elevation;
        source = 'usgs';
        resolution = usgsResult.resolution;
        console.log(`[TRACE:${traceId}] USGS elevation: ${elevation.toFixed(2)} ft`);
      }
    }

    if (elevation === null) {
      throw new Error('Could not retrieve elevation data');
    }

    // Build profile if parcel geometry provided
    let profile: ElevationPoint[] | undefined;
    let statistics: { min: number; max: number; avg: number; range: number; slope: number } | undefined;

    if (parcelGeometry) {
      const samplePoints = getSamplePoints(parcelGeometry, sampleCount);
      
      if (samplePoints.length > 0) {
        const elevations = await queryGoogleElevationPath(samplePoints);
        
        if (elevations && elevations.length > 0) {
          let cumulativeDistance = 0;
          let minElev = Infinity;
          let maxElev = -Infinity;
          let sumElev = 0;
          
          profile = elevations.map((e, i) => {
            if (i > 0) {
              cumulativeDistance += calculateDistance(
                elevations[i-1].lat, elevations[i-1].lng,
                e.lat, e.lng
              );
            }
            
            minElev = Math.min(minElev, e.elevation);
            maxElev = Math.max(maxElev, e.elevation);
            sumElev += e.elevation;
            
            return {
              lat: e.lat,
              lng: e.lng,
              elevation: parseFloat(e.elevation.toFixed(2)),
              distanceFt: Math.round(cumulativeDistance),
            };
          });
          
          const elevRange = maxElev - minElev;
          const totalDistance = cumulativeDistance || 1;
          const slopePercent = (elevRange / totalDistance) * 100;
          
          statistics = {
            min: parseFloat(minElev.toFixed(2)),
            max: parseFloat(maxElev.toFixed(2)),
            avg: parseFloat((sumElev / elevations.length).toFixed(2)),
            range: parseFloat(elevRange.toFixed(2)),
            slope: parseFloat(slopePercent.toFixed(2)),
          };
        }
      }
    }

    // Calculate BFE delta if FEMA data is available
    let bfeDelta: number | undefined;
    const { data: floodData } = await supabase.rpc('get_flood_data_by_point', {
      p_lat: lat,
      p_lng: lng,
    }).single();
    
    if (floodData?.base_flood_elevation && elevation) {
      bfeDelta = parseFloat((elevation - floodData.base_flood_elevation).toFixed(2));
    }

    const result: ElevationResponse = {
      elevation: parseFloat(elevation.toFixed(2)),
      source,
      resolution,
      profile,
      statistics,
      bfeDelta,
      traceId,
      cacheHit: false,
    };

    // Cache for 30 days (elevation doesn't change)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('api_cache_universal').upsert({
      cache_key: cacheKey,
      provider: source,
      endpoint: 'elevation',
      response: result,
      expires_at: expiresAt,
    }, { onConflict: 'cache_key' });

    // Log API call
    const durationMs = Date.now() - startTime;
    await supabase.from('api_logs').insert({
      source: 'query-elevation',
      endpoint: source === 'google' ? 'Google_Elevation' : 'USGS_EPQS',
      duration_ms: durationMs,
      success: true,
      cache_key: cacheKey,
    });

    console.log(`[TRACE:${traceId}] Elevation: ${elevation.toFixed(2)} ft (${source})`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[TRACE:${traceId}] Error:`, error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      traceId,
      elevation: null,
      cacheHit: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
