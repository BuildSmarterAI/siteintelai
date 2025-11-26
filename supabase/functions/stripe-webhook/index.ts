import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    logStep("ERROR: Missing signature or webhook secret");
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep("Event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { sessionId: session.id, customerId: session.customer });

        if (!session.customer_email) {
          logStep("No customer email in session");
          break;
        }

        // Find user by email
        const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
        const user = userData?.users?.find(u => u.email === session.customer_email);

        if (!user) {
          logStep("User not found for email", { email: session.customer_email });
          break;
        }

        // Update profile with stripe_customer_id
        if (session.customer) {
          await supabaseAdmin
            .from("profiles")
            .update({ stripe_customer_id: session.customer as string })
            .eq("id", user.id);
        }

        // Record payment
        const paymentType = session.mode === "subscription" ? "subscription" : "one_time";
        const productName = session.mode === "subscription" ? "SiteIntel Pro Subscription" : "SiteIntel Professional Report";
        
        await supabaseAdmin.from("payment_history").insert({
          user_id: user.id,
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          amount_cents: session.amount_total || 0,
          currency: session.currency || "usd",
          status: "completed",
          payment_type: paymentType,
          product_name: productName,
        });

        // Handle one-time report purchase - credit user with 1 report
        if (session.mode === "payment") {
          // Get Pay-Per-Use tier for one-time purchases
          const { data: payPerUseTier } = await supabaseAdmin
            .from("subscription_tiers")
            .select("id")
            .eq("name", "Pay-Per-Use")
            .single();

          if (payPerUseTier) {
            // Check if user has existing subscription
            const { data: existingSub } = await supabaseAdmin
              .from("user_subscriptions")
              .select("id, tier_id, reports_used")
              .eq("user_id", user.id)
              .eq("status", "active")
              .single();

            if (existingSub) {
              // User has active subscription - add 1 report credit by decreasing reports_used
              // Negative reports_used means purchased credits available
              const newReportsUsed = (existingSub.reports_used || 0) - 1;
              await supabaseAdmin
                .from("user_subscriptions")
                .update({ reports_used: newReportsUsed })
                .eq("id", existingSub.id);
              logStep("Added 1 report credit to existing subscription", { newReportsUsed });
            } else {
              // Create a pay-per-use subscription entry with 1 available report credit
              // reports_used = -1 means 1 credit available
              await supabaseAdmin.from("user_subscriptions").insert({
                user_id: user.id,
                tier_id: payPerUseTier.id,
                status: "active",
                period_start: new Date().toISOString(),
                period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year expiry
                reports_used: -1,
                quickchecks_used: 0,
              });
              logStep("Created pay-per-use subscription with 1 report credit");
            }
          }
        }

        // If subscription, create/update user_subscription
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          
          // Get or create tier
          const { data: tiers } = await supabaseAdmin
            .from("subscription_tiers")
            .select("id")
            .eq("name", "Pro")
            .single();

          if (tiers) {
            await supabaseAdmin.from("user_subscriptions").upsert({
              user_id: user.id,
              tier_id: tiers.id,
              stripe_subscription_id: subscription.id,
              status: "active",
              period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              reports_used: 0,
              quickchecks_used: 0,
            }, { onConflict: "user_id" });
          }
        }

        logStep("Payment recorded successfully");
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice paid", { invoiceId: invoice.id, customerId: invoice.customer });

        if (invoice.customer_email) {
          const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
          const user = userData?.users?.find(u => u.email === invoice.customer_email);

          if (user) {
            await supabaseAdmin.from("payment_history").insert({
              user_id: user.id,
              stripe_payment_intent_id: invoice.payment_intent as string,
              amount_cents: invoice.amount_paid,
              currency: invoice.currency,
              status: "completed",
              payment_type: "subscription",
              product_name: "SiteIntel Pro Subscription",
              receipt_url: invoice.hosted_invoice_url,
            });

            // Reset monthly usage counters
            await supabaseAdmin
              .from("user_subscriptions")
              .update({ reports_used: 0, quickchecks_used: 0 })
              .eq("user_id", user.id);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { subscriptionId: subscription.id });

        const { data: subData } = await supabaseAdmin
          .from("user_subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (subData) {
          await supabaseAdmin
            .from("user_subscriptions")
            .update({
              status: subscription.status === "active" ? "active" : "inactive",
              period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        await supabaseAdmin
          .from("user_subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
