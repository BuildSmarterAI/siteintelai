import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// Types
// ============================================================================

interface GenerateVariantsRequest {
  sessionId: string;
  envelopeId: string;
  intent: {
    selectedTemplates: string[];
    programBuckets: Record<string, number>;
    sustainabilityLevel: "standard" | "enhanced" | "premium";
    wizardStep?: number;
  };
  options?: {
    maxVariants?: number;
    replaceExisting?: boolean;
  };
}

interface VariantData {
  name: string;
  strategy: string;
  footprint_geojson: unknown;
  metrics: Record<string, unknown>;
}

// ============================================================================
// Helpers
// ============================================================================

function jsonOk(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

function jsonError(status: number, code: string, message?: string): Response {
  return new Response(JSON.stringify({ ok: false, code, message }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

// Generate idempotency key from canonical inputs
function computeIdempotencyKey(
  sessionId: string,
  envelopeId: string,
  intent: GenerateVariantsRequest["intent"]
): string {
  const canonical = JSON.stringify({
    sessionId,
    envelopeId,
    templates: [...intent.selectedTemplates].sort(),
    buckets: intent.programBuckets,
    sustainability: intent.sustainabilityLevel,
  });
  
  // Simple hash for idempotency key
  let hash = 0;
  for (let i = 0; i < canonical.length; i++) {
    const char = canonical.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `variant_gen_${Math.abs(hash).toString(16)}`;
}

// ============================================================================
// Variant Generation Logic
// ============================================================================

function generateVariantsFromIntent(
  envelope: { heightCapFt: number; farCap: number; coverageCapPct: number; setbacks: Record<string, number> },
  intent: GenerateVariantsRequest["intent"],
  maxVariants: number
): VariantData[] {
  const variants: VariantData[] = [];
  const strategies = ["maximize_gfa", "balanced", "maximize_open_space"];
  
  for (let i = 0; i < Math.min(maxVariants, 3); i++) {
    const strategy = strategies[i] || "balanced";
    
    // Adjust metrics based on strategy
    let coverageMultiplier = 1.0;
    let heightMultiplier = 1.0;
    
    switch (strategy) {
      case "maximize_gfa":
        coverageMultiplier = 0.95;
        heightMultiplier = 1.0;
        break;
      case "balanced":
        coverageMultiplier = 0.75;
        heightMultiplier = 0.85;
        break;
      case "maximize_open_space":
        coverageMultiplier = 0.55;
        heightMultiplier = 0.7;
        break;
    }
    
    const effectiveHeight = envelope.heightCapFt * heightMultiplier;
    const effectiveCoverage = envelope.coverageCapPct * coverageMultiplier;
    const floors = Math.floor(effectiveHeight / 12); // 12 ft per floor
    
    // Calculate sustainability bonus
    let sustainabilityBonus = 0;
    switch (intent.sustainabilityLevel) {
      case "enhanced":
        sustainabilityBonus = 5;
        break;
      case "premium":
        sustainabilityBonus = 10;
        break;
    }
    
    variants.push({
      name: `Variant ${String.fromCharCode(65 + i)} - ${strategy.replace(/_/g, " ")}`,
      strategy,
      footprint_geojson: {
        type: "Polygon",
        coordinates: [[[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]]], // Placeholder
      },
      metrics: {
        heightFt: effectiveHeight,
        floors,
        coveragePct: effectiveCoverage,
        farAchieved: envelope.farCap * (effectiveCoverage / 100) * (floors / Math.floor(envelope.heightCapFt / 12)),
        sustainabilityScore: 70 + sustainabilityBonus,
        score: {
          overall: 75 + sustainabilityBonus + (strategy === "balanced" ? 5 : 0),
          compliance: 85,
          utilization: 70 + (strategy === "maximize_gfa" ? 10 : 0),
        },
        templates: intent.selectedTemplates,
        programBuckets: intent.programBuckets,
      },
    });
  }
  
  return variants;
}

// ============================================================================
// Main Handler
// ============================================================================

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[generate-variants] Request received");

  try {
    // 1) Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // 2) Verify authentication
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      console.error("[generate-variants] Auth failed:", userErr?.message);
      return jsonError(401, "AUTH_REQUIRED", "Authentication required");
    }

    const userId = userData.user.id;
    console.log("[generate-variants] User authenticated:", userId);

    // 3) Parse request body
    let body: GenerateVariantsRequest;
    try {
      body = await req.json();
    } catch {
      return jsonError(400, "INVALID_REQUEST", "Invalid JSON body");
    }

    const { sessionId, envelopeId, intent, options } = body;
    
    if (!sessionId || !envelopeId || !intent) {
      return jsonError(400, "MISSING_PARAMS", "sessionId, envelopeId, and intent are required");
    }

    const maxVariants = options?.maxVariants ?? 3;
    const replaceExisting = options?.replaceExisting ?? true;

    // 4) Generate idempotency key
    const idempotencyKey = computeIdempotencyKey(sessionId, envelopeId, intent);
    console.log("[generate-variants] Idempotency key:", idempotencyKey);

    // 5) Check for existing job with same idempotency key
    const { data: existingJob } = await supabase
      .from("design_jobs")
      .select("id, status, output_json")
      .eq("job_type", "variant_generate")
      .eq("idempotency_key", idempotencyKey)
      .single();

    if (existingJob) {
      if (existingJob.status === "succeeded") {
        console.log("[generate-variants] Returning cached result from job:", existingJob.id);
        return jsonOk({
          ok: true,
          cached: true,
          jobId: existingJob.id,
          result: existingJob.output_json,
        });
      } else if (existingJob.status === "running" || existingJob.status === "queued") {
        console.log("[generate-variants] Job already in progress:", existingJob.id);
        return jsonOk({
          ok: true,
          pending: true,
          jobId: existingJob.id,
          status: existingJob.status,
        });
      }
      // If failed, we'll create a new attempt below
    }

    // 6) Verify session exists and belongs to user
    const { data: session, error: sessErr } = await supabase
      .from("design_sessions")
      .select("id, envelope_id, user_id")
      .eq("id", sessionId)
      .single();

    if (sessErr || !session) {
      console.error("[generate-variants] Session not found:", sessErr?.message);
      return jsonError(404, "SESSION_NOT_FOUND", "Design session not found");
    }

    if (session.user_id !== userId) {
      return jsonError(403, "FORBIDDEN", "Not authorized to access this session");
    }

    // 7) Load envelope data
    const { data: envelope, error: envErr } = await supabase
      .from("regulatory_envelopes")
      .select("id, height_cap_ft, far_cap, coverage_cap_pct, setbacks, status, application_id")
      .eq("id", envelopeId)
      .single();

    if (envErr || !envelope) {
      console.error("[generate-variants] Envelope not found:", envErr?.message);
      return jsonError(404, "ENVELOPE_NOT_FOUND", "Regulatory envelope not found");
    }

    if (envelope.status !== "ready") {
      return jsonError(400, "ENVELOPE_NOT_READY", "Envelope computation is still pending");
    }

    const applicationId = envelope.application_id;
    if (!applicationId) {
      return jsonError(500, "NO_APPLICATION", "Could not determine application for envelope");
    }

    // 8) Create job record
    const { data: job, error: jobErr } = await supabase
      .from("design_jobs")
      .insert({
        job_type: "variant_generate",
        status: "running",
        application_id: applicationId,
        envelope_id: envelopeId,
        session_id: sessionId,
        idempotency_key: idempotencyKey,
        attempt: 1,
        input_json: { intent, options: { maxVariants, replaceExisting } },
      })
      .select()
      .single();

    if (jobErr) {
      // Might be a conflict - check if job was created by another request
      console.error("[generate-variants] Failed to create job:", jobErr.message);
      
      const { data: conflictJob } = await supabase
        .from("design_jobs")
        .select("id, status")
        .eq("job_type", "variant_generate")
        .eq("idempotency_key", idempotencyKey)
        .single();
      
      if (conflictJob) {
        return jsonOk({
          ok: true,
          pending: true,
          jobId: conflictJob.id,
          status: conflictJob.status,
        });
      }
      
      return jsonError(500, "JOB_CREATE_FAILED", jobErr.message);
    }

    console.log("[generate-variants] Job created:", job.id);

    try {
      // 9) Generate variants
      const generatedVariants = generateVariantsFromIntent(
        {
          heightCapFt: envelope.height_cap_ft ?? 35,
          farCap: envelope.far_cap ?? 1.0,
          coverageCapPct: envelope.coverage_cap_pct ?? 50,
          setbacks: (envelope.setbacks as Record<string, number>) ?? {},
        },
        intent,
        maxVariants
      );

      // 10) Delete existing variants if replaceExisting
      if (replaceExisting) {
        await supabase
          .from("design_variants")
          .delete()
          .eq("session_id", sessionId);
      }

      // 11) Insert new variants atomically
      const variantsToInsert = generatedVariants.map((v) => ({
        session_id: sessionId,
        name: v.name,
        strategy: v.strategy,
        footprint_geojson: v.footprint_geojson,
        metrics: v.metrics,
      }));

      const { data: insertedVariants, error: insertErr } = await supabase
        .from("design_variants")
        .insert(variantsToInsert)
        .select("id, name");

      if (insertErr) {
        throw new Error(`Failed to insert variants: ${insertErr.message}`);
      }

      // 12) Set first variant as active
      if (insertedVariants && insertedVariants.length > 0) {
        await supabase
          .from("design_sessions")
          .update({ active_variant_id: insertedVariants[0].id })
          .eq("id", sessionId);
      }

      // 13) Update design intent on session
      await supabase
        .from("design_sessions")
        .update({ design_intent: intent })
        .eq("id", sessionId);

      // 14) Complete the job
      const outputJson = {
        variantIds: insertedVariants?.map((v) => v.id) ?? [],
        variantCount: insertedVariants?.length ?? 0,
        completedAt: new Date().toISOString(),
      };

      await supabase.rpc("complete_design_job", {
        p_job_id: job.id,
        p_output: outputJson,
      });

      console.log("[generate-variants] Generation complete, variants:", insertedVariants?.length);

      return jsonOk({
        ok: true,
        jobId: job.id,
        variants: insertedVariants,
        activeVariantId: insertedVariants?.[0]?.id ?? null,
      });

    } catch (genErr) {
      // 15) Mark job as failed with retry backoff
      console.error("[generate-variants] Generation failed:", genErr);

      await supabase.rpc("fail_design_job", {
        p_job_id: job.id,
        p_error: {
          message: genErr instanceof Error ? genErr.message : "Unknown error",
          timestamp: new Date().toISOString(),
        },
      });

      return jsonError(500, "GENERATION_FAILED", genErr instanceof Error ? genErr.message : "Unknown error");
    }

  } catch (err) {
    console.error("[generate-variants] Unexpected error:", err);
    return jsonError(500, "INTERNAL_ERROR", err instanceof Error ? err.message : "Unknown error");
  }
});
