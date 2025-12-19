# SITEINTEL™ — COMPLETE UX/UI BLUEPRINT
## Enterprise GIS + CRE Feasibility + Lender-Defensible Reporting

**Document Version:** 1.0  
**Date:** December 18, 2025  
**Classification:** Production Implementation Spec

---

## 1. EXECUTIVE UX VISION

### 1.1 Design Philosophy

SiteIntel™ is not a generic analytics dashboard. It is a **decision compression engine** built for high-stakes CRE underwriting. Every pixel serves one of three purposes:

1. **Kill-factor detection** — Surface hard declines within 10 seconds
2. **Evidence chain** — Make every risk claim traceable to source data
3. **Lender defensibility** — Generate outputs that satisfy IC/underwriting committees without explanation

The platform's competitive advantage is **Speed to NO**, not comprehensive exploration. Users are not browsing for insights; they are validating deal viability under time pressure. The UX must eliminate friction between "address input" and "decision output."

### 1.2 Market Positioning vs Competitors

| Competitor | UX Approach | SiteIntel™ Difference |
|------------|-------------|----------------------|
| **ArcGIS/Regrid** | GIS-first: 30+ layers, expert users | Decision-first: Presets hide complexity |
| **Gridics/Zoneomics** | Zoning-only; lacks environmental | Integrated: Zoning + flood + utilities + risk |
| **Deepblocks/Archistar** | Design-focused; playful aesthetics | Risk-focused: Institutional tone, audit-grade |
| **LightBox/Placer.ai** | Data aggregation; users do interpretation | AI-driven: Platform interprets and scores risk |

**SiteIntel™ Positioning:** The only platform that compresses 14-day feasibility cycles into 24-hour lender-ready reports by surfacing kill-factors first and providing traceable evidence chains.

### 1.3 Core UX Truth

> **Users are not exploring. They are deciding under uncertainty.**

This means:
- No hidden kill-factors behind tabs or scroll
- No "black box" AI without evidence links
- No generic scores without severity context
- No map-only views that force users to hunt for problems

---

## 2. UX PRINCIPLES (ENFORCED)

### P1: Kill-Factors Always Visible
Top 3 deal-breakers must fit in first viewport without scrolling. If a parcel has a floodway, the user sees it in under 10 seconds.

### P2: Progressive Disclosure
Show decision summary first (score + tier + kill-factors), then allow drilling into evidence. Never start with raw data.

### P3: Map is Contextual, Not Primary
The decision panel is the command center. Map provides spatial context but does not hide critical risk data in tooltips or popups.

### P4: Presets Over Toggles
Provide curated layer sets (Lender/Developer/Engineer) instead of exposing 30+ toggles. Reduce cognitive load.

### P5: Evidence is Accessible
Every risk claim has a "Show Source" link. Confidence scores, data freshness, and provenance are explicit.

### P6: Make Uncertainty Legible
"Data unavailable" is not failure. Show confidence levels, flag missing data, and recommend verification actions.

### P7: Reduce Cognitive Load
Limit simultaneous map overlays (max 4 at once). Use mutually exclusive market layers. Prevent color chaos.

### P8: Performance is UX
Fast interactions matter. No heavy layers by default. Use scale-dependent rendering. Show loading states.

### P9: Everything Exportable
All decisions must generate lender-ready PDFs or shareable links. No manual re-explanation required.

### P10: Institutional Tone
Calm, technical, precise. No consumer SaaS playfulness. No bright gradients. No animation except fast transitions (150-250ms).

---

## 3. ROUTE MAP & INFORMATION ARCHITECTURE

| Route | Purpose | Primary Users | Key Actions |
|-------|---------|---------------|-------------|
| `/` | Landing / Workspace | All | Start search, view queue, access reports |
| `/search` | Parcel Search | All | Enter address/APN, see recent searches |
| `/parcel/:id` | **Decision Cockpit** | All | View score, kill-factors, risk breakdown |
| `/parcel/:id/map` | Map Studio | Analysts | Advanced GIS view with controlled layers |
| `/parcel/:id/report` | Report Preview (Web) | Lenders/ICs | Review lender-ready report before export |
| `/compare` | Compare Parcels | Portfolio teams | Side-by-side risk matrix, bulk actions |
| `/queue` | Work Queue | Ops teams | Monitor runs, retry failures, view status |
| `/reports` | Report Library | All | Search/filter generated reports, re-run |
| `/settings` | User Preferences | All | Set presets, units, export defaults |
| `/admin` | Data Health (Optional) | Admins | Provenance dashboards, reliability scores |

**Global Navigation:**
- Top bar: Logo, Search, Queue (with count badge), Reports, Settings, User menu
- Breadcrumb trail for deep pages
- Persistent "Generate Report" CTA when viewing parcels

---

## 4. SCREEN-BY-SCREEN SPECIFICATIONS

### 4.1 `/search` — Parcel Search

**Purpose:** Fast address/APN lookup + recent search history

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ TopNav: [Logo] [SearchBar] [Queue 3] [Reports] [⚙️] │
├─────────────────────────────────────────────────────┤
│                                                      │
│          ┌──────────────────────────────┐          │
│          │  Search by Address or APN    │          │
│          │  [___________________] [🔍]  │          │
│          └──────────────────────────────┘          │
│                                                      │
│  Recent Searches                                     │
│  ┌────────────────────────────────────────────┐   │
│  │ 📍 1234 Main St, Houston TX                │   │
│  │    Green • Score 82 • Ran 2 hours ago      │   │
│  ├────────────────────────────────────────────┤   │
│  │ 📍 5678 Oak Ave, Dallas TX                 │   │
│  │    Red • Floodway • Ran yesterday          │   │
│  └────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Components:**
- `TopNav` (persistent across all routes)
- `SearchBar` (autocomplete, accepts address or APN)
- `RecentSearchesList` (each item is a `ParcelMiniCard`)

**Interactions:**
1. User types address → Suggestions appear (USPS/geocoding API)
2. Select suggestion → Route to `/parcel/:id`
3. Recent searches show:
   - Address
   - Score badge (Green/Yellow/Red)
   - Top 1-2 kill-factors (if any)
   - Timestamp ("2 hours ago", "yesterday")
4. Click recent → Route to `/parcel/:id`

**States:**
- **Empty:** "Enter an address or APN to begin"
- **No results:** "No parcel found. Try alternative spelling or check APN format"
- **Loading:** Skeleton cards with shimmer

**Mobile Considerations:**
- Search bar full-width
- Recent searches as vertical list (not grid)
- Larger touch targets (min 44pt)

---

### 4.2 `/parcel/:id` — Parcel Overview (Decision Cockpit)

**Purpose:** Answer in 3 minutes: "Is it feasible?" "What kills it?" "What's next?"

**Layout (Desktop):**
```
┌────────────────────────────────────────────────────────────────┐
│ TopNav: [Logo] [SearchBar] [Queue] [Reports] [⚙️] [👤]         │
├──────────────────────────┬──────────────────────────────────────┤
│                          │                                      │
│  MAP (40% width)         │  DECISION PANEL (60% width)         │
│                          │                                      │
│  [Parcel highlighted]    │  ┌─ ABOVE FOLD (no scroll) ───────┐│
│  [Kill-factors visible]  │  │                                  ││
│  [Lender preset active]  │  │  [FeasibilityScoreCard]         ││
│                          │  │  Score: 68  Tier: YELLOW        ││
│                          │  │  Confidence: Medium  As of: Now ││
│                          │  │                                  ││
│                          │  │  [KillFactorStack]              ││
│                          │  │  ⚠️ Regulatory Floodway Present ││
│                          │  │  ⚠️ Sewer Not Served (>2 mi)    ││
│                          │  │  ℹ️ Conditional Use Permit Req'd││
│                          │  │                                  ││
│                          │  │  [Next Actions Bar]             ││
│                          │  │  [Generate Report] [Export PDF] ││
│                          │  │  [Share Link] [Add to Compare]  ││
│                          │  └──────────────────────────────────┘│
│                          │                                      │
│                          │  ┌─ BELOW FOLD (scrollable) ───────┐│
│                          │  │ [Zoning & Entitlements Card]    ││
│                          │  │ [Flood & Environmental Card]    ││
│                          │  │ [Utilities Card]                ││
│                          │  │ [Access & Traffic Card]         ││
│                          │  │ [Market Snapshot Card - opt]    ││
│                          │  │ [Evidence & Provenance Card]    ││
│                          │  └──────────────────────────────────┘│
└──────────────────────────┴──────────────────────────────────────┘
```

**Above-the-Fold (CRITICAL — must fit without scroll):**

1. **FeasibilityScoreCard**
   - Large score (0-100) with donut chart
   - Tier badge: `GREEN` (80-100) / `YELLOW` (50-79) / `RED` (<50)
   - Confidence badge: `HIGH` / `MEDIUM` / `LOW`
   - Timestamp: "As of Dec 18, 2025 2:34 PM"
   - "Why this score?" expander with top 3 drivers

2. **KillFactorStack**
   - Shows top 3 kill-factors always
   - If none: "✓ No hard declines detected"
   - Each factor:
     - Icon (⚠️ critical, ⚠️ high risk, ℹ️ requires action)
     - Title: "Regulatory Floodway Present"
     - Severity: `HARD DECLINE` / `HIGH RISK` / `REQUIRES MITIGATION`
     - One-line rationale
     - "Show Evidence" link → opens `EvidenceDrawer`

3. **Next Actions Bar**
   - Primary CTA: `Generate Report` (blue, bold)
   - Secondary: `Export PDF`, `Share Link`, `Add to Compare`
   - Tertiary: `Request Verification` (if confidence < 70)

**Below-the-Fold Cards (each expandable):**

**Zoning & Entitlements Card:**
```
┌────────────────────────────────────────────┐
│ Zoning & Entitlements               [▼]    │
├────────────────────────────────────────────┤
│ Base Zone: C-2 (General Commercial)       │
│ Permitted Use: Retail, Office, Restaurant │
│ Status: ✓ By-Right                        │
│ Key Constraints:                           │
│  • Setbacks: 20' front, 10' side          │
│  • Max Height: 45 ft (3 stories)           │
│  • Parking: 1 space / 300 SF               │
│ Overlays: Historic District (HO-1)        │
│ [Show Full Zoning Code] [Show Evidence]   │
└────────────────────────────────────────────┘
```

**Flood & Environmental Card:**
```
┌────────────────────────────────────────────┐
│ Flood & Environmental               [▼]    │
├────────────────────────────────────────────┤
│ ⚠️ FLOODWAY PRESENT — Hard Decline        │
│ FEMA Zone: AE (1% annual chance flood)    │
│ Floodway: 18% of parcel (0.4 ac)          │
│ BFE: 32.5 ft NAVD88                        │
│ Ground Elev: 30.2 ft (est from LiDAR)     │
│ BFE Delta: +2.3 ft (structure req'd above) │
│ Wetlands: Not detected (NWI)              │
│ [Show FEMA Map] [Show Evidence]           │
└────────────────────────────────────────────┘
```

