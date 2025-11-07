import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bbox, zoom, parcelId } = await req.json();
    
    console.log('Fetching HCAD parcels:', { bbox, zoom, parcelId });

    // Official Harris County GIS endpoint
    const HCAD_URL = 'https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query';
    const HCAD_FIELDS = 'OBJECTID,acct_num,owner_name_1,Acreage,site_zip,land_value,impr_value';

    // If searching by parcel ID
    if (parcelId) {
      try {
        const parcelQuery = `${HCAD_URL}?` +
          `where=acct_num='${parcelId}'&` +
          `outFields=${HCAD_FIELDS}&` +
          `inSR=4326&` +
          `returnGeometry=true&` +
          `outSR=4326&` +
          `f=geojson`;
        
        console.log('Querying HCAD by parcel ID:', parcelQuery);
        const response = await fetch(parcelQuery);
        
        if (!response.ok) {
          console.warn(`HCAD query failed with ${response.status}`);
          return new Response(JSON.stringify({ type: 'FeatureCollection', features: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const data = await response.json();
        console.log(`✅ Found ${data.features?.length || 0} parcel(s)`);
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        console.error('HCAD parcel query error:', err);
        return new Response(JSON.stringify({ type: 'FeatureCollection', features: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Only fetch at zoom 14+
    if (zoom < 14) {
      return new Response(JSON.stringify({
        type: 'FeatureCollection',
        features: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build spatial query for parcels in viewport
    const [minLng, minLat, maxLng, maxLat] = bbox;
    const bboxGeometry = `${minLng},${minLat},${maxLng},${maxLat}`;
    
    try {
      const arcgisQuery = `${HCAD_URL}?` +
        `geometry=${bboxGeometry}&` +
        `geometryType=esriGeometryEnvelope&` +
        `inSR=4326&` +
        `spatialRel=esriSpatialRelIntersects&` +
        `outFields=${HCAD_FIELDS}&` +
        `returnGeometry=true&` +
        `outSR=4326&` +
        `resultRecordCount=500&` +
        `f=geojson`;

      console.log('Querying HCAD Parcels:', arcgisQuery);

      const response = await fetch(arcgisQuery);
      
      if (!response.ok) {
        console.error(`HCAD returned ${response.status}`);
        return new Response(JSON.stringify({ type: 'FeatureCollection', features: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const geojson = await response.json();
      
      console.log(`✅ Fetched ${geojson.features?.length || 0} HCAD parcels`);

      return new Response(JSON.stringify(geojson), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('HCAD query error:', err);
      return new Response(JSON.stringify({ type: 'FeatureCollection', features: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error fetching HCAD parcels:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
