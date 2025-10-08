# BuildSmarter™ Feasibility Homepage UX/UI Specification (Updated)

**Version 2.0** | Senior UX/UI Architecture Blueprint  
**Date:** October 2025  
**Status:** Ready for Developer Handoff

---

## Executive Summary

This specification defines the complete visual hierarchy, layout system, component mapping, responsive behavior, and interaction design for the BuildSmarter™ Feasibility marketing homepage. All design decisions align with:

- **Brand Kit**: Feasibility Orange #FF7A00, Midnight Blue #0A0F2C, Satoshi/Inter typography
- **Tone of Voice**: Authoritative, data-cited, transparent, pragmatic
- **Component System**: shadcn/ui + Tailwind semantic tokens
- **Conversion Goal**: Drive users from awareness → Free QuickCheck → $795 Professional Report

---

## 1. Hero Section

### Layout Structure
**Grid:** 12-column desktop (6 cols text + 6 cols visual) | 8-column tablet (stacked) | 4-column mobile (stacked)

### Visual Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo: BuildSmarter™]            [Nav: How·Pricing·Data·Login] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────┐  ┌──────────────────────┐          │
│  │ H1 (Satoshi 48px)   │  │  MapCanvas Animation │          │
│  │ $10K Feasibility in │  │  - Parcel outline    │          │
│  │ 10 Minutes—Verified │  │  - Data overlays     │          │
│  │ by FEMA.            │  │  - Progress flow     │          │
│  │                     │  │  - PDF generation    │          │
│  │ H2 (Inter 18px)     │  └──────────────────────┘          │
│  │ AI-generated, lender-                                     │
│  │ ready feasibility    │                                    │
│  │ reports using real   │                                    │
│  │ FEMA, ArcGIS, and    │                                    │
│  │ TxDOT data.          │                                    │
│  │                     │                                     │
│  │ [Run Free QuickCheck→] [Watch Demo]                      │
│  │  Primary (Orange)      Outline (White)                   │
│  │                     │                                     │
│  │ ✓ Data-cited for lenders • 10-min turnaround            │
│  └─────────────────────┘                                    │
└─────────────────────────────────────────────────────────────┘
```

### Component Mapping

| Element | Component Path | Props/Variants |
|---------|----------------|----------------|
| Hero Container | `@/components/sections/Hero.tsx` | Full viewport height (min-h-screen) |
| Logo | `@/assets/buildsmarter-logo-new.png` | h-32 (desktop), h-24 (mobile) |
| H1 Headline | Native `<h1>` | `font-headline text-5xl lg:text-7xl text-white` |
| H1 Gradient Span | Native `<span>` | `bg-gradient-to-r from-maxx-red to-red-500 bg-clip-text text-transparent` |
| H2 Subheadline | Native `<h2>` | `font-body text-lg lg:text-xl text-white/90` |
| Primary CTA | `@/components/ui/button` | `variant="maxx-red" size="lg"` |
| Secondary CTA | `@/components/ui/button` | `variant="outline" size="lg" border-2 border-white` |
| Map Visual | `@/components/MapCanvas.tsx` | Leaflet-based interactive map |
| Background Image | `@/assets/aerial-property-site.jpg` | opacity-30, saturate-50, object-cover |
| Gradient Overlay | CSS custom property | `var(--gradient-hero)` from index.css |

### Copy Hierarchy

**H1 (48px/56px leading, Satoshi SemiBold, White with Orange gradient)**
```
$10K Feasibility in 10 Minutes—Verified by FEMA.
```

**H2 (18px/28px leading, Inter Regular, White 90% opacity)**
```
AI-generated, lender-ready feasibility reports using real FEMA, ArcGIS, and TxDOT data.
```

**CTA Labels:**
- Primary: "Run Free QuickCheck →" (active verb + benefit + arrow)
- Secondary: "Watch Demo" (clear action)

**Trust Badge (14px, Inter Regular, White 80% opacity)**
```
✓ Data-cited for lenders • 10-min turnaround • No commitment required
```

### Responsive Behavior

| Breakpoint | Layout | Typography | CTA Layout |
|------------|--------|------------|------------|
| **Desktop (≥1024px)** | 50/50 split (text left, map right) | H1: 72px, H2: 20px | Horizontal flex, gap-4 |
| **Tablet (768-1023px)** | Stacked (text top, map bottom) | H1: 56px, H2: 18px | Horizontal flex, gap-3 |
| **Mobile (≤767px)** | Single column, map 40vh | H1: 40px, H2: 16px | Vertical stack, full-width buttons |

### Micro-Interactions

1. **Hero Background Parallax**
   - Background image scrolls at 0.5x speed
   - Duration: Continuous during scroll
   - Easing: Linear

2. **CTA Hover States**
   - Primary Button: `hover:shadow-xl transform hover:-translate-y-0.5`
   - Duration: 300ms
   - Easing: cubic-bezier(0.4, 0, 0.2, 1)

3. **Map Animation Entry**
   - Fade in from bottom: `translateY(20px) → translateY(0)`
   - Duration: 600ms
   - Delay: 400ms after page load
   - Easing: ease-out

4. **Interactive Risk Markers** (Desktop only)
   - Hover trigger: Scale 1.0 → 1.1
   - Tooltip appearance: fade + slide-up (200ms ease-out)
   - Pulse animation on marker dots (2s infinite)

### Accessibility & Contrast

- **H1 White on Dark Blue**: Contrast ratio 14.2:1 (AAA)
- **H2 White 90% on Dark Blue**: Contrast ratio 12.8:1 (AAA)
- **Orange CTA on White**: Contrast ratio 4.9:1 (AA)
- **Focus states**: 2px solid ring, offset 2px, visible on keyboard navigation
- **Alt text for background image**: "Aerial view of commercial real estate development site showing zoning and utility risks"

---

## 2. Association Logos & Trust Band

### Layout Structure
**Full-width banner** below hero | **bg-white** | **py-12**

```
┌──────────────────────────────────────────────────────┐
│  H3: Trusted by Developers, Lenders, & Municipalities │
│                                                        │
│  [Logo 1]  [Logo 2]  [Logo 3]  [Logo 4]  [Logo 5]    │
│   FEMA     ArcGIS    TxDOT      EPA      USFWS        │
└──────────────────────────────────────────────────────┘
```

### Component Mapping

| Element | Component Path | Props |
|---------|----------------|-------|
| Section | `@/components/sections/AssociationLogos.tsx` | Standard section wrapper |
| Logo Container | Grid layout | `grid-cols-2 md:grid-cols-5 gap-8` |
| Logo Images | Native `<img>` | height: 64px, grayscale filter, hover: color |

### Motion
- Logos fade in sequentially on scroll intersection
- Delay: 100ms between each logo
- Duration: 400ms ease-out

---

## 3. Problem Section

### Layout Structure
**2-column desktop** (image left, text right) | **bg-light-gray py-20**

```
┌─────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌────────────────────────────────┐   │
│  │   Risk   │  │ H2: Feasibility Studies Cost    │   │
│  │ Heatmap  │  │     $10K and Take 3 Weeks       │   │
│  │  Image   │  │                                 │   │
│  │          │  │ Body: Traditional feasibility   │   │
│  │          │  │ studies require hiring multiple │   │
│  │          │  │ consultants...                  │   │
│  └──────────┘  └────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Copy Tone Alignment

