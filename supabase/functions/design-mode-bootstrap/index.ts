import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// Types
// ============================================================================

interface BootstrapRequest {
  applicationId: string;
  client?: {
    appVersion?: string;
    commitSha?: string;
    tz?: string;
  };
  options?: {
    ensureEnvelope?: boolean;
    ensureSession?: boolean;
    includeVariants?: boolean;
    includeIntent?: boolean;
    includeTemplates?: boolean;
    createIfMissing?: boolean;
    forceRecomputeEnvelope?: boolean;
    envelopeSourceVersion?: {
      parcelVersion?: string | null;
      zoningVersion?: string | null;
      overlaysVersion?: string | null;
    };
  };
}

interface BootstrapResponse {
  ok: boolean;
  code?: string;
  message?: string;
  auth?: {
    userId: string;
    orgId: string | null;
    role: string | null;
  };
  application?: {
    id: string;
    parcelId: string | null;
    address: string | null;
    jurisdiction: string | null;
  };
  parcel?: {
    id: string | null;
    geometry: unknown | null;
    areaSqFt: number | null;
    areaAcres: number | null;
  };
  envelope?: {
    id: string | null;
    status: "ready" | "pending" | "failed" | null;
    version: number | null;
    confidenceGrade: string | null;
    data: {
      heightCapFt: number;
      farCap: number;
      coverageCapPct: number;
      setbacks: Record<string, number>;
    } | null;
    sourceVersions: {
      parcelVersion: string | null;
      zoningVersion: string | null;
      overlaysVersion: string | null;
    } | null;
    job: {
      id: string | null;
      status: string | null;
      attempt: number;
      error: unknown | null;
    } | null;
  };
  session?: {
    id: string | null;
    status: string | null;
    activeVariantId: string | null;
    createdAt: string | null;
  };
  intent?: {
    id: string | null;
    data: Record<string, unknown>;
    updatedAt: string | null;
  } | null;
  variants?: Array<{
    id: string;
    name: string;
    strategy: string | null;
    footprint: unknown;
    heightFt: number | null;
    floors: number | null;
    score: Record<string, number> | null;
    createdAt: string;
  }>;
  telemetry?: {
    bootstrapMs: number;
    cache: {
      envelopeHit: boolean;
      sessionHit: boolean;
    };
  };
}

// ============================================================================
// Helpers
// ============================================================================