**Utilities Card:**
```
┌────────────────────────────────────────────┐
│ Utilities & Infrastructure          [▼]    │
├────────────────────────────────────────────┤
│ ⚠️ Sewer Not Served — High Risk           │
│ Water:  ✓ Served (Houston Water)          │
│         Distance: 120 ft                   │
│ Sewer:  ✗ Not Served                      │
│         Nearest: 2.3 mi away               │
│         Action: Main extension required    │
│ Storm:  ✓ Available (City system)         │
│ Electric: ✓ Served (CenterPoint)          │
│ [Show Utility Map] [Show Evidence]        │
└────────────────────────────────────────────┘
```

**Access & Traffic Card:**
```
┌────────────────────────────────────────────┐
│ Access & Transportation             [▼]    │
├────────────────────────────────────────────┤
│ Primary Road: FM 1960 (Major Arterial)     │
│ AADT: 42,500 vpd                           │
│ Driveway Risk: ℹ️ Medium (TxDOT permit)   │
│ TIA Trigger: No (below 3,000 trip thresh)  │
│ Access Points: 1 existing curb cut         │
│ [Show Traffic Map] [Show Evidence]        │
└────────────────────────────────────────────┘
```

**Evidence & Provenance Card:**
```
┌────────────────────────────────────────────┐
│ Evidence & Data Sources             [▼]    │
├────────────────────────────────────────────┤
│ Zoning:     Houston GIS • Dec 2025 • 95%  │
│ Flood:      FEMA NFHL • Nov 2025 • 90%    │
│ Utilities:  Houston Water • Oct 2025 • 85%│
│ Traffic:    TxDOT AADT • 2024 • 80%       │
│ [View Full Provenance Report]             │
└────────────────────────────────────────────┘
```

**Map Behavior (in this view):**
- Default preset: `Lender` (zoning + flood + utilities visible)
- Parcel boundary highlighted (thick yellow outline)
- Kill-factors auto-emphasized:
  - If floodway flagged → floodway overlay ON, highlighted in red
  - If wetlands flagged → wetlands overlay ON
  - If utilities issue → utility lines overlay ON (at high zoom only)
- Map legend minimal (auto-hides after 5 seconds)
- Click parcel → opens side drawer with full attributes

