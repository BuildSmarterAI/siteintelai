/**
 * transport-score - Transportation intelligence scoring API
 * Computes access/egress scores with caching, use-type weighting, and explainable outputs
 * 
 * POST /transport-score
 * Body: { parcel_id: number, lat?: number, lng?: number, use_type?: string, force_refresh?: boolean }
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Scoring weights by use type
const USE_TYPE_WEIGHTS: Record<string, Record<string, number>> = {
  retail: {
    highway_proximity: 0.15,
    arterial_proximity: 0.25,
    traffic_volume: 0.35,
    access_density: 0.25
  },
  industrial: {
    highway_proximity: 0.40,
    arterial_proximity: 0.25,
    traffic_volume: 0.15,
    access_density: 0.20
  },
  office: {
    highway_proximity: 0.20,
    arterial_proximity: 0.30,
    traffic_volume: 0.20,
    access_density: 0.30
  },
  healthcare: {
    highway_proximity: 0.15,
    arterial_proximity: 0.35,
    traffic_volume: 0.15,
    access_density: 0.35
  },
  residential: {
    highway_proximity: -0.10, // Negative - highways are bad for residential
    arterial_proximity: 0.20,
    traffic_volume: -0.15, // High traffic is negative for residential
    access_density: 0.25
  },
  default: {
    highway_proximity: 0.25,
    arterial_proximity: 0.25,
    traffic_volume: 0.25,
    access_density: 0.25
  }
};

interface ScoreRequest {
  parcel_id: number;
  parcel_uid?: string;
  lat?: number;
  lng?: number;
  use_type?: string;
  force_refresh?: boolean;
}

interface TransportScore {
  overall_score: number;
  component_scores: {
    highway_proximity_score: number;
    arterial_proximity_score: number;
    traffic_volume_score: number;
    access_density_score: number;
  };
  metrics: {
    txdot_district_id: string | null;
    txdot_district_name: string | null;
    nearest_highway_ft: number | null;
    nearest_arterial_ft: number | null;
    aadt_max_nearby: number | null;
    aadt_road_name: string | null;
    aadt_year: number | null;
    intersection_count_500ft: number;
  };
  use_type: string;
  weights_applied: Record<string, number>;
  confidence: number;
  confidence_factors: Record<string, number>;
  citations: Array<{ source: string; field: string; value: string | number; url?: string }>;
  cached: boolean;
  computed_at: string;
}

interface ScoreResponse {
  success: boolean;
  score?: TransportScore;
  timing_ms: number;
  error?: string;
}

// Convert distance to score (0-100) with decay
function distanceToScore(distanceFt: number | null, idealFt: number, maxFt: number): number {
  if (distanceFt === null) return 0;
  if (distanceFt <= idealFt) return 100;
  if (distanceFt >= maxFt) return 0;
  // Linear decay between ideal and max
  return Math.round(100 * (1 - (distanceFt - idealFt) / (maxFt - idealFt)));
}

// Convert AADT to score (0-100) with ranges
function aadtToScore(aadt: number | null): number {
  if (aadt === null || aadt === 0) return 0;
  // Score based on typical ranges:
  // < 5000: low traffic (20)
  // 5000-15000: moderate (40-60)
  // 15000-50000: good (60-85)
  // > 50000: excellent (85-100)
  if (aadt < 5000) return 20;
  if (aadt < 15000) return 40 + (aadt - 5000) / 500; // 40-60
  if (aadt < 50000) return 60 + (aadt - 15000) / 1400; // 60-85
  return Math.min(100, 85 + (aadt - 50000) / 10000); // 85-100
}

// Convert intersection count to score
function intersectionToScore(count: number): number {
  // Higher intersection count = better access
  // 0: 0, 1-2: 30, 3-5: 60, 6-10: 80, >10: 100
  if (count === 0) return 0;
  if (count <= 2) return 30;
  if (count <= 5) return 60;
  if (count <= 10) return 80;
  return 100;
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const body: ScoreRequest = await req.json();
    const { parcel_id, parcel_uid, lat, lng, use_type = 'default', force_refresh = false } = body;
    
    console.log('[transport-score] Request:', { parcel_id, use_type, force_refresh });
    
    // Validate input
    if (!parcel_id && (!lat || !lng)) {
      throw new Error('Either parcel_id or lat/lng coordinates required');
    }
    
    // Check cache first (unless force refresh)
    if (!force_refresh && parcel_id) {
      const { data: cached } = await supabase
        .from('parcel_transport_metrics')
        .select('*')
        .eq('parcel_id', parcel_id)
        .gt('expires_at', new Date().toISOString())
        .order('computed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (cached) {
        console.log('[transport-score] Cache hit for parcel:', parcel_id);
        
        // Compute weighted score for requested use type
        const weights = USE_TYPE_WEIGHTS[use_type] || USE_TYPE_WEIGHTS.default;
        const overallScore = Math.round(
          (cached.highway_proximity_score || 0) * weights.highway_proximity +
          (cached.arterial_proximity_score || 0) * weights.arterial_proximity +
          (cached.traffic_volume_score || 0) * weights.traffic_volume +
          (cached.access_density_score || 0) * weights.access_density
        );
        
        return new Response(JSON.stringify({
          success: true,
          score: {
            overall_score: Math.max(0, Math.min(100, overallScore)),
            component_scores: {
              highway_proximity_score: cached.highway_proximity_score,
              arterial_proximity_score: cached.arterial_proximity_score,
              traffic_volume_score: cached.traffic_volume_score,
              access_density_score: cached.access_density_score
            },
            metrics: {
              txdot_district_id: cached.txdot_district_id,
              txdot_district_name: cached.txdot_district_name,
              nearest_highway_ft: cached.nearest_highway_ft,
              nearest_arterial_ft: cached.nearest_arterial_ft,
              aadt_max_nearby: cached.aadt_max_nearby,
              aadt_road_name: cached.aadt_road_name,
              aadt_year: cached.aadt_year,
              intersection_count_500ft: cached.intersection_count_500ft || 0
            },
            use_type,
            weights_applied: weights,
            confidence: cached.confidence,
            confidence_factors: cached.confidence_factors || {},
            citations: cached.citations || [],
            cached: true,
            computed_at: cached.computed_at
          },
          timing_ms: Date.now() - startTime
        } as ScoreResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Get parcel coordinates if not provided
    let parcelLat = lat;
    let parcelLng = lng;
    
    if (!parcelLat || !parcelLng) {
      const { data: parcel } = await supabase
        .from('canonical_parcels')
        .select('centroid')
        .eq('id', parcel_id)
        .single();
      
      if (parcel?.centroid) {
        parcelLng = parcel.centroid.coordinates[0];
        parcelLat = parcel.centroid.coordinates[1];
      } else {
        throw new Error('Parcel not found or has no centroid');
      }
    }
    
    console.log('[transport-score] Computing metrics for:', { parcel_id, lat: parcelLat, lng: parcelLng });
    
    // Get TxDOT district
    const { data: districtData } = await supabase.rpc('get_txdot_district', {
      p_lat: parcelLat,
      p_lng: parcelLng
    });
    
    const district = districtData?.[0] || null;
    
    // Get nearest roads by class
    const { data: roadsData } = await supabase.rpc('find_nearest_roads', {
      p_lat: parcelLat,
      p_lng: parcelLng,
      p_buffer_ft: 10560 // 2 miles
    });
    
    // Process road data
    let nearestHighwayFt: number | null = null;
    let nearestArterialFt: number | null = null;
    let aadtMax = 0;
    let aadtRoad: string | null = null;
    let aadtYear: number | null = null;
    
    const citations: Array<{ source: string; field: string; value: string | number; url?: string }> = [];
    
    if (roadsData && roadsData.length > 0) {
      for (const road of roadsData) {
        const roadClass = road.road_class?.toLowerCase() || '';
        
        // Categorize highways
        if (roadClass.includes('interstate') || roadClass.includes('us highway') || 
            roadClass.includes('state highway') || roadClass === 'highway') {
          if (nearestHighwayFt === null || road.distance_ft < nearestHighwayFt) {
            nearestHighwayFt = road.distance_ft;
            citations.push({
              source: 'TxDOT Roadway Network',
              field: 'nearest_highway',
              value: `${road.road_name || 'Highway'} at ${Math.round(road.distance_ft)} ft`
            });
          }
        }
        
        // Categorize arterials
        if (roadClass.includes('arterial') || roadClass.includes('major') || 
            roadClass.includes('collector')) {
          if (nearestArterialFt === null || road.distance_ft < nearestArterialFt) {
            nearestArterialFt = road.distance_ft;
            citations.push({
              source: 'TxDOT Roadway Network',
              field: 'nearest_arterial',
              value: `${road.road_name || 'Arterial'} at ${Math.round(road.distance_ft)} ft`
            });
          }
        }
        
        // Track max AADT
        if (road.aadt && road.aadt > aadtMax) {
          aadtMax = road.aadt;
          aadtRoad = road.road_name;
          aadtYear = road.aadt_year;
        }
      }
    }
    
    if (aadtMax > 0) {
      citations.push({
        source: 'TxDOT AADT',
        field: 'traffic_volume',
        value: `${aadtMax.toLocaleString()} vehicles/day on ${aadtRoad || 'nearby road'} (${aadtYear || 'latest'})`
      });
    }
    
    // Get intersection count (road segments within 500ft)
    const { data: intersectionData } = await supabase
      .from('transportation_canonical')
      .select('id', { count: 'exact' })
      .not('geom', 'is', null);
    
    // Use RPC for actual spatial count
    const { count: intersectionCount } = await supabase
      .rpc('find_nearest_roads', { p_lat: parcelLat, p_lng: parcelLng, p_buffer_ft: 500 })
      .then(res => ({ count: res.data?.length || 0 }));
    
    // Calculate component scores
    const highwayScore = distanceToScore(nearestHighwayFt, 500, 15840); // Ideal: 500ft, Max: 3mi
    const arterialScore = distanceToScore(nearestArterialFt, 200, 5280); // Ideal: 200ft, Max: 1mi
    const trafficScore = aadtToScore(aadtMax);
    const accessScore = intersectionToScore(intersectionCount || 0);
    
    // Calculate confidence
    const confidenceFactors: Record<string, number> = {
      roads_coverage: roadsData && roadsData.length > 0 ? 1 : 0,
      aadt_available: aadtMax > 0 ? 1 : 0,
      district_identified: district ? 1 : 0,
      highway_found: nearestHighwayFt !== null ? 1 : 0,
      arterial_found: nearestArterialFt !== null ? 1 : 0
    };
    
    const confidence = Object.values(confidenceFactors).reduce((a, b) => a + b, 0) / 
                       Object.keys(confidenceFactors).length;
    
    // Calculate weighted score for use type
    const weights = USE_TYPE_WEIGHTS[use_type] || USE_TYPE_WEIGHTS.default;
    const overallScore = Math.round(
      highwayScore * weights.highway_proximity +
      arterialScore * weights.arterial_proximity +
      trafficScore * weights.traffic_volume +
      accessScore * weights.access_density
    );
    
    // Add district citation if found
    if (district) {
      citations.push({
        source: 'TxDOT Districts',
        field: 'district',
        value: `${district.district_name} District`,
        url: 'https://www.txdot.gov/about/districts.html'
      });
    }
    
    // Store in cache
    const metricsRecord = {
      parcel_id,
      parcel_uid: parcel_uid || null,
      txdot_district_id: district?.district_id || null,
      txdot_district_name: district?.district_name || null,
      nearest_highway_ft: nearestHighwayFt,
      nearest_arterial_ft: nearestArterialFt,
      nearest_collector_ft: null,
      nearest_local_ft: null,
      aadt_weighted: aadtMax,
      aadt_max_nearby: aadtMax,
      aadt_road_name: aadtRoad,
      aadt_year: aadtYear,
      intersection_count_500ft: intersectionCount || 0,
      intersection_count_1mi: 0,
      signal_count_500ft: 0,
      highway_proximity_score: highwayScore,
      arterial_proximity_score: arterialScore,
      traffic_volume_score: trafficScore,
      access_density_score: accessScore,
      score_retail: Math.round(highwayScore * 0.15 + arterialScore * 0.25 + trafficScore * 0.35 + accessScore * 0.25),
      score_industrial: Math.round(highwayScore * 0.40 + arterialScore * 0.25 + trafficScore * 0.15 + accessScore * 0.20),
      score_office: Math.round(highwayScore * 0.20 + arterialScore * 0.30 + trafficScore * 0.20 + accessScore * 0.30),
      score_healthcare: Math.round(highwayScore * 0.15 + arterialScore * 0.35 + trafficScore * 0.15 + accessScore * 0.35),
      score_residential: Math.round(Math.max(0, highwayScore * -0.10 + arterialScore * 0.20 + trafficScore * -0.15 + accessScore * 0.25 + 50)),
      confidence,
      confidence_factors: confidenceFactors,
      citations,
      computed_version: 'v1',
      source_data_version: 'txdot_2025',
      computed_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };
    
    // Upsert to cache
    const { error: upsertError } = await supabase
      .from('parcel_transport_metrics')
      .upsert(metricsRecord, { 
        onConflict: 'parcel_id,computed_version',
        ignoreDuplicates: false 
      });
    
    if (upsertError) {
      console.warn('[transport-score] Cache upsert warning:', upsertError);
    }
    
    console.log(`[transport-score] Computed score ${overallScore} for parcel ${parcel_id}, confidence: ${confidence}`);
    
    return new Response(JSON.stringify({
      success: true,
      score: {
        overall_score: Math.max(0, Math.min(100, overallScore)),
        component_scores: {
          highway_proximity_score: highwayScore,
          arterial_proximity_score: arterialScore,
          traffic_volume_score: trafficScore,
          access_density_score: accessScore
        },
        metrics: {
          txdot_district_id: district?.district_id || null,
          txdot_district_name: district?.district_name || null,
          nearest_highway_ft: nearestHighwayFt,
          nearest_arterial_ft: nearestArterialFt,
          aadt_max_nearby: aadtMax || null,
          aadt_road_name: aadtRoad,
          aadt_year: aadtYear,
          intersection_count_500ft: intersectionCount || 0
        },
        use_type,
        weights_applied: weights,
        confidence,
        confidence_factors: confidenceFactors,
        citations,
        cached: false,
        computed_at: metricsRecord.computed_at
      },
      timing_ms: Date.now() - startTime
    } as ScoreResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[transport-score] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      timing_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ScoreResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
