/**
 * parcel-resolve - Unified parcel resolution API
 * Accepts address, cross-street, APN, or lat/lng and returns ranked parcel candidates
 * 
 * POST /parcel-resolve
 * Body: { input: string, input_type?: 'address' | 'apn' | 'intersection' | 'point', lat?: number, lng?: number, radius_m?: number, limit?: number }
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

interface ResolveRequest {
  input?: string;
  input_type?: 'address' | 'apn' | 'intersection' | 'point' | 'auto';
  lat?: number;
  lng?: number;
  radius_m?: number;
  limit?: number;
}

interface ParcelCandidate {
  parcel_id: number;
  source_parcel_id: string;
  apn: string | null;
  situs_address: string | null;
  owner_name: string | null;
  acreage: number | null;
  jurisdiction: string | null;
  land_use_code: string | null;
  distance_m: number;
  centroid_lat: number;
  centroid_lng: number;
  match_score: number;
  match_reason: string;
}

interface ResolveResponse {
  success: boolean;
  candidates: ParcelCandidate[];
  geocoded_point?: { lat: number; lng: number };
  input_type_detected: string;
  resolution_confidence: number;
  timing_ms: number;
  error?: string;
}

// Detect input type from string
function detectInputType(input: string): 'address' | 'apn' | 'intersection' | 'point' {
  const trimmed = input.trim();
  
  // Check for lat/lng pattern
  if (/^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/.test(trimmed)) {
    return 'point';
  }
  
  // Check for intersection pattern (contains & or "and" between street names)
  if (/\s+(&|and)\s+/i.test(trimmed) && !/^\d/.test(trimmed)) {
    return 'intersection';
  }
  
  // Check for APN pattern (numeric with optional dashes, no street words)
  if (/^[\d\-\.]+$/.test(trimmed) && trimmed.length >= 6) {
    return 'apn';
  }
  
  // Default to address
  return 'address';
}

// Calculate string similarity (Jaro-Winkler simplified)
function stringSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  const a = s1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const b = s2.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  
  // Simple Levenshtein-based similarity
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  const longerLength = longer.length;
  
  // Check if shorter is contained in longer
  if (longer.includes(shorter)) return shorter.length / longerLength;
  
  // Count matching characters
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  return matches / longerLength;
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const body: ResolveRequest = await req.json();
    const { input, input_type, lat, lng, radius_m = 100, limit = 10 } = body;
    
    let resolvedLat: number | undefined = lat;
    let resolvedLng: number | undefined = lng;
    let detectedType: string = input_type || 'auto';
    
    console.log('[parcel-resolve] Request:', { input, input_type, lat, lng, radius_m, limit });
    
    // If we have direct coordinates, use them
    if (lat !== undefined && lng !== undefined) {
      resolvedLat = lat;
      resolvedLng = lng;
      detectedType = 'point';
    } else if (input) {
      // Detect input type if not specified
      detectedType = input_type === 'auto' || !input_type ? detectInputType(input) : input_type;
      
      if (detectedType === 'point') {
        // Parse lat/lng from string
        const parts = input.split(',').map(s => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          resolvedLat = parts[0];
          resolvedLng = parts[1];
        }
      } else if (detectedType === 'apn') {
        // Query by APN directly
        console.log('[parcel-resolve] Querying by APN:', input);
        const { data: apnParcels, error: apnError } = await supabase
          .from('canonical_parcels')
          .select('id, source_parcel_id, apn, situs_address, owner_name, acreage, jurisdiction, land_use_code, centroid')
          .or(`apn.eq.${input},source_parcel_id.eq.${input}`)
          .limit(limit);
        
        if (apnError) {
          console.error('[parcel-resolve] APN query error:', apnError);
        } else if (apnParcels && apnParcels.length > 0) {
          const candidates: ParcelCandidate[] = apnParcels.map((p: any, idx: number) => ({
            parcel_id: p.id,
            source_parcel_id: p.source_parcel_id,
            apn: p.apn,
            situs_address: p.situs_address,
            owner_name: p.owner_name,
            acreage: p.acreage,
            jurisdiction: p.jurisdiction,
            land_use_code: p.land_use_code,
            distance_m: 0,
            centroid_lat: p.centroid?.coordinates?.[1] ?? 0,
            centroid_lng: p.centroid?.coordinates?.[0] ?? 0,
            match_score: 100 - idx,
            match_reason: 'APN exact match'
          }));
          
          return new Response(JSON.stringify({
            success: true,
            candidates,
            input_type_detected: detectedType,
            resolution_confidence: 0.95,
            timing_ms: Date.now() - startTime
          } as ResolveResponse), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } else if (detectedType === 'intersection') {
        // Call geocode-intersection function
        console.log('[parcel-resolve] Geocoding intersection:', input);
        const { data: geoData, error: geoError } = await supabase.functions.invoke('geocode-intersection', {
          body: { intersection: input }
        });
        
        if (!geoError && geoData?.lat && geoData?.lng) {
          resolvedLat = geoData.lat;
          resolvedLng = geoData.lng;
        }
      } else {
        // Address - use geocode-with-cache
        console.log('[parcel-resolve] Geocoding address:', input);
        const { data: geoData, error: geoError } = await supabase.functions.invoke('geocode-with-cache', {
          body: { address: input }
        });
        
        if (!geoError && geoData?.lat && geoData?.lng) {
          resolvedLat = geoData.lat;
          resolvedLng = geoData.lng;
        } else if (!geoError && geoData?.results?.[0]?.geometry?.location) {
          resolvedLat = geoData.results[0].geometry.location.lat;
          resolvedLng = geoData.results[0].geometry.location.lng;
        }
      }
    }
    
    // If we still don't have coordinates, return error
    if (resolvedLat === undefined || resolvedLng === undefined) {
      return new Response(JSON.stringify({
        success: false,
        candidates: [],
        input_type_detected: detectedType,
        resolution_confidence: 0,
        timing_ms: Date.now() - startTime,
        error: 'Could not resolve input to coordinates'
      } as ResolveResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('[parcel-resolve] Resolved coordinates:', { lat: resolvedLat, lng: resolvedLng });
    
    // Query parcels using PostGIS RPC with progressive radius expansion
    let candidates: ParcelCandidate[] = [];
    let searchRadius = radius_m;
    const maxRadius = Math.max(radius_m * 3, 500);
    
    while (candidates.length === 0 && searchRadius <= maxRadius) {
      console.log(`[parcel-resolve] Searching with radius ${searchRadius}m`);
      
      const { data: parcels, error: rpcError } = await supabase.rpc('resolve_parcel_candidates', {
        p_lat: resolvedLat,
        p_lng: resolvedLng,
        p_radius_m: searchRadius,
        p_limit: limit
      });
      
      if (rpcError) {
        console.error('[parcel-resolve] RPC error:', rpcError);
        throw new Error(`Parcel query failed: ${rpcError.message}`);
      }
      
      if (parcels && parcels.length > 0) {
        candidates = parcels.map((p: any) => {
          // Calculate match score based on distance and address similarity
          const distanceScore = Math.max(0, 100 - (p.distance_m / 10)); // 100 at 0m, 0 at 1000m
          const addressScore = input ? stringSimilarity(input, p.situs_address || '') * 50 : 0;
          const matchScore = Math.round(distanceScore * 0.7 + addressScore * 0.3);
          
          let matchReason = `${Math.round(p.distance_m)}m from search point`;
          if (p.distance_m < 5) matchReason = 'Point inside parcel';
          else if (p.distance_m < 20) matchReason = 'Adjacent to search point';
          
          return {
            parcel_id: p.parcel_id,
            source_parcel_id: p.source_parcel_id,
            apn: p.apn,
            situs_address: p.situs_address,
            owner_name: p.owner_name,
            acreage: p.acreage,
            jurisdiction: p.jurisdiction,
            land_use_code: p.land_use_code,
            distance_m: Math.round(p.distance_m * 100) / 100,
            centroid_lat: p.centroid_lat,
            centroid_lng: p.centroid_lng,
            match_score: matchScore,
            match_reason: matchReason
          };
        });
      }
      
      searchRadius *= 2;
    }
    
    // Sort by match score descending
    candidates.sort((a, b) => b.match_score - a.match_score);
    
    // Calculate overall resolution confidence
    let confidence = 0;
    if (candidates.length > 0) {
      const topCandidate = candidates[0];
      confidence = topCandidate.distance_m < 10 ? 0.95 :
                   topCandidate.distance_m < 50 ? 0.85 :
                   topCandidate.distance_m < 100 ? 0.7 :
                   topCandidate.distance_m < 200 ? 0.5 : 0.3;
      
      // Boost confidence if there's a clear winner
      if (candidates.length > 1 && topCandidate.match_score > candidates[1].match_score * 1.5) {
        confidence = Math.min(1, confidence + 0.1);
      }
    }
    
    console.log(`[parcel-resolve] Found ${candidates.length} candidates, confidence: ${confidence}`);
    
    return new Response(JSON.stringify({
      success: true,
      candidates,
      geocoded_point: { lat: resolvedLat, lng: resolvedLng },
      input_type_detected: detectedType,
      resolution_confidence: confidence,
      timing_ms: Date.now() - startTime
    } as ResolveResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[parcel-resolve] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      candidates: [],
      input_type_detected: 'unknown',
      resolution_confidence: 0,
      timing_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ResolveResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
