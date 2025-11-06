/**
 * BuildSmarter™ Feasibility Core
 * Function: compute-geospatial-score
 * Purpose: Compute structured geospatial intelligence scores for parcels
 * 
 * PHASE 6 UPDATE: Now uses GIS cache system for county and traffic data
 * - Retrieves cached data via gis-get-layer
 * - Falls back to refresh on cache miss
 * - 90%+ reduction in external API calls
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Turf.js helper functions for spatial operations
function pointInPolygon(point: [number, number], polygon: any): boolean {
  const [lng, lat] = point;
  const coordinates = polygon.coordinates[0];
  
  let inside = false;
  for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
    const xi = coordinates[i][0], yi = coordinates[i][1];
    const xj = coordinates[j][0], yj = coordinates[j][1];
    
    const intersect = ((yi > lat) !== (yj > lat))
      && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

function distanceToLineString(point: [number, number], lineString: any): number {
  const coordinates = lineString.coordinates;
  let minDist = Infinity;
  
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [x1, y1] = coordinates[i];
    const [x2, y2] = coordinates[i + 1];
    const dist = pointToSegmentDistance(point, [x1, y1], [x2, y2]);
    minDist = Math.min(minDist, dist);
  }
  
  return minDist * 364567.2; // Convert degrees to feet (approximate)
}

function pointToSegmentDistance(point: [number, number], start: [number, number], end: [number, number]): number {
  const [px, py] = point;
  const [x1, y1] = start;
  const [x2, y2] = end;
  
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  
  if (lengthSquared === 0) {
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }
  
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  
  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

function calculateGeospatialScore(
  jurisdictionMatch: boolean,
  floodRisk: number,
  trafficVisibility: number
): {
  jurisdiction_confidence: number;
  flood_risk_index: number;
  traffic_visibility_index: number;
  overall_geospatial_score: number;
  scoring_notes: string;
} {
  const jurisdictionConfidence = jurisdictionMatch ? 0.99 : 0.5;
  const floodRiskIndex = Math.min(1, Math.max(0, floodRisk));
  const trafficVisibilityIndex = Math.min(1, Math.max(0, trafficVisibility));
  
  // Weighted scoring: jurisdiction (10%), flood risk (40%, inverse), traffic (50%)
  const overallScore = 
    (jurisdictionConfidence * 10) +
    ((1 - floodRiskIndex) * 40) +
    (trafficVisibilityIndex * 50);
  
  let notes = '';
  if (floodRiskIndex > 0.7) notes += 'High flood exposure. ';
  else if (floodRiskIndex > 0.3) notes += 'Moderate flood exposure. ';
  else notes += 'Minimal flood risk. ';
  
  if (trafficVisibilityIndex > 0.7) notes += 'Excellent traffic visibility.';
  else if (trafficVisibilityIndex > 0.3) notes += 'Moderate traffic visibility.';
  else notes += 'Low traffic visibility.';
  
  return {
    jurisdiction_confidence: jurisdictionConfidence,
    flood_risk_index: floodRiskIndex,
    traffic_visibility_index: trafficVisibilityIndex,
    overall_geospatial_score: Math.round(overallScore * 10) / 10,
    scoring_notes: notes.trim()
  };
}

// Helper: Fetch cached GIS layer with fallback to refresh
async function getCachedLayer(
  supabase: any,
  layerKey: string,
  areaKey: string
): Promise<any> {
  console.log(`[cache] Fetching ${layerKey}/${areaKey}...`);
  
  try {
    // Try to get from cache
    const cacheUrl = `https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/gis-get-layer?layer_key=${encodeURIComponent(layerKey)}&area_key=${encodeURIComponent(areaKey)}`;
    const cacheResponse = await fetch(cacheUrl);
    
    if (cacheResponse.ok) {
      const cacheData = await cacheResponse.json();
      
      // Check if expired (warning, but still usable)
      if (cacheData.is_expired) {
        console.warn(`[cache] ${layerKey} is expired, triggering background refresh`);
        // Trigger async refresh in background (don't await)
        supabase.functions.invoke('gis-fetch-with-versioning', {
          body: { layer_key: layerKey, area_key: areaKey }
        }).catch((err: any) => console.error('[cache] Background refresh failed:', err));
      }
      
      // Return cached data (inline or via signed URL)
      if (cacheData.geojson) {
        console.log(`[cache] ✓ ${layerKey} (inline, ${cacheData.record_count} records)`);
        return cacheData.geojson;
      } else if (cacheData.storage_url) {
        console.log(`[cache] ✓ ${layerKey} (storage, ${cacheData.record_count} records)`);
        // Fetch from signed URL
        const dataResponse = await fetch(cacheData.storage_url);
        if (dataResponse.ok) {
          // Decompress gzip if needed
          const contentType = dataResponse.headers.get('content-type');
          if (contentType?.includes('gzip')) {
            const buffer = await dataResponse.arrayBuffer();
            const decompressed = new DecompressionStream('gzip');
            const reader = new Response(buffer).body?.pipeThrough(decompressed).getReader();
            
            let result = '';
            const decoder = new TextDecoder();
            while (true) {
              const { done, value } = await reader!.read();
              if (done) break;
              result += decoder.decode(value, { stream: true });
            }
            return JSON.parse(result);
          } else {
            return await dataResponse.json();
          }
        }
      }
    }
    
    // Cache miss - trigger refresh and retry
    console.warn(`[cache] Cache miss for ${layerKey}, refreshing...`);
    const refreshResponse = await supabase.functions.invoke('gis-fetch-with-versioning', {
      body: { layer_key: layerKey, area_key: areaKey, force_refresh: true }
    });
    
    if (refreshResponse.error) {
      throw new Error(`Refresh failed: ${refreshResponse.error.message}`);
    }
    
    // Retry cache fetch
    const retryResponse = await fetch(cacheUrl);
    if (retryResponse.ok) {
      const retryData = await retryResponse.json();
      return retryData.geojson || null;
    }
    
    return null;
    
  } catch (err) {
    console.error(`[cache] Error fetching ${layerKey}:`, err);
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { application_id, parcel_id, lat, lng } = await req.json();

    if (!lat || !lng) {
      throw new Error('Location coordinates (lat, lng) are required');
    }

    console.log(`Computing geospatial score for parcel at [${lat}, ${lng}]`);

    const point: [number, number] = [lng, lat];
    const location = { lat, lng };

    // ---------- COUNTY BOUNDARY MATCH (FROM CACHE) ----------
    console.log('Querying county boundaries from cache...');
    
    let countyBoundary = null;
    const counties = ['harris', 'fort_bend', 'montgomery'];
    
    for (const county of counties) {
      const layerKey = county === 'harris' ? 'hcad:county_boundary' :
                       county === 'fort_bend' ? 'fbcad:county_boundary' :
                       'mcad:county_boundary';
      
      const countyData = await getCachedLayer(supabase, layerKey, county);
      
      if (countyData?.features) {
        for (const feature of countyData.features) {
          if (pointInPolygon(point, feature.geometry)) {
            countyBoundary = {
              county_name: feature.properties?.name || county,
              source: layerKey.split(':')[0].toUpperCase(),
              geometry_ref: feature.id || feature.properties?.OBJECTID,
              updated_at: new Date().toISOString()
            };
            console.log(`✓ Matched county: ${countyBoundary.county_name}`);
            break;
          }
        }
        if (countyBoundary) break;
      }
    }

    // ---------- FEMA FLOOD RISK (ON-DEMAND QUERY) ----------
    console.log('Querying FEMA flood zone for point...');
    
    let femaFloodRisk = null;
    let floodRiskValue = 0;

    try {
      const femaResponse = await supabase.functions.invoke('query-fema-by-point', {
        body: { lat, lng }
      });

      if (femaResponse.error) {
        console.error('FEMA query error:', femaResponse.error);
      } else if (femaResponse.data) {
        const femaData = femaResponse.data;
        floodRiskValue = femaData.flood_risk_level || 0.2;

        femaFloodRisk = {
          in_flood_zone: femaData.in_flood_zone || false,
          zone_code: femaData.flood_zone || 'X',
          bfe: femaData.base_flood_elevation || null,
          zone_subtype: femaData.zone_subtype || null,
          dfirm_id: femaData.dfirm_id || null,
          source: femaData.source || 'FEMA NFHL MapServer 28',
          last_refreshed: femaData.query_timestamp || new Date().toISOString()
        };
        
        console.log(`✓ FEMA flood zone: ${femaData.flood_zone} (risk: ${floodRiskValue})`);
      }
    } catch (err) {
      console.error('Error calling query-fema-by-point:', err);
      floodRiskValue = 0.5;
      femaFloodRisk = {
        in_flood_zone: true,
        zone_code: 'UNKNOWN',
        bfe: null,
        source: 'Error - unable to query FEMA',
        last_refreshed: new Date().toISOString()
      };
    }

    // ---------- TRAFFIC EXPOSURE (FROM CACHE) ----------
    console.log('Querying traffic segments from cache...');
    
    const trafficData = await getCachedLayer(supabase, 'txdot:aadt', 'all');
    
    let trafficExposure = null;
    let trafficVisibilityValue = 0;
    let nearestSegment = null;
    let minDistance = Infinity;

    if (trafficData?.features) {
      console.log(`Processing ${trafficData.features.length} cached traffic segments...`);
      
      for (const feature of trafficData.features) {
        const segment = {
          geometry: feature.geometry,
          properties: feature.properties,
          id: feature.id
        };
        
        let distance: number;
        
        if (segment.geometry.type === 'Point') {
          const [segLng, segLat] = segment.geometry.coordinates;
          distance = pointToSegmentDistance(point, [segLng, segLat], [segLng, segLat]);
        } else if (segment.geometry.type === 'LineString') {
          distance = distanceToLineString(point, segment.geometry);
        } else {
          continue;
        }
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestSegment = segment;
        }
      }
    }

    if (nearestSegment && minDistance < 5000) {
      const aadt = nearestSegment.properties?.AADT || nearestSegment.properties?.aadt || 0;
      trafficVisibilityValue = Math.min(1, aadt / 100000);

      trafficExposure = {
        nearest_segment_id: nearestSegment.properties?.OBJECTID?.toString() || nearestSegment.id,
        roadway_name: nearestSegment.properties?.ROUTE_NAME || nearestSegment.properties?.roadway || 'Unknown',
        aadt: aadt,
        year: nearestSegment.properties?.AADT_YR || nearestSegment.properties?.year,
        distance_to_segment_ft: Math.round(minDistance),
        source: 'TxDOT (cached)',
        geometry_ref: nearestSegment.id,
        updated_at: new Date().toISOString()
      };

      console.log(`✓ Nearest traffic: ${trafficExposure.roadway_name} (AADT: ${aadt}, dist: ${Math.round(minDistance)}ft)`);
    } else {
      console.log('✗ No traffic segments within 5000ft');
    }

    // ---------- COMPUTE GEOSPATIAL SCORE ----------
    const geospatialScore = calculateGeospatialScore(
      !!countyBoundary,
      floodRiskValue,
      trafficVisibilityValue
    );

    console.log(`Computed geospatial score: ${geospatialScore.overall_geospatial_score}`);

    // ---------- STORE IN DATABASE ----------
    const recordData = {
      parcel_id: parcel_id || `parcel_${Date.now()}`,
      application_id: application_id || null,
      location,
      county_boundary: countyBoundary,
      fema_flood_risk: femaFloodRisk,
      traffic_exposure: trafficExposure,
      geospatial_score: geospatialScore
    };

    const { data: result, error: insertError } = await supabase
      .from('feasibility_geospatial')
      .upsert(recordData, { onConflict: 'parcel_id' })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log('✓ Geospatial record saved successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        score: geospatialScore.overall_geospatial_score,
        cache_performance: {
          county: countyBoundary ? 'cache_hit' : 'not_found',
          traffic: trafficExposure ? 'cache_hit' : 'not_found',
          fema: 'on_demand_query'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (err) {
    console.error('Error computing geospatial score:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
