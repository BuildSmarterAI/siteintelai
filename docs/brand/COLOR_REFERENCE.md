# SiteIntel™ Complete Color Reference

> **Version:** 1.0  
> **Last Updated:** December 2024  
> **Source Files:** `src/index.css`, `tailwind.config.ts`, `src/lib/utilityLayerConfig.ts`

This document serves as the single source of truth for all colors used across the SiteIntel™ Feasibility platform.

---

## Table of Contents

1. [Brand Colors](#1-brand-colors)
2. [Semantic UI Colors](#2-semantic-ui-colors)
3. [Map Layer Colors](#3-map-layer-colors)
4. [Confidence & Status Colors](#4-confidence--status-colors)
5. [Module-Specific Colors](#5-module-specific-colors)
6. [UI Surface Colors](#6-ui-surface-colors)
7. [Gradients](#7-gradients)
8. [Dark Mode Adjustments](#8-dark-mode-adjustments)
9. [Usage Examples](#9-usage-examples)
10. [Accessibility Guidelines](#10-accessibility-guidelines)

---

## 1. Brand Colors

### Primary Palette

| Name | HEX | HSL | RGB | CSS Variable | Tailwind Class |
|------|-----|-----|-----|--------------|----------------|
| **Feasibility Orange** | `#FF7A00` | `29 100% 50%` | `255, 122, 0` | `--buildsmarter-orange` | `text-buildsmarter-orange` |
| **Midnight Blue** | `#0A0F2C` | `224 64% 11%` | `10, 15, 44` | `--buildsmarter-midnight` | `bg-buildsmarter-midnight` |
| **Slate Gray** | `#374151` | `218 14% 27%` | `55, 65, 81` | `--buildsmarter-slate` | `text-buildsmarter-slate` |
| **Cloud White** | `#F9FAFB` | `210 20% 98%` | `249, 250, 251` | `--buildsmarter-cloud` | `bg-buildsmarter-cloud` |
| **Data Cyan** | `#06B6D4` | `189 94% 43%` | `6, 182, 212` | `--buildsmarter-cyan` | `text-buildsmarter-cyan` |

### Secondary Palette

| Name | HEX | HSL | Usage |
|------|-----|-----|-------|
| **Success Green** | `#10B981` | `160 84% 39%` | Positive outcomes, PROCEED verdict |
| **Warning Amber** | `#F59E0B` | `38 92% 50%` | Caution states, CONDITIONAL verdict |
| **Error Red** | `#EF4444` | `0 84% 60%` | Errors, DO NOT PROCEED verdict |
| **Neutral Border** | `#E5E7EB` | `220 13% 91%` | Borders, dividers |

### Brand Color Relationships

```
Primary Action ────► Feasibility Orange (#FF7A00)
                     └── Used for CTAs, highlights, parcel outlines
                     
Dark Backgrounds ──► Midnight Blue (#0A0F2C)
                     └── Headers, footers, dark mode base
                     
Body Text ─────────► Slate Gray (#374151)
                     └── Secondary text, descriptions
                     
Light Backgrounds ─► Cloud White (#F9FAFB)
                     └── Cards, page backgrounds
                     
Data Accents ──────► Data Cyan (#06B6D4)
                     └── Links, data highlights, charts
```

---

## 2. Semantic UI Colors

### Status Colors

| Status | HEX | HSL | CSS Variable | Usage |
|--------|-----|-----|--------------|-------|
| **Success** | `#22C55E` | `142 71% 45%` | `--status-success` | Completed actions, positive states |
| **Warning** | `#F59E0B` | `38 92% 50%` | `--status-warning` | Caution, attention needed |
| **Error** | `#EF4444` | `0 84% 60%` | `--status-error` | Failures, critical issues |
| **Info** | `#0EA5E9` | `199 89% 48%` | `--status-info` | Informational messages |
| **Pending** | `#3B82F6` | `217 91% 60%` | `--status-pending` | Processing, loading |

### Verdict Colors

| Verdict | HEX | HSL | Background | Usage |
|---------|-----|-----|------------|-------|
| **PROCEED** | `#22C55E` | `142 71% 45%` | `hsl(142 71% 45% / 0.1)` | Favorable feasibility |
| **CONDITIONAL** | `#F59E0B` | `38 92% 50%` | `hsl(38 92% 50% / 0.1)` | Proceed with considerations |
| **DO NOT PROCEED** | `#EF4444` | `0 84% 60%` | `hsl(0 84% 60% / 0.1)` | Unfavorable feasibility |

### Semantic Token Mapping

```css
/* Primary semantic tokens */
--primary: 29 100% 50%;           /* Feasibility Orange */
--primary-foreground: 0 0% 100%;   /* White text on primary */

--secondary: 224 64% 11%;          /* Midnight Blue */
--secondary-foreground: 0 0% 100%; /* White text on secondary */

--accent: 189 94% 43%;             /* Data Cyan */
--accent-foreground: 0 0% 100%;    /* White text on accent */

--destructive: 0 84% 60%;          /* Error Red */
--destructive-foreground: 0 0% 100%;

--muted: 240 4.8% 95.9%;           /* Light gray */
--muted-foreground: 240 3.8% 46.1%; /* Gray text */
```

---

## 3. Map Layer Colors

### Parcel Colors

| Layer | HEX | HSL | Opacity | Usage |
|-------|-----|-----|---------|-------|
| **Subject Parcel** | `#FF7A00` | `29 100% 50%` | 100% stroke, 20% fill | Selected/analyzed parcel |
| **Other Parcels** | `#64748B` | `215 16% 47%` | 80% stroke, 10% fill | Context parcels |
| **Parcel Hover** | `#F97316` | `25 95% 53%` | 100% | Hover state |
| **Parcel Selected** | `#EA580C` | `21 90% 48%` | 100% | Click/selection state |

### Utility Infrastructure Colors

| Utility Type | HEX | HSL | Line Style | Source |
|--------------|-----|-----|------------|--------|
| **Water Mains** | `#1F6AE1` | `217 78% 50%` | Solid | `utilityLayerConfig.ts` |
| **Sewer Lines** | `#7A4A2E` | `26 47% 33%` | Dashed `[6, 4]` | PRD §6.1 |
| **Sewer Force Mains** | `#5C3A24` | `26 43% 25%` | Dotted `[2, 2]` | PRD §6.1 |
| **Stormwater** | `#1C7C7C` | `180 63% 30%` | Dashed `[8, 3]` | PRD §6.1 |
| **Gas Lines** | `#F59E0B` | `38 92% 50%` | Solid | Standard |
| **Electric Lines** | `#FBBF24` | `45 93% 56%` | Solid | Standard |

### Utility Point Colors

| Point Type | HEX | Shape | Size | Stroke |
|------------|-----|-------|------|--------|
| **Sewer Manhole** | `#7A4A2E` | Circle | 8px | White 1.5px |
| **Storm Inlet** | `#1C7C7C` | Square | 7px | White 1.5px |
| **Lift Station** | `#7A4A2E` | Diamond | 10px | White 2px |
| **Water Valve** | `#1F6AE1` | Circle | 6px | White 1px |
| **Pump Station** | `#1F6AE1` | Triangle | 10px | White 2px |
| **Outfall** | `#1C7C7C` | Triangle | 9px | White 1.5px |

### Flood Zone Colors

| Zone | HEX | HSL | Opacity | Risk Level |
|------|-----|-----|---------|------------|
| **Zone AE** | `#EF4444` | `0 84% 60%` | 40% fill | High Risk (100-yr) |
| **Zone VE** | `#DC2626` | `0 72% 51%` | 50% fill | Coastal High Risk |
| **Floodway** | `#DC2626` | `0 72% 51%` | 60% fill | Regulatory Floodway |
| **Zone X (0.2%)** | `#F59E0B` | `38 92% 50%` | 30% fill | Moderate Risk (500-yr) |
| **Zone X (Minimal)** | `#22C55E` | `142 71% 45%` | 20% fill | Minimal Risk |

### Environmental Colors

| Layer | HEX | HSL | Pattern | Usage |
|-------|-----|-----|---------|-------|
| **Wetlands** | `#0D9488` | `175 84% 32%` | Hatched | NWI wetlands overlay |
| **Wetlands Border** | `#115E59` | `175 68% 22%` | Solid 2px | Wetland boundaries |
| **EPA Sites** | `#7C3AED` | `263 70% 58%` | Point marker | ECHO facilities |
| **Brownfields** | `#A16207` | `43 90% 33%` | Polygon | Known contamination |

### Zoning Colors

| Zone Type | HEX | HSL | Usage |
|-----------|-----|-----|-------|
| **Residential** | `#FDE68A` | `48 96% 77%` | R-1, R-2, R-3 zones |
| **Commercial** | `#93C5FD` | `213 97% 78%` | C-1, C-2, C-3 zones |
| **Industrial** | `#C4B5FD` | `250 95% 85%` | I-1, I-2 zones |
| **Mixed Use** | `#FCA5A5` | `0 94% 82%` | MU, PUD zones |
| **Agricultural** | `#BBF7D0` | `142 76% 86%` | AG, Rural zones |

### Transportation Colors

| Layer | HEX | HSL | Line Width | Usage |
|-------|-----|-----|------------|-------|
| **AADT Segments** | `#F59E0B` | `38 92% 50%` | Variable by zoom | Traffic count lines |
| **Highways** | `#1E40AF` | `224 64% 40%` | 3-5px | Interstate/US highways |
| **Major Roads** | `#3B82F6` | `217 91% 60%` | 2-3px | State/county roads |
| **Local Roads** | `#94A3B8` | `215 16% 65%` | 1-2px | Local streets |

---

## 4. Confidence & Status Colors

### Confidence Badge Colors

| Level | Background | Text | Border | Icon |
|-------|------------|------|--------|------|
| **High** | `hsl(142 71% 45% / 0.15)` | `#15803D` | `#22C55E` | ✓ Check |
| **Medium** | `hsl(38 92% 50% / 0.15)` | `#A16207` | `#F59E0B` | ⚠ Warning |
| **Low** | `hsl(0 84% 60% / 0.15)` | `#DC2626` | `#EF4444` | ✗ X Mark |

### Data Freshness Indicators

| Freshness | HEX | Usage |
|-----------|-----|-------|
| **Fresh (< 30 days)** | `#22C55E` | Recently updated data |
| **Stale (30-90 days)** | `#F59E0B` | Data may need refresh |
| **Outdated (> 90 days)** | `#EF4444` | Recommend re-fetch |

---

## 5. Module-Specific Colors

### Hospitality Intelligence (HII) Module

| Activity Level | HEX | HSL | CSS Variable | Usage |
|----------------|-----|-----|--------------|-------|
| **High Activity** | `#15803D` | `142 61% 25%` | `--hii-high` | Strong market indicators |
| **Medium Activity** | `#FACC15` | `48 97% 53%` | `--hii-medium` | Moderate activity |
| **Low Activity** | `#DC2626` | `0 72% 51%` | `--hii-low` | Weak market signals |

### Intent Theme Colors

| Intent | Primary | Secondary | Accent |
|--------|---------|-----------|--------|
| **Build** | `#0A0F2C` | `#FF7A00` | `#06B6D4` |
| **Buy** | `#06B6D4` | `#0A0F2C` | `#FF7A00` |

### Kill Factor Colors

| Severity | HEX | Background | Usage |
|----------|-----|------------|-------|
| **Critical** | `#DC2626` | `hsl(0 72% 51% / 0.1)` | Absolute blockers |
| **Major** | `#EA580C` | `hsl(21 90% 48% / 0.1)` | Significant issues |
| **Minor** | `#CA8A04` | `hsl(46 97% 40% / 0.1)` | Considerations |

---

## 6. UI Surface Colors

### Light Mode

| Surface | HEX | HSL | CSS Variable | Usage |
|---------|-----|-----|--------------|-------|
| **Background** | `#FCFCFD` | `240 20% 99%` | `--background` | Page background |
| **Foreground** | `#0A0F2C` | `224 64% 11%` | `--foreground` | Primary text |
| **Card** | `#FFFFFF` | `0 0% 100%` | `--card` | Card backgrounds |
| **Card Foreground** | `#0A0F2C` | `224 64% 11%` | `--card-foreground` | Card text |
| **Muted** | `#F4F4F5` | `240 5% 96%` | `--muted` | Subtle backgrounds |
| **Muted Foreground** | `#71717A` | `240 4% 46%` | `--muted-foreground` | Secondary text |
| **Border** | `#E4E4E7` | `240 6% 90%` | `--border` | Borders, dividers |
| **Input** | `#E4E4E7` | `240 6% 90%` | `--input` | Input borders |
| **Ring** | `#FF7A00` | `29 100% 50%` | `--ring` | Focus rings |

### Popover & Dropdown

| Element | HEX | HSL | Usage |
|---------|-----|-----|-------|
| **Popover** | `#FFFFFF` | `0 0% 100%` | Dropdown backgrounds |
| **Popover Foreground** | `#0A0F2C` | `224 64% 11%` | Dropdown text |

### Sidebar Colors

| Element | HSL Value | Usage |
|---------|-----------|-------|
| **Sidebar Background** | `224 64% 11%` | Dark sidebar base |
| **Sidebar Foreground** | `210 20% 98%` | Sidebar text |
| **Sidebar Primary** | `29 100% 50%` | Active items |
| **Sidebar Accent** | `224 50% 18%` | Hover states |
| **Sidebar Border** | `224 50% 20%` | Sidebar dividers |

---

## 7. Gradients

### Primary Gradients

```css
/* Hero Gradient - Radial */
--gradient-hero: radial-gradient(
  ellipse 80% 50% at 50% -20%,
  hsl(29 100% 50% / 0.15) 0%,
  transparent 70%
);

/* Primary Linear Gradient */
--gradient-primary: linear-gradient(
  135deg,
  hsl(29 100% 50%) 0%,
  hsl(21 90% 48%) 100%
);

/* Midnight Gradient */
--gradient-midnight: linear-gradient(
  to bottom,
  hsl(224 64% 11%) 0%,
  hsl(224 64% 8%) 100%
);

/* Cyan Accent Gradient */
--gradient-cyan: linear-gradient(
  90deg,
  hsl(189 94% 43%) 0%,
  hsl(189 94% 53%) 100%
);
```

### Surface Gradients

```css
/* Glass Effect */
--gradient-glass: linear-gradient(
  135deg,
  hsl(0 0% 100% / 0.1) 0%,
  hsl(0 0% 100% / 0.05) 100%
);

/* Subtle Card Gradient */
--gradient-card: linear-gradient(
  180deg,
  hsl(0 0% 100%) 0%,
  hsl(240 5% 98%) 100%
);

/* Mesh Background */
--gradient-mesh: radial-gradient(
  at 40% 20%,
  hsl(29 100% 50% / 0.05) 0px,
  transparent 50%
),
radial-gradient(
  at 80% 80%,
  hsl(189 94% 43% / 0.05) 0px,
  transparent 50%
);
```

### Status Gradients

```css
/* Success Gradient */
--gradient-success: linear-gradient(
  90deg,
  hsl(142 71% 45%) 0%,
  hsl(142 71% 55%) 100%
);

/* Warning Gradient */
--gradient-warning: linear-gradient(
  90deg,
  hsl(38 92% 50%) 0%,
  hsl(38 92% 60%) 100%
);

/* Error Gradient */
--gradient-error: linear-gradient(
  90deg,
  hsl(0 84% 60%) 0%,
  hsl(0 84% 70%) 100%
);
```

---

## 8. Dark Mode Adjustments

### Surface Colors (Dark Mode)

| Element | Light Mode HSL | Dark Mode HSL | Notes |
|---------|----------------|---------------|-------|
| Background | `240 20% 99%` | `224 64% 6%` | Near-black base |
| Foreground | `224 64% 11%` | `210 20% 98%` | Inverted text |
| Card | `0 0% 100%` | `224 50% 10%` | Dark card surface |
| Muted | `240 5% 96%` | `224 50% 14%` | Subtle dark bg |
| Muted Foreground | `240 4% 46%` | `240 5% 65%` | Lighter gray text |
| Border | `240 6% 90%` | `224 50% 18%` | Visible in dark |

### Map Adjustments (Dark Mode)

| Layer | Light Opacity | Dark Opacity | Dark Stroke Adjustment |
|-------|---------------|--------------|------------------------|
| Parcel Fill | 20% | 30% | +1px stroke width |
| Flood Zones | 40% | 50% | Slight lightening |
| Wetlands | 35% | 45% | +10% saturation |
| Utilities | 100% | 100% | No change |

### Text Contrast (Dark Mode)

| Text Type | Light Color | Dark Color | Contrast Ratio |
|-----------|-------------|------------|----------------|
| Primary | `#0A0F2C` | `#F9FAFB` | 16:1 |
| Secondary | `#374151` | `#D1D5DB` | 10:1 |
| Muted | `#71717A` | `#A1A1AA` | 5:1 |
| Link | `#06B6D4` | `#22D3EE` | 4.5:1 |

---

## 9. Usage Examples

### React/Tailwind Usage

```tsx
// Brand Colors
<div className="bg-buildsmarter-midnight text-buildsmarter-cloud">
  <h1 className="text-buildsmarter-orange">SiteIntel™</h1>
</div>

// Semantic Colors
<Button className="bg-primary text-primary-foreground">
  Run Feasibility Check
</Button>

// Status Colors
<Badge className="bg-status-success/10 text-status-success border-status-success">
  PROCEED
</Badge>

// Map Layer Colors (via config)
import { UTILITY_COLORS } from '@/lib/utilityLayerConfig';
const waterColor = UTILITY_COLORS.water; // #1F6AE1
```

### CSS Variable Usage

```css
/* Using CSS variables directly */
.hero-section {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}

.cta-button {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.cta-button:hover {
  background: hsl(var(--primary) / 0.9);
}

/* Gradient usage */
.hero-bg {
  background: var(--gradient-hero);
}
```

### MapLibre Paint Properties

```typescript
// Parcel layer styling
{
  'fill-color': '#FF7A00',
  'fill-opacity': 0.2,
  'line-color': '#FF7A00',
  'line-width': 2
}

// Flood zone styling
{
  'fill-color': [
    'match', ['get', 'FLD_ZONE'],
    'AE', '#EF4444',
    'VE', '#DC2626',
    'X', '#22C55E',
    '#94A3B8' // default
  ],
  'fill-opacity': 0.4
}

// Utility lines (from utilityLayerConfig.ts)
{
  'line-color': UTILITY_COLORS.water,
  'line-width': LINE_WIDTH_BY_ZOOM,
  'line-dasharray': [1] // solid
}
```

---

## 10. Accessibility Guidelines

### Contrast Requirements (WCAG 2.1 AA)

| Text Size | Minimum Ratio | SiteIntel™ Compliance |
|-----------|---------------|----------------------|
| Normal Text (< 18px) | 4.5:1 | ✅ Primary: 16:1 |
| Large Text (≥ 18px bold) | 3:1 | ✅ All headings pass |
| UI Components | 3:1 | ✅ Buttons, inputs pass |

### Color Blindness Considerations

| Palette Issue | Solution |
|---------------|----------|
| Red-Green (Deuteranopia) | Add icons to status colors (✓ ⚠ ✗) |
| Red-Green (Protanopia) | Use orange/blue instead of red/green for critical |
| Blue-Yellow (Tritanopia) | Avoid blue/yellow only distinctions |

### Recommended Pairings

```
✅ GOOD: #FF7A00 on #0A0F2C (11.5:1)
✅ GOOD: #0A0F2C on #F9FAFB (16:1)
✅ GOOD: #FFFFFF on #FF7A00 (4.6:1)
⚠️ CAUTION: #06B6D4 on #FFFFFF (3.1:1) - Large text only
❌ AVOID: #F59E0B on #FFFFFF (2.4:1) - Use darker variant
```

### Focus State Colors

```css
/* Focus ring - always visible */
.focus-ring {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* High contrast focus for inputs */
input:focus {
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 3px hsl(var(--primary) / 0.2);
}
```

---

## Quick Reference Cards

### Brand Palette

```
┌─────────────────────────────────────────────────────┐
│  SITEINTEL™ BRAND COLORS                            │
├─────────────────────────────────────────────────────┤
│  ██████  Feasibility Orange  #FF7A00                │
│  ██████  Midnight Blue       #0A0F2C                │
│  ██████  Slate Gray          #374151                │
│  ██████  Cloud White         #F9FAFB                │
│  ██████  Data Cyan           #06B6D4                │
└─────────────────────────────────────────────────────┘
```

### Status Palette

```
┌─────────────────────────────────────────────────────┐
│  STATUS COLORS                                       │
├─────────────────────────────────────────────────────┤
│  ██████  Success   #22C55E  (PROCEED)               │
│  ██████  Warning   #F59E0B  (CONDITIONAL)           │
│  ██████  Error     #EF4444  (DO NOT PROCEED)        │
│  ██████  Info      #0EA5E9                          │
│  ██████  Pending   #3B82F6                          │
└─────────────────────────────────────────────────────┘
```

### Utility Palette

```
┌─────────────────────────────────────────────────────┐
│  UTILITY INFRASTRUCTURE COLORS                       │
├─────────────────────────────────────────────────────┤
│  ██████  Water         #1F6AE1  ───────             │
│  ██████  Sewer         #7A4A2E  ─ ─ ─ ─             │
│  ██████  Stormwater    #1C7C7C  ── ── ──            │
│  ██████  Gas           #F59E0B  ───────             │
│  ██████  Electric      #FBBF24  ───────             │
└─────────────────────────────────────────────────────┘
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2024 | Initial color reference document |

---

*This document is maintained by the SiteIntel™ Design System team. For questions or updates, refer to the source files in `src/index.css` and `tailwind.config.ts`.*
