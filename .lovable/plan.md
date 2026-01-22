

# SiteIntel™ Feasibility Platform
## Comprehensive Technical Audit & Gap Analysis

**Audit Date:** January 22, 2026  
**Auditor:** Principal Software Architect  
**Context ID:** 8F42B1C3-5D9E-4A7B-B2E1-9C3F4D5A6E7B

---

# SECTION 1: PROJECT FOUNDATION ANALYSIS

## 1.1 Technology Stack Deep Dive

### Frontend Stack

| Layer | Technology | Version | Purpose | Health Check |
|-------|------------|---------|---------|--------------|
| Framework | React | ^18.3.1 | Core UI library | ✅ Current |
| Build Tool | Vite | ^5.4.19 | Fast HMR bundler | ✅ Current |
| Routing | react-router-dom | ^6.30.1 | SPA navigation | ✅ Current |
| State (Global) | Zustand | ^5.0.8 | Wizard/Design stores | ✅ Excellent choice |
| State (Server) | TanStack Query | ^5.83.0 | API caching | ✅ Current |
| Forms | react-hook-form | ^7.61.1 | Form management | ✅ Current |
| Validation | Zod | ^3.25.76 | Schema validation | ✅ Current |
| UI Components | Radix UI (16 packages) | ^1.x-2.x | Accessible primitives | ✅ Current |
| Styling | Tailwind CSS | ^3.4.17 | Utility CSS | ✅ Current |
| 3D Maps | Cesium + Resium | ^1.136.0 / ^1.18.0 | Geospatial visualization | ✅ Current |
| 2D Maps | MapLibre GL | ^4.7.1 | Vector tile rendering | ✅ Current |
| 3D Models | @google/model-viewer | ^4.1.0 | GLB preview | ✅ Current |
| Charts | Recharts | ^2.15.4 | Data visualization | ✅ Current |
| Animation | Framer Motion | ^12.23.22 | Motion design | ✅ Current |
| PDF Generation | jsPDF | ^3.0.4 | Client-side PDF | ✅ Adequate |

**⚠️ CONCERN:** Multiple mapping libraries (Cesium, MapLibre, Leaflet) creates bundle bloat. Leaflet appears unused.

### Backend Stack

| Layer | Technology | Version | Purpose | Health Check |
|-------|------------|---------|---------|--------------|
| Runtime | Deno (Supabase Edge) | - | Serverless functions | ✅ Production ready |
| Database | PostgreSQL + PostGIS | Via Supabase | Geospatial data | ✅ Excellent |
| Auth | Supabase Auth | ^2.57.4 | Authentication | ✅ Production ready |
| File Storage | Supabase Storage | - | Report PDFs, GLBs | ✅ Configured |
| Real-time | Supabase Realtime | - | Progress updates | ✅ Used in orchestration |
| Payments | Stripe | ^18.5.0 | Subscriptions & one-off | ✅ Production ready |
| AI | OpenAI GPT-4 | Via API | Report narratives | ✅ Integrated |

### Infrastructure & Secrets

| Secret | Status | Purpose |
|--------|--------|---------|
| GOOGLE_MAPS_API_KEY | ✅ Set | Geocoding, Places, Distance Matrix |
| GOOGLE_PLACES_API_KEY | ✅ Set | Autocomplete |
| STRIPE_SECRET_KEY | ✅ Set | Payment processing |
| STRIPE_WEBHOOK_SECRET | ✅ Set | Webhook validation |
| OPENAI_API_KEY | ✅ Set | AI report generation |
| MAPBOX_ACCESS_TOKEN | ✅ Set | Fallback basemap |
| PDFSHIFT_API_KEY | ✅ Set | Server PDF generation |
| SCRAPERAPI_KEY | ✅ Set | Tax/permit scraping |
| TILE_CDN_URL | ✅ Set | Vector tile serving |
| VITE_CESIUM_ION_TOKEN | ✅ Set | Cesium terrain/assets |

---

## 1.2 Project Structure Overview