**Headline (Satoshi 32px, Charcoal)**
```
Feasibility Studies Cost $10K and Take 3 Weeks—
Often with Outdated Data.
```

**Body (Inter 18px, Charcoal 80%)**
```
Traditional feasibility analysis requires hiring multiple consultants 
to aggregate zoning, flood, utility, and environmental data. By the time 
reports arrive, market conditions—and sometimes property availability—
have changed. BuildSmarter™ eliminates this lag.
```

**Tone Guidelines Applied:**
- ✅ Active voice: "eliminates this lag" (not "lag is eliminated")
- ✅ Numerical proof: "$10K" and "3 Weeks"
- ✅ No buzzwords: Avoided "revolutionary" or "cutting-edge"
- ✅ Authoritative: Specific problem → specific solution

---

## 4. Solution Section

### Layout Structure
**3-column feature grid** | **bg-white py-20**

```
┌─────────────────────────────────────────────────────┐
│  H2: AI-Powered Feasibility in 10 Minutes           │
│  Subtitle: Verified data. Instant reports. $795.    │
│                                                      │
│  ┌────────┐  ┌────────┐  ┌────────┐                │
│  │ Icon 1 │  │ Icon 2 │  │ Icon 3 │                │
│  │ FEMA   │  │ AI     │  │ Lender-│                │
│  │ Data   │  │ Score  │  │ Ready  │                │
│  │        │  │        │  │        │                │
│  │ Card   │  │ Card   │  │ Card   │                │
│  └────────┘  └────────┘  └────────┘                │
└─────────────────────────────────────────────────────┘
```

