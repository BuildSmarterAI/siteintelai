import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Tier configuration mapping Stripe product IDs to tier details
const TIER_CONFIG: Record<string, {
  name: string;
  reports_per_month: number;
  active_parcel_limit: number;
  seat_limit: number;
  history_retention_days: number;
  can_generate_full_report: boolean; // Renamed from can_generate_lender_ready
  can_share_links: boolean;
  can_export_csv: boolean;
  can_use_api: boolean;
}> = {
  'prod_ThxdnusS5qmyPL': { // Starter
    name: 'Starter',
    reports_per_month: 5,
    active_parcel_limit: 10,
    seat_limit: 1,
    history_retention_days: 90,
    can_generate_full_report: false,
    can_share_links: false,
    can_export_csv: false,
    can_use_api: false,
  },
  'prod_ThxeNTJf0WkEMY': { // Professional
    name: 'Professional',
    reports_per_month: 20,
    active_parcel_limit: 50,
    seat_limit: 2,
    history_retention_days: 365,
    can_generate_full_report: true,
    can_share_links: true,
    can_export_csv: false,
    can_use_api: false,
  },
  'prod_Thxe2I0rLintQ5': { // Team
    name: 'Team',
    reports_per_month: 75,
    active_parcel_limit: 150,
    seat_limit: 5,
    history_retention_days: -1, // unlimited
    can_generate_full_report: true,
    can_share_links: true,
    can_export_csv: true,
    can_use_api: false,
  },
  'prod_ThxgIB1k6aP6XC': { // Enterprise
    name: 'Enterprise',
    reports_per_month: 250,
    active_parcel_limit: -1, // unlimited
    seat_limit: 25,
    history_retention_days: -1, // unlimited
    can_generate_full_report: true,
    can_share_links: true,
    can_export_csv: true,
    can_use_api: true,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    // Get local subscription data for usage info
    const { data: localSub } = await supabaseClient
      .from("user_subscriptions")
      .select(`
        *,
        tier:subscription_tiers(*)
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    // Get entitlements
    const { data: entitlements } = await supabaseClient
      .from("entitlements")
      .select("*")
      .eq("account_id", user.id)
      .single();

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        tier: "free",
        entitlements: {
          reports_monthly: 0,
          reports_used: 0,
          reports_remaining: 0,
          active_parcel_limit: 5,
          active_parcels_used: 0,
          seat_limit: 1,
          can_generate_full_report: false,
          can_share_links: false,
          can_export_csv: false,
          can_use_api: false,
          history_retention_days: 30,
        },
        purchased_credits: 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let productId: string | null = null;
    let subscriptionEnd: string | null = null;
    let tierConfig = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0]?.price?.product as string;
      tierConfig = TIER_CONFIG[productId] || null;
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        productId,
        tierName: tierConfig?.name,
        endDate: subscriptionEnd 
      });
    } else {
      logStep("No active Stripe subscription");
    }

    // Calculate usage from local subscription data
    const reportsUsed = localSub?.reports_used || 0;
    const reportsLimit = tierConfig?.reports_per_month || localSub?.tier?.reports_per_month || 0;
    const purchasedCredits = localSub?.purchased_credits || 0;
    const activeParcelsUsed = localSub?.active_parcels_used || 0;

    // Calculate remaining: base limit - used + purchased credits
    const reportsRemaining = Math.max(0, reportsLimit - Math.max(0, reportsUsed)) + purchasedCredits;

    // Check for grace period
    const graceUntil = entitlements?.grace_until ? new Date(entitlements.grace_until) : null;
    const isInGrace = graceUntil && graceUntil > new Date();

    const response = {
      subscribed: hasActiveSub,
      product_id: productId,
      subscription_end: subscriptionEnd,
      tier: tierConfig?.name || (hasActiveSub ? "unknown" : "free"),
      entitlements: {
        reports_monthly: reportsLimit,
        reports_used: Math.max(0, reportsUsed),
        reports_remaining: reportsRemaining,
        active_parcel_limit: tierConfig?.active_parcel_limit || entitlements?.active_parcel_limit || 5,
        active_parcels_used: activeParcelsUsed,
        seat_limit: tierConfig?.seat_limit || entitlements?.seat_limit || 1,
        can_generate_full_report: tierConfig?.can_generate_full_report || entitlements?.can_generate_full_report || false,
        can_share_links: tierConfig?.can_share_links || entitlements?.can_share_links || false,
        can_export_csv: tierConfig?.can_export_csv || entitlements?.can_export_csv || false,
        can_use_api: tierConfig?.can_use_api || entitlements?.can_use_api || false,
        history_retention_days: tierConfig?.history_retention_days || entitlements?.history_retention_days || 30,
      },
      purchased_credits: purchasedCredits,
      credit_expires_at: localSub?.credit_expires_at || null,
      grace_until: isInGrace ? entitlements?.grace_until : null,
      is_in_grace: isInGrace,
    };

    logStep("Returning subscription status", { 
      subscribed: response.subscribed, 
      tier: response.tier,
      reportsRemaining: response.entitlements.reports_remaining 
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});