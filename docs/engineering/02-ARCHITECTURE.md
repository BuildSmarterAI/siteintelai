# B. Architecture

> System diagrams, component hierarchy, and data flow

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐        │
│    │ Desktop  │    │  Mobile  │    │  Tablet  │    │   API    │        │
│    │ Browser  │    │ Browser  │    │ Browser  │    │ Clients  │        │
│    └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘        │
│         └───────────────┴───────────────┴───────────────┘              │
│                                  │                                      │
│                          ┌───────▼───────┐                              │
│                          │   Cloudflare  │                              │
│                          │     CDN       │                              │
│                          └───────┬───────┘                              │
└──────────────────────────────────┼──────────────────────────────────────┘
                                   │
┌──────────────────────────────────┼──────────────────────────────────────┐
│                          ┌───────▼───────┐                              │
│                          │    Lovable    │                              │
│                          │  App Server   │                              │
│                          │  (Vite/React) │                              │
│                          └───────┬───────┘                              │
│                                  │                                      │
│              ┌───────────────────┼───────────────────┐                  │
│              │                   │                   │                  │
│       ┌──────▼──────┐    ┌───────▼───────┐   ┌──────▼──────┐           │
│       │   Static    │    │   Supabase    │   │   Stripe    │           │
│       │   Assets    │    │   Platform    │   │   Payments  │           │
│       └─────────────┘    └───────┬───────┘   └─────────────┘           │
│                                  │                                      │
│         ┌────────────────────────┼────────────────────────┐            │
│         │            │           │           │            │            │
│  ┌──────▼──────┐ ┌───▼───┐ ┌─────▼─────┐ ┌───▼───┐ ┌─────▼─────┐      │
│  │  PostgreSQL │ │ Auth  │ │  Storage  │ │ Real- │ │   Edge    │      │
│  │  + PostGIS  │ │ (JWT) │ │  Buckets  │ │ time  │ │ Functions │      │
│  └─────────────┘ └───────┘ └───────────┘ └───────┘ └─────┬─────┘      │
│                                                          │             │
│                     ┌────────────────────────────────────┘             │
│                     │                                                  │
│    ┌────────────────┼────────────────┬────────────────┐               │
│    ▼                ▼                ▼                ▼               │
│ ┌──────┐       ┌──────┐        ┌──────┐        ┌──────┐               │
│ │Google│       │ArcGIS│        │ FEMA │        │ EPA  │               │
│ │ APIs │       │ GIS  │        │OpenF.│        │ ECHO │               │
│ └──────┘       └──────┘        └──────┘        └──────┘               │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

### Frontend Architecture

```
src/
├── App.tsx                          # Root component + routing
│
├── pages/                           # Route components
│   ├── Index.tsx                    # Landing page
│   ├── Dashboard.tsx                # User dashboard
│   ├── Application.tsx              # Multi-step form
│   ├── ReportViewer.tsx             # Report display
│   ├── Pricing.tsx                  # Pricing page
│   └── ...                          # 30+ pages
│
├── components/
│   ├── ui/                          # shadcn primitives (50+)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   │
│   ├── sections/                    # Page sections
│   │   ├── Hero.tsx
│   │   ├── Pricing.tsx
│   │   └── ...
│   │
│   ├── navigation/                  # Nav components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── DashboardSidebar.tsx
│   │
│   └── [feature]/                   # Feature components
│       ├── MapLibreCanvas.tsx
│       ├── QuickCheckWidget.tsx
│       └── ...
│
├── hooks/                           # Custom hooks
│   ├── use-toast.ts
│   ├── useMapLayers.ts
│   └── ...
│
├── features/                        # Feature modules
│   └── hospitality-hii/
│       ├── hooks/
│       ├── store/
│       └── types.ts
│
├── contexts/                        # React contexts
│   └── SubscriptionContext.tsx
│
├── integrations/
│   └── supabase/
│       ├── client.ts
│       └── types.ts
│
└── lib/                             # Utilities
    └── utils.ts
```

---

## Data Flow Architecture

### Application Submission Flow

```
┌─────────┐     ┌─────────┐     ┌─────────────┐     ┌──────────────┐
│  User   │────▶│  Form   │────▶│  submit-    │────▶│ applications │
│ Input   │     │  State  │     │ application │     │    table     │
└─────────┘     └─────────┘     └──────┬──────┘     └──────────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │   orchestrate-  │
                              │   application   │
                              └────────┬────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
┌───────────────┐            ┌─────────────────┐            ┌─────────────┐
│ enrich-       │            │ enrich-         │            │ enrich-     │
│ feasibility   │            │ utilities       │            │ wetlands    │
└───────┬───────┘            └────────┬────────┘            └──────┬──────┘
        │                             │                            │
        └─────────────────────────────┼────────────────────────────┘
                                      │
                                      ▼
                            ┌─────────────────┐
                            │ compute-        │
                            │ geospatial-score│
                            └────────┬────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │ generate-ai-    │
                            │ report          │
                            └────────┬────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │    reports      │
                            │     table       │
                            └─────────────────┘
```

### State Machine (Orchestration)

