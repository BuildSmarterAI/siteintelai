import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[LINK-APPLICATION-TO-USER] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Find applications that match this email and are paid but not yet linked
    const { data: applications, error: fetchError } = await supabaseAdmin
      .from("applications")
      .select("id, stripe_session_id, payment_status, status, orchestration_lock_at")
      .eq("stripe_customer_email", user.email)
      .eq("payment_status", "paid")
      .is("user_id", null);

    if (fetchError) {
      logStep("Error fetching applications", { error: fetchError.message });
      throw new Error(`Failed to fetch applications: ${fetchError.message}`);
    }

    logStep("Found applications to link", { count: applications?.length || 0 });

    if (!applications || applications.length === 0) {
      // Check if there are any applications already linked to this user that might need orchestration
      const { data: existingApps } = await supabaseAdmin
        .from("applications")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("payment_status", "paid")
        .in("status", ["pending", "queued"])
        .limit(5);
      
      if (existingApps && existingApps.length > 0) {
        logStep("Found existing applications needing orchestration", { count: existingApps.length });
        // Trigger orchestration for these
        for (const app of existingApps) {
          try {
            const orchestrateUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/orchestrate-application`;
            await fetch(orchestrateUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({ application_id: app.id }),
            });
          } catch (e) {
            logStep("Failed to trigger orchestration for existing app", { appId: app.id });
          }
        }
      }
      
      return new Response(JSON.stringify({
        linked: false,
        message: "No pending applications found for this email",
        application_ids: [],
        existing_apps_triggered: existingApps?.length || 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Link all matching applications to this user atomically
    const applicationIds = applications.map(app => app.id);
    const linkedAt = new Date().toISOString();
    
    // Use a transaction-like approach: update with conditions
    const { data: linkedApps, error: updateError } = await supabaseAdmin
      .from("applications")
      .update({ 
        user_id: user.id,
        status: "queued", // Set to queued to trigger enrichment
        updated_at: linkedAt,
        orchestration_lock_at: null // Clear any stale locks
      })
      .in("id", applicationIds)
      .is("user_id", null) // Double-check still unlinked (idempotency)
      .select("id");

    if (updateError) {
      logStep("Error linking applications", { error: updateError.message });
      throw new Error(`Failed to link applications: ${updateError.message}`);
    }

    const actuallyLinkedIds = linkedApps?.map(app => app.id) || [];
    logStep("Applications linked successfully", { 
      requested: applicationIds.length,
      actuallyLinked: actuallyLinkedIds.length,
      ids: actuallyLinkedIds 
    });

    // Trigger enrichment for each successfully linked application
    const triggeredIds: string[] = [];
    const failedTriggers: string[] = [];
    
    for (const appId of actuallyLinkedIds) {
      try {
        // Acquire orchestration lock before triggering
        const lockTime = new Date().toISOString();
        const { data: lockResult, error: lockError } = await supabaseAdmin
          .from("applications")
          .update({ orchestration_lock_at: lockTime })
          .eq("id", appId)
          .eq("status", "queued")
          .is("orchestration_lock_at", null) // Only if not already locked
          .select("id")
          .single();

        if (lockError || !lockResult) {
          logStep("Could not acquire orchestration lock (may already be processing)", { appId });
          continue; // Skip - another process may have started orchestration
        }

        const orchestrateUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/orchestrate-application`;
        const response = await fetch(orchestrateUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ application_id: appId }),
        });
        
        if (response.ok) {
          logStep("Triggered enrichment", { applicationId: appId });
          triggeredIds.push(appId);
        } else {
          logStep("Failed to trigger enrichment", { applicationId: appId, status: response.status });
          failedTriggers.push(appId);
          // Clear the lock so it can be retried
          await supabaseAdmin
            .from("applications")
            .update({ orchestration_lock_at: null })
            .eq("id", appId);
        }
      } catch (triggerError) {
        logStep("Error triggering enrichment", { applicationId: appId, error: String(triggerError) });
        failedTriggers.push(appId);
        // Don't throw - linking was successful, enrichment can be retried
      }
    }

    return new Response(JSON.stringify({
      linked: actuallyLinkedIds.length > 0,
      application_ids: actuallyLinkedIds,
      triggered_ids: triggeredIds,
      failed_triggers: failedTriggers,
      message: `Successfully linked ${actuallyLinkedIds.length} application(s), triggered ${triggeredIds.length}`
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
