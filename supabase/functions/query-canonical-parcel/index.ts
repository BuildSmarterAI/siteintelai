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

interface ParcelResponse {
  parcel: any;
  source: 'canonical_parcels' | 'external_fallback';
  coverage_status: 'seeded' | 'not_seeded';
  data_provenance: {
    source: string;
    dataset_version: string | null;
    accuracy_tier: number | null;
    source_agency: string | null;
  };
  query_type?: string;
}

// Log coverage gap for ETL prioritization
async function logCoverageGap(
  supabase: any,
  jurisdiction: string,
  lat: number | null,
  lng: number | null,
  parcelId: string | null
) {
  try {
    await supabase.from('gis_coverage_events').insert({
      event_type: 'coverage_gap',
      jurisdiction: jurisdiction || 'unknown',
      layer_type: 'parcels',
      details: {
        lat,
        lng,
        parcel_id: parcelId,
        triggered_at: new Date().toISOString(),
        reason: 'external_fallback_used'
      }
    });
    console.log('[query-canonical-parcel] Logged coverage gap event');
  } catch (err) {
    console.warn('[query-canonical-parcel] Failed to log coverage gap:', err);
  }
}

// Fallback to external fetch-parcels function
async function fetchFromExternal(
  supabaseUrl: string,
  supabaseKey: string,
  params: { parcelId?: string; lat?: number; lng?: number }
): Promise<any> {
  const fetchParcelsUrl = `${supabaseUrl}/functions/v1/fetch-parcels`;
  
  console.log('[query-canonical-parcel] Falling back to external fetch-parcels');
  
  try {
    const response = await fetch(fetchParcelsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        parcelId: params.parcelId,
        lat: params.lat,
        lng: params.lng,
      }),
    });

    if (!response.ok) {
      console.error('[query-canonical-parcel] External fetch failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      // Normalize external data to match canonical schema
      return {
        id: null, // Not in our DB
        source_parcel_id: feature.properties?.parcel_id || null,
        apn: feature.properties?.parcel_id || null,
        situs_address: feature.properties?.situs_address || null,
        owner_name: feature.properties?.owner_name || null,
        acreage: feature.properties?.acreage || null,
        land_use_code: null,
        land_use_desc: null,
        jurisdiction: feature.properties?.county || 'unknown',
        county_fips: null,
        city: null,
        state: 'TX',
        zip: null,
        dataset_version: null,
        accuracy_tier: 3, // External = lower tier
        source_agency: feature.properties?.source || 'external_api',
        geometry: feature.geometry,
        _external_raw: feature.properties, // Keep raw for debugging
      };
    }
    
    return null;
  } catch (err) {
    console.error('[query-canonical-parcel] External fetch error:', err);
    return null;
  }
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

      // If found in canonical, return with verified status
      if (data) {
        console.log(`[query-canonical-parcel] Found in canonical_parcels`);
        const response: ParcelResponse = {
          parcel: data,
          source: 'canonical_parcels',
          coverage_status: 'seeded',
          data_provenance: {
            source: 'SiteIntel canonical_parcels',
            dataset_version: data?.dataset_version || null,
            accuracy_tier: data?.accuracy_tier || null,
            source_agency: data?.source_agency || null,
          }
        };
        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // NOT FOUND - try external fallback
      console.log(`[query-canonical-parcel] Not found in canonical, trying external fallback`);
      const externalParcel = await fetchFromExternal(supabaseUrl, supabaseKey, { parcelId: id });
      
      if (externalParcel) {
        // Log coverage gap for ETL prioritization
        await logCoverageGap(supabase, externalParcel.jurisdiction, null, null, id);
        
        const response: ParcelResponse = {
          parcel: externalParcel,
          source: 'external_fallback',
          coverage_status: 'not_seeded',
          data_provenance: {
            source: 'External City API (unverified)',
            dataset_version: null,
            accuracy_tier: 3,
            source_agency: externalParcel.source_agency,
          }
        };
        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Nothing found anywhere
      return new Response(JSON.stringify({
        parcel: null,
        source: 'canonical_parcels',
        coverage_status: 'not_seeded',
        message: 'Parcel not found in any data source',
        data_provenance: {
          source: 'none',
          dataset_version: null,
          accuracy_tier: null,
          source_agency: null,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Query by point (lat/lng)
    if (lat !== undefined && lng !== undefined) {
      console.log(`[query-canonical-parcel] Querying by point: ${lat}, ${lng}`);
      
      // Try RPC first for point-in-polygon
      const { data, error } = await supabase.rpc('find_parcel_at_point', {
        p_lng: lng,
        p_lat: lat
      });

      if (!error && data) {
        const response: ParcelResponse = {
          parcel: data,
          source: 'canonical_parcels',
          coverage_status: 'seeded',
          query_type: 'point',
          data_provenance: {
            source: 'SiteIntel canonical_parcels',
            dataset_version: data?.dataset_version || null,
            accuracy_tier: data?.accuracy_tier || null,
            source_agency: data?.source_agency || null,
          }
        };
        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // RPC failed or no data - try external fallback
      console.log('[query-canonical-parcel] Point query failed, trying external fallback');
      const externalParcel = await fetchFromExternal(supabaseUrl, supabaseKey, { lat, lng });
      
      if (externalParcel) {
        await logCoverageGap(supabase, externalParcel.jurisdiction, lat, lng, null);
        
        const response: ParcelResponse = {
          parcel: externalParcel,
          source: 'external_fallback',
          coverage_status: 'not_seeded',
          query_type: 'point_fallback',
          data_provenance: {
            source: 'External City API (unverified)',
            dataset_version: null,
            accuracy_tier: 3,
            source_agency: externalParcel.source_agency,
          }
        };
        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ 
        parcel: null, 
        message: 'No parcel found at this location',
        source: 'canonical_parcels',
        coverage_status: 'not_seeded',
        query_type: 'point',
        data_provenance: {
          source: 'none',
          dataset_version: null,
          accuracy_tier: null,
          source_agency: null,
        }
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
        coverage_status: (data?.length || 0) > 0 ? 'seeded' : 'not_seeded',
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