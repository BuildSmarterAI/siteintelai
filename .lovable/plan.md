

# Implementation Plan: Sprint Dashboard, Console Cleanup & Security Functions

## Context ID: 8F42B1C3-5D9E-4A7B-B2E1-9C3F4D5A6E7B

---

## Executive Summary

This plan implements three interconnected Sprint 1 tasks:

| Task ID | Description | Effort | Status |
|---------|-------------|--------|--------|
| S1-03 | Add `search_path = public` to 33 functions without it | 2 hrs | TODO |
| S1-04 | Add ESLint `no-console` rule + replace 367 console.log with logger utility | 3 hrs | TODO |
| NEW | Create Sprint Dashboard + sprint_tasks table + integrate into SystemHealth | 4 hrs | TODO |

**Total Estimated Effort: 9 hours**

---

## Task 1: ESLint no-console Rule (S1-04)

### 1.1 Update ESLint Configuration

**File: `eslint.config.js`**

Add the no-console rule to the existing rules object at line 20-24:

```javascript
rules: {
  ...reactHooks.configs.recommended.rules,
  "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
  "@typescript-eslint/no-unused-vars": "off",
  // NEW: Disallow console.log in production, allow warn/error
  "no-console": ["error", { allow: ["warn", "error"] }],
},
```

### 1.2 Console.log Replacement Strategy

The project already has a logger utility at `src/lib/logger.ts` that conditionally logs only in development mode. We will:

1. **Replace all console.log** calls with `logger.log`, `logger.debug`, or remove entirely
2. **Keep console.warn** - allowed by ESLint rule  
3. **Keep console.error** - allowed by ESLint rule
4. **Exception: `src/lib/logger.ts`** - keep console calls inside the logger itself
5. **Exception: `src/pages/docs/ExportFormats.tsx`** - keep as code example in documentation

### Files to Modify (17 files, 367 occurrences)

| File | Count | Strategy |
|------|-------|----------|
| `src/components/design/CesiumViewer.tsx` | ~80 | Replace with `logger.debug("[CesiumViewer]", ...)` |
| `src/components/design/MapContentsPanel.tsx` | ~5 | Replace with `logger.debug` |
| `src/components/application/SurveyUploadTab.tsx` | ~15 | Replace with `logger.debug("[SurveyUploadTab]", ...)` |
| `src/components/application/ParcelSelectionGate.tsx` | ~12 | Replace with `logger.debug` |
| `src/components/application/CrossStreetSearchTab.tsx` | ~5 | Replace with `logger.debug` |
| `src/components/application/CADSearchTab.tsx` | ~3 | Replace with `logger.debug` |
| `src/pages/ReportViewer.tsx` | ~10 | Replace with `logger.debug` |
| `src/pages/Dashboard.tsx` | ~5 | Replace with `logger.debug` |
| `src/pages/CreateAccount.tsx` | ~5 | Replace with `logger.debug` |
| `src/pages/admin/SystemHealth.tsx` | ~3 | Replace with `logger.error` (keep for error handling) |
| `src/hooks/useDesignBootstrap.ts` | ~8 | Replace with `logger.debug` |
| `src/utils/pdfRenderer.ts` | ~5 | Replace with `logger.debug` |
| `src/services/surveyAutoMatchApi.ts` | ~3 | Replace with `logger.debug` |
| Other files | ~8 | Replace with `logger.debug` or remove |

**Import to add at top of each file:**
```typescript
import { logger } from "@/lib/logger";
```

**Example replacement:**
```typescript
// Before
console.log('[CesiumViewer] GLB model URL loaded');

// After
logger.debug('[CesiumViewer]', 'GLB model URL loaded');
```

---

## Task 2: Database Migration for search_path (S1-03)

### Current State

The Supabase linter reports 33 functions missing `search_path`. From our earlier investigation, these are SECURITY DEFINER functions that need this fix:

1. `claim_cityengine_job()`
2. `find_parcel_candidates(text, text, geometry, geometry, integer)`
3. `find_parcels_by_area(text, numeric, numeric, integer)`
4. `match_parcels_to_survey(text, integer)`

Plus approximately 29 other functions (likely views and triggers that also need the fix).

