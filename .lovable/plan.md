
# Sprint Plans Documentation & Executive Dashboard Implementation

## Objective
Create comprehensive sprint documentation and an executive-level Sprint Dashboard in the admin panel to track progress on the 3-sprint roadmap for production readiness.

---

## Part 1: Sprint Documentation (Markdown Files)

### Files to Create

#### 1. `docs/sprints/README.md` - Sprint Overview
Contains the executive summary, current status metrics, and links to individual sprint docs.

#### 2. `docs/sprints/sprint-1-security.md` - Security Hardening
**Duration:** Days 1-3  
**Status:** IN PROGRESS

| Task ID | Task | Complexity | Hours | Status |
|---------|------|------------|-------|--------|
| S1-01 | ~~Identify RLS-disabled table~~ | XS | 0.5 | ✅ COMPLETE (spatial_ref_sys is PostGIS system table - not user data) |
| S1-02 | ~~Add rate limiting to generate-quick-check~~ | M | 4 | ✅ COMPLETE (already implemented with 10 req/min/IP) |
| S1-03 | Fix search_path on 4 SECURITY DEFINER functions | S | 2 | ⬜ TODO |
| S1-04 | Remove console.log statements (367 instances) | S | 2 | ⬜ TODO |
| S1-05 | Fix Google Maps API referrer restrictions | XS | 1 | ⬜ TODO |
| S1-06 | Add ESLint pre-commit hook | S | 2 | ⬜ TODO |

**Updated Status:** 2 of 6 tasks already complete!

#### 3. `docs/sprints/sprint-2-testing.md` - Testing Foundation
**Duration:** Days 4-8

| Task ID | Task | Complexity | Hours |
|---------|------|------------|-------|
| S2-01 | Configure Vitest + React Testing Library | M | 4 |
| S2-02 | Write stripe-webhook test suite (>80% coverage) | L | 8 |
| S2-03 | Set up Playwright E2E framework | M | 4 |
| S2-04 | Create checkout flow E2E test | L | 8 |
| S2-05 | Integrate Sentry error tracking | M | 4 |
| S2-06 | Configure payment failure alerts | S | 3 |
| S2-07 | Add orchestrate-application tests | L | 6 |

#### 4. `docs/sprints/sprint-3-polish.md` - Launch Preparation
**Duration:** Days 9-14

| Task ID | Task | Complexity | Hours |
|---------|------|------------|-------|
| S3-01 | Implement email notification system | M | 6 |
| S3-02 | Wire up variant rename (TODO:241) | XS | 2 |
| S3-03 | Reduce `any` types to <200 | L | 12 |
| S3-04 | Run Lighthouse audit and optimize | M | 4 |
| S3-05 | Create deployment runbook | S | 4 |
| S3-06 | Remove unused dependencies | S | 2 |
| S3-07 | Extract CesiumViewer components | XL | 12 |

---

## Part 2: Executive Dashboard Component

### New File: `src/components/admin/SprintDashboard.tsx`

A comprehensive dashboard showing:

```text
┌─────────────────────────────────────────────────────────────────┐
│                    SPRINT PROGRESS DASHBOARD                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Sprint 1     │  │ Sprint 2     │  │ Sprint 3     │          │
│  │ Security     │  │ Testing      │  │ Polish       │          │
│  │ ████████░░   │  │ ░░░░░░░░░░   │  │ ░░░░░░░░░░   │          │
│  │ 33% (2/6)    │  │ 0% (0/7)     │  │ 0% (0/7)     │          │
│  │ IN PROGRESS  │  │ NOT STARTED  │  │ NOT STARTED  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                      EXECUTIVE METRICS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Feature Completion    Security Vulns    Test Coverage   any   │
│  ████████████████░░░   ██░░░░░░░░░░░░░   ░░░░░░░░░░░░░   805   │
│       85%                  4/34 fixed         0%                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                       TASK BREAKDOWN                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  S1-01 [✅] Identify RLS-disabled table                         │
│  S1-02 [✅] Add rate limiting to generate-quick-check           │
│  S1-03 [⬜] Fix search_path on 4 SECURITY DEFINER functions     │
│  S1-04 [⬜] Remove console.log statements                       │
│  S1-05 [⬜] Fix Google Maps API referrer restrictions           │
│  S1-06 [⬜] Add ESLint pre-commit hook                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Features:
- **Real-time metrics** from Supabase linter
- **Visual progress bars** for each sprint
- **Task checklist** with status icons
- **Risk indicators** with severity badges
- **Estimated completion dates**
- **Click to expand** task details

---

## Part 3: Database Migration for Task Tracking

Create table `sprint_tasks` to track progress:

```sql
CREATE TABLE public.sprint_tasks (
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

ALTER TABLE public.sprint_tasks ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage sprint tasks"
ON public.sprint_tasks
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));
```

---

## Part 4: Priority 1 Security Fixes (Remaining)

### Task S1-03: Fix search_path on 4 SECURITY DEFINER functions

```sql
-- Migration to fix search_path on user-defined SECURITY DEFINER functions
ALTER FUNCTION public.claim_cityengine_job()
SET search_path = public;

ALTER FUNCTION public.find_parcel_candidates(text, text, geometry, geometry, integer)
SET search_path = public;

ALTER FUNCTION public.find_parcels_by_area(text, numeric, numeric, integer)
SET search_path = public;

ALTER FUNCTION public.match_parcels_to_survey(text, integer)
SET search_path = public;
```

### Task S1-04: Console.log Removal Strategy
- Add ESLint rule: `"no-console": ["error", { "allow": ["warn", "error"] }]`
- Run lint fix across codebase
- Manual review of remaining warnings/errors

### Task S1-05: Google Maps API Fix
**Manual Action Required:**
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Edit the Maps API key
3. Add `*.supabase.co/*` to Application restrictions → HTTP referrers

### Task S1-06: Pre-commit Hook
Add husky + lint-staged:
```json
{
  "devDependencies": {
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "git add"]
  }
}
```

---

## Implementation Order

1. **Create documentation files** (docs/sprints/*)
2. **Create sprint_tasks table** (database migration)
3. **Build SprintDashboard component**
4. **Add Sprint Dashboard tab** to SystemHealth.tsx
5. **Execute S1-03** (search_path migration)
6. **Execute S1-04** (console.log removal)
7. **Manual: S1-05** (Google Cloud Console)
8. **Execute S1-06** (pre-commit hooks)

---

## Files to Create/Modify

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `docs/sprints/README.md` | Sprint overview |
| CREATE | `docs/sprints/sprint-1-security.md` | Sprint 1 tasks |
| CREATE | `docs/sprints/sprint-2-testing.md` | Sprint 2 tasks |
| CREATE | `docs/sprints/sprint-3-polish.md` | Sprint 3 tasks |
| CREATE | `src/components/admin/SprintDashboard.tsx` | Dashboard component |
| MODIFY | `src/pages/admin/SystemHealth.tsx` | Add Sprint tab |
| CREATE | `supabase/migrations/XXX_sprint_tasks_table.sql` | Task tracking |
| CREATE | `supabase/migrations/XXX_fix_search_path.sql` | Security fix |
| MODIFY | `.eslintrc.cjs` or `eslint.config.js` | Add no-console rule |
| CREATE | `.husky/pre-commit` | Pre-commit hook |

---

## Success Criteria

After implementation:
- [ ] Sprint Dashboard accessible at `/admin/system-health` (Sprint tab)
- [ ] All sprint tasks visible with real-time status
- [ ] Supabase linter shows 0 search_path warnings on user functions
- [ ] ESLint blocks console.log in new code
- [ ] Documentation serves as single source of truth for completion

---

## Estimated Total Effort
- Documentation: 2 hours
- Dashboard Component: 4 hours  
- Database Migration: 1 hour
- Security Fixes (S1-03, S1-04, S1-06): 4 hours
- **Total: ~11 hours**

