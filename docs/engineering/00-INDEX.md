# SiteIntel™ Engineering Documentation Hub

> **Version**: 1.0.0 | **Last Updated**: 2025-12-04 | **Status**: Active

## Quick Navigation

| Section | Document | Description |
|---------|----------|-------------|
| A | [Executive Summary](./01-EXECUTIVE_SUMMARY.md) | Current state, rationale, objectives |
| B | [Architecture](./02-ARCHITECTURE.md) | System diagrams, component hierarchy |
| C | [Repository Structure](./03-REPOSITORY_STRUCTURE.md) | Monorepo patterns, folder organization |
| D | [Migration SOP](./04-MIGRATION_SOP.md) | 14-step Lovable → GitHub procedure |
| E | [Codebase Reference](./05-CODEBASE_REFERENCE.md) | File-by-file documentation |
| F | [Coding Standards](./06-CODING_STANDARDS.md) | TypeScript rules, naming conventions |
| G | [Design System](./07-DESIGN_SYSTEM.md) | Colors, typography, shadcn patterns |
| H | [API Layer](./08-API_LAYER.md) | Supabase, edge functions, integrations |
| I | [State Management](./09-STATE_MANAGEMENT.md) | Zustand, React Query, Context |
| J | [CI/CD Pipelines](./10-CICD_PIPELINES.md) | GitHub Actions workflows |
| K | [GitHub Governance](./11-GITHUB_GOVERNANCE.md) | Branching, CODEOWNERS, commits |
| L | [Developer Onboarding](./12-DEVELOPER_ONBOARDING.md) | Setup guide, first PR |
| M | [Risk Analysis](./13-RISK_ANALYSIS.md) | Risks and mitigation playbooks |
| N | [Release Management](./14-RELEASE_MANAGEMENT.md) | SemVer, changelog, rollback |
| O | [Summary](./15-SUMMARY.md) | Conclusions and next steps |

---

## Architecture Overview (ASCII)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SiteIntel™ Platform                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   React     │  │  TanStack   │  │   Zustand   │  │   Shadcn    │ │
│  │   + Vite    │  │   Query     │  │   Store     │  │     UI      │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
│         │                │                │                │        │
│         └────────────────┴────────────────┴────────────────┘        │
│                                  │                                   │
│                          ┌───────▼───────┐                          │
│                          │  Supabase JS  │                          │
│                          │    Client     │                          │
│                          └───────┬───────┘                          │
├──────────────────────────────────┼──────────────────────────────────┤
│                          ┌───────▼───────┐                          │
│                          │ Edge Functions│                          │
│                          │   (53 total)  │                          │
│                          └───────┬───────┘                          │
│         ┌────────────────────────┼────────────────────────┐         │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐  ┌─────▼─────┐  │
│  │  PostgreSQL │  │   Storage   │  │    Auth     │  │  Realtime │  │
│  │  + PostGIS  │  │   Buckets   │  │   (JWT)     │  │  Channels │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│  Google APIs  │       │  ArcGIS/GIS   │       │  FEMA/EPA     │
│  (Places,Geo) │       │  (Parcels)    │       │  (Flood,Env)  │
└───────────────┘       └───────────────┘       └───────────────┘
```

---

## Tech Stack Summary

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 18.3.1 |
| Build | Vite | 5.x |
| Styling | Tailwind CSS | 3.x |
| Components | shadcn/ui | Latest |
| State | Zustand + TanStack Query | 5.x |
| Backend | Supabase | 2.57.4 |
| Database | PostgreSQL + PostGIS | 15.x |
| Maps | MapLibre GL | 4.7.1 |
| Payments | Stripe | Latest |

---

## Getting Started

1. **New Developer?** → Start with [Developer Onboarding](./12-DEVELOPER_ONBOARDING.md)
2. **Understanding Architecture?** → Read [Architecture](./02-ARCHITECTURE.md)
3. **Making Changes?** → Review [Coding Standards](./06-CODING_STANDARDS.md)
4. **Deploying?** → Follow [CI/CD Pipelines](./10-CICD_PIPELINES.md)

---

## Related Documentation

- [Backend Index](../BACKEND_INDEX.md) - Edge functions reference
- [Brand Guidelines](../brand/BRAND_GUIDELINES.md) - Visual design system
- [API Integrations](../api/INTEGRATIONS.md) - External API reference
