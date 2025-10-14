import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { parcel_id, name, geometry } = await req.json();

    if (!parcel_id || !name || !geometry) {
      throw new Error('Missing required fields: parcel_id, name, geometry');
    }

    // Validate geometry
    if (geometry.type !== 'Polygon' || !geometry.coordinates || geometry.coordinates[0].length < 4) {
      throw new Error('Invalid geometry: must be a Polygon with at least 3 vertices');
    }

    console.log('[UPDATE-PARCEL] Updating parcel:', { parcel_id, name, user_id: user.id });

    // Verify ownership via RLS - the select will fail if user doesn't own the parcel
    const { data: existingParcel, error: checkError } = await supabase
      .from('drawn_parcels')
      .select('user_id')
      .eq('id', parcel_id)
      .single();

    if (checkError || !existingParcel) {
      throw new Error('Parcel not found or access denied');
    }

    if (existingParcel.user_id !== user.id) {
      throw new Error('Unauthorized: You do not own this parcel');
    }

    // Call RPC to update parcel with recalculated acreage
    const { data: updatedParcel, error: updateError } = await supabase.rpc(
      'save_drawn_parcel_with_acreage',
      {
        p_user_id: user.id,
        p_application_id: null, // Keep existing application_id
        p_name: name,
        p_geometry: geometry,
        p_parcel_id: parcel_id, // Pass parcel_id to update existing
      }
    );

    if (updateError) {
      console.error('[UPDATE-PARCEL] RPC error:', updateError);
      throw updateError;
    }

    console.log('[UPDATE-PARCEL] Success:', updatedParcel);

    return new Response(
      JSON.stringify({
        success: true,
        parcel: updatedParcel,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[UPDATE-PARCEL] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
