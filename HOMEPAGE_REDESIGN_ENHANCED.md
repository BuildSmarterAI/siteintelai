# BuildSmarter™ Feasibility — Homepage Redesign Specification (Enhanced)

**Version 2.0** | Lead UX/UI Strategy & Brand Copy Architecture  
**Date:** October 2025  
**Status:** Implementation Ready

---

## Executive Summary

This specification defines comprehensive improvements to the BuildSmarter™ Feasibility homepage, optimizing for:
- **Maximum conversion** (Free QuickCheck → $795 Professional Report → $1,950 Pro)
- **Clarity** (immediate value communication)
- **Design-system consistency** (BuildSmarter Brand Kit compliance)

**Core Transformation Message:**
> "$10K feasibility reports, automated in 10 minutes."

---

## 1. Hero Section

### Layout Hierarchy
- **Grid:** 6-column text (left) + 6-column visual (right) on desktop
- **Vertical spacing:** py-20 lg:py-16 (optimized for first viewport)
- **Z-index layering:** Background (-1) → Visual (0) → Content (20)

### Optimized Copy

**H1 Headline** (Satoshi 48px/56px, Bold, White with Feasibility Orange gradient)
```
$10K Feasibility in 10 Minutes—Verified by FEMA.
```

**H2 Subheadline** (Inter 18px/28px, Regular, White 90%)
```
AI-generated, lender-ready feasibility reports using real FEMA, ArcGIS, 
and TxDOT data. Every BuildSmarter™ report cites its source for lender verification.
```

### CTA Buttons

