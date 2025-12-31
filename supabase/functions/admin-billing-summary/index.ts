import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-BILLING-SUMMARY] ${step}${detailsStr}`);
};

// Tier limits configuration
const TIER_LIMITS: Record<string, {
  reports: number;
  active_parcels: number;
  seats: number;
}> = {
  starter: { reports: 5, active_parcels: 10, seats: 1 },
  professional: { reports: 20, active_parcels: 50, seats: 2 },
  team: { reports: 75, active_parcels: 150, seats: 5 },
  enterprise: { reports: 250, active_parcels: -1, seats: 25 },
  free: { reports: 0, active_parcels: 0, seats: 1 },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authentication required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Get account_id from profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("account_id")
      .eq("id", user.id)
      .single();

    const accountId = profile?.account_id || user.id;
    logStep("Account resolved", { accountId });

    // Get subscription info
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("account_id", accountId)
      .eq("status", "active")
      .single();

    // Get entitlements
    const { data: entitlements } = await supabaseAdmin
      .from("entitlements")
      .select("*")
      .eq("account_id", accountId)
      .single();

    // Get current month usage
    const now = new Date();
    const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const { data: usage } = await supabaseAdmin
      .from("usage_counters_monthly")
      .select("*")
      .eq("account_id", accountId)
      .eq("period_yyyymm", period)
      .single();

    // Determine tier and limits
    const tier = entitlements?.tier || subscription?.tier || "free";
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

    // Build response per spec
    const response = {
      tier,
      period: subscription ? {
        start: subscription.current_period_start,
        end: subscription.current_period_end,
      } : null,
      status: subscription?.status || (entitlements ? "active" : "none"),
      grace_until: entitlements?.grace_until || null,
      limits: {
        reports: entitlements?.included_reports_monthly || limits.reports,
        active_parcels: entitlements?.active_parcel_limit || limits.active_parcels,
        seats: entitlements?.seat_limit || limits.seats,
      },
      usage: {
        reports: usage?.reports_generated || 0,
        active_parcels_peak: usage?.active_parcels_peak || 0,
        seats_peak: usage?.seats_active_peak || 0,
        overage_credits_used: usage?.overage_credits_used || 0,
      },
      // Calculated warnings
      warnings: {
        reports_warning: limits.reports > 0 && (usage?.reports_generated || 0) >= limits.reports * 0.7,
        reports_critical: limits.reports > 0 && (usage?.reports_generated || 0) >= limits.reports * 0.9,
        parcels_warning: limits.active_parcels > 0 && (usage?.active_parcels_peak || 0) >= limits.active_parcels * 0.7,
        parcels_critical: limits.active_parcels > 0 && (usage?.active_parcels_peak || 0) >= limits.active_parcels * 0.9,
      },
      // Subscription details
      subscription: subscription ? {
        id: subscription.subscription_id,
        cancel_at_period_end: subscription.cancel_at_period_end,
      } : null,
    };

    logStep("Billing summary generated", { tier, status: response.status });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to get billing summary";
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