```
┌─────────┐
│ PENDING │
└────┬────┘
     │ submit
     ▼
┌─────────────┐
│ GEOCODING   │◀─────────────────────┐
└──────┬──────┘                      │
       │ success                     │ retry (max 3)
       ▼                             │
┌─────────────┐     fail      ┌──────┴──────┐
│ ENRICHING   │──────────────▶│   ERROR     │
└──────┬──────┘               └─────────────┘
       │ success
       ▼
┌─────────────┐
│ SCORING     │
└──────┬──────┘
       │ success
       ▼
┌─────────────┐
│ GENERATING  │
└──────┬──────┘
       │ success
       ▼
┌─────────────┐
│ COMPLETED   │
└─────────────┘
```

---

## Database Schema (ERD)

```
┌─────────────────┐       ┌─────────────────┐
│   profiles      │       │  applications   │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◀──┐   │ id (PK)         │
│ email           │   │   │ user_id (FK)────┼───┐
│ stripe_customer │   │   │ formatted_addr  │   │
│ created_at      │   │   │ geo_lat/lng     │   │
└─────────────────┘   │   │ parcel_id       │   │
                      │   │ status          │   │
                      │   │ enrichment_*    │   │
                      │   └────────┬────────┘   │
                      │            │            │
                      │            ▼            │
                      │   ┌─────────────────┐   │
                      │   │    reports      │   │
                      │   ├─────────────────┤   │
                      └───┤ user_id (FK)    │   │
                          │ application_id  │◀──┘
                          │ feasibility_score│
                          │ json_data       │
                          │ pdf_url         │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│subscription_tiers│      │user_subscriptions│
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◀──────│ tier_id (FK)    │
│ name            │       │ user_id (FK)────┼───▶ profiles
│ price_monthly   │       │ status          │
│ reports_per_mo  │       │ stripe_sub_id   │
│ stripe_price_id │       │ period_start/end│
└─────────────────┘       └─────────────────┘
```

---

## Edge Functions Architecture

### Function Categories

```
supabase/functions/
│
├── ORCHESTRATION
│   ├── orchestrate-application/     # Main state machine
│   └── submit-application/          # Initial submission
│
├── ENRICHMENT
│   ├── enrich-feasibility/          # Core enrichment
│   ├── enrich-utilities/            # Utility data
│   ├── enrich-utilities-osm/        # OSM fallback
│   ├── enrich-wetlands/             # USFWS NWI
│   ├── enrich-epa-echo/             # EPA facilities
│   └── query-fema-by-point/         # FEMA flood zones
│
├── REPORTS
│   ├── generate-ai-report/          # AI analysis
│   ├── generate-pdf/                # PDF rendering
│   ├── generate-quick-check/        # QuickCheck
│   └── get-sanitized-report/        # Public report view
│
├── PAYMENTS
│   ├── create-checkout-session/     # Stripe checkout
│   ├── create-subscription/         # New subscription
│   ├── stripe-webhook/              # Webhook handler
│   ├── customer-portal/             # Billing portal
│   ├── use-credit/                  # Deduct credits
│   └── get-credits/                 # Check balance
│
├── GIS
│   ├── fetch-geospatial-layers/     # Layer fetching
│   ├── fetch-hcad-parcels/          # Harris County
│   ├── compute-geospatial-score/    # Score calculation
│   └── gis-*/                       # GIS utilities
│
└── UTILITIES
    ├── google-places/               # Places API
    ├── google-place-details/        # Place details
    ├── fetch-elevation/             # Elevation data
    ├── fetch-drivetimes/            # Drive time analysis
    └── render-static-map/           # Map images
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Layer 1: Network Security                               │ │
│  │ • HTTPS/TLS everywhere                                  │ │
│  │ • Cloudflare DDoS protection                            │ │
│  │ • Rate limiting on API endpoints                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Layer 2: Authentication                                 │ │
│  │ • Supabase Auth (JWT)                                   │ │
│  │ • Email/password + OAuth                                │ │
│  │ • Session management                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Layer 3: Authorization                                  │ │
│  │ • Row Level Security (RLS) policies                     │ │
│  │ • user_roles table for RBAC                             │ │
│  │ • Edge function JWT verification                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Layer 4: Input Validation                               │ │
│  │ • Zod schema validation                                 │ │
│  │ • SQL injection prevention                              │ │
│  │ • XSS protection                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Layer 5: Data Protection                                │ │
│  │ • Encrypted at rest (PostgreSQL)                        │ │
│  │ • Encrypted in transit (TLS)                            │ │
│  │ • Signed URLs for storage                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Performance Architecture

### Caching Strategy

| Data Type | Cache Location | TTL | Strategy |
|-----------|----------------|-----|----------|
| Parcel Data | PostgreSQL | 30 days | Cache on first fetch |
| FEMA Flood | PostgreSQL | 90 days | Quarterly refresh |
| API Responses | Edge Function | 1 hour | In-memory |
| Static Assets | CDN | 1 year | Immutable |
| User Session | localStorage | 7 days | JWT refresh |

### Query Optimization

```sql
-- Spatial indexes for PostGIS queries
CREATE INDEX idx_parcels_geometry ON drawn_parcels USING GIST(geometry);
CREATE INDEX idx_flood_zones_geometry ON fema_flood_zones USING GIST(geometry);

-- Composite indexes for common queries
CREATE INDEX idx_applications_user_status 
ON applications(user_id, status);

CREATE INDEX idx_reports_app_type 
ON reports(application_id, report_type);
```
