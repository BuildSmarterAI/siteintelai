# API Integration Mapping - BuildSmarter Feasibility Platform

**Last Updated:** 2025-10-07  
**Project ID:** mcmfwlgovubpdcfiqfvk  
**Environment:** Production

---

## 🎯 Overview

This document maps all API integrations, edge functions, and data flows in the BuildSmarter feasibility analysis platform. The system orchestrates Google Places API, ArcGIS REST Services, and internal enrichment pipelines to deliver comprehensive property feasibility reports.

---

## 📡 External API Integrations

### 1. Google Places API
**Purpose:** Address autocomplete and geocoding  
**Endpoints Used:**
- `/maps/api/place/autocomplete/json` - Address suggestions
- `/maps/api/place/details/json` - Detailed place information

**Edge Functions:**
- `google-places` - Handles autocomplete requests
- `google-place-details` - Fetches detailed place data

**Authentication:** API Key (`GOOGLE_PLACES_API_KEY`)  
**Rate Limits:** Standard Google Maps Platform limits  
**Data Flow:**
```
Client → google-places → Google Places API → Response
       ↓
   Address suggestions displayed
       ↓
Client → google-place-details → Google Places API → Response
       ↓
   Geocoded address + components stored
```

**Response Schema:**
```typescript
{
  formatted_address: string,
  geometry: {
    location: { lat: number, lng: number },
    viewport: { northeast: {...}, southwest: {...} }
  },
  address_components: [
    { long_name: string, short_name: string, types: string[] }
  ],
  place_id: string
}
```

---

### 2. ArcGIS REST Services (Dynamic Catalog)

**Purpose:** Geospatial enrichment for parcels, flood zones, traffic, utilities  
**Architecture:** Catalog-driven via `utility_endpoints` table

#### Registered Endpoints (in `utility_endpoints` table):

| Provider Name | Type | URL | Geometry Type | Status |
|--------------|------|-----|---------------|--------|
| HCAD Parcels | parcel | `https://maps.hcad.org/arcgis/rest/services/Parcels/MapServer/0/query` | esriGeometryPolygon | Active |
| FBCAD Parcels | parcel | `https://gisweb.fbcad.org/arcgis/rest/services/Hosted/FBCAD_Public_Data/FeatureServer/0/query` | esriGeometryPolygon | Active |
| Unified Parcels | parcel | `https://services2.arcgis.com/.../Unified_Parcels/FeatureServer/7/query` | esriGeometryPolygon | Active |
| FEMA NFHL Flood Zones | flood | `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query` | esriGeometryPolygon | Active |
| TxDOT AADT Segments | traffic | `https://gis-txdot.opendata.arcgis.com/datasets/txdot::aadt-traffic-counts/api` | esriGeometryPolyline | Active |
| Houston Water - Force Mains | utility | `https://gis.houstontx.gov/arcgis/rest/services/Water/Force_Mains/FeatureServer/24/query` | esriGeometryPolyline | Active |
| FCC Broadband Map | utility | `https://broadbandmap.fcc.gov/api/nationwide` | esriGeometryPolygon | Active |

**Query Pattern:**
```http
GET {url}?f=json
  &geometry={lng},{lat}
  &geometryType=esriGeometryPoint
  &spatialRel=esriSpatialRelIntersects
  &returnGeometry=false
  &outFields={comma-separated-fields}
```

**Edge Functions:**
- `enrich-application` - Orchestrates all ArcGIS queries for a single application
- `cron-enrichment` - Batch processor for stale/pending applications

**Authentication:** None (public endpoints) or per-endpoint API keys  
**Rate Limits:** Provider-specific (typically 100-1000 req/min)

**Data Flow:**
```
enrich-application
  ↓
Load utility_endpoints catalog
  ↓
For each endpoint:
  → Build ArcGIS query URL
  → Fetch data
  → Parse attributes via provider_type
  ↓
Upsert into parcels/overlays tables
  ↓
Log raw response in enrichment_raw
```

**Response Schema (ArcGIS Feature):**
```typescript
{
  features: [
    {
      attributes: {
        HCAD_NUM?: string,
        Site_addr_1?: string,
        FLD_ZONE?: string,
        AADT?: number,
        // ... provider-specific fields
      },
      geometry?: {...}
    }
  ]
}
```

---

### 3. Internal Enrichment Pipeline

**Purpose:** Orchestrate multi-source data collection and normalization

