import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[USE-CREDIT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { credit_type, application_id, check_only } = await req.json();
    if (!credit_type) throw new Error("credit_type is required (report, quickcheck, parcel, share_link, csv_export)");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get user's subscription with tier info
    const { data: subscription } = await supabaseAdmin
      .from("user_subscriptions")
      .select(`
        *,
        tier:subscription_tiers(*)
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    // Get entitlements
    const { data: entitlements } = await supabaseAdmin
      .from("entitlements")
      .select("*")
      .eq("account_id", user.id)
      .single();

    // Check for grace period - if in grace, block new generation
    if (entitlements?.grace_until) {
      const graceUntil = new Date(entitlements.grace_until);
      if (graceUntil > new Date() && credit_type === "report") {
        logStep("Account in grace period - blocking new reports");
        return new Response(JSON.stringify({
          success: false,
          error: "Your payment is past due. Please update your payment method to continue generating reports.",
          can_use: false,
          in_grace_period: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }
    }

    if (!subscription) {
      logStep("No active subscription");
      return new Response(JSON.stringify({
        success: false,
        error: "No active subscription. Please subscribe to access this feature.",
        can_use: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const tier = subscription.tier;

    // Handle different credit types
    switch (credit_type) {
      case "report": {
        const reportsLimit = tier?.reports_per_month || 0;
        const reportsUsed = subscription.reports_used || 0;
        const purchasedCredits = subscription.purchased_credits || 0;

        // Check if purchased credits are expired
        let validPurchasedCredits = purchasedCredits;
        if (subscription.credit_expires_at) {
          const expiresAt = new Date(subscription.credit_expires_at);
          if (expiresAt < new Date()) {
            validPurchasedCredits = 0;
            // Clear expired credits
            await supabaseAdmin
              .from("user_subscriptions")
              .update({ purchased_credits: 0, credit_expires_at: null })
              .eq("id", subscription.id);
          }
        }

        // Calculate available reports: (limit - used) + purchased credits
        const baseAvailable = reportsLimit - Math.max(0, reportsUsed);
        const availableReports = Math.max(0, baseAvailable) + validPurchasedCredits;

        if (availableReports <= 0) {
          logStep("Report credits exhausted", { reportsUsed, reportsLimit, validPurchasedCredits });
          return new Response(JSON.stringify({
            success: false,
            error: "No report credits available. Please purchase a credit pack or upgrade your subscription.",
            can_use: false,
            reports_used: Math.max(0, reportsUsed),
            reports_limit: reportsLimit,
            purchased_credits: validPurchasedCredits,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          });
        }

        // If check_only, just return availability
        if (check_only) {
          return new Response(JSON.stringify({
            success: true,
            can_use: true,
            reports_remaining: availableReports,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Consume credit - prefer purchased credits first, then base limit
        let newReportsUsed = reportsUsed;
        let newPurchasedCredits = validPurchasedCredits;

        if (validPurchasedCredits > 0) {
          // Use purchased credit first
          newPurchasedCredits = validPurchasedCredits - 1;
          
          // Track overage usage
          const period = new Date().toISOString().slice(0, 7).replace('-', '');
          await supabaseAdmin.from("usage_counters_monthly").upsert({
            account_id: user.id,
            period_yyyymm: period,
            overage_credits_used: 1,
          }, { 
            onConflict: "account_id,period_yyyymm",
          });
        } else {
          // Use base limit
          newReportsUsed = reportsUsed + 1;
        }

        await supabaseAdmin
          .from("user_subscriptions")
          .update({ 
            reports_used: newReportsUsed,
            purchased_credits: newPurchasedCredits,
          })
          .eq("id", subscription.id);

        // Record usage in monthly tracker
        const period = new Date().toISOString().slice(0, 7).replace('-', '');
        const { data: existingCounter } = await supabaseAdmin
          .from("usage_counters_monthly")
          .select("reports_generated")
          .eq("account_id", user.id)
          .eq("period_yyyymm", period)
          .single();

        await supabaseAdmin.from("usage_counters_monthly").upsert({
          account_id: user.id,
          period_yyyymm: period,
          reports_generated: (existingCounter?.reports_generated || 0) + 1,
        }, { onConflict: "account_id,period_yyyymm" });

        // Record in credits_usage
        await supabaseAdmin.from("credits_usage").insert({
          user_id: user.id,
          application_id: application_id || null,
          report_type: "feasibility",
          cost: 1,
        });

        logStep("Report credit used", { 
          newReportsUsed, 
          newPurchasedCredits,
          remainingCredits: availableReports - 1 
        });

        return new Response(JSON.stringify({
          success: true,
          can_use: true,
          reports_used: Math.max(0, newReportsUsed),
          reports_remaining: availableReports - 1,
          purchased_credits: newPurchasedCredits,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "parcel": {
        const parcelLimit = tier?.active_parcel_limit || entitlements?.active_parcel_limit || 10;
        const parcelsUsed = subscription.active_parcels_used || 0;

        // -1 means unlimited
        if (parcelLimit !== -1 && parcelsUsed >= parcelLimit) {
          logStep("Active parcel limit reached", { parcelsUsed, parcelLimit });
          return new Response(JSON.stringify({
            success: false,
            error: "Active parcel limit reached. Please archive some parcels or upgrade your subscription.",
            can_use: false,
            parcels_used: parcelsUsed,
            parcels_limit: parcelLimit,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          });
        }

        if (check_only) {
          return new Response(JSON.stringify({
            success: true,
            can_use: true,
            parcels_remaining: parcelLimit === -1 ? "unlimited" : parcelLimit - parcelsUsed,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Increment parcel count
        const newParcelsUsed = parcelsUsed + 1;
        await supabaseAdmin
          .from("user_subscriptions")
          .update({ active_parcels_used: newParcelsUsed })
          .eq("id", subscription.id);

        // Update monthly peak
        const period = new Date().toISOString().slice(0, 7).replace('-', '');
        const { data: counter } = await supabaseAdmin
          .from("usage_counters_monthly")
          .select("active_parcels_peak")
          .eq("account_id", user.id)
          .eq("period_yyyymm", period)
          .single();

        if (!counter || newParcelsUsed > (counter.active_parcels_peak || 0)) {
          await supabaseAdmin.from("usage_counters_monthly").upsert({
            account_id: user.id,
            period_yyyymm: period,
            active_parcels_peak: newParcelsUsed,
          }, { onConflict: "account_id,period_yyyymm" });
        }

        logStep("Parcel slot used", { newParcelsUsed });

        return new Response(JSON.stringify({
          success: true,
          can_use: true,
          parcels_used: newParcelsUsed,
          parcels_remaining: parcelLimit === -1 ? "unlimited" : parcelLimit - newParcelsUsed,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "share_link": {
        const canShareLinks = tier?.can_share_links || entitlements?.can_share_links || false;

        if (!canShareLinks) {
          logStep("Share links not available for tier", { tier: tier?.name });
          return new Response(JSON.stringify({
            success: false,
            error: "Shareable links are not available on your current plan. Please upgrade to Professional or higher.",
            can_use: false,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          });
        }

        return new Response(JSON.stringify({
          success: true,
          can_use: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "csv_export": {
        const canExportCsv = tier?.can_export_csv || entitlements?.can_export_csv || false;

        if (!canExportCsv) {
          logStep("CSV export not available for tier", { tier: tier?.name });
          return new Response(JSON.stringify({
            success: false,
            error: "CSV export is not available on your current plan. Please upgrade to Team or higher.",
            can_use: false,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          });
        }

        return new Response(JSON.stringify({
          success: true,
          can_use: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "lender_ready": {
        const canGenerateLenderReady = tier?.can_generate_lender_ready || entitlements?.can_generate_lender_ready || false;

        if (!canGenerateLenderReady) {
          logStep("Lender-ready reports not available for tier", { tier: tier?.name });
          return new Response(JSON.stringify({
            success: false,
            error: "Lender-ready reports are not available on your current plan. Please upgrade to Professional or higher.",
            can_use: false,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          });
        }

        return new Response(JSON.stringify({
          success: true,
          can_use: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "quickcheck": {
        if (tier?.quickchecks_unlimited) {
          logStep("Unlimited quickchecks - allowed");
          return new Response(JSON.stringify({
            success: true,
            can_use: true,
            unlimited: true,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Track quickcheck usage
        await supabaseAdmin
          .from("user_subscriptions")
          .update({ quickchecks_used: (subscription.quickchecks_used || 0) + 1 })
          .eq("id", subscription.id);

        return new Response(JSON.stringify({
          success: true,
          can_use: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      default:
        throw new Error(`Invalid credit_type: ${credit_type}. Must be 'report', 'quickcheck', 'parcel', 'share_link', 'csv_export', or 'lender_ready'`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