function jsonOk(payload: BootstrapResponse): Response {
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

// ============================================================================
// Main Handler
// ============================================================================

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const t0 = Date.now();
  console.log("[design-mode-bootstrap] Request received");

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
      console.error("[design-mode-bootstrap] Auth failed:", userErr?.message);
      return jsonError(401, "AUTH_REQUIRED", "Authentication required");
    }

    const userId = userData.user.id;
    console.log("[design-mode-bootstrap] User authenticated:", userId);

    // 3) Parse request body
    let body: BootstrapRequest;
    try {
      body = await req.json();
    } catch {
      return jsonError(400, "INVALID_REQUEST", "Invalid JSON body");
    }

    const { applicationId } = body;
    if (!applicationId) {
      return jsonError(400, "MISSING_APPLICATION_ID", "applicationId is required");
    }

    // Merge options with defaults
    const opt = {
      ensureEnvelope: true,
      ensureSession: true,
      includeVariants: true,
      includeIntent: true,
      includeTemplates: false,
      createIfMissing: true,
      forceRecomputeEnvelope: false,
      envelopeSourceVersion: {
        parcelVersion: null as string | null,
        zoningVersion: null as string | null,
        overlaysVersion: null as string | null,
      },
      ...(body.options || {}),
    };

    console.log("[design-mode-bootstrap] Options:", JSON.stringify(opt));

    // 4) Load application (with ownership check via RLS)
    const { data: app, error: appErr } = await supabase
      .from("applications")
      .select("id, parcel_id, formatted_address, city, county, zoning_code")
      .eq("id", applicationId)
      .single();

    if (appErr || !app) {
      console.error("[design-mode-bootstrap] Application not found:", appErr?.message);
      return jsonError(404, "APPLICATION_NOT_FOUND", "Application not found or access denied");
    }

    console.log("[design-mode-bootstrap] Application loaded:", app.id);

    // 5) Load parcel geometry if available
    let parcel: { id: string | null; geometry: unknown | null; areaSqFt: number | null; areaAcres: number | null } = {
      id: null,
      geometry: null,
      areaSqFt: null,
      areaAcres: null,
    };

    if (app.parcel_id) {
      const { data: parcelRow } = await supabase
        .from("parcels")
        .select("parcel_uuid, geom_geojson, area_sqft, acreage")
        .eq("parcel_uuid", app.parcel_id)
        .single();

      if (parcelRow) {
        parcel = {
          id: parcelRow.parcel_uuid,
          geometry: parcelRow.geom_geojson,
          areaSqFt: parcelRow.area_sqft,
          areaAcres: parcelRow.acreage,
        };
      }
    }

    // 6) Ensure regulatory envelope via RPC (idempotent, advisory-locked)
    let envelope: BootstrapResponse["envelope"] = {
      id: null,
      status: null,
      version: null,
      confidenceGrade: null,
      data: null,
      sourceVersions: null,
      job: null,
    };
    let envelopeCacheHit = false;

    if (opt.ensureEnvelope) {
      console.log("[design-mode-bootstrap] Calling ensure_regulatory_envelope RPC");
      
      const { data: envResult, error: envErr } = await supabase.rpc("ensure_regulatory_envelope", {
        p_application_id: applicationId,
        p_parcel_id: app.parcel_id,
        p_force_recompute: opt.forceRecomputeEnvelope,
        p_parcel_version: opt.envelopeSourceVersion?.parcelVersion ?? null,
        p_zoning_version: opt.envelopeSourceVersion?.zoningVersion ?? null,
        p_overlays_version: opt.envelopeSourceVersion?.overlaysVersion ?? null,
        p_create_if_missing: opt.createIfMissing,
      });

      if (envErr) {
        console.error("[design-mode-bootstrap] ensure_regulatory_envelope failed:", envErr.message);
        return jsonError(500, "ENVELOPE_ENSURE_FAILED", envErr.message);
      }

      console.log("[design-mode-bootstrap] Envelope RPC result:", JSON.stringify(envResult));

      if (envResult?.error) {
        return jsonError(404, envResult.error, "Envelope not found and createIfMissing is false");
      }

      envelopeCacheHit = envResult?.cache_hit === true;

      if (envResult?.envelope) {
        const env = envResult.envelope;
        envelope = {
          id: env.id,
          status: env.status,
          version: env.version,
          confidenceGrade: env.confidence_grade,
          data: env.status === "ready" ? {
            heightCapFt: env.height_cap_ft ?? 0,
            farCap: env.far_cap ?? 0,
            coverageCapPct: env.coverage_cap_pct ?? 0,
            setbacks: env.setbacks ?? {},
          } : null,
          sourceVersions: env.source_versions ?? null,
          job: envResult.job ? {
            id: envResult.job.id,
            status: envResult.job.status,
            attempt: envResult.job.attempt ?? 0,
            error: envResult.job.error,
          } : null,
        };
      }
    }

    // 7) Ensure design session via RPC (idempotent, advisory-locked)
    let session: BootstrapResponse["session"] = {
      id: null,
      status: null,
      activeVariantId: null,
      createdAt: null,
    };
    let sessionCacheHit = false;

    if (opt.ensureSession && envelope.id && envelope.status === "ready") {
      console.log("[design-mode-bootstrap] Calling ensure_design_session RPC");

      const { data: sessResult, error: sessErr } = await supabase.rpc("ensure_design_session", {
        p_application_id: applicationId,
        p_envelope_id: envelope.id,
        p_envelope_version: envelope.version ?? 1,
        p_create_if_missing: opt.createIfMissing,
      });

      if (sessErr) {
        console.error("[design-mode-bootstrap] ensure_design_session failed:", sessErr.message);
        return jsonError(500, "SESSION_ENSURE_FAILED", sessErr.message);
      }

      console.log("[design-mode-bootstrap] Session RPC result:", JSON.stringify(sessResult));

      if (sessResult?.error) {
        if (sessResult.error === "AUTH_REQUIRED") {
          return jsonError(401, "AUTH_REQUIRED", "Authentication required for session");
        }
        return jsonError(404, sessResult.error, "Session not found");
      }

      sessionCacheHit = sessResult?.is_new === false;

      if (sessResult?.session) {
        const sess = sessResult.session;
        session = {
          id: sess.id,
          status: sess.status,
          activeVariantId: sess.active_variant_id,
          createdAt: sess.created_at,
        };
      }
    }

    // 8) Load intent if requested
    let intent: BootstrapResponse["intent"] = null;

    if (opt.includeIntent && session.id) {
      const { data: intentRow } = await supabase
        .from("design_sessions")
        .select("design_intent")
        .eq("id", session.id)
        .single();

      if (intentRow?.design_intent) {
        intent = {
          id: session.id,
          data: intentRow.design_intent as Record<string, unknown>,
          updatedAt: null,
        };
      }
    }

    // 9) Load variants if requested
    let variants: BootstrapResponse["variants"] = [];

    if (opt.includeVariants && session.id) {
      const { data: variantRows } = await supabase
        .from("design_variants")
        .select("id, name, strategy, footprint_geojson, metrics, created_at")
        .eq("session_id", session.id)
        .order("created_at", { ascending: true });

      if (variantRows) {
        variants = variantRows.map((v) => {
          const metrics = v.metrics as Record<string, unknown> | null;
          return {
            id: v.id,
            name: v.name,
            strategy: v.strategy,
            footprint: v.footprint_geojson,
            heightFt: (metrics?.heightFt as number) ?? null,
            floors: (metrics?.floors as number) ?? null,
            score: metrics?.score ? (metrics.score as Record<string, number>) : null,
            createdAt: v.created_at,
          };
        });
      }
    }

    // 10) Build response
    const ms = Date.now() - t0;
    console.log(`[design-mode-bootstrap] Completed in ${ms}ms`);

    const response: BootstrapResponse = {
      ok: true,
      auth: {
        userId,
        orgId: null,
        role: null,
      },
      application: {
        id: app.id,
        parcelId: app.parcel_id,
        address: app.formatted_address,
        jurisdiction: app.city || app.county,
      },
      parcel,
      envelope,
      session,
      intent,
      variants,
      telemetry: {
        bootstrapMs: ms,
        cache: {
          envelopeHit: envelopeCacheHit,
          sessionHit: sessionCacheHit,
        },
      },
    };

    return jsonOk(response);

  } catch (err) {
    console.error("[design-mode-bootstrap] Unexpected error:", err);
    return jsonError(500, "INTERNAL_ERROR", err instanceof Error ? err.message : "Unknown error");
  }
});
