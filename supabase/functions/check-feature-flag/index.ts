import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { flag_name, user_id } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch the feature flag
    const { data: flag, error: flagError } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('flag_name', flag_name)
      .single();

    if (flagError || !flag) {
      return new Response(
        JSON.stringify({ enabled: false, reason: 'not_found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is in whitelist (early access)
    if (flag.user_whitelist?.includes(user_id)) {
      console.log(`Feature ${flag_name} enabled for user ${user_id} via whitelist`);
      return new Response(
        JSON.stringify({ enabled: true, reason: 'whitelist' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check global enable flag
    if (flag.enabled) {
      console.log(`Feature ${flag_name} globally enabled`);
      return new Response(
        JSON.stringify({ enabled: true, reason: 'global' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rollout percentage (A/B testing)
    if (flag.rollout_percentage > 0) {
      // Hash user_id to get consistent but pseudo-random distribution
      const userHash = parseInt(user_id.slice(0, 8), 16) % 100;
      const enabled = userHash < flag.rollout_percentage;
      console.log(`Feature ${flag_name} rollout check: ${enabled} (${flag.rollout_percentage}%)`);
      return new Response(
        JSON.stringify({ enabled, reason: 'rollout', percentage: flag.rollout_percentage }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ enabled: false, reason: 'disabled' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking feature flag:', error);
    return new Response(
      JSON.stringify({ error: error.message, enabled: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
