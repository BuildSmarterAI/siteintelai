import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { geometry, name, application_id } = await req.json();

    // Validate geometry structure
    if (!geometry || geometry.type !== 'Polygon' || !geometry.coordinates) {
      return new Response(JSON.stringify({ error: 'Invalid geometry format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate polygon has at least 3 vertices (4 including closing point)
    if (!geometry.coordinates[0] || geometry.coordinates[0].length < 4) {
      return new Response(JSON.stringify({ error: 'Polygon must have at least 3 vertices' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📐 Saving drawn parcel:', {
      user_id: user.id,
      name,
      application_id,
      vertices: geometry.coordinates[0].length,
    });

    // Convert GeoJSON to PostGIS geometry and calculate acreage
    const { data: parcelData, error: insertError } = await supabase.rpc('save_drawn_parcel_with_acreage', {
      p_user_id: user.id,
      p_name: name,
      p_geometry: JSON.stringify(geometry),
      p_application_id: application_id,
    });

    if (insertError) {
      console.error('❌ Failed to save parcel:', insertError);
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Parcel saved successfully:', parcelData);

    return new Response(JSON.stringify(parcelData), {
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
