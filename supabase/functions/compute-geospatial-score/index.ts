/**
 * BuildSmarter™ Feasibility Core
 * Function: compute-geospatial-score
 * Purpose: Compute structured geospatial intelligence scores for parcels
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

    // ---------- COUNTY BOUNDARY MATCH ----------
    console.log('Querying county boundaries...');
    const { data: counties, error: countyError } = await supabase
      .from('county_boundaries')
      .select('*');

    if (countyError) throw countyError;

    let countyBoundary = null;
    for (const county of counties || []) {
      if (pointInPolygon(point, county.geometry)) {
        countyBoundary = {
          county_name: county.county_name,
          source: county.source,
          geometry_ref: county.id,
          updated_at: county.updated_at
        };
        console.log(`✓ Matched county: ${county.county_name}`);
        break;
      }
    }

    // ---------- FEMA FLOOD RISK ----------
    console.log('Querying FEMA flood zones...');
    const { data: femaZones, error: femaError } = await supabase
      .from('fema_flood_zones')
      .select('*')
      .limit(1000);

    if (femaError) console.error('FEMA query error:', femaError);

    let femaFloodRisk = null;
    let floodRiskValue = 0;

    for (const zone of femaZones || []) {
      if (pointInPolygon(point, zone.geometry)) {
        const zoneCode = zone.zone || 'X';
        
        // Assign flood risk based on zone code
        if (['AE', 'VE', 'A', 'AO', 'AH'].includes(zoneCode)) floodRiskValue = 0.8;
        else if (['X', '0.2 PCT ANNUAL CHANCE FLOOD HAZARD'].includes(zoneCode)) floodRiskValue = 0.2;
        else floodRiskValue = 0.5;

        femaFloodRisk = {
          in_flood_zone: floodRiskValue > 0.3,
          zone_code: zoneCode,
          bfe: null, // Would need to parse from properties if available
          source: zone.source,
          geometry_ref: zone.id,
          last_refreshed: zone.updated_at
        };
        
        console.log(`✓ In flood zone: ${zoneCode} (risk: ${floodRiskValue})`);
        break;
      }
    }

    // ---------- TRAFFIC EXPOSURE ----------
    console.log('Querying traffic segments...');
    const { data: trafficSegments, error: trafficError } = await supabase
      .from('txdot_traffic_segments')
      .select('*')
      .limit(1000);

    if (trafficError) console.error('Traffic query error:', trafficError);

    let trafficExposure = null;
    let trafficVisibilityValue = 0;
    let nearestSegment = null;
    let minDistance = Infinity;

    for (const segment of trafficSegments || []) {
      const distance = distanceToLineString(point, segment.geometry);
      if (distance < minDistance) {
        minDistance = distance;
        nearestSegment = segment;
      }
    }

    if (nearestSegment && minDistance < 5000) { // Within 5000 feet
      const aadt = nearestSegment.aadt || 0;
      
      // Normalize traffic visibility (0-1 scale)
      // High traffic: 100k+ AADT = 1.0
      // Moderate: 50k AADT = 0.5
      // Low: 10k AADT = 0.1
      trafficVisibilityValue = Math.min(1, aadt / 100000);

      trafficExposure = {
        nearest_segment_id: nearestSegment.segment_id,
        roadway_name: nearestSegment.roadway || 'Unknown',
        aadt: nearestSegment.aadt,
        year: nearestSegment.year,
        distance_to_segment_ft: Math.round(minDistance),
        source: nearestSegment.source,
        geometry_ref: nearestSegment.id,
        updated_at: nearestSegment.updated_at
      };

      console.log(`✓ Nearest traffic: ${nearestSegment.roadway} (AADT: ${aadt}, dist: ${Math.round(minDistance)}ft)`);
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
        score: geospatialScore.overall_geospatial_score
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
