import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// County endpoint catalog
const ENDPOINT_CATALOG: Record<string, any> = {
  "Galveston County": {
    parcel_url: "https://www1.cityofwebster.com/arcgis/rest/services/Landbase/CountyGalveston/MapServer/0/query",
    zoning_url: "https://gis.galvestontx.gov/server/rest/services/Planning/Zoning/MapServer/0/query",
    parcel_id_field: "PARCEL_ID",
    owner_field: "OWNER",
    acreage_field: "ACRES",
    zoning_field: "ZONE",
    overlay_field: "OVERLAY"
  },
  "Harris County": {
    parcel_url: "https://maps.hcad.org/arcgis/rest/services/Parcels/MapServer/0/query",
    zoning_url: "https://gis.houstontx.gov/arcgis/rest/services/Zoning/MapServer/0/query",
    parcel_id_field: "ACCOUNT",
    owner_field: "OWNER_NAME",
    acreage_field: "ACREAGE",
    zoning_field: "ZONING",
    overlay_field: "OVERLAY_DISTRICT"
  }
};

const FEMA_NFHL_URL = "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { application_id, address } = await req.json();

    console.log('Enriching application:', { application_id, address });

    // application_id is optional - if not provided, we'll just return the data without saving

    const dataFlags: string[] = [];
    const enrichedData: any = {};

    let geoLat: number | null = null;
    let geoLng: number | null = null;
    let countyName: string | null = null;

    // Step 1: Geocode the address
    try {
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleApiKey}`;
      const geoResp = await fetch(geoUrl);
      const geoData = await geoResp.json();

      if (geoData?.results?.[0]) {
        const result = geoData.results[0];
        geoLat = result.geometry.location.lat;
        geoLng = result.geometry.location.lng;
        enrichedData.geo_lat = geoLat;
        enrichedData.geo_lng = geoLng;
        enrichedData.situs_address = result.formatted_address;

        // Extract county (administrative_area_level_2)
        const countyComponent = result.address_components?.find((c: any) =>
          c.types.includes('administrative_area_level_2')
        );
        if (countyComponent) {
          countyName = countyComponent.long_name;
          enrichedData.administrative_area_level_2 = countyName;
        }
        
        console.log('Geocoding successful:', { geoLat, geoLng, countyName });
      } else {
        console.log('No geocoding results found');
        dataFlags.push('geocoding_failed');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      dataFlags.push('geocoding_failed');
    }

    // If geocoding failed, return error
    if (!geoLat || !geoLng || !countyName) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unable to geocode address'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Check if county has endpoints
    const endpoints = ENDPOINT_CATALOG[countyName];
    if (!endpoints) {
      console.log(`No endpoints configured for county: ${countyName}`);
      return new Response(JSON.stringify({
        success: false,
        error: `No endpoint configured for ${countyName}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Query parcel data
    try {
      const parcelParams = new URLSearchParams({
        geometry: `${geoLng},${geoLat}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: '*',
        returnGeometry: 'false',
        f: 'json'
      });

      const parcelResp = await fetch(`${endpoints.parcel_url}?${parcelParams}`);
      const parcelData = await parcelResp.json();

      if (parcelData?.features?.[0]) {
        const attrs = parcelData.features[0].attributes;
        enrichedData.parcel_id = attrs[endpoints.parcel_id_field];
        enrichedData.parcel_owner = attrs[endpoints.owner_field];
        enrichedData.acreage_cad = attrs[endpoints.acreage_field];
        console.log('Parcel data found:', enrichedData);
      } else {
        dataFlags.push('parcel_not_found');
        console.log('No parcel data found');
      }
    } catch (error) {
      console.error('Parcel query error:', error);
      dataFlags.push('parcel_query_failed');
    }

    // Step 4: Query zoning data
    try {
      const zoningParams = new URLSearchParams({
        geometry: `${geoLng},${geoLat}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: '*',
        returnGeometry: 'false',
        f: 'json'
      });

      const zoningResp = await fetch(`${endpoints.zoning_url}?${zoningParams}`);
      const zoningData = await zoningResp.json();

      if (zoningData?.features?.[0]) {
        const attrs = zoningData.features[0].attributes;
        enrichedData.zoning_code = attrs[endpoints.zoning_field];
        enrichedData.overlay_district = attrs[endpoints.overlay_field];
        console.log('Zoning data found:', enrichedData);
      } else {
        dataFlags.push('zoning_not_found');
        console.log('No zoning data found');
      }
    } catch (error) {
      console.error('Zoning query error:', error);
      dataFlags.push('zoning_query_failed');
    }

    // Step 5: Query FEMA flood data
    try {
      const femaParams = new URLSearchParams({
        geometry: `${geoLng},${geoLat}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: 'FLD_ZONE,STATIC_BFE',
        returnGeometry: 'false',
        f: 'json'
      });

      const femaResp = await fetch(`${FEMA_NFHL_URL}?${femaParams}`);
      const femaData = await femaResp.json();

      if (femaData?.features?.[0]) {
        const attrs = femaData.features[0].attributes;
        enrichedData.floodplain_zone = attrs.FLD_ZONE;
        enrichedData.base_flood_elevation = attrs.STATIC_BFE;
        console.log('FEMA data found:', enrichedData);
      } else {
        dataFlags.push('fema_not_found');
        console.log('No FEMA flood data found');
      }
    } catch (error) {
      console.error('FEMA query error:', error);
      dataFlags.push('fema_query_failed');
    }

    // Step 6: Save to database if application_id provided
    if (application_id) {
      const updateData = {
        geo_lat: enrichedData.geo_lat,
        geo_lng: enrichedData.geo_lng,
        situs_address: enrichedData.situs_address,
        county: enrichedData.administrative_area_level_2,
        parcel_id_apn: enrichedData.parcel_id,
        parcel_owner: enrichedData.parcel_owner,
        acreage_cad: enrichedData.acreage_cad,
        zoning_code: enrichedData.zoning_code,
        overlay_district: enrichedData.overlay_district,
        floodplain: enrichedData.floodplain_zone,
        base_flood_elevation: enrichedData.base_flood_elevation,
        data_flags: dataFlags
      };

      const { error: updateError } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', application_id);

      if (updateError) {
        console.error('Database update error:', updateError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Failed to update application',
          details: updateError.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log('Enrichment saved to database');
    }

    // Step 7: Return success response
    return new Response(JSON.stringify({
      success: true,
      county: countyName,
      data: enrichedData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enrich-feasibility function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
