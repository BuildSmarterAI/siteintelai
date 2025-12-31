import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CONFIRM-SESSION] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { session_id } = body;

    if (!session_id) {
      throw new Error("session_id is required");
    }

    logStep("Confirming session", { session_id });

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'customer', 'subscription', 'payment_intent'],
    });

    logStep("Session retrieved", {
      id: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      mode: session.mode,
    });

    // Validate session is completed
    if (session.status !== "complete") {
      return new Response(JSON.stringify({
        confirmed: false,
        status: session.status,
        error: "Session is not complete",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Optional: validate account_id matches authenticated user
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    let userAccountId: string | undefined;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      
      if (userData.user) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("account_id")
          .eq("id", userData.user.id)
          .single();
        
        userAccountId = profile?.account_id || userData.user.id;
      }
    }

    // Extract session details
    const metadata = session.metadata || {};
    const lineItems = session.line_items?.data || [];
    
    // Get product info from line items
    const products = lineItems.map(item => ({
      name: item.description,
      quantity: item.quantity,
      amount_cents: item.amount_total,
    }));

    // Get receipt URL for one-time payments
    let receiptUrl: string | null = null;
    if (session.mode === "payment" && session.payment_intent) {
      const paymentIntent = session.payment_intent as Stripe.PaymentIntent;
      if (paymentIntent.charges?.data?.[0]?.receipt_url) {
        receiptUrl = paymentIntent.charges.data[0].receipt_url;
      }
    }

    // Build response
    const response = {
      confirmed: true,
      session: {
        id: session.id,
        mode: session.mode,
        status: session.status,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_email || (session.customer as Stripe.Customer)?.email,
      },
      metadata: {
        account_id: metadata.account_id,
        purchase_type: metadata.purchase_type,
        application_id: metadata.application_id,
      },
      products,
      receipt_url: receiptUrl,
      // Include subscription details if applicable
      subscription: session.subscription ? {
        id: (session.subscription as Stripe.Subscription).id,
        status: (session.subscription as Stripe.Subscription).status,
        current_period_end: (session.subscription as Stripe.Subscription).current_period_end,
      } : null,
      // Validation
      account_match: userAccountId ? userAccountId === metadata.account_id : null,
    };

    logStep("Session confirmed", { confirmed: true, mode: session.mode });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Session confirmation failed";
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ 
      confirmed: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
