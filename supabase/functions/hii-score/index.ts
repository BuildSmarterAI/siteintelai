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

    const { lat, lon, radius_m, months_back } = await req.json();

    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: lat, lon' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log(`[hii-score] Calculating HII for lat=${lat}, lon=${lon}, radius=${radius_m || 1609}m`);

    // Call the fn_hii function
    const { data, error } = await supabase.rpc('fn_hii', {
      p_lat: parseFloat(lat),
      p_lon: parseFloat(lon),
      p_radius_m: radius_m ? parseInt(radius_m) : 1609,
      p_months_back: months_back ? parseInt(months_back) : 12,
    });

    if (error) {
      console.error('[hii-score] Error calling fn_hii:', error);
      throw error;
    }

    console.log('[hii-score] HII calculation successful');

    return new Response(
      JSON.stringify({ 
        success: true,
        data: data
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[hii-score] Error:', error);
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
