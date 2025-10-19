# BuildSmarter Feasibility - Changelog

All notable changes to API endpoints, enrichment logic, and frontend/UI are documented here.

---

## [v1.4.0] - 2025-10-19

### 🎨 Frontend & Design System

#### Typography System Migration
- **IBM Plex Sans Integration**: Replaced previous font system with IBM Plex Sans family
  - Added IBM Plex Sans (Regular 400, Medium 500, Semi-Bold 600, Bold 700)
  - Added IBM Plex Serif (Medium 500, Semi-Bold 600) for editorial content
  - Added IBM Plex Mono (Regular 400-Bold 700) for code/data displays
  
- **Tailwind Font Utilities** (`tailwind.config.ts`):
  - `font-headline`: IBM Plex Sans for all headlines (H1-H3)
  - `font-body`: IBM Plex Sans for body text
  - `font-serif`: IBM Plex Serif for optional editorial subheadings
  - `font-mono`: IBM Plex Mono for technical/data content
  - `font-cta`: IBM Plex Sans for call-to-action buttons

- **Performance Optimization** (`index.html`):
  - Implemented critical font loading with preload strategy
  - Async loading for non-critical weights to prevent render blocking
  - Reduced cumulative layout shift (CLS) with proper font fallbacks

#### Beta Page Hero Updates (`src/pages/Beta.tsx`)
- Changed H1 headline text color from `text-slate-100` to `text-white` for improved contrast
- Simplified "Verified Intelligence." from gradient to solid brand orange (`#FF7A00`)
  - Reason: Stronger brand recognition, better accessibility (WCAG AA compliant at 4.8:1 contrast)
  - Maintains visual interest through existing animated underline

#### Brand Alignment
- All changes align with BuildSmarter™ Brand Guidelines (IBM Plex Sans system)
- Maintains WCAG 2.1 AA accessibility standards
- Consistent with Feasibility Orange (`#FF7A00`) primary brand color

### 🚀 Phase 1: Orchestration Backbone

#### Database Schema Changes
- **Extended `applications` table** with orchestration fields:
  - `status` (enum): State machine transitions (`queued` → `enriching` → `ai` → `rendering` → `complete`|`error`)
  - `status_rev` (integer): Monotonic revision counter for idempotent state transitions
  - `attempts` (integer): Retry counter for current phase
  - `next_run_at` (timestamptz): Timestamp for scheduled execution
  - `error_code` (text): Standardized error code from error registry (e.g., E001, E101)
  - `status_percent` (integer): UI progress hint (0-100%)

- **Created `error_registry` table**: Centralized error code definitions
  - Columns: `code`, `source`, `http_status`, `human_message`, timestamps
  - RLS enabled: Public read access, admin write access
  - Seeded with 15 error codes covering ARCGIS, FEMA, WETLAND, TXDOT, UTILITIES, AI, and SYSTEM errors

- **Added indexes**:
  - `idx_applications_next_run_at`: Optimizes queue processing queries
  - `idx_applications_status_rev`: Optimizes idempotent state transition lookups

#### Edge Functions
- **NEW: `orchestrate-application`**: Single orchestrator function managing all phases
  - Implements state machine with idempotent transitions using `status_rev`
  - Exponential backoff retry logic (2s, 4s, 8s) with MAX_ATTEMPTS = 3
  - Publishes Realtime events to `app:{id}` channel on every state change
  - Calls existing edge functions: `enrich-feasibility`, `enrich-utilities`, `generate-ai-report`, `generate-pdf`
  - Standardized error handling with error codes (E001-E999)

- **Updated `cron-enrichment`**: Modified to call new orchestrator
  - Changed target query to use `status` and `next_run_at` fields
  - Calls `orchestrate-application` instead of `enrich-application`
  - Removed manual status updates (orchestrator handles all state transitions)

#### Frontend Updates
- **Updated `ProgressModal` (`src/components/ProgressModal.tsx`)**:
  - Replaced polling with pure Realtime channel subscription to `app:{id}`
  - Listens to broadcast events from orchestrator with sub-100ms latency
  - Reads `status_percent` field for accurate progress bars
  - Updated status labels to match new state machine (`queued`, `enriching`, `ai`, `rendering`, `complete`, `error`)
  - Displays `error_code` from error registry for user-friendly error messages

