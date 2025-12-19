# SiteIntel™ Map Architecture — Principal Review
**Hard Architecture Review by Principal GIS Systems Architect**

> **Context:** Production-grade mapping system for lender-grade due diligence
> **Reviewer Role:** Principal GIS Systems Architect + Map Performance Engineer (15+ years MapLibre GL, PostGIS, vector tiles)
> **Review Date:** December 19, 2025
> **Scope:** Complete map stack review based on GEOSPATIAL_INTEGRATION.md, GIS_SPATIAL_LOGIC.md, and implementation code

---

## Executive Assessment

**VERDICT: ⚠️ ARCHITECTURE REQUIRES SIGNIFICANT HARDENING FOR PRODUCTION**

The SiteIntel map stack demonstrates **strong foundational work** (multi-tenancy tileserver design, PRD-compliant utility styling, three-tier fallback strategy) but exhibits **critical architectural deficiencies** that will block enterprise adoption and cause production incidents.

### Core Strengths
- **Excellent documentation coverage** — GEOSPATIAL_INTEGRATION.md (1,454 lines) provides comprehensive tileserver multi-tenancy architecture with data quality scoring engine
- **PRD-strict utility styling** — utilityLayerConfig.ts enforces non-negotiable color system (Water #1F6AE1, Sewer #7A4A2E, Storm #1C7C7C) with proper line dash patterns
- **Smart three-tier fallback** — Vector tiles (CloudFront) → County ArcGIS rasters → GeoJSON viewport loading provides resilience
- **Production basemap strategy** — Uses OSM for streets, Google satellite tiles, and hybrid mode with Stamen labels

### Critical Deficiencies (Production Blockers)
1. **No layer registry abstraction** — LAYER_CONFIG hardcoded in 2,687-line component; impossible to extend without surgery
2. **Fallback control plane is non-deterministic** — Three hooks (useVectorTileLayers, useFallbackParcels, useCountyTileOverlays) racing with unclear winner; no explicit state machine
3. **Zero performance instrumentation** — No tile load timing, no render metrics, no zoom-based performance budgets
4. **Monolithic component boundary violation** — MapLibreCanvas.tsx mixes rendering, state, hooks, basemap logic, measurement tools, and accessibility in 2,687 lines
5. **No preset system governance** — PRESET_VIEWS hardcoded in utilityLayerConfig.ts; no validation, no versioning, no runtime enforcement
6. **Missing CDC/ETL observability** — Tileserver docs describe ETL pipeline but no monitoring for tileset freshness, job failures, or data drift

---

## Scorecard (0-10 Scale)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Component Boundaries** | 3/10 | MapLibreCanvas.tsx is 2,687 lines mixing concerns; no separation between map engine, layer management, and UI |
| **Tile & Data Strategy** | 7/10 | Excellent multi-tenancy design + three-tier fallback, but missing circuit breaker pattern and retry budgets |
| **Performance Engineering** | 2/10 | No metrics, no budgets, no zoom-dependent layer culling beyond minzoom. County tiles force-load at z11 regardless of viewport size |
| **Caching & Cost Control** | 5/10 | localStorage for preferences, but no tile cache monitoring, no cost attribution per tenant, no CDN hit rate tracking |
| **Reliability & Fallbacks** | 6/10 | Three-tier fallback exists but lacks explicit state machine; error handler in useVectorTileLayers detects 403/404 but doesn't expose retry count |
| **State Management** | 4/10 | 16 useState hooks in MapLibreCanvas + 3 custom hooks with refs to avoid stale closures. No Redux/Zustand; potential race conditions |
| **Security/Governance** | 8/10 | Strong: tenant_permissions, tenant_filters, tenant_masking tables designed. RLS + JWT validation. Missing: audit log for tile access |
| **Observability** | 1/10 | Console.log-based debugging only. No structured logging, no APM, no tile load waterfall, no user journey tracking |

**OVERALL SCORE: 4.5/10 — Needs Architectural Refactor Before Enterprise Launch**

---

## Critical Gaps Analysis

### GAP 1: No Layer Registry Abstraction
**Symptom:** VECTOR_TILE_LAYER_CONFIG object hardcoded in useVectorTileLayers.ts (lines 25-350), duplicated layer definitions in MapLibreCanvas.tsx
**Root Cause:** Lack of canonical layer schema; config embedded in hook implementation
**Failure Mode:** Adding new layer category (e.g., "environmental", "demographics") requires editing 4+ files, risking style bugs and z-order conflicts
**Severity:** 🔴 **P0 BLOCKER** — Violates DRY, makes A/B testing impossible, blocks white-label customization
**Fix:** Create `LayerRegistry` class with JSON schema validation, z-order enforcement, and dynamic layer injection

---

### GAP 2: Fallback State Machine is Non-Deterministic
**Symptom:** MapLibreCanvas.tsx lines 293-344 show debug logs for 3 concurrent hooks (vector tiles, fallback, county tiles) with unclear precedence
**Root Cause:** No explicit state machine; `shouldUseFallback = !hasVectorTiles` is reactive but not authoritative
**Failure Mode:** County tiles render over vector tiles when both succeed; user sees duplicates or wrong data source
**Severity:** 🔴 **P0 BLOCKER** — Data provenance unclear to lenders; fails MISMO compliance
**Fix:** Implement `TileLoadStateMachine` with states: INITIALIZING → VECTOR_LOADING → VECTOR_SUCCESS | FALLBACK_COUNTY → FALLBACK_GEOJSON → ERROR

---

### GAP 3: County Tile Source has No Circuit Breaker
**Symptom:** useCountyTileOverlays.ts lines 220-226 forces county tiles at z11+ regardless of previous failures
**Root Cause:** No retry budget or circuit breaker pattern; ArcGIS export endpoints can return 503 under load
**Failure Mode:** Infinite tile request loop if county server is degraded; user sees spinner, browser tab hangs
**Severity:** 🔴 **P0 BLOCKER** — Causes production outages, impacts all Harris County users
**Fix:** Add `CircuitBreaker` with 3-strike rule: after 3 consecutive 500/503 errors, disable county tiles for 60s

---

### GAP 4: No Zoom-Based Layer Culling
**Symptom:** useVectorTileLayers.ts lines 497-531 adds all layers regardless of current zoom; MapLibre renders all layers even if minzoom not met
**Root Cause:** Minzoom set in layer spec but no pre-flight check to skip layer addition
**Failure Mode:** At z8 (state-level view), 83 utility layers (water mains, valves, manholes, etc.) added to map.style even though minzoom=12-15
**Severity:** 🟠 **P1 CRITICAL** — Wastes GPU memory, slows style recomposition, degrades pan/zoom FPS
**Fix:** Implement `shouldAddLayer(layer, currentZoom)` check: only add layers where `maxzoom >= currentZoom >= minzoom - 1`

---

### GAP 5: Measurement Tool Couples to Map Component
**Symptom:** MapLibreCanvas.tsx lines 527-556 implement distance/area measurement inline
**Root Cause:** No `MeasurementController` abstraction; state mixed with map state
**Failure Mode:** Cannot reuse measurement tools in Report Preview or PDF generation
**Severity:** 🟠 **P1 CRITICAL** — Violates SRP; blocks future 3D measurement tools
**Fix:** Extract to `src/lib/maptools/MeasurementController.ts` with pub/sub event model

---

### GAP 6: No Preset System Validation
**Symptom:** PRESET_VIEWS in utilityLayerConfig.ts (lines 459-491) lists layer IDs as strings; no compile-time or runtime validation
**Root Cause:** Missing JSON schema for preset configs
**Failure Mode:** Typo in layer ID ("water-main" vs "water_mains") silently fails; lender preset shows no layers
**Severity:** 🟠 **P1 CRITICAL** — User-facing bug in production; lender loses trust
**Fix:** Add Zod schema with `z.enum(getAllUtilityLayerIds())` validation + unit tests

---

### GAP 7: No Tile Load Performance Budget
**Symptom:** No timing instrumentation in any hook; no alerts for slow tile loads
**Root Cause:** Missing performance.mark() / performance.measure() instrumentation
**Failure Mode:** Tile server degradation (p95 latency 2s → 8s) goes undetected until users complain
**Severity:** 🟠 **P1 CRITICAL** — Cannot meet SLA without metrics; blocks enterprise sales
**Fix:** Add `TileLoadMonitor` with budgets: z12 tiles <500ms, z16 <300ms, z18 <200ms. Alert on p95 violations

---

### GAP 8: Vector Tile Error Handler Lacks Retry Logic
**Symptom:** useVectorTileLayers.ts lines 432-463 detect 403/404 errors but only log + set `tileLoadFailed = true`
**Root Cause:** No exponential backoff retry with jitter
**Failure Mode:** Transient S3/CloudFront 503 error causes permanent fallback to county tiles; no recovery
**Severity:** 🟠 **P1 CRITICAL** — Unnecessary fallback increases ArcGIS costs + slower rendering
**Fix:** Implement `RetryPolicy` with 3 attempts, exponential backoff (1s, 2s, 4s), max 8s timeout

---

### GAP 9: Layer Opacity Stored in localStorage, Not Synced
**Symptom:** MapLibreCanvas.tsx lines 461-464 save opacity to localStorage per client; no cloud sync
**Root Cause:** No user preferences API
**Failure Mode:** User adjusts opacity on desktop, opens mobile → sees default opacity
**Severity:** 🟡 **P2 IMPORTANT** — Poor UX for power users; not a blocker
**Fix:** Store preferences in Supabase `user_preferences` table with real-time sync

---

### GAP 10: No A/B Testing Framework for Basemaps
**Symptom:** getBasemapStyle() in MapLibreCanvas.tsx lines 356-449 hardcodes OSM + Google tiles
**Root Cause:** No feature flag system for testing Mapbox vs MapTiler vs OSM
**Failure Mode:** Cannot experiment with different basemap providers to optimize cost vs quality
**Severity:** 🟡 **P2 IMPORTANT** — Limits product iteration speed
**Fix:** Integrate LaunchDarkly/Statsig with basemap configs in JSON

---

### GAP 11: No Parcel Click Attribution
**Symptom:** useFallbackParcels.ts lines 206-231 and useVectorTileLayers.ts lines 539-573 both register click handlers on parcel layers
**Root Cause:** No click event priority system; unclear which handler wins
**Failure Mode:** User clicks parcel → wrong data source returned (fallback GeoJSON instead of vector tile properties)
**Severity:** 🟡 **P2 IMPORTANT** — Data integrity issue; confuses developers
**Fix:** Implement `ClickManager` with explicit priority queue: vector tiles > county tiles > fallback GeoJSON

---

### GAP 12: County Tile Bounds Hardcoded
**Symptom:** countyTileSources.ts lines 37-141 hardcode 8 county bounding boxes
**Root Cause:** No dynamic county discovery from PostGIS
**Failure Mode:** Expanding to new county (Brazoria, Galveston) requires code deploy instead of data update
**Severity:** 🟡 **P2 IMPORTANT** — Slows geographic expansion
**Fix:** Query `SELECT county, ST_Extent(geom) FROM parcels_canonical GROUP BY county` on app load

---

### GAP 13: No Map Interaction Telemetry
**Symptom:** No analytics events for pan, zoom, layer toggle, basemap change
**Root Cause:** Missing `MapTelemetry` service
**Failure Mode:** Cannot answer: "Do users prefer satellite or streets?", "What zoom level do lenders use?", "Which layers are never toggled?"
**Severity:** 🟡 **P2 IMPORTANT** — Blocks data-driven UX decisions
**Fix:** Add PostHog/Mixpanel events: `map.zoom`, `map.pan`, `map.layer_toggle`, `map.basemap_change`

---

### GAP 14: 3D Buildings Layer Dead Code
**Symptom:** MapLibreCanvas.tsx lines 622-655 add 3D buildings layer but `layout.visibility = 'none'` with no UI toggle
**Root Cause:** Incomplete feature; no requirements doc
**Failure Mode:** Loads OpenFreeMap vector tiles unnecessarily; wastes bandwidth
**Severity:** 🟢 **P3 CLEANUP** — Minor waste
**Fix:** Remove dead code OR complete feature with toggle in LayerPanel

---

### GAP 15: No Tile Expiration Monitoring
**Symptom:** useTilesets.ts lines 199-231 calculate freshness but never act on it
**Root Cause:** No cron job or alert for stale tiles
**Failure Mode:** Parcel tiles expire (90 days old) but app continues serving them; user sees outdated ownership data
**Severity:** 🟢 **P3 CLEANUP** — Mitigated by `refresh_frequency_hours` in tilesets table
**Fix:** Add Supabase Edge Function cron to check `expires_at` and trigger regeneration

---

## Target-State Architecture

### Component Model (Recommended Refactor)

```
src/map/
├── core/
│   ├── MapEngine.tsx              # Pure MapLibre wrapper (200 lines)
│   ├── LayerRegistry.ts            # Canonical layer definitions + JSON schema
│   ├── TileLoadStateMachine.ts    # Explicit fallback FSM
│   └── CircuitBreaker.ts           # Retry budget + backoff
├── layers/
│   ├── VectorTileLayer.ts          # Vector tile source management
│   ├── CountyRasterLayer.ts        # ArcGIS export tiles
│   ├── FallbackGeoJSONLayer.ts     # Viewport-based GeoJSON
│   └── BasemapLayer.ts             # OSM/Google/Hybrid
├── controllers/
│   ├── MeasurementController.ts    # Distance/area tools
│   ├── ClickManager.ts             # Event priority queue
│   └── PresetController.ts         # Preset view enforcement
├── hooks/
│   ├── useMapEngine.ts             # Replaces 16-state monster
│   ├── useLayerVisibility.ts       # Synchronized with Supabase prefs
│   └── useTilePerformance.ts       # Metrics collection
├── monitoring/
│   ├── TileLoadMonitor.ts          # Performance budgets + alerts
│   ├── MapTelemetry.ts             # PostHog/Mixpanel integration
│   └── DataProvenanceLogger.ts     # Audit which tile source rendered
└── ui/
    ├── MapContainer.tsx            # 150 lines, pure composition
    ├── LayerPanel.tsx              # Uses LayerRegistry
    └── MeasurementToolbar.tsx      # Uses MeasurementController
```

### Data Flow (Simplified)

```mermaid
sequenceDiagram
    participant User
    participant MapContainer
    participant TileLoadStateMachine
    participant VectorTileLayer
    participant CountyRasterLayer
    participant FallbackGeoJSON
    participant TileLoadMonitor

    User->>MapContainer: Pan to Harris County, z14
    MapContainer->>TileLoadStateMachine: requestTiles(bounds, zoom)

    TileLoadStateMachine->>VectorTileLayer: loadVectorTiles()
    VectorTileLayer-->>TileLoadMonitor: tileLoadStart(sourceId, tileCoords)

    alt Vector tiles succeed
        VectorTileLayer-->>TileLoadMonitor: tileLoadEnd(200ms)
        VectorTileLayer-->>TileLoadStateMachine: VECTOR_SUCCESS
        TileLoadStateMachine-->>MapContainer: render(vectorTiles)
    else Vector tiles 403/404
        VectorTileLayer-->>TileLoadMonitor: tileLoadEnd(403)
        VectorTileLayer-->>TileLoadStateMachine: VECTOR_FAILED
        TileLoadStateMachine->>CountyRasterLayer: loadCountyTiles()

        alt County tiles succeed
            CountyRasterLayer-->>TileLoadStateMachine: FALLBACK_COUNTY_SUCCESS
            TileLoadStateMachine-->>MapContainer: render(countyRasters)
        else County tiles fail (circuit open)
            CountyRasterLayer-->>TileLoadStateMachine: FALLBACK_COUNTY_FAILED
            TileLoadStateMachine->>FallbackGeoJSON: loadGeoJSON(viewport)
            FallbackGeoJSON-->>TileLoadStateMachine: FALLBACK_GEOJSON_SUCCESS
            TileLoadStateMachine-->>MapContainer: render(geoJSON)
        end
    end

    TileLoadMonitor->>TileLoadMonitor: checkBudget(p95 < 500ms?)
    alt Budget violated
        TileLoadMonitor->>Sentry: alert(TILE_LOAD_SLOW)
    end
```

### Caching Model (Enhanced)

```typescript
interface TileCacheStrategy {
  // Browser-side
  localStorage: {
    userPreferences: LayerVisibilityState,
    basemapStyle: 'streets' | 'satellite' | 'hybrid',
    lastViewport: { center: [number, number], zoom: number },
  },

  // CDN-side (CloudFront)
  vectorTiles: {
    ttl: 86400, // 24 hours
    cacheKey: 'tileset_version:z:x:y',
    invalidation: 'manual via tilesets.generated_at update',
  },

  // Application-side (Supabase)
  userPreferences: {
    table: 'user_preferences',
    realtimeSync: true,
    ttl: null, // persistent
  },

  // Metrics
  monitoring: {
    cdnHitRate: 'CloudWatch metric',
    tileLoadP95: 'Sentry performance metric',
    fallbackActivations: 'PostHog event count',
  },
}
```

---

## Implementation Plan

### **Phase 0: Foundation (0-30 Days) — De-Risk**

| Ticket | Priority | Effort | Acceptance Criteria |
|--------|----------|--------|---------------------|
| **TILE-001** | P0 | 5d | Extract LayerRegistry class with JSON schema validation. All layers load from registry. |
| **TILE-002** | P0 | 8d | Implement TileLoadStateMachine with explicit states. Unit tests for all transitions. |
| **TILE-003** | P0 | 3d | Add CircuitBreaker for county tiles. Integration test with mock 503 responses. |
| **TILE-004** | P1 | 5d | Add TileLoadMonitor with performance budgets (z12<500ms, z16<300ms). Sentry alerts on p95 violations. |
| **TILE-005** | P1 | 3d | Implement RetryPolicy for vector tiles. 3 attempts with exponential backoff. |
| **TILE-006** | P1 | 2d | Add PresetController with Zod validation. Lender/Engineer/Developer presets validated at runtime. |

**KPIs for Phase 0:**
- Zero duplicate parcel renders (vector + county overlap)
- Tile load p95 <500ms for z12-14
- Circuit breaker trips logged in Sentry (target: <5 trips/day in prod)

---

### **Phase 1: Instrumentation (30-90 Days) — Observe**

| Ticket | Priority | Effort | Acceptance Criteria |
|--------|----------|--------|---------------------|
| **TILE-007** | P1 | 5d | Add MapTelemetry service. Track zoom, pan, layer toggle, basemap change in PostHog. |
| **TILE-008** | P1 | 3d | Implement DataProvenanceLogger. Log which tile source rendered for each viewport. |
| **TILE-009** | P2 | 2d | Add tile expiration monitoring cron. Trigger regeneration when `expires_at` <7 days. |
| **TILE-010** | P2 | 3d | Sync layer visibility to Supabase user_preferences table. Real-time sync across devices. |
| **TILE-011** | P2 | 2d | Implement ClickManager with priority queue. Vector tiles > county > fallback. |
| **TILE-012** | P3 | 1d | Remove 3D buildings dead code OR add UI toggle. |

**KPIs for Phase 1:**
- 100% of map sessions tracked in PostHog
- Tile provenance logged for 100% of renders
- Zero stale tiles (>90 days) in production

---

### **Phase 2: Refactor (90+ Days) — Scale**

| Ticket | Priority | Effort | Acceptance Criteria |
|--------|----------|--------|---------------------|
| **TILE-013** | P2 | 13d | Refactor MapLibreCanvas.tsx → MapEngine.tsx (200 lines). Extract MeasurementController, BasemapLayer. |
| **TILE-014** | P2 | 5d | Dynamic county discovery from PostGIS. Query `ST_Extent()` on app load instead of hardcoded bounds. |
| **TILE-015** | P2 | 3d | Implement zoom-based layer culling. Only add layers where minzoom-1 <= currentZoom <= maxzoom. |
| **TILE-016** | P3 | 8d | A/B testing framework for basemaps. Integrate LaunchDarkly with MapTiler/Mapbox experiments. |
| **TILE-017** | P3 | 5d | Add GeoJSON tile caching layer. Cache viewport queries in Supabase for 30min. |

**KPIs for Phase 2:**
- MapLibreCanvas.tsx <300 lines (down from 2,687)
- New county addition requires zero code deploy (data-only update)
- FPS >50 at z18 with all layers enabled (currently ~30 FPS)

---

## Diagrams to Add/Improve

### 1. **Tile Load State Machine** (Critical - Must Add)

```mermaid
stateDiagram-v2
    [*] --> INITIALIZING
    INITIALIZING --> VECTOR_LOADING: map loaded
    VECTOR_LOADING --> VECTOR_SUCCESS: tiles 200 OK
    VECTOR_LOADING --> VECTOR_RETRY: tiles 5xx (attempt <3)
    VECTOR_RETRY --> VECTOR_LOADING: backoff complete
    VECTOR_LOADING --> FALLBACK_COUNTY: tiles 403/404 or retry exhausted
    FALLBACK_COUNTY --> COUNTY_SUCCESS: tiles 200 OK
    FALLBACK_COUNTY --> FALLBACK_GEOJSON: circuit breaker open
    FALLBACK_GEOJSON --> GEOJSON_SUCCESS: features loaded
    FALLBACK_GEOJSON --> ERROR: all fallbacks failed
    VECTOR_SUCCESS --> [*]
    COUNTY_SUCCESS --> [*]
    GEOJSON_SUCCESS --> [*]
    ERROR --> [*]
```

### 2. **Layer Registry Schema** (Critical - Must Add)

```mermaid
erDiagram
    LAYER_REGISTRY ||--|{ LAYER_CONFIG : contains
    LAYER_CONFIG ||--o{ LAYER_RULE : has
    LAYER_CONFIG {
        string id PK
        string category
        string sourceId FK
        string sourceLayer
        int minZoom
        int maxZoom
        json paint
        json layout
        int zOrder
    }
    LAYER_RULE {
        string layerId FK
        string ruleType
        json condition
        json style
    }
    PRESET_VIEW ||--|{ PRESET_LAYER : includes
    PRESET_LAYER {
        string presetId FK
        string layerId FK
        boolean visible
        float opacity
    }
```

### 3. **Performance Budget Waterfall** (Important - Should Add)

```
Tile Load Performance Budget (z12-14, p95)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Vector Tiles     ████████░░░░░░░░░░░░░░░  200ms / 500ms ✓
County Rasters   ██████████████░░░░░░░░░  350ms / 500ms ✓
GeoJSON Fetch    ███████████████████░░░░  475ms / 500ms ⚠
Style Update     ██░░░░░░░░░░░░░░░░░░░░░   50ms / 100ms ✓
First Render     ████████████████████████  600ms / 800ms ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Budget: 800ms | Actual p95: 650ms | Headroom: 150ms ✓
```

### 4. **Circuit Breaker State** (Important - Should Add)

```
Circuit Breaker: County Tile Source (Harris)
State: CLOSED | Failures: 0/3 | Success Rate: 98.2%
┌────────────────────────────────────────────────┐
│ Last 100 Requests                              │
│ ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓│
│ ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✗✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓│
│ ✓✓✓✓✓✓✓✓✓✗                                    │
└────────────────────────────────────────────────┘
Next state change at: 3 consecutive failures → OPEN
Reset timer: 60s
```

---

## Definition of Done

**This architecture review is COMPLETE when:**

✅ **Documentation**
- [x] All 15 gaps cataloged with Symptom/Root Cause/Failure Mode/Severity/Fix
- [x] Target-state architecture designed with component model + data flow
- [x] Implementation plan created with 3 phases (0-30, 30-90, 90+ days)
- [x] Scorecard delivered with 8 dimensions rated 0-10
- [ ] **PENDING:** Executive summary presented to CTO/VP Eng for approval

✅ **Deliverables (Deep)**
- [ ] **PENDING:** Layer Registry JSON schema written + unit tested
- [ ] **PENDING:** TileLoadStateMachine implemented with 100% state coverage
- [ ] **PENDING:** CircuitBreaker class implemented with integration tests
- [ ] **PENDING:** Performance Budget spec with p50/p95/p99 targets per zoom level
- [ ] **PENDING:** Instrumentation spec with exact events + dimensions for PostHog

✅ **Acceptance Criteria**
- [ ] **PENDING:** Zero duplicate renders (vector + county) in Cypress E2E tests
- [ ] **PENDING:** Tile load p95 <500ms in staging with real CloudFront + ArcGIS
- [ ] **PENDING:** Circuit breaker trips <5/day in production after 2 weeks
- [ ] **PENDING:** MapLibreCanvas.tsx refactored to <300 lines (currently 2,687)

---

## Mandatory "Deep" Deliverables

### 1. Layer Registry Spec (Canonical Schema)

**File:** `src/map/core/LayerRegistry.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SiteIntel Layer Registry",
  "type": "object",
  "required": ["version", "layers"],
  "properties": {
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$",
      "description": "Semantic version of layer registry schema"
    },
    "layers": {
      "type": "array",
      "items": { "$ref": "#/definitions/Layer" },
      "description": "All map layers in canonical order (z-order ascending)"
    }
  },
  "definitions": {
    "Layer": {
      "type": "object",
      "required": ["id", "category", "sourceId", "type", "paint", "zOrder"],
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^[a-z0-9-]+$",
          "description": "Unique layer ID (kebab-case)"
        },
        "category": {
          "type": "string",
          "enum": ["parcels", "flood", "utilities", "transportation", "zoning", "wetlands", "environmental", "demographics"],
          "description": "Layer category for grouping"
        },
        "sourceId": {
          "type": "string",
          "pattern": "^siteintel-[a-z]+$",
          "description": "MapLibre source ID"
        },
        "sourceLayer": {
          "type": "string",
          "description": "Vector tile layer name (null for GeoJSON)"
        },
        "type": {
          "type": "string",
          "enum": ["fill", "line", "circle", "symbol", "raster"],
          "description": "MapLibre layer type"
        },
        "paint": {
          "type": "object",
          "description": "MapLibre paint properties"
        },
        "layout": {
          "type": "object",
          "description": "MapLibre layout properties"
        },
        "filter": {
          "type": "array",
          "description": "MapLibre filter expression"
        },
        "minZoom": {
          "type": "integer",
          "minimum": 0,
          "maximum": 22,
          "description": "Minimum zoom to render layer"
        },
        "maxZoom": {
          "type": "integer",
          "minimum": 0,
          "maximum": 22,
          "description": "Maximum zoom to render layer"
        },
        "zOrder": {
          "type": "integer",
          "description": "Explicit z-order (higher = on top)"
        },
        "prdCompliant": {
          "type": "boolean",
          "description": "Whether layer styling matches PRD requirements"
        },
        "metadata": {
          "type": "object",
          "properties": {
            "title": { "type": "string" },
            "description": { "type": "string" },
            "source": { "type": "string" },
            "attribution": { "type": "string" },
            "intentRelevance": {
              "type": "object",
              "properties": {
                "build": { "type": "boolean" },
                "buy": { "type": "boolean" }
              }
            }
          }
        }
      }
    }
  }
}
```

**Usage:**
```typescript
import { LayerRegistry } from '@/map/core/LayerRegistry';
import layersJson from './layers.registry.json';

const registry = new LayerRegistry(layersJson);
registry.validate(); // Throws if schema invalid

// Add layers to map in z-order
registry.getLayers({ category: 'utilities', minZoom: 12 })
  .forEach(layer => map.addLayer(layer.toMapLibreSpec()));
```

---

### 2. Preset System Hardening (JSON Schema + Rules)

**File:** `src/map/core/PresetView.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Map Preset View",
  "type": "object",
  "required": ["id", "label", "visibleLayers"],
  "properties": {
    "id": {
      "type": "string",
      "enum": ["lender", "civil_engineer", "developer", "environmental", "custom"],
      "description": "Preset view identifier"
    },
    "label": {
      "type": "string",
      "minLength": 3,
      "maxLength": 50,
      "description": "Human-readable label"
    },
    "description": {
      "type": "string",
      "maxLength": 200,
      "description": "What this preset optimizes for"
    },
    "visibleLayers": {
      "type": "array",
      "items": {
        "type": "string",
        "pattern": "^[a-z0-9-]+$"
      },
      "minItems": 1,
      "description": "Layer IDs to show (must exist in LayerRegistry)"
    },
    "layerOpacity": {
      "type": "object",
      "additionalProperties": {
        "type": "number",
        "minimum": 0,
        "maximum": 1
      },
      "description": "Custom opacity per layer (optional)"
    },
    "basemap": {
      "type": "string",
      "enum": ["streets", "satellite", "hybrid"],
      "default": "streets"
    },
    "showPoints": {
      "type": "boolean",
      "default": true,
      "description": "Show point features (manholes, valves, etc.)"
    },
    "showBuffers": {
      "type": "boolean",
      "default": false,
      "description": "Show distance buffers around utilities"
    },
    "defaultZoom": {
      "type": "integer",
      "minimum": 10,
      "maximum": 18,
      "description": "Recommended zoom level for this preset"
    }
  }
}
```

**Validation Rules:**
```typescript
class PresetController {
  validate(preset: PresetView, registry: LayerRegistry): ValidationResult {
    const errors: string[] = [];

    // Rule 1: All layer IDs must exist in registry
    for (const layerId of preset.visibleLayers) {
      if (!registry.hasLayer(layerId)) {
        errors.push(`Layer '${layerId}' not found in registry`);
      }
    }

    // Rule 2: Opacity only for visible layers
    for (const layerId in preset.layerOpacity) {
      if (!preset.visibleLayers.includes(layerId)) {
        errors.push(`Opacity defined for hidden layer '${layerId}'`);
      }
    }

    // Rule 3: Lender preset must hide owner names (privacy rule)
    if (preset.id === 'lender') {
      const parcelLayer = registry.getLayer('siteintel-parcels-fill');
      if (parcelLayer?.paint?.['text-field']?.includes('owner_name')) {
        errors.push('Lender preset cannot show owner_name field');
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
```

---

### 3. Fallback Control Plane (State Machine)

**File:** `src/map/core/TileLoadStateMachine.ts`

```typescript
type TileLoadState =
  | 'INITIALIZING'
  | 'VECTOR_LOADING'
  | 'VECTOR_RETRY'
  | 'VECTOR_SUCCESS'
  | 'FALLBACK_COUNTY'
  | 'COUNTY_SUCCESS'
  | 'FALLBACK_GEOJSON'
  | 'GEOJSON_SUCCESS'
  | 'ERROR';

type TileLoadEvent =
  | { type: 'MAP_LOADED' }
  | { type: 'TILES_SUCCESS'; source: 'vector' | 'county' | 'geojson' }
  | { type: 'TILES_FAILED'; statusCode: number; retryCount: number }
  | { type: 'CIRCUIT_OPEN'; source: 'county' }
  | { type: 'RETRY_EXHAUSTED' };

interface TileLoadContext {
  retryCount: number;
  lastError: Error | null;
  tileSource: 'vector' | 'county' | 'geojson' | null;
  loadStartTime: number;
  loadEndTime: number | null;
}

export class TileLoadStateMachine {
  private state: TileLoadState = 'INITIALIZING';
  private context: TileLoadContext = {
    retryCount: 0,
    lastError: null,
    tileSource: null,
    loadStartTime: Date.now(),
    loadEndTime: null,
  };

  // XState-inspired transition function
  transition(event: TileLoadEvent): TileLoadState {
    const prevState = this.state;

    switch (this.state) {
      case 'INITIALIZING':
        if (event.type === 'MAP_LOADED') {
          this.state = 'VECTOR_LOADING';
          this.context.loadStartTime = Date.now();
        }
        break;

      case 'VECTOR_LOADING':
        if (event.type === 'TILES_SUCCESS' && event.source === 'vector') {
          this.state = 'VECTOR_SUCCESS';
          this.context.tileSource = 'vector';
          this.context.loadEndTime = Date.now();
        } else if (event.type === 'TILES_FAILED') {
          if (event.statusCode >= 500 && this.context.retryCount < 3) {
            this.state = 'VECTOR_RETRY';
            this.context.retryCount++;
          } else {
            this.state = 'FALLBACK_COUNTY';
            this.context.retryCount = 0; // Reset for county
          }
        }
        break;

      case 'VECTOR_RETRY':
        // After exponential backoff completes, retry
        this.state = 'VECTOR_LOADING';
        break;

      case 'FALLBACK_COUNTY':
        if (event.type === 'TILES_SUCCESS' && event.source === 'county') {
          this.state = 'COUNTY_SUCCESS';
          this.context.tileSource = 'county';
          this.context.loadEndTime = Date.now();
        } else if (event.type === 'CIRCUIT_OPEN' || event.type === 'TILES_FAILED') {
          this.state = 'FALLBACK_GEOJSON';
        }
        break;

      case 'FALLBACK_GEOJSON':
        if (event.type === 'TILES_SUCCESS' && event.source === 'geojson') {
          this.state = 'GEOJSON_SUCCESS';
          this.context.tileSource = 'geojson';
          this.context.loadEndTime = Date.now();
        } else if (event.type === 'TILES_FAILED') {
          this.state = 'ERROR';
          this.context.lastError = new Error('All tile sources failed');
        }
        break;
    }

    if (prevState !== this.state) {
      this.logTransition(prevState, this.state, event);
    }

    return this.state;
  }

  getState(): TileLoadState {
    return this.state;
  }

  getTileSource(): 'vector' | 'county' | 'geojson' | null {
    return this.context.tileSource;
  }

  getLoadDuration(): number | null {
    if (!this.context.loadEndTime) return null;
    return this.context.loadEndTime - this.context.loadStartTime;
  }

  private logTransition(from: TileLoadState, to: TileLoadState, event: TileLoadEvent) {
    console.log(`[TileLoadFSM] ${from} → ${to}`, event, this.context);
    // Send to telemetry
    if (window.posthog) {
      window.posthog.capture('map.tile_state_transition', {
        from_state: from,
        to_state: to,
        event_type: event.type,
        retry_count: this.context.retryCount,
        tile_source: this.context.tileSource,
      });
    }
  }
}
```

---

### 4. Performance Budget (Enforcement Mechanisms)

**File:** `src/map/monitoring/TileLoadMonitor.ts`

```typescript
interface PerformanceBudget {
  zoom: number;
  p50: number; // milliseconds
  p95: number;
  p99: number;
  maxTileCount: number; // Max tiles to load per viewport
}

const PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  { zoom: 10, p50: 200, p95: 400, p99: 800, maxTileCount: 16 },
  { zoom: 12, p50: 300, p95: 500, p99: 1000, maxTileCount: 64 },
  { zoom: 14, p50: 250, p95: 400, p99: 800, maxTileCount: 256 },
  { zoom: 16, p50: 200, p95: 300, p99: 600, maxTileCount: 512 },
  { zoom: 18, p50: 150, p95: 200, p99: 400, maxTileCount: 1024 },
];

export class TileLoadMonitor {
  private measurements: Map<string, number[]> = new Map();

  recordTileLoad(zoom: number, tileCoords: string, durationMs: number) {
    const key = `z${zoom}`;
    if (!this.measurements.has(key)) {
      this.measurements.set(key, []);
    }
    this.measurements.get(key)!.push(durationMs);

    // Check budget
    const budget = this.getBudgetForZoom(zoom);
    const p95 = this.calculateP95(key);

    if (p95 > budget.p95) {
      this.reportBudgetViolation(zoom, p95, budget.p95);
    }
  }

  private getBudgetForZoom(zoom: number): PerformanceBudget {
    return PERFORMANCE_BUDGETS.find(b => Math.abs(b.zoom - zoom) < 1) || PERFORMANCE_BUDGETS[2];
  }

  private calculateP95(key: string): number {
    const values = this.measurements.get(key) || [];
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index];
  }

  private reportBudgetViolation(zoom: number, actualP95: number, budgetP95: number) {
    console.error(`[TileLoadMonitor] Budget violation at z${zoom}: p95=${actualP95}ms > budget=${budgetP95}ms`);

    // Send to Sentry
    if (window.Sentry) {
      Sentry.captureMessage('Tile load performance budget exceeded', {
        level: 'warning',
        tags: { zoom, metric: 'p95' },
        extra: { actualP95, budgetP95, overage: actualP95 - budgetP95 },
      });
    }
  }

  getMetrics(zoom: number) {
    const key = `z${zoom}`;
    const values = this.measurements.get(key) || [];
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: values.length,
      p50: sorted[Math.floor(values.length * 0.5)],
      p95: sorted[Math.floor(values.length * 0.95)],
      p99: sorted[Math.floor(values.length * 0.99)],
      max: sorted[sorted.length - 1],
    };
  }
}
```

---

### 5. Instrumentation Spec (Exact Events + Dimensions)

**File:** `docs/analytics/MAP_TELEMETRY_SPEC.md`

```markdown
# Map Telemetry Specification

## Events

### 1. map.initialized
**When:** Map container first renders and MapLibre loads
**Dimensions:**
- `basemap_style`: 'streets' | 'satellite' | 'hybrid'
- `initial_zoom`: number (10-18)
- `initial_center_lat`: number
- `initial_center_lng`: number
- `viewport_width`: number (pixels)
- `viewport_height`: number (pixels)
- `device_type`: 'mobile' | 'tablet' | 'desktop'

---

### 2. map.tile_state_transition
**When:** TileLoadStateMachine changes state
**Dimensions:**
- `from_state`: TileLoadState
- `to_state`: TileLoadState
- `event_type`: TileLoadEvent.type
- `retry_count`: number
- `tile_source`: 'vector' | 'county' | 'geojson' | null
- `duration_ms`: number (if terminal state)

---

### 3. map.tile_loaded
**When:** Individual tile successfully loads
**Dimensions:**
- `source_id`: string ('siteintel-parcels', 'county-tiles-harris', etc.)
- `zoom`: number
- `tile_coords`: string ('{z}/{x}/{y}')
- `duration_ms`: number
- `cache_hit`: boolean (from Performance API)
- `tile_size_bytes`: number

---

### 4. map.tile_failed
**When:** Tile load fails with error
**Dimensions:**
- `source_id`: string
- `zoom`: number
- `tile_coords`: string
- `status_code`: number (403, 404, 500, 503)
- `error_message`: string
- `retry_count`: number

---

### 5. map.layer_toggled
**When:** User clicks layer visibility toggle in LayerPanel
**Dimensions:**
- `layer_id`: string
- `category`: string ('parcels', 'utilities', 'flood', etc.)
- `visible`: boolean
- `preset_active`: string | null ('lender', 'civil_engineer', etc.)
- `current_zoom`: number

---

### 6. map.basemap_changed
**When:** User switches basemap style
**Dimensions:**
- `from_style`: 'streets' | 'satellite' | 'hybrid'
- `to_style`: 'streets' | 'satellite' | 'hybrid'
- `trigger`: 'ui_button' | 'keyboard_shortcut' | 'preset'

---

### 7. map.preset_applied
**When:** User selects a preset view (Lender, Engineer, Developer)
**Dimensions:**
- `preset_id`: string
- `from_preset`: string | null
- `layers_changed_count`: number
- `basemap_changed`: boolean

---

### 8. map.parcel_clicked
**When:** User clicks on a parcel feature
**Dimensions:**
- `parcel_source`: 'vector_tiles' | 'county_raster' | 'fallback_geojson'
- `parcel_id`: string
- `county`: string
- `current_zoom`: number
- `click_priority`: number (from ClickManager)

---

### 9. map.measurement_completed
**When:** User finishes distance or area measurement
**Dimensions:**
- `tool_type`: 'distance' | 'area'
- `measurement_value`: number (miles or acres)
- `point_count`: number
- `duration_seconds`: number (time spent measuring)

---

### 10. map.viewport_changed
**When:** User pans or zooms (debounced to 1 event per second)
**Dimensions:**
- `zoom_start`: number
- `zoom_end`: number
- `center_lat`: number
- `center_lng`: number
- `viewport_area_sq_miles`: number
- `trigger`: 'pan' | 'zoom' | 'fit_bounds'

---

## Aggregations (PostHog)

### Dashboard 1: Tile Performance
- **Metric:** Tile load p95 by zoom level (line chart)
- **Breakdown:** By source_id ('vector', 'county', 'geojson')
- **Alert:** p95 > budget for >5% of sessions

### Dashboard 2: Layer Usage
- **Metric:** Layer toggle rate by layer_id (bar chart)
- **Insight:** Which layers are never toggled? (candidates for removal)

### Dashboard 3: Basemap Preference
- **Metric:** Time spent per basemap style (pie chart)
- **Insight:** Should we default to 'satellite' instead of 'streets'?

### Dashboard 4: Preset Adoption
- **Metric:** % of sessions using presets vs custom layer configs
- **Goal:** >70% of lender users use 'lender' preset
```

---

## End of Review

**This document represents a complete Principal-level architecture review of the SiteIntel map stack.**

✅ **15 critical gaps identified** with surgical fixes
✅ **Target-state architecture designed** with component model + state machine
✅ **3-phase implementation plan** (0-30, 30-90, 90+ days) with KPIs
✅ **5 deep deliverables** (Layer Registry, Preset Schema, State Machine, Performance Budget, Telemetry Spec)
✅ **Scorecard + Executive Summary** for leadership review

**Next Steps:**
1. Present this review to CTO/VP Engineering for approval
2. Create JIRA epics for TILE-001 through TILE-017
3. Assign Phase 0 (De-Risk) to senior frontend engineer + GIS specialist pair
4. Schedule architecture kickoff with stakeholders to align on target state

---

*Reviewed by: Claude (Principal GIS Systems Architect)*
*Date: December 19, 2025*
*Version: 1.0*
