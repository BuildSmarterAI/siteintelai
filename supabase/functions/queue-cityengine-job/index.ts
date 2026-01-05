import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QueueRequest {
  application_id?: string;
  session_id?: string;
  variant_id?: string;
  payload?: Record<string, unknown>;
  force?: boolean;
}

function logStep(step: string, details?: unknown) {
  console.log(`[queue-cityengine-job] ${step}`, details ? JSON.stringify(details) : "");
}

// Simple hash function for idempotency
async function hashPayload(payload: unknown): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting job queue request");

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

    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const body: QueueRequest = await req.json();
    const { application_id, session_id, variant_id, payload: overridePayload, force } = body;

    if (!application_id && !session_id && !variant_id && !overridePayload) {
      return new Response(
        JSON.stringify({ error: "Must provide application_id, session_id, variant_id, or payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the CityEngine payload from linked entities
    let cePayload: Record<string, unknown> = {};
    let parcelId = "";

    // Fetch application data if provided
    if (application_id) {
      const { data: app, error: appError } = await supabase
        .from("applications")
        .select("*")
        .eq("id", application_id)
        .single();

      if (appError || !app) {
        logStep("Application not found", appError);
        return new Response(
          JSON.stringify({ error: "Application not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      parcelId = app.parcel_id || application_id;

      // Build constraints from application data
      cePayload = {
        parcel_id: parcelId,
        application_id,
        site: {
          crs: "EPSG:4326",
          envelope_geojson: null, // Will be filled from regulatory envelope
          parcel_geojson: null,
          buildable_area_sf: app.net_buildable_area_sf || app.acreage_cad * 43560 || 0,
        },
        constraints: {
          max_height_ft: 65, // Default, should come from buildability
          far_cap: 1.25,
          coverage_cap_pct: 55,
          setbacks_ft: { front: 25, rear: 15, left: 10, right: 10 },
          parking_ratio: 3.5,
        },
        program: {
          use_type: app.intent_type || "office",
          target_gsf: app.max_buildable_sf || 50000,
          floor_to_floor_ft: 12,
        },
        optioning: {
          strategy: "sweep",
          count: 3,
        },
        facade: {
          preset: "office_v1",
          style: "modern",
          window_to_wall: 0.4,
        },
        export: {
          formats: ["glb", "png"],
          views: ["axon", "top", "street"],
          png_size: [2400, 1350],
          include_manifest: true,
        },
      };

      // Fetch buildability output if linked
      if (app.buildability_output_id) {
        const { data: buildability } = await supabase
          .from("buildability_outputs")
          .select("*")
          .eq("id", app.buildability_output_id)
          .single();

        if (buildability) {
          const envelope = buildability.buildable_envelope as Record<string, unknown> || {};
          cePayload.constraints = {
            max_height_ft: envelope.height_cap_ft || 65,
            far_cap: envelope.far_cap || 1.25,
            coverage_cap_pct: envelope.coverage_cap_pct || 55,
            setbacks_ft: envelope.setbacks || { front: 25, rear: 15, left: 10, right: 10 },
          };
        }
      }
    }

    // Fetch design session if provided
    if (session_id) {
      const { data: session } = await supabase
        .from("design_sessions")
        .select("*")
        .eq("id", session_id)
        .single();

      if (session) {
        cePayload.session_id = session_id;
        // Could extract additional design intent from session
      }
    }

    // Fetch variant if provided
    if (variant_id) {
      const { data: variant } = await supabase
        .from("design_variants")
        .select("*")
        .eq("id", variant_id)
        .single();

      if (variant) {
        cePayload.variant_id = variant_id;
        const params = variant.parameters as Record<string, unknown> || {};
        cePayload.program = {
          ...cePayload.program as Record<string, unknown>,
          target_gsf: params.total_gfa || (cePayload.program as Record<string, unknown>)?.target_gsf,
          floor_to_floor_ft: params.floor_to_floor_ft || 12,
        };
      }
    }

    // Apply any override payload
    if (overridePayload) {
      cePayload = { ...cePayload, ...overridePayload };
    }

    // Generate job ID
    const jobId = crypto.randomUUID();
    cePayload.job_id = jobId;

    // Compute idempotency hash (exclude job_id from hash)
    const { job_id: _, ...hashablePayload } = cePayload;
    const inputHash = await hashPayload(hashablePayload);

    logStep("Computed payload hash", { inputHash: inputHash.substring(0, 16) + "..." });

    // Check for existing complete job with same hash (unless force=true)
    if (!force) {
      const { data: existingJob } = await supabase
        .from("cityengine_jobs")
        .select("*")
        .eq("input_hash", inputHash)
        .eq("status", "complete")
        .single();

      if (existingJob) {
        logStep("Found cached complete job", { existingJobId: existingJob.id });
        return new Response(
          JSON.stringify({
            job_id: existingJob.id,
            status: existingJob.status,
            cached: true,
            output_manifest: existingJob.output_manifest,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check for existing pending job
      const { data: pendingJob } = await supabase
        .from("cityengine_jobs")
        .select("*")
        .eq("input_hash", inputHash)
        .in("status", ["queued", "processing", "exporting", "uploading"])
        .single();

      if (pendingJob) {
        logStep("Found pending job", { pendingJobId: pendingJob.id });
        return new Response(
          JSON.stringify({
            job_id: pendingJob.id,
            status: pendingJob.status,
            cached: false,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Insert new job
    const { data: newJob, error: insertError } = await supabase
      .from("cityengine_jobs")
      .insert({
        id: jobId,
        user_id: user.id,
        application_id: application_id || null,
        session_id: session_id || null,
        variant_id: variant_id || null,
        status: "queued",
        input_payload: cePayload,
        input_hash: inputHash,
        progress: 0,
        current_stage: "Queued for processing",
      })
      .select()
      .single();

    if (insertError) {
      logStep("Failed to insert job", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to queue job", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Job queued successfully", { jobId: newJob.id });

    return new Response(
      JSON.stringify({
        job_id: newJob.id,
        status: newJob.status,
        cached: false,
      }),
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