#### Edge Function: `enrich-feasibility`
**HTTP Method:** POST  
**Endpoint:** `/functions/v1/enrich-feasibility`  
**Auth:** Public (verify_jwt = false)

**Input:**
```typescript
{
  address: string  // Formatted address from Google Places
}
```

**Output:**
```typescript
{
  success: boolean,
  county: string,
  data: {
    geo_lat: number,
    geo_lng: number,
    parcel_id?: string,
    zoning_code?: string,
    floodplain_zone?: string,
    traffic_aadt?: number,
    population_1mi?: number,
    // ... 50+ enrichment fields
  },
  data_flags: string[]  // e.g., ["parcel_not_found", "zoning_not_found"]
}
```

**Data Sources:**
1. Google Places (geocoding)
2. USGS Elevation API
3. USDA Soil Survey (SSURGO)
4. Census ACS 5-year estimates
5. TxDOT traffic data
6. County parcel layers (via ArcGIS)
7. FEMA NFHL (flood zones)

**Orchestration:**
```
Client submits address
  ↓
enrich-feasibility
  ↓
[Parallel calls to 7+ external APIs]
  ↓
Normalize and merge results
  ↓
Return unified JSON payload
  ↓
Client displays enriched data in form
```

---

#### Edge Function: `enrich-application`
**HTTP Method:** POST  
**Endpoint:** `/functions/v1/enrich-application?application_id={uuid}`  
**Query Params:**
- `application_id` (required) - UUID of application
- `dry_run` (optional) - If "true", skips DB writes

**Auth:** Public (verify_jwt = false)

**Process:**
1. Load application (lat/lng)
2. Load `utility_endpoints` catalog
3. For each endpoint:
   - Build ArcGIS query URL
   - Fetch data
   - Parse via provider_type (parcel/flood/traffic/utility)
   - Upsert to `parcels` or `overlays` tables
   - Log raw response to `enrichment_raw`
4. Return summary

**Output:**
```typescript
{
  ok: boolean,
  summary: {
    application_id: string,
    centroid: { lat: number, lng: number },
    calls: [
      { provider: string, status: number, ok: boolean }
    ]
  }
}
```

**DB Writes:**
- `enrichment_raw` - Raw API responses (audit trail)
- `parcels` - Normalized parcel data
- `overlays` - Flood/traffic/utilities/zoning indicators

---

#### Edge Function: `cron-enrichment`
**HTTP Method:** POST  
**Endpoint:** `/functions/v1/cron-enrichment`  
**Trigger:** Supabase Scheduler (cron: `0 */2 * * *` - every 2 hours)

**Auth:** Service Role (verify_jwt = false)

**Process:**
1. Query applications where:
   - `enrichment_status = 'pending'` OR
   - `updated_at < now() - 30 days`
2. For up to 20 applications:
   - Call `enrich-application` (via internal HTTP)
   - Log result to `jobs_enrichment`
   - Update `enrichment_status` to "completed" or "error"
3. Use worker pool (MAX_CONCURRENT = 3)

**Output:**
```typescript
{
  ok: boolean,
  processed: [
    { id: string, ok: boolean, error?: string }
  ]
}
```

**DB Writes:**
- `jobs_enrichment` - Job audit log
- `applications.enrichment_status` - Status updates
- `applications.updated_at` - Timestamp refresh

---

### 4. AI Report Generation

**Purpose:** Generate PDF feasibility reports via AI analysis

#### Edge Function: `generate-ai-report`
**HTTP Method:** POST  
**Endpoint:** `/functions/v1/generate-ai-report`  
**Auth:** Public (verify_jwt = false)

**Input:**
```typescript
{
  application_id: string,
  report_type: "quick_check" | "full_feasibility"
}
```

**Process:**
1. Load application + parcels + overlays data
2. Call Lovable AI Gateway (google/gemini-2.5-flash)
3. Extract structured JSON via tool calling
4. Generate PDF (optional)
5. Store in `reports` table + storage bucket

**Output:**
```typescript
{
  report_id: string,
  status: "generating" | "completed" | "failed",
  json_data: {
    executive_summary: {...},
    property_overview: {...},
    zoning: {...},
    utilities: {...},
    conclusion: {...}
  },
  pdf_url?: string,
  feasibility_score: number
}
```

**External APIs:**
- Lovable AI Gateway: `https://ai.gateway.lovable.dev/v1/chat/completions`
- Model: `google/gemini-2.5-flash` (free during promo period)

