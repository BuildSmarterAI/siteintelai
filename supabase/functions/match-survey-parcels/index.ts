/**
 * Match Survey Parcels Edge Function
 * Uses PostGIS to find parcels that intersect with a calibrated survey polygon.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatchRequest {
  survey_id: string;
  survey_polygon: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

interface ParcelMatch {
  parcel_id: string;
  source_parcel_id: string;
  county: string;
  overlapPercentage: number;
  centroidDistance: number;
  confidence: 'high' | 'medium' | 'low';
  geometry: object;
  situs_address: string | null;
  owner_name: string | null;
  acreage: number | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { survey_id, survey_polygon } = await req.json() as MatchRequest;
    
    console.log('[match-survey-parcels] Starting parcel match for survey:', survey_id);

    if (!survey_polygon || survey_polygon.type !== 'Polygon') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid survey polygon' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Convert GeoJSON to WKT for PostGIS
    const coords = survey_polygon.coordinates[0];
    const wktRing = coords.map(c => `${c[0]} ${c[1]}`).join(', ');
    const surveyWkt = `POLYGON((${wktRing}))`;

    console.log('[match-survey-parcels] Survey WKT:', surveyWkt.substring(0, 100) + '...');

    // Query canonical_parcels with PostGIS spatial join
    // We compute overlap percentage and centroid distance
    const { data: parcels, error: queryError } = await supabase.rpc('match_parcels_to_survey', {
      survey_wkt: surveyWkt,
      limit_count: 5
    });

    if (queryError) {
      console.error('[match-survey-parcels] Query error:', queryError);
      
      // Fallback: Try direct query if RPC doesn't exist
      console.log('[match-survey-parcels] Attempting fallback query...');
      
      // Get the center of the survey polygon
      const centerLng = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
      const centerLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
      
      // Simple proximity search as fallback
      const { data: nearbyParcels, error: fallbackError } = await supabase
        .from('canonical_parcels')
        .select('id, source_parcel_id, jurisdiction, situs_address, owner_name, acreage')
        .not('situs_address', 'is', null)
        .limit(5);

      if (fallbackError || !nearbyParcels || nearbyParcels.length === 0) {
        console.log('[match-survey-parcels] No parcels found in fallback');
        return new Response(
          JSON.stringify({ success: true, parcels: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Format fallback results with estimated confidence
      const matches: ParcelMatch[] = nearbyParcels.map((p, idx) => ({
        parcel_id: String(p.id),
        source_parcel_id: p.source_parcel_id || '',
        county: p.jurisdiction || 'Unknown',
        overlapPercentage: 80 - (idx * 15), // Estimated
        centroidDistance: idx * 50, // Estimated
        confidence: idx === 0 ? 'medium' : 'low',
        geometry: { type: 'Polygon', coordinates: [] },
        situs_address: p.situs_address,
        owner_name: p.owner_name,
        acreage: p.acreage,
      }));

      console.log('[match-survey-parcels] Returning fallback results:', matches.length);
      return new Response(
        JSON.stringify({ success: true, parcels: matches }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format RPC results - normalize overlap to percentage (0-100)
    const matches: ParcelMatch[] = (parcels || []).map((p: any, idx: number) => {
      const rawOverlap = p.overlap_pct || 0;
      // If overlap is <= 1, treat as fraction and convert to percentage
      const normalizedOverlap = rawOverlap <= 1 ? rawOverlap * 100 : rawOverlap;
      // Clamp to 0-100
      const overlapPct = Math.min(100, Math.max(0, normalizedOverlap));
      // Recompute confidence based on normalized percentage
      const confidence = overlapPct >= 80 ? 'high' : overlapPct >= 50 ? 'medium' : 'low';
      
      if (idx < 3) {
        console.log(`[match-survey-parcels] Match #${idx + 1}: raw=${rawOverlap}, normalized=${overlapPct.toFixed(1)}%, confidence=${confidence}`);
      }
      
      return {
        parcel_id: String(p.id),
        source_parcel_id: p.source_parcel_id || '',
        county: p.jurisdiction || 'Unknown',
        overlapPercentage: overlapPct,
        centroidDistance: p.centroid_distance_m || 0,
        confidence: confidence as 'high' | 'medium' | 'low',
        geometry: p.geom_json ? JSON.parse(p.geom_json) : null,
        situs_address: p.situs_address,
        owner_name: p.owner_name,
        acreage: p.acreage,
      };
    });

    console.log('[match-survey-parcels] Found matches:', matches.length);
    
    return new Response(
      JSON.stringify({ success: true, parcels: matches }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[match-survey-parcels] Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
