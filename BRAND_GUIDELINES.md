# SiteIntel™ Feasibility — Brand Guidelines Document

**Version 1.0 | BuildSmarter™ Creative Systems & Product Architecture Team**

---

## Table of Contents

1. [Brand Overview & Philosophy](#1-brand-overview--philosophy)
2. [Color System](#2-color-system)
3. [Typography System](#3-typography-system)
4. [Iconography & Illustration](#4-iconography--illustration)
5. [Imagery & Photography Direction](#5-imagery--photography-direction)
6. [Layout & Grid System](#6-layout--grid-system)
7. [Motion & Interaction Language](#7-motion--interaction-language)
8. [Tone of Voice & Messaging](#8-tone-of-voice--messaging)
9. [Implementation Guide](#9-implementation-guide)
10. [Component Mapping](#10-component-mapping)

---

## 1. Brand Overview & Philosophy

### Vision
SiteIntel™ Feasibility transforms commercial real estate feasibility and due diligence into an instant, data-driven intelligence experience. It bridges authoritative GIS data with AI clarity—delivering truth, speed, and transparency.

### Mission Statement
To make land-use, infrastructure, and environmental intelligence universally accessible, lender-ready, and verifiable within minutes.

### Brand Essence
**Precision. Proof. Possibility.**

### Tone Personality

| Attribute | Description |
|-----------|-------------|
| Analytical | Not abstract |
| Confident | Never boastful |
| Human | Clear in clarity, scientific in structure |
| Data-backed | Lender-trusted |

### Voice Principles

- **Credible**: Speak with evidence and confidence
- **Efficient**: Use clear, short sentences and active verbs
- **Informed**: Reference data, not hype
- **Human**: Explain like an expert guiding a client, not a machine quoting code

---

## 2. Color System

### Primary Palette

| Role | Color Name | HEX | HSL | Usage |
|------|------------|-----|-----|-------|
| Primary Action | Feasibility Orange | `#FF7A00` | `28 100% 50%` | Primary action, highlights, CTAs |
| Primary Text/BG | Midnight Blue | `#0A0F2C` | `229 64% 11%` | Primary text, dark backgrounds |
| Secondary Text | Slate Gray | `#374151` | `218 14% 27%` | Secondary text, labels |
| Background | Cloud White | `#F9FAFB` | `210 20% 98%` | Light backgrounds |
| Accent | Data Cyan | `#06B6D4` | `189 94% 43%` | Links, accents, data highlights |

### Secondary Palette

| Role | Color Name | HEX | HSL |
|------|------------|-----|-----|
| Success | Success Green | `#10B981` | `158 64% 40%` |
| Warning | Warning Amber | `#F59E0B` | `43 96% 50%` |
| Error | Error Red | `#EF4444` | `0 84% 60%` |
| Neutral Border | Border Gray | `#E5E7EB` | `216 12% 91%` |

### Dark Mode Adjustments

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | `#F9FAFB` | `#0A0F2C` |
| Body Text | `#0A0F2C` | `#F9FAFB` |
| Callouts | Feasibility Orange | Feasibility Orange |
| Data Overlays | Data Cyan | Data Cyan |

### Color Rationale
The palette communicates technical confidence and clarity under pressure—mirroring SiteIntel's core promise of verified insight.

---

## 3. Typography System

### Primary Typeface
**IBM Plex Sans** — chosen for its engineering precision and accessibility across web and PDF systems.

### Typography Hierarchy

| Style | Size (px/line-height) | Weight | Usage |
|-------|----------------------|--------|-------|
| H1 | 48/56 | 600 (Semibold) | Hero headlines |
| H2 | 32/40 | 600 (Semibold) | Section titles |
| H3 | 24/32 | 500 (Medium) | Subheadings |
| Body L | 18/28 | 400 (Regular) | Reports, UI text |
| Body S | 14/22 | 400 (Regular) | Tables, labels, captions |

### Monospace Option
**IBM Plex Mono** — for dataset references, API endpoints, and code blocks.

### Usage Guidelines

- Always left-align body copy
- Use consistent line spacing for readability
- Avoid decorative fonts or excessive capitalization
- Minimum text size: 14px for accessibility

---

## 4. Iconography & Illustration

### Icon Style
- **Type**: Outline-based, geometric icons
- **Stroke Width**: 1.5px consistent
- **Corners**: Rounded for approachability
- **Fills**: No heavy fills

### Icon Library
**Lucide React** — Primary icon library with custom SiteIntel line icons for proprietary categories.

### Theme Categories

| Category | Icons | Usage |
|----------|-------|-------|
| Data/Layers | Grid, network, AI node | Data visualization |
| Analysis/Validation | Checkmarks, document, radar | Verification states |
| Geospatial | Pin, map outline, parcel boundary | Location features |
| Navigation | Search, download, filter, gear | System navigation |

### Custom Icons
Proprietary categories requiring custom icons:
- Floodplain Layer
- Utility Access
- Zoning Overlay
- Parcel Boundary

### Illustration Style
- Minimal, isometric outlines
- Cyan and orange highlights
- Soft shadows (`#000000`, 10% opacity)

---

## 5. Imagery & Photography Direction

### Mood
Bright, factual, and forward-looking. Capture infrastructure, data overlays, and aerial perspectives.

### Subject Focus

✅ **Do Use**:
- Cityscapes with visible grids or parcel geometry
- Maps, screens, or architectural data interfaces
- Developers and professionals analyzing plans
- Aerial property views
- Infrastructure overlays

❌ **Avoid**:
- Stock clichés (handshakes, abstract 3D "AI brains")
- Posed models
- Generic office scenes

### Lighting & Treatment

- Natural daylight; avoid filters
- Apply subtle cyan overlay gradient for brand coherence
- Maintain high contrast and clarity
- Use imagery that feels real, geospatial, and verifiable

---

## 6. Layout & Grid System

### Core Grid
12-column system with responsive breakpoints.

| Element | Value |
|---------|-------|
| Columns | 12 |
| Gutters | 80px |
| Margins | 160px |
| Internal Padding | 32px |

### Responsive Breakpoints

| Device | Columns | Margin | Max Width |
|--------|---------|--------|-----------|
| Desktop ≥1440px | 12 | 160px | 1120px |
| Tablet ≤1024px | 8 | 80px | 864px |
| Mobile ≤768px | 4 | 40px | 640px |

### Spacing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Icon offsets |
| `--space-sm` | 8px | Small gaps |
| `--space-md` | 16px | Card padding |
| `--space-lg` | 32px | Section spacing |
| `--space-xl` | 48px | Large section gaps |
| `--space-2xl` | 64px | Hero spacing |

### Layout Rationale
All layouts are modular and data-first, allowing for information density without visual clutter. Consistency reinforces credibility.

---

## 7. Motion & Interaction Language

### Philosophy
**Motion should inform, not entertain.** Every animation must communicate state change, not personality.

### Timing & Easing

| Element | Duration | Easing |
|---------|----------|--------|
| Modal open/close | 250ms | ease-in-out |
| Progress bar advance | 100ms/5% | linear |
| Tab switch | 180ms | ease-out |
| Map overlay toggle | 300ms | ease-in |
| Fade transitions | 300ms | ease-out |
| Scale animations | 200ms | ease-out |

### Motion Rules

1. Avoid looping or bouncing animations
2. Fade, scale, or slide only in one axis
3. Ensure motion is under 400ms for responsiveness
4. Include `prefers-reduced-motion` media query compliance
5. No decorative animations that don't convey information

### Standard Keyframes

```css
/* Fade In */
@keyframes fade-in {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* Scale In */
@keyframes scale-in {
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* Slide In Right */
@keyframes slide-in-right {
  0% { transform: translateX(100%); }
  100% { transform: translateX(0); }
}
```

---

## 8. Tone of Voice & Messaging

### Core Tone Attributes

| Attribute | Description |
|-----------|-------------|
| Intelligent | Data-driven insights, not generic claims |
| Precise | Specific numbers, verified sources |
| Trustworthy | Cite sources, show proof |
| Clear | No jargon without explanation |

### Messaging Framework

| Context | Tone | Example |
|---------|------|---------|
| Headlines | Bold, benefit-focused | "From $10K to $795. From 3 weeks to 10 minutes." |
| Body Copy | Informative, concise | "All data sourced from FEMA, ArcGIS, EPA—no guesses." |
| CTAs | Action-oriented, specific | "Run Free QuickCheck" not "Learn More" |
| Error States | Helpful, non-blaming | "We couldn't find that address. Try a different format." |

### Key Messages

1. **Speed**: "Feasibility in 60 seconds, not 3 weeks"
2. **Accuracy**: "Verified data from FEMA, ArcGIS, TxDOT, EPA"
3. **Trust**: "Lender-ready reports with full citations"
4. **Value**: "90% cost reduction vs traditional consultants"

---

## 9. Implementation Guide

### Tailwind CSS Token Mapping

```typescript
// tailwind.config.ts
colors: {
  // Brand Primary
  primary: {
    DEFAULT: "hsl(var(--primary))",           // Feasibility Orange
    foreground: "hsl(var(--primary-foreground))",
  },
  
  // Brand Secondary
  secondary: {
    DEFAULT: "hsl(var(--secondary))",         // Midnight Blue
    foreground: "hsl(var(--secondary-foreground))",
  },
  
  // Brand Accent
  accent: {
    DEFAULT: "hsl(var(--accent))",            // Data Cyan
    foreground: "hsl(var(--accent-foreground))",
  },
  
  // Semantic Colors
  background: "hsl(var(--background))",       // Cloud White
  foreground: "hsl(var(--foreground))",       // Midnight Blue
  muted: {
    DEFAULT: "hsl(var(--muted))",
    foreground: "hsl(var(--muted-foreground))",
  },
  
  // Status Colors
  destructive: {
    DEFAULT: "hsl(var(--destructive))",       // Error Red
    foreground: "hsl(var(--destructive-foreground))",
  },
}
```

### CSS Variables (index.css)

```css
:root {
  /* Brand Colors */
  --primary: 28 100% 50%;           /* Feasibility Orange #FF7A00 */
  --primary-foreground: 0 0% 100%;  /* White text on orange */
  
  --secondary: 229 64% 11%;         /* Midnight Blue #0A0F2C */
  --secondary-foreground: 0 0% 100%;
  
  --accent: 189 94% 43%;            /* Data Cyan #06B6D4 */
  --accent-foreground: 229 64% 11%;
  
  /* Backgrounds */
  --background: 210 20% 98%;        /* Cloud White #F9FAFB */
  --foreground: 229 64% 11%;        /* Midnight Blue */
  
  /* Muted */
  --muted: 218 14% 27%;             /* Slate Gray #374151 */
  --muted-foreground: 210 20% 98%;
  
  /* Status */
  --destructive: 0 84% 60%;         /* Error Red #EF4444 */
  --success: 158 64% 40%;           /* Success Green #10B981 */
  --warning: 43 96% 50%;            /* Warning Amber #F59E0B */
  
  /* Layout */
  --radius: 0.75rem;                /* 12px border radius */
}

.dark {
  --background: 229 64% 11%;        /* Midnight Blue */
  --foreground: 210 20% 98%;        /* Cloud White */
}
```

### Shadcn Component Usage

```tsx
// ✅ CORRECT - Using semantic tokens
<Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
  Run QuickCheck →
</Button>

// ❌ WRONG - Direct color values
<Button className="bg-[#FF7A00] text-white">
  Run QuickCheck →
</Button>

// ✅ CORRECT - Using design system
<Card className="bg-card border-border shadow-lg">
  <CardHeader>
    <CardTitle className="text-foreground">Title</CardTitle>
    <CardDescription className="text-muted-foreground">Description</CardDescription>
  </CardHeader>
</Card>
```

### Accessibility Standards

| Requirement | Standard | Implementation |
|-------------|----------|----------------|
| Color Contrast | WCAG 2.1 AA | Minimum 4.5:1 for text |
| Minimum Text Size | 14px | Never smaller for body text |
| Keyboard Navigation | Full support | All interactive elements focusable |
| Screen Readers | ARIA labels | All images, icons, interactive elements |
| Reduced Motion | Media query | `@media (prefers-reduced-motion: reduce)` |
| Focus Indicators | Visible | 2px solid outline on focus |

---

## 10. Component Mapping

### Section to Component Map

| Section | React Component Path | Shadcn Components |
|---------|---------------------|-------------------|
| Hero | `src/components/sections/Hero.tsx` | Button, Badge |
| Trust Badges | `src/components/sections/AuthorityBadges.tsx` | Badge, Tooltip |
| Problem | `src/components/sections/Problem.tsx` | Card |
| Solution | `src/components/sections/Solution.tsx` | Card, Badge |
| Process | `src/components/sections/InteractiveProcess.tsx` | Card, Progress |
| Pricing | `src/components/sections/PackagesPricing.tsx` | Card, Button, Badge |
| FAQ | `src/components/sections/FAQ.tsx` | Accordion |
| Footer | `src/components/sections/Footer.tsx` | — |

### Button Variants

| Variant | Usage | Tailwind Classes |
|---------|-------|------------------|
| `default` | Primary actions | `bg-primary text-primary-foreground` |
| `secondary` | Secondary actions | `bg-secondary text-secondary-foreground` |
| `outline` | Tertiary actions | `border border-input bg-background` |
| `ghost` | Subtle actions | `hover:bg-accent hover:text-accent-foreground` |
| `destructive` | Destructive actions | `bg-destructive text-destructive-foreground` |

### Card Styles

| Style | Usage | Implementation |
|-------|-------|----------------|
| Default | Standard content | `bg-card border-border` |
| Elevated | Featured content | `bg-card shadow-lg` |
| Glassmorphism | Hero overlays | `bg-background/80 backdrop-blur-sm border-border/50` |
| Highlight | CTAs, pricing | `border-primary bg-primary/5` |

---

## Quick Reference

### Brand Colors (Copy-Paste)

```
Feasibility Orange: #FF7A00 | hsl(28, 100%, 50%)
Midnight Blue:      #0A0F2C | hsl(229, 64%, 11%)
Slate Gray:         #374151 | hsl(218, 14%, 27%)
Cloud White:        #F9FAFB | hsl(210, 20%, 98%)
Data Cyan:          #06B6D4 | hsl(189, 94%, 43%)
Success Green:      #10B981 | hsl(158, 64%, 40%)
Warning Amber:      #F59E0B | hsl(43, 96%, 50%)
Error Red:          #EF4444 | hsl(0, 84%, 60%)
```

### Typography (Copy-Paste)

```
Primary Font:   IBM Plex Sans
Monospace Font: IBM Plex Mono
H1: 48px/56px, Semibold (600)
H2: 32px/40px, Semibold (600)
H3: 24px/32px, Medium (500)
Body L: 18px/28px, Regular (400)
Body S: 14px/22px, Regular (400)
```

### Spacing Scale (Copy-Paste)

```
xs:  4px  | 0.25rem
sm:  8px  | 0.5rem
md:  16px | 1rem
lg:  32px | 2rem
xl:  48px | 3rem
2xl: 64px | 4rem
```

---

*Document Version 1.0 — Last Updated: November 2024*
*For questions, contact the BuildSmarter™ Product Architecture Team*
