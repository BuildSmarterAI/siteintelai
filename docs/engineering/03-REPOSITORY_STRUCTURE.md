# C. Repository Structure

> Monorepo patterns, folder organization, and file conventions

## Root Structure

```
siteintel/
├── .env                          # Environment variables (gitignored)
├── .github/
│   └── workflows/
│       └── webpack.yml           # CI workflow
├── docs/                         # Documentation
│   ├── engineering/              # This documentation suite
│   ├── api/                      # API documentation
│   ├── architecture/             # Architecture docs
│   ├── brand/                    # Brand guidelines
│   ├── features/                 # Feature specs
│   ├── guides/                   # Developer guides
│   ├── security/                 # Security docs
│   └── specs/                    # Specifications
├── public/                       # Static assets
│   ├── favicon.ico
│   ├── robots.txt
│   └── placeholder.svg
├── src/                          # Frontend source
│   ├── App.tsx                   # Root component
│   ├── main.tsx                  # Entry point
│   ├── index.css                 # Global styles
│   ├── assets/                   # Images, logos
│   ├── components/               # React components
│   ├── contexts/                 # React contexts
│   ├── features/                 # Feature modules
│   ├── hooks/                    # Custom hooks
│   ├── integrations/             # Third-party integrations
│   ├── lib/                      # Utilities
│   └── pages/                    # Route pages
├── supabase/                     # Backend
│   ├── config.toml               # Supabase config
│   ├── functions/                # Edge functions
│   └── migrations/               # Database migrations
├── backend/                      # Backend services
│   ├── migrations/               # SQL migrations
│   └── services/                 # Service modules
├── index.html                    # HTML entry point
├── vite.config.ts                # Vite configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript config
├── eslint.config.js              # ESLint config
└── package.json                  # Dependencies (read-only)
```

---

## Source Directory (`src/`)

### Components Organization

```
src/components/
│
├── ui/                           # shadcn/ui primitives
│   ├── accordion.tsx
│   ├── alert.tsx
│   ├── badge.tsx
│   ├── button.tsx                # With CVA variants
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── sheet.tsx
│   ├── sidebar.tsx
│   ├── table.tsx
│   ├── tabs.tsx
│   ├── toast.tsx
│   └── ...                       # 50+ primitives
│
├── sections/                     # Page sections
│   ├── Hero.tsx                  # Homepage hero
│   ├── Problem.tsx               # Pain points
│   ├── Solution.tsx              # Value prop
│   ├── Pricing.tsx               # Pricing section
│   ├── FAQ.tsx                   # FAQ accordion
│   ├── FinalCTA.tsx              # Bottom CTA
│   └── cost-intelligence/        # Cost intel sections
│       ├── CostHeroSection.tsx
│       ├── FeaturePillarsSection.tsx
│       └── ...
│
├── navigation/                   # Navigation
│   ├── Header.tsx                # Main header
│   ├── Footer.tsx                # Main footer
│   └── DashboardSidebar.tsx      # Dashboard nav
│
├── application/                  # Multi-step form
│   ├── ContactStep.tsx
│   ├── PropertyStep.tsx
│   ├── IntentStep.tsx
│   └── IntentSelectionModal.tsx
│
├── beta/                         # Beta features
│   ├── BetaBadge.tsx
│   ├── BetaSignupForm.tsx
│   ├── ParcelMapPreview.tsx
│   └── ScorePreviewCard.tsx
│
├── admin/                        # Admin components
│   └── ReEnrichProgressModal.tsx
│
└── tours/                        # Onboarding tours
    ├── BuildPathTour.tsx
    └── BuyPathTour.tsx
```

### Pages Organization

```
src/pages/
│
├── Index.tsx                     # Homepage (/)
├── Auth.tsx                      # Authentication (/auth)
├── Dashboard.tsx                 # User dashboard (/dashboard)
├── Application.tsx               # New application (/application)
├── ReportViewer.tsx              # View report (/report/:id)
│
├── Pricing.tsx                   # Pricing (/pricing)
├── Products.tsx                  # Products (/products)
├── HowItWorks.tsx                # How it works (/how-it-works)
├── Contact.tsx                   # Contact (/contact)
├── About.tsx                     # About (/about)
├── Demo.tsx                      # Demo booking (/demo)
│
├── Beta.tsx                      # Beta page (/beta)
├── BetaSignup.tsx                # Beta signup (/beta-signup)
├── BetaThankYou.tsx              # Thank you (/beta-thank-you)
│
├── Feasibility.tsx               # Feasibility (/feasibility)
├── FeasibilityAsAService.tsx     # FaaS page (/feasibility-as-a-service)
├── CostIntelligence.tsx          # Cost intel (/cost-intelligence)
├── ScheduleIntelligence.tsx      # Schedule intel (/schedule-intelligence)
├── HospitalityIntelligence.tsx   # HII (/hospitality-intelligence)
├── SurveyUpload.tsx              # Survey upload (/survey-upload)
│
├── Analytics.tsx                 # Analytics (/analytics)
├── PaymentHistory.tsx            # Payments (/payment-history)
├── InvestorDeck.tsx              # Investor deck (/investor-deck)
├── BrandKit.tsx                  # Brand kit (/brand-kit)
│
├── industries/                   # Industry pages
│   ├── Developers.tsx            # /industries/developers
│   ├── Lenders.tsx               # /industries/lenders
│   └── TexasDevelopers.tsx       # /industries/texas-developers
│
├── legal/                        # Legal pages
│   ├── Terms.tsx                 # /legal/terms
│   ├── Privacy.tsx               # /legal/privacy
│   └── BetaNDA.tsx               # /legal/beta-nda
│
├── resources/                    # Resources
│   └── Blog.tsx                  # /resources/blog
│
└── NotFound.tsx                  # 404 page
```

