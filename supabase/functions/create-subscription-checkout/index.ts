import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// ⚠️ SECURITY WARNING: NEVER log STRIPE_SECRET_KEY or include it in error messages
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION-CHECKOUT] ${step}${detailsStr}`);
};

// Price IDs for subscription tiers (test mode / live mode)
const PRICE_IDS: Record<string, { test: string; live: string }> = {
  starter_monthly: { test: "price_1SkGR5AsWVx52wY3xkptFAMn", live: "price_1SkGR5AsWVx52wY3xkptFAMn" },
  starter_annual: { test: "price_1SkGRDAsWVx52wY3Q8pBQ4hT", live: "price_1SkGRDAsWVx52wY3Q8pBQ4hT" },
  professional_monthly: { test: "price_1SkGSRAsWVx52wY3mFTAWK3W", live: "price_1SkGSRAsWVx52wY3mFTAWK3W" },
  professional_annual: { test: "price_1SkGScAsWVx52wY3WUDkdXLK", live: "price_1SkGScAsWVx52wY3WUDkdXLK" },
  team_monthly: { test: "price_1SkGTpAsWVx52wY3yyxLb1hh", live: "price_1SkGTpAsWVx52wY3yyxLb1hh" },
  team_annual: { test: "price_1SkGTzAsWVx52wY3I1ULhfuT", live: "price_1SkGTzAsWVx52wY3I1ULhfuT" },
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

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { tier, billing_cycle = "monthly" } = body;
    logStep("Request received", { tier, billing_cycle });

    if (!tier || !["starter", "professional", "team"].includes(tier)) {
      throw new Error("Invalid tier. Must be one of: starter, professional, team");
    }

    // Get authenticated user (required for subscriptions)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authentication required for subscription checkout");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    const user = userData.user;
    logStep("Authenticated user", { email: user.email, userId: user.id });

    // Get or lookup account_id from profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("account_id")
      .eq("id", user.id)
      .single();
    
    const accountId = profile?.account_id || user.id;
    logStep("Account resolved", { accountId });

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Check if a Stripe customer record exists for this email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    }

    // Determine price ID
    const isTestMode = stripeKey.startsWith("sk_test");
    const priceKey = `${tier}_${billing_cycle}` as keyof typeof PRICE_IDS;
    const priceConfig = PRICE_IDS[priceKey];
    
    if (!priceConfig) {
      throw new Error(`Invalid tier/billing combination: ${priceKey}`);
    }

    const priceId = isTestMode ? priceConfig.test : priceConfig.live;
    logStep("Selected price", { priceKey, priceId, isTestMode });

    // Build metadata
    const sessionMetadata: Record<string, string> = {
      account_id: accountId,
      purchase_type: "subscription",
      user_id: user.id,
      tier,
      billing_cycle,
    };

    const subscriptionMetadata: Record<string, string> = {
      account_id: accountId,
      purchase_type: "subscription",
    };

    // Generate idempotency key
    const idempotencyKey = `subscription_${user.email}_${tier}_${billing_cycle}_${Date.now()}`;

    const origin = req.headers.get("origin") || "https://siteintel.io";
    const successUrl = `${origin}/onboarding?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/pricing?canceled=1`;

    logStep("Creating checkout session", {
      customerId,
      priceId,
      successUrl,
      cancelUrl,
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      metadata: sessionMetadata,
      subscription_data: {
        metadata: subscriptionMetadata,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      // Stripe Tax: automatic tax calculation
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      customer_update: customerId ? { address: 'auto', name: 'auto' } : undefined,
    }, {
      idempotencyKey,
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Subscription checkout failed";
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