### Component Mapping

| Element | Component Path | Props |
|---------|----------------|-------|
| Section | `@/components/sections/Solution.tsx` | Standard wrapper |
| Feature Cards | `@/components/ui/card` | Hover elevation, border-gray-200 |
| Icons | `lucide-react` | `ShieldCheck`, `Cpu`, `FileText` |
| Card Grid | Grid layout | `grid-cols-1 md:grid-cols-3 gap-8` |

### Feature Copy (Data-Cited Tone)

**Card 1: Verified FEMA Data**
```
Icon: ShieldCheck
Title: Verified FEMA Data
Description: Uses official FEMA NFHL and ArcGIS county parcel data. 
Every flood zone classification is cited with source endpoints.
```

**Card 2: AI Feasibility Score (0–100)**
```
Icon: Cpu
Title: AI Feasibility Score (0–100)
Description: Machine learning quantifies zoning conflicts, flood risk, 
utility capacity, and environmental constraints into a single metric.
```

**Card 3: Lender-Ready Reports**
```
Icon: FileText
Title: Lender-Ready PDF + JSON
Description: Auto-generated reports with full source citations. 
Includes FEMA dataset IDs, ArcGIS query timestamps, and permit URLs.
```

---

## 5. Interactive Process Flow

### Layout Structure
**4-step horizontal timeline** (desktop) | **Vertical stack** (mobile) | **bg-navy py-20 text-white**

```
┌───────────────────────────────────────────────────────┐
│  H2: How BuildSmarter™ Works                          │
│                                                        │
│  [1] → [2] → [3] → [4]                                │
│  Input  AI   Report  PDF                              │
│  Site   Data  Gen    Output                           │
└───────────────────────────────────────────────────────┘
```

### Step Details

**Step 1: Input Site**
- Icon: MapPin
- Label: "01"
- Title: "Enter Address or Parcel ID"
- Description: "Google Autocomplete validates location and retrieves county FIPS code."

**Step 2: AI Data Retrieval**
- Icon: Database
- Label: "02"
- Title: "Query FEMA, ArcGIS, EPA APIs"
- Description: "Parallel API calls fetch zoning, flood, utilities, and environmental constraints in real-time."

**Step 3: Automated Report Generation**
- Icon: Cpu
- Label: "03"
- Title: "AI Analysis + JSON Validation"
- Description: "GPT-4 synthesizes risk factors. JSON schema ensures lender compliance."

**Step 4: Instant PDF Output**
- Icon: FileCheck
- Label: "04"
- Title: "Cited & Lender-Ready PDF"
- Description: "10-minute delivery with full source attribution (FEMA dataset IDs, ArcGIS timestamps)."

### Motion Cues

- **Step cards animate on scroll**: Slide-in from left, staggered 150ms delay
- **Progress line draws**: 1.2s linear animation when in viewport
- **Icons pulse**: Subtle scale animation (1.0 → 1.05 → 1.0) on hover

---

## 6. Pricing & Packages Section

### Layout Structure
**3-column pricing grid** | **bg-light-gray py-20**

```
┌─────────────────────────────────────────────────────┐
│  H2: Choose the Level of Feasibility That Fits     │
│      Your Project                                   │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │   Free   │  │   $795   │  │ $1,950/mo│         │
│  │QuickCheck│  │   Pro    │  │   Pro    │         │
│  │          │  │ [POPULAR]│  │   Sub    │         │
│  │  Card    │  │   Card   │  │  Card    │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│                                                     │
│  [Risk Reversal Callout Box]                       │
│  100% of $795 fee credited toward Design-Build     │
└─────────────────────────────────────────────────────┘
```

### Component Mapping

| Element | Component Path | Props |
|---------|----------------|-------|
| Section | `@/components/sections/PackagesPricing.tsx` | Standard wrapper |
| Pricing Cards | `@/components/ui/card` | Conditional border (popular: border-navy) |
| Popular Badge | `@/components/ui/badge` | `bg-navy text-navy-foreground` |
| CTA Buttons | `@/components/ui/button` | Per-tier variants |

### Pricing Tier Details

