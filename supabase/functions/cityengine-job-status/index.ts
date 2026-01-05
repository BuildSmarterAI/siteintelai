import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function logStep(step: string, details?: unknown) {
  console.log(`[cityengine-job-status] ${step}`, details ? JSON.stringify(details) : "");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting status request");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      logStep("Authentication failed", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request - support both GET with query params and POST with body
    let jobId: string | null = null;

    if (req.method === "GET") {
      const url = new URL(req.url);
      jobId = url.searchParams.get("job_id");
    } else {
      const body = await req.json();
      jobId = body.job_id;
    }

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: "job_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Fetching job", { jobId });

    // Fetch job - RLS will ensure user can only see their own jobs
    const { data: job, error: jobError } = await supabase
      .from("cityengine_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single();

    if (jobError || !job) {
      logStep("Job not found", jobError);
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Job found", { status: job.status, progress: job.progress });

    // Build response
    const response: Record<string, unknown> = {
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        current_stage: job.current_stage,
        attempt: job.attempt,
        max_attempts: job.max_attempts,
        error_message: job.error_message,
        error_code: job.error_code,
        processing_time_ms: job.processing_time_ms,
        created_at: job.created_at,
        started_at: job.started_at,
        completed_at: job.completed_at,
        output_manifest: job.output_manifest,
      },
    };

    // Generate signed URLs for exports if job is complete
    if (job.status === "complete" && job.output_manifest) {
      const manifest = job.output_manifest as Record<string, unknown>;
      const exports = manifest.exports as Record<string, string> || {};
      const signedUrls: Record<string, string> = {};

      const storageBucket = "cityengine-exports";

      for (const [key, path] of Object.entries(exports)) {
        if (path && typeof path === "string") {
          const { data: signedUrl } = await supabase.storage
            .from(storageBucket)
            .createSignedUrl(path, 3600); // 1 hour expiry

          if (signedUrl?.signedUrl) {
            signedUrls[key] = signedUrl.signedUrl;
          }
        }
      }

      if (Object.keys(signedUrls).length > 0) {
        response.signed_urls = signedUrls;
      }
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    logStep("Unexpected error", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
