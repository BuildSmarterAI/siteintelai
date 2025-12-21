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
      .select("id, stripe_session_id, payment_status")
      .eq("stripe_customer_email", user.email)
      .eq("payment_status", "paid")
      .is("user_id", null);

    if (fetchError) {
      logStep("Error fetching applications", { error: fetchError.message });
      throw new Error(`Failed to fetch applications: ${fetchError.message}`);
    }

    logStep("Found applications to link", { count: applications?.length || 0 });

    if (!applications || applications.length === 0) {
      return new Response(JSON.stringify({
        linked: false,
        message: "No pending applications found for this email",
        application_ids: []
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Link all matching applications to this user
    const applicationIds = applications.map(app => app.id);
    const { error: updateError } = await supabaseAdmin
      .from("applications")
      .update({ 
        user_id: user.id,
        status: "queued" // Set to queued to trigger enrichment
      })
      .in("id", applicationIds);

    if (updateError) {
      logStep("Error linking applications", { error: updateError.message });
      throw new Error(`Failed to link applications: ${updateError.message}`);
    }

    logStep("Applications linked successfully", { applicationIds });

    // Trigger enrichment for each application by calling orchestrate-application
    for (const appId of applicationIds) {
      try {
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
        } else {
          logStep("Failed to trigger enrichment", { applicationId: appId, status: response.status });
        }
      } catch (triggerError) {
        logStep("Error triggering enrichment", { applicationId: appId, error: String(triggerError) });
        // Don't throw - linking was successful, enrichment can be retried
      }
    }

    return new Response(JSON.stringify({
      linked: true,
      application_ids: applicationIds,
      message: `Successfully linked ${applicationIds.length} application(s)`
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
