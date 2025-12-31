import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-GHL-WEBHOOK] ${step}${detailsStr}`);
};

/**
 * GHL (GoHighLevel) Webhook Integration
 * 
 * Supported events:
 * - siteintel_one_off_paid: User purchased $999 one-time report
 * - siteintel_subscription_active: User activated a subscription
 * - siteintel_upgrade_candidate: User may be ready for upgrade (>80% usage)
 * - siteintel_payment_failed: Payment failed, user in grace period
 * - siteintel_canceled: Subscription was canceled
 * - siteintel_trial_started: User started a trial (future)
 */

interface GhlWebhookPayload {
  event: string;
  timestamp: string;
  email?: string;
  user_id?: string;
  account_id?: string;
  [key: string]: any;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const ghlWebhookUrl = Deno.env.get("GHL_WEBHOOK_URL");
    if (!ghlWebhookUrl) {
      logStep("GHL_WEBHOOK_URL not configured");
      return new Response(
        JSON.stringify({ error: "GHL_WEBHOOK_URL not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const payload: GhlWebhookPayload = await req.json();
    logStep("Received payload", { event: payload.event });

    // Validate required fields
    if (!payload.event) {
      return new Response(
        JSON.stringify({ error: "Missing required 'event' field" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Add timestamp if not present
    if (!payload.timestamp) {
      payload.timestamp = new Date().toISOString();
    }

    // Send to GHL webhook
    const response = await fetch(ghlWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    logStep("GHL response", { status: response.status, body: responseText.slice(0, 200) });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: "GHL webhook failed", 
          status: response.status,
          body: responseText.slice(0, 500) 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, event: payload.event }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