### Hooks Organization

```
src/hooks/
├── use-mobile.tsx                # Mobile detection
├── use-toast.ts                  # Toast notifications
├── useAdminRole.ts               # Admin role check
├── useApplicationForm.ts         # Form state
├── useBulkReEnrich.ts            # Bulk re-enrichment
├── useCounter.ts                 # Animated counter
├── useMapLayers.ts               # Map layer management
└── useReEnrichApplication.ts     # Single re-enrichment
```

### Features Organization

```
src/features/
└── hospitality-hii/              # HII feature module
    ├── index.ts                  # Module exports
    ├── types.ts                  # TypeScript types
    ├── hooks/
    │   ├── useHiiScore.ts        # Score fetching
    │   ├── useHiiGeoJSON.ts      # GeoJSON data
    │   └── useHiiAlerts.ts       # Real-time alerts
    └── store/
        └── useHiiStore.ts        # Zustand store
```

---

## Backend Directory (`supabase/`)

### Edge Functions

```
supabase/functions/
│
├── _shared/                      # Shared utilities
│   ├── cors.ts                   # CORS headers
│   ├── data-requirements.ts      # Validation
│   ├── observability.ts          # Logging
│   └── progress-logger.ts        # Progress tracking
│
├── orchestrate-application/      # State machine
│   └── index.ts
│
├── submit-application/           # Initial submission
│   └── index.ts
│
├── enrich-*/                     # Enrichment functions
│   └── index.ts
│
├── generate-*/                   # Report generation
│   └── index.ts
│
├── create-*/                     # Stripe operations
│   └── index.ts
│
├── get-*/                        # Data retrieval
│   └── index.ts
│
├── fetch-*/                      # External API calls
│   └── index.ts
│
├── gis-*/                        # GIS operations
│   └── index.ts
│
└── hii-*/                        # HII module
    └── index.ts
```

---

## File Naming Conventions

### Components

| Type | Convention | Example |
|------|------------|---------|
| Page | PascalCase | `Dashboard.tsx` |
| Component | PascalCase | `QuickCheckWidget.tsx` |
| UI Primitive | kebab-case | `button.tsx` |
| Hook | camelCase + use prefix | `useMapLayers.ts` |
| Context | PascalCase + Context | `SubscriptionContext.tsx` |
| Utility | camelCase | `utils.ts` |

### Edge Functions

| Convention | Example |
|------------|---------|
| kebab-case directory | `enrich-utilities/` |
| index.ts entry | `index.ts` |
| Verb-noun pattern | `fetch-hcad-parcels` |

### Documentation

| Convention | Example |
|------------|---------|
| SCREAMING_SNAKE | `BRAND_GUIDELINES.md` |
| Numbered prefix | `01-EXECUTIVE_SUMMARY.md` |
| Lowercase kebab | `data-flow.md` |

---

## Import Aliases

```typescript
// tsconfig.json path aliases
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

// Usage examples
import { Button } from "@/components/ui/button";
import { useHiiScore } from "@/features/hospitality-hii/hooks/useHiiScore";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
```

---

## Critical Files Reference

### Configuration Files

| File | Purpose | Editable |
|------|---------|----------|
| `vite.config.ts` | Vite build config | Yes |
| `tailwind.config.ts` | Tailwind config | Yes |
| `tsconfig.json` | TypeScript config | No |
| `package.json` | Dependencies | No* |
| `eslint.config.js` | Linting rules | Yes |

*Use `lov-add-dependency` / `lov-remove-dependency` tools

### Entry Points

| File | Purpose |
|------|---------|
| `index.html` | HTML template |
| `src/main.tsx` | React entry |
| `src/App.tsx` | Root component + router |
| `src/index.css` | Global styles + CSS vars |

### Type Definitions

| File | Purpose |
|------|---------|
| `src/integrations/supabase/types.ts` | Database types (auto-generated) |
| `src/vite-env.d.ts` | Vite types |
| `src/features/*/types.ts` | Feature-specific types |