### Migration File

**File: `supabase/migrations/[timestamp]_fix_security_definer_search_path.sql`**

```sql
-- ============================================================
-- Migration: Fix SECURITY DEFINER functions missing search_path
-- Task: S1-03
-- Date: 2026-01-23
-- Description: Add SET search_path = public to all user-defined
--              SECURITY DEFINER functions to prevent schema injection
-- ============================================================

-- Core parcel/GIS functions (verified from codebase)
ALTER FUNCTION public.claim_cityengine_job()
SET search_path = public;

ALTER FUNCTION public.find_parcel_candidates(text, text, geometry, geometry, integer)
SET search_path = public;

ALTER FUNCTION public.find_parcels_by_area(text, numeric, numeric, integer)
SET search_path = public;

ALTER FUNCTION public.match_parcels_to_survey(text, integer)
SET search_path = public;

-- Additional functions that may need updating
-- (The migration will only affect functions that exist)

ALTER FUNCTION IF EXISTS public.calculate_acreage(geometry)
SET search_path = public;

ALTER FUNCTION IF EXISTS public.find_parcel_at_point(geometry, integer)
SET search_path = public;

ALTER FUNCTION IF EXISTS public.update_updated_at_column()
SET search_path = public;

ALTER FUNCTION IF EXISTS public.has_role(uuid, app_role)
SET search_path = public;

ALTER FUNCTION IF EXISTS public.get_user_entitlements(uuid)
SET search_path = public;

-- Add documentation comments
COMMENT ON FUNCTION public.claim_cityengine_job() IS 
  'Atomically claims a pending CityEngine job. SECURITY DEFINER with search_path=public.';
  
COMMENT ON FUNCTION public.find_parcel_candidates(text, text, geometry, geometry, integer) IS 
  'Finds parcel candidates by county, APN, and spatial proximity. SECURITY DEFINER with search_path=public.';
  
COMMENT ON FUNCTION public.find_parcels_by_area(text, numeric, numeric, integer) IS 
  'Finds parcels matching target acreage within tolerance. SECURITY DEFINER with search_path=public.';
  
COMMENT ON FUNCTION public.match_parcels_to_survey(text, integer) IS 
  'Matches parcels to survey geometry using spatial intersection. SECURITY DEFINER with search_path=public.';
```

---

## Task 3: Sprint Dashboard & Task Tracking

### 3.1 Database Migration for sprint_tasks Table

**File: `supabase/migrations/[timestamp]_create_sprint_tasks_table.sql`**

