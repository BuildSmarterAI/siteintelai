import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RECOVER-STALLED-APPS] ${step}${detailsStr}`);
};

// Applications stuck in processing states for more than 30 minutes
const STALLED_THRESHOLD_MINUTES = 30;
const MAX_ATTEMPTS = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Starting stalled application recovery");
    
    const cutoffDate = new Date(Date.now() - STALLED_THRESHOLD_MINUTES * 60 * 1000).toISOString();
    logStep("Cutoff date", { cutoffDate, thresholdMinutes: STALLED_THRESHOLD_MINUTES });

    // Find stalled applications:
    // - status is 'enriching', 'ai', or 'rendering' (processing states)
    // - updated_at is older than threshold
    // - attempts < MAX_ATTEMPTS
    // - payment_status is 'paid' (only recover paid apps)
    const { data: stalledApps, error: fetchError } = await supabaseAdmin
      .from("applications")
      .select("id, status, attempts, email, updated_at, orchestration_lock_at")
      .in("status", ["enriching", "ai", "rendering"])
      .eq("payment_status", "paid")
      .lt("updated_at", cutoffDate)
      .lt("attempts", MAX_ATTEMPTS)
      .limit(10); // Process in batches

    if (fetchError) {
      logStep("Error fetching stalled applications", { error: fetchError.message });
      throw new Error(`Failed to fetch stalled applications: ${fetchError.message}`);
    }

    logStep("Found stalled applications", { count: stalledApps?.length || 0 });

    if (!stalledApps || stalledApps.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        recovered: 0,
        message: "No stalled applications found"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const recovered: string[] = [];
    const failed: string[] = [];

    for (const app of stalledApps) {
      try {
        // Reset application to queued and increment attempts
        const { error: updateError } = await supabaseAdmin
          .from("applications")
          .update({
            status: "queued",
            status_rev: 0,
            attempts: (app.attempts || 0) + 1,
            orchestration_lock_at: null, // Clear any stale lock
            updated_at: new Date().toISOString(),
            data_flags: supabaseAdmin.rpc ? undefined : [] // Clear will be handled separately
          })
          .eq("id", app.id);

        if (updateError) {
          logStep("Failed to reset application", { appId: app.id, error: updateError.message });
          failed.push(app.id);
          continue;
        }

        // Add recovery flag to data_flags
        const { data: currentApp } = await supabaseAdmin
          .from("applications")
          .select("data_flags")
          .eq("id", app.id)
          .single();

        const existingFlags = (currentApp?.data_flags as string[]) || [];
        const newFlag = `auto_recovered_${new Date().toISOString().split('T')[0]}`;
        
        await supabaseAdmin
          .from("applications")
          .update({
            data_flags: [...existingFlags.filter(f => !f.startsWith('auto_recovered')), newFlag]
          })
          .eq("id", app.id);

        // Trigger orchestration
        const orchestrateUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/orchestrate-application`;
        const response = await fetch(orchestrateUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ application_id: app.id }),
        });

        if (response.ok) {
          logStep("Recovered and triggered orchestration", { appId: app.id, newAttempts: (app.attempts || 0) + 1 });
          recovered.push(app.id);
        } else {
          logStep("Orchestration trigger failed", { appId: app.id, status: response.status });
          failed.push(app.id);
        }
      } catch (err) {
        logStep("Error recovering application", { appId: app.id, error: String(err) });
        failed.push(app.id);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      recovered: recovered.length,
      failed: failed.length,
      recoveredIds: recovered,
      failedIds: failed,
      message: `Recovered ${recovered.length} stalled application(s), ${failed.length} failed`
    }), {
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
