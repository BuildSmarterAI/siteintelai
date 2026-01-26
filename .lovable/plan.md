
# Add Comprehensive Feature Documentation

## Overview
Create a complete documentation section covering all SiteIntel platform features, organized by user-facing capabilities. This expands the existing technical docs (`/docs`) with user-focused feature documentation accessible to all stakeholders (developers, lenders, investors).

---

## Current Documentation State
The existing `/docs` section contains **11 pages** focused on:
- Technical architecture (DSL, pipelines, tile serving)
- Data ingestion (Houston, Texas canonical)
- 3D visualization (CityEngine)

**Missing**: User-facing feature documentation explaining *what* each feature does and *how* to use it.

---

## New Documentation Structure

### Section 1: "Platform Features" (New Navigation Section)

| Page | Route | Description |
|------|-------|-------------|
| **Features Overview** | `/docs/features` | Landing page for all features |
| **Feasibility Reports** | `/docs/features/feasibility-reports` | $1,495 report product details |
| **Design Mode** | `/docs/features/design-mode` | 8-step conceptual design wizard |
| **Parcel Explorer** | `/docs/features/parcel-explorer` | Interactive parcel search & selection |
| **Market Intelligence** | `/docs/features/market-intelligence` | H3 hexagon trade area analysis |
| **Decision Map** | `/docs/features/decision-map` | Multi-layer GIS visualization |
| **AI Scoring Engine** | `/docs/features/scoring-engine` | 0-100 feasibility score methodology |
| **Compare Tool** | `/docs/features/compare` | SiteIntel vs traditional consultants |

### Section 2: "Report Domains" (New Navigation Section)

| Page | Route | Description |
|------|-------|-------------|
| **Zoning Analysis** | `/docs/domains/zoning` | Zoning verification, setbacks, FAR |
| **Flood Risk** | `/docs/domains/flood` | FEMA zones, BFE, NFIP claims |
| **Utilities** | `/docs/domains/utilities` | Water, sewer, storm infrastructure |
| **Environmental** | `/docs/domains/environmental` | Wetlands, EPA, soil data |
| **Traffic & Access** | `/docs/domains/traffic` | AADT, drive times, road network |
| **Market Demographics** | `/docs/domains/market` | Census data, proprietary indices |
| **Topography** | `/docs/domains/topography` | Elevation profiles, slope analysis |

### Section 3: "API Reference" (Expand Existing)

| Page | Route | Description |
|------|-------|-------------|
| **API v2 Overview** | `/docs/api/v2` | REST API with data_provenance |
| **Edge Functions Index** | `/docs/api/edge-functions` | All 130+ edge function reference |
| **Webhooks** | `/docs/api/webhooks` | GHL, Stripe webhook integrations |

---

## File Structure

```text
src/pages/docs/
├── features/
│   ├── FeaturesIndex.tsx          # Features landing page
│   ├── FeasibilityReports.tsx     # Report product docs
│   ├── DesignMode.tsx             # Design wizard docs
│   ├── ParcelExplorer.tsx         # Parcel search docs
│   ├── MarketIntelligence.tsx     # Trade area docs
│   ├── DecisionMap.tsx            # Map layers docs
│   ├── ScoringEngine.tsx          # AI scoring methodology
│   └── CompareTool.tsx            # Comparison feature docs
├── domains/
│   ├── Zoning.tsx
│   ├── Flood.tsx
│   ├── Utilities.tsx
│   ├── Environmental.tsx
│   ├── Traffic.tsx
│   ├── Market.tsx
│   └── Topography.tsx
└── api/
    ├── ApiV2.tsx
    ├── EdgeFunctionsIndex.tsx
    └── Webhooks.tsx
```

---

## New Doc Pages Content Outline

### 1. Features Overview (`/docs/features`)
- Feature matrix with links to each capability
- Platform screenshot gallery
- Quick start guide

### 2. Feasibility Reports (`/docs/features/feasibility-reports`)
- Product overview ($1,495 one-time)
- Report structure (7 domains)
- Data sources (20+ APIs)
- Delivery time (3-10 minutes)
- PDF export capabilities
- Lender-ready formatting

### 3. Design Mode (`/docs/features/design-mode`)
- 8-step wizard flow diagram
- Cesium 3D / MapLibre 2D canvas
- Building model gallery (16+ models)
- Compliance validation (FAR, height, coverage)
- Regulatory envelope computation
- Variant comparison
- Keyboard shortcuts

### 4. Parcel Explorer (`/docs/features/parcel-explorer`)
- County coverage (8 Texas counties)
- Parcel search by address/owner
- Click-to-select workflow
- Comparison mode (up to 4 parcels)
- Data source hierarchy (canonical → fallback)

