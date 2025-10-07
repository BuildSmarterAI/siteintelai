// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function (Deno) — Enrich a single application from utility_endpoints catalog
// Endpoint: POST /functions/v1/enrich-application?application_id=UUID
// Optional: &dry_run=true (skips DB writes, logs responses)

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Sb = ReturnType<typeof createClient>;
type EndpointRow = {
  provider_name: string;
  provider_type: "parcel" | "flood" | "traffic" | "utility" | string;
  url: string;               // should end with /query or API endpoint
  geometry_type?: string;    // esriGeometryPoint|Polyline|Polygon|Envelope
  out_fields?: string[];     // requested attributes
  is_arcgis?: boolean;       // if true, use ArcGIS query builder
  enabled?: boolean;
};

type AppRow = {
  id: string;
  geo_lat: number | null;
  geo_lng: number | null;
  formatted_address: string | null;
  property_address: Record<string, any> | null;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  global: { headers: { "x-application-name": "enrich-application" } },
});

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", ...corsHeaders };

// ---------- Utilities

function assertUUID(v: string | null): asserts v is string {
  if (!v || !/^[0-9a-f-]{36}$/i.test(v)) {
    throw new Response(JSON.stringify({ error: "application_id missing/invalid" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }
}

function firstFeatureAttributes(payload: any): Record<string, any> | null {
  // ArcGIS FeatureServer "features": [{ attributes, geometry }]
  if (!payload) return null;
  if (Array.isArray(payload.features) && payload.features.length > 0) {
    return payload.features[0]?.attributes ?? null;
  }
  // Some APIs return `data` or `results`; keep flexible:
  if (Array.isArray(payload.data) && payload.data.length > 0) return payload.data[0];
  if (Array.isArray(payload.results) && payload.results.length > 0) return payload.results[0];
  return null;
}

function makeArcGisQueryURL(ep: EndpointRow, lng: number, lat: number) {
  const base = ep.url;
  const outFields = (ep.out_fields?.length ? ep.out_fields.join(",") : "*");
  const params = new URLSearchParams({
    f: "json",
    geometry: `${lng},${lat}`,           // point syntax
    geometryType: ep.geometry_type || "esriGeometryPoint",
    spatialRel: "esriSpatialRelIntersects",
    returnGeometry: "false",
    outFields,
  });
  return `${base}?${params.toString()}`;
}

async function httpJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, headers: { ...(init?.headers ?? {}), "accept": "application/json" } });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* keep raw text if not JSON */ }
  return { ok: res.ok, status: res.status, json: json ?? { raw: text } };
}

// ---------- DB helpers

async function getApplication(sb: Sb, id: string): Promise<AppRow> {
  const { data, error } = await sb.from("applications")
    .select("id, geo_lat, geo_lng, formatted_address, property_address")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) throw new Error(`Application not found: ${error?.message ?? "not found"}`);
  return data as AppRow;
}

async function getEndpoints(sb: Sb): Promise<EndpointRow[]> {
  const { data, error } = await sb.from("utility_endpoints")
    .select("provider_name, provider_type, url, geometry_type, out_fields, is_arcgis, enabled")
    .order("provider_name");
  if (error) throw new Error(`utility_endpoints: ${error.message}`);
  return (data ?? []).filter((r: any) => r.enabled !== false) as EndpointRow[];
}

async function insertRaw(sb: Sb, application_id: string, source: string, run_url: string, payload: any) {
  return sb.from("enrichment_raw").insert({
    application_id, source, run_url, status: "complete", payload
  });
}

async function upsertParcelFromAttributes(sb: Sb, application_id: string, provider: string, attrs: Record<string, any>) {
  // Minimal normalizer across HCAD / FBCAD / Unified
  const normalized = {
    application_id,
    parcel_id: attrs.HCAD_NUM ?? attrs.QuickRefID ?? attrs.PropertyNumber ?? attrs.TAX_ID ?? null,
    address: attrs.Site_addr_1 ?? attrs.Situs ?? attrs.ADDRESS ?? null,
    city: attrs.OWNERCITY ?? null,
    county: attrs.COUNTY ?? attrs.site_county ?? null,
    zipcode: attrs.OWNERZIP ?? attrs.ZIPCODE ?? attrs.site_zip ?? null,
    legal: attrs.LEGAL ?? attrs.Legal ?? attrs.Legal_Dscr_1 ?? null,
    lot_size_value: (attrs.LANDSIZEAC ?? attrs.ACREAGE ?? attrs.Total_Land_Area ?? null),
    lot_size_unit: attrs.LANDSIZEAC ? "acres" : (attrs.ACREAGE ? "acres" : (attrs.Total_Land_Area ? "sqft" : null)),
    owner: attrs.OWNER ?? attrs.OwnerName ?? null,
    owner_address: (() => {
      const line = [attrs.OwnerAddress1, attrs.OwnerCity, attrs.OwnerState, attrs.OwnerZip].filter(Boolean).join(", ");
      return line || attrs.OWNER_ADDRESS || null;
    })(),
    source_layer: provider.includes("HCAD") ? "HCAD" : (provider.includes("FBCAD") ? "FBCAD" : (provider.includes("Unified") ? "Unified" : "Other")),
    attributes: attrs ?? {},
  };

  await sb.from("parcels").upsert(normalized, { onConflict: "application_id" });
}

async function upsertOverlays(sb: Sb, application_id: string, patch: Partial<Record<string, any>>) {
  // Merge patch into overlays row; create if missing
  const { data: existing } = await sb.from("overlays").select("application_id").eq("application_id", application_id).maybeSingle();
  if (!existing) {
    await sb.from("overlays").insert({ application_id, ...patch });
  } else {
    await sb.from("overlays").update({ ...patch }).eq("application_id", application_id);
  }
}