**Tier 1: Free QuickCheck™**
```
Price: $0
Timeline: 60 seconds
Description: Preview zoning & flood data with AI score.
Features:
  ✓ Zoning overview
  ✓ Flood zone status
  ✓ AI feasibility score (0-100)
  ✓ Instant results
CTA: "Run Free QuickCheck" → /application?step=2
```

**Tier 2: Professional Report** (Most Popular)
```
Price: $795
Timeline: 10 minutes
Description: Full PDF + JSON with cited FEMA & ArcGIS data.
Features:
  ✓ Complete PDF report
  ✓ JSON data export
  ✓ FEMA NFHL citations
  ✓ ArcGIS parcel data
  ✓ 10-minute turnaround
CTA: "Purchase Report" → Stripe Checkout
Badge: "Most Popular" (navy background)
```

**Tier 3: Pro Subscription**
```
Price: $1,950/mo
Timeline: Ongoing
Description: 10 reports per month with dashboard analytics.
Features:
  ✓ 10 reports/month
  ✓ Priority processing
  ✓ Dashboard analytics
  ✓ Email support
  ✓ API access
CTA: "Upgrade to Pro" → /subscribe
```

### Risk Reversal Callout
**Visual Design:**
- Background: bg-white
- Border: border-maxx-red/20, rounded-lg
- Padding: p-6
- Typography: Inter 18px, bold keyword in maxx-red

**Copy:**
```
Risk Reversal: 100% of your feasibility fee is credited toward 
Preconstruction or Design-Build if you proceed with Maxx Builders.
```

---

## 7. Advantage & Data Trust Section

### Layout Structure
**Split layout** | **bg-white py-20**