**Authentication:** `LOVABLE_API_KEY` (auto-provisioned)

---

#### Edge Function: `submit-application`
**HTTP Method:** POST  
**Endpoint:** `/functions/v1/submit-application`  
**Auth:** Public (verify_jwt = false)

**Input:** Full application form payload (50+ fields)

**Process:**
1. Validate required fields
2. Insert into `applications` table
3. Trigger webhook to Make.com (optional)
4. Return application ID

**Output:**
```typescript
{
  id: string,
  created_at: string,
  status: "success" | "error",
  message: string
}
```

**Webhook:**
- URL: `https://hook.us1.make.com/1a0o8mufqrhb6intqppg4drjnllcgw9k`
- Method: POST
- Payload: Full application data

---

## 🗄️ Database Schema

### Core Tables

#### `applications`
**Purpose:** Application intake and enrichment status  
**Row Count:** ~1,000+  
**Key Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK to profiles)
- `enrichment_status` (pending/completed/error)
- `geo_lat`, `geo_lng` (numeric)
- `formatted_address` (text)
- 130+ enrichment columns (to be deprecated)

**RLS Policies:**
- Users can view/update own applications
- Admins can view all
- Anonymous can insert (user_id IS NULL)

---

#### `parcels`
**Purpose:** Normalized parcel core data  
**Row Count:** ~1,000  
**Key Columns:**
- `application_id` (uuid, PK, FK to applications)
- `parcel_id` (text) - APN/Tax ID
- `address`, `city`, `county`, `zipcode` (text)
- `lot_size_value`, `lot_size_unit` (numeric, text)
- `owner`, `owner_address` (text)
- `source_layer` (HCAD/FBCAD/Unified/Other)
- `attributes` (jsonb) - Raw feature properties

**Indexes:**
- `parcels_parcel_id_idx` on `parcel_id`
- `parcels_county_idx` on `county`

**RLS:** TBD (currently service-role only)

---

#### `overlays`
**Purpose:** Flattened enrichment indicators  
**Row Count:** ~1,000  
**Key Columns:**
- `application_id` (uuid, PK, FK to applications)
- `zoning_code`, `overlay_district` (text)
- `floodplain_zone`, `base_flood_elevation` (text, numeric)
- `wetlands_type`, `soil_series` (text)
- `water_lines`, `sewer_lines`, `storm_lines` (jsonb arrays)
- `traffic_aadt`, `nearest_highway` (numeric, text)
- `demographics`, `employment_clusters` (jsonb)
- `opportunity_zone`, `enterprise_zone` (boolean)

**Indexes:**
- `overlays_zoning_idx` on `zoning_code`
- `overlays_aadt_idx` on `traffic_aadt`

**RLS:** TBD (currently service-role only)

---

#### `enrichment_raw`
**Purpose:** Audit trail of raw API responses  
**Row Count:** ~10,000+  
**Key Columns:**
- `application_id` (uuid)
- `source` (text) - Provider name
- `run_url` (text) - Full query URL
- `status` (text) - "complete"
- `payload` (jsonb) - Raw API response
- `created_at` (timestamptz)

**Use Cases:**
- Debugging API failures
- Replaying enrichment logic
- Compliance/audit

---

#### `jobs_enrichment`
**Purpose:** Cron job audit log  
**Row Count:** ~5,000+  
**Key Columns:**
- `id` (bigserial, PK)
- `application_id` (uuid, FK to applications)
- `started_at`, `finished_at` (timestamptz)
- `job_status` ("success" | "error")
- `provider_calls` (jsonb) - Summary of API calls
- `error_message` (text)

**Indexes:**
- `jobs_enrichment_app_idx` on `application_id`
- `jobs_enrichment_started_idx` on `started_at DESC`

**RLS:**
- Admins can view all logs

---

#### `reports`
**Purpose:** Generated feasibility reports  
**Row Count:** ~500+  
**Key Columns:**
- `id` (uuid, PK)
- `application_id` (uuid, FK to applications)
- `user_id` (uuid, FK to profiles)
- `report_type` ("quick_check" | "full_feasibility")
- `status` ("pending" | "generating" | "completed" | "failed")
- `json_data` (jsonb) - Structured report content
- `feasibility_score` (integer, 0-100)
- `pdf_url` (text) - Storage bucket URL

**RLS:**
- Users can view/insert own reports
- Admins can view all