// ---------- Provider-specific parsers (simple, extend as needed)

function parseFlood(attrs: Record<string, any>) {
  return {
    floodplain_zone: attrs.FLD_ZONE ?? attrs.floodZone ?? null,
    base_flood_elevation: Number(attrs.BFE ?? attrs.base_flood_elevation ?? null) || null,
  };
}

function parseTraffic(attrs: Record<string, any>) {
  return {
    traffic_aadt: Number(attrs.AADT ?? attrs.aadt ?? null) || null,
    traffic_segment_id: String(attrs.SEGMENT_ID ?? attrs.segment_id ?? attrs.segmentid ?? ""),
    nearest_highway: (attrs.ROADWAY ?? attrs.roadName ?? null),
  };
}

function parseUtilityLine(attrs: Record<string, any>) {
  // return one item; caller will push into arrays
  return {
    diameter: String(attrs.DIAMETER ?? attrs.diameter ?? ""),
    length: Number(attrs.LENGTH ?? attrs.length ?? null) || null,
    material: String(attrs.MATERIAL ?? attrs.material ?? ""),
    status: String(attrs.OWNER ?? attrs.status ?? ""),
  };
}

// ---------- Handler

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Use POST" }), { status: 405, headers: JSON_HEADERS });
    }

    const url = new URL(req.url);
    const application_id = url.searchParams.get("application_id");
    const dryRun = url.searchParams.get("dry_run") === "true";
    assertUUID(application_id);

    console.log(`[enrich-application] Starting enrichment for ${application_id}, dry_run=${dryRun}`);

    const app = await getApplication(sbAdmin, application_id);
    const lat = app.geo_lat ?? Number(app.property_address?.lat ?? NaN);
    const lng = app.geo_lng ?? Number(app.property_address?.lng ?? NaN);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return new Response(JSON.stringify({ error: "Application missing geo_lat/geo_lng" }), { status: 400, headers: JSON_HEADERS });
    }

    const endpoints = await getEndpoints(sbAdmin);
    console.log(`[enrich-application] Found ${endpoints.length} endpoints to query`);
    const summary: Record<string, any> = { application_id, centroid: { lat, lng }, calls: [] };

    for (const ep of endpoints) {
      try {
        let runUrl = ep.url;
        if (ep.is_arcgis !== false) runUrl = makeArcGisQueryURL(ep, lng, lat);

        console.log(`[enrich-application] Calling ${ep.provider_name}: ${runUrl}`);
        const { ok, status, json } = await httpJSON(runUrl);
        summary.calls.push({ provider: ep.provider_name, status, ok });

        if (!ok) {
          console.error(`[enrich-application] ${ep.provider_name} failed: ${status}`);
          if (!dryRun) await insertRaw(sbAdmin, application_id, ep.provider_name, runUrl, { error: json });
          continue;
        }

        if (!dryRun) await insertRaw(sbAdmin, application_id, ep.provider_name, runUrl, json);

        // Extract attributes & route to upserts
        const attrs = firstFeatureAttributes(json);
        if (!attrs) {
          console.log(`[enrich-application] ${ep.provider_name} returned no features`);
          continue;
        }

        switch (ep.provider_type) {
          case "parcel": {
            console.log(`[enrich-application] Upserting parcel data from ${ep.provider_name}`);
            if (!dryRun) await upsertParcelFromAttributes(sbAdmin, application_id, ep.provider_name, attrs);
            break;
          }
          case "flood": {
            const floodPatch = parseFlood(attrs);
            console.log(`[enrich-application] Upserting flood data: ${JSON.stringify(floodPatch)}`);
            if (!dryRun) await upsertOverlays(sbAdmin, application_id, floodPatch);
            break;
          }
          case "traffic": {
            const trafficPatch = parseTraffic(attrs);
            console.log(`[enrich-application] Upserting traffic data: ${JSON.stringify(trafficPatch)}`);
            if (!dryRun) await upsertOverlays(sbAdmin, application_id, trafficPatch);
            break;
          }
          case "utility": {
            const item = parseUtilityLine(attrs);
            // Get current arrays and append
            const { data: ov } = await sbAdmin.from("overlays")
              .select("water_lines, sewer_lines, storm_lines")
              .eq("application_id", application_id)
              .maybeSingle();

            const wl = Array.isArray(ov?.water_lines) ? ov!.water_lines : [];
            const sl = Array.isArray(ov?.sewer_lines) ? ov!.sewer_lines : [];
            const st = Array.isArray(ov?.storm_lines) ? ov!.storm_lines : [];

            // Simple heuristic: if material mentions "storm"/"sewer"/else
            const mat = (item.material || "").toLowerCase();
            if (mat.includes("storm")) st.push(item);
            else if (mat.includes("sewer")) sl.push(item);
            else wl.push(item);

            console.log(`[enrich-application] Upserting utility lines (water=${wl.length}, sewer=${sl.length}, storm=${st.length})`);
            if (!dryRun) await upsertOverlays(sbAdmin, application_id, {
              water_lines: wl, sewer_lines: sl, storm_lines: st,
            });
            break;
          }
          default:
            console.log(`[enrich-application] Unknown provider_type: ${ep.provider_type}, skipping normalization`);
            break;
        }
      } catch (inner) {
        console.error(`[enrich-application] Error processing ${ep.provider_name}:`, inner);
        summary.calls.push({ provider: ep.provider_name, error: String(inner) });
      }
    }

    console.log(`[enrich-application] Enrichment complete for ${application_id}`);
    return new Response(JSON.stringify({ ok: true, summary }, null, 2), { status: 200, headers: JSON_HEADERS });

  } catch (err) {
    console.error("[enrich-application] Fatal error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: JSON_HEADERS });
  }
});
