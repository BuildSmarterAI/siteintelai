# SiteIntel™ Feasibility Platform

> **AI-Powered Commercial Real Estate Feasibility Intelligence**

SiteIntel™ transforms CRE due diligence from weeks to minutes with automated, lender-ready feasibility reports.

## Features

- **Instant Feasibility Reports** - From address to lender-ready PDF in under 10 minutes
- **Multi-Source Data Integration** - FEMA, EPA, TxDOT, Census, County CAD, and more
- **Census Data Moat** - Proprietary demographics with 6 CRE-optimized indices
- **AI-Powered Analysis** - GPT-4 narrative generation with data citations
- **Kill-Factor Detection** - Automated deal-breaker identification

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| UI Components | shadcn/ui, Radix UI, Framer Motion |
| State | TanStack Query, Zustand |
| Maps | MapLibre GL |
| Backend | Supabase Edge Functions (Deno) |
| Database | PostgreSQL + PostGIS |
| Auth | Supabase Auth |
| Payments | Stripe |
| AI | OpenAI GPT-4 |
| Demographics | BigQuery (Census ACS) |

## Quick Start

```bash
# Clone repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture Overview](./docs/architecture/overview.md) | System design |
| [Census Data Moat](./docs/architecture/CENSUS_DATA_MOAT.md) | Demographics infrastructure |
| [Edge Functions Index](./docs/api/EDGE_FUNCTIONS_INDEX.md) | API reference |
| [Demographics Enrichment](./docs/features/DEMOGRAPHICS_ENRICHMENT.md) | Enrichment pipeline |

## Required Secrets

Configure in Supabase Edge Functions settings:

| Secret | Description |
|--------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 |
| `GOOGLE_MAPS_API_KEY` | Google Maps/Places API |
| `STRIPE_SECRET_KEY` | Stripe payment processing |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `PDFSHIFT_API_KEY` | PDF generation service |
| `BIGQUERY_SERVICE_ACCOUNT_KEY` | BigQuery Census Data Moat |

## Project Structure

```
├── src/
│   ├── components/       # React components
│   ├── pages/           # Route pages
│   ├── hooks/           # Custom hooks
│   └── lib/             # Utilities
├── supabase/
│   ├── functions/       # Edge functions
│   └── migrations/      # Database migrations
├── docs/
│   ├── architecture/    # System design docs
│   ├── api/            # API documentation
│   ├── features/       # Feature docs
│   └── migrations/     # Migration guides
└── etl/                # ETL pipeline scripts
```

## Census Data Moat

SiteIntel's proprietary demographics infrastructure:

- **83+ ACS Variables** - Comprehensive census tract data
- **6 Proprietary Indices** - CRE-optimized metrics
  - Retail Spending Index
  - Workforce Availability Score
  - Growth Potential Index
  - Affluence Concentration
  - Labor Pool Depth
  - Daytime Population Estimate
- **Sub-50ms Lookups** - PostGIS spatial queries
- **Zero API Dependencies** - No Census API rate limits

## Development

**URL**: https://lovable.dev/projects/181e2fa3-f7d7-47d2-805b-e052bf058f4e

### Local Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint
```

### Edge Functions

```bash
# Deploy functions
supabase functions deploy

# Test locally
supabase functions serve
```

## Custom Domain

To connect a custom domain:
1. Navigate to Project > Settings > Domains
2. Click "Connect Domain"
3. Follow DNS configuration instructions

Read more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain)

## License

Proprietary - All rights reserved. See [LICENSE](./LICENSE) for details.
