/**
 * nearby-parcels - B-06: Find Parcels Near Point/Parcel
 * 
 * Returns parcels within specified radius of a point or parcel.
 * Uses PostGIS ST_DWithin for efficient spatial queries.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NearbyParcelsRequest {
  center: { lat: number; lng: number } | { apn: string };
  radiusMeters: number;
  limit?: number;
  excludeCenter?: boolean;
}

interface NearbyParcel {
  apn: string;
  owner: string;
  acreage: number;
  distanceMeters: number;
  bearing: string;
  siteAddress?: string;
}

interface NearbyParcelsResponse {
  parcels: NearbyParcel[];
  centerCoords: { lat: number; lng: number };
  traceId: string;
  duration_ms: number;
}

// Generate 8-char trace ID
function generateTraceId(): string {
  return crypto.randomUUID().substring(0, 8);
}

// Calculate compass bearing from center to point
function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const toRad = (deg: number) => deg * Math.PI / 180;
  const toDeg = (rad: number) => rad * 180 / Math.PI;
  
  const dLon = toRad(lng2 - lng1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - 
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  
  let bearing = toDeg(Math.atan2(y, x));
  bearing = (bearing + 360) % 360;
  
  // Convert to compass direction
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

// Calculate distance between two points in meters (Haversine)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg: number) => deg * Math.PI / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return Math.round(R * c);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const traceId = generateTraceId();

  try {
    const { 
      center, 
      radiusMeters, 
      limit = 20, 
      excludeCenter = true 
    }: NearbyParcelsRequest = await req.json();

    // Validate radius (max 5000m)
    const effectiveRadius = Math.min(radiusMeters, 5000);
    const effectiveLimit = Math.min(limit, 100);

    if (!center || effectiveRadius <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid center or radius', traceId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${traceId}] nearby-parcels: radius=${effectiveRadius}m, limit=${effectiveLimit}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let centerLat: number;
    let centerLng: number;
    let centerApn: string | null = null;

    // Resolve center coordinates
    if ('apn' in center) {
      centerApn = center.apn;
      
      // Look up the parcel to get its centroid
      const { data: parcel } = await supabase
        .from('canonical_parcels')
        .select('centroid')
        .eq('source_parcel_id', center.apn)
        .maybeSingle();

      if (!parcel?.centroid) {
        return new Response(
          JSON.stringify({ error: 'Center parcel not found', traceId }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract coordinates from centroid (assuming GeoJSON Point)
      const coords = parcel.centroid?.coordinates || parcel.centroid;
      if (Array.isArray(coords) && coords.length >= 2) {
        centerLng = coords[0];
        centerLat = coords[1];
      } else {
        return new Response(
          JSON.stringify({ error: 'Invalid parcel geometry', traceId }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      centerLat = center.lat;
      centerLng = center.lng;
    }

    console.log(`[${traceId}] Center: ${centerLat}, ${centerLng}`);

    // Query nearby parcels using RPC (PostGIS ST_DWithin)
    const { data: nearby, error } = await supabase.rpc('find_nearby_parcels', {
      p_lng: centerLng,
      p_lat: centerLat,
      p_radius_meters: effectiveRadius,
      p_limit: effectiveLimit + 1, // Get extra to potentially exclude center
    });

    if (error) {
      console.error(`[${traceId}] RPC error:`, error);
      
      // Fallback: use a simpler bbox-based query
      const degPerMeter = 1 / 111000; // Approximate
      const latBuffer = effectiveRadius * degPerMeter;
      const lngBuffer = effectiveRadius * degPerMeter / Math.cos(centerLat * Math.PI / 180);
      
      const { data: fallbackData } = await supabase
        .from('canonical_parcels')
        .select('source_parcel_id, owner_name, acreage, situs_address, centroid')
        .gte('centroid', `POINT(${centerLng - lngBuffer} ${centerLat - latBuffer})`)
        .lte('centroid', `POINT(${centerLng + lngBuffer} ${centerLat + latBuffer})`)
        .limit(effectiveLimit + 1);

      if (fallbackData) {
        const parcels: NearbyParcel[] = fallbackData
          .map((p: any) => {
            const coords = p.centroid?.coordinates || [];
            const pLng = coords[0] || 0;
            const pLat = coords[1] || 0;
            const distance = calculateDistance(centerLat, centerLng, pLat, pLng);
            
            return {
              apn: p.source_parcel_id || '',
              owner: p.owner_name || '',
              acreage: p.acreage || 0,
              distanceMeters: distance,
              bearing: calculateBearing(centerLat, centerLng, pLat, pLng),
              siteAddress: p.situs_address,
            };
          })
          .filter((p: NearbyParcel) => {
            if (excludeCenter && centerApn && p.apn === centerApn) return false;
            if (p.distanceMeters > effectiveRadius) return false;
            return true;
          })
          .sort((a: NearbyParcel, b: NearbyParcel) => a.distanceMeters - b.distanceMeters)
          .slice(0, effectiveLimit);

        const duration = Date.now() - startTime;

        return new Response(JSON.stringify({
          parcels,
          centerCoords: { lat: centerLat, lng: centerLng },
          traceId,
          duration_ms: duration,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Process results from RPC
    const parcels: NearbyParcel[] = (nearby || [])
      .map((p: any) => ({
        apn: p.source_parcel_id || '',
        owner: p.owner_name || '',
        acreage: p.acreage || 0,
        distanceMeters: Math.round(p.distance_meters || 0),
        bearing: calculateBearing(
          centerLat, centerLng,
          p.centroid_lat || centerLat,
          p.centroid_lng || centerLng
        ),
        siteAddress: p.situs_address,
      }))
      .filter((p: NearbyParcel) => {
        if (excludeCenter && centerApn && p.apn === centerApn) return false;
        return true;
      })
      .slice(0, effectiveLimit);

    // Sort by distance
    parcels.sort((a, b) => a.distanceMeters - b.distanceMeters);

    const duration = Date.now() - startTime;

    // Log the query
    await supabase.from('api_logs').insert({
      source: 'nearby-parcels',
      endpoint: 'canonical_parcels',
      duration_ms: duration,
      success: true,
      cache_key: `trace:${traceId}`,
    }).catch(() => {});

    const response: NearbyParcelsResponse = {
      parcels,
      centerCoords: { lat: centerLat, lng: centerLng },
      traceId,
      duration_ms: duration,
    };

    console.log(`[${traceId}] Found ${parcels.length} nearby parcels in ${duration}ms`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[${traceId}] Error:`, error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', traceId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