**Constraints:**
- `reports_json_has_core_keys` - Ensures required JSON keys
- FK constraint to `applications(id)` on delete cascade

---

#### `utility_endpoints`
**Purpose:** ArcGIS endpoint catalog  
**Row Count:** ~10-20  
**Key Columns:**
- `id` (uuid, PK)
- `provider_name` (text) - Display name
- `provider_type` (parcel/flood/traffic/utility)
- `url` (text) - ArcGIS query endpoint
- `geometry_type` (esriGeometry*)
- `out_fields` (text[]) - Requested attributes
- `is_arcgis` (boolean, default true)
- `enabled` (boolean, default true)
- `notes` (text)

**Public Access:** Yes (view only)

---

### Supporting Tables

#### `profiles`
**Purpose:** Extended user metadata  
**Links:** `auth.users.id` → `profiles.id`  
**Key Columns:** `full_name`, `email`, `phone`, `company`

#### `user_roles`
**Purpose:** Role-based access control  
**Enum:** `app_role` (user | admin)

#### `user_subscriptions`
**Purpose:** Tier/usage tracking  
**Key Columns:** `tier_id`, `reports_used`, `quickchecks_used`

#### `credits_usage`
**Purpose:** Billing/cost tracking  
**Key Columns:** `report_type`, `cost`

---

## 🔄 Data Flow Diagrams

### Application Submission Flow
```
Client (Application Form)
  ↓
1. User types address → google-places → Google Places API
  ↓
2. User selects address → google-place-details → Google Places API
  ↓
3. Enrichment preview → enrich-feasibility → [7+ external APIs]
  ↓
4. User submits form → submit-application
  ↓
5. Write to applications table (enrichment_status = "pending")
  ↓
6. Webhook to Make.com (async)
  ↓
7. Redirect to /thank-you
```

---

### Automatic Enrichment Flow (Cron)
```
Supabase Scheduler (every 2 hours)
  ↓
cron-enrichment
  ↓
Query applications WHERE enrichment_status = 'pending'
  ↓
Worker Pool (3 concurrent)
  ↓
For each application:
  → enrich-application
    ↓
  Load utility_endpoints catalog
    ↓
  For each endpoint:
    → Query ArcGIS
    → Parse attributes
    → Upsert parcels/overlays
    → Log to enrichment_raw
  ↓
Update enrichment_status = "completed"
  ↓
Log to jobs_enrichment
```

---

### Report Generation Flow
```
Client requests report
  ↓
generate-ai-report
  ↓
Load application + parcels + overlays
  ↓
Call Lovable AI Gateway (google/gemini-2.5-flash)
  ↓
Tool calling → structured JSON
  ↓
(Optional) Generate PDF via template
  ↓
Upload to storage bucket "reports"
  ↓
Insert into reports table
  ↓
Return report ID + URL
```

---

## 🔐 Authentication & Security

### API Keys & Secrets
| Secret Name | Purpose | Access |
|------------|---------|--------|
| `GOOGLE_PLACES_API_KEY` | Google Places API | Edge functions |
| `LOVABLE_API_KEY` | Lovable AI Gateway | Edge functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin DB access | Edge functions |
| `SUPABASE_ANON_KEY` | Public DB access | Client + edge functions |

**Storage:** Supabase Secrets Manager (encrypted)

---

### Row-Level Security (RLS)
**Enabled on:** applications, reports, profiles, user_roles, parcels (planned), overlays (planned)

**Key Policies:**
- **applications:** Users can view/update own; admins view all; anonymous can insert
- **reports:** Users can view own; admins view all
- **jobs_enrichment:** Admin view only
- **parcels/overlays:** Service role only (to be expanded)

---

### Edge Function Security
**Public Functions (verify_jwt = false):**
- `enrich-feasibility`, `enrich-application`, `enrich-utilities`, `cron-enrichment`
- Reason: Called by internal systems or anonymous users

**Authenticated Functions:**
- `submit-application`, `google-places`, `google-place-details`
- Reason: Require user session

---

## 📊 Rate Limits & Quotas

### Google Places API
- **Autocomplete:** 100,000 requests/day (shared)
- **Place Details:** 100,000 requests/day (shared)
- **Billing:** Pay-as-you-go after free tier

**Mitigation:** Session tokens for autocomplete → details chains

---