```text
siteintel/
├── src/                    # Frontend (React 18)
│   ├── components/         # 16 categories, 50+ components
│   │   ├── admin/          # Admin dashboards
│   │   ├── design/         # 3D Design Mode (Cesium integration)
│   │   ├── map/            # MapLibre components
│   │   ├── report/         # Multi-page report sections
│   │   ├── ui/             # shadcn/ui components
│   │   ├── wizard/         # Design wizard steps
│   │   └── ...             # 10 more categories
│   ├── pages/              # 52 routes across 8 subdirectories
│   ├── hooks/              # 49 custom hooks
│   ├── stores/             # 3 Zustand stores
│   ├── contexts/           # AuthContext, SubscriptionContext
│   ├── integrations/       # Supabase client (10,836 lines generated)
│   └── services/           # API service layer
├── supabase/
│   ├── functions/          # 121 Edge Functions
│   └── migrations/         # Database migrations
├── packages/               # Shared packages (types, gis-utils)
├── docs/                   # Engineering documentation
├── backend/                # HII module (hospitality)
└── etl/                    # Python ETL scripts
```

### Entry Points

| Entry Point | Type | Location | Status |
|-------------|------|----------|--------|
| `/` | Landing page | `src/pages/Index.tsx` | ✅ Complete |
| `/get-started` | Application payment flow | `ApplicationPaymentFlow.tsx` | ✅ Complete |
| `/report/:id` | Multi-page report viewer | `src/pages/report/ReportLayout.tsx` | ✅ Complete |
| `/design/:applicationId` | 3D Design Mode | `src/pages/DesignMode.tsx` | ✅ Complete |
| `/dashboard` | User dashboard | `src/pages/Dashboard.tsx` | ✅ Complete |
| `/admin/*` | Admin pages (7 routes) | `src/pages/admin/` | ✅ Complete |
| `/stripe-webhook` | Stripe webhook | `supabase/functions/stripe-webhook` | ✅ Complete |
| `/orchestrate-application` | Pipeline orchestrator | `supabase/functions/orchestrate-application` | ✅ Complete |

---

## 1.3 Database Analysis

### Table Count: 134 Tables

**Core Business Tables:**
| Table | Purpose | RLS | Row Count Estimate |
|-------|---------|-----|-------------------|
| `applications` | Feasibility applications | ✅ | 10K+ |
| `reports` | Generated reports | ✅ | 5K+ |
| `profiles` | User profiles | ✅ | 1K+ |
| `user_subscriptions` | Active subscriptions | ✅ | 500+ |
| `entitlements` | Feature access | ✅ | 500+ |
| `payment_history` | Payment records | ✅ | 2K+ |
| `drawn_parcels` | User-drawn parcels | ✅ | 1K+ |
| `design_sessions` | 3D design sessions | ✅ | 500+ |
| `design_variants` | Design alternatives | ✅ | 2K+ |
| `regulatory_envelopes` | Buildable constraints | ✅ | 1K+ |

**Geospatial Tables:**
| Table | Purpose | Features |
|-------|---------|----------|
| `canonical_parcels` | Unified parcel data | PostGIS geometry |
| `fema_flood_canonical` | FEMA flood zones | PostGIS polygon |
| `wetlands_canonical` | USFWS wetlands | PostGIS polygon |
| `transportation_canonical` | Roads/traffic | PostGIS lines |
| `utilities_canonical` | Utility lines | PostGIS lines |
| `canonical_demographics` | Census ACS data | Block group level |

### Supabase Linter Results

| Severity | Count | Issue |
|----------|-------|-------|
| ERROR | 1 | RLS Disabled in Public (1 table) |
| WARN | 33 | Functions without `search_path` set |

**Critical Finding:** 1 table has RLS disabled in public schema - requires immediate investigation.

### User Roles Implementation ✅ CORRECT

The project correctly implements user roles in a separate `user_roles` table:

```sql
-- Verified in migrations
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$ ... $$;
```

**✅ Roles NOT stored on profiles table - follows security best practices.**

---

# SECTION 2: FEATURE INVENTORY

## Complete Feature Status

### Core Feasibility Flow (MVP Path)

| Feature | Status | Files | Notes |
|---------|--------|-------|-------|
| Address Geocoding | ✅ COMPLETE | `geocode-with-cache`, `validate-address-google` | Caching, fallback to Nominatim |
| Parcel Lookup (HCAD/FBCAD) | ✅ COMPLETE | `fetch-hcad-parcels`, `fetch-parcels` | County-specific handlers |
| Parcel Drawing | ✅ COMPLETE | `DrawParcelControl`, `save-drawn-parcel` | PostGIS geometry validation |
| Application Orchestration | ✅ COMPLETE | `orchestrate-application` (1,138 lines) | Circuit breaker, retry, realtime |
| Feasibility Score | ✅ COMPLETE | `compute-feasibility-score` | Kill factors implemented |
| PDF Generation | ✅ COMPLETE | `generate-pdf`, `generate-ai-report` | GPT-4 narratives |
| Payment Processing | ✅ COMPLETE | `stripe-webhook`, `create-checkout-session` | Subscriptions + one-off |

