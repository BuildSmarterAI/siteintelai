

# SiteIntel™ Feasibility Platform - Comprehensive Technical Audit & Completion Roadmap

**Audit Date:** January 22, 2026
**Auditor:** Technical Architecture Review

---

## PHASE 1: COMPREHENSIVE CODEBASE ANALYSIS

### 1.1 Project Structure Inventory

```text
siteintel/
├── src/                    # Frontend React application
│   ├── components/         # 16+ component directories, 50+ standalone components
│   ├── pages/             # 52 page components across 8 subdirectories
│   ├── hooks/             # 49 custom React hooks
│   ├── stores/            # 3 Zustand stores (wizard, design, parcel-comparison)
│   ├── services/          # API service layer
│   ├── contexts/          # 2 context providers (Auth, Subscription)
│   ├── lib/               # Utility libraries
│   ├── types/             # TypeScript type definitions
│   └── integrations/      # Supabase client (10,836 lines of generated types!)
├── supabase/functions/     # 121 Edge Functions
├── packages/               # 2 shared packages (types, gis-utils)
├── docs/                   # Extensive documentation (10+ subdirectories)
├── backend/                # HII module (hospitality intelligence)
└── etl/                    # Python ETL pipeline scripts
```

**Tech Stack:**
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React + TypeScript | 18.3.1 |
| Build | Vite | 5.4.19 |
| Styling | Tailwind CSS | 3.4.17 |
| Components | shadcn/ui + Radix | Latest |
| State | Zustand + React Query | 5.x / 5.83.0 |
| Backend | Supabase Edge Functions (Deno) | - |
| Database | PostgreSQL (PostGIS) | Via Supabase |
| Maps | Cesium + MapLibre GL | 1.136.0 / 4.7.1 |
| 3D Models | @google/model-viewer | 4.1.0 |
| Payments | Stripe | Via Edge Functions |