### ArcGIS REST Services
**Varies by provider:**
- HCAD/FBCAD: ~100 req/min
- FEMA NFHL: ~1000 req/min
- TxDOT: Public, no hard limit

**Mitigation:**
- Cron batch size: 20 apps/run
- Concurrency: 3 workers
- Inter-request delay: Consider adding 1s sleep

---

### Lovable AI Gateway
**Rate Limits:**
- Per workspace: TBD (contact support@lovable.dev for increases)
- Free tier: Gemini models free until Oct 13, 2025
- Errors: 429 (rate limit), 402 (out of credits)

**Error Handling:**
```typescript
if (response.status === 429) {
  return { error: "Rate limits exceeded, please try again later." };
}
if (response.status === 402) {
  return { error: "Payment required, please add funds to your workspace." };
}
```

---

## 🧪 Testing & Monitoring

### Test Endpoints
**enrich-application dry run:**
```bash
curl -X POST \
  "https://mcmfwlgovubpdcfiqfvk.functions.supabase.co/enrich-application?application_id=<UUID>&dry_run=true"
```

**cron-enrichment manual trigger:**
```bash
curl -X POST \
  "https://mcmfwlgovubpdcfiqfvk.functions.supabase.co/cron-enrichment"
```

---

### Monitoring Queries

**Recent enrichment jobs:**
```sql
SELECT * FROM jobs_enrichment 
ORDER BY started_at DESC 
LIMIT 20;
```

**Success rate (last 7 days):**
```sql
SELECT job_status, COUNT(*) 
FROM jobs_enrichment
WHERE started_at > NOW() - INTERVAL '7 days'
GROUP BY job_status;
```

**Repeated failures:**
```sql
SELECT application_id, COUNT(*) AS fail_count
FROM jobs_enrichment
WHERE job_status = 'error'
GROUP BY application_id
HAVING COUNT(*) > 2;
```

**Applications needing enrichment:**
```sql
SELECT COUNT(*) 
FROM applications 
WHERE enrichment_status = 'pending' 
   OR updated_at < NOW() - INTERVAL '30 days';
```

---

## 🚀 Deployment & Configuration

### Edge Functions
**Deployment:** Automatic via Lovable (on code push)  
**Runtime:** Deno  
**Timeout:** 60 seconds (Supabase default)

**Configuration:** `supabase/config.toml`
```toml
project_id = "mcmfwlgovubpdcfiqfvk"

[functions.enrich-application]
verify_jwt = false

[functions.cron-enrichment]
verify_jwt = false

# ... other functions
```

---

### Cron Schedule
**Function:** `cron-enrichment`  
**Frequency:** `0 */2 * * *` (every 2 hours)  
**Region:** Same as project (US East)  
**Role:** Service role

**Setup:** Supabase Dashboard → Edge Functions → Schedule

---

## 🔧 Troubleshooting

### Common Issues

**1. Application enrichment stuck in "pending"**
- Check `jobs_enrichment` for error logs
- Verify `utility_endpoints` catalog is populated
- Test `enrich-application` with `?dry_run=true`

**2. ArcGIS query returns no features**
- Verify lat/lng are valid (applications.geo_lat/geo_lng)
- Check endpoint URL is accessible
- Review `enrichment_raw` for actual response

**3. Cron job not running**
- Verify schedule is enabled in Supabase Dashboard
- Check edge function logs for errors
- Ensure `MAX_BATCH_SIZE` is reasonable (<50)

**4. Lovable AI 429 errors**
- Reduce concurrent report generation
- Add exponential backoff/retry
- Contact support@lovable.dev for rate increase

---

## 📚 Related Documentation

- [GEOSPATIAL_INTEGRATION.md](./GEOSPATIAL_INTEGRATION.md) - GIS layer specs
- [API_INTEGRATIONS.md](./API_INTEGRATIONS.md) - External API contracts
- [buildsmarter_feasibility_openapi.yaml](./buildsmarter_feasibility_openapi.yaml) - OpenAPI spec
- [supabase/functions/*/index.ts](./supabase/functions/) - Edge function source code

---

## 📞 Support

**Internal Questions:** Contact development team  
**Supabase Support:** https://supabase.com/dashboard/support  
**Lovable AI Support:** support@lovable.dev  
**Google Maps Platform:** https://console.cloud.google.com/google/maps-apis

---

**Document Version:** 1.0  
**Maintained By:** Development Team  
**Next Review:** Quarterly or after major API changes