### Data Enrichment (20+ Overlays)

| Overlay | Status | API Source | Caching |
|---------|--------|------------|---------|
| FEMA Flood Zones | ✅ | FEMA NFHL | 30 days |
| Zoning | ✅ | Local ordinances | 90 days |
| Wetlands | ✅ | USFWS NWI | 90 days |
| EPA ECHO Facilities | ✅ | EPA API | 7 days |
| SSURGO Soils | ✅ | USDA | 90 days |
| TxDOT Traffic/AADT | ✅ | TxDOT ArcGIS | 30 days |
| Utilities (OSM) | ✅ | Overpass API | 7 days |
| Demographics | ✅ | Census ACS | 365 days |
| Drive Times | ✅ | Google Distance Matrix | 7 days |
| Elevation | ✅ | Google Elevation | 30 days |
| Places Context | ✅ | Google Places | 30 days |

### 3D Design Mode (Advanced)

| Feature | Status | Implementation |
|---------|--------|----------------|
| Regulatory Envelope | ✅ | `compute-regulatory-envelope` (PostGIS) |
| Cesium 3D Viewer | ✅ | `CesiumViewer.tsx` (1,777 lines) |
| Google 3D Tiles | ✅ | Photorealistic tileset integration |
| Building Type Selector | ✅ | 8 archetypes with preview geometry |
| Building Model Gallery | ✅ | 16 seeded GLB models |
| Model3DPreview | ✅ | `model-viewer` with transforms |
| GLB Rendering in Cesium | ✅ | Scale/rotation/offset support |
| Shadow Analysis | ✅ | Multi-time comparison |
| Measurement Tools | ✅ | Distance, area, height |
| Street View Mode | ✅ | WASD navigation |

### Partially Complete Features

| Feature | Status | Gap Analysis |
|---------|--------|--------------|
| Parcel Comparison | 🔶 PARTIAL | Store exists (`useParcelComparisonStore`), no UI panel |
| Wizard Templates | 🔶 PARTIAL | Selection works, generation incomplete |
| Variant Rename | 🔶 PARTIAL | TODO comment at line 241 in `DesignVariantList.tsx` |
| CityEngine Integration | ⬜ STUBBED | Queue exists, no external worker |
| OData API | ⬜ STUBBED | Endpoint exists, not wired to consumers |

### Missing Features

| Feature | Priority | Effort |
|---------|----------|--------|
| Test Suite (Unit/E2E) | CRITICAL | 2 weeks |
| Email Notifications | HIGH | 3 days |
| Rate Limiting (Public APIs) | HIGH | 1 day |
| User Management Admin | MEDIUM | 3 days |
| API Key Self-Service | LOW | 2 days |
| Internationalization | LOW | 1 week |

---

# SECTION 3: CODE QUALITY ANALYSIS

## 3.1 TODO/FIXME/HACK Inventory

| File | Line | Comment | Severity |
|------|------|---------|----------|
| `DesignMode.tsx` | 172 | "TODO: Get from application" | LOW |
| `MapLibreCanvas.tsx` | 2761 | "TODO: Re-enable when SiteIntel vector tiles are ready" | MEDIUM |
| `DesignVariantList.tsx` | 241 | "TODO: Implement rename" | LOW |
| `useMapLayers.ts` | 129 | "TODO: Fetch from utility data" | LOW |
| `customer-portal/index.ts` | 59 | "TODO: Replace with portal configuration ID" | MEDIUM |

**Total: 5 actionable TODOs** (false positives from county codes excluded)

## 3.2 Console Statement Analysis

| Category | Count | Files | Action Required |
|----------|-------|-------|-----------------|
| `console.log` | ~1,200 | 91 files | Remove for production |
| `console.warn` | ~100 | 40 files | Review for errors |
| `console.error` | ~191 | 50 files | Keep for error tracking |

**Critical:** 1,491 total console statements in frontend code need cleanup.

## 3.3 Type Safety Analysis

| Pattern | Count | Files | Risk Level |
|---------|-------|-------|------------|
| `: any` | 805 | 53 | HIGH |
| `as unknown as` | ~15 | 8 | MEDIUM |
| `@ts-ignore` | ~5 | 3 | HIGH |
| `catch (error: any)` | ~100 | 40 | MEDIUM |

