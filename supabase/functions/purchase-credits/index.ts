import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PURCHASE-CREDITS] ${step}${detailsStr}`);
};

// Credit pack price IDs
const CREDIT_PACK_PRICES = {
  '5': 'price_1SkXm3AsWVx52wY3JUiL1pPF',  // 5 reports for $399
  '10': 'price_1SkXnGAsWVx52wY3Uz6wczPE', // 10 reports for $699
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { pack_size } = await req.json();
    if (!pack_size || !['5', '10'].includes(String(pack_size))) {
      throw new Error("Invalid pack_size. Must be '5' or '10'");
    }

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { email: user.email });

    // Check if user has an active subscription (required for credit packs)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: subscription } = await supabaseAdmin
      .from("user_subscriptions")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!subscription) {
      logStep("No active subscription - credit packs require subscription");
      return new Response(JSON.stringify({ 
        error: "Credit packs require an active subscription. Please subscribe first." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }
    logStep("Stripe customer lookup", { customerId: customerId || "new" });

    const priceId = CREDIT_PACK_PRICES[String(pack_size) as keyof typeof CREDIT_PACK_PRICES];
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/dashboard?credits=success`,
      cancel_url: `${req.headers.get("origin")}/dashboard?credits=canceled`,
      metadata: {
        user_id: user.id,
        pack_size: String(pack_size),
        type: "credit_pack",
      },
    });

    logStep("Checkout session created", { sessionId: session.id, packSize: pack_size });

    return new Response(JSON.stringify({ url: session.url }), {
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
