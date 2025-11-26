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

    const { credit_type, application_id } = await req.json();
    if (!credit_type) throw new Error("credit_type is required (report or quickcheck)");

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

    // Get user's subscription
    const { data: subscription } = await supabaseAdmin
      .from("user_subscriptions")
      .select(`
        *,
        tier:subscription_tiers(*)
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!subscription) {
      logStep("No active subscription");
      return new Response(JSON.stringify({
        success: false,
        error: "No active subscription. Please subscribe to generate reports.",
        can_use: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const tier = subscription.tier;

    if (credit_type === "report") {
      const reportsLimit = tier?.reports_per_month || 0;
      const reportsUsed = subscription.reports_used || 0;

      // Calculate available credits:
      // - For subscription tiers: reportsLimit - reportsUsed
      // - For pay-per-use: negative reportsUsed means purchased credits (e.g., -3 means 3 credits)
      // - Combined: reportsLimit - reportsUsed (works for both cases)
      const availableReports = reportsLimit - reportsUsed;

      if (availableReports <= 0) {
        logStep("Report credits exhausted", { reportsUsed, reportsLimit, availableReports });
        return new Response(JSON.stringify({
          success: false,
          error: "No report credits available. Please purchase a report or upgrade your subscription.",
          can_use: false,
          reports_used: Math.max(0, reportsUsed),
          reports_limit: reportsLimit,
          purchased_credits: reportsUsed < 0 ? Math.abs(reportsUsed) : 0,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }

      // Increment reports_used to consume a credit
      const newReportsUsed = reportsUsed + 1;
      await supabaseAdmin
        .from("user_subscriptions")
        .update({ reports_used: newReportsUsed })
        .eq("id", subscription.id);

      // Record usage
      await supabaseAdmin.from("credits_usage").insert({
        user_id: user.id,
        application_id: application_id || null,
        report_type: "feasibility",
        cost: 1,
      });

      logStep("Report credit used", { newReportsUsed, remainingCredits: availableReports - 1 });

      return new Response(JSON.stringify({
        success: true,
        can_use: true,
        reports_used: Math.max(0, newReportsUsed),
        reports_remaining: availableReports - 1,
        purchased_credits: newReportsUsed < 0 ? Math.abs(newReportsUsed) : 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (credit_type === "quickcheck") {
      // QuickChecks might be unlimited for Pro tier
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

      // Track quickcheck usage even if unlimited (for analytics)
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

    throw new Error("Invalid credit_type. Must be 'report' or 'quickcheck'");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