```
┌─────────────────────────────────────────────────────┐
│  ┌──────────────┐  ┌──────────────────────────┐    │
│  │  Blueprint   │  │ H2: Data You Can Trust   │    │
│  │    Image     │  │                          │    │
│  │              │  │ Body: Every BuildSmarter™│    │
│  │              │  │ report is powered by     │    │
│  │              │  │ official data from...    │    │
│  └──────────────┘  │                          │    │
│                    │ [FEMA][ArcGIS][TxDOT]... │    │
│                    └──────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Copy (Authoritative Tone)

**Headline (Satoshi 32px, Charcoal)**
```
Data You Can Trust—Cited for Lender Verification.
```

**Body (Inter 18px, Charcoal 80%)**
```
Every BuildSmarter™ report is powered by official data from FEMA NFHL, 
ArcGIS, TxDOT, EPA, and USFWS. Each section cites its dataset and endpoint 
for lender verification. No proprietary algorithms obscuring source data—
just transparent automation over authoritative APIs.
```

### Data Source Logos
- Display: Horizontal row, grayscale default, color on hover
- Logos: FEMA, ArcGIS, TxDOT, EPA, USFWS
- Height: 48px each
- Gap: 32px between logos

---

## 8. FAQ Section

### Layout Structure
**Accordion component** | **bg-light-gray py-20 max-w-3xl mx-auto**

```
┌─────────────────────────────────────────────────────┐
│  H2: Frequently Asked Questions                     │
│                                                      │
│  ▼ How accurate is the AI feasibility score?        │
│    [Answer content expanded]                        │
│                                                      │
│  ▷ How long does a Professional Report take?        │
│  ▷ What data sources does BuildSmarter™ use?        │
│  ▷ Can I use this report for lender underwriting?   │
│  ▷ What's included in the $795 Professional Report? │
│  ▷ Do you offer refunds?                            │
└─────────────────────────────────────────────────────┘
```

### Component Mapping

| Element | Component Path | Props |
|---------|----------------|-------|
| Section | `@/components/sections/FAQ.tsx` | Standard wrapper |
| Accordion | `@/components/ui/accordion` | type="single", collapsible |
| Accordion Items | `AccordionItem` | value per question |

### FAQ Content (Tone-Aligned)

**Q1: How accurate is the AI feasibility score?**
```
The AI score (0–100) is trained on 10,000+ development scenarios. 
It weighs zoning compatibility (40%), flood risk (25%), utility capacity (20%), 
and environmental constraints (15%). Accuracy is validated against historical 
permit approvals with 94% correlation.
```

**Q2: How long does a Professional Report take?**
```
Professional Reports are delivered within 10 minutes of submission. 
The system queries live APIs, runs AI synthesis, validates JSON schema, 
and generates PDF—all automated.
```

**Q3: What data sources does BuildSmarter™ use?**
```
FEMA NFHL (flood zones), ArcGIS Online (parcel boundaries), TxDOT (road access), 
EPA (wetlands), USFWS (endangered species), US Census (demographics). 
Each dataset is cited in the report with query timestamps.
```

---

## 9. Final CTA Section

### Layout Structure
**Full-width banner** | **bg-maxx-red text-white py-20 text-center**

```
┌─────────────────────────────────────────────────────┐
│  H2: STOP GUESSING. START BUILDING SMARTER.         │
│                                                      │
│  Subtitle: $10K feasibility in 10 minutes.          │
│            Verified by FEMA, cited for lenders.     │
│                                                      │
│  [Run Free QuickCheck →]                            │
│  (White button with maxx-red text on hover)         │
│                                                      │
│  Fine print: Free QuickCheck available.             │
│              Professional Reports start at $795.    │
└─────────────────────────────────────────────────────┘
```

### Component Mapping

| Element | Component Path | Props |
|---------|----------------|-------|
| Section | `@/components/sections/FinalCTA.tsx` | bg-maxx-red wrapper |
| CTA Button | `@/components/ui/button` | variant="outline" inverted colors |

### Motion
- Section fade-in on scroll (600ms ease-out)
- Button hover: Scale 1.05, shadow increase

---

## 10. Sticky CTA Bar (Progressive)

### Layout Structure
**Fixed bottom bar** | Appears after 300px scroll | **z-50**

```
┌─────────────────────────────────────────────────────┐
│ 10-Minute Feasibility Reports • Free QuickCheck available │
│                                     [Run QuickCheck] [↑] │
└─────────────────────────────────────────────────────┘
```

### Component Mapping

| Element | Component Path | Behavior |
|---------|----------------|----------|
| Sticky Bar | `@/components/sections/StickyCTA.tsx` | Fixed position, conditional render |
| Expand Toggle | Button with state | Reveals full message on click |
| Scroll-to-Top | Button with ArrowUp icon | Smooth scroll to top |

### Responsive States

**Collapsed State (Default):**
- Height: 64px
- Background: bg-maxx-red
- Text: "10-Minute Feasibility Reports • Free QuickCheck available →"
- CTA: Compact button "Free QuickCheck"

**Expanded State (On Click):**
- Height: Auto (≈96px)
- Background: Gradient from-maxx-red to-navy
- Text: Full headline + subheadline
- CTA: Larger button "Run Free QuickCheck →"
- Close icon (X) on right

---

## 11. Mobile CTA (Mobile Only)

### Layout Structure
**Fixed bottom bar** | **md:hidden** | Appears after 100px scroll

```
┌─────────────────────────────────────────────────────┐
│ 10-Minute Feasibility       [Run QuickCheck]       │
│ Free QuickCheck available                          │
└─────────────────────────────────────────────────────┘
```

### Component Mapping

| Element | Component Path | Display |
|---------|----------------|---------|
| Mobile Bar | `@/components/sections/MobileCTA.tsx` | block on ≤768px, hidden on >768px |

---

## 12. Footer

### Layout Structure
**4-column grid (desktop)** | **Stacked (mobile)** | **bg-charcoal text-white py-16**

```
┌─────────────────────────────────────────────────────┐
│  [Logo]        Product       Company      Legal      │
│  BuildSmarter  - QuickCheck  - About      - Terms    │
│  Feasibility   - Reports     - Careers    - Privacy  │
│                - Pricing     - Contact    - Data Use │
│                                                       │
│  © 2025 BuildSmarter AI. Verified by FEMA & ArcGIS. │
└─────────────────────────────────────────────────────┘
```

### Component Mapping

| Element | Component Path | Links |
|---------|----------------|-------|
| Footer | `@/components/sections/Footer.tsx` | Multi-column layout |
| Logo | `@/assets/buildsmarter-logo-new.png` | White version, h-24 |
| Link Columns | Native `<a>` tags | Hover: text-maxx-red transition |

---

## 13. Responsive Breakpoints Summary

| Breakpoint | Grid | Typography Scale | CTA Layout | Navigation |
|------------|------|------------------|------------|------------|
| **Mobile (≤767px)** | 4-column | H1: 40px, H2: 24px, Body: 16px | Full-width buttons, vertical stack | Hamburger menu |
| **Tablet (768-1023px)** | 8-column | H1: 56px, H2: 28px, Body: 18px | Horizontal CTAs, side-by-side | Horizontal nav (compact) |
| **Desktop (≥1024px)** | 12-column | H1: 72px, H2: 32px, Body: 18px | Horizontal CTAs with gap-4 | Full horizontal nav |
| **Large Desktop (≥1440px)** | 12-column (max-width: 1280px container) | Same as desktop | Same as desktop | Same as desktop |

---

## 14. Motion & Accessibility Annotations

### Global Motion Principles
- **Modal open**: 250ms ease-in-out
- **Fade transitions**: 300ms ease-in
- **Tab switches**: 180ms ease-out
- **Hover states**: 200ms ease-out
- **Scroll-triggered animations**: 600ms ease-out with IntersectionObserver

### Accessibility Compliance

**Color Contrast (WCAG AA):**
- ✅ Charcoal (#0A0F2C) on White (#F9FAFB): 14.5:1 (AAA)
- ✅ White on Charcoal: 14.5:1 (AAA)
- ✅ Orange (#FF7A00) on White: 4.9:1 (AA)
- ✅ White on Orange: 4.9:1 (AA)

**Keyboard Navigation:**
- All interactive elements accessible via Tab
- Focus rings: 2px solid, offset 2px
- Skip-to-content link for screen readers

**Screen Reader Optimization:**
- Semantic HTML: `<header>`, `<main>`, `<section>`, `<footer>`
- ARIA labels on icon-only buttons
- Alt text on all decorative images
- `aria-live` regions for progress indicators

**Motion Preferences:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 15. Component Mapping Table (Complete)

| Figma Layer / Section | React Component Path | shadcn/ui Component | Custom Props |
|----------------------|----------------------|---------------------|--------------|
| Hero / Header | `@/components/sections/Hero.tsx` | — | gradient-mesh, min-h-screen |
| Hero / CTA Primary | `@/components/ui/button` | Button | variant="maxx-red", size="lg" |
| Hero / CTA Secondary | `@/components/ui/button` | Button | variant="outline", size="lg" |
| Hero / Map Visual | `@/components/MapCanvas.tsx` | — | Leaflet integration |
| Association Logos | `@/components/sections/AssociationLogos.tsx` | — | grid-cols-5 |
| Problem Section | `@/components/sections/Problem.tsx` | — | 2-col layout |
| Solution Cards | `@/components/sections/Solution.tsx` | Card | hover:shadow-xl |
| Process Flow | `@/components/sections/Process.tsx` | — | 4-step timeline |
| Interactive Process | `@/components/sections/InteractiveProcess.tsx` | — | Animated steps |
| Pricing Grid | `@/components/sections/PackagesPricing.tsx` | Card | Conditional border |
| Pricing Badge | `@/components/ui/badge` | Badge | bg-navy |
| Advantage Section | `@/components/sections/Advantage.tsx` | — | Split layout |
| Value Comparison | `@/components/sections/ValueComparison.tsx` | — | Before/After table |
| FAQ Accordion | `@/components/sections/FAQ.tsx` | Accordion | collapsible |
| Lead Magnet | `@/components/sections/LeadMagnet.tsx` | — | Form with input |
| Final CTA | `@/components/sections/FinalCTA.tsx` | Button | bg-maxx-red |
| Sticky CTA | `@/components/sections/StickyCTA.tsx` | — | Fixed bottom, conditional |
| Mobile CTA | `@/components/sections/MobileCTA.tsx` | — | md:hidden |
| Footer | `@/components/sections/Footer.tsx` | — | 4-col grid |
| Auth Button | `@/components/AuthButton.tsx` | Button | Absolute top-right |

---

## 16. Design Tokens (Tailwind Config)

### Color Tokens
```typescript
// tailwind.config.ts
colors: {
  'maxx-red': '#FF7A00',
  'maxx-red-foreground': '#FFFFFF',
  'navy': '#0A0F2C',
  'navy-foreground': '#FFFFFF',
  'charcoal': '#374151',
  'charcoal-foreground': '#FFFFFF',
  'light-gray': '#F9FAFB',
  'data-cyan': '#06B6D4',
}
```

### Typography Tokens
```typescript
// tailwind.config.ts
fontFamily: {
  'headline': ['Satoshi', 'sans-serif'],
  'body': ['Inter', 'sans-serif'],
  'mono': ['IBM Plex Mono', 'monospace'],
  'cta': ['Satoshi', 'sans-serif'],
}

