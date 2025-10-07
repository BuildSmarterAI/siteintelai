# BuildSmarter™ Feasibility — System Architecture

## 1. Overview & Objectives

BuildSmarter™ Feasibility is an AI/GIS SaaS platform that ingests authoritative parcel, zoning, floodplain, utilities, environmental, traffic, and demographic datasets, and generates lender-ready feasibility reports (PDF + JSON) in ~10 minutes.

### Primary Objectives
- **10-minute automated report path** with lender-friendly output and citations
- **High margin** via compute+API cost controls, caching, and attribute-only pulls where possible
- **Texas-first coverage** with national scaling planned

## 2. Logical Architecture

### Layers

1. **Front-end** (Vercel/React + shadcn/ui)
   - Auth, intake form, job progress, report viewer (PDF/JSON downloads)

2. **Edge/API** (Vercel Functions + Supabase Edge Functions)
   - `/intake` (enqueue job)
   - `/reports/:id` (signed downloads)
   - `/odata/*` (read-only OData facade)

3. **Workers** (Data Enrichment & AI)
   - Geocode → parcel select → overlay queries (ArcGIS/MapServer + open APIs)
   - Normalized schema → AI JSON → PDF rendering → storage

4. **Data Layer** (Supabase)
   - Relational tables (applications, enrichment_raw, reports)
   - Storage (PDF/JSON/assets)
   - RLS, indexes

### External Sources
- Google Geocoding
- ArcGIS (Unified Parcels, HCAD, FBCAD, city utilities)
- OpenFEMA
- TxDOT AADT
- EPA FRS
- USFWS Wetlands
- USDA SSURGO
- Census ACS
- BLS QCEW

## 3. Physical Architecture / Deployment Topology

### Infrastructure
- **Vercel**: Static assets + Edge Functions (/intake, /generate/:appId, /reports/:id, /odata/*)
- **Supabase**: 
  - Postgres (RLS)
  - Storage (PDF/JSON)
  - Edge Functions (enqueue/consume jobs, cron refresh, retry/backoff)
  - Realtime channels for job status
- **Queues**: Lightweight job table (status, attempts, next_run_at) + Supabase cron for polling/dispatch
- **Networking**: Outbound HTTPS to ArcGIS FeatureServer/MapServer & public APIs
- **Observability**: Supabase logs + OpenTelemetry spans for external calls; Sentry for app-level errors

## 4. Component Breakdown

### 4.1 Front-end
- **Intake**: Address/APN/lat-lon validation; submits to /intake
- **Progress**: Realtime updates from Supabase channel
- **Report Viewer**: Download PDF/JSON via signed URLs; toggle map overlays; show source/citation appendix

### 4.2 Edge/API
- **POST /intake**: Validate payload; create applications row; enqueue job; return job id
- **POST /generate/:application_id**: Idempotent; starts enrichment if ready
- **GET /reports/:id(.pdf|.json)**: Signed Storage URLs
- **GET /odata/***: OData v4.01 read-only

### 4.3 Workers — Data Enrichment

#### Steps (per job):
1. **Geocode** (Google) → geo_lat, geo_lng, formatted_address, place_id
2. **Parcel selection**: Unified Parcels (ID:7) intersect on centroid; fall back to county layers
3. **County CAD enrichment**: HCAD (ID:4) and FBCAD (ID:5) attributes (APN/owner/acreage/values/legal)
4. **Overlays**:
   - Flood/NFIP context (OpenFEMA datasets; NFHL where available)
   - Utilities: city stormwater/force mains (e.g., StormwaterUtilities MapServer; Force Main (ID:24))
   - Environmental: EPA FRS, USFWS Wetlands; Soils: USDA SSURGO
   - Traffic: TxDOT AADT (nearest segment + year + distance)
   - Demographics/Employment: Census ACS, BLS QCEW
5. **Normalization**: write canonical fields into applications; persist raw payloads under enrichment_raw (JSONB)
6. **AI pipeline**: render structured insights + Feasibility Score (0–100) with citations; validate against schema; persist to reports
7. **Report generation**: PDF compositor with maps/tables + "Data Sources & Timestamps" appendix (include FEMA dataset lastDataSetRefresh if present)

### 4.4 Data Layer

#### Core Tables
- **applications**: Master intake; enriched parcel/zoning/flood/utilities/traffic/demographic/financial attributes
- **enrichment_raw**: JSONB blobs of every API response (ArcGIS, FEMA, etc.) for audit/reprocessing
- **reports**: JSON report data + signed PDF URL + feasibility_score + status
- **jobs_enrichment**: Job orchestration (status, started_at, finished_at, error_message, provider_calls)
- **utility_endpoints**: Catalog of ArcGIS endpoints (provider_name, provider_type, url, geometry_type, out_fields)

## 5. Data Flow

### Intake → Report Flow
1. User submits address via intake form
2. POST /intake creates application record with enrichment_status='pending'
3. Cron job picks up pending applications
4. Worker executes enrichment pipeline (geocode → parcel → overlays)
5. Normalized data written to applications table
6. AI pipeline generates JSON insights + feasibility score
7. PDF generated and stored in Supabase Storage
8. Report record created with signed URLs
9. User notified via Realtime channel
10. User downloads PDF/JSON from Report Viewer

## 6. Security & Authentication

### Row-Level Security (RLS)
- Users can only view/update their own applications and reports
- Admin role can view all applications and jobs
- Public read access for anonymous QuickCheck submissions

### API Authentication
- Google Places API: API Key (stored in Supabase secrets)
- ArcGIS endpoints: Public access (no auth required)
- Supabase Edge Functions: JWT verification (configurable per function)

## 7. Performance & Scalability

### Caching Strategy
- 30-day parcel overlay cache to reduce API calls
- Attribute-only pulls where possible
- Rate limit management with retry/backoff

### Cost Controls
- Minimize geometry fetches (use attributes only when possible)
- Batch processing via cron jobs
- Efficient query patterns (spatial intersects, $top/$skip paging)

## 8. Monitoring & Observability

### Metrics
- Job success/failure rates
- API call latency per provider
- Report generation time
- Credit usage per user
- External API quota consumption

### Error Handling
- Retry logic with exponential backoff
- Graceful degradation for missing data sources
- Detailed error logging in jobs_enrichment table
- User-facing error messages for common failures

## 9. Future Roadmap

### Phase 1 (Current): Texas Coverage
- Harris County (HCAD)
- Fort Bend County (FBCAD)
- Unified Parcels layer
- TxDOT traffic data

### Phase 2: National Expansion
- Additional metro areas
- Multi-state parcel datasets
- Regional utility providers
- National environmental datasets

### Phase 3: OData API
- Read-only OData v4.01 facade
- Enterprise partner access
- Advanced query capabilities ($filter, $select, $orderby, $compute)

### Phase 4: AI Enhancements
- Machine learning for feasibility scoring
- Predictive cost modeling
- Historical trend analysis
- Risk assessment automation
