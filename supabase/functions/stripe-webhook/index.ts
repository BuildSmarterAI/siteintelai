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
  tier: string;
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
    tier: 'starter',
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
    tier: 'professional',
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
    tier: 'team',
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
    tier: 'enterprise',
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

// One-off product price ID ($999)
const ONE_OFF_PRICE_ID = 'price_1Sj397AsWVx52wY3nQC9A5dZ';

// GHL webhook helper
async function sendGhlWebhook(eventType: string, payload: Record<string, any>) {
  const ghlWebhookUrl = Deno.env.get("GHL_WEBHOOK_URL");
  if (!ghlWebhookUrl) {
    logStep("GHL webhook URL not configured, skipping");
    return;
  }

  try {
    const response = await fetch(ghlWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: eventType,
        timestamp: new Date().toISOString(),
        ...payload,
      }),
    });
    logStep("GHL webhook sent", { eventType, status: response.status });
  } catch (error) {
    logStep("GHL webhook failed", { eventType, error: String(error) });
  }
}

// MRR calculation helper based on price interval
function calculateMrr(priceAmount: number, interval: string): number {
  if (interval === 'year') {
    return priceAmount / 12;
  }
  return priceAmount; // monthly is the base
}

// Record MRR event for analytics
async function recordMrrEvent(
  supabaseAdmin: ReturnType<typeof createClient>,
  accountId: string,
  eventType: 'new' | 'upgrade' | 'downgrade' | 'churn' | 'reactivation',
  deltaMrr: number,
  fromTier: string | null,
  toTier: string | null,
  stripeEventId: string
) {
  try {
    await supabaseAdmin.from("mrr_events").insert({
      account_id: accountId,
      event_type: eventType,
      delta_mrr: deltaMrr,
      from_tier: fromTier,
      to_tier: toTier,
      stripe_event_id: stripeEventId,
    });
    logStep("MRR event recorded", { eventType, deltaMrr, fromTier, toTier });
  } catch (error) {
    logStep("Failed to record MRR event", { error: String(error) });
  }
}

// Ensure account is in cohorts table
async function ensureCohort(
  supabaseAdmin: ReturnType<typeof createClient>,
  accountId: string,
  tier: string,
  mrr: number
) {
  try {
    const now = new Date();
    const cohortMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const { data: existing } = await supabaseAdmin
      .from("cohorts")
      .select("account_id")
      .eq("account_id", accountId)
      .single();
    
    if (!existing) {
      await supabaseAdmin.from("cohorts").insert({
        account_id: accountId,
        cohort_month_yyyymm: cohortMonth,
        initial_tier: tier,
        initial_mrr: mrr,
      });
      logStep("Cohort assigned", { accountId, cohortMonth, tier });
    }
  } catch (error) {
    logStep("Failed to ensure cohort", { error: String(error) });
  }
}