#### Performance Improvements
- **Eliminated polling**: UI updates via Realtime events (sub-100ms vs 2-second poll interval)
- **Battery efficiency**: No periodic database queries per active user
- **Reduced database load**: No `SELECT` queries every 2 seconds per user

#### Configuration
- Added `orchestrate-application` to `supabase/config.toml` with `verify_jwt = true`

---

## [v1.3.0] - 2025-10-06

### 🔧 Fixed
- **FEMA NFHL Endpoint**: Switched from deprecated Layer 28 to Layer 0 (`/MapServer/0/query`)
  - Added exponential backoff retry logic (3 attempts: 500ms → 1000ms → 2000ms)
  - Added `api_meta.fema_nfhl` tracking with status code, layer index, and record count
  
- **Harris County Parcels**: Implemented EPSG:2278 coordinate transformation
  - Added `proj4` library for WGS84 → Texas South Central Feet conversion
  - Added 50ft buffer to parcel query to account for coordinate precision
  - Updated endpoint to official HCAD service: `https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query`
  
- **EPA Environmental Sites**: Replaced deprecated FRS endpoint with EFService
  - New endpoint: `https://enviro.epa.gov/efservice/FRS_INTEREST/latitude/{lat}/longitude/{lng}/JSON`
  - Direct lat/lng query instead of county-based search
  
- **FCC Broadband API**: Added HTTP/1.1 fallback
  - Added `Connection: keep-alive` header to force HTTP/1.1
  - Prevents HTTP/2 stream errors in Supabase edge runtime
  
- **TxDOT Traffic Counts**: Expanded urban search radius
  - Increased from 2500ft to 3000ft for major urban cores
  - Reduces `traffic_not_found` flags in dense urban areas

### 🆕 Added
- **OpenFEMA Disaster Declarations API**: New data source for historical flood context
  - Endpoint: `https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries`
  - Aggregates flood events by type with latest declaration dates
  - Populates `historical_flood_events` with actual disaster data (replacing zone-based estimation)
  - Adds `api_meta.openfema_disasters` with event counts and latency tracking

- **Observability Columns**: Added metadata tracking to `applications` table
  - `api_meta` (JSONB): Stores per-API response status, record counts, and latency
  - `enrichment_status` (TEXT): Overall completion status (`complete`, `partial`, `failed`)
  
- **Standardized Error Flags**: Unified error flag naming convention
  - `fema_nfhl_unavailable` - FEMA endpoint failed after retries
  - `utilities_api_unreachable` - DNS resolution failure (Houston GIS)
  - `openfema_no_match` - No disaster declarations found
  - `parcel_projection_error` - Coordinate transformation failure
  - `parcel_not_found` - No parcel features returned
  - `floodplain_missing` - No FEMA flood zone data
  - `utilities_not_found` - No utility line data
  - `traffic_not_found` - No TxDOT counts within radius

### 📝 Documentation
- Updated `API_INTEGRATIONS.md` with new endpoints and projection notes
- Added `endpoint_catalog.json` versioning (v1.3.0)
- Created `CHANGELOG.md` for tracking API changes

### ⚠️ Known Issues
- **Houston Utilities DNS**: `cohgis.houstontx.gov` fails to resolve from Supabase edge runtime
  - **Workaround Options**:
    1. Deploy external proxy (Cloudflare Worker or Vercel Edge)
    2. Contact Houston GIS to update DNS configuration
    3. Use alternative Houston utility data sources
  - **Impact**: All Houston utility queries fail with `utilities_api_unreachable` flag

---

## [v1.2.0] - 2025-09-15

### 🔧 Fixed
- Improved error handling for flaky FEMA API responses
- Added fallback elevation sources (Google → Open-Elevation → USGS)

### 🆕 Added
- Support for Fort Bend, Galveston, Montgomery County parcels
- Census ACS demographic data integration
- Google Places API for mobility data (highways, transit)

---

## [v1.1.0] - 2025-08-01

### 🆕 Added
- Initial county parcel data integration (Harris, Dallas, Travis)
- FEMA NFHL flood zone queries
- Basic utility line queries for major Texas cities

---

## [v1.0.0] - 2025-07-01

### 🎉 Initial Release
- Core enrichment pipeline with geocoding
- Address normalization via Google Geocoding API
- Basic database schema for applications table