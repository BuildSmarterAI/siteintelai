import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PURCHASE-CREDITS] ${step}${detailsStr}`);
};

/**
 * DEPRECATED: Credit packs have been sunset as of 2025-01-02
 * 
 * Credit packs ($399 for 5, $699 for 10) undermine the $1,495 Development Feasibility Report
 * anchor price and have been retired from the product catalog.
 * 
 * This function now returns an error directing users to upgrade their subscription instead.
 * 
 * For users who need additional report capacity, the recommended path is:
 * - Upgrade to Professional ($749/mo) for 20 reports/month
 * - Upgrade to Team ($1,950/mo) for 75 reports/month
 * - Contact sales for Enterprise pricing (250+ reports/month)
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function called - credit packs are DEPRECATED");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    logStep("User attempted to purchase deprecated credit pack", { 
      email: user.email,
      userId: user.id 
    });

    // Return deprecation message
    return new Response(JSON.stringify({
      error: "Credit packs are no longer available.",
      message: "Credit packs have been retired from the SiteIntel product catalog. For additional report capacity, please upgrade your subscription to Professional ($749/mo for 20 reports) or Team ($1,950/mo for 75 reports).",
      action: "upgrade",
      upgrade_url: "/pricing",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 410, // HTTP 410 Gone - resource no longer available
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