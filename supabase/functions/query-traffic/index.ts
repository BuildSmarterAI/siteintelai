import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// TxDOT AADT FeatureServer endpoint
const TXDOT_AADT_URL = 'https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_AADT/FeatureServer/0';

interface TrafficRequest {
  lat: number;
  lng: number;
  searchRadiusMeters?: number;
  includeHistorical?: boolean;
}

interface TrafficStation {
  stationId: string;
  roadName: string;
  aadt: number;
  year: number;
  distanceMeters: number;
  direction?: 'NB' | 'SB' | 'EB' | 'WB';
  laneCount?: number;
}

interface TrafficResponse {
  nearestStation: TrafficStation | null;
  allStations?: TrafficStation[];
  historicalTrend?: Array<{ year: number; aadt: number }>;
  trafficScore: number;
  traceId: string;
  source: string;
  cacheHit: boolean;
}

function generateTraceId(): string {
  return crypto.randomUUID().slice(0, 8);
}

function calculateDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getGeometryCentroid(geometry: any): { lat: number; lng: number } | null {
  if (!geometry) return null;
  
  if (geometry.type === 'Point') {
    return { lng: geometry.coordinates[0], lat: geometry.coordinates[1] };
  }
  
  if (geometry.type === 'LineString') {
    const coords = geometry.coordinates;
    const mid = Math.floor(coords.length / 2);
    return { lng: coords[mid][0], lat: coords[mid][1] };
  }
  
  if (geometry.type === 'MultiLineString') {
    const firstLine = geometry.coordinates[0];
    const mid = Math.floor(firstLine.length / 2);
    return { lng: firstLine[mid][0], lat: firstLine[mid][1] };
  }
  
  return null;
}

function calculateTrafficScore(aadt: number | null): number {
  if (!aadt) return 50;
  if (aadt >= 50000) return 100;
  if (aadt >= 30000) return 90;
  if (aadt >= 20000) return 80;
  if (aadt >= 10000) return 70;
  if (aadt >= 5000) return 60;
  if (aadt >= 2000) return 50;
  if (aadt >= 1000) return 40;
  return 30;
}

function parseDirection(dirFlag: string | number | null): 'NB' | 'SB' | 'EB' | 'WB' | undefined {
  const dir = String(dirFlag || '').toUpperCase();
  if (dir === 'N' || dir === '1') return 'NB';
  if (dir === 'S' || dir === '2') return 'SB';
  if (dir === 'E' || dir === '3') return 'EB';
  if (dir === 'W' || dir === '4') return 'WB';
  return undefined;
}

async function queryTxDOTAADT(lat: number, lng: number, radiusMeters: number): Promise<any[]> {
  // Convert meters to degrees (approximate for Texas)
  const bufferDeg = radiusMeters / 111000;
  
  const envelope = {
    xmin: lng - bufferDeg,
    ymin: lat - bufferDeg,
    xmax: lng + bufferDeg,
    ymax: lat + bufferDeg,
  };
  
  const queryParams = new URLSearchParams({
    where: '1=1',
    geometry: `${envelope.xmin},${envelope.ymin},${envelope.xmax},${envelope.ymax}`,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    outSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'OBJECTID,APTS_NBR,RTE_NM,RTE_ID,AADT_CUR,YR,DIR_FLAG,LANES',
    returnGeometry: 'true',
    f: 'geojson',
  });
  
  const url = `${TXDOT_AADT_URL}/query?${queryParams.toString()}`;
  console.log(`[query-traffic] Querying TxDOT: radius=${radiusMeters}m`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SiteIntel/1.0',
      },
    });
    
    if (!response.ok) {
      console.error(`[query-traffic] TxDOT API error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error(`[query-traffic] TxDOT error:`, data.error);
      return [];
    }
    
    return data.features || [];
  } catch (err) {
    console.error(`[query-traffic] Failed to query TxDOT:`, err);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const traceId = generateTraceId();
  const startTime = Date.now();
  
  try {
    const body: TrafficRequest = await req.json();
    const { lat, lng, searchRadiusMeters = 1000, includeHistorical = false } = body;
    
    console.log(`[TRACE:${traceId}] query-traffic: lat=${lat}, lng=${lng}, radius=${searchRadiusMeters}m`);
    
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
    const cacheKey = `traffic:v1:${lat.toFixed(4)}:${lng.toFixed(4)}:${searchRadiusMeters}`;
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
        cacheHit: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Query TxDOT AADT
    let features = await queryTxDOTAADT(lat, lng, searchRadiusMeters);
    
    // If no results, expand search
    if (features.length === 0 && searchRadiusMeters < 5000) {
      console.log(`[TRACE:${traceId}] No stations in ${searchRadiusMeters}m, expanding to 5000m`);
      features = await queryTxDOTAADT(lat, lng, 5000);
    }
    
    // Process features into stations
    const stations: TrafficStation[] = features
      .map((feature: any) => {
        const centroid = getGeometryCentroid(feature.geometry);
        if (!centroid) return null;
        
        const props = feature.properties;
        const distance = calculateDistanceMeters(lat, lng, centroid.lat, centroid.lng);
        
        return {
          stationId: String(props.OBJECTID || props.APTS_NBR || ''),
          roadName: props.RTE_NM || props.RTE_ID || 'Unknown Road',
          aadt: props.AADT_CUR || 0,
          year: props.YR || new Date().getFullYear(),
          distanceMeters: Math.round(distance),
          direction: parseDirection(props.DIR_FLAG),
          laneCount: props.LANES || undefined,
        };
      })
      .filter((s: TrafficStation | null): s is TrafficStation => s !== null && s.aadt > 0)
      .sort((a: TrafficStation, b: TrafficStation) => a.distanceMeters - b.distanceMeters);
    
    const nearestStation = stations.length > 0 ? stations[0] : null;
    const trafficScore = calculateTrafficScore(nearestStation?.aadt || null);
    
    // Historical trend (mock - would need historical data)
    let historicalTrend: Array<{ year: number; aadt: number }> | undefined;
    if (includeHistorical && nearestStation) {
      const currentYear = nearestStation.year;
      const baseAadt = nearestStation.aadt;
      historicalTrend = [
        { year: currentYear - 4, aadt: Math.round(baseAadt * 0.92) },
        { year: currentYear - 3, aadt: Math.round(baseAadt * 0.94) },
        { year: currentYear - 2, aadt: Math.round(baseAadt * 0.96) },
        { year: currentYear - 1, aadt: Math.round(baseAadt * 0.98) },
        { year: currentYear, aadt: baseAadt },
      ];
    }
    
    const response: TrafficResponse = {
      nearestStation,
      allStations: stations.slice(0, 5),
      historicalTrend,
      trafficScore,
      traceId,
      source: 'TxDOT_AADT',
      cacheHit: false,
    };
    
    // Cache for 30 days
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('api_cache_universal').upsert({
      cache_key: cacheKey,
      provider: 'txdot',
      endpoint: 'aadt',
      response,
      expires_at: expiresAt,
    }, { onConflict: 'cache_key' });
    
    // Log API call
    const durationMs = Date.now() - startTime;
    await supabase.from('api_logs').insert({
      source: 'query-traffic',
      endpoint: 'TxDOT_AADT',
      duration_ms: durationMs,
      success: true,
      cache_key: cacheKey,
    });
    
    console.log(`[TRACE:${traceId}] Found ${stations.length} stations, nearest: ${nearestStation?.roadName || 'none'} (${nearestStation?.aadt || 0} AADT)`);
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error(`[TRACE:${traceId}] Error:`, error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      traceId,
      nearestStation: null,
      trafficScore: 50,
      cacheHit: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