**Worst Offenders:**
- `MapLibreCanvas.tsx` - 30+ `any` usages for API responses
- `useMapLayers.ts` - Heavy `any` for overlay data
- `ReportChatAssistant.tsx` - Props typed as `any`
- `AddressSearchTab.tsx` - API response filtering with `any`

## 3.4 Large Files Requiring Refactoring

| File | Lines | Recommended Split |
|------|-------|-------------------|
| `CesiumViewer.tsx` | 1,777 | Extract 5-6 sub-components |
| `MapLibreCanvas.tsx` | 2,800+ | Extract layer handlers |
| `orchestrate-application/index.ts` | 1,138 | Extract phase functions |
| `stripe-webhook/index.ts` | 1,113 | Extract event handlers |
| `useDesignStore.ts` | 807 | Consider slicing |

---

# SECTION 4: SECURITY AUDIT

## 4.1 Supabase Linter Findings

| Issue | Count | Severity | Status |
|-------|-------|----------|--------|
| RLS Disabled in Public | 1 | ERROR | ❌ Open |
| Functions without search_path | 33 | WARN | ⚠️ Partially addressed |
| Extension in Public | 1 | WARN | ℹ️ PostGIS (expected) |

## 4.2 Authentication Security

| Check | Status | Notes |
|-------|--------|-------|
| Passwords hashed | ✅ | Supabase Auth (bcrypt) |
| Session tokens secure | ✅ | httpOnly, secure cookies |
| OAuth state validation | ✅ | Supabase handles |
| JWT expiry appropriate | ✅ | Default 1 hour |
| Logout invalidates session | ✅ | Via `signOut()` |
| Admin role stored separately | ✅ | `user_roles` table |
| RLS on sensitive tables | ✅ | 70+ tables protected |

## 4.3 Authorization Security

| Check | Status | Notes |
|-------|--------|-------|
| `has_role()` function | ✅ | SECURITY DEFINER with search_path |
| Admin routes protected | ✅ | Check `useAdminRole` hook |
| API endpoints check auth | ✅ | JWT validation in edge functions |
| RLS policies tested | ⚠️ | Need automated tests |
| No privilege escalation | ✅ | Roles in separate table |

## 4.4 Data Security

| Check | Status | Notes |
|-------|--------|-------|
| HTTPS enforced | ✅ | Via Supabase/Lovable |
| Secrets not in code | ✅ | All in Supabase secrets |
| SQL injection prevented | ✅ | Parameterized queries |
| XSS prevented | ✅ | DOMPurify used |
| Input validation | 🔶 | Inconsistent across forms |
| Rate limiting | ❌ | Missing on public endpoints |
| File upload validation | ✅ | Type/size checks in `SurveyUploadTab` |

## 4.5 Critical Vulnerabilities

| Vulnerability | Severity | Location | Remediation |
|---------------|----------|----------|-------------|
| RLS disabled on 1 table | HIGH | Unknown table | Enable RLS immediately |
| 33 functions without search_path | MEDIUM | Various DB functions | Add `SET search_path = public` |
| No rate limiting on Quick Check | MEDIUM | `generate-quick-check` | Add IP-based limiting |
| 1,491 console.log statements | LOW | Frontend code | Remove before production |

---

# SECTION 5: TESTING STATUS

## Current Coverage

| Test Type | Status | Coverage |
|-----------|--------|----------|
| Unit Tests | ❌ None | 0% |
| Integration Tests | ❌ None | 0% |
| E2E Tests | ❌ None | 0% |
| API Tests | ❌ None | 0% |
| Component Tests | ❌ None | 0% |

## Critical Untested Paths

| Path | Risk Level | Business Impact |
|------|------------|-----------------|
| Stripe webhook → credit allocation | CRITICAL | Revenue loss |
| Orchestration pipeline (20+ API calls) | CRITICAL | Report failures |
| PDF generation | HIGH | Report delivery |
| Design mode calculations | HIGH | Compliance accuracy |
| Authentication flows | HIGH | User access |

---

# SECTION 6: COMPLETION ROADMAP

## Executive Summary

| Metric | Value |
|--------|-------|
| **Overall Project Health** | 7.5/10 |
| **Feature Completion** | ~85% |
| **Pages** | 52 |
| **Components** | 100+ |
| **Edge Functions** | 121 |
| **Database Tables** | 134 |
| **Test Coverage** | 0% |
| **Security Issues** | 34 (1 ERROR, 33 WARN) |

**Biggest Risks:**
1. Zero test coverage on payment and orchestration flows
2. 805 `any` type usages reducing type safety
3. 1,491 console statements in production
4. 1 table with RLS disabled

