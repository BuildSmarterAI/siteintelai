import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { minLng, minLat, maxLng, maxLat, months_back } = await req.json();

    if (!minLng || !minLat || !maxLng || !maxLat) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: minLng, minLat, maxLng, maxLat' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log(`[hii-geojson] Fetching hospitality data for bbox: ${minLng},${minLat} to ${maxLng},${maxLat}`);

    const monthsBack = months_back || 12;
    const dateThreshold = new Date();
    dateThreshold.setMonth(dateThreshold.getMonth() - monthsBack);
    const dateThresholdStr = dateThreshold.toISOString().split('T')[0];

    // Query establishments within bounding box
    const { data, error } = await supabase
      .from('tx_mixed_beverage_activity')
      .select('location_name, address, city, county, total_receipts, lat, lon, period_end_date')
      .gte('period_end_date', dateThresholdStr)
      .gte('lat', minLat)
      .lte('lat', maxLat)
      .gte('lon', minLng)
      .lte('lon', maxLng)
      .not('lat', 'is', null)
      .not('lon', 'is', null)
      .order('total_receipts', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('[hii-geojson] Query error:', error);
      throw error;
    }

    // Transform to GeoJSON
    const features = (data || []).map(record => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [record.lon, record.lat]
      },
      properties: {
        name: record.location_name,
        address: record.address,
        city: record.city,
        county: record.county,
        total_receipts: record.total_receipts,
        period_end_date: record.period_end_date,
        // Categorize by receipt size
        category: record.total_receipts > 1000000 ? 'high' :
                  record.total_receipts > 100000 ? 'medium' : 'low'
      }
    }));

    const geojson = {
      type: 'FeatureCollection',
      features: features,
      metadata: {
        count: features.length,
        bbox: [minLng, minLat, maxLng, maxLat],
        months_analyzed: monthsBack
      }
    };

    console.log(`[hii-geojson] Returning ${features.length} establishments`);

    return new Response(
      JSON.stringify(geojson),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[hii-geojson] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