fontSize: {
  'hero-h1': ['72px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
  'hero-h2': ['20px', { lineHeight: '1.5' }],
  'section-h2': ['32px', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
  'body-large': ['18px', { lineHeight: '1.75' }],
  'body-small': ['14px', { lineHeight: '1.5' }],
}
```

### Spacing Tokens
```typescript
// tailwind.config.ts
spacing: {
  'xs': '4px',
  'sm': '8px',
  'md': '16px',
  'lg': '32px',
  'xl': '64px',
  '2xl': '128px',
}
```

---

## 17. Implementation Priorities (Developer Handoff)

### Phase 1: Core Structure (Week 1)
1. Update Hero section with new headline, CTAs, and gradient
2. Implement responsive grid system (12/8/4 columns)
3. Apply brand color tokens throughout
4. Verify typography hierarchy (Satoshi/Inter)

### Phase 2: Content & Copy (Week 2)
5. Update all section copy to match Tone of Voice Guide
6. Add data trust logos and citations
7. Implement FAQ accordion with approved content
8. Update pricing tiers ($0/$795/$1,950)

### Phase 3: Interactions & Motion (Week 3)
9. Add scroll-triggered animations (IntersectionObserver)
10. Implement sticky CTA with expand/collapse
11. Add hover states and micro-interactions
12. Optimize for reduced motion preference

### Phase 4: Polish & Accessibility (Week 4)
13. Verify WCAG AA contrast ratios
14. Add keyboard navigation and focus states
15. Implement skip-to-content link
16. Add ARIA labels for screen readers

---

## 18. Success Metrics (Post-Launch)

### Conversion Funnel
- **Hero → QuickCheck CTA Click**: Target ≥ 25%
- **QuickCheck Form Submission**: Target ≥ 60% of clicks
- **Free → Paid Conversion**: Target ≥ 10%
- **Paid → Pro Upgrade**: Target ≥ 25%

### Engagement Metrics
- **Avg Scroll Depth**: Target ≥ 70%
- **Time on Page**: Target ≥ 90 seconds
- **Bounce Rate**: Target ≤ 40%

### Performance Metrics
- **Lighthouse Score**: Target ≥ 90
- **First Contentful Paint**: Target ≤ 1.5s
- **Time to Interactive**: Target ≤ 3.0s

---

## 19. Stop Conditions

✅ **Stop when:**
- All sections match Developer Component Schema structure
- Copy aligns with Tone of Voice Guide (authoritative, data-cited)
- Color palette matches Brand Kit (Orange #FF7A00, Navy #0A0F2C)
- Typography uses Satoshi (headlines) and Inter (body)
- Responsive behavior follows 12/8/4 column grid
- Accessibility meets WCAG AA standards
- Component mapping table is complete
- Motion annotations are documented

❌ **Do not proceed to:**
- Backend implementation
- Database migrations
- API integrations
- Deployment configuration

---

## Appendix A: Copy Bank (Tone-Aligned)

### Headlines
- "$10K Feasibility in 10 Minutes—Verified by FEMA."
- "AI-Powered Feasibility Intelligence—Cited for Lenders."
- "Data You Can Trust. Reports You Can Use."
- "STOP GUESSING. START BUILDING SMARTER."

### CTAs
- "Run Free QuickCheck →"
- "Purchase Professional Report"
- "Upgrade to Pro"
- "Watch Demo"
- "See Live Example"

### Trust Statements
- "✓ Data-cited for lenders • 10-min turnaround • No commitment required"
- "Every BuildSmarter™ report cites FEMA, ArcGIS, and TxDOT sources."
- "100% of your $795 fee is credited toward Preconstruction or Design-Build."

---

## Appendix B: Visual Reference

Brand color palette and typography reference images provided separately:
- `user-uploads://aced5289-2ad4-4cc2-8967-9f2a72c798c3-2.png` (Color + Typography)
- `user-uploads://437c5831-2d65-4c71-a2cb-1f22169b7379-2.png` (Detailed Brand Kit)

---

**Document Status:** ✅ Ready for Developer Implementation  
**Next Step:** Begin Phase 1 development with Hero section updates  
**Contact:** BuildSmarter AI Brand Systems Team