**Estimated Effort to Production-Ready MVP:** 2-3 weeks

---

## Priority 1: CRITICAL (No Launch Without)

### 1.1 Enable RLS on Disabled Table
- **Complexity:** S
- **Effort:** 1 hour
- **Files:** SQL migration
- **Action:** Identify table via `SELECT * FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN (SELECT tablename FROM pg_policies);`

### 1.2 Add Rate Limiting to Public Endpoints
- **Complexity:** M
- **Effort:** 4 hours
- **Files:** `generate-quick-check`, other public functions
- **Action:** IP-based rate limit using `api_cache_universal` for tracking

### 1.3 Remove Production Console Logs
- **Complexity:** S
- **Effort:** 2 hours
- **Files:** 91 frontend files
- **Action:** ESLint rule + search/replace

### 1.4 Set search_path on 33 Functions
- **Complexity:** M
- **Effort:** 4 hours
- **Files:** SQL migration
- **Action:** `ALTER FUNCTION ... SET search_path = public`

### 1.5 Test Coverage for Payment Flow
- **Complexity:** L
- **Effort:** 3 days
- **Files:** New test files
- **Action:** Vitest setup + Stripe webhook tests

---

## Priority 2: HIGH (Launch is Risky Without)

### 2.1 Reduce `any` Usage to <100
- **Complexity:** L
- **Effort:** 5 days
- **Files:** 53 files
- **Action:** Add proper interfaces for API responses

### 2.2 Add Playwright E2E Tests
- **Complexity:** L
- **Effort:** 1 week
- **Files:** New `tests/e2e/` directory
- **Action:** Critical journeys: signup → payment → report

### 2.3 Implement Email Notifications
- **Complexity:** M
- **Effort:** 3 days
- **Files:** New edge function
- **Action:** SendGrid/Postmark integration for report ready, payment receipts

### 2.4 Wire Up Variant Rename
- **Complexity:** S
- **Effort:** 2 hours
- **Files:** `DesignVariantList.tsx`
- **Action:** Complete TODO at line 241

### 2.5 Complete Parcel Comparison UI
- **Complexity:** M
- **Effort:** 2 days
- **Files:** New component + integration
- **Action:** Side-by-side comparison panel

---

## Priority 3: MEDIUM (Should Have for Good UX)

### 3.1 Split CesiumViewer Component
- **Complexity:** L
- **Effort:** 3 days
- **Files:** `CesiumViewer.tsx`
- **Action:** Extract shadow, measurement, street view, model rendering

### 3.2 User Management Admin UI
- **Complexity:** M
- **Effort:** 3 days
- **Files:** New admin page
- **Action:** List, invite, role management

### 3.3 API Key Self-Service
- **Complexity:** M
- **Effort:** 2 days
- **Files:** New settings page
- **Action:** Generate, revoke, rate limit display

---

## Sprint Recommendations

### Sprint 1 (Days 1-2): Security Hardening
- [ ] Enable RLS on disabled table
- [ ] Add rate limiting to `generate-quick-check`
- [ ] Set search_path on all 33 functions
- [ ] Remove console.logs from production

### Sprint 2 (Days 3-7): Testing Foundation
- [ ] Set up Vitest configuration
- [ ] Add payment webhook tests
- [ ] Add orchestration pipeline tests
- [ ] Set up Playwright for E2E

### Sprint 3 (Week 2): Polish & Launch Prep
- [ ] Wire up variant rename
- [ ] Implement basic email notifications
- [ ] Reduce `any` usage to <200
- [ ] Performance audit (Lighthouse)

---

## Top 5 Immediate Actions

1. **Enable RLS on disabled table** - 1 hour, Critical security fix
2. **Add rate limiting to Quick Check** - 4 hours, Prevents abuse
3. **Remove console.logs** - 2 hours, Performance + security
4. **Set up Vitest + first test** - 4 hours, Establishes testing baseline
5. **Complete variant rename TODO** - 2 hours, Quick UX win

---

## Architecture Recommendations

1. **Consider removing Leaflet** - Appears unused, reduces bundle size
2. **Extract CesiumViewer hooks** - 1,777 lines is unmaintainable
3. **Standardize API response types** - Reduce `any` usage systematically
4. **Add error boundary per route** - Currently only root-level
5. **Implement proper logging service** - Replace console.log with structured logging

---

**END OF AUDIT REPORT**

*This document serves as the single source of truth for project completion. No code modifications have been made.*