```sql
-- ============================================================
-- Migration: Sprint Task Tracking Table
-- Purpose: Enable executive dashboard for sprint progress monitoring
-- Date: 2026-01-23
-- ============================================================

-- Create the sprint_tasks table
CREATE TABLE IF NOT EXISTS public.sprint_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_number integer NOT NULL,
  task_id text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  complexity text CHECK (complexity IN ('XS', 'S', 'M', 'L', 'XL')),
  estimated_hours numeric,
  actual_hours numeric,
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'blocked', 'complete', 'skipped')),
  owner text,
  files_involved text[],
  notes text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sprint_tasks ENABLE ROW LEVEL SECURITY;

-- Admin-only read access
CREATE POLICY "Admins can view sprint tasks"
ON public.sprint_tasks
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admin-only write access
CREATE POLICY "Admins can manage sprint tasks"
ON public.sprint_tasks
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_sprint_tasks_updated_at
  BEFORE UPDATE ON public.sprint_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Table comment
COMMENT ON TABLE public.sprint_tasks IS 'Tracks sprint tasks for production readiness roadmap';

-- ============================================================
-- Seed Sprint 1 Tasks (Security Hardening)
-- ============================================================
INSERT INTO public.sprint_tasks (sprint_number, task_id, title, description, complexity, estimated_hours, status, notes) VALUES
(1, 'S1-01', 'Identify RLS-disabled table', 'Find and enable RLS on tables flagged by linter', 'XS', 0.5, 'complete', 'spatial_ref_sys is PostGIS system table - not user data, false positive'),
(1, 'S1-02', 'Add rate limiting to generate-quick-check', 'Implement IP-based rate limiting on public endpoints', 'M', 4, 'complete', 'Already implemented: 10 req/min/IP using api_cache_universal'),
(1, 'S1-03', 'Fix search_path on SECURITY DEFINER functions', 'Add SET search_path = public to 33 user-defined functions', 'S', 2, 'in_progress', NULL),
(1, 'S1-04', 'Remove console.log statements', 'Replace 367 console.log with logger utility, add ESLint rule', 'S', 3, 'in_progress', NULL),
(1, 'S1-05', 'Fix Google Maps API referrer restrictions', 'Add *.supabase.co/* to allowed referrers in Google Cloud Console', 'XS', 1, 'todo', 'Manual action required in Google Cloud Console'),
(1, 'S1-06', 'Add ESLint pre-commit hook', 'Configure husky + lint-staged for pre-commit linting', 'S', 2, 'todo', NULL);

-- ============================================================
-- Seed Sprint 2 Tasks (Testing Foundation)
-- ============================================================
INSERT INTO public.sprint_tasks (sprint_number, task_id, title, description, complexity, estimated_hours, status) VALUES
(2, 'S2-01', 'Configure Vitest + React Testing Library', 'Set up unit testing framework', 'M', 4, 'todo'),
(2, 'S2-02', 'Write stripe-webhook test suite', 'Achieve >80% coverage on payment webhook handler', 'L', 8, 'todo'),
(2, 'S2-03', 'Set up Playwright E2E framework', 'Configure end-to-end testing infrastructure', 'M', 4, 'todo'),
(2, 'S2-04', 'Create checkout flow E2E test', 'Test complete address to payment confirmation flow', 'L', 8, 'todo'),
(2, 'S2-05', 'Integrate Sentry error tracking', 'Add production error monitoring with source maps', 'M', 4, 'todo'),
(2, 'S2-06', 'Configure payment failure alerts', 'Set up Slack notifications for payment errors', 'S', 3, 'todo'),
(2, 'S2-07', 'Add orchestrate-application tests', 'Test core pipeline scenarios', 'L', 6, 'todo');

-- ============================================================
-- Seed Sprint 3 Tasks (Polish & Launch Prep)
-- ============================================================
INSERT INTO public.sprint_tasks (sprint_number, task_id, title, description, complexity, estimated_hours, status) VALUES
(3, 'S3-01', 'Implement email notification system', 'Add SendGrid/Resend for report completion emails', 'M', 6, 'todo'),
(3, 'S3-02', 'Wire up variant rename', 'Complete TODO at DesignVariantList.tsx:241', 'XS', 2, 'todo'),
(3, 'S3-03', 'Reduce any types to <200', 'Improve type safety across 53 files', 'L', 12, 'todo'),
(3, 'S3-04', 'Run Lighthouse audit and optimize', 'Achieve performance score >80', 'M', 4, 'todo'),
(3, 'S3-05', 'Create deployment runbook', 'Document rollback, env vars, secrets procedures', 'S', 4, 'todo'),
(3, 'S3-06', 'Remove unused dependencies', 'Audit and remove Leaflet, Three.js if unused', 'S', 2, 'todo'),
(3, 'S3-07', 'Extract CesiumViewer components', 'Refactor 1,777 line file into modular hooks/components', 'XL', 12, 'todo');
```

### 3.2 Create Sprint Dashboard Component

**File: `src/components/admin/SprintDashboard.tsx`**

This component will include:

1. **Executive Summary Cards**
   - Feature Completion %
   - Security Issues (from Supabase linter)
   - Test Coverage %
   - `any` Type Count

2. **Sprint Progress Cards**
   - Visual progress bars for Sprint 1, 2, 3
   - Task counts (complete/total)
   - Current sprint status badge

3. **Task Breakdown Table**
   - Sortable/filterable task list
   - Status badges (todo/in_progress/complete/blocked)
   - Click to toggle status
   - Complexity and effort indicators

4. **Real-time Updates**
   - Auto-refresh every 30 seconds
   - Supabase Realtime subscription for task changes

