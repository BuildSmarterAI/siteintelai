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
  console.log(`[CREATE-CHECKOUT-SESSION] ${step}${detailsStr}`);
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
    const { application_id, email: guestEmail } = body;
    logStep("Request received", { application_id, hasGuestEmail: !!guestEmail });

    // Try to get authenticated user (optional for payment-first flow)
    let userEmail: string | undefined;
    let userId: string | undefined;
    
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseAdmin.auth.getUser(token);
      if (data.user?.email) {
        userEmail = data.user.email;
        userId = data.user.id;
        logStep("Authenticated user", { email: userEmail, userId });
      }
    }

    // Use guest email if no authenticated user
    if (!userEmail && guestEmail) {
      userEmail = guestEmail;
      logStep("Using guest email", { email: guestEmail });
    }

    if (!userEmail) {
      throw new Error("Email is required - either authenticate or provide email in request");
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Check if a Stripe customer record exists for this email
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    }

    // Get or lookup account_id from profile if user is authenticated
    let accountId: string | undefined;
    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("account_id")
        .eq("id", userId)
        .single();
      accountId = profile?.account_id || userId;
    }

    // Build metadata for the session per billing spec
    const metadata: Record<string, string> = {
      purchase_type: "one_off",
      report_type: "standard",
      subscription_creditable: "true",
    };
    if (application_id) {
      metadata.application_id = application_id;
    }
    if (accountId) {
      metadata.account_id = accountId;
    }
    if (userId) {
      metadata.user_id = userId;
    }

    // Determine success URL based on whether user is authenticated
    const origin = req.headers.get("origin") || "https://siteintel.io";
    const successUrl = userId
      ? `${origin}/thank-you?session_id={CHECKOUT_SESSION_ID}&applicationId=${application_id || ''}&payment=success`
      : `${origin}/create-account?session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl = `${origin}/checkout?canceled=1${application_id ? `&application_id=${application_id}` : ''}`;

    // Generate idempotency key to prevent duplicate charges
    const idempotencyKey = `checkout_${userEmail}_${application_id || 'direct'}_${Date.now()}`;

    // Create a one-time payment session for AI Feasibility Report
    // Launch Pricing: $999 one-off report
    // Price ID: price_1SthhaAsWVx52wY39LblPmCG (test and live)
    const launchPriceId = "price_1SthhaAsWVx52wY39LblPmCG"; // $999 one-off

    // Use launch pricing, fallback to env override if set
    const priceId = Deno.env.get("STRIPE_PRICE_ID") || launchPriceId;

    logStep("Creating checkout session", {
      successUrl,
      cancelUrl,
      hasMetadata: Object.keys(metadata).length > 0,
      idempotencyKey,
      isTestMode,
      priceId,
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata,
      success_url: successUrl,
      cancel_url: cancelUrl,
      // One-off purchases should NOT allow promotion codes (per spec)
      allow_promotion_codes: false,
      // Stripe Tax: automatic tax calculation based on customer location
      automatic_tax: { enabled: true },
      // Collect customer tax IDs for B2B compliance (VAT, GST, etc.)
      tax_id_collection: { enabled: true },
      // Update customer address from checkout for future tax calculations
      customer_update: customerId ? { address: 'auto', name: 'auto' } : undefined,
    }, {
      idempotencyKey,
    });

    logStep("Checkout session created", { sessionId: session.id });

    // Update application with stripe_session_id if we have an application_id
    if (application_id) {
      const { error: updateError } = await supabaseAdmin
        .from("applications")
        .update({ 
          stripe_session_id: session.id,
          payment_status: "pending"
        })
        .eq("id", application_id);

      if (updateError) {
        logStep("Warning: Failed to update application with session ID", { error: updateError.message });
      } else {
        logStep("Updated application with session ID", { application_id });
      }
    }

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Payment processing failed";
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
