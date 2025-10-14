import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { corsHeaders } from "../_shared/cors.ts";

console.log("check-feature-flag function started");

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { flag_name, user_id } = await req.json();
    
    if (!flag_name) {
      return new Response(
        JSON.stringify({ error: "flag_name is required" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Fetch the feature flag
    const { data: flag, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('flag_name', flag_name)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching feature flag:", error);
      return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // If flag doesn't exist, return disabled
    if (!flag) {
      return new Response(
        JSON.stringify({ enabled: false, reason: 'flag_not_found' }), 
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check if user is in whitelist (early access)
    if (user_id && flag.user_whitelist?.includes(user_id)) {
      return new Response(
        JSON.stringify({ enabled: true, reason: 'whitelist' }), 
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check global enable flag
    if (flag.enabled) {
      return new Response(
        JSON.stringify({ enabled: true, reason: 'global' }), 
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check rollout percentage (A/B testing)
    if (user_id && flag.rollout_percentage > 0) {
      // Hash user_id to get consistent assignment
      const userHash = parseInt(user_id.slice(0, 8), 16) % 100;
      const enabled = userHash < flag.rollout_percentage;
      return new Response(
        JSON.stringify({ enabled, reason: 'rollout', percentage: flag.rollout_percentage }), 
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Default: disabled
    return new Response(
      JSON.stringify({ enabled: false, reason: 'disabled' }), 
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err.message }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