// Helper to get or create account for a user
async function getOrCreateAccount(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  email: string,
  stripeCustomerId: string | null,
  companyName?: string
): Promise<string> {
  // Check if user already has an account
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("account_id, company, full_name")
    .eq("id", userId)
    .single();

  if (profile?.account_id) {
    logStep("User already has account", { accountId: profile.account_id });
    return profile.account_id;
  }

  // Create new account
  const accountName = companyName || profile?.company || profile?.full_name || email;
  const { data: newAccount, error: accountError } = await supabaseAdmin
    .from("accounts")
    .insert({
      account_name: accountName,
      primary_email: email,
    })
    .select()
    .single();

  if (accountError || !newAccount) {
    throw new Error(`Failed to create account: ${accountError?.message}`);
  }

  // Link user to account
  await supabaseAdmin
    .from("profiles")
    .update({ account_id: newAccount.account_id })
    .eq("id", userId);

  // Create stripe_customer record if we have a customer ID
  if (stripeCustomerId) {
    await supabaseAdmin.from("stripe_customers").upsert({
      stripe_customer_id: stripeCustomerId,
      account_id: newAccount.account_id,
      billing_email: email,
    }, { onConflict: "stripe_customer_id" });
  }

  logStep("Created new account", { accountId: newAccount.account_id, accountName });
  return newAccount.account_id;
}

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
        let isOneOffPurchase = false;

        for (const item of lineItems) {
          const priceId = item.price?.id;
          if (priceId && CREDIT_PACKS[priceId]) {
            isCreditPack = true;
            creditAmount = CREDIT_PACKS[priceId] * (item.quantity || 1);
            break;
          }
          if (priceId === ONE_OFF_PRICE_ID) {
            isOneOffPurchase = true;
            break;
          }
        }

        if (isCreditPack) {
          // Handle credit pack purchase
          logStep("Credit pack purchase detected", { creditAmount });
          
          const accountId = await getOrCreateAccount(
            supabaseAdmin,
            user.id,
            user.email!,
            session.customer as string | null
          );

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

        // Handle $999 one-off purchase - DO NOT create subscription/entitlements
        if (isOneOffPurchase || (session.mode === "payment" && session.amount_total === 99900)) {
          logStep("One-off $999 purchase detected - recording payment only, no entitlements");
          
          // Record payment
          await supabaseAdmin.from("payment_history").insert({
            user_id: user.id,
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
            amount_cents: session.amount_total || 0,
            tax_amount_cents: taxAmountCents,
            currency: session.currency || "usd",
            status: "completed",
            payment_type: "one_time",
            product_name: "Site Feasibility Intelligence™ (One-Time)",
            receipt_url: receiptUrl,
          });

          // Send GHL event for one-off purchase
          await sendGhlWebhook("siteintel_one_off_paid", {
            email: user.email,
            user_id: user.id,
            amount_cents: session.amount_total,
            application_id: applicationId,
            subscription_creditable: true,
          });

          logStep("One-off payment recorded, GHL notified");
          break;
        }

        // Determine payment type and product name
        const paymentType = session.mode === "subscription" ? "subscription" : "one_time";
        let productName = "Site Feasibility Intelligence™";

        // Handle subscription creation/update
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const productId = subscription.items.data[0]?.price?.product as string;
          const priceId = subscription.items.data[0]?.price?.id as string;
          const tierConfig = TIER_CONFIG[productId];
          
          productName = tierConfig ? `SiteIntel ${tierConfig.name}` : "SiteIntel Subscription";
          
          // Create or get account for this user
          const accountId = await getOrCreateAccount(
            supabaseAdmin,
            user.id,
            user.email!,
            session.customer as string | null
          );

          // Create stripe_customer record
          if (session.customer) {
            await supabaseAdmin.from("stripe_customers").upsert({
              stripe_customer_id: session.customer as string,
              account_id: accountId,
              billing_email: user.email!,
            }, { onConflict: "stripe_customer_id" });
          }

          // Upsert to new account-based subscriptions table
          await supabaseAdmin.from("subscriptions").upsert({
            subscription_id: subscription.id,
            account_id: accountId,
            stripe_price_id: priceId,
            tier: tierConfig?.tier || 'starter',
            status: subscription.status === "active" ? "active" : subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            metadata: {
              product_id: productId,
              tier_name: tierConfig?.name,
            },
          }, { onConflict: "subscription_id" });

          // Sync entitlements to account
          if (tierConfig) {
            await supabaseAdmin.from("entitlements").upsert({
              account_id: accountId,
              tier: tierConfig.tier,
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

          // Also update legacy user_subscriptions for backwards compatibility
          const { data: tier } = await supabaseAdmin
            .from("subscription_tiers")
            .select("id")
            .eq("stripe_product_id", productId)
            .single();

          if (tier) {
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
          }

          // Send GHL event for subscription activation
          await sendGhlWebhook("siteintel_subscription_active", {
            email: user.email,
            user_id: user.id,
            account_id: accountId,
            tier: tierConfig?.tier,
            tier_name: tierConfig?.name,
            mrr_cents: subscription.items.data[0]?.price?.unit_amount || 0,
            subscription_id: subscription.id,
          });

          // === MRR ANALYTICS ===
          // Calculate MRR from subscription price
          const priceData = subscription.items.data[0]?.price;
          const priceAmount = (priceData?.unit_amount || 0) / 100; // Convert cents to dollars
          const interval = priceData?.recurring?.interval || 'month';
          const mrr = calculateMrr(priceAmount, interval);

          // Record new subscription MRR event
          await recordMrrEvent(
            supabaseAdmin,
            accountId,
            'new',
            mrr,
            null,
            tierConfig?.tier || 'starter',
            event.id
          );

          // Ensure account is in cohorts
          await ensureCohort(supabaseAdmin, accountId, tierConfig?.tier || 'starter', mrr);

          logStep("Subscription and entitlements synced", { productId, tierName: tierConfig?.name, accountId, mrr });
        } else if (session.mode === "payment") {
          // Generic one-time report purchase - credit user with 1 report
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
            // Get account for this user
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("account_id")
              .eq("id", user.id)
              .single();

            const accountId = profile?.account_id || user.id;

            // Get product ID from subscription
            let productName = "SiteIntel Subscription";
            if (invoice.subscription) {
              const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
              const productId = subscription.items.data[0]?.price?.product as string;
              const tierConfig = TIER_CONFIG[productId];
              if (tierConfig) {
                productName = `SiteIntel ${tierConfig.name}`;
              }

              // Update subscription status and clear grace period
              await supabaseAdmin
                .from("subscriptions")
                .update({ status: "active" })
                .eq("subscription_id", invoice.subscription);

              // Clear grace period on entitlements
              await supabaseAdmin
                .from("entitlements")
                .update({ grace_until: null })
                .eq("account_id", accountId);
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

            // Reset monthly usage counters
            await supabaseAdmin
              .from("user_subscriptions")
              .update({ reports_used: 0, quickchecks_used: 0 })
              .eq("user_id", user.id);

            // Record usage in monthly tracking using yyyymm format
            const now = new Date();
            const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
            await supabaseAdmin.from("usage_counters_monthly").upsert({
              account_id: accountId,
              period_yyyymm: period,
              reports_generated: 0,
              active_parcels_peak: 0,
              seats_active_peak: 0,
              overage_credits_used: 0,
            }, { onConflict: "account_id,period_yyyymm" });

            logStep("Monthly usage reset for new billing period", { accountId, period });
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
            // Get account for this user
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("account_id")
              .eq("id", user.id)
              .single();

            const accountId = profile?.account_id || user.id;

            // Set grace period - 7 days from now
            const graceUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            
            // Update legacy user_subscriptions
            await supabaseAdmin
              .from("user_subscriptions")
              .update({ status: "past_due" })
              .eq("user_id", user.id);

            // Update new subscriptions table
            if (invoice.subscription) {
              await supabaseAdmin
                .from("subscriptions")
                .update({ status: "past_due" })
                .eq("subscription_id", invoice.subscription);
            }

            // Set grace period on entitlements
            await supabaseAdmin
              .from("entitlements")
              .update({ grace_until: graceUntil })
              .eq("account_id", accountId);

            // Send GHL event for failed payment
            await sendGhlWebhook("siteintel_payment_failed", {
              email: user.email,
              user_id: user.id,
              account_id: accountId,
              grace_until: graceUntil,
              invoice_id: invoice.id,
              amount_due_cents: invoice.amount_due,
            });

            logStep("Set grace period for failed payment", { graceUntil, accountId });
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { subscriptionId: subscription.id, status: subscription.status });

        const productId = subscription.items.data[0]?.price?.product as string;
        const priceId = subscription.items.data[0]?.price?.id as string;
        const tierConfig = TIER_CONFIG[productId];

        // Find account via stripe_customers table
        const { data: stripeCustomer } = await supabaseAdmin
          .from("stripe_customers")
          .select("account_id")
          .eq("stripe_customer_id", subscription.customer as string)
          .single();

        let accountId = stripeCustomer?.account_id;

        // Fallback to legacy user_subscriptions lookup
        if (!accountId) {
          const { data: subData } = await supabaseAdmin
            .from("user_subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subscription.id)
            .single();

          if (subData) {
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("account_id")
              .eq("id", subData.user_id)
              .single();
            accountId = profile?.account_id || subData.user_id;
          }
        }

        if (accountId) {
          // Update new subscriptions table
          await supabaseAdmin.from("subscriptions").upsert({
            subscription_id: subscription.id,
            account_id: accountId,
            stripe_price_id: priceId,
            tier: tierConfig?.tier || 'starter',
            status: subscription.status === "active" ? "active" : 
                   subscription.status === "past_due" ? "past_due" : 
                   subscription.status === "canceled" ? "canceled" : subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            metadata: {
              product_id: productId,
              tier_name: tierConfig?.name,
            },
          }, { onConflict: "subscription_id" });

          // Sync entitlements based on subscription status
          if (tierConfig && subscription.status === "active") {
            await supabaseAdmin.from("entitlements").upsert({
              account_id: accountId,
              tier: tierConfig.tier,
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
              .eq("account_id", accountId);
          }

          // Update legacy user_subscriptions for backwards compatibility
          const { data: legacySub } = await supabaseAdmin
            .from("user_subscriptions")
            .select("id")
            .eq("stripe_subscription_id", subscription.id)
            .single();

          if (legacySub) {
            await supabaseAdmin
              .from("user_subscriptions")
              .update({
                status: subscription.status === "active" ? "active" : subscription.status === "past_due" ? "past_due" : "inactive",
                stripe_product_id: productId,
                period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              })
              .eq("stripe_subscription_id", subscription.id);
          }

          logStep("Subscription and entitlements updated", { status: subscription.status, tier: tierConfig?.tier, accountId });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        // Find account via stripe_customers table
        const { data: stripeCustomer } = await supabaseAdmin
          .from("stripe_customers")
          .select("account_id, billing_email")
          .eq("stripe_customer_id", subscription.customer as string)
          .single();

        let accountId = stripeCustomer?.account_id;
        let userEmail = stripeCustomer?.billing_email;

        // Fallback to legacy user_subscriptions lookup
        if (!accountId) {
          const { data: subData } = await supabaseAdmin
            .from("user_subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subscription.id)
            .single();

          if (subData) {
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("account_id")
              .eq("id", subData.user_id)
              .single();
            accountId = profile?.account_id || subData.user_id;
          }
        }

        // Update legacy user_subscriptions
        await supabaseAdmin
          .from("user_subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", subscription.id);

        // Update new subscriptions table
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("subscription_id", subscription.id);

        // Downgrade entitlements to view_only tier
        if (accountId) {
          await supabaseAdmin.from("entitlements").upsert({
            account_id: accountId,
            tier: "view_only",
            included_reports_monthly: 0,
            active_parcel_limit: 0,
            seat_limit: 1,
            history_retention_days: 30,
            can_generate_lender_ready: false,
            can_share_links: false,
            can_export_csv: false,
            can_use_api: false,
            grace_until: null,
          }, { onConflict: "account_id" });

          // Send GHL event for cancellation
          await sendGhlWebhook("siteintel_canceled", {
            email: userEmail,
            account_id: accountId,
            subscription_id: subscription.id,
            canceled_at: new Date().toISOString(),
          });

          // === MRR ANALYTICS: Record churn event ===
          // Get the previous subscription MRR to record churn amount
          const { data: prevSub } = await supabaseAdmin
            .from("subscriptions")
            .select("tier, metadata")
            .eq("subscription_id", subscription.id)
            .single();
          
          const prevTier = prevSub?.tier || 'unknown';
          
          // Get previous MRR from subscription price
          const priceData = subscription.items.data[0]?.price;
          const priceAmount = (priceData?.unit_amount || 0) / 100;
          const interval = priceData?.recurring?.interval || 'month';
          const churndMrr = calculateMrr(priceAmount, interval);

          await recordMrrEvent(
            supabaseAdmin,
            accountId,
            'churn',
            -churndMrr, // Negative delta for churn
            prevTier,
            null,
            event.id
          );

          logStep("Entitlements downgraded to view_only tier", { accountId, churnedMrr: churndMrr });
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
