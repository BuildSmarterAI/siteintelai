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

    // Layer URLs per BuildSmarter™ research doc (Section 2.1)
    const LAYER_URLS = [
      {
        url: 'https://gis.hcad.org/arcgis/rest/services/RealEstate/MapServer/7/query',
        name: 'Unified Parcels (Layer 7 - HCAD+FBCAD+MCAD)',
        fields: 'OBJECTID,LOWPARCELID,owner_name_1,acreage_1,SITUS_ADDRESS,site_county'
      },
      {
        url: 'https://gis.hcad.org/arcgis/rest/services/public/CAMA/MapServer/4/query',
        name: 'HCAD CAMA (Layer 4 - Fallback)',
        fields: 'OBJECTID,ACCOUNT,OWNER_NAME,ACREAGE,SITUS_ADDRESS,LAND_VALUE,IMPR_VALUE'
      }
    ];

    // If searching by parcel ID, try Layer 7 first with fallback
    if (parcelId) {
      for (const layer of LAYER_URLS) {
        try {
          const whereClause = layer.url.includes('Layer/7') 
            ? `LOWPARCELID='${parcelId}'` 
            : `ACCOUNT='${parcelId}'`;
          
          const parcelQuery = `${layer.url}?` +
            `where=${whereClause}&` +
            `outFields=${layer.fields}&` +
            `returnGeometry=true&` +
            `outSR=4326&` +
            `f=geojson`;
          
          console.log(`Trying ${layer.name}:`, parcelQuery);
          const response = await fetch(parcelQuery);
          
          if (!response.ok) {
            console.warn(`${layer.name} failed with ${response.status}`);
            continue;
          }
          
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            console.log(`✅ Found parcel in ${layer.name}`);
            return new Response(JSON.stringify(data), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } catch (err) {
          console.warn(`${layer.name} error:`, err);
          continue;
        }
      }
      
      // No results from any layer
      return new Response(JSON.stringify({ type: 'FeatureCollection', features: [] }), {
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
    
    // Try Layer 7 (Unified) first, fallback to Layer 4 (CAMA)
    for (const layer of LAYER_URLS) {
      try {
        const arcgisQuery = `${layer.url}?` +
          `geometry=${bboxGeometry}&` +
          `geometryType=esriGeometryEnvelope&` +
          `spatialRel=esriSpatialRelIntersects&` +
          `outFields=${layer.fields}&` +
          `returnGeometry=true&` +
          `outSR=4326&` +
          `resultRecordCount=500&` +
          `f=geojson`;

        console.log(`Querying ${layer.name}:`, arcgisQuery);

        const response = await fetch(arcgisQuery);
        
        if (!response.ok) {
          console.warn(`${layer.name} returned ${response.status}`);
          continue;
        }

        const geojson = await response.json();
        
        console.log(`✅ Fetched ${geojson.features?.length || 0} parcels from ${layer.name}`);

        return new Response(JSON.stringify(geojson), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        console.warn(`${layer.name} error:`, err);
        continue;
      }
    }
    
    // If both layers fail, return empty FeatureCollection
    console.error('All HCAD layers failed');
    return new Response(JSON.stringify({ type: 'FeatureCollection', features: [] }), {
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
