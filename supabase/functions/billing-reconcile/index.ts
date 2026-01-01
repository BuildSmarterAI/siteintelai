import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BILLING-RECONCILE] ${step}${detailsStr}`);
};

// Parse entitlements from Stripe price metadata (source of truth)
function parseEntitlementsFromMetadata(
  priceMetadata: Record<string, string>,
  subscriptionMetadata?: Record<string, string>
): {
  tier: string;
  included_reports_monthly: number;
  active_parcel_limit: number;
  seat_limit: number;
  history_retention_days: number;
  can_generate_lender_ready: boolean;
  can_share_links: boolean;
  can_export_csv: boolean;
  can_use_api: boolean;
  overage_allowed: boolean;
} {
  // Merge subscription metadata for Enterprise overrides (subscription takes precedence)
  const metadata = { ...priceMetadata, ...subscriptionMetadata };
  
  return {
    tier: metadata.tier || 'starter',
    included_reports_monthly: parseInt(metadata.included_reports_monthly || '5', 10),
    active_parcel_limit: parseInt(metadata.active_parcel_limit || '10', 10),
    seat_limit: parseInt(metadata.seat_limit || '1', 10),
    history_retention_days: parseInt(metadata.history_retention_days || '90', 10),
    can_generate_lender_ready: metadata.can_generate_lender_ready === 'true',
    can_share_links: metadata.can_share_links === 'true',
    can_export_csv: metadata.can_export_csv === 'true',
    can_use_api: metadata.can_use_api === 'true',
    overage_allowed: metadata.overage_allowed === 'true',
  };
}

// Get the authoritative subscription from a list (prefer active > past_due > trialing > most recent canceled)
function getAuthoritativeSubscription(subscriptions: Stripe.Subscription[]): Stripe.Subscription | null {
  if (subscriptions.length === 0) return null;
  
  // Priority: active > past_due > trialing > canceled (most recent)
  const active = subscriptions.find(s => s.status === 'active');
  if (active) return active;
  
  const pastDue = subscriptions.find(s => s.status === 'past_due');
  if (pastDue) return pastDue;
  
  const trialing = subscriptions.find(s => s.status === 'trialing');
  if (trialing) return trialing;
  
  // Return most recently created canceled subscription
  const canceled = subscriptions
    .filter(s => s.status === 'canceled')
    .sort((a, b) => b.created - a.created);
  
  return canceled[0] || subscriptions[0];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const runId = crypto.randomUUID();
  const startTime = Date.now();
  let customersProcessed = 0;
  let repairsApplied = 0;

  try {
    logStep("Reconciliation started", { runId });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Parse mode from request body
    let mode = "incremental";
    try {
      const body = await req.json();
      mode = body.mode || "incremental";
    } catch {
      // Default to incremental if no body
    }
    logStep("Mode", { mode });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get all stripe customers from our database
    const { data: stripeCustomers, error: customersError } = await supabaseAdmin
      .from("stripe_customers")
      .select("stripe_customer_id, account_id, billing_email");

    if (customersError) {
      throw new Error(`Failed to fetch stripe customers: ${customersError.message}`);
    }

    logStep("Fetched stripe customers", { count: stripeCustomers?.length || 0 });

    for (const customer of stripeCustomers || []) {
      try {
        customersProcessed++;
        const accountId = customer.account_id;
        const stripeCustomerId = customer.stripe_customer_id;

        // Get all subscriptions for this customer from Stripe
        const subscriptions = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          status: "all",
          limit: 10,
        });

        const authoritativeSub = getAuthoritativeSubscription(subscriptions.data);

        // Get current DB state
        const { data: currentEntitlements } = await supabaseAdmin
          .from("entitlements")
          .select("*")
          .eq("account_id", accountId)
          .single();

        const { data: currentSubscription } = await supabaseAdmin
          .from("subscriptions")
          .select("*")
          .eq("account_id", accountId)
          .single();

        const beforeState = {
          entitlements: currentEntitlements,
          subscription: currentSubscription,
        };

        if (!authoritativeSub) {
          // No active subscription - check if we need to downgrade
          if (currentEntitlements && currentEntitlements.tier !== 'view_only') {
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
              overage_allowed: false,
              grace_until: null,
            }, { onConflict: "account_id" });

            // Log repair
            await supabaseAdmin.from("billing_reconcile_log").insert({
              run_id: runId,
              account_id: accountId,
              stripe_customer_id: stripeCustomerId,
              action: "set_view_only",
              before_state: beforeState,
              after_state: { tier: "view_only" },
            });
            repairsApplied++;
            logStep("Set to view_only - no active subscription", { accountId });
          } else {
            // Log no change needed
            await supabaseAdmin.from("billing_reconcile_log").insert({
              run_id: runId,
              account_id: accountId,
              stripe_customer_id: stripeCustomerId,
              action: "no_change",
              before_state: beforeState,
              after_state: beforeState,
            });
          }
          continue;
        }

        // Get price with metadata from Stripe
        const priceId = authoritativeSub.items.data[0]?.price?.id;
        const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
        
        // Parse entitlements from price metadata + subscription metadata for enterprise overrides
        const priceMetadata = (price.metadata || {}) as Record<string, string>;
        const subMetadata = (authoritativeSub.metadata || {}) as Record<string, string>;
        const derivedEntitlements = parseEntitlementsFromMetadata(priceMetadata, subMetadata);

        // Handle grace period for past_due
        let graceUntil: string | null = null;
        if (authoritativeSub.status === 'past_due') {
          const existingGrace = currentEntitlements?.grace_until;
          if (!existingGrace || new Date(existingGrace) < new Date()) {
            // Set new 7-day grace period
            graceUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          } else {
            graceUntil = existingGrace;
          }
        }

        // Determine status mapping
        const statusMap: Record<string, string> = {
          active: "active",
          past_due: "past_due",
          canceled: "canceled",
          trialing: "trialing",
          incomplete: "incomplete",
          incomplete_expired: "canceled",
          unpaid: "past_due",
        };

        const dbStatus = statusMap[authoritativeSub.status] || authoritativeSub.status;

        // Compare and update if different
        const needsUpdate = 
          currentEntitlements?.tier !== derivedEntitlements.tier ||
          currentEntitlements?.included_reports_monthly !== derivedEntitlements.included_reports_monthly ||
          currentEntitlements?.active_parcel_limit !== derivedEntitlements.active_parcel_limit ||
          currentEntitlements?.seat_limit !== derivedEntitlements.seat_limit ||
          currentSubscription?.status !== dbStatus ||
          (authoritativeSub.status === 'past_due' && !currentEntitlements?.grace_until);

        if (needsUpdate) {
          // Update subscriptions table
          await supabaseAdmin.from("subscriptions").upsert({
            subscription_id: authoritativeSub.id,
            account_id: accountId,
            stripe_price_id: priceId,
            tier: derivedEntitlements.tier,
            status: dbStatus,
            current_period_start: new Date(authoritativeSub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(authoritativeSub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: authoritativeSub.cancel_at_period_end,
            metadata: {
              product_id: typeof price.product === 'string' ? price.product : price.product?.id,
              tier_name: derivedEntitlements.tier,
            },
          }, { onConflict: "subscription_id" });

          // Update entitlements table
          await supabaseAdmin.from("entitlements").upsert({
            account_id: accountId,
            tier: derivedEntitlements.tier,
            included_reports_monthly: derivedEntitlements.included_reports_monthly,
            active_parcel_limit: derivedEntitlements.active_parcel_limit,
            seat_limit: derivedEntitlements.seat_limit,
            history_retention_days: derivedEntitlements.history_retention_days,
            can_generate_lender_ready: derivedEntitlements.can_generate_lender_ready,
            can_share_links: derivedEntitlements.can_share_links,
            can_export_csv: derivedEntitlements.can_export_csv,
            can_use_api: derivedEntitlements.can_use_api,
            overage_allowed: derivedEntitlements.overage_allowed,
            grace_until: graceUntil,
          }, { onConflict: "account_id" });

          const afterState = {
            tier: derivedEntitlements.tier,
            status: dbStatus,
            grace_until: graceUntil,
            entitlements: derivedEntitlements,
          };

          // Log repair
          await supabaseAdmin.from("billing_reconcile_log").insert({
            run_id: runId,
            account_id: accountId,
            stripe_customer_id: stripeCustomerId,
            action: graceUntil ? "repair_with_grace" : "repair_tier",
            before_state: beforeState,
            after_state: afterState,
          });
          repairsApplied++;
          logStep("Repaired entitlements", { accountId, tier: derivedEntitlements.tier, status: dbStatus });
        } else {
          // Log no change
          await supabaseAdmin.from("billing_reconcile_log").insert({
            run_id: runId,
            account_id: accountId,
            stripe_customer_id: stripeCustomerId,
            action: "no_change",
            before_state: beforeState,
            after_state: beforeState,
          });
        }
      } catch (customerError) {
        logStep("Error processing customer", { 
          accountId: customer.account_id, 
          error: String(customerError) 
        });
        // Log error but continue processing other customers
        await supabaseAdmin.from("billing_reconcile_log").insert({
          run_id: runId,
          account_id: customer.account_id,
          stripe_customer_id: customer.stripe_customer_id,
          action: "error",
          before_state: { error: String(customerError) },
          after_state: null,
        });
      }
    }

    const durationMs = Date.now() - startTime;
    logStep("Reconciliation complete", { 
      runId, 
      customersProcessed, 
      repairsApplied, 
      durationMs,
      mode 
    });

    return new Response(JSON.stringify({ 
      success: true,
      run_id: runId,
      customers_processed: customersProcessed,
      repairs_applied: repairsApplied,
      duration_ms: durationMs,
      mode,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { runId, message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      run_id: runId,
      customers_processed: customersProcessed,
      repairs_applied: repairsApplied,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