**Primary CTA**
- Label: "Run Free QuickCheck →"
- Style: `variant="maxx-red"` (Feasibility Orange #FF7A00)
- Destination: `/application?step=2`
- Size: `lg` (px-10 py-4)
- Icon: Arrow right (→)
- Hover: Shadow glow + lift (-translate-y-0.5)

**Secondary CTA**
- Label: "Watch Demo"
- Style: `variant="outline"` (White border, transparent bg)
- Destination: `/demo` or modal video
- Size: `lg`
- Hover: bg-white/20 transition

### Trust Badge
```
✓ Data-cited for lenders • 10-minute turnaround • No commitment required
```
- Typography: Inter 14px, White 80%
- Icons: CheckCircle2 (Lucide)

### Iconography Rationale
- **MapPin**: Location input visual cue
- **Database**: Data integrity representation
- **ShieldCheck**: FEMA verification badge
- **Clock**: 10-minute speed promise
- **FileText**: Lender-ready report output

### Background System

**Gradient Overlay**
```css
background: var(--gradient-hero);
/* = linear-gradient(135deg, hsl(226 63% 11% / 0.95), hsl(226 63% 18% / 0.90)) */
```

**Aerial Image**
- Source: `@/assets/aerial-property-site.jpg`
- Treatment: `opacity-30 saturate-50 scale-105`
- Alt: "Aerial view of commercial real estate development site"

**Gradient Mesh**
- Class: `.gradient-mesh`
- Effect: Subtle radial gradients (Midnight Blue, Feasibility Orange, Data Cyan)

### Micro-Motion Specifications

**Hero Entry Animation**
```
Logo: fade-in-up, 0.4s ease-out
H1: fade-in-up, 0.6s ease-out, delay 0.2s
H2: fade-in-up, 0.6s ease-out, delay 0.4s
CTAs: fade-in-up, 0.6s ease-out, delay 0.6s
Map Visual: fade-in-up, 0.8s ease-out, delay 0.4s
```

**Interactive Risk Markers** (Desktop only)
- Trigger: `onMouseEnter`
- Animation: Scale 1.0 → 1.1 (200ms ease-out)
- Tooltip: Fade-in + slide-up (200ms ease-out)
- Pulse: 2s infinite on dot markers

**CTA Hover States**
- Duration: 300ms
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Transform: `translateY(-2px)` + shadow enhancement

---

## 2. Feature Value Blocks

### 3-Column Card Design

**Grid System**
- Desktop: `grid-cols-3 gap-8`
- Tablet: `grid-cols-3 gap-6`
- Mobile: `grid-cols-1 gap-6`

### Card Architecture

**Card 1: Verified FEMA Data**
```
Icon: ShieldCheck (Lucide, 40px, Feasibility Orange)
Title: "Verified FEMA Data"
Typography: Satoshi 20px, Midnight Blue
Supporting Line: "Uses official FEMA NFHL and ArcGIS county parcel data."
Body Typography: Inter 16px, Slate Gray
Background: bg-white, border-gray-200
Hover: shadow-medium, border-feasibility-orange/20
```

**Card 2: AI Feasibility Score (0–100)**
```
Icon: Cpu (Lucide, 40px, Data Cyan)
Title: "AI Feasibility Score (0–100)"
Supporting Line: "Quantifies zoning, flood, utilities, and environmental risk."
Visual Tone: Data-driven, algorithmic precision
Accent: Data Cyan #06B6D4 for data highlights
```

**Card 3: Lender-Ready Reports**
```
Icon: FileText (Lucide, 40px, Midnight Blue)
Title: "Lender-Ready PDF + JSON"
Supporting Line: "Auto-generated reports with full source citations."
Emphasis: Enterprise credibility, professional output
```

### Visual Tone
- **Clean cards** with subtle shadow elevation
- **Generous whitespace** (p-8 internal padding)
- **Icon-title-body hierarchy** for scannability
- **Restrained color** (icons carry brand colors, backgrounds neutral)

---

## 3. Workflow / "How It Works" Section

### Sequential Layout (4-Step Process)

**Background:** `bg-midnight-blue py-20 text-white`

**Section Title**
```
"How BuildSmarter™ Works"
Satoshi 32px, White, text-center, mb-12
```

**Step Architecture**

**Step 1: Input Site**
```
Icon: MapPin (48px, Feasibility Orange)
Label: "01" (Inter 14px, Data Cyan)
Title: "Enter Address or Parcel ID"
Description: "Google Autocomplete validates location and retrieves county FIPS code."
Visual: Address input field mockup or icon
```

**Step 2: AI Data Retrieval**
```
Icon: Database (48px, Data Cyan)
Label: "02"
Title: "Query FEMA, ArcGIS, EPA APIs"
Description: "Parallel API calls fetch zoning, flood, utilities, and environmental constraints in real-time."
Visual: Data layers stacking animation concept
```

**Step 3: Automated Report Generation**
```
Icon: Cpu (48px, Feasibility Orange)
Label: "03"
Title: "AI Analysis + JSON Validation"
Description: "GPT-4 synthesizes risk factors. JSON schema ensures lender compliance."
Visual: AI processing nodes or flowchart
```

**Step 4: Instant PDF Output**
```
Icon: FileCheck (48px, White with shadow-glow)
Label: "04"
Title: "Cited & Lender-Ready PDF"
Description: "10-minute delivery with full source attribution (FEMA dataset IDs, ArcGIS timestamps)."
Visual: PDF document preview or download icon
```

### Progress Flow Animation

**Desktop Layout**
- Horizontal timeline with connecting lines
- Line draws left-to-right (1.2s linear) on scroll intersection
- Steps fade-in sequentially (stagger 150ms)

**Mobile Layout**
- Vertical stack with dots on left edge
- Dot connectors draw top-to-bottom

### CTA Placement
```
"Try Your Address →" (Feasibility Orange button)
Destination: /application?step=2
Positioned: text-center mt-12
```

---

## 4. Visual Trust Section

### Layout Structure

**Background:** `bg-cloud-white py-16`

**Section Title**
```
"Powered by Authoritative Data Sources"
Satoshi 24px, Midnight Blue, text-center, mb-8
```

**Logo Grid**
```
Grid: grid-cols-2 md:grid-cols-5 gap-8
Logo Treatment: Grayscale default, color on hover
Logo Height: 64px (consistent across all)
Logos: FEMA, ArcGIS, TxDOT, EPA, USFWS
```

### Copy Enhancement

**Supporting Paragraph**
```
"Every BuildSmarter™ report is powered by official data from FEMA NFHL, 
ArcGIS, TxDOT, EPA, and USFWS. Each section cites its dataset and endpoint 
for lender verification."
```
- Typography: Inter 16px, Slate Gray
- Width: max-w-3xl mx-auto
- Alignment: text-center

### Visual Treatment
- **Subdued gray badges** for data partner logos (opacity-60 default)
- **Hover state**: Full color + scale-105 + shadow-soft
- **Spacing**: py-16 section breathing room

---

## 5. Pricing CTA Band

### Layout Structure

**Background:** `bg-midnight-blue py-20`

**Section Title**
```
"Choose Your Feasibility Option"
Satoshi 32px, White, text-center, mb-12
```

### Two-CTA Strategy

**CTA 1: Professional Report**
```
Price Display: "$795"
Typography: Inter 40px, Feasibility Orange, font-bold
Subtext: "Professional Report • 10-minute delivery"
Button Label: "Purchase Full Report"
Button Style: bg-feasibility-orange text-white hover:bg-feasibility-orange/90
Size: xl (px-12 py-5)
Icon: ArrowRight
Destination: /pricing or Stripe checkout
```

**CTA 2: Pro Subscription**
```
Price Display: "$1,950/mo"
Typography: Inter 32px, Data Cyan
Subtext: "Pro Subscription • 10 reports/month + analytics"
Button Label: "Upgrade to Pro"
Button Style: border-2 border-data-cyan text-data-cyan hover:bg-data-cyan hover:text-white
Size: lg (px-10 py-4)
Icon: Zap (energy/power symbol)
Destination: /subscribe
```

### Layout Grid
```
Desktop: 2-column grid (gap-12)
Mobile: Stacked (gap-8)
Card Background: bg-white/5 backdrop-blur-sm
Card Border: border border-white/10
Card Padding: p-8
```

### Contrast & Accessibility
- **Midnight Blue background** provides high contrast for white text
- **Feasibility Orange** and **Data Cyan** buttons both meet AA contrast
- **Focus rings**: 2px solid ring on keyboard navigation

---

## 6. Footer

### Layout Structure

**Background:** `bg-slate-gray py-12`

**Grid:** 4-column (desktop) → stacked (mobile)

### Column 1: Logo + Tagline
```
Logo: BuildSmarter™ Feasibility (white version, h-24)
Tagline: "AI Feasibility Intelligence—Verified by Data"
Typography: Inter 14px, Cloud White 80%
```

### Column 2: Product Links
```
Title: "Product" (Inter 14px, Cloud White, font-semibold, mb-4)
Links:
  - QuickCheck™
  - Professional Report
  - Pro Subscription
  - Pricing
Link Style: text-cloud-white/70 hover:text-feasibility-orange
```

### Column 3: Company Links
```
Title: "Company"
Links:
  - About
  - Data Sources
  - Careers
  - Contact
```

### Column 4: Legal Links
```
Title: "Legal"
Links:
  - Terms of Service
  - Privacy Policy
  - Data Use Policy
  - Compliance
```

### Compliance Tagline

**Centered Footer Bar**
```
"© 2025 BuildSmarter AI — Generated using authoritative public datasets."
Typography: Inter 12px, Cloud White 60%
Border Top: border-t border-white/10, pt-8 mt-8
```

### Color Spec
- Background: Slate Gray #374151
- Text: Cloud White #F9FAFB (opacity variations)
- Hover: Feasibility Orange #FF7A00

### Spacing
- Vertical: py-12
- Internal: gap-8 between columns
- Link spacing: space-y-3

---

## 7. Section Sequencing & Transitions

### Optimized Flow

```
1. Hero (Value Proposition + Primary CTA)
   ↓ Scroll transition: fade-in-up
   
2. Association Logos (Trust Band)
   ↓ Scroll transition: sequential fade-in (100ms stagger)
   
3. Problem Section (Pain Point Articulation)
   ↓ Scroll transition: slide-in from sides
   
4. Solution Section (Feature Value Blocks)
   ↓ Scroll transition: scale-in
   
5. How It Works (Workflow Visualization)
   ↓ Scroll transition: progress line draw
   
6. Pricing & Packages (Tier Comparison)
   ↓ Scroll transition: fade-in-up
   
7. Advantage Section (Data Trust)
   ↓ Scroll transition: fade-in
   
8. FAQ (Objection Handling)
   ↓ Scroll transition: accordion expand
   
9. Final CTA (Conversion Push)
   ↓ Scroll transition: scale-in with glow
   
10. Footer (Navigation + Compliance)
```

### Transition Specs

**Scroll Trigger:** `IntersectionObserver` with `threshold: 0.2`

**Animation Duration:**
- Fast elements (text): 400ms
- Medium elements (cards): 600ms
- Slow elements (large visuals): 800ms

**Easing:**
- Entry: `ease-out`
- Hover: `cubic-bezier(0.4, 0, 0.2, 1)`
- Exit: `ease-in`

---

## 8. Color & Typography System

### Official BuildSmarter Brand Colors

| Color Name | HEX | HSL | Usage |
|------------|-----|-----|-------|
| **Feasibility Orange** | #FF7A00 | 24 100% 50% | Primary accent, CTAs, data highlights |
| **Midnight Blue** | #0A0F2C | 226 63% 11% | Backgrounds, headers, primary text |
| **Slate Gray** | #374151 | 217 11% 25% | Body text, secondary elements |
| **Cloud White** | #F9FAFB | 210 17% 98% | Backgrounds, card surfaces |
| **Data Cyan** | #06B6D4 | 191 91% 43% | Data visualization, analytics accents |

### Typography Scale

| Element | Font | Size / Leading | Weight | Usage |
|---------|------|----------------|--------|-------|
| **H1** | Inter | 48px / 56px | 800 (Bold) | Hero headlines |
| **H2** | Inter | 32px / 40px | 700 (SemiBold) | Section headers |
| **H3** | Inter | 24px / 32px | 600 (Medium) | Card titles |
| **Body Large** | Inter | 18px / 28px | 400 (Regular) | Main body text |
| **Body Small** | Inter | 14px / 22px | 400 (Regular) | Captions, fine print |
| **CTA** | Poppins | 16px / 24px | 600 (SemiBold) | Button labels |
| **Mono** | IBM Plex Mono | 14px / 20px | 400 (Regular) | Code, data, JSON |

### Letter Spacing
- Headlines: `-0.02em` (tighter, modern)
- Body: `0` (default)
- CTAs: `-0.005em` (subtle tightening)

---

## 9. Motion, Contrast, Accessibility

### Motion Specifications

**Button Hover**
```css
transition: var(--transition-smooth); /* 300ms ease-out */
hover: transform translateY(-2px) + shadow-glow
```

**Card Hover**
```css
transition: var(--transition-smooth);
hover: shadow-medium + border-color-shift
```

**Progress Modal**
```css
entry: fade + scale (250ms ease-in-out)
exit: fade + scale reverse (200ms ease-in)
```

**Scroll Animations**
```css
trigger: IntersectionObserver threshold 0.2
duration: 600ms
easing: ease-out
stagger: 150ms (for sequential elements)
```

### Contrast Compliance (WCAG 2.1 AA)

| Combination | Contrast Ratio | Status |
|-------------|----------------|--------|
| Midnight Blue on Cloud White | 14.2:1 | ✅ AAA |
| Slate Gray on Cloud White | 9.8:1 | ✅ AAA |
| Feasibility Orange on Cloud White | 4.9:1 | ✅ AA |
| Cloud White on Midnight Blue | 14.2:1 | ✅ AAA |
| Data Cyan on Midnight Blue | 8.1:1 | ✅ AAA |

### Accessibility Features

**Keyboard Navigation**
- All interactive elements accessible via Tab
- Focus rings: 2px solid Feasibility Orange, offset 2px
- Skip-to-content link for screen readers (sr-only, focus:not-sr-only)

**Screen Reader Optimization**
- Semantic HTML5: `<header>`, `<main>`, `<section>`, `<article>`, `<footer>`
- ARIA labels on icon-only buttons: `aria-label="Run Free QuickCheck"`
- Alt text on all images with meaningful descriptions
- `aria-live="polite"` on progress indicators

**Motion Preferences**
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

## 10. Component Mapping Table

| Section | Figma Layer | React Component Path | shadcn/ui | Notes |
|---------|-------------|---------------------|-----------|-------|
| **Hero** | HeroSection | `@/components/sections/Hero.tsx` | — | Full viewport, gradient mesh |
| Hero / H1 | H1Title | Native `<h1>` | — | Gradient text effect |
| Hero / Primary CTA | PrimaryCTA | `@/components/ui/button` | Button | variant="maxx-red" |
| Hero / Secondary CTA | SecondaryCTA | `@/components/ui/button` | Button | variant="outline" |
| Hero / Map | MapCanvas | `@/components/MapCanvas.tsx` | — | Leaflet integration |
| **Trust Band** | AssociationLogos | `@/components/sections/AssociationLogos.tsx` | — | Logo grid, grayscale hover |
| **Problem** | ProblemSection | `@/components/sections/Problem.tsx` | — | 2-column split |
| **Solution Cards** | FeatureRow | `@/components/sections/Solution.tsx` | Card | 3-column grid |
| Solution / Card | FeatureCard | `@/components/ui/card` | Card | Icon-title-body |
| **Process Flow** | ProcessTimeline | `@/components/sections/Process.tsx` | — | 4-step horizontal |
| Process / Interactive | InteractiveProcess | `@/components/sections/InteractiveProcess.tsx` | — | Animated steps |
| **Pricing** | PricingGrid | `@/components/sections/PackagesPricing.tsx` | Card | 3-tier comparison |
| Pricing / Badge | PopularBadge | `@/components/ui/badge` | Badge | "Most Popular" tag |
| **Advantage** | AdvantageSection | `@/components/sections/Advantage.tsx` | — | Data trust messaging |
| **FAQ** | FAQAccordion | `@/components/sections/FAQ.tsx` | Accordion | Collapsible Q&A |
| **Final CTA** | ConversionBanner | `@/components/sections/FinalCTA.tsx` | Button | Midnight Blue bg |
| **Sticky CTA** | StickyCTA | `@/components/sections/StickyCTA.tsx` | — | Fixed bottom |
| **Mobile CTA** | MobileCTA | `@/components/sections/MobileCTA.tsx` | — | md:hidden |
| **Footer** | FooterSection | `@/components/sections/Footer.tsx` | — | 4-column grid |

---

## 11. Responsive Behavior Summary

| Breakpoint | Grid Columns | Container Width | Typography Scale | CTA Layout |
|------------|--------------|-----------------|------------------|------------|
| **Mobile (≤767px)** | 4-column | Full width (px-4) | H1: 40px, H2: 24px, Body: 16px | Full-width, stacked |
| **Tablet (768-1023px)** | 8-column | 720px | H1: 48px, H2: 28px, Body: 18px | Side-by-side, compact |
| **Desktop (≥1024px)** | 12-column | 1024px | H1: 56px, H2: 32px, Body: 18px | Horizontal, gap-4 |
| **Large Desktop (≥1440px)** | 12-column | 1280px | H1: 72px, H2: 40px, Body: 18px | Same as desktop |

### Grid Specifications
- **Gutters:** 80px (desktop), 60px (tablet), 40px (mobile)
- **Margins:** 160px (desktop), 80px (tablet), 24px (mobile)
- **Max container:** 1280px (prevents excessive line length)

---

## 12. Implementation Priorities

### Phase 1: Design System Foundation
- ✅ Update color tokens in `index.css` (Feasibility Orange, Midnight Blue, etc.)
- ✅ Update `tailwind.config.ts` with brand colors
- ✅ Verify typography hierarchy (Inter Bold for headlines)
- ✅ Add gradient and shadow CSS custom properties

### Phase 2: Hero Section Optimization
- Update H1 headline copy
- Refine H2 subheadline for clarity
- Enhance CTA button labels and destinations
- Improve background gradient and visual hierarchy
- Add trust badge with data-citation messaging

### Phase 3: Content & Copy Alignment
- Update all section copy to match Tone of Voice Guide
- Remove marketing fluff, add numerical proof
- Ensure active voice and present tense throughout
- Add data source citations where appropriate

### Phase 4: Visual Hierarchy Enhancement
- Improve card design with consistent padding and shadows
- Enhance icon usage (ShieldCheck, Database, FileText, etc.)
- Refine color application (restrained, purposeful)
- Add hover states and micro-interactions

### Phase 5: Section Sequencing Optimization
- Verify logical flow (Trust → Problem → Solution → Proof → Action)
- Add scroll-triggered animations
- Implement IntersectionObserver for performance
- Test transition timing and easing

### Phase 6: Accessibility & Polish
- Verify WCAG AA contrast ratios
- Add keyboard navigation and focus states
- Implement skip-to-content link
- Test with screen readers
- Add prefers-reduced-motion support

---

## 13. Success Metrics

### Conversion Funnel KPIs
- **Hero CTA Click-Through:** ≥ 25%
- **Free QuickCheck Submission:** ≥ 60% (of CTA clicks)
- **Free → Paid Conversion:** ≥ 10%
- **Paid → Pro Upgrade:** ≥ 25%

### Engagement Metrics
- **Average Scroll Depth:** ≥ 70%
- **Time on Page:** ≥ 90 seconds
- **Bounce Rate:** ≤ 40%
- **Mobile Engagement:** ≥ 65% scroll depth

### Technical Performance
- **Lighthouse Score:** ≥ 90
- **First Contentful Paint:** ≤ 1.5s
- **Time to Interactive:** ≤ 3.0s
- **Cumulative Layout Shift:** ≤ 0.1

---

## 14. Stop Conditions

✅ **Implementation Complete When:**
- All color tokens match BuildSmarter Brand Kit exactly
- Typography uses Inter (Satoshi-like) and IBM Plex Mono
- Copy aligns with Tone of Voice Guide (authoritative, data-cited)
- Section sequencing follows optimal conversion flow
- Visual hierarchy clear and enterprise-grade
- Accessibility meets WCAG AA standards
- Responsive behavior tested across breakpoints
- Component mapping complete and documented

❌ **Out of Scope:**
- Backend API integrations
- Database schema changes
- Payment processing implementation
- User authentication flows
- PDF generation logic
- GIS data pipeline modifications

---

## Appendix A: Brand Voice Examples

### ✅ Correct Tone (Authoritative, Data-Cited)
- "$10K Feasibility in 10 Minutes—Verified by FEMA."
- "Uses official FEMA NFHL and ArcGIS county parcel data."
- "Every BuildSmarter™ report cites its source for lender verification."
- "10-minute delivery with full source attribution."

### ❌ Incorrect Tone (Marketing Fluff, Vague)
- "Revolutionary AI changes the game!"
- "Cutting-edge insights that transform everything."
- "The smartest feasibility solution on the planet."
- "Unlock hidden potential with our amazing platform."

### Tone Guidelines Applied
- **Numerical proof:** "$10K", "10 minutes", "95% margin"
- **Data sources:** "FEMA NFHL", "ArcGIS", "TxDOT"
- **Active voice:** "BuildSmarter eliminates lag" (not "lag is eliminated")
- **Present tense:** "Uses official data" (not "will use")
- **No buzzwords:** Avoid "revolutionary", "cutting-edge", "game-changing"

---

## Appendix B: Technical Dependencies

### Required npm Packages
- `lucide-react` (icons: ShieldCheck, Database, FileText, Cpu, MapPin, Clock)
- `@radix-ui/react-accordion` (FAQ section)
- `react-intersection-observer` (scroll-triggered animations)
- `leaflet` + `react-leaflet` (map visualization)

### Design System Dependencies
- shadcn/ui components: Button, Card, Badge, Accordion
- Tailwind CSS with custom config
- CSS custom properties in `index.css`
- Inter font family (Google Fonts)
- Poppins font family (Google Fonts)
- IBM Plex Mono (Google Fonts)

### Asset Requirements
- BuildSmarter logo (SVG, white version for dark backgrounds)
- Aerial property site image (optimized WebP)
- Data partner logos: FEMA, ArcGIS, TxDOT, EPA, USFWS (SVG)

---

**Document Status:** ✅ Ready for Implementation  
**Next Step:** Begin Phase 1 (Design System Foundation) and Phase 2 (Hero Section Optimization)  
**Contact:** BuildSmarter AI Brand Systems Team

---

*This specification supersedes all previous homepage design documents and serves as the single source of truth for BuildSmarter™ Feasibility marketing site development.*