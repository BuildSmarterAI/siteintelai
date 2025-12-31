import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Tier configuration mapping Stripe product IDs to tier details
const TIER_CONFIG: Record<string, {
  name: string;
  reports_per_month: number;
  active_parcel_limit: number;
  seat_limit: number;
  history_retention_days: number;
  can_generate_lender_ready: boolean;
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
    can_generate_lender_ready: false,
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
    can_generate_lender_ready: true,
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
    can_generate_lender_ready: true,
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
    can_generate_lender_ready: true,
    can_share_links: true,
    can_export_csv: true,
    can_use_api: true,
  },
};

// Credit pack configuration
const CREDIT_PACKS: Record<string, number> = {
  'price_1SkXm3AsWVx52wY3JUiL1pPF': 5,  // 5 Report Pack
  'price_1SkXnGAsWVx52wY3Uz6wczPE': 10, // 10 Report Pack
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

    // Idempotency check - log event and skip if already processed
    const { data: existingEvent } = await supabaseAdmin
      .from("billing_events_log")
      .select("id")
      .eq("stripe_event_id", event.id)
      .single();

    if (existingEvent) {
      logStep("Event already processed, skipping", { eventId: event.id });
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Log event for audit trail
    const { data: eventLog, error: logError } = await supabaseAdmin
      .from("billing_events_log")
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        payload: event.data.object,
        status: "processing",
      })
      .select()
      .single();

    if (logError) {
      logStep("Warning: Could not log event", { error: logError.message });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { 
          sessionId: session.id, 
          customerId: session.customer,
          customerEmail: session.customer_email,
          mode: session.mode,
          metadata: session.metadata 
        });

        const applicationId = session.metadata?.application_id;
        
        if (!session.customer_email) {
          logStep("No customer email in session");
          break;
        }

        // Update application payment status if we have an application_id
        if (applicationId) {
          const { error: appUpdateError } = await supabaseAdmin
            .from("applications")
            .update({ 
              payment_status: "paid",
              stripe_customer_email: session.customer_email,
            })
            .eq("id", applicationId);

          if (appUpdateError) {
            logStep("Failed to update application payment status", { error: appUpdateError.message });
          } else {
            logStep("Updated application payment status to paid", { applicationId });
          }
        }

        // Find user by email
        const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
        const user = userData?.users?.find(u => u.email === session.customer_email);

        if (!user) {
          logStep("User not found for email - payment-first flow, will link later", { email: session.customer_email });
          break;
        }

        // Update profile with stripe_customer_id
        if (session.customer) {
          await supabaseAdmin
            .from("profiles")
            .update({ stripe_customer_id: session.customer as string })
            .eq("id", user.id);
        }

        // Link application to user if applicable
        if (applicationId) {
          const { error: linkError } = await supabaseAdmin
            .from("applications")
            .update({ user_id: user.id })
            .eq("id", applicationId)
            .is("user_id", null);

          if (!linkError) {
            logStep("Linked application to existing user", { applicationId, userId: user.id });
          }
        }

        // Get receipt URL for one-time payments
        let receiptUrl: string | null = null;
        if (session.mode === "payment" && session.payment_intent) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string, {
              expand: ['charges'],
            });
            const charges = paymentIntent.charges?.data;
            if (charges && charges.length > 0) {
              receiptUrl = charges[0].receipt_url || null;
            }
          } catch (receiptError) {
            logStep("Warning: Could not retrieve receipt URL");
          }
        }

        const taxAmountCents = session.total_details?.amount_tax || null;

        // Check if this is a credit pack purchase
        const lineItems = session.line_items?.data || [];
        let isCreditPack = false;
        let creditAmount = 0;

        for (const item of lineItems) {
          const priceId = item.price?.id;
          if (priceId && CREDIT_PACKS[priceId]) {
            isCreditPack = true;
            creditAmount = CREDIT_PACKS[priceId] * (item.quantity || 1);
            break;
          }
        }

        if (isCreditPack) {
          // Handle credit pack purchase
          logStep("Credit pack purchase detected", { creditAmount });
          
          const { data: existingSub } = await supabaseAdmin
            .from("user_subscriptions")
            .select("id, purchased_credits, credit_expires_at")
            .eq("user_id", user.id)
            .eq("status", "active")
            .single();

          if (existingSub) {
            const newCredits = (existingSub.purchased_credits || 0) + creditAmount;
            const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
            
            await supabaseAdmin
              .from("user_subscriptions")
              .update({ 
                purchased_credits: newCredits,
                credit_expires_at: expiresAt,
              })
              .eq("id", existingSub.id);
            
            logStep("Added credit pack to existing subscription", { newCredits, expiresAt });
          }

          // Record payment
          await supabaseAdmin.from("payment_history").insert({
            user_id: user.id,
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
            amount_cents: session.amount_total || 0,
            tax_amount_cents: taxAmountCents,
            currency: session.currency || "usd",
            status: "completed",
            payment_type: "credit_pack",
            product_name: `SiteIntel Credit Pack (${creditAmount} Reports)`,
            receipt_url: receiptUrl,
          });
          break;
        }

        // Determine payment type and product name
        const paymentType = session.mode === "subscription" ? "subscription" : "one_time";
        let productName = "Site Feasibility Intelligence™";

        // Handle subscription creation/update
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const productId = subscription.items.data[0]?.price?.product as string;
          const tierConfig = TIER_CONFIG[productId];
          
          productName = tierConfig ? `SiteIntel ${tierConfig.name}` : "SiteIntel Subscription";
          
          // Get tier from database
          const { data: tier } = await supabaseAdmin
            .from("subscription_tiers")
            .select("id")
            .eq("stripe_product_id", productId)
            .single();

          if (tier) {
            // Upsert subscription
            await supabaseAdmin.from("user_subscriptions").upsert({
              user_id: user.id,
              tier_id: tier.id,
              stripe_subscription_id: subscription.id,
              stripe_product_id: productId,
              status: "active",
              period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              reports_used: 0,
              quickchecks_used: 0,
              active_parcels_used: 0,
            }, { onConflict: "user_id" });

            // Sync entitlements
            if (tierConfig) {
              await supabaseAdmin.from("entitlements").upsert({
                account_id: user.id,
                tier: tierConfig.name.toLowerCase(),
                included_reports_monthly: tierConfig.reports_per_month,
                active_parcel_limit: tierConfig.active_parcel_limit,
                seat_limit: tierConfig.seat_limit,
                history_retention_days: tierConfig.history_retention_days,
                can_generate_lender_ready: tierConfig.can_generate_lender_ready,
                can_share_links: tierConfig.can_share_links,
                can_export_csv: tierConfig.can_export_csv,
                can_use_api: tierConfig.can_use_api,
                grace_until: null,
              }, { onConflict: "account_id" });
            }

            logStep("Subscription and entitlements synced", { productId, tierName: tierConfig?.name });
          }
        } else if (session.mode === "payment") {
          // One-time report purchase - credit user with 1 report
          const { data: payPerUseTier } = await supabaseAdmin
            .from("subscription_tiers")
            .select("id")
            .eq("name", "Pay-Per-Use")
            .single();

          if (payPerUseTier) {
            const { data: existingSub } = await supabaseAdmin
              .from("user_subscriptions")
              .select("id, reports_used")
              .eq("user_id", user.id)
              .eq("status", "active")
              .single();

            if (existingSub) {
              const newReportsUsed = (existingSub.reports_used || 0) - 1;
              await supabaseAdmin
                .from("user_subscriptions")
                .update({ reports_used: newReportsUsed })
                .eq("id", existingSub.id);
              logStep("Added 1 report credit to existing subscription");
            } else {
              await supabaseAdmin.from("user_subscriptions").insert({
                user_id: user.id,
                tier_id: payPerUseTier.id,
                status: "active",
                period_start: new Date().toISOString(),
                period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                reports_used: -1,
                quickchecks_used: 0,
              });
              logStep("Created pay-per-use subscription with 1 report credit");
            }
          }
        }

        // Record payment
        await supabaseAdmin.from("payment_history").insert({
          user_id: user.id,
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          amount_cents: session.amount_total || 0,
          tax_amount_cents: taxAmountCents,
          currency: session.currency || "usd",
          status: "completed",
          payment_type: paymentType,
          product_name: productName,
          receipt_url: receiptUrl,
        });

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
            // Get product ID from subscription
            let productName = "SiteIntel Subscription";
            if (invoice.subscription) {
              const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
              const productId = subscription.items.data[0]?.price?.product as string;
              const tierConfig = TIER_CONFIG[productId];
              if (tierConfig) {
                productName = `SiteIntel ${tierConfig.name}`;
              }
            }

            await supabaseAdmin.from("payment_history").insert({
              user_id: user.id,
              stripe_payment_intent_id: invoice.payment_intent as string,
              amount_cents: invoice.amount_paid,
              currency: invoice.currency,
              status: "completed",
              payment_type: "subscription",
              product_name: productName,
              receipt_url: invoice.hosted_invoice_url,
            });

            // Reset monthly usage counters and record new period
            await supabaseAdmin
              .from("user_subscriptions")
              .update({ reports_used: 0, quickchecks_used: 0 })
              .eq("user_id", user.id);

            // Record usage in monthly tracking
            const period = new Date().toISOString().slice(0, 7).replace('-', '');
            await supabaseAdmin.from("usage_counters_monthly").upsert({
              account_id: user.id,
              period_yyyymm: period,
              reports_generated: 0,
              active_parcels_peak: 0,
              seats_active_peak: 0,
              overage_credits_used: 0,
            }, { onConflict: "account_id,period_yyyymm" });

            logStep("Monthly usage reset for new billing period");
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice payment failed", { invoiceId: invoice.id, customerId: invoice.customer });

        if (invoice.customer_email) {
          const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
          const user = userData?.users?.find(u => u.email === invoice.customer_email);

          if (user) {
            // Set grace period - 7 days from now
            const graceUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            
            await supabaseAdmin
              .from("user_subscriptions")
              .update({ status: "past_due" })
              .eq("user_id", user.id);

            await supabaseAdmin
              .from("entitlements")
              .update({ grace_until: graceUntil })
              .eq("account_id", user.id);

            logStep("Set grace period for failed payment", { graceUntil, userId: user.id });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { subscriptionId: subscription.id, status: subscription.status });

        const productId = subscription.items.data[0]?.price?.product as string;
        const tierConfig = TIER_CONFIG[productId];

        const { data: subData } = await supabaseAdmin
          .from("user_subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (subData) {
          // Update subscription status
          await supabaseAdmin
            .from("user_subscriptions")
            .update({
              status: subscription.status === "active" ? "active" : subscription.status === "past_due" ? "past_due" : "inactive",
              stripe_product_id: productId,
              period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);

          // Sync entitlements based on subscription status
          if (tierConfig && subscription.status === "active") {
            await supabaseAdmin.from("entitlements").upsert({
              account_id: subData.user_id,
              tier: tierConfig.name.toLowerCase(),
              included_reports_monthly: tierConfig.reports_per_month,
              active_parcel_limit: tierConfig.active_parcel_limit,
              seat_limit: tierConfig.seat_limit,
              history_retention_days: tierConfig.history_retention_days,
              can_generate_lender_ready: tierConfig.can_generate_lender_ready,
              can_share_links: tierConfig.can_share_links,
              can_export_csv: tierConfig.can_export_csv,
              can_use_api: tierConfig.can_use_api,
              grace_until: null,
            }, { onConflict: "account_id" });
          } else if (subscription.status === "past_due") {
            // Set grace period
            const graceUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            await supabaseAdmin
              .from("entitlements")
              .update({ grace_until: graceUntil })
              .eq("account_id", subData.user_id);
          }

          logStep("Subscription and entitlements updated", { status: subscription.status, tier: tierConfig?.name });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        const { data: subData } = await supabaseAdmin
          .from("user_subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        await supabaseAdmin
          .from("user_subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", subscription.id);

        // Downgrade entitlements to free tier
        if (subData) {
          await supabaseAdmin.from("entitlements").upsert({
            account_id: subData.user_id,
            tier: "free",
            included_reports_monthly: 0,
            active_parcel_limit: 5,
            seat_limit: 1,
            history_retention_days: 30,
            can_generate_lender_ready: false,
            can_share_links: false,
            can_export_csv: false,
            can_use_api: false,
            grace_until: null,
          }, { onConflict: "account_id" });

          logStep("Entitlements downgraded to free tier");
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    // Mark event as processed
    if (eventLog) {
      await supabaseAdmin
        .from("billing_events_log")
        .update({ status: "ok", processed_at: new Date().toISOString() })
        .eq("id", eventLog.id);
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
