import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLEANUP-ORPHANED-APPS] ${step}${detailsStr}`);
};

// Delete unpaid, unlinked applications older than 48 hours
const ORPHAN_THRESHOLD_HOURS = 48;

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
    logStep("Starting orphaned application cleanup");
    
    const cutoffDate = new Date(Date.now() - ORPHAN_THRESHOLD_HOURS * 60 * 60 * 1000).toISOString();
    logStep("Cutoff date", { cutoffDate, thresholdHours: ORPHAN_THRESHOLD_HOURS });

    // Find orphaned applications:
    // - payment_status is 'pending' or 'unpaid'
    // - user_id is NULL (never linked)
    // - created_at is older than threshold
    const { data: orphanedApps, error: fetchError } = await supabaseAdmin
      .from("applications")
      .select("id, email, created_at, payment_status")
      .in("payment_status", ["pending", "unpaid"])
      .is("user_id", null)
      .lt("created_at", cutoffDate)
      .limit(100);

    if (fetchError) {
      logStep("Error fetching orphaned applications", { error: fetchError.message });
      throw new Error(`Failed to fetch orphaned applications: ${fetchError.message}`);
    }

    logStep("Found orphaned applications", { count: orphanedApps?.length || 0 });

    if (!orphanedApps || orphanedApps.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        deleted: 0,
        message: "No orphaned applications found"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const orphanIds = orphanedApps.map(app => app.id);

    // Delete orphaned applications
    const { error: deleteError } = await supabaseAdmin
      .from("applications")
      .delete()
      .in("id", orphanIds);

    if (deleteError) {
      logStep("Error deleting orphaned applications", { error: deleteError.message });
      throw new Error(`Failed to delete orphaned applications: ${deleteError.message}`);
    }

    logStep("Deleted orphaned applications", { 
      count: orphanIds.length,
      ids: orphanIds.slice(0, 5) // Log first 5 for debugging
    });

    return new Response(JSON.stringify({
      success: true,
      deleted: orphanIds.length,
      message: `Deleted ${orphanIds.length} orphaned application(s)`
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
