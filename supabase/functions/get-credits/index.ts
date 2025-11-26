import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-CREDITS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get user's subscription
    const { data: subscription } = await supabaseAdmin
      .from("user_subscriptions")
      .select(`
        *,
        tier:subscription_tiers(*)
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!subscription) {
      // Free tier - no subscription
      logStep("No active subscription, returning free tier limits");
      return new Response(JSON.stringify({
        tier: "Free",
        reports_limit: 0,
        reports_used: 0,
        reports_remaining: 0,
        quickchecks_unlimited: false,
        quickchecks_used: 0,
        has_subscription: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const tier = subscription.tier;
    const reportsLimit = tier?.reports_per_month || 0;
    const reportsUsed = subscription.reports_used || 0;
    const reportsRemaining = Math.max(0, reportsLimit - reportsUsed);

    logStep("Credits calculated", { 
      tier: tier?.name, 
      reportsLimit, 
      reportsUsed, 
      reportsRemaining 
    });

    return new Response(JSON.stringify({
      tier: tier?.name || "Unknown",
      reports_limit: reportsLimit,
      reports_used: reportsUsed,
      reports_remaining: reportsRemaining,
      quickchecks_unlimited: tier?.quickchecks_unlimited || false,
      quickchecks_used: subscription.quickchecks_used || 0,
      has_subscription: true,
      period_end: subscription.period_end,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
