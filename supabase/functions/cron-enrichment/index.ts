// deno-lint-ignore-file no-explicit-any
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CONFIG
const MAX_CONCURRENT = 3;          // number of simultaneous enrichments
const STALE_DAYS = 30;             // how old before re-enrichment
const MAX_BATCH_SIZE = 20;         // max apps per run
const ENRICH_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/enrich-application`;

async function getTargets() {
  const now = new Date().toISOString();

  const { data, error } = await sbAdmin
    .from("applications")
    .select("id, status, status_rev, next_run_at")
    .or(`status.in.(queued,enriching,ai,rendering),and(status.eq.error,next_run_at.lte.${now})`)
    .lte("next_run_at", now)
    .order("next_run_at", { ascending: true })
    .limit(MAX_BATCH_SIZE);

  if (error) throw new Error(`Fetch apps: ${error.message}`);
  return data || [];
}

async function callEnrich(app_id: string) {
  const url = `${SUPABASE_URL}/functions/v1/orchestrate-application?application_id=${app_id}`;
  console.log(`[cron-enrichment] Calling orchestrator: ${url}`);
  
  const res = await fetch(url, {
    method: "POST",
    headers: { 
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
  });
  
  const body = await res.text();
  let json: any = null;
  try { 
    json = JSON.parse(body); 
  } catch { 
    json = { raw: body }; 
  }
  
  return { ok: res.ok, status: res.status, json };
}

async function recordJob(application_id: string, status: "success"|"error", payload: any) {
  const insert = {
    application_id,
    job_status: status,
    provider_calls: payload?.summary?.calls ?? null,
    error_message: status === "error" ? String(payload?.error ?? payload) : null,
    finished_at: new Date().toISOString(),
  };
  
  const { error } = await sbAdmin.from("jobs_enrichment").insert(insert);
  if (error) {
    console.error(`[cron-enrichment] Failed to record job: ${error.message}`);
  }
}

async function run() {
  console.log("[cron-enrichment] Starting enrichment cron job");
  
  const targets = await getTargets();
  console.log(`[cron-enrichment] Found ${targets.length} applications to enrich`);
  
  if (targets.length === 0) {
    return new Response(JSON.stringify({ ok: true, message: "No applications need enrichment" }), { 
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }

  const queue = [...targets];
  const results: any[] = [];

  // Simple concurrency pool
  async function worker() {
    while (queue.length > 0) {
      const app = queue.shift();
      if (!app) break;
      
      console.log(`[cron-enrichment] Processing application ${app.id}`);
      
      try {
        const { ok, json } = await callEnrich(app.id);
        if (ok) {
          await recordJob(app.id, "success", json);
          results.push({ id: app.id, ok: true });
          console.log(`[cron-enrichment] Successfully orchestrated ${app.id}`);
        } else {
          await recordJob(app.id, "error", json);
          results.push({ id: app.id, ok: false, error: json });
          console.error(`[cron-enrichment] Failed to orchestrate ${app.id}: ${JSON.stringify(json)}`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await recordJob(app.id, "error", { error: errorMsg });
        results.push({ id: app.id, error: errorMsg });
        console.error(`[cron-enrichment] Exception orchestrating ${app.id}: ${errorMsg}`);
      }
    }
  }

  const workers = Array.from({ length: MAX_CONCURRENT }, worker);
  await Promise.all(workers);

  console.log(`[cron-enrichment] Completed enrichment job. Processed ${results.length} applications`);
  return new Response(JSON.stringify({ ok: true, processed: results }, null, 2), {
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    return await run();
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[cron-enrichment] Fatal error:", errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), { 
      status: 500, 
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }
});
