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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get user's subscription with tier info
    const { data: subscription } = await supabaseAdmin
      .from("user_subscriptions")
      .select(`
        *,
        tier:subscription_tiers(*)
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    // Get entitlements
    const { data: entitlements } = await supabaseAdmin
      .from("entitlements")
      .select("*")
      .eq("account_id", user.id)
      .single();

    if (!subscription) {
      logStep("No active subscription, returning free tier limits");
      return new Response(JSON.stringify({
        tier: "Free",
        reports: {
          monthly_limit: 0,
          used_this_period: 0,
          remaining: 0,
          purchased_credits: 0,
          purchased_expires_at: null,
        },
        parcels: {
          limit: 5,
          active: 0,
          remaining: 5,
        },
        capabilities: {
          lender_ready: false,
          share_links: false,
          csv_export: false,
          api_access: false,
        },
        has_subscription: false,
        quickchecks_unlimited: false,
        quickchecks_used: 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const tier = subscription.tier;
    const reportsLimit = tier?.reports_per_month || 0;
    const reportsUsed = Math.max(0, subscription.reports_used || 0);
    const purchasedCredits = subscription.purchased_credits || 0;
    const activeParcelsUsed = subscription.active_parcels_used || 0;
    const parcelLimit = tier?.active_parcel_limit || entitlements?.active_parcel_limit || 10;
    
    // Calculate remaining reports: base limit - used + purchased credits
    const baseRemaining = reportsLimit - reportsUsed;
    const reportsRemaining = Math.max(0, baseRemaining) + purchasedCredits;

    // Check if credits are expired
    let validPurchasedCredits = purchasedCredits;
    if (subscription.credit_expires_at) {
      const expiresAt = new Date(subscription.credit_expires_at);
      if (expiresAt < new Date()) {
        validPurchasedCredits = 0;
      }
    }

    logStep("Credits calculated", { 
      tier: tier?.name, 
      reportsLimit, 
      reportsUsed, 
      reportsRemaining,
      purchasedCredits: validPurchasedCredits,
      activeParcelsUsed,
      parcelLimit,
    });

    return new Response(JSON.stringify({
      tier: tier?.name || "Unknown",
      reports: {
        monthly_limit: reportsLimit,
        used_this_period: reportsUsed,
        remaining: Math.max(0, baseRemaining) + validPurchasedCredits,
        purchased_credits: validPurchasedCredits,
        purchased_expires_at: validPurchasedCredits > 0 ? subscription.credit_expires_at : null,
      },
      parcels: {
        limit: parcelLimit === -1 ? "unlimited" : parcelLimit,
        active: activeParcelsUsed,
        remaining: parcelLimit === -1 ? "unlimited" : Math.max(0, parcelLimit - activeParcelsUsed),
      },
      capabilities: {
        lender_ready: tier?.can_generate_lender_ready || entitlements?.can_generate_lender_ready || false,
        share_links: tier?.can_share_links || entitlements?.can_share_links || false,
        csv_export: tier?.can_export_csv || entitlements?.can_export_csv || false,
        api_access: tier?.api_access || entitlements?.can_use_api || false,
      },
      has_subscription: true,
      quickchecks_unlimited: tier?.quickchecks_unlimited || false,
      quickchecks_used: subscription.quickchecks_used || 0,
      period_end: subscription.period_end,
      grace_until: entitlements?.grace_until || null,
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