**Environment Variables (Required):**
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` ✅ Configured
- `VITE_CESIUM_ION_TOKEN` ✅ Configured
- `VITE_USE_MAPLIBRE` ✅ Configured
- Edge Function Secrets: `GOOGLE_MAPS_API_KEY`, `STRIPE_SECRET_KEY`, `OPENAI_API_KEY`, `MAPBOX_ACCESS_TOKEN`

---

### 1.2 Feature Inventory

| Feature | Status | Files Involved | Dependencies | Notes |
|---------|--------|----------------|--------------|-------|
| **Core Feasibility Flow** |
| Address Geocoding | ✅ COMPLETE | geocode-with-cache, validate-address-google | Google Places API | Caching implemented |
| Parcel Lookup (HCAD/FBCAD) | ✅ COMPLETE | fetch-hcad-parcels, fetch-parcels | ArcGIS Services | County-specific handlers |
| Parcel Drawing | ✅ COMPLETE | DrawParcelControl, save-drawn-parcel | MapLibre Draw | Full CRUD |
| Application Orchestration | ✅ COMPLETE | orchestrate-application | 20+ enrichment functions | Status tracking with progress |
| Feasibility Score Computation | ✅ COMPLETE | compute-feasibility-score | All overlays | Kill factors implemented |
| PDF Report Generation | ✅ COMPLETE | generate-pdf, generate-ai-report | OpenAI, jsPDF | AI narratives working |
| **Data Enrichment** |
| FEMA Flood Zones | ✅ COMPLETE | query-fema-by-point | FEMA NFHL API | Risk levels calculated |
| Zoning Analysis | ✅ COMPLETE | query-zoning | Local ordinances | Texas jurisdictions |
| Wetlands (USFWS NWI) | ✅ COMPLETE | enrich-wetlands | USFWS API | Cowardin codes mapped |
| EPA ECHO Facilities | ✅ COMPLETE | enrich-epa-echo | EPA API | 1-mile radius search |
| Soil Analysis (SSURGO) | ✅ COMPLETE | query-soil | USDA SSURGO | Buildability assessment |
| Traffic/AADT | ✅ COMPLETE | enrich-traffic | TxDOT | Nearest segment lookup |
| Utilities (OSM) | ✅ COMPLETE | enrich-utilities-osm | Overpass API | Water/sewer/storm |
| Demographics | ✅ COMPLETE | enrich-census-canonical | Census ACS | Block group level |
| Drive Times | ✅ COMPLETE | fetch-drivetimes | Google Distance Matrix | Multiple destinations |
| Elevation Profile | ✅ COMPLETE | fetch-elevation-profile | Google Elevation | Terrain cross-section |
| **3D Design Mode** |
| Regulatory Envelope | ✅ COMPLETE | compute-regulatory-envelope | PostGIS | Setbacks, FAR, height caps |
| Cesium 3D Viewer | ✅ COMPLETE | CesiumViewer.tsx (1,777 lines) | Cesium, Google 3D Tiles | Shadow analysis, street view |
| Building Type Selector | ✅ COMPLETE | BuildingTypeSelectorStep | 8 archetypes | Preview geometry |
| Building Model Gallery | ✅ COMPLETE | BuildingModelGallery | building_models table | 16 seeded models |
| Model3DPreview | ✅ COMPLETE | Model3DPreview.tsx | model-viewer | Auto-rotate, fullscreen |
| GLB Model Rendering | ✅ COMPLETE | CesiumViewer.tsx lines 1600-1628 | Cesium ModelGraphics | Scale/rotation/offset |
| Shadow Analysis | ✅ COMPLETE | ShadowTimeline, ShadowComparisonPanel | Cesium | Multi-time comparison |
| Measurement Tools | ✅ COMPLETE | useCesiumMeasurement | Cesium | Distance, area, height |
| Street View Mode | ✅ COMPLETE | useFirstPersonCamera, StreetViewHUD | Cesium | WASD navigation |
| **Authentication & Billing** |
| Supabase Auth | ✅ COMPLETE | AuthContext, Auth.tsx | Supabase Auth | Email + OAuth |
| Stripe Checkout | ✅ COMPLETE | create-checkout-session | Stripe | One-off reports |
| Stripe Subscriptions | ✅ COMPLETE | create-subscription-checkout | Stripe | Tiered plans |
| Webhook Processing | ✅ COMPLETE | stripe-webhook | Stripe | Event handling |
| Customer Portal | ✅ COMPLETE | customer-portal | Stripe | Self-service billing |
| Credit System | 🔶 PARTIAL | purchase-credits (DEPRECATED) | - | Replaced by subscriptions |
| **Admin Features** |
| Data Sources Management | ✅ COMPLETE | DataSources, DataSourceDetail | datasets table | CRUD + versioning |
| System Health Dashboard | ✅ COMPLETE | SystemHealth | api_health_snapshots | Real-time metrics |
| Report Management | ✅ COMPLETE | AdminReports | - | Bulk actions |
| Tile Management | ✅ COMPLETE | TileManagement | tileserver_gl | Upload/status |
| **Marketing/Content** |
| Industry Landing Pages | ✅ COMPLETE | 7 industry pages | - | SEO optimized |
| ROI Calculator | ✅ COMPLETE | ROICalculator | - | Interactive sliders |
| Case Studies | ✅ COMPLETE | CaseStudies | - | Mock data |
| Blog | 🔶 PARTIAL | Blog.tsx | - | Static mock data |
| **Partially Complete** |
| Parcel Comparison | 🔶 PARTIAL | useParcelComparisonStore | - | Store exists, UI incomplete |
| Wizard Templates | 🔶 PARTIAL | TemplateRecommendations | design_templates table | Selection works, generation TODO |
| CityEngine Integration | ⬜ STUBBED | queue-cityengine-job | External worker | Queue exists, no worker |
| OData API | ⬜ STUBBED | odata/ function | - | Endpoint exists, not wired |
| Beta Signup | ✅ COMPLETE | submit-beta-signup | beta_signups table | GHL webhook |
| **Missing/Not Started** |
| Test Suite | ❌ MISSING | - | - | No unit/integration tests |
| E2E Tests | ❌ MISSING | - | Playwright/Cypress | None configured |
| Internationalization | ❌ MISSING | - | i18n library | English only |
| Mobile Native | ❌ MISSING | - | - | Web only (responsive) |

---

### 1.3 Database & Data Layer Analysis

**Table Count:** 70+ tables (from Supabase types file ~10,836 lines)

**Key Tables:**

| Table | Purpose | RLS Status | Notes |
|-------|---------|------------|-------|
| `applications` | Core feasibility applications | ✅ Enabled | 300+ columns, main entity |
| `applications_draft` | Draft persistence | ✅ Enabled | Wizard state storage |
| `reports` | Generated reports | ✅ Enabled | PDF URLs, scores |
| `parcels` | Canonical parcel data | ✅ Enabled | PostGIS geometry |
| `drawn_parcels` | User-drawn parcels | ✅ Enabled | Per-user storage |
| `building_models` | 3D GLB models | ✅ Enabled | 16 seeded models |
| `design_sessions` | Design mode sessions | ✅ Enabled | Variant management |
| `design_variants` | Design footprints | ✅ Enabled | Per-session |
| `regulatory_envelopes` | Buildable constraints | ✅ Enabled | FAR/height/coverage |
| `buildability_outputs` | Computed buildability | ✅ Enabled | JSON constraints |
| `buildability_rulesets` | Jurisdiction rules | ✅ Enabled | Houston, ETJ |
| `api_logs` | API call tracking | ❌ Disabled | Observability |
| `api_cache_universal` | Response caching | ❌ Disabled | TTL-based |
| `api_cost_config` | Cost per API | ❌ Disabled | Budget tracking |
| `beta_signups` | Beta waitlist | ✅ Enabled | Email capture |
| `accounts` | Multi-tenant accounts | ✅ Enabled | Org structure |
| `account_members` | Team membership | ✅ Enabled | Role-based |
| `profiles` | User profiles | ✅ Enabled | Auth extension |

**Supabase Linter Issues (39 total):**
- 4 ERROR: Security Definer Views (views bypassing RLS)
- 35 WARN: Functions without `search_path` set

**Database Functions:**
- `fn_hii` - Hospitality Impact Index calculation
- `hii_check_threshold` - Alert threshold detection
- `has_role` - Role checking RPC
- `claim_cityengine_job` - Atomic job claiming
- Various RLS helper functions

---

### 1.4 API & Integration Audit

| Integration | Service | Status | Error Handling | Retry Logic | Fallback |
|-------------|---------|--------|----------------|-------------|----------|
| Google Geocoding | Maps API | ✅ | ✅ | ✅ | Nominatim |
| Google Places | Maps API | ✅ | ✅ | ✅ | None |
| Google Distance Matrix | Maps API | ✅ | ✅ | ❌ | None |
| Google Elevation | Maps API | ✅ | ✅ | ❌ | USGS NED |
| Google 3D Tiles | Map Tiles API | 🔶 | ✅ | ✅ | OSM Buildings |
| FEMA NFHL | ArcGIS | ✅ | ✅ | ✅ | None |
| EPA ECHO | EPA API | ✅ | ✅ | ❌ | None |
| USFWS Wetlands | ArcGIS | ✅ | ✅ | ❌ | None |
| USDA SSURGO | NRCS API | ✅ | ✅ | ❌ | None |
| TxDOT AADT | ArcGIS | ✅ | ✅ | ❌ | None |
| HCAD/FBCAD | ArcGIS | ✅ | ✅ | ✅ | None |
| OpenStreetMap | Overpass | ✅ | ✅ | ❌ | None |
| Census ACS | Census API | ✅ | ✅ | ❌ | Canonical table |
| Stripe | Payment API | ✅ | ✅ | ✅ | None |
| OpenAI GPT-4 | AI API | ✅ | ✅ | ❌ | None |
| Cesium Ion | Tile API | ✅ | ✅ | ✅ | Ellipsoid |
| Mapbox | Tile API | ✅ | ✅ | ❌ | OSM |

**Known Issue:** Google Maps API returning 403 errors for Map Tiles API in edge functions due to HTTP referrer restrictions. Need to add `*.supabase.co/*` to allowed referrers.

---

### 1.5 Authentication & Authorization

**Auth Flow:**
1. Email/password or OAuth (Google) via Supabase Auth
2. Session stored in localStorage
3. JWT passed to Edge Functions via Authorization header
4. RLS policies enforce row-level access

**Protected Routes:**
- `/dashboard` - Requires auth
- `/report/:id` - Public preview, full requires auth
- `/admin/*` - Requires admin role
- `/design/:id` - Requires auth

**Security Gaps:**
- 4 views using SECURITY DEFINER (bypasses RLS)
- 35+ functions missing `search_path` (potential schema injection)
- No rate limiting on public endpoints (Quick Check, geocoding)

---

## PHASE 2: CODE QUALITY & TECHNICAL DEBT

### 2.1 Code Quality Issues

**TODOs/FIXMEs Found (8):**
1. `DesignVariantList.tsx:241` - "TODO: Implement rename"
2. `MapLibreCanvas.tsx:2761` - "TODO: Re-enable when SiteIntel vector tiles are ready"
3. `useMapLayers.ts:129` - "TODO: Fetch from utility data"
4. `DesignMode.tsx:172` - "TODO: Get from application"
5. `customer-portal/index.ts:59` - "TODO: Replace with portal configuration ID"

**Console.logs to Remove:** 367 matches in 17 files (production logging noise)

**Hardcoded Values:**
- Default Houston coordinates in multiple files
- Magic numbers in scoring algorithms
- Static demo data in industry pages

**Functions Over 50 Lines:**
- `CesiumViewer.tsx` - 1,777 lines (should be split into smaller components)
- `MapLibreCanvas.tsx` - 2,800+ lines (monolithic)
- `orchestrate-application/index.ts` - Complex orchestration logic

### 2.2 Type Safety

**`any` Usage:** 822 matches in 69 files

**Problem Areas:**
- `useMapLayers.ts` - Heavy `any` usage for API responses
- `ReportChatAssistant.tsx` - Props typed as `any`
- Error handlers using `catch (error: any)`
- JSON data from database columns

**Validation:**
- Zod schemas exist in some edge functions
- No consistent input validation layer
- API responses not validated against schemas

### 2.3 Testing Status

| Test Type | Status | Coverage |
|-----------|--------|----------|
| Unit Tests | ❌ None | 0% |
| Integration Tests | ❌ None | 0% |
| E2E Tests | ❌ None | 0% |
| API Tests | ❌ None | 0% |
| Component Tests | ❌ None | 0% |

**Critical Untested Paths:**
- Payment flow (checkout → webhook → credit allocation)
- Orchestration pipeline (20+ sequential API calls)
- Report generation (AI + PDF rendering)
- Design mode calculations (compliance, metrics)

### 2.4 Security Concerns

| Issue | Severity | Location | Status |
|-------|----------|----------|--------|
| Security Definer Views | HIGH | 4 database views | Open |
| Functions without search_path | MEDIUM | 35+ functions | Open |
| API keys in edge function env | LOW | Expected pattern | N/A |
| No rate limiting | MEDIUM | Public endpoints | Open |
| XSS in report chat | LOW | DOMPurify used | Mitigated |
| SQL injection | LOW | Parameterized queries | Mitigated |

---

## PHASE 3: GAP ANALYSIS

### 3.1 Feature Gaps

**Buttons/Actions Not Implemented:**
- "Rename" in variant list (TODO comment)
- "Compare Sites" in parcel comparison (store exists, no UI)
- "Export to CSV" in admin reports (button exists, handler incomplete)

**Forms That Don't Submit:**
- Blog newsletter signup (static mockup)
- Demo request form (static mockup)

**Empty Shell Pages:**
- `/resources/documentation` - Points to Blog
- `/resources/api` - Points to Blog

### 3.2 User Journey Gaps

**1. Signup/Onboarding Flow:**
- ✅ Email signup works
- ✅ OAuth (Google) works
- 🔶 No email verification enforcement
- 🔶 No onboarding wizard after signup
- ❌ No welcome email automation

**2. Core Feasibility Flow (MVP Path):**
- ✅ Address entry → geocoding
- ✅ Parcel selection (click or draw)
- ✅ Payment collection
- ✅ Background enrichment
- ✅ Report generation
- ✅ PDF download
- 🔶 Progress tracking could be more granular
- 🔶 Error recovery requires manual intervention

**3. Settings/Profile:**
- ✅ Basic profile display
- ✅ Subscription status
- 🔶 No password change UI
- ❌ No notification preferences
- ❌ No API key management UI

**4. Billing/Subscription:**
- ✅ Stripe Checkout works
- ✅ Customer Portal works
- ✅ Subscription webhooks processed
- 🔶 Credit pack purchase deprecated but button may still exist
- 🔶 Invoice display in payment history

**5. Admin/Dashboard:**
- ✅ Report listing
- ✅ Data source management
- ✅ System health
- ✅ Tile management
- 🔶 User management missing
- ❌ No audit logs UI

### 3.3 Missing MVP Requirements

| Expected Feature | Current State | Priority |
|------------------|---------------|----------|
| Email notifications | Not implemented | HIGH |
| Report sharing (public links) | Partially implemented | MEDIUM |
| Batch processing UI | Backend ready, no UI | MEDIUM |
| Multi-user teams | Schema exists, no UI | LOW |
| API key self-service | Table exists, no UI | LOW |
| Report versioning | Not implemented | LOW |

---

## PHASE 4: COMPLETION ROADMAP

### 4.1 Critical Path (MUST HAVE for MVP)

| # | Task | Complexity | Dependencies | Files | Notes |
|---|------|------------|--------------|-------|-------|
| 1 | Fix Google Maps API Referrer | S | None | Google Cloud Console | Add `*.supabase.co/*` to HTTP referrers |
| 2 | Add test coverage for payment flow | M | None | New test files | Stripe webhook, credit allocation |
| 3 | Remove console.logs from production | S | None | 17 files | Search/replace or lint rule |
| 4 | Fix Security Definer views | M | DBA access | Database migrations | Recreate as INVOKER |
| 5 | Set search_path on functions | M | DBA access | 35+ function updates | `SET search_path = public;` |
| 6 | Add rate limiting to Quick Check | M | None | generate-quick-check | Use Supabase rate limit or pg_ratelimit |
| 7 | Error recovery automation | L | #2 | recover-error-applications | Schedule cron job |
| 8 | Email notifications (basic) | M | SendGrid/Postmark | New edge function | Report ready, payment receipt |

### 4.2 Important (SHOULD HAVE post-MVP)

| # | Task | Complexity | Dependencies | Files | Notes |
|---|------|------------|--------------|-------|-------|
| 9 | Reduce `any` usage to <50 | L | None | 69 files | Type inference improvements |
| 10 | Split CesiumViewer component | L | None | CesiumViewer.tsx | Extract 5-6 sub-components |
| 11 | Add Playwright E2E tests | L | CI/CD | New test folder | Critical user journeys |
| 12 | Implement variant rename | S | None | DesignVariantList.tsx | Wire up dialog |
| 13 | Parcel comparison UI | M | Store exists | New component | Side-by-side view |
| 14 | Newsletter signup backend | S | Email service | submit-newsletter function | Actual list management |
| 15 | User management admin UI | M | accounts schema | New admin page | List, invite, remove |

### 4.3 Nice to Have (COULD HAVE for v2)

| # | Task | Complexity | Dependencies | Files | Notes |
|---|------|------------|--------------|-------|-------|
| 16 | CityEngine worker deployment | XL | External infra | Python worker | GPU/license requirements |
| 17 | OData API completion | M | None | odata/ function | Enterprise data access |
| 18 | i18n support | L | None | All UI files | Spanish first |
| 19 | API key self-service UI | M | api_keys table | New settings page | Rate limits, scopes |
| 20 | Audit log viewer | M | New table | Admin page | Action history |
| 21 | Report versioning | L | Schema changes | reports table | Track regenerations |

### 4.4 Technical Debt to Address

| Priority | Debt Item | Effort | Impact |
|----------|-----------|--------|--------|
| HIGH | No test coverage | 2 weeks | Risk mitigation |
| HIGH | 367 console.logs | 2 hours | Performance/security |
| HIGH | Security Definer views | 4 hours | Security |
| MEDIUM | 822 `any` types | 1 week | Maintainability |
| MEDIUM | Monolithic map components | 3 days | Maintainability |
| MEDIUM | Inconsistent error handling | 3 days | UX consistency |
| LOW | Dead code in deprecated/ | 1 hour | Cleanliness |
| LOW | Duplicate county maps in packages | 1 hour | Bundle size |

---

## PHASE 5: IMPLEMENTATION PLAN

### 5.1 Sprint 1 (Next 1-2 days) - Critical Fixes

**Day 1 Morning:**
1. Fix Google Maps API referrer restrictions in Google Cloud Console
2. Remove/comment out console.logs in production code
3. Document all required secrets in README

**Day 1 Afternoon:**
4. Create SQL migration to fix Security Definer views
5. Create SQL migration to add search_path to functions
6. Test webhook handling end-to-end

**Day 2:**
7. Add rate limiting to `generate-quick-check` endpoint
8. Set up error recovery cron job
9. Test full feasibility flow end-to-end

### 5.2 Sprint 2 (Week 1) - Testing Foundation

1. Set up Vitest for unit tests
2. Add tests for:
   - Stripe webhook handler
   - Score computation logic
   - Geometry utilities
3. Set up Playwright for E2E
4. Add E2E test for: Address → Report flow

### 5.3 Sprint 3 (Week 2) - Polish & UX

1. Wire up variant rename functionality
2. Implement email notifications (basic)
3. Fix remaining TODO items
4. Performance audit (Lighthouse)

---

## Summary Metrics

| Metric | Value |
|--------|-------|
| Total Pages | 52 |
| Total Components | 100+ |
| Edge Functions | 121 |
| Database Tables | 70+ |
| Lines in types.ts | 10,836 |
| TODO/FIXME Count | 8 |
| Console.log Count | 367 |
| `any` Usage | 822 |
| Test Coverage | 0% |
| Security Issues | 39 (4 ERROR, 35 WARN) |
| Feature Completion | ~85% |

**Overall Assessment:** The platform is feature-rich and architecturally sound, with the core MVP functionality complete. The primary gaps are around testing, security hardening, and production polish. The 3D design mode integration (just completed) adds significant value. Priority should be given to security fixes and establishing a testing baseline before expanding features.

