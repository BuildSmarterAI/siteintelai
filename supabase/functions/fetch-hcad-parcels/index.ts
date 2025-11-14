import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Validates parcel ID to prevent SQL injection
 * Harris County parcel IDs are typically alphanumeric with hyphens
 * Example formats: "0123456789", "012-345-678-9"
 */
function validateParcelId(parcelId: string): boolean {
  if (!parcelId || typeof parcelId !== 'string') return false;
  
  // Max length: 50 characters (generous for various formats)
  if (parcelId.length > 50) return false;
  
  // Only allow alphanumeric characters, hyphens, and spaces
  const validPattern = /^[A-Za-z0-9\s\-]+$/;
  if (!validPattern.test(parcelId)) return false;
  
  return true;
}

/**
 * Validates bbox array to prevent injection
 * bbox should be [minLng, minLat, maxLng, maxLat]
 */
function validateBbox(bbox: any): boolean {
  if (!Array.isArray(bbox) || bbox.length !== 4) return false;
  
  // All values must be valid numbers
  if (!bbox.every(val => typeof val === 'number' && !isNaN(val))) return false;
  
  const [minLng, minLat, maxLng, maxLat] = bbox;
  
  // Validate latitude range (-90 to 90)
  if (minLat < -90 || minLat > 90 || maxLat < -90 || maxLat > 90) return false;
  
  // Validate longitude range (-180 to 180)
  if (minLng < -180 || minLng > 180 || maxLng < -180 || maxLng > 180) return false;
  
  // Ensure min < max
  if (minLng >= maxLng || minLat >= maxLat) return false;
  
  return true;
}

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
      // 🛡️ SECURITY: Validate parcel ID to prevent SQL injection
      if (!validateParcelId(parcelId)) {
        console.warn('⚠️ Invalid parcel ID format:', parcelId);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid parcel ID format. Only alphanumeric characters, hyphens, and spaces are allowed.',
            type: 'FeatureCollection', 
            features: [] 
          }), 
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      try {
        // ✅ SAFE: Input validated above
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
    // 🛡️ SECURITY: Validate bbox to prevent injection
    if (!validateBbox(bbox)) {
      console.warn('⚠️ Invalid bbox format:', bbox);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid bbox format. Must be [minLng, minLat, maxLng, maxLat] with valid coordinates.',
          type: 'FeatureCollection', 
          features: [] 
        }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

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
