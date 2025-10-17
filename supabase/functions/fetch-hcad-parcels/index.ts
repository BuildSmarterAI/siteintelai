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

    // If searching by parcel ID
    if (parcelId) {
      const parcelQuery = `https://gis.hcad.org/arcgis/rest/services/public/CAMA/MapServer/4/query?` +
        `where=ACCOUNT='${parcelId}'&` +
        `outFields=OBJECTID,ACCOUNT,SITUS_ADDRESS,OWNER_NAME,ACREAGE,LAND_VALUE,IMPR_VALUE&` +
        `returnGeometry=true&` +
        `outSR=4326&` +
        `f=geojson`;
      
      const response = await fetch(parcelQuery);
      const data = await response.json();
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
    
    const arcgisQuery = `https://gis.hcad.org/arcgis/rest/services/public/CAMA/MapServer/4/query?` +
      `geometry=${bboxGeometry}&` +
      `geometryType=esriGeometryEnvelope&` +
      `spatialRel=esriSpatialRelIntersects&` +
      `outFields=OBJECTID,ACCOUNT,SITUS_ADDRESS,OWNER_NAME,ACREAGE,LAND_VALUE,IMPR_VALUE&` +
      `returnGeometry=true&` +
      `outSR=4326&` +
      `resultRecordCount=500&` +
      `f=geojson`;

    console.log('Querying HCAD API:', arcgisQuery);

    const response = await fetch(arcgisQuery);
    
    if (!response.ok) {
      throw new Error(`HCAD API error: ${response.statusText}`);
    }

    const geojson = await response.json();
    
    console.log(`Fetched ${geojson.features?.length || 0} parcels`);

    return new Response(JSON.stringify(geojson), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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
