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

    const { parcel_id } = await req.json();

    if (!parcel_id) {
      throw new Error('Missing required field: parcel_id');
    }

    console.log('[DELETE-PARCEL] Deleting parcel:', { parcel_id, user_id: user.id });

    // Verify ownership before deletion - RLS will prevent deletion if not owner
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

    // Delete the parcel
    const { error: deleteError } = await supabase
      .from('drawn_parcels')
      .delete()
      .eq('id', parcel_id);

    if (deleteError) {
      console.error('[DELETE-PARCEL] Delete error:', deleteError);
      throw deleteError;
    }

    console.log('[DELETE-PARCEL] Success');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Parcel deleted successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[DELETE-PARCEL] Error:', error);
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