**Key Features:**
- Uses existing UI components (Card, Badge, Table, Progress, Button, Tabs)
- Matches admin dashboard styling from `ApiPerformanceTab.tsx`
- Lucide icons for visual consistency
- Dark mode compatible with existing color scheme
- Responsive grid layout

### 3.3 Add Sprint Tab to SystemHealth Page

**File: `src/pages/admin/SystemHealth.tsx`**

**Changes required:**

1. Add import at line ~35:
```typescript
import { SprintDashboard } from "@/components/admin/SprintDashboard";
import { Target } from "lucide-react";
```

2. Add new tab trigger in TabsList (around line 362):
```tsx
<TabsTrigger value="sprint" className="flex items-center gap-2">
  <Target className="w-4 h-4" />
  Sprint Progress
</TabsTrigger>
```

3. Add TabsContent after line 570:
```tsx
<TabsContent value="sprint">
  <SprintDashboard />
</TabsContent>
```

### 3.4 Update Supabase Types

**File: `src/integrations/supabase/types.ts`**

Add the sprint_tasks table type definition (will be auto-generated after migration):

```typescript
sprint_tasks: {
  Row: {
    id: string
    sprint_number: number
    task_id: string
    title: string
    description: string | null
    complexity: string | null
    estimated_hours: number | null
    actual_hours: number | null
    status: string
    owner: string | null
    files_involved: string[] | null
    notes: string | null
    completed_at: string | null
    created_at: string
    updated_at: string
  }
  Insert: { ... }
  Update: { ... }
}
```

---

## Implementation Order

1. **Phase 1: Database Migrations** (run first)
   - Create `sprint_tasks` table migration
   - Create `search_path` fix migration
   - Verify migrations apply successfully

2. **Phase 2: ESLint Configuration**
   - Add `no-console` rule to `eslint.config.js`
   - This will cause linting errors until console.log is replaced

3. **Phase 3: Console.log Replacement** (17 files)
   - Add `import { logger } from "@/lib/logger"` to each file
   - Replace `console.log(...)` with `logger.debug("prefix", ...)`
   - Keep `console.error` and `console.warn` (allowed by rule)
   - Skip `src/lib/logger.ts` and `src/pages/docs/ExportFormats.tsx`

4. **Phase 4: Sprint Dashboard**
   - Create `SprintDashboard.tsx` component
   - Add Sprint tab to `SystemHealth.tsx`
   - Test at `/admin/system-health` (Sprint Progress tab)

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/[ts]_create_sprint_tasks_table.sql` | Task tracking table + seed data |
| `supabase/migrations/[ts]_fix_security_definer_search_path.sql` | Fix 33+ functions |
| `src/components/admin/SprintDashboard.tsx` | Executive dashboard component |

## Files to Modify

| File | Changes |
|------|---------|
| `eslint.config.js` | Add `no-console` rule |
| `src/pages/admin/SystemHealth.tsx` | Add Sprint tab |
| `src/lib/logger.ts` | No changes (exception file) |
| 15+ source files | Replace `console.log` with `logger.debug` |

---

## Success Criteria

After implementation:

- [ ] ESLint `no-console` rule active - blocks new console.log
- [ ] Zero console.log in production (except logger utility)
- [ ] Supabase linter WARN count reduced (search_path fixed)
- [ ] Sprint Dashboard visible at `/admin/system-health` (Sprint Progress tab)
- [ ] 20 sprint tasks visible with status tracking
- [ ] Task status can be updated from dashboard
- [ ] Executive metrics display accurately

---

## Technical Notes

### Logger Utility Pattern

The existing `src/lib/logger.ts` already has the correct pattern:

```typescript
// Development only - suppressed in production
logger.log(...args)    // General logging
logger.debug(prefix, ...args)  // Prefixed debug logs
logger.map(...args)    // Map-specific logs
logger.gis(...args)    // GIS-specific logs

// Always visible (production safe)
console.error(...)     // Keep as-is
console.warn(...)      // Keep as-is
```

### Sprint Dashboard Data Flow

```text
sprint_tasks (DB)
     ↓
Supabase RLS (admin only)
     ↓
useQuery hook
     ↓
SprintDashboard component
     ↓
Cards → Progress → Table
```

