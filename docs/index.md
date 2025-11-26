# SiteIntel™ Feasibility Documentation

Welcome to the SiteIntel™ Feasibility platform documentation. This guide will help you understand, develop, and deploy the AI-powered commercial real estate feasibility analysis system.

## Quick Links

| Section | Description |
|---------|-------------|
| [Quickstart Guide](./guides/quickstart.md) | Get up and running in 5 minutes |
| [Environment Setup](./guides/environment-setup.md) | Configure your development environment |
| [Architecture Overview](./architecture/overview.md) | System design and components |
| [API Reference](./api/edge-functions.md) | Edge function documentation |
| [Database Schema](./architecture/database-schema.md) | Data models and relationships |

## What is SiteIntel™?

SiteIntel™ Feasibility is an AI/GIS SaaS platform that transforms commercial real estate due diligence from weeks of manual analysis into minutes of automated intelligence. The platform generates lender-ready feasibility reports by aggregating data from:

- **County Appraisal Districts** (HCAD, FBCAD, MCAD)
- **FEMA Flood Data** (NFHL, OpenFEMA)
- **TxDOT Traffic Counts** (AADT)
- **EPA Environmental Data** (ECHO facilities)
- **USFWS Wetlands Inventory** (NWI)
- **Google Places & Geocoding**
- **Census Demographics**

## Platform Architecture

```mermaid
graph TB
    subgraph Frontend
        UI[React App]
        Map[MapLibre Canvas]
    end
    
    subgraph Edge Layer
        EF[Supabase Edge Functions]
        Auth[Supabase Auth]
    end
    
    subgraph Data Layer
        DB[(PostgreSQL + PostGIS)]
        Storage[Supabase Storage]
    end
    
    subgraph External APIs
        GIS[ArcGIS Services]
        FEMA[OpenFEMA]
        EPA[EPA ECHO]
        Google[Google APIs]
        TxDOT[TxDOT AADT]
    end
    
    UI --> EF
    Map --> EF
    EF --> Auth
    EF --> DB
    EF --> Storage
    EF --> GIS
    EF --> FEMA
    EF --> EPA
    EF --> Google
    EF --> TxDOT
```

## Key Features

### 🗺️ Geospatial Intelligence
- Parcel boundary detection
- Flood zone overlay analysis
- Wetlands identification
- Traffic exposure scoring

### 🤖 AI-Powered Analysis
- GPT-4 narrative generation
- Feasibility scoring (A-F grades)
- Risk assessment
- Market context analysis

### 📊 Lender-Ready Reports
- Professional PDF generation
- Data citations and timestamps
- Compliance-ready formatting
- Downloadable assets

### 💳 Flexible Pricing
- Free QuickCheck analysis
- Pay-per-report ($795)
- Pro subscription ($1,950/mo)

## Documentation Structure

```
docs/
├── index.md                    # This file
├── guides/
│   ├── quickstart.md          # Getting started
│   ├── environment-setup.md   # Dev environment
│   └── deployment.md          # Deployment guide
├── api/
│   ├── edge-functions.md      # Edge function reference
│   └── external-integrations.md # External API docs
├── architecture/
│   ├── overview.md            # System architecture
│   ├── data-flow.md           # Data pipeline
│   └── database-schema.md     # Database design
└── security/
    └── rls-policies.md        # Row-level security
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| State | TanStack Query, Zustand |
| Maps | MapLibre GL, Leaflet |
| Backend | Supabase Edge Functions (Deno) |
| Database | PostgreSQL + PostGIS |
| Auth | Supabase Auth |
| Payments | Stripe |
| AI | OpenAI GPT-4 |

## Getting Help

- **Documentation Issues**: Open an issue on GitHub
- **Feature Requests**: Use GitHub Discussions
- **Security Concerns**: Email security@siteintel.dev
- **Support**: support@siteintel.dev

---

**Next**: [Quickstart Guide →](./guides/quickstart.md)