### 5. Market Intelligence (`/docs/features/market-intelligence`)
- H3 hexagon visualization
- Preset system (1mi, 3mi, 5mi radius)
- Census data integration
- Proprietary indices (Retail Spending, Growth Potential, etc.)
- Demographic breakdown charts

### 6. Decision Map (`/docs/features/decision-map`)
- Layer presets (Decision, Lender Risk, Utilities, etc.)
- MapLibre GL rendering
- Vector tile architecture
- Legend system
- Mobile responsiveness

### 7. AI Scoring Engine (`/docs/features/scoring-engine`)
- Score formula (0-100)
- Weight distribution:
  - Zoning: 30%
  - Flood: 20%
  - Utilities: 20%
  - Environmental: 10%
  - Traffic: 10%
  - Market: 10%
- Kill factors detection
- Confidence scoring

### 8. Domain Pages (7 pages)
Each domain page includes:
- Data sources with citations
- Fields collected
- Scoring impact
- Sample data visualization
- Edge functions used

---

## Implementation Tasks

### Task 1: Update Navigation
**File:** `src/data/docs-navigation.ts`

Add two new sections:
```typescript
{
  title: "Platform Features",
  icon: Sparkles,
  items: [
    { title: "Features Overview", href: "/docs/features" },
    { title: "Feasibility Reports", href: "/docs/features/feasibility-reports" },
    { title: "Design Mode", href: "/docs/features/design-mode" },
    { title: "Parcel Explorer", href: "/docs/features/parcel-explorer" },
    { title: "Market Intelligence", href: "/docs/features/market-intelligence" },
    { title: "Decision Map", href: "/docs/features/decision-map" },
    { title: "AI Scoring Engine", href: "/docs/features/scoring-engine" },
  ],
},
{
  title: "Report Domains",
  icon: FileBarChart,
  items: [
    { title: "Zoning", href: "/docs/domains/zoning" },
    { title: "Flood Risk", href: "/docs/domains/flood" },
    { title: "Utilities", href: "/docs/domains/utilities" },
    { title: "Environmental", href: "/docs/domains/environmental" },
    { title: "Traffic & Access", href: "/docs/domains/traffic" },
    { title: "Market Demographics", href: "/docs/domains/market" },
    { title: "Topography", href: "/docs/domains/topography" },
  ],
}
```

### Task 2: Create Feature Doc Pages (8 pages)
Create new pages under `src/pages/docs/features/`:
- Each page uses `DocsLayout` wrapper
- Consistent structure: Hero → Overview → Details → Data Sources → Related
- Include screenshots where applicable
- Use `DiagramBlock` for architecture diagrams
- Use `CodeBlock` for API examples

### Task 3: Create Domain Doc Pages (7 pages)
Create new pages under `src/pages/docs/domains/`:
- Document each of the 7 feasibility domains
- Include data source citations
- Show scoring weights
- Reference edge functions

### Task 4: Add Routes to App.tsx
Add routes for all new documentation pages:
```typescript
// Features
<Route path="/docs/features" element={<FeaturesIndex />} />
<Route path="/docs/features/feasibility-reports" element={<FeasibilityReportsDocs />} />
<Route path="/docs/features/design-mode" element={<DesignModeDocs />} />
// ... etc

// Domains
<Route path="/docs/domains/zoning" element={<ZoningDocs />} />
<Route path="/docs/domains/flood" element={<FloodDocs />} />
// ... etc
```

### Task 5: Update DocsIndex.tsx
Add new sections to the documentation index page with links to:
- Platform Features grid
- Report Domains grid
- API Reference links

---

## Technical Details

### Components Used
- `DocsLayout` - Main documentation wrapper
- `DocsSidebar` - Navigation sidebar
- `DocsTableOfContents` - In-page navigation
- `DocsBreadcrumb` - Breadcrumb navigation
- `CodeBlock` - Code snippets with copy
- `DiagramBlock` - ASCII architecture diagrams

### Styling
- Brand colors: Feasibility Orange (#FF7A00), Data Cyan (#06B6D4), Midnight Blue (#0A0F2C)
- Dark theme consistent with existing docs
- IBM Plex Sans typography
- Glassmorphism cards

---

## Estimated Scope
- **New files:** 18 React components (doc pages)
- **Modified files:** 3 (navigation, App.tsx, DocsIndex)
- **Total routes added:** 15

---

## Deliverables
1. Complete feature documentation for all 8 major features
2. Domain-specific documentation for all 7 report sections
3. Updated navigation with new sections
4. Cross-linked documentation (features ↔ domains ↔ API)
5. Consistent UX matching existing docs portal
