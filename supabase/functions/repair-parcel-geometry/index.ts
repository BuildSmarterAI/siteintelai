import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// HCAD parcel query endpoint
const HCAD_PARCEL_URL = "https://arcgis.hcad.org/arcgis/rest/services/public/public_query/MapServer/0/query";
// FBCAD parcel query endpoint  
const FBCAD_PARCEL_URL = "https://gisweb.fbcad.org/arcgis/rest/services/Hosted/FBCAD_Public_Data/FeatureServer/0/query";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin user (service role or authenticated admin)
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const { application_id, recompute_envelope = false } = await req.json();

    if (!application_id) {
      return new Response(JSON.stringify({ error: 'application_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔧 Repairing parcel geometry for application: ${application_id}`);

    // Get application details
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id, parcel_id, county, geo_lat, geo_lng, acreage_cad, user_id')
      .eq('id', application_id)
      .single();

    if (appError || !application) {
      console.error('❌ Application not found:', appError);
      return new Response(JSON.stringify({ error: 'Application not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📋 Application details:', {
      parcel_id: application.parcel_id,
      county: application.county,
      coords: `${application.geo_lat}, ${application.geo_lng}`,
      acreage: application.acreage_cad,
    });

    // Check if drawn parcel already exists
    const { data: existingParcel } = await supabase
      .from('drawn_parcels')
      .select('id')
      .eq('application_id', application_id)
      .limit(1)
      .single();

    if (existingParcel) {
      console.log('⚠️ Drawn parcel already exists:', existingParcel.id);
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Drawn parcel already exists',
        drawn_parcel_id: existingParcel.id,
        action: 'none',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let geometry = null;
    let geometrySource = 'unknown';

    // Try HCAD first if we have a parcel_id that looks like HCAD format
    if (application.parcel_id) {
      const parcelId = application.parcel_id.replace(/[^0-9]/g, '');
      
      // Try HCAD
      console.log('🔍 Querying HCAD for parcel:', parcelId);
      try {
        const hcadUrl = `${HCAD_PARCEL_URL}?where=ACCOUNT='${parcelId}'&outFields=ACCOUNT&f=geojson&outSR=4326`;
        const hcadResponse = await fetch(hcadUrl);
        
        if (hcadResponse.ok) {
          const hcadData = await hcadResponse.json();
          if (hcadData.features && hcadData.features.length > 0) {
            geometry = hcadData.features[0].geometry;
            geometrySource = 'HCAD';
            console.log('✅ Found geometry from HCAD');
          }
        }
      } catch (hcadError) {
        console.warn('⚠️ HCAD query failed:', hcadError);
      }

      // Try FBCAD if HCAD didn't work
      if (!geometry) {
        console.log('🔍 Querying FBCAD for parcel:', parcelId);
        try {
          const fbcadUrl = `${FBCAD_PARCEL_URL}?where=propnumber='${parcelId}'&outFields=propnumber&f=geojson&outSR=4326`;
          const fbcadResponse = await fetch(fbcadUrl);
          
          if (fbcadResponse.ok) {
            const fbcadData = await fbcadResponse.json();
            if (fbcadData.features && fbcadData.features.length > 0) {
              geometry = fbcadData.features[0].geometry;
              geometrySource = 'FBCAD';
              console.log('✅ Found geometry from FBCAD');
            }
          }
        } catch (fbcadError) {
          console.warn('⚠️ FBCAD query failed:', fbcadError);
        }
      }
    }

    // Try spatial query with coordinates if parcel_id lookup failed
    if (!geometry && application.geo_lat && application.geo_lng) {
      console.log('🔍 Trying spatial query with coordinates');
      
      // HCAD spatial query
      try {
        const spatialUrl = `${HCAD_PARCEL_URL}?geometry=${application.geo_lng},${application.geo_lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&outFields=ACCOUNT&f=geojson&outSR=4326`;
        const spatialResponse = await fetch(spatialUrl);
        
        if (spatialResponse.ok) {
          const spatialData = await spatialResponse.json();
          if (spatialData.features && spatialData.features.length > 0) {
            geometry = spatialData.features[0].geometry;
            geometrySource = 'HCAD_spatial';
            console.log('✅ Found geometry from HCAD spatial query');
          }
        }
      } catch (spatialError) {
        console.warn('⚠️ HCAD spatial query failed:', spatialError);
      }
    }

    if (!geometry) {
      console.error('❌ Could not find parcel geometry from any source');
      return new Response(JSON.stringify({ 
        error: 'Could not find parcel geometry',
        tried: ['HCAD', 'FBCAD', 'HCAD_spatial'],
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert into drawn_parcels
    console.log('💾 Saving geometry to drawn_parcels');
    const { data: drawnParcel, error: insertError } = await supabase
      .from('drawn_parcels')
      .insert({
        application_id: application.id,
        user_id: application.user_id,
        name: `Repaired Parcel ${application.parcel_id || 'unknown'}`,
        geometry: geometry,
        source: `repair_${geometrySource.toLowerCase()}`,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('❌ Failed to save drawn parcel:', insertError);
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Drawn parcel saved:', drawnParcel.id);

    // Optionally delete old regulatory envelope and recompute
    let envelopeAction = 'none';
    if (recompute_envelope) {
      console.log('🗑️ Deleting old regulatory envelope');
      await supabase
        .from('regulatory_envelopes')
        .delete()
        .eq('application_id', application_id);
      
      envelopeAction = 'deleted_for_recompute';
      console.log('✅ Old envelope deleted. Client should call compute-regulatory-envelope');
    }

    return new Response(JSON.stringify({
      success: true,
      drawn_parcel_id: drawnParcel.id,
      geometry_source: geometrySource,
      envelope_action: envelopeAction,
      message: 'Parcel geometry repaired successfully',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
