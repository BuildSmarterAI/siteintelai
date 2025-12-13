import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueryParams {
  parcel_id?: string;
  source_parcel_id?: string;
  lat?: number;
  lng?: number;
  bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  limit?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const params: QueryParams = await req.json();
    const { parcel_id, source_parcel_id, lat, lng, bbox, limit = 100 } = params;

    console.log('[query-canonical-parcel] Request:', { parcel_id, source_parcel_id, lat, lng, bbox, limit });

    // Query by source_parcel_id (most common - from vector tile click)
    if (source_parcel_id || parcel_id) {
      const id = source_parcel_id || parcel_id;
      console.log(`[query-canonical-parcel] Querying by source_parcel_id: ${id}`);
      
      const { data, error } = await supabase
        .from('canonical_parcels')
        .select('*')
        .eq('source_parcel_id', id)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[query-canonical-parcel] Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`[query-canonical-parcel] Found parcel:`, data ? 'yes' : 'no');

      return new Response(JSON.stringify({
        parcel: data,
        source: 'canonical_parcels',
        data_provenance: {
          source: 'SiteIntel canonical_parcels',
          dataset_version: data?.dataset_version || null,
          accuracy_tier: data?.accuracy_tier || null,
          source_agency: data?.source_agency || null,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Query by point (lat/lng)
    if (lat !== undefined && lng !== undefined) {
      console.log(`[query-canonical-parcel] Querying by point: ${lat}, ${lng}`);
      
      // Use PostGIS ST_Contains to find parcel containing the point
      const { data, error } = await supabase.rpc('find_parcel_at_point', {
        p_lng: lng,
        p_lat: lat
      });

      if (error) {
        // If RPC doesn't exist, fall back to bbox query with small buffer
        console.warn('[query-canonical-parcel] RPC failed, falling back to bbox:', error.message);
        
        const buffer = 0.0001; // ~10 meters
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('canonical_parcels')
          .select('*')
          .gte('ST_X(centroid)', lng - buffer)
          .lte('ST_X(centroid)', lng + buffer)
          .gte('ST_Y(centroid)', lat - buffer)
          .lte('ST_Y(centroid)', lat + buffer)
          .limit(1);

        if (fallbackError) {
          // Last resort: just get nearest by jurisdiction
          console.warn('[query-canonical-parcel] Fallback also failed:', fallbackError.message);
          return new Response(JSON.stringify({ 
            parcel: null, 
            message: 'Point query not available - use parcel_id instead',
            source: 'canonical_parcels'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          parcel: fallbackData?.[0] || null,
          source: 'canonical_parcels',
          query_type: 'point_fallback'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        parcel: data,
        source: 'canonical_parcels',
        query_type: 'point'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Query by bounding box
    if (bbox && bbox.length === 4) {
      const [minLng, minLat, maxLng, maxLat] = bbox;
      console.log(`[query-canonical-parcel] Querying by bbox: ${bbox.join(', ')}`);
      
      // Use PostGIS to query parcels within bbox
      const { data, error } = await supabase.rpc('find_parcels_in_bbox', {
        p_min_lng: minLng,
        p_min_lat: minLat,
        p_max_lng: maxLng,
        p_max_lat: maxLat,
        p_limit: limit
      });

      if (error) {
        console.error('[query-canonical-parcel] Bbox query error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`[query-canonical-parcel] Found ${data?.length || 0} parcels in bbox`);

      return new Response(JSON.stringify({
        parcels: data || [],
        count: data?.length || 0,
        source: 'canonical_parcels',
        query_type: 'bbox'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // No valid query parameters
    return new Response(JSON.stringify({
      error: 'Invalid request: provide parcel_id, source_parcel_id, lat/lng, or bbox',
      usage: {
        parcel_id: 'Query by source_parcel_id',
        'lat/lng': 'Query by geographic point',
        bbox: 'Query by bounding box [minLng, minLat, maxLng, maxLat]'
      }
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[query-canonical-parcel] Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
