# Developer Implementation Blueprint — BuildSmarter™ Feasibility

## 0. Conventions

**Stack**: Vite + React + TypeScript, shadcn/ui, TanStack Query, Supabase JS v2, Lucide icons

**File Naming**:
- PascalCase for components
- kebab-case for pages/routes

**Data Fetch**: React Query with cache keys by table + id

**Realtime**: Supabase channels on `applications` (job status)

**Styling**: Tailwind (from shadcn). Tokens mapped from design system.

## 1. Project Structure

```
/
├── src/
│   ├── app.tsx               # Top-level route config
│   ├── components/           # Reusable UI
│   │   ├── ui/               # shadcn/ui components
│   │   ├── application/      # Multi-step form
│   │   ├── sections/         # Homepage sections
│   │   ├── map/              # Map-related components
│   │   └── ...
│   ├── lib/                  # Utils, helpers
│   │   ├── utils.ts          # Tailwind merge, cn
│   │   ├── supabase.ts       # Supabase client
│   │   └── ...
│   ├── pages/                # Routes
│   │   ├── application.tsx   # Main form
│   │   ├── report.tsx        # Report viewer
│   │   ├── thank-you.tsx     # Confirmation
│   │   └── ...
│   ├── styles/               # Global CSS
│   │   └── index.css         # Tailwind directives
│   ├── types/                # Shared types
│   │   └── definitions.ts    # ApplicationRecord
│   └── vite-env.d.ts         # Env vars
├── public/                 # Static assets
├── .env                    # Environment variables
├── tailwind.config.ts      # Tailwind config
├── tsconfig.json           # TypeScript config
└── vite.config.ts          # Vite config
```

## 2. Component Architecture

### 2.1 Reusable UI (`src/components/ui/`)

- Leverages shadcn/ui primitives
- Fully typed with TypeScript
- Includes:
  - Buttons
  - Cards
  - Inputs
  - Selects
  - Dialogs
  - Toasts
  - Accordions
  - Progress bars
  - etc.

### 2.2 Application Form (`src/components/application/`)

- Multi-step form using context API
- Includes:
  - ContactStep
  - PropertyStep
  - ReviewStep
  - SubmitButton

### 2.3 Homepage Sections (`src/components/sections/`)

- Reusable sections for landing page
- Includes:
  - Hero
  - Problem
  - Solution
  - InteractiveProcess
  - PackagesPricing
  - FAQ
  - Footer

### 2.4 Map Components (`src/components/map/`)

- Mapbox GL integration
- Includes:
  - MapCanvas
  - MapControls
  - MapLegend
  - MapOverlays

## 3. Data Fetching

### 3.1 React Query

- Used for all API calls
- Automatic caching and background updates
- Custom hooks for each table:
  - `useApplications`
  - `useReports`
  - `useUtilityEndpoints`

### 3.2 Supabase Client

- Initialized in `src/lib/supabase.ts`
- Exposes:
  - `supabase.from('applications').select('*')`
  - `supabase.storage.from('reports').getPublicUrl()`
  - `supabase.auth.user()`

### 3.3 Realtime Updates

- Supabase channels on `applications` table
- Listens for:
  - `INSERT`
  - `UPDATE`
  - `DELETE`
- Updates job status in real-time

## 4. Styling

### 4.1 Tailwind CSS

- Utility-first CSS framework
- Configured in `tailwind.config.ts`
- Uses design system tokens:
  - `primary`
  - `secondary`
  - `accent`
  - `background`
  - `foreground`
  - etc.

### 4.2 CSS Variables

- Defined in `src/styles/index.css`
- Used to map design system tokens to Tailwind
- Supports light and dark modes

### 4.3 Component Styling

- Use `cn()` helper to merge Tailwind classes
- Example:

```tsx
import { cn } from "@/lib/utils";

function Button({ className, children }) {
  return (
    <button className={cn("bg-primary text-primary-foreground", className)}>
      {children}
    </button>
  );
}
```

## 5. Supabase Functions

### 5.1 `/intake`

- Creates a new application record
- Enqueues a job to enrich the data
- Returns the job id

### 5.2 `/generate/:application_id`

- Idempotent function
- Starts enrichment if ready

### 5.3 `/reports/:id(.pdf|.json)`

- Signed Storage URLs

## 6. Code Style

### 6.1 TypeScript

- Strict mode enabled
- All components and functions must be typed
- Use shared types in `src/types/definitions.ts`

### 6.2 Linting

- ESLint and Prettier configured
- Run `npm run lint` and `npm run format` before committing

### 6.3 Git

- Use descriptive commit messages
- Follow the Conventional Commits specification

## 7. Testing

### 7.1 Unit Tests

- Use Jest and React Testing Library
- Write tests for all components and functions

### 7.2 End-to-End Tests

- Use Cypress
- Write tests for all user flows

## 8. Deployment

### 8.1 Vercel

- Deployed to Vercel
- Automatic deployments on push to main

### 8.2 Supabase

- Hosted on Supabase
- Database backups enabled

## 9. API Endpoints

### 9.1 Google Places API

- Used for address autocomplete
- API key stored in Supabase secrets

### 9.2 ArcGIS

- Used for parcel and overlay data
- Public access (no auth required)

### 9.3 OpenFEMA

- Used for floodplain data
- Public access (no auth required)

## 10. Error Handling

### 10.1 Retry Logic

- Exponential backoff for API calls
- Graceful degradation for missing data sources

### 10.2 Error Logging

- Detailed error logging in `jobs_enrichment` table
- User-facing error messages for common failures

## 11. Security

### 11.1 Row-Level Security (RLS)

- Users can only view/update their own applications and reports
- Admin role can view all applications and jobs
- Public read access for anonymous QuickCheck submissions

### 11.2 API Authentication

- Supabase Edge Functions: JWT verification (configurable per function)

## 12. Further Reading

- [shadcn/ui documentation](https://ui.shadcn.com/)
- [TanStack Query documentation](https://tanstack.com/query/latest)
- [Supabase documentation](https://supabase.com/docs)
- [Lucide icons documentation](https://lucide.dev/)
