# SiteIntel™ Map UX/UI Design Guidelines

> User experience and visual design specifications for the geospatial visualization layer

**Version:** 2.0  
**Last Updated:** 2025-01-19  
**Maintainers:** Product & Design Team

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Preset System](#2-preset-system)
3. [Color System](#3-color-system)
4. [Layer Visibility Defaults](#4-layer-visibility-defaults)
5. [Legend Design](#5-legend-design)
6. [User Interaction Patterns](#6-user-interaction-patterns)
7. [Accessibility](#7-accessibility)
8. [Mobile Experience](#8-mobile-experience)
9. [Error States & Empty States](#9-error-states--empty-states)
10. [Animation & Transitions](#10-animation--transitions)
11. [Component Specifications](#11-component-specifications)

---

## 1. Design Philosophy

### 1.1 Core Principles

| Principle | Description | Implementation |
|-----------|-------------|----------------|
| **Decision-Driven** | Every visual element supports a feasibility decision | Layers answer specific questions (buildable? flood risk?) |
| **Clarity Over Density** | Max 3-4 layers visible at once | Preset system enforces layer limits |
| **Audience-Aware** | Different stakeholders need different views | Developer/Lender/IC presets |
| **Progressive Disclosure** | Show complexity only when needed | Start minimal, expand on interaction |
| **Trust Through Transparency** | Data sources always visible | Footer citations, tooltips on hover |

### 1.2 Design Tenets

1. **"Map as Evidence"** — The map proves feasibility claims, not decorates the page
2. **"3-Second Rule"** — Key information visible within 3 seconds of page load
3. **"No Orphan Layers"** — Every visible layer has a legend entry
4. **"Mobile-First Controls"** — Touch targets work on all devices

### 1.3 Visual Hierarchy

```
Priority 1: Subject Parcel
  └── Always visible, highest z-index, distinct stroke
  
Priority 2: Risk Layers (Flood, Wetlands, Environmental)
  └── Semi-transparent fills, visible borders
  
Priority 3: Infrastructure (Utilities, Roads)
  └── Line features, varying dash patterns
  
Priority 4: Context (Zoning, Demographics)
  └── Subtle fills, lower opacity
  
Priority 5: Basemap
  └── Desaturated, non-competing colors
```

---

## 2. Preset System

### 2.1 Preset Overview

Presets are curated layer configurations optimized for specific decision-making contexts. Users switch between presets rather than toggling individual layers.

### 2.2 Preset Matrix

| Preset ID | Display Label | Audience | Primary Question | Key Layers |
|-----------|--------------|----------|------------------|------------|
| `decision` | **Decision Mode** | Developer | "Is this site feasible?" | Parcel, Flood, Wetlands, Subject |
| `lender-risk` | **Lender Risk** | Lender | "What are the underwriting risks?" | Flood, Floodway, Environmental, Subject |
| `utilities` | **Utilities** | Developer | "Can we get services?" | Water, Sewer, Storm, Subject |
| `zoning` | **Zoning** | Developer | "What can we build?" | Zoning Districts, Overlays, Subject |
| `access-traffic` | **Access & Traffic** | Developer | "Is access adequate?" | Roads, AADT, Signals, Subject |
| `market` | **Market Context** | IC | "How does this compare?" | Comps, Submarket, Demographics |

### 2.3 Preset Behavior Rules

**On Preset Switch:**
1. All current layers hidden
2. New preset's `layersOn` layers shown
3. Map zooms to `defaultZoom` level
4. Legend updates to reflect visible layers
5. Any active highlights are cleared

**Preset Persistence:**
- Report view: Preset saved to `localStorage` per application ID
- Application form: Always resets to default on page load

### 2.4 Preset Selector UI

```
┌─────────────────────────────────────────────────────────┐
│  [🎯 Decision] [⚠️ Risk] [🔧 Utilities] [📐 Zoning] ... │
└─────────────────────────────────────────────────────────┘
     ▲
     └── Active preset has filled background (primary color)
         Inactive presets have outline style
```

**Specifications:**
- Button height: 36px
- Icon size: 16px
- Spacing between buttons: 8px
- Active state: `bg-primary text-primary-foreground`
- Hover state: `bg-muted`

---

## 3. Color System

### 3.1 PRD-Compliant Layer Colors

All colors are defined in HSL for theme compatibility.

| Layer Category | Layer Name | Color (HEX) | HSL | Usage |
|----------------|------------|-------------|-----|-------|
| **Parcels** | Subject Parcel | `#FF7A00` | `27 100% 50%` | Fill + Stroke |
| **Parcels** | Other Parcels | `#64748B` | `215 16% 47%` | Stroke only |
| **Utilities** | Water Lines | `#1F6AE1` | `217 78% 50%` | Line |
| **Utilities** | Sewer Lines | `#7A4A2E` | `24 45% 33%` | Dashed Line |
| **Utilities** | Storm Lines | `#1C7C7C` | `180 63% 30%` | Dotted Line |
| **Flood** | Zone AE (High) | `#EF4444` | `0 84% 60%` | Fill 40% opacity |
| **Flood** | Zone A | `#F97316` | `25 95% 53%` | Fill 40% opacity |
| **Flood** | Zone X (Low) | `#3B82F6` | `217 91% 60%` | Fill 30% opacity |
| **Flood** | Floodway | `#DC2626` | `0 72% 51%` | Fill 50% opacity |
| **Wetlands** | NWI Wetlands | `#22C55E` | `142 71% 45%` | Fill 35% opacity |
| **Zoning** | Commercial | `#8B5CF6` | `258 90% 66%` | Fill 30% opacity |
| **Zoning** | Residential | `#FBBF24` | `45 93% 56%` | Fill 30% opacity |
| **Zoning** | Industrial | `#6366F1` | `239 84% 67%` | Fill 30% opacity |

### 3.2 Semantic Color Tokens

Map colors should reference design system tokens where possible:

```css
/* In index.css */
:root {
  --map-parcel-primary: 27 100% 50%;      /* Feasibility Orange */
  --map-parcel-secondary: 215 16% 47%;    /* Slate */
  --map-utility-water: 217 78% 50%;       /* Blue */
  --map-utility-sewer: 24 45% 33%;        /* Brown */
  --map-utility-storm: 180 63% 30%;       /* Teal */
  --map-flood-high: 0 84% 60%;            /* Red */
  --map-flood-medium: 25 95% 53%;         /* Orange */
  --map-flood-low: 217 91% 60%;           /* Blue */
  --map-wetland: 142 71% 45%;             /* Green */
}
```

### 3.3 Opacity Guidelines

| Layer Type | Default Opacity | Hover Opacity | Selected Opacity |
|------------|-----------------|---------------|------------------|
| Parcel Fill | 0% (transparent) | 20% | 40% |
| Parcel Stroke | 100% | 100% | 100% |
| Flood Fill | 40% | 50% | 60% |
| Wetland Fill | 35% | 45% | 55% |
| Utility Lines | 100% | 100% | 100% |
| Zoning Fill | 30% | 40% | 50% |

### 3.4 Dark Mode Adjustments

```css
.dark {
  --map-parcel-primary: 27 100% 55%;      /* Slightly brighter */
  --map-flood-high: 0 84% 55%;            /* Adjusted for dark bg */
  --map-basemap-filter: brightness(0.8) saturate(0.7);
}
```

---

## 4. Layer Visibility Defaults

### 4.1 By Application Step

| Step | Context | Visible Layers | Reason |
|------|---------|----------------|--------|
| Step 1: Property | Address entry | Parcels only | Focus on parcel selection |
| Step 1: Property (after select) | Parcel selected | Parcel, Flood | Immediate risk awareness |
| Step 2: Intent | Project details | None (no map) | Form focus |
| Step 3: Contact | User info | None (no map) | Form focus |

### 4.2 By Report Section

| Report Section | Default Preset | Visible Layers |
|----------------|----------------|----------------|
| Executive Summary | Decision | Parcel, Flood, Wetlands |
| Property Overview | Decision | Parcel, Flood |
| Zoning Analysis | Zoning | Parcel, Zoning, Overlays |
| Infrastructure | Utilities | Parcel, Water, Sewer, Storm |
| Traffic & Access | Access | Parcel, Roads, AADT |
| Environmental | Lender Risk | Parcel, Flood, Wetlands, EPA |
| Market Analysis | Market | Parcel, Comps, Demographics |

### 4.3 Layer Count Limits

**Hard Limit:** Maximum 6 layers visible simultaneously

**Soft Limit:** Presets configured for 3-4 layers

**Warning Threshold:** Show "Layer limit" badge when > 4 layers

---

## 5. Legend Design

### 5.1 Legend Anatomy

```
┌────────────────────────────────────────┐
│ 📍 Map Legend                    [−]   │  ← Collapsible header
├────────────────────────────────────────┤
│                                        │
│ ━━━ Subject Parcel                     │  ← Line sample + label
│                                        │
│ ■ Flood Zone AE (High Risk)            │  ← Fill sample + label
│ ■ Flood Zone X (Minimal)               │
│                                        │
│ ─ ─ Water Lines                        │  ← Dashed line sample
│ · · · Sewer Lines                      │  ← Dotted line sample
│                                        │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │  ← Separator
│ Data: FEMA NFHL, HCAD, CoH GIS         │  ← Source attribution
│ Updated: Jan 2025                      │
└────────────────────────────────────────┘
```

### 5.2 Legend Behavior

**Conditional Display:**
- Only shows entries for currently visible layers
- Updates immediately on preset switch
- Hides completely if no layers visible

**Collapse States:**
- Desktop: Expanded by default, collapsible
- Mobile: Collapsed by default, expandable
- Remembers state in `localStorage`

### 5.3 Legend Symbol Types

| Layer Type | Symbol | Example |
|------------|--------|---------|
| Polygon fill | Square (`■`) | `■ Flood Zone AE` |
| Line (solid) | Horizontal line (`━`) | `━ Subject Parcel` |
| Line (dashed) | Dashed line (`─ ─`) | `─ ─ Water Main` |
| Line (dotted) | Dotted line (`· · ·`) | `· · · Sewer Line` |
| Point | Circle (`●`) | `● Traffic Counter` |
| Heatmap | Gradient bar | `[░▒▓█] Population` |

### 5.4 Legend Specifications

- Width: 240px (desktop), 100% (mobile bottom sheet)
- Position: Bottom-left of map (desktop), bottom drawer (mobile)
- Background: `bg-background/95 backdrop-blur-sm`
- Border: `border border-border rounded-lg`
- Shadow: `shadow-lg`
- Font size: 13px for labels, 11px for sources

---

## 6. User Interaction Patterns

### 6.1 Parcel Selection

**Click Interaction:**
```
User clicks on parcel
         │
         ▼
Feature state → selected: true
         │
         ▼
Parcel fill opacity → 40%
Parcel stroke width → 3px
         │
         ▼
Popup appears with:
  - Address/Parcel ID
  - Acreage
  - Owner (if available)
  - "Select This Parcel" button
```

**Hover Interaction:**
```
Cursor enters parcel
         │
         ▼
Feature state → hover: true
         │
         ▼
Parcel fill opacity → 20%
Cursor → pointer
         │
         ▼
Tooltip shows: "Click to select"
```

### 6.2 Popup Design

```
┌──────────────────────────────────────┐
│ 📍 1234 Main Street                  │
├──────────────────────────────────────┤
│ Parcel ID: 0123-4567-8901           │
│ Acreage: 2.45 acres                 │
│ Owner: ABC Holdings LLC             │
│ Zoning: C-2 Commercial              │
├──────────────────────────────────────┤
│        [ Select This Parcel ]        │
└──────────────────────────────────────┘
```

**Popup Specifications:**
- Max width: 280px
- Padding: 16px
- Border radius: 8px
- Close button: Top-right corner
- Anchor: Bottom of parcel centroid

### 6.3 Kill Factor Synchronization

When a kill factor badge is clicked in the report:

1. Map highlights corresponding feature(s)
2. Map pans/zooms to show highlighted features
3. Highlighted features get pulsing animation
4. "Clear Highlights" button appears

**Highlight Styling:**
```css
/* Pulsing animation for highlighted features */
@keyframes pulse-highlight {
  0%, 100% { stroke-opacity: 1; stroke-width: 4px; }
  50% { stroke-opacity: 0.5; stroke-width: 6px; }
}
```

### 6.4 Draw Mode (Custom Parcels)

**Activation:** Click "Draw Parcel" button when no parcel found

**Drawing Flow:**
1. Cursor changes to crosshair
2. Click to add vertices
3. Double-click to complete polygon
4. Polygon validates (must be closed, no self-intersection)
5. Success: Polygon saved, fill applied
6. Error: Toast with correction guidance

**Draw Mode UI:**
```
┌─────────────────────────────────────────────┐
│ ✏️ Draw Mode Active                         │
│ Click to add points. Double-click to finish.│
│                        [ Cancel ] [ Undo ]  │
└─────────────────────────────────────────────┘
```

---

## 7. Accessibility

### 7.1 WCAG 2.1 AA Compliance

| Requirement | Implementation | Status |
|-------------|---------------|--------|
| Color contrast (text) | 4.5:1 minimum | ✅ |
| Color contrast (UI) | 3:1 minimum | ✅ |
| Focus indicators | 2px outline, primary color | ✅ |
| Touch targets | 48px minimum | ✅ |
| Keyboard navigation | Full map controls | ✅ |
| Screen reader | ARIA labels on all controls | ✅ |

### 7.2 Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move between map controls |
| `Enter` / `Space` | Activate focused control |
| `Arrow keys` | Pan map (when map focused) |
| `+` / `-` | Zoom in/out |
| `Escape` | Close popup, exit draw mode |
| `1-6` | Switch to preset 1-6 |

### 7.3 Screen Reader Labels

```tsx
<button
  aria-label="Zoom in"
  aria-describedby="zoom-in-description"
>
  <PlusIcon />
</button>
<span id="zoom-in-description" className="sr-only">
  Increases map zoom level by one step
</span>
```

### 7.4 Color Blindness Considerations

- Flood zones use pattern fills in addition to color
- Utility lines differentiated by dash pattern, not just color
- Legend includes text labels, not color-only indicators

**Pattern Reference:**
| Layer | Pattern | Accessibility Aid |
|-------|---------|-------------------|
| Flood High | Diagonal stripes | 45° lines |
| Flood Low | Dots | Scattered dots |
| Wetlands | Cross-hatch | Grid pattern |

---

## 8. Mobile Experience

### 8.1 Touch Gestures

| Gesture | Action |
|---------|--------|
| Single tap | Select parcel / Show popup |
| Double tap | Zoom in |
| Two-finger pinch | Zoom in/out |
| Two-finger drag | Pan map |
| Long press | Context menu (future) |

### 8.2 Mobile-Specific Controls

**Floating Action Button (FAB):**
```
┌────────────────────────────────────────┐
│                                        │
│                 [MAP]                  │
│                                        │
│                                        │
│                                        │
│                                ┌─────┐ │
│                                │ 🗺️ │ │  ← Layer FAB
│                                └─────┘ │
└────────────────────────────────────────┘
```

**FAB Expansion:**
```
                         ┌─────────────────┐
                         │ Decision Mode   │
                         │ Lender Risk     │
                         │ Utilities       │
                         │ Zoning          │
                         │ Access          │
                         │ Market          │
                         ├─────────────────┤
                   ┌─────│    [Close]      │
                   │ 🗺️ │─────────────────┘
                   └─────┘
```

### 8.3 Mobile Legend (Bottom Sheet)

```
┌────────────────────────────────────────┐
│ ═══════════                            │  ← Drag handle
│ Map Legend                             │
├────────────────────────────────────────┤
│ ━━━ Subject Parcel                     │
│ ■ Flood Zone AE                        │
│ ─ ─ Water Lines                        │
│                                        │
│ Sources: FEMA, HCAD, CoH GIS           │
└────────────────────────────────────────┘
```

### 8.4 Responsive Breakpoints

| Breakpoint | Map Height | Controls |
|------------|------------|----------|
| Mobile (< 640px) | 300px | FAB + Bottom sheet |
| Tablet (640-1024px) | 400px | Sidebar preset buttons |
| Desktop (> 1024px) | 500px+ | Full header controls |

---

## 9. Error States & Empty States

### 9.1 Error States

**Tile Load Failure:**
```
┌────────────────────────────────────────┐
│                                        │
│     ⚠️ Unable to load map tiles        │
│                                        │
│     Using backup data source.          │
│     Some features may be unavailable.  │
│                                        │
│           [ Retry ] [ Continue ]       │
│                                        │
└────────────────────────────────────────┘
```

**No Parcels Found:**
```
┌────────────────────────────────────────┐
│                                        │
│     📍 No parcels found at this        │
│        location                        │
│                                        │
│     Try zooming in or searching        │
│     for a different address.           │
│                                        │
│     [ Draw Custom Parcel ]             │
│                                        │
└────────────────────────────────────────┘
```

**Network Error:**
```
┌────────────────────────────────────────┐
│                                        │
│     🔌 Connection lost                 │
│                                        │
│     Map data couldn't be loaded.       │
│     Check your internet connection.    │
│                                        │
│           [ Try Again ]                │
│                                        │
└────────────────────────────────────────┘
```

### 9.2 Loading States

**Initial Load:**
```
┌────────────────────────────────────────┐
│                                        │
│          ◐ Loading map...              │
│                                        │
│     [░░░░░░░░░░░░░░░░░░░░] 45%         │
│                                        │
└────────────────────────────────────────┘
```

**Layer Loading:**
- Skeleton pulse over layer area
- "Loading flood data..." toast
- Progress indicator in legend

### 9.3 Empty States

**No Flood Data:**
```
Legend shows: "ℹ️ No flood zones in view"
```

**No Utilities:**
```
Legend shows: "ℹ️ Utility data unavailable for this area"
```

---

## 10. Animation & Transitions

### 10.1 Animation Specifications

| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Layer fade in/out | 300ms | ease-out | Visibility toggle |
| Popup open | 200ms | ease-out | Parcel click |
| Popup close | 150ms | ease-in | Close button |
| Preset switch | 400ms | ease-in-out | Preset button click |
| Highlight pulse | 2000ms | ease-in-out | Kill factor click |
| Zoom | 300ms | ease-out | Zoom button |
| Pan to feature | 500ms | ease-out | Feature highlight |

### 10.2 CSS Animations

```css
/* Layer visibility transition */
.maplibregl-layer {
  transition: opacity 300ms ease-out;
}

/* Popup entrance */
@keyframes popup-enter {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Highlight pulse */
@keyframes feature-pulse {
  0%, 100% {
    stroke-width: 3px;
    stroke-opacity: 1;
  }
  50% {
    stroke-width: 6px;
    stroke-opacity: 0.7;
  }
}

/* Loading skeleton */
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}
```

### 10.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .maplibregl-layer,
  .maplibregl-popup {
    transition: none;
    animation: none;
  }
}
```

---

## 11. Component Specifications

### 11.1 MapLibreCanvas Container

```tsx
<div className={cn(
  "relative w-full rounded-lg overflow-hidden",
  "border border-border",
  "bg-muted",  // Placeholder background
  className
)}>
  {/* Map renders here */}
  
  {/* Controls overlay */}
  <div className="absolute top-4 right-4 z-10">
    {/* Zoom controls */}
  </div>
  
  {/* Legend overlay */}
  <div className="absolute bottom-4 left-4 z-10">
    {/* Legend component */}
  </div>
</div>
```

### 11.2 Preset Button

```tsx
<Button
  variant={isActive ? "default" : "outline"}
  size="sm"
  className={cn(
    "gap-2 h-9",
    isActive && "bg-primary text-primary-foreground"
  )}
>
  <PresetIcon className="h-4 w-4" />
  <span>{preset.label}</span>
</Button>
```

### 11.3 Legend Card

```tsx
<Card className={cn(
  "w-60 max-h-80 overflow-auto",
  "bg-background/95 backdrop-blur-sm",
  "shadow-lg"
)}>
  <CardHeader className="pb-2">
    <CardTitle className="text-sm flex items-center gap-2">
      <Layers className="h-4 w-4" />
      Map Legend
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-2">
    {/* Legend items */}
  </CardContent>
  <CardFooter className="text-xs text-muted-foreground">
    Sources: {sources.join(', ')}
  </CardFooter>
</Card>
```

### 11.4 Popup Component

```tsx
<div className={cn(
  "bg-popover text-popover-foreground",
  "rounded-lg shadow-xl",
  "border border-border",
  "p-4 max-w-[280px]",
  "animate-in fade-in-0 zoom-in-95"
)}>
  <div className="flex items-start justify-between mb-2">
    <h4 className="font-semibold text-sm">{address}</h4>
    <Button variant="ghost" size="icon" className="h-6 w-6">
      <X className="h-4 w-4" />
    </Button>
  </div>
  <div className="space-y-1 text-sm text-muted-foreground">
    <p>Parcel ID: {parcelId}</p>
    <p>Acreage: {acreage}</p>
    <p>Owner: {owner}</p>
  </div>
  <Button className="w-full mt-4" size="sm">
    Select This Parcel
  </Button>
</div>
```

---

## Appendix A: Design Tokens Reference

```css
/* Map-specific design tokens in index.css */
:root {
  /* Layer colors */
  --map-parcel-primary: 27 100% 50%;
  --map-parcel-secondary: 215 16% 47%;
  --map-parcel-selected: 27 100% 50%;
  
  --map-utility-water: 217 78% 50%;
  --map-utility-sewer: 24 45% 33%;
  --map-utility-storm: 180 63% 30%;
  
  --map-flood-high: 0 84% 60%;
  --map-flood-medium: 25 95% 53%;
  --map-flood-low: 217 91% 60%;
  --map-floodway: 0 72% 51%;
  
  --map-wetland: 142 71% 45%;
  --map-zoning-commercial: 258 90% 66%;
  --map-zoning-residential: 45 93% 56%;
  --map-zoning-industrial: 239 84% 67%;
  
  /* Opacities */
  --map-fill-opacity-default: 0.3;
  --map-fill-opacity-hover: 0.4;
  --map-fill-opacity-selected: 0.5;
  
  /* Stroke widths */
  --map-stroke-width-default: 2px;
  --map-stroke-width-hover: 2.5px;
  --map-stroke-width-selected: 3px;
  
  /* Z-indices */
  --map-z-basemap: 0;
  --map-z-context: 10;
  --map-z-infrastructure: 20;
  --map-z-risk: 30;
  --map-z-subject: 40;
  --map-z-controls: 50;
}
```

---

## Appendix B: Figma Component Library

| Component | Figma Link | Status |
|-----------|------------|--------|
| Map Container | [Link] | ✅ Complete |
| Preset Buttons | [Link] | ✅ Complete |
| Legend Card | [Link] | ✅ Complete |
| Parcel Popup | [Link] | ✅ Complete |
| Mobile FAB | [Link] | ✅ Complete |
| Error States | [Link] | ✅ Complete |
| Loading States | [Link] | ✅ Complete |

---

## Appendix C: User Research Findings

### C.1 Key Insights

1. **Developers prefer "modes" over layer toggles** — 85% found presets easier than individual controls
2. **Legend is essential** — 92% referred to legend when interpreting map
3. **Mobile usage is growing** — 40% of report views are on tablet/mobile
4. **Flood zones are #1 priority** — First thing lenders look for

### C.2 Usability Test Results

| Task | Success Rate | Avg. Time |
|------|--------------|-----------|
| Find subject parcel | 100% | 3.2s |
| Identify flood zone | 95% | 5.1s |
| Switch to utilities view | 90% | 4.8s |
| Understand legend | 98% | 2.1s |
| Use on mobile | 85% | 8.3s |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0 | 2025-01-19 | Engineering | Complete documentation |
| 1.5 | 2024-11-15 | Design | Added mobile specs |
| 1.0 | 2024-09-01 | Product | Initial release |