**Interactions:**
1. Click any card → Expands to show full details
2. "Show Evidence" → Opens `EvidenceDrawer` (side panel) with:
   - Citations (FEMA panel #, Houston ordinance section)
   - Source links (clickable)
   - Data freshness ("Last updated: Nov 15, 2025")
   - Reliability score (0-100)
3. "Generate Report" → Routes to `/parcel/:id/report` (preview mode)
4. "Export PDF" → Opens `ExportModal` (choose format, sections)
5. "Add to Compare" → Adds parcel to comparison queue, shows toast
6. "Request Verification" → Opens form to request manual review

**States:**

**Loading State:**
```
┌────────────────────────────────────────────┐
│ [Skeleton Score Card with shimmer]         │
│ [Skeleton Kill-Factor List]                │
│ "Analyzing parcel... 8 seconds remaining"  │
└────────────────────────────────────────────┘
```

**Error State (data unavailable):**
```
┌────────────────────────────────────────────┐
│ ⚠️ Partial Data Available                  │
│ Overall Confidence: LOW (45%)               │
│                                             │
│ Available: Zoning, Flood                    │
│ Missing: Utilities (source down), Traffic  │
│                                             │
│ Impact: Score reduced by 20 points         │
│ Recommended Action:                         │
│ • Contact Houston Water for will-serve     │
│ • Request traffic study from civil engineer│
│                                             │
│ [Generate Partial Report]                  │
│ [Request Manual Verification]              │
└────────────────────────────────────────────┘
```

**Red Banner (kill-factor triggered):**
```
┌────────────────────────────────────────────┐
│ 🚫 HARD DECLINE TRIGGERED                  │
│ Regulatory Floodway Present (18% of parcel)│
│ Development in floodway is prohibited per  │
│ 44 CFR 60.3. Recommend rejecting parcel.   │
│ [View Evidence] [Explain to Client]       │
└────────────────────────────────────────────┘
```

**Mobile Layout:**
- Map collapses to top 30% (swipe up to expand)
- Decision panel takes full width below
- Cards stack vertically
- Sticky "Generate Report" button at bottom

---

### 4.3 `/parcel/:id/map` — Map Studio (Controlled GIS)

**Purpose:** Advanced viewing for analysts without GIS chaos

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│ TopNav: [Logo] [SearchBar] [Queue] [Reports] [⚙️] [👤]         │
├────────────────────────────────────────────────────────────────┤
│ ┌────────────┐                                                 │
│ │ LAYER      │  [Lender] [Developer] [Engineer] [Custom]      │
│ │ PANEL      │                                                 │
│ │            │                                                 │
│ │ ✓ Parcel   │                                                 │
│ │ ✓ Zoning   │       MAP (full width, full height)            │
│ │ ✓ Flood    │                                                 │
│ │ □ Floodway │       [Parcel highlighted]                      │
│ │ □ Wetlands │       [Interactive tooltips on hover]           │
│ │ ✓ Water    │       [Click → side drawer with attributes]    │
│ │ □ Sewer    │                                                 │
│ │ □ Storm    │                                                 │
│ │ □ Electric │                                                 │
│ │ □ Roads    │       [Scale bar] [North arrow]                │
│ │ □ AADT     │       [Zoom controls]                           │
│ │ [4/4 max]  │       [+ Add Compare]                           │
│ │            │                                                 │
│ │ [Reset]    │  ┌────────────────────────────────────────┐    │
│ └────────────┘  │ Parcel Mini HUD (bottom right)         │    │
│                  │ Score: 68 • Tier: YELLOW               │    │
│                  │ Kill-Factors: 2                        │    │
│                  │ [View Decision Cockpit →]              │    │
│                  └────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────┘
```

**Components:**

**LayerPresetSwitcher (top bar):**
- Buttons: `Lender` / `Developer` / `Engineer` / `Custom`
- Switching presets resets layers to known safe set
- Active preset highlighted

**Preset Definitions:**

| Preset | Active Layers | Purpose |
|--------|---------------|---------|
| **Lender** | Parcel, Zoning, Flood zones, Water, Sewer | IC-ready compliance view |
| **Developer** | Parcel, Zoning, Utilities (all), Roads, AADT | Site planning + infrastructure |
| **Engineer** | Parcel, Flood, Floodway, Wetlands, Storm, Topography | Environmental + drainage design |
| **Custom** | User-selected | Advanced users (persists selection) |

**LayerPanel (left sidebar, collapsible):**

**Layer Groups:**
1. **Geometry** (always on)
   - Parcel boundaries
   - Municipal boundaries

2. **Regulatory**
   - Zoning districts
   - Overlay districts
   - Setback buffers (computed)

3. **Hazards**
   - Flood zones (FEMA)
   - Floodway
   - Wetlands (NWI)
   - Critical habitat

4. **Utilities**
   - Water lines + service areas
   - Sewer lines + service areas
   - Storm drains
   - Electric lines

5. **Transportation**
   - Roads (classified)
   - AADT counts (point layer)
   - TxDOT districts

6. **Market** (mutually exclusive)
   - Demographics (census)
   - Placer.ai traffic
   - Comp sales

**Layer Rules (ENFORCED):**
1. **Max active overlays: 4 at once** (hard stop)
   - Counter shown: "4/4 layers active"
   - Attempting to add 5th → Modal: "Max layers reached. Deactivate one to continue."

2. **Market layers mutually exclusive**
   - Only one active at a time
   - Selecting new market layer auto-deactivates previous

3. **Each layer shows:**
   - Name
   - Icon
   - Source + as-of date
   - Reliability score (0-100)
   - Visibility toggle
   - Opacity slider (for advanced users)

4. **Scale-dependent rendering:**
   - Utilities only visible at zoom ≥ 16
   - Parcel labels only visible at zoom ≥ 14
   - AADT points only visible at zoom ≥ 13

**Map Interactions:**

1. **Hover:** Quick tooltip (minimal fields)
   - Example: "Zone: C-2 | Permitted: Commercial"

2. **Click:** Side drawer opens with full attributes
   - Example: Flood zone polygon clicked →
     ```
     FEMA Flood Zone AE
     ─────────────────────
     Zone: AE (1% annual chance)
     BFE: 32.5 ft NAVD88
     Panel: 48201C0265G
     Effective Date: Nov 15, 2024
     
     [View FEMA FIS Report]
     [Copy Panel Number]
     ```

3. **Selection:** Click parcel to select
   - Selected parcel highlights (yellow outline)
   - Mini HUD updates with parcel score

4. **Copy view link:** Button generates shareable URL
   - Preserves: layers active, zoom level, center point, selected parcel
   - Example: `/parcel/123?layers=zoning,flood&zoom=16&lat=29.76&lon=-95.36`

**Legend (auto-generated):**
- Shows only active layers
- Positioned bottom-left
- Collapsible
- Auto-hides after 5 seconds of no interaction

**Performance Constraints:**
- Tile-based rendering (no raw vector at low zooms)
- Client-side caching of FEMA tiles
- Debounced pan/zoom (300ms)
- No animation on layer toggle (instant)

---

### 4.4 `/compare` — Compare Parcels

**Purpose:** Side-by-side risk matrix for portfolio screening

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│ TopNav: [Logo] [SearchBar] [Queue] [Reports] [⚙️] [👤]         │
├────────────────────────────────────────────────────────────────┤
│ Compare Parcels (4 selected)                                    │
│                                                                 │
│ [+ Add Parcel] [Remove Selected] [Export Comparison PDF]      │
│                                                                 │
│ Filters: [○ No Floodway] [○ Sewer Served] [○ By-Right Zoning] │
│ Sort by: [Score ▼]                                             │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ COMPARISON MATRIX (table)                                 │  │
│ ├──────┬───────┬──────┬─────────┬────────┬─────────┬───────┤  │
│ │Parcel│ Score │ Tier │ Kill-   │ Zoning │  Flood  │Utilities│
│ │      │       │      │ Factors │        │         │         │
│ ├──────┼───────┼──────┼─────────┼────────┼─────────┼───────┤  │
│ │ A    │  82   │Green │   0     │By-Right│ Zone X  │ ✓ All │  │
│ │ B    │  68   │Yellow│   2     │Cond'l  │ AE/Way  │ ✗ Sewr│  │
│ │ C    │  45   │ Red  │   3     │Prohib. │ VE      │ ✓ All │  │
│ │ D    │  73   │Yellow│   1     │By-Right│ AE      │ ✓ All │  │
│ └──────┴───────┴──────┴─────────┴────────┴─────────┴───────┘  │
│                                                                 │
│ [Map View] showing all 4 parcels with color-coded pins         │
└────────────────────────────────────────────────────────────────┘
```

**CompareMatrix Columns:**

| Column | Content | Sortable |
|--------|---------|----------|
| **Parcel** | Address (truncated) | Yes |
| **Score** | 0-100 with bar chart | Yes (default desc) |
| **Tier** | Badge (Green/Yellow/Red) | Yes |
| **Kill-Factors** | Count + top 1 if any | Yes |
| **Zoning Status** | By-Right / Conditional / Prohibited | Yes |
| **Flood** | Zone + Floodway flag | Yes |
| **Wetlands** | Present? Est area | Yes |
| **Utilities** | Checkmarks for W/S/E | Filter only |
| **Access** | Driveway risk tier | Filter only |
| **Confidence** | Overall % | Yes |
| **Actions** | [View] [Remove] [Tag] | — |

**Interactions:**

1. **Bulk Actions:**
   - Select multiple rows (checkboxes)
   - "Reject All" button → Tags parcels as "Dead"
   - "Export PDF" → Generates IC-ready comparison report

2. **Filtering:**
   - "No Floodway" toggle → Hides parcels with floodway
   - "Sewer Served" toggle → Hides parcels with sewer issues
   - "By-Right Zoning" toggle → Hides conditional/prohibited

3. **Sorting:**
   - Click column header to sort
   - Default: Score (high to low)
   - Visual indicator (▲ or ▼)

4. **Row Actions:**
   - "View" → Routes to `/parcel/:id`
   - "Remove" → Removes from comparison (not deleted)
   - "Tag" → Hot / Watch / Dead (color-coded)

5. **Map View Toggle:**
   - Switch between table and map
   - Map shows all parcels as pins (color = tier)
   - Click pin → Quick popup with score + top kill-factor

**Export Options (modal):**
```
┌────────────────────────────────────────┐
│ Export Comparison Report               │
├────────────────────────────────────────┤
│ Format:                                │
│ ○ IC Summary (executives)              │
│ ○ Analyst Detail (full breakdown)      │
│                                         │
│ Include:                                │
│ ☑ Score breakdown by domain            │
│ ☑ Kill-factors for all parcels         │
│ ☑ Map with parcel locations            │
│ ☑ Confidence & provenance appendix     │
│                                         │
│ [Cancel] [Generate PDF →]              │
└────────────────────────────────────────┘
```

**States:**

**Empty State:**
```
No parcels selected for comparison.
Add parcels from search results or parcel view.
[Go to Search]
```

**Max Parcels (20):**
```
⚠️ Maximum 20 parcels for comparison.
Remove some to add new ones.
```

---

### 4.5 `/parcel/:id/report` — Web Report Preview

**Purpose:** Lender-ready report view that is printable

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│ TopNav: [Logo] [SearchBar] [Queue] [Reports] [⚙️] [👤]         │
├────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐    │
│ │ REPORT TOOLBAR                                          │    │
│ │ [Export PDF ↓] [Share Link 🔗] [Print 🖨️] [Close ✕]  │    │
│ └────────────────────────────────────────────────────────┘    │
│                                                                 │
│ ┌────────────────────────────────────────────────────────┐    │
│ │ REPORT CONTENT (scrollable, print-safe)                │    │
│ │                                                         │    │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │    │
│ │                                                         │    │
│ │          FEASIBILITY ANALYSIS REPORT                   │    │
│ │          1234 Main Street, Houston TX 77002            │    │
│ │                                                         │    │
│ │ Generated: December 18, 2025 2:34 PM                   │    │
│ │ Report ID: FAS-2025-12-18-001234                       │    │
│ │                                                         │    │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │    │
│ │                                                         │    │
│ │ [1. EXECUTIVE SUMMARY]                                 │    │
│ │ [2. KILL-FACTORS & RED FLAGS]                          │    │
│ │ [3. SITE OVERVIEW]                                     │    │
│ │ [4. ZONING & ENTITLEMENTS]                             │    │
│ │ [5. FLOOD & ENVIRONMENTAL]                             │    │
│ │ [6. UTILITIES & INFRASTRUCTURE]                        │    │
│ │ [7. ACCESS & TRANSPORTATION]                           │    │
│ │ [8. OPTIONAL MARKET SNAPSHOT]                          │    │
│ │ [9. EVIDENCE & DATA SOURCES]                           │    │
│ │                                                         │    │
│ └────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────┘
```

**Report Structure (fixed order):**

### **Section 1: Cover + Metadata**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEASIBILITY ANALYSIS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Property Address: 1234 Main Street, Houston TX 77002
APN: 123-456-7890
County: Harris County
Site Area: 2.18 acres (94,977 SF)

Generated: December 18, 2025 2:34 PM CST
Report ID: FAS-2025-12-18-001234
Requested by: John Developer, ABC Development LLC

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This report is provided for informational purposes only and does not constitute legal, engineering, or financial advice. All data sources are listed in Section 9. Users should conduct independent verification for regulatory compliance.
```

### **Section 2: Executive Summary**
```
EXECUTIVE SUMMARY
─────────────────────────────────────────────────────

FEASIBILITY SCORE: 68 / 100
RISK TIER: YELLOW (Conditional Approval with Mitigation)
CONFIDENCE: MEDIUM (72%)

RECOMMENDATION:
This parcel presents MODERATE feasibility for commercial development with two significant constraints requiring mitigation. The primary concern is the regulatory floodway affecting 18% of the site, which prohibits most structures per 44 CFR 60.3. Additionally, sewer service is not available within 2 miles, requiring costly main extension or on-site wastewater treatment.

POSITIVE FACTORS:
✓ By-right commercial zoning (C-2)
✓ Water and electric utilities available
✓ Good arterial road access (FM 1960, 42,500 AADT)
✓ No wetlands detected

RISK FACTORS:
⚠️ Regulatory floodway present (18% of parcel)
⚠️ Sewer not served (nearest 2.3 mi)
ℹ️ Conditional Use Permit may be required for drive-through

NEXT STEPS:
1. Engage FEMA-certified engineer for floodplain analysis
2. Request will-serve letter from Houston Water
3. Estimate sewer extension costs (preliminary: $850K-$1.2M)
4. Confirm CUP process with City Planning Department
```

### **Section 3: Kill-Factors & Red Flags**
```
KILL-FACTORS & RED FLAGS
─────────────────────────────────────────────────────

⚠️ REGULATORY FLOODWAY PRESENT — HARD DECLINE FACTOR

Severity: CRITICAL
Impact: 18% of parcel (0.39 acres / 17,000 SF)
Regulatory Basis: 44 CFR 60.3(d)(3)

Analysis:
FEMA-designated regulatory floodway intersects the southeast portion of the parcel. Federal regulations prohibit any development or fill in the floodway that would increase base flood elevations. Structure placement must avoid floodway entirely or obtain conditional Letter of Map Revision (CLOMR) demonstrating no-rise certification, which is extremely difficult and costly ($50K-$150K study + mitigation).

Recommended Action:
• Reject parcel OR
• Redesign to avoid floodway + obtain CLOMR OR
• Seek alternative parcel

Evidence:
FEMA NFHL, Panel 48201C0265G, Effective Nov 15, 2024
[View FEMA Map] [Download Panel PDF]

─────────────────────────────────────────────────────

⚠️ SEWER NOT SERVED — HIGH RISK FACTOR

Severity: HIGH
Distance to Nearest Sewer: 2.3 miles
Estimated Extension Cost: $850,000 - $1,200,000

Analysis:
Houston Water sewer service area terminates 2.3 miles north of the property. Connecting to municipal sewer requires either (a) developer-funded main extension at ~$350-$500 per linear foot (12,144 LF × $400 = $4.8M shared cost if regional participation), or (b) on-site wastewater treatment system (permitted capacity up to 15,000 gpd for commercial use). Most lenders require municipal sewer for projects >10,000 SF.

Recommended Action:
• Request will-serve letter from Houston Water
• Estimate shared-cost extension with adjacent parcels
• Evaluate on-site treatment feasibility (requires TCEQ approval)

Evidence:
Houston Water GIS, Service Boundary as of Oct 2025
[View Utility Map] [Contact Houston Water]
```

### **Section 4: Site Overview**
```
SITE OVERVIEW
─────────────────────────────────────────────────────

Location: 1234 Main Street, Houston TX 77002
Coordinates: 29.7604° N, 95.3698° W
County: Harris County
Municipality: Houston (within city limits)
Site Area: 2.18 acres (94,977 SF)
Shape: Irregular quadrilateral
Frontage: 285 ft along Main Street
Depth: 330 ft average

Current Use: Vacant (former gas station, decommissioned)
Topography: Generally flat, ~1% slope to southeast
Ground Elevation: 30.2 ft NAVD88 (est from LiDAR)

Surrounding Context:
• North: Strip retail center
• South: Single-family residential (R-1)
• East: Bayou greenway corridor
• West: Main Street / FM 1960 (arterial)

[Map: Site location with aerial imagery]
[Map: Parcel boundary with dimensions]
```

### **Section 5: Zoning & Entitlements**
```
ZONING & ENTITLEMENTS
─────────────────────────────────────────────────────

Base Zoning: C-2 (General Commercial)
Overlay Districts: None
Comprehensive Plan: Commercial Corridor

PERMITTED USES:
✓ Retail (by-right)
✓ Office (by-right)
✓ Restaurant without drive-through (by-right)
ℹ️ Restaurant with drive-through (Conditional Use Permit)
✓ Medical/Dental office (by-right)
✗ Multi-family residential (prohibited)

DIMENSIONAL STANDARDS:

┌────────────────────┬─────────────┬───────────────┐
│ Standard           │ Requirement │ Max Buildable │
├────────────────────┼─────────────┼───────────────┤
│ Setbacks (front)   │ 20 ft       │ —             │
│ Setbacks (side)    │ 10 ft       │ —             │
│ Setbacks (rear)    │ 15 ft       │ —             │
│ Max Height         │ 45 ft       │ 3 stories     │
│ FAR                │ 0.5         │ 47,488 SF     │
│ Lot Coverage       │ 65%         │ 61,735 SF     │
│ Parking            │ 1 / 300 SF  │ 158 spaces    │
└────────────────────┴─────────────┴───────────────┘

NET DEVELOPABLE AREA:
• Gross Site: 94,977 SF (2.18 ac)
• Less Floodway: -17,000 SF
• Less Setbacks: -12,500 SF (est)
• Net Buildable: 65,477 SF (1.50 ac)

ENTITLEMENT RISK: LOW
• By-right zoning for most commercial uses
• No variance required for base development
• CUP required only for drive-through (60-90 day process)

Evidence:
Houston Zoning Ordinance Chapter 42, Section 42-140 (C-2)
City of Houston GIS Zoning Layer, as of Dec 2025
[View Zoning Code] [View Zoning Map]
```

### **Section 6: Flood & Environmental**
```
FLOOD & ENVIRONMENTAL
─────────────────────────────────────────────────────

FEMA FLOOD ZONE: AE (1% annual chance flood)
FLOODWAY STATUS: ⚠️ YES — Floodway affects 18% of parcel
BASE FLOOD ELEVATION: 32.5 ft NAVD88
GROUND ELEVATION: 30.2 ft NAVD88 (est from LiDAR)
BFE DELTA: +2.3 ft (structure must be elevated above BFE)

FLOOD RISK ANALYSIS:

┌──────────────────┬──────────────┬─────────────┐
│ Zone             │ Area (SF)    │ % of Parcel │
├──────────────────┼──────────────┼─────────────┤
│ Floodway         │ 17,000       │ 18%         │
│ Zone AE          │ 77,977       │ 82%         │
│ Zone X (minimal) │ 0            │ 0%          │
└──────────────────┴──────────────┴─────────────┘

DEVELOPMENT CONSTRAINTS:
• Floodway: NO development/fill allowed (44 CFR 60.3)
• Zone AE: Lowest floor must be ≥ BFE (32.5 ft)
• Elevation requirement: +2.3 ft above existing grade
• Flood insurance: REQUIRED for financed projects
• Est premium: $4,500-$8,000 annually (depends on use)

ENVIRONMENTAL SCREENING:

Wetlands (NWI): ✓ Not Detected
• No jurisdictional wetlands within 500 ft
• Nearest wetland: 0.8 mi east (Bayou corridor)

Endangered Species: ✓ None Identified
• No critical habitat designated on site

Contamination Risk: ⚠️ MODERATE
• Former gas station use (1985-2018)
• Phase I ESA recommended to screen for UST/LUST
• Review TCEQ Leaking Storage Tank database

Evidence:
FEMA NFHL, Panel 48201C0265G, Effective Nov 15, 2024
USFWS NWI Wetlands Mapper, accessed Dec 2025
TCEQ UST/LUST Database, accessed Dec 2025
[View FEMA FIS] [View NWI Map] [View TCEQ Records]
```

### **Section 7: Utilities & Infrastructure**
```
UTILITIES & INFRASTRUCTURE
─────────────────────────────────────────────────────

WATER SERVICE:
Status: ✓ AVAILABLE
Provider: Houston Water
Service Area: Within boundary
Distance to Main: 120 ft (8" main in Main St)
Capacity: Adequate for commercial use
Est Connection Fee: $8,500
Lead Time: 30-45 days after permit

SEWER SERVICE:
Status: ⚠️ NOT AVAILABLE
Provider: Houston Water
Nearest Sewer: 2.3 miles north (12,144 LF)
Options:
1. Main Extension: $850K-$1.2M (dev-funded or regional share)
2. On-site Treatment: $200K-$400K (requires TCEQ permit)
Impact: HIGH — Most lenders require municipal sewer

STORMWATER DRAINAGE:
Status: ✓ AVAILABLE
Provider: City of Houston (MS4 permit area)
Nearest Inlet: 80 ft east (Main St curb)
Requirements:
• Detention required if >1 acre impervious
• Est detention vol: 15,000 CF (0.34 AF)
• Release rate: 0.3 CFS per acre

ELECTRIC SERVICE:
Status: ✓ AVAILABLE
Provider: CenterPoint Energy
Service Area: Within boundary
Distance to Line: 40 ft (overhead on Main St)
Capacity: 3-phase, adequate for commercial
Est Connection Fee: $12,000-$18,000
Lead Time: 60-90 days after permit

Evidence:
Houston Water GIS, as of Oct 2025
CenterPoint Energy Service Map, as of Nov 2025
[View Utility Map] [Request Will-Serve Letters]
```

### **Section 8: Access & Transportation**
```
ACCESS & TRANSPORTATION
─────────────────────────────────────────────────────

PRIMARY ROAD: Main Street / FM 1960
Classification: Major Arterial (TxDOT jurisdiction)
AADT: 42,500 vehicles per day (2024 count)
Speed Limit: 45 mph
ROW Width: 100 ft

ACCESS ANALYSIS:

Existing Access:
• 1 curb cut on Main Street (24 ft wide)
• Current condition: Fair (needs repaving)

Driveway Permit Requirements:
Risk Level: ℹ️ MEDIUM
Authority: TxDOT Houston District
Requirements:
• TxDOT Driveway Permit (Form 1081)
• Sight distance study required (45 mph zone)
• Decel lane NOT required (<150 pm peak trips)
• Est permit fee: $2,500
• Processing time: 60-90 days

TRAFFIC IMPACT ANALYSIS (TIA):
Required? NO
Threshold: 3,000 daily trips / 300 pm peak trips
Est Project Trips: 1,200 daily / 120 pm peak (10K SF retail)
Status: Below threshold; TIA not required

TRANSIT ACCESS:
• Metro Bus Route 85 (Main St, 0.2 mi west)
• Headway: 30 minutes
• Park & Ride: 3 miles north (Kuykendahl)

Evidence:
TxDOT AADT Map, 2024 counts
TxDOT Houston District Driveway Manual
[View AADT Map] [View TxDOT Requirements]
```

### **Section 9: Optional Market Snapshot**
```
MARKET SNAPSHOT (OPTIONAL)
─────────────────────────────────────────────────────

This section is optional and may be excluded from lender reports.

DEMOGRAPHICS (1-mile radius):
• Population: 28,450
• Median HH Income: $72,500
• Daytime Population: 34,200 (office workers)

RETAIL COMPS (recent sales):
• 1500 Main St: $185/SF (2024, 8K SF, Shell)
• 1800 Main St: $210/SF (2023, 12K SF, Build-out)

ABSORPTION:
• Retail vacancy: 6.8% (Houston market avg: 7.2%)
• Average days on market: 180 days

Evidence:
US Census Bureau ACS 2023
CoStar Market Report, Houston Retail, Q4 2024
[View Market Report]
```

### **Section 10: Evidence & Data Sources Appendix**
```
EVIDENCE & DATA SOURCES
─────────────────────────────────────────────────────

This report synthesizes data from the following authoritative sources. All data is subject to change; users should verify with issuing agencies for regulatory compliance.

┌────────────────────┬──────────────────────┬──────────┬──────┐
│ Domain             │ Source               │ As of    │ Conf │
├────────────────────┼──────────────────────┼──────────┼──────┤
│ Parcel Boundaries  │ Harris CAD           │ Dec 2025 │ 95%  │
│ Zoning             │ Houston Planning GIS │ Dec 2025 │ 95%  │
│ Flood Zones        │ FEMA NFHL            │ Nov 2025 │ 90%  │
│ Floodway           │ FEMA NFHL            │ Nov 2025 │ 90%  │
│ Base Flood Elev    │ FEMA FIS Profile     │ Nov 2024 │ 100% │
│ Wetlands           │ USFWS NWI            │ Sep 2024 │ 85%  │
│ Water Service      │ Houston Water GIS    │ Oct 2025 │ 85%  │
│ Sewer Service      │ Houston Water GIS    │ Oct 2025 │ 85%  │
│ Electric Service   │ CenterPoint GIS      │ Nov 2025 │ 80%  │
│ Roads / AADT       │ TxDOT                │ 2024     │ 90%  │
│ Topography (LiDAR) │ Harris County GIS    │ 2023     │ 90%  │
│ Environmental (UST)│ TCEQ Database        │ Dec 2025 │ 75%  │
└────────────────────┴──────────────────────┴──────────┴──────┘

CONFIDENCE CALCULATION:
Overall Confidence: 72% (MEDIUM)
Methodology: Weighted average by domain criticality
• Zoning: 25% weight → 95% conf
• Flood: 25% weight → 90% conf
• Utilities: 20% weight → 83% conf (avg W/S/E)
• Access: 15% weight → 90% conf
• Environmental: 15% weight → 75% conf

DATA LIMITATIONS & DISCLAIMERS:

• Flood data is based on FEMA NFHL, which is updated monthly and may not reflect recent LOMRs or field conditions. Users should verify BFE with FEMA-certified surveyor.

• Utility service boundaries are approximate. Will-serve letters from utility providers are required for lender approval.

• Zoning regulations are subject to amendments. Users should confirm current ordinance text with City of Houston Planning Department.

• Environmental screening is preliminary. Phase I ESA is recommended for former gas station sites.

• This report does not constitute legal, engineering, or surveying services. Professional consultants should be engaged for regulatory compliance.

REPORT METADATA:
• Generated by: SiteIntel™ Feasibility Platform v2.1
• Algorithm Version: FAS-2025-Q4
• Processing Time: 24 seconds
• Report ID: FAS-2025-12-18-001234
• Requested by: John Developer, ABC Development LLC
• Date/Time: December 18, 2025 2:34 PM CST

For questions or data corrections, contact:
support@siteintel.com | (713) 555-1234
```

**Report Visual Rules:**

1. **Print-Safe Colors:**
   - No neon or bright gradients
   - Use grayscale with subtle color accents
   - Risk badges: Green (#10B981), Yellow (#F59E0B), Red (#EF4444)

2. **Typography:**
   - Headings: Inter Bold, 14-18pt
   - Body: Inter Regular, 11pt
   - Tables: Inter, 10pt, tight leading
   - Monospace for IDs/codes: Roboto Mono, 10pt

3. **Tables:**
   - Clean borders (0.5pt gray)
   - Zebra striping (subtle gray)
   - No shadows or 3D effects

4. **Page Breaks:**
   - Each major section starts on new page
   - Tables never split mid-row
   - Keep kill-factors together (no orphans)

5. **Maps:**
   - Embedded as static images (300 DPI)
   - Scale bar + north arrow always visible
   - Max 2 maps per page

6. **Citations:**
   - Inline references: [Source, Date]
   - Hyperlinks active in PDF (blue underline)
   - QR codes for long URLs (optional)

**Export Modal (when "Export PDF" clicked):**
```
┌────────────────────────────────────────┐
│ Export Report                          │
├────────────────────────────────────────┤
│ Format:                                │
│ ○ Lender (IC-ready, concise)           │
│ ○ Developer (includes cost estimates)  │
│                                         │
│ Optional Sections:                     │
│ ☑ Market Snapshot                      │
│ ☑ Map Thumbnails                       │
│ ☐ Full Provenance Appendix (always ON) │
│                                         │
│ Paper Size: [US Letter ▼]             │
│ Orientation: ○ Portrait ● Landscape    │
│                                         │
│ [Cancel] [Generate PDF →]              │
└────────────────────────────────────────┘
```

---

### 4.6 `/reports` — Report Library

**Purpose:** Search/filter generated reports, re-run feasibility

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│ TopNav: [Logo] [SearchBar] [Queue] [Reports] [⚙️] [👤]         │
├────────────────────────────────────────────────────────────────┤
│ Report Library                                                  │
│                                                                 │
│ [Search reports...] [Filters ▼] [Sort: Date (newest) ▼]       │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Report #1                                                 │  │
│ │ 1234 Main Street, Houston TX                              │  │
│ │ Score: 68 • Tier: YELLOW • Generated: 2 hours ago        │  │
│ │ Status: ✓ Final                                           │  │
│ │ [View Report] [Re-run] [Download PDF] [Share Link]       │  │
│ ├──────────────────────────────────────────────────────────┤  │
│ │ Report #2                                                 │  │
│ │ 5678 Oak Avenue, Dallas TX                                │  │
│ │ Score: 45 • Tier: RED • Generated: yesterday              │  │
│ │ Status: ✓ Final                                           │  │
│ │ [View Report] [Re-run] [Download PDF] [Share Link]       │  │
│ └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

**Features:**

1. **Search:**
   - By address, APN, or report ID
   - Full-text search across report content

2. **Filters:**
   - Date range (last week / month / year)
   - Tier (Green / Yellow / Red)
   - Status (Draft / Final / Shared)
   - Confidence (High / Medium / Low)

3. **Sort:**
   - Date (newest / oldest)
   - Score (high / low)
   - Address (A-Z)

4. **Actions:**
   - **View Report:** Routes to `/parcel/:id/report`
   - **Re-run:** Creates new version with updated data
   - **Download PDF:** Direct PDF download
   - **Share Link:** Generates shareable URL (auth required)

5. **Versioning:**
   - Re-running creates new version: "v2 (updated Dec 18)"
   - Old versions archived but accessible
   - Version history shown in dropdown

**States:**

**Empty State:**
```
No reports generated yet.
Start by searching for a parcel.
[Go to Search]
```

---

### 4.7 `/queue` — Work Queue

**Purpose:** Monitor runs in progress, failed, completed

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│ TopNav: [Logo] [SearchBar] [Queue] [Reports] [⚙️] [👤]         │
├────────────────────────────────────────────────────────────────┤
│ Work Queue (5 active)                                           │
│                                                                 │
│ [Tabs: In Progress (2) | Failed (1) | Completed (12)]         │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ IN PROGRESS                                               │  │
│ ├──────────────────────────────────────────────────────────┤  │
│ │ 1234 Main Street, Houston TX                              │  │
│ │ [████████████░░░░░░░░] 65% • 8 sec remaining             │  │
│ │ Status: Analyzing utilities...                            │  │
│ ├──────────────────────────────────────────────────────────┤  │
│ │ 5678 Oak Avenue, Dallas TX                                │  │
│ │ [█████░░░░░░░░░░░░░░░] 25% • 22 sec remaining            │  │
│ │ Status: Fetching FEMA flood data...                       │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ FAILED                                                    │  │
│ ├──────────────────────────────────────────────────────────┤  │
│ │ 9012 Elm Street, Austin TX                                │  │
│ │ ⚠️ Failed: Utilities data source unavailable             │  │
│ │ Reason: Houston Water GIS server timeout (3 retries)     │  │
│ │ Fallback: Partial report generated (no sewer data)       │  │
│ │ [Retry] [View Partial Report] [Contact Support]          │  │
│ └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

**Features:**

1. **Real-time Updates:**
   - WebSocket connection for live progress
   - Progress bars with % complete
   - Status messages ("Analyzing utilities...")

2. **Failure Handling:**
   - Clear error messages
   - Reason explained (timeout, missing data)
   - Retry button with exponential backoff
   - "Last good snapshot" fallback option

3. **Completed Tab:**
   - Shows last 20 completed runs
   - Quick access to reports
   - Auto-removes after 7 days

**States:**

**Empty (In Progress):**
```
No runs in progress.
All parcels have been analyzed.
```

**Empty (Failed):**
```
No failed runs.
All analyses completed successfully.
```

---

## 5. MAP UX SPECIFICATION

### 5.1 Map Layout & Controls

**Base Configuration:**
- Basemap: Esri Light Gray Canvas (default) / Satellite (toggle)
- Projection: Web Mercator (EPSG:3857)
- Initial zoom: Fit parcel bounds + 10% buffer
- Min zoom: 10 (prevents excessive tile requests)
- Max zoom: 20 (parcel/building scale)

**Controls (always visible):**
```
┌─────────────────────────────────────────┐
│ [+ Zoom In]                             │
│ [- Zoom Out]                            │
│ [⊕ Fit Parcel]                          │
│ [🛰️ Satellite Toggle]                  │
│ [📏 Measure Tool]                       │
│ [🔗 Copy View Link]                     │
└─────────────────────────────────────────┘
```

**Position:** Bottom-right, 20px from edge

**Legend:**
- Position: Bottom-left
- Auto-hides after 5 seconds of no interaction
- Shows only active layers
- Collapsible
- Max 6 legend items before scroll

**Scale Bar:**
- Position: Bottom-center
- Units: Feet (US) / Meters (metric toggle)
- Updates dynamically with zoom

**North Arrow:**
- Position: Top-right
- Minimal design (simple arrow)

### 5.2 Layer Presets (Decision-Critical)

| Preset | Active Layers | Use Case |
|--------|---------------|----------|
| **Lender** | Parcel, Zoning, Flood zones, Water, Sewer | IC approval workflow |
| **Developer** | Parcel, Zoning, All Utilities, Roads, AADT | Site planning + infrastructure |
| **Engineer** | Parcel, Flood, Floodway, Wetlands, Storm, Topography | Environmental + drainage design |
| **Custom** | User-selected (persists session) | Advanced users |

**Preset Switching:**
- One-click button toggles
- Active preset highlighted (blue background)
- Switching resets layers to known safe set
- Custom preset auto-activates when user modifies layers

### 5.3 Layer Groups & Hierarchy

**Z-Order (bottom to top):**
1. Basemap (Esri / Satellite)
2. Flood zones (70% opacity)
3. Floodway (80% opacity, red fill)
4. Wetlands (70% opacity, green crosshatch)
5. Utilities (scale-dependent, visible zoom ≥ 16)
6. Roads (always visible)
7. Zoning districts (50% opacity, pastel fills)
8. Parcel boundaries (thick outline, no fill)
9. Labels (scale-dependent)

**Layer Group Definitions:**

**1. Geometry (always on)**
- Parcel boundaries (yellow outline, 2pt)
- Municipal boundaries (thin gray line)

**2. Regulatory**
- Zoning districts (color-coded by category)
- Overlay districts (diagonal hatch pattern)
- Setback buffers (computed, dashed line)

**3. Hazards**
- FEMA flood zones (blue gradient)
  - VE: Dark blue
  - AE: Medium blue
  - X (500-yr): Light blue
  - X (minimal): No fill
- Floodway (red fill, 80% opacity)
- Wetlands (NWI): Green crosshatch
- Critical habitat: Orange outline

**4. Utilities**
- Water lines: Blue (4pt at zoom 16+)
- Sewer lines: Brown (4pt at zoom 16+)
- Storm drains: Teal (4pt at zoom 16+)
- Electric lines: Yellow (4pt at zoom 16+)
- Service areas: Transparent fill with outline

**5. Transportation**
- Roads: Classified by type
  - Interstate: Red, 6pt
  - Major Arterial: Orange, 4pt
  - Minor Arterial: Yellow, 3pt
  - Collector: Light yellow, 2pt
  - Local: Gray, 1pt
- AADT counts: Point symbols with labels (zoom ≥ 14)

**6. Market (mutually exclusive)**
- Demographics: Choropleth by census tract
- Traffic: Placer.ai heatmap
- Comp sales: Point symbols with $ labels

### 5.4 Layer Toggle Rules (ENFORCED)

**Rule 1: Max 4 Overlays**
- Hard limit prevents visual chaos
- Counter shown: "3/4 layers active"
- Attempting 5th → Modal: "Max layers reached. Deactivate one to continue."

**Rule 2: Market Layers Mutually Exclusive**
- Only one market layer at a time
- Selecting new market layer auto-deactivates previous
- Radio button UX (not checkboxes)

**Rule 3: Scale-Dependent Rendering**
- Utilities visible only at zoom ≥ 16 (prevents clutter)
- Parcel labels only at zoom ≥ 14
- AADT points only at zoom ≥ 13
- Building footprints only at zoom ≥ 17

**Rule 4: Auto-Activation for Kill-Factors**
- If floodway flagged → Floodway layer auto-ON
- If wetlands flagged → Wetlands layer auto-ON
- If utilities issue → Utilities layer auto-ON (at appropriate zoom)

### 5.5 Symbology & Color Palette

**Flood Zones (FEMA):**
- VE (Coastal): `#1E40AF` (dark blue)
- AE (Riverine): `#3B82F6` (medium blue)
- AO/AH: `#60A5FA` (light blue)
- X (500-yr): `#DBEAFE` (very light blue)
- X (Minimal): No fill, outline only
- Floodway: `#DC2626` (red fill, 80% opacity)

**Zoning Districts:**
- Residential: `#10B981` (green)
- Commercial: `#F59E0B` (amber)
- Industrial: `#8B5CF6` (purple)
- Mixed-Use: `#EC4899` (pink)
- Agricultural: `#84CC16` (lime)
- Public/Institutional: `#06B6D4` (cyan)

**Utilities:**
- Water: `#3B82F6` (blue)
- Sewer: `#92400E` (brown)
- Storm: `#14B8A6` (teal)
- Electric: `#FDE047` (yellow)
- Gas: `#F97316` (orange)

**Wetlands:**
- NWI Wetlands: `#10B981` (green crosshatch, 70% opacity)

**Parcel:**
- Outline: `#FBBF24` (yellow, 2pt)
- Selected: `#FBBF24` (yellow, 4pt, glow effect)

**Roads:**
- Interstate: `#DC2626` (red)
- Major Arterial: `#F97316` (orange)
- Minor Arterial: `#FBBF24` (yellow)
- Collector: `#FDE68A` (light yellow)
- Local: `#9CA3AF` (gray)

### 5.6 Kill-Factor Visualization

**Floodway Present:**
- Floodway polygon highlighted in red (80% opacity)
- Parcel outline turns red (4pt)
- Tooltip on hover: "⚠️ FLOODWAY: 18% of parcel"
- Pan/zoom to floodway extent automatically

**Wetlands Present:**
- Wetlands polygon highlighted in green crosshatch
- Tooltip: "⚠️ WETLANDS: 0.8 ac (requires mitigation)"
- Buffer zone shown (50 ft dashed line)

**Utilities Not Served:**
- Nearest utility line shown in bold (6pt)
- Distance label: "Sewer: 2.3 mi"
- Parcel to utility line: Dashed connector (2pt gray)

### 5.7 Map Interactions

**Hover:**
- Quick tooltip with minimal fields
- Example (flood zone): "Zone AE • BFE 32.5 ft"
- Example (zoning): "C-2 Commercial • By-Right"
- Debounced (300ms delay)

**Click:**
- Opens side drawer with full attributes
- Drawer slides from right (400ms animation)
- Drawer content:
  - Layer name + icon
  - All attributes (table format)
  - Evidence links ("View FEMA FIS", "View Zoning Code")
  - "Copy to Clipboard" button

**Selection:**
- Click parcel to select
- Selected parcel highlights (yellow outline, 4pt, glow)
- Mini HUD updates with parcel score

**Pan/Zoom:**
- Smooth transitions (300ms ease-out)
- Mousewheel zoom enabled
- Touch gestures supported (pinch/spread)
- Double-click to zoom in

**Measure Tool:**
- Click tool icon → Activates measure mode
- Click points to create line/polygon
- Distance/area displayed dynamically
- Units toggle: ft / m / acres / hectares

**Copy View Link:**
- Generates URL with:
  - `?layers=zoning,flood`
  - `&zoom=16`
  - `&lat=29.76&lon=-95.36`
  - `&parcel=123`
- Copies to clipboard with toast: "View link copied!"

### 5.8 Performance Optimization

**Tile-Based Rendering:**
- Use vector tiles for parcels, zoning (zoom ≥ 14)
- Use raster tiles for basemap, flood zones (all zooms)
- Tile cache: 7 days client-side

**Client-Side Caching:**
- FEMA tiles: Cache for session
- Parcel boundaries: IndexedDB cache (persistent)
- Zoning districts: IndexedDB cache (persistent)

**Lazy Loading:**
- Utilities load only when layer activated
- Market layers load only when layer activated
- Loading spinner shown during fetch

**Debounced Interactions:**
- Pan/zoom debounced 300ms
- Hover tooltips debounced 300ms
- Search debounced 500ms

**Scale-Dependent Rendering:**
- Utilities render only at zoom ≥ 16
- Building footprints render only at zoom ≥ 17
- Labels render only at appropriate zooms

---

## 6. FEASIBILITY + RISK UX SPECIFICATION

### 6.1 Score Presentation Rules

**Score Card Layout:**
```
┌────────────────────────────────────────┐
│ FEASIBILITY SCORE                      │
│                                         │
│        ╭─────╮                          │
│       ╱       ╲                         │
│      │   68    │  ◄── Large, bold      │
│       ╲       ╱                         │
│        ╰─────╯                          │
│     0 ════════ 100                      │
│                                         │
│ [🟡 YELLOW] CONDITIONAL APPROVAL        │
│ Confidence: MEDIUM (72%)                │
│ As of: Dec 18, 2025 2:34 PM            │
│                                         │
│ [Why this score? ▼]                    │
└────────────────────────────────────────┘
```

**Components:**

1. **Score Number (0-100):**
   - Font size: 48pt
   - Font weight: Bold
   - Color: Black (light mode) / White (dark mode)
   - Positioned in donut chart center

2. **Donut Chart:**
   - Outer radius: 80px
   - Inner radius: 60px
   - Arc color:
     - 80-100: Green (#10B981)
     - 50-79: Yellow (#F59E0B)
     - 0-49: Red (#EF4444)
   - Background arc: Gray (#E5E7EB)
   - Animation: 1-second ease-out from 0 to score

3. **Tier Badge:**
   - Text: "GREEN" / "YELLOW" / "RED"
   - Background color matches score tier
   - Text color: White
   - Border radius: 4px
   - Font: 12pt, Bold, All-caps
   - Icon: ● (filled circle) in tier color

4. **Tier Meanings:**
   - **GREEN (80-100):** Approved — Low risk, recommend proceed
   - **YELLOW (50-79):** Conditional — Moderate risk, mitigation required
   - **RED (<50):** Decline — High risk, recommend reject

5. **Confidence Badge:**
   - Text: "HIGH" / "MEDIUM" / "LOW"
   - Color:
     - HIGH (≥80%): Green
     - MEDIUM (60-79%): Yellow
     - LOW (<60%): Red
   - Format: "Confidence: MEDIUM (72%)"

6. **Timestamp:**
   - Format: "As of: Dec 18, 2025 2:34 PM CST"
   - Font: 10pt, Gray
   - Position: Below confidence

7. **"Why this score?" Expander:**
   - Clickable to expand/collapse
   - Shows top 3 score drivers:
     ```
     Top Factors Reducing Score:
     1. Floodway present: -15 points
     2. Sewer not served: -12 points
     3. Conditional use permit: -5 points
     
     Positive Factors:
     • By-right zoning: +0 (baseline)
     • Water available: +0 (baseline)
     • Good road access: +0 (baseline)
     ```

### 6.2 Kill-Factor Presentation

**Kill-Factor Stack:**
```
┌────────────────────────────────────────┐
│ KILL-FACTORS & RED FLAGS               │
├────────────────────────────────────────┤
│ ⚠️ Regulatory Floodway Present         │
│    SEVERITY: HARD DECLINE              │
│    18% of parcel in floodway           │
│    Development prohibited per 44 CFR   │
│    [Show Evidence →]                   │
├────────────────────────────────────────┤
│ ⚠️ Sewer Not Served                    │
│    SEVERITY: HIGH RISK                 │
│    Nearest sewer: 2.3 mi away          │
│    Requires main extension or on-site  │
│    [Show Evidence →]                   │
├────────────────────────────────────────┤
│ ℹ️ Conditional Use Permit Required     │
│    SEVERITY: MODERATE                  │
│    Drive-through requires CUP (60d)    │
│    [Show Evidence →]                   │
└────────────────────────────────────────┘
```

**If No Kill-Factors:**
```
┌────────────────────────────────────────┐
│ KILL-FACTORS & RED FLAGS               │
├────────────────────────────────────────┤
│ ✓ No hard declines detected            │
│                                         │
│ This parcel has no immediate           │
│ regulatory or physical constraints     │
│ that would prevent development.        │
└────────────────────────────────────────┘
```

**Kill-Factor Severity Levels:**

| Severity | Icon | Color | Meaning |
|----------|------|-------|---------|
| **HARD DECLINE** | ⚠️ | Red | Regulatory prohibition; development impossible without major variance |
| **HIGH RISK** | ⚠️ | Orange | Significant cost/delay; lender likely to require mitigation |
| **MODERATE** | ℹ️ | Yellow | Manageable constraint; may require conditional approval |
| **LOW** | ℹ️ | Blue | Minor issue; disclosure recommended but not blocking |

**Kill-Factor Card Components:**

1. **Icon + Title:**
   - Icon: Severity-based (⚠️ or ℹ️)
   - Title: Bold, 14pt
   - Example: "Regulatory Floodway Present"

2. **Severity Badge:**
   - Text: "SEVERITY: HARD DECLINE"
   - Color: Matches severity level
   - All-caps, 10pt

3. **Rationale (1-2 lines):**
   - Plain text, 11pt
   - Example: "18% of parcel in floodway"
   - Second line: Regulatory basis or cost
   - Example: "Development prohibited per 44 CFR 60.3"

4. **Show Evidence Link:**
   - Blue underline, 11pt
   - Opens `EvidenceDrawer`

**Recommended Actions (optional field):**
- Shown for HIGH RISK and MODERATE severity
- Example:
  ```
  Recommended Next Steps:
  • Engage FEMA-certified engineer for analysis
  • Estimate mitigation cost: $150K-$250K
  • Evaluate alternative parcel
  ```

### 6.3 Confidence & Provenance UX

**Confidence Bar:**
```
┌────────────────────────────────────────┐
│ CONFIDENCE & DATA QUALITY              │
├────────────────────────────────────────┤
│ Overall Confidence: 72% (MEDIUM)       │
│                                         │
│ [████████████████████░░░░░░░░░░] 72%  │
│                                         │
│ Domain Confidence:                     │
│ • Zoning:     [████████████████] 95%  │
│ • Flood:      [██████████████░░] 90%  │
│ • Utilities:  [█████████████░░░] 83%  │
│ • Access:     [██████████████░░] 90%  │
│ • Environ:    [███████████░░░░░] 75%  │
│                                         │
│ [View Full Provenance Report →]       │
└────────────────────────────────────────┘
```

**Domain Confidence Chips (clickable):**
```
[Zoning 95% ▼] [Flood 90% ▼] [Utilities 83% ▼]
```

**Clicking chip opens provenance details:**
```
┌────────────────────────────────────────┐
│ ZONING DATA PROVENANCE                 │
├────────────────────────────────────────┤
│ Source: Houston Planning & Development │
│ Dataset: GIS Zoning Layer              │
│ As of: December 2025                   │
│ Reliability: 95%                       │
│                                         │
│ Notes:                                 │
│ • Ordinance last amended: Oct 2025     │
│ • Overlay districts verified           │
│ • No pending amendments found          │
│                                         │
│ Limitations:                           │
│ • Setbacks computed (not surveyed)     │
│ • Conditional uses require review      │
│                                         │
│ [View Zoning Ordinance (PDF) →]       │
│ [Contact Planning Dept →]              │
└────────────────────────────────────────┘
```

**Confidence Calculation Methodology:**

Overall Confidence = Weighted average:
```
Overall = (0.25 × Zoning) + (0.25 × Flood) + 
          (0.20 × Utilities) + (0.15 × Access) + 
          (0.15 × Environmental)
```

**Confidence Reduction Rules:**

| Condition | Confidence Reduction |
|-----------|---------------------|
| Data source >1 year old | -10% |
| Data source unavailable | -30% for that domain |
| Data source low-quality (known errors) | -20% |
| Missing attributes (partial data) | -15% |
| Conflicting data from multiple sources | -10% |

**Confidence Impact on Score:**

- Confidence <60% → Score reduced by 10 points
- Confidence <50% → Score reduced by 20 points
- Flag: "⚠️ Low Confidence — Manual verification recommended"

### 6.4 Evidence Links Pattern

**Every risk claim has traceable evidence:**

**Pattern 1: Inline Evidence Link**
```
Floodway present: 18% of parcel
[Show Evidence →]
```

**Pattern 2: Evidence Drawer (side panel)**
```
┌────────────────────────────────────────┐
│ EVIDENCE: Regulatory Floodway          │
├────────────────────────────────────────┤
│ [Tabs: Evidence | Provenance | Notes]  │
│                                         │
│ EVIDENCE TAB:                          │
│                                         │
│ FEMA Floodway Designation              │
│ ─────────────────────────────────────  │
│ Source: FEMA NFHL                      │
│ Panel: 48201C0265G                     │
│ Effective Date: November 15, 2024      │
│                                         │
│ Regulatory Basis:                      │
│ 44 CFR 60.3(d)(3) — No development     │
│ in floodway that increases BFE         │
│                                         │
│ [View FEMA Panel PDF ↗]                │
│ [View FEMA FIS Report ↗]               │
│                                         │
│ Map Extract:                           │
│ [Thumbnail map showing floodway]       │
│                                         │
│ Confidence: 90%                        │
│ Last Verified: December 18, 2025       │
└────────────────────────────────────────┘
```

**Evidence Drawer Tabs:**

1. **Evidence Tab:**
   - Source document references
   - Regulatory citations
   - Map extracts / screenshots
   - Direct links to source PDFs

2. **Provenance Tab:**
   - Data source details
   - Collection date
   - Update frequency
   - Known limitations
   - Reliability score

3. **Notes Tab (optional):**
   - User-added notes
   - Tags (Hot / Watch / Dead)
   - Shared notes (if collaborative)

### 6.5 Missing Data / Low Confidence States

**Pattern: Transparent Disclosure**
```
┌────────────────────────────────────────┐
│ ⚠️ PARTIAL DATA AVAILABLE              │
├────────────────────────────────────────┤
│ Overall Confidence: LOW (45%)          │
│                                         │
│ Available Data:                        │
│ ✓ Zoning (95% confidence)              │
│ ✓ Flood (90% confidence)               │
│                                         │
│ Missing Data:                          │
│ ✗ Utilities (source unavailable)       │
│ ✗ Traffic (AADT data outdated)         │
│                                         │
│ Impact on Score:                       │
│ • Score reduced by 20 points           │
│ • Utilities assumed HIGH RISK          │
│                                         │
│ Recommended Actions:                   │
│ 1. Contact Houston Water for service   │
│ 2. Request traffic study from TxDOT    │
│ 3. Re-run analysis when data available │
│                                         │
│ [Generate Partial Report]              │
│ [Request Manual Verification]          │
└────────────────────────────────────────┘
```

**Error States:**

**Data Source Down:**
```
⚠️ Houston Water GIS server unavailable
Last successful fetch: 2 hours ago
Retrying automatically...
[Use Last Known Data] [Notify Me When Fixed]
```

**Data Conflict:**
```
⚠️ Conflicting flood zone data detected
FEMA NFHL: Zone AE
Local GIS: Zone X
Using most restrictive (FEMA) per policy
[Explain Conflict] [Report Issue]
```

**Stale Data Warning:**
```
ℹ️ Zoning data is 14 months old
Last updated: October 2024
Ordinance amendments may not be reflected
Confidence reduced to 80%
[Request Manual Verification]
```

---

## 7. REPORT UX SPECIFICATION

(See Section 4.5 for complete web report layout)

**Key Report UX Rules:**

1. **Fixed Section Order (non-negotiable):**
   - Executive Summary
   - Kill-Factors & Red Flags
   - Site Overview
   - Zoning & Entitlements
   - Flood & Environmental
   - Utilities & Infrastructure
   - Access & Transportation
   - Optional Market Snapshot
   - Evidence & Data Sources

2. **Print-Safe Design:**
   - No neon colors or gradients
   - Tables break cleanly across pages
   - Maps embedded as 300 DPI images
   - Scale bars + north arrows always visible

3. **Red-Flag Section Format:**
   - Always section #2 (after Executive Summary)
   - Each kill-factor gets full breakdown:
     - Severity badge
     - Regulatory basis
     - Cost/timeline estimate
     - Recommended action
     - Evidence links

4. **Evidence Citations:**
   - Inline: [Source, Date] format
   - Hyperlinks active in PDF (blue underline)
   - QR codes for long URLs (optional)
   - Full provenance appendix always included

5. **Export Options:**
   - **Lender Format:** Concise, IC-ready, no fluff
   - **Developer Format:** Includes cost estimates, timelines
   - Optional sections: Market Snapshot, Map Thumbnails
   - Provenance appendix: ALWAYS included (non-optional)

6. **Versioning:**
   - Re-running creates new version: "v2 (updated Dec 18)"
   - Version watermark on every page
   - Change log in header (if v2+)

---

## 8. DESIGN SYSTEM TOKENS

### 8.1 Color Palette

**Light Mode:**
```css
--bg-primary: #FFFFFF
--bg-secondary: #F9FAFB
--bg-tertiary: #F3F4F6
--surface-elevated: #FFFFFF (shadow)
--text-primary: #111827
--text-secondary: #6B7280
--text-tertiary: #9CA3AF
--border: #E5E7EB
--border-strong: #D1D5DB
```

**Dark Mode:**
```css
--bg-primary: #0F172A
--bg-secondary: #1E293B
--bg-tertiary: #334155
--surface-elevated: #1E293B (shadow)
--text-primary: #F1F5F9
--text-secondary: #CBD5E1
--text-tertiary: #94A3B8
--border: #334155
--border-strong: #475569
```

**Risk Tiers:**
```css
--risk-green: #10B981
--risk-green-bg: #D1FAE5
--risk-yellow: #F59E0B
--risk-yellow-bg: #FEF3C7
--risk-red: #EF4444
--risk-red-bg: #FEE2E2
--risk-neutral: #6B7280
```

**Confidence:**
```css
--conf-high: #10B981
--conf-med: #F59E0B
--conf-low: #EF4444
```

**Utility Colors:**
```css
--utility-water: #3B82F6
--utility-sewer: #92400E
--utility-storm: #14B8A6
--utility-electric: #FDE047
--utility-gas: #F97316
```

**Status:**
```css
--status-success: #10B981
--status-warning: #F59E0B
--status-error: #EF4444
--status-info: #3B82F6
```

**Interactive:**
```css
--primary: #2563EB
--primary-hover: #1D4ED8
--primary-active: #1E40AF
--secondary: #6B7280
--secondary-hover: #4B5563
```

### 8.2 Typography

**Font Families:**
```css
--font-sans: "Inter", system-ui, -apple-system, sans-serif
--font-mono: "Roboto Mono", "Courier New", monospace
```

**Font Sizes:**
```css
--text-xs: 10px
--text-sm: 11px
--text-base: 12px
--text-lg: 14px
--text-xl: 16px
--text-2xl: 18px
--text-3xl: 24px
--text-4xl: 32px
--text-5xl: 48px
```

**Font Weights:**
```css
--font-regular: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
```

**Line Heights:**
```css
--leading-tight: 1.25
--leading-normal: 1.5
--leading-relaxed: 1.75
```

### 8.3 Spacing Scale

```css
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-8: 32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
```

### 8.4 Border Radius

```css
--radius-sm: 4px
--radius-md: 6px
--radius-lg: 8px
--radius-xl: 12px
--radius-full: 9999px
```

### 8.5 Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)
```

### 8.6 Transitions

```css
--transition-fast: 150ms ease-out
--transition-base: 250ms ease-out
--transition-slow: 400ms ease-out
```

**Motion Rules:**
- No parallax
- No bouncy easing
- Fast transitions only (150-250ms)
- Instant layer toggle (no fade)

---

## 9. COMPONENT LIBRARY

### 9.1 TopNav

**Props:**
- `currentRoute` (string)
- `queueCount` (number)
- `user` (object)

**States:**
- Default
- Mobile (hamburger menu)

**Usage:**
```jsx
<TopNav 
  currentRoute="/parcel/123"
  queueCount={3}
  user={{name: "John", avatar: "..."}}
/>
```

---

### 9.2 FeasibilityScoreCard

**Props:**
- `score` (0-100)
- `tier` ("GREEN" | "YELLOW" | "RED")
- `confidence` (0-100)
- `confidenceLabel` ("HIGH" | "MEDIUM" | "LOW")
- `asOf` (timestamp)
- `topDrivers` (array of {factor, impact})

**States:**
- Loading (skeleton with shimmer)
- Error (red border, error message)
- Low confidence (warning badge)

**Usage:**
```jsx
<FeasibilityScoreCard
  score={68}
  tier="YELLOW"
  confidence={72}
  confidenceLabel="MEDIUM"
  asOf="2025-12-18T14:34:00Z"
  topDrivers={[
    {factor: "Floodway present", impact: -15},
    {factor: "Sewer not served", impact: -12}
  ]}
/>
```

---

### 9.3 KillFactorStack

**Props:**
- `killFactors` (array of objects)
  - `id` (string)
  - `title` (string)
  - `severity` ("HARD_DECLINE" | "HIGH_RISK" | "MODERATE" | "LOW")
  - `rationale` (string)
  - `recommendedAction` (string, optional)
  - `evidenceLinks` (array of {label, url})

**States:**
- None (shows "✓ No hard declines detected")
- Has factors (shows list)

**Usage:**
```jsx
<KillFactorStack
  killFactors={[
    {
      id: "floodway",
      title: "Regulatory Floodway Present",
      severity: "HARD_DECLINE",
      rationale: "18% of parcel in floodway. Development prohibited per 44 CFR 60.3.",
      recommendedAction: "Reject parcel OR obtain CLOMR",
      evidenceLinks: [
        {label: "View FEMA Panel", url: "..."}
      ]
    }
  ]}
/>
```

---

### 9.4 RiskBreakdownTable

**Props:**
- `rows` (array of objects)
  - `domain` (string): "Zoning" / "Flood" / "Utilities" / etc.
  - `status` (string): "✓ Compliant" / "⚠️ Issue" / "✗ Non-compliant"
  - `severity` ("GREEN" | "YELLOW" | "RED")
  - `keyMetric` (string): "Zone AE" / "Sewer 2.3 mi" / etc.
  - `linkToEvidence` (url)

**Usage:**
```jsx
<RiskBreakdownTable
  rows={[
    {
      domain: "Zoning",
      status: "✓ By-Right",
      severity: "GREEN",
      keyMetric: "C-2 Commercial",
      linkToEvidence: "/evidence/zoning"
    },
    {
      domain: "Flood",
      status: "⚠️ Floodway",
      severity: "RED",
      keyMetric: "18% in floodway",
      linkToEvidence: "/evidence/flood"
    }
  ]}
/>
```

---

### 9.5 ConfidenceProvenanceBar

**Props:**
- `overallConfidence` (0-100)
- `domainConfidence` (array of {domain, confidence})
- `provenanceSummary` (array of {domain, source, asOf, reliability})

**Interaction:**
- Click domain chip → Opens `EvidenceDrawer` at provenance tab

**Usage:**
```jsx
<ConfidenceProvenanceBar
  overallConfidence={72}
  domainConfidence={[
    {domain: "Zoning", confidence: 95},
    {domain: "Flood", confidence: 90},
    {domain: "Utilities", confidence: 83}
  ]}
  provenanceSummary={[
    {
      domain: "Zoning",
      source: "Houston GIS",
      asOf: "2025-12",
      reliability: 95
    }
  ]}
/>
```

---

### 9.6 LayerPresetSwitcher

**Props:**
- `preset` ("Lender" | "Developer" | "Engineer" | "Custom")
- `onChange(preset)` (callback)

**Constraints:**
- Switching presets resets layers to known safe set
- Custom preset auto-activates when user modifies layers

**Usage:**
```jsx
<LayerPresetSwitcher
  preset="Lender"
  onChange={(preset) => setActivePreset(preset)}
/>
```

---

### 9.7 EvidenceDrawer

**Props:**
- `isOpen` (boolean)
- `onClose` (callback)
- `activeTab` ("evidence" | "provenance" | "notes")
- `evidenceData` (object)

**Tabs:**
1. Evidence: Citations, maps, regulatory refs
2. Provenance: Data source details
3. Notes: User-added notes, tags

**Usage:**
```jsx
<EvidenceDrawer
  isOpen={true}
  onClose={() => setDrawerOpen(false)}
  activeTab="evidence"
  evidenceData={{
    title: "Regulatory Floodway",
    source: "FEMA NFHL",
    panel: "48201C0265G",
    effectiveDate: "2024-11-15",
    links: [...]
  }}
/>
```

---

### 9.8 CompareMatrix

**Props:**
- `parcels` (array of parcel objects)
- `onSort(column)` (callback)
- `onFilter(filters)` (callback)
- `onExport()` (callback)
- `onBulkReject(ids)` (callback)

**Features:**
- Sortable columns
- Checkboxes for bulk actions
- Export to PDF
- Filters (floodway, sewer, zoning)

**Usage:**
```jsx
<CompareMatrix
  parcels={[...]}
  onSort={(col) => sortBy(col)}
  onFilter={(filters) => applyFilters(filters)}
  onExport={() => generatePDF()}
  onBulkReject={(ids) => tagAsDead(ids)}
/>
```

---

### 9.9 ExportModal

**Props:**
- `isOpen` (boolean)
- `onClose` (callback)
- `onExport(options)` (callback)

**Options:**
- `format` ("Lender" | "Developer")
- `includeMarket` (boolean)
- `includeAppendix` (boolean, locked ON)
- `paperSize` ("letter" | "legal" | "a4")
- `orientation` ("portrait" | "landscape")

**Usage:**
```jsx
<ExportModal
  isOpen={true}
  onClose={() => setModalOpen(false)}
  onExport={(opts) => generatePDF(opts)}
/>
```

---

### 9.10 ParcelMiniCard

**Props:**
- `address` (string)
- `score` (0-100)
- `tier` ("GREEN" | "YELLOW" | "RED")
- `topKillFactors` (array, max 2)
- `timestamp` (string): "2 hours ago"
- `onClick` (callback)

**Usage:**
```jsx
<ParcelMiniCard
  address="1234 Main St, Houston TX"
  score={68}
  tier="YELLOW"
  topKillFactors={["Floodway", "Sewer"]}
  timestamp="2 hours ago"
  onClick={() => navigate('/parcel/123')}
/>
```

---

### 9.11 RunStatusTimeline

**Props:**
- `runs` (array of run objects)
  - `id` (string)
  - `status` ("in_progress" | "completed" | "failed")
  - `progress` (0-100, if in_progress)
  - `statusMessage` (string): "Analyzing utilities..."
  - `parcelAddress` (string)
  - `timestamp` (string)

**Usage:**
```jsx
<RunStatusTimeline
  runs={[
    {
      id: "run1",
      status: "in_progress",
      progress: 65,
      statusMessage: "Analyzing utilities...",
      parcelAddress: "1234 Main St",
      timestamp: "2 min ago"
    }
  ]}
/>
```

---

## 10. MVP → V2 → V3 ROADMAP

### MVP (Ship First — Weeks 1-16)

**Core Functionality:**
- ✓ Search by address/APN
- ✓ Parcel Overview (Decision Cockpit)
  - Feasibility score + tier
  - Kill-factors (top 3)
  - Confidence + provenance
  - Above-the-fold decision summary
- ✓ Map with Lender preset only
  - Parcel, Zoning, Flood, Utilities
  - Max 4 layers enforced
- ✓ Report preview (web)
- ✓ PDF export (Lender format only)
- ✓ Compare (basic, up to 10 parcels)
- ✓ Work queue (in progress, failed, completed)

**Data Coverage:**
- Zoning (Houston only initially)
- FEMA flood zones + floodway
- Utilities (Water, Sewer, Electric — Houston only)
- AADT traffic counts (TxDOT)

**Tech Stack:**
- Frontend: React + Tailwind CSS
- Map: MapLibre GL JS
- Backend: Python FastAPI
- Database: PostgreSQL + PostGIS
- LLM: Claude Sonnet 3.5 (zoning interpretation)

**Deferred to V2:**
- Developer/Engineer presets
- Wetlands layer
- Stormwater analysis
- Mobile field mode
- Report versioning

**Success Metrics:**
- 100 beta users
- 500 feasibility runs
- <30 second analysis time (p95)
- >85% user satisfaction

---

### V2 (Weeks 17-28)

**New Features:**
- ✓ Developer preset (all utilities, roads, AADT)
- ✓ Engineer preset (flood, floodway, wetlands, storm, topography)
- ✓ Wetlands layer (NWI)
- ✓ Stormwater analysis (detention estimates)
- ✓ Work queue enhancements
  - Retry failed runs
  - Manual verification requests
- ✓ Report versioning (v1, v2, etc.)
- ✓ Mobile field mode (basic offline notes)
- ✓ Parcel tagging (Hot / Watch / Dead)
- ✓ Shared links (auth-required)

**Data Expansion:**
- Multi-city support (Dallas, Austin, San Antonio)
- Wetlands (USFWS NWI)
- Stormwater detention rules
- Topography (LiDAR DEM)

**UX Improvements:**
- Confidence explanations more detailed
- Evidence drawer with 3 tabs
- Compare supports 20 parcels
- Bulk actions in compare

**Tech Enhancements:**
- Multi-pass LLM reasoning (3 passes)
- RAG with vector DB (Pinecone)
- API rate limiting + caching
- Observability (Datadog)

**Success Metrics:**
- 500 active users
- 5,000 feasibility runs/month
- Expand to 4 Texas cities
- <20 second analysis time (p95)

---

### V3 (Weeks 29-40)

**Advanced Features:**
- ✓ Advanced map studio
  - Layer reordering (drag-drop)
  - Opacity controls
  - Custom layer search
- ✓ Multi-parcel scoring pipelines
  - Batch upload (CSV with 100+ parcels)
  - Parallel processing
  - Portfolio heatmaps
- ✓ IC-ready comparison exports
  - Executive summary format
  - Side-by-side tearsheets
- ✓ Report customization
  - Custom branding
  - White-label options
  - Custom sections
- ✓ API access (Enterprise)
  - RESTful API for integrations
  - Webhooks for async results
- ✓ Collaboration features
  - Shared workspaces
  - Team comments
  - Role-based access

**Data Expansion:**
- National coverage (top 50 MSAs)
- Climate risk models (wildfire, heat, sea-level rise)
- Environmental justice overlays
- Historical zoning data (temporal versioning)

**AI Enhancements:**
- Fine-tuned LLM on 10K+ zoning codes
- Self-healing JSON with 99.9% success
- Predictive feasibility (ML model trained on 100K+ deals)
- Automated ordinance parsing (no manual encoding)

**Enterprise Features:**
- SSO (SAML, Okta)
- Audit logs
- Data residency options
- SLA guarantees (99.9% uptime)

**Success Metrics:**
- 2,000 active users
- 50,000 feasibility runs/month
- $2M ARR
- Enterprise contracts with 5+ REITs

---

## 11. CRITICAL IMPLEMENTATION NOTES

### 11.1 Vibe-Codable Components (~40%)

**Can be built with AI-assisted development:**
- Search bar + autocomplete
- Parcel mini cards
- Score card layout (HTML/CSS)
- Kill-factor stack (HTML/CSS)
- Evidence drawer (basic structure)
- Report sections (HTML/CSS)
- Export modal (UI only, not PDF generation)
- Comparison table (basic sorting/filtering)

**Approach:**
- Use Claude/Cursor to generate React components
- Focus on UI layout and styling first
- Placeholder data for rapid iteration
- Component props well-defined upfront

---

### 11.2 Vibe-Dangerous Components (~35%)

**Appears simple but has hidden complexity:**
- FEMA flood zone calculation (multi-zone parcels, BFE interpolation)
- Zoning interpretation with overlay districts
- Wetlands analysis (false positives/negatives)
- Utility serviceability (distance thresholds, capacity)
- Feasibility scoring algorithm (weighted, calibrated)
- Confidence calculation (domain weighting)
- PDF generation (page breaks, maps, tables)

**Approach:**
- Deliberate architecture BEFORE coding
- Unit tests for edge cases
- Manual QA with real parcels
- Iterative refinement based on lender feedback

---

### 11.3 Requires Deliberate Engineering (~25%)

**Cannot be vibed:**
- GIS spatial operations (PostGIS queries)
- FEMA tile service integration (caching, retries)
- LLM pipeline orchestration (multi-pass reasoning, RAG)
- Production observability (logging, metrics, alerts)
- Data resilience (source failures, fallbacks)
- API rate limiting + throttling
- PDF generation with embedded maps

**Approach:**
- Senior engineer architecture review
- Formal design docs
- Extensive testing
- Performance benchmarks

---

## 12. ACCESSIBILITY & COMPLIANCE

### 12.1 Colorblind-Safe Design

**Risk Tier Badges:**
- Do NOT rely on color alone
- Include icon + text label
- Example:
  ```
  [● GREEN] ← Color + icon + text
  [▲ YELLOW] ← Color + icon + text
  [■ RED] ← Color + icon + text
  ```

**Map Layers:**
- Use patterns in addition to color
  - Floodway: Red fill + diagonal hatch
  - Wetlands: Green fill + crosshatch
- Labels always visible at appropriate zoom

**Charts:**
- Use accessible color palettes (ColorBrewer)
- Add data labels to charts
- Provide table alternative for charts

### 12.2 Keyboard Navigation

**All interactive elements focusable:**
- Search bar: Tab to focus, Enter to submit
- Layer toggles: Tab to focus, Space to toggle
- Buttons: Tab to focus, Enter to activate
- Map: Arrow keys to pan, +/- to zoom

**Focus indicators:**
- Blue outline (2px solid)
- High contrast
- Never `outline: none` without alternative

### 12.3 Screen Reader Support

**ARIA labels:**
- `<button aria-label="Zoom in">+</button>`
- `<input aria-label="Search parcels by address">`

**Status announcements:**
- `<div role="status" aria-live="polite">Analysis complete</div>`

**Landmarks:**
- `<nav aria-label="Main navigation">`
- `<main>`
- `<aside aria-label="Map controls">`

### 12.4 PDF Print Safety

**Grayscale Readable:**
- All risk badges distinguishable in grayscale
- Test prints on black-and-white printer

**High Contrast:**
- Text contrast ratio: 4.5:1 minimum
- Table borders: 3:1 minimum

---

## 13. FINAL SUMMARY

This blueprint defines a **production-ready UX/UI system** for SiteIntel™ that is:

1. **Immediately implementable** — Every screen, component, and interaction is fully specified
2. **Lender-defensible** — Kill-factors always visible, evidence always traceable, confidence always explicit
3. **Decision-optimized** — "Speed to NO" advantage through above-the-fold summaries
4. **Institutional** — Calm, technical tone; no consumer SaaS playfulness
5. **Performance-first** — Scale-dependent rendering, debounced interactions, tile caching
6. **Accessible** — Colorblind-safe, keyboard navigable, screen reader compatible

**Key Differentiators vs Competitors:**
- Only platform with **kill-factors always above the fold**
- Only platform with **integrated flood + utilities + zoning + environmental**
- Only platform with **lender-grade provenance and confidence scoring**
- Only platform with **presets that hide GIS complexity**

**Next Steps:**
1. Review with stakeholders (developers, lenders, IC chairs)
2. Build MVP screens in Figma (high-fidelity mockups)
3. Begin vibe-coded development (search, cards, layouts)
4. Parallel track: Deliberate GIS engineering (flood, utilities)
5. Integrate LLM pipeline (zoning interpretation)
6. Beta launch with 100 users by Week 16

---

**Document Status:** FINAL — Ready for Implementation  
**Version:** 1.0  
**Owner:** Harris, SiteIntel™ Product Lead  
**Last Updated:** December 18, 2025
