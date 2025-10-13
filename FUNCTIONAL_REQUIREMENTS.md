# Functional Requirements Blueprint — BuildSmarter™ Feasibility

## 1. Document Purpose & Scope

This blueprint is the master functional specification for BuildSmarter™ Feasibility, an AI/GIS SaaS that ingests authoritative parcel, zoning, floodplain, utilities, environmental, traffic and demographic datasets and produces lender-ready feasibility reports (PDF + JSON).

### Key Objectives
- Deliver a 30-60 second, automated feasibility report flow with lender-friendly structure and citations
- Texas-first coverage with scalable data integrations (ArcGIS/CADs, FEMA, TxDOT, EPA, USFWS, USDA, Census/BLS)
- Interoperability via OData v4.01 (read-only) for enterprise/partner queries

## 2. System Modules Overview

| Module | Description | Key Dependencies |
|--------|-------------|------------------|
| M1. Data Acquisition Engine | Geocode, parcel select, spatial overlays, and attribute pulls from ArcGIS/MapServer & Open APIs; normalize to canonical schema | ArcGIS FeatureServer/MapServer query, Google Geocoding, OpenFEMA, TxDOT, EPA, USFWS, USDA, Census/BLS |
| M2. AI Feasibility Engine | Transform normalized data → JSON insights; compute feasibility score; generate narrative with citations | LLM pipeline, JSON schema validation, Supabase Edge Functions |
| M3. Report Generation Engine | Create branded PDF & JSON with tables, maps, and "Data Sources" appendix | PDFKit/ReportLab, Supabase Storage |
| M4. User & Subscription Management | AuthN/AuthZ, credit usage, SaaS tiers | Supabase Auth, Stripe billing, audit logs |
| M5. OData API Gateway | Read-only, standards-based access to reports for partners; supports $filter/$select/$orderby/$top/$skip and $compute | OData v4.01 implementation |
| M6. Data Caching & Validation Layer | 30-day parcel overlay cache; schema checks; retry policy | Supabase functions + JSON schema validators |
| M7. Monitoring & Error Handling | Uptime, latency, error alerts, failure budget; audit of external calls | Supabase Logs/OpenTelemetry/Sentry |

## 3. Functional Requirements by Module

### M1. Data Acquisition Engine

**Scope**: Input acceptance (address/APN/lat-lon), geocoding, parcel selection, overlay joins (flood, utilities, environmental, traffic, demographics), normalization to applications table (Supabase).

| Req ID | Requirement | Description | Dependencies |
|--------|-------------|-------------|--------------|
| FR-001 | Accept inputs | Address, parcel ID, or coordinates; validate formats | UI intake; Supabase Edge Function |
| FR-002 | Geocode | Use Google Geocoding → geo_lat, geo_lng, formatted_address, place_id | Google Geocoding API |
| FR-003 | Parcel intersect | Query Unified Parcels (ID:7) to select parcel intersecting input query point; prefer centroid hit | ArcGIS Unified Parcels layer |
| FR-004 | County CAD enrichment | Pull attributes from HCAD Parcels (ID:4) and FBCAD (ID:5) as available | HCAD/FBCAD FeatureServer |
| FR-005 | Flood/NFIP context | Fetch FEMA NFHL/NFIP signals and regional disaster context for narrative | OpenFEMA datasets & NFHL; paging via $top/$skip |
| FR-006 | Utilities overlay | Query StormwaterUtilities MapServer and Force Main (ID:24) for infrastructure proximity | City utilities MapServer endpoints |
| FR-007 | Environmental sites | EPA FRS facilities, USFWS wetlands, USDA SSURGO soil data | EPA FRS API, USFWS Wetlands Mapper, USDA Web Soil Survey |
| FR-008 | Traffic exposure | TxDOT AADT nearest segment (roadway name, year, AADT value, distance in feet) | TxDOT Open Data Portal |
| FR-009 | Demographics/Market | Census ACS 5-year estimates (population, income, households within 1/3/5 mi radii) | Census API |
| FR-010 | Employment clusters | BLS QCEW for industry employment within drive-time polygons | BLS QCEW API |
| FR-011 | Data normalization | Persist canonical fields to applications table; store raw API responses in enrichment_raw (JSONB) | Supabase database |
| FR-012 | Error handling | Retry failed API calls with exponential backoff; log errors to jobs_enrichment | Supabase Edge Functions |
| FR-013 | Caching | Cache parcel overlay results for 30 days to reduce API costs | Supabase database + timestamp checks |

### M2. AI Feasibility Engine

**Scope**: Transform normalized data into structured JSON insights, calculate feasibility score (0-100), generate executive summary and section narratives with data citations.

| Req ID | Requirement | Description | Dependencies |
|--------|-------------|-------------|--------------|
| FR-101 | Schema validation | Validate AI output against buildsmarter_feasibility_schema.json | JSON schema validator |
| FR-102 | Feasibility scoring | Compute 0-100 score based on weighted factors: zoning compatibility, flood risk, utility availability, market strength | AI model + scoring algorithm |
| FR-103 | Executive summary | Generate 3-5 paragraph summary highlighting key findings, risks, and opportunities | Google Gemini 2.5 Flash |
| FR-104 | Property overview | Parcel details, ownership, legal description, acreage | Applications table data |
| FR-105 | Zoning analysis | Current zoning, permitted uses, setbacks, height limits, overlay districts | Applications table data |
| FR-106 | Utilities assessment | Water, sewer, storm, power, fiber availability and capacity | Applications table data |
| FR-107 | Market analysis | Demographics, traffic counts, comparable development activity | Applications table data |
| FR-108 | Cost estimates | Preliminary development cost ranges based on project type and size | AI model + cost database |
| FR-109 | Schedule projection | Estimated timeline from entitlements through construction | AI model + historical data |
| FR-110 | Highest & best use | Recommended development scenarios based on market + constraints | AI analysis |
| FR-111 | Traffic analysis | AADT, access points, congestion levels, visibility | Applications table data |
| FR-112 | Conclusion | Summary of go/no-go recommendation with confidence level | AI synthesis |
| FR-113 | Citations | Include data source names, timestamps, and lastDataSetRefresh where available | Metadata from API responses |

### M3. Report Generation Engine

**Scope**: Create branded PDF and JSON outputs with maps, tables, charts, and data sources appendix.

| Req ID | Requirement | Description | Dependencies |
|--------|-------------|-------------|--------------|
| FR-201 | PDF generation | Generate lender-ready PDF with BuildSmarter branding | PDF rendering library |
| FR-202 | JSON output | Provide structured JSON adhering to schema for API consumption | JSON serialization |
| FR-203 | Map rendering | Include parcel boundary, flood zones, utilities overlays | GIS rendering library |
| FR-204 | Tables & charts | Present data in formatted tables; include score gauge visualization | Report templates |
| FR-205 | Data sources appendix | List all external APIs called with timestamps and dataset versions | Metadata tracking |
| FR-206 | Signed URLs | Generate time-limited signed URLs for PDF/JSON downloads | Supabase Storage |
| FR-207 | Storage | Store reports in Supabase Storage with proper naming convention | Supabase Storage buckets |
| FR-208 | Versioning | Track report versions if regenerated for same application | Reports table versioning |

### M4. User & Subscription Management

**Scope**: Authentication, authorization, subscription tiers, credit tracking, billing integration.

| Req ID | Requirement | Description | Dependencies |
|--------|-------------|-------------|--------------|
| FR-301 | User registration | Email/password signup with email verification | Supabase Auth |
| FR-302 | Social auth | Google OAuth integration | Supabase Auth providers |
| FR-303 | User profiles | Store user details (name, company, phone) in profiles table | Profiles table |
| FR-304 | Role-based access | Implement user roles (user, admin) with RLS policies | user_roles table + has_role() function |
| FR-305 | Subscription tiers | Free, Starter, Professional, Enterprise tiers with feature gates | subscription_tiers table |
| FR-306 | Credit tracking | Track QuickCheck and Full Report credits per user | user_subscriptions table |
| FR-307 | Usage logging | Log every report generation with cost in credits_usage table | credits_usage table |
| FR-308 | Billing integration | Stripe integration for subscription payments | Stripe API |
| FR-309 | Anonymous submissions | Allow public QuickCheck submissions without login | RLS policies |
| FR-310 | Admin dashboard | View all applications, jobs, and users | Admin UI + RLS policies |

### M5. OData API Gateway

**Scope**: Read-only OData v4.01 endpoint for enterprise partners to query reports and applications data.

| Req ID | Requirement | Description | Dependencies |
|--------|-------------|-------------|--------------|
| FR-401 | OData metadata | Expose $metadata endpoint describing entity schema | OData service implementation |
| FR-402 | $filter support | Allow filtering on key fields (city, county, zoning_code, etc.) | Query parser |
| FR-403 | $select support | Allow projection to specific fields only | Query parser |
| FR-404 | $orderby support | Allow sorting by any field | Query parser |
| FR-405 | $top/$skip support | Enable pagination for large result sets | Query parser |
| FR-406 | $count support | Return total count of matching records | Query parser |
| FR-407 | $compute support | Support calculated fields in queries | OData v4.01 spec |
| FR-408 | Authentication | API key-based authentication for partner access | API key management |
| FR-409 | Rate limiting | Enforce request limits per API key | Rate limiter |
| FR-410 | Read-only | Prevent any write operations via OData endpoint | Middleware enforcement |

### M6. Data Caching & Validation Layer

**Scope**: Performance optimization via caching; data quality checks; retry mechanisms.

| Req ID | Requirement | Description | Dependencies |
|--------|-------------|-------------|--------------|
| FR-501 | Parcel cache | Cache parcel lookup results for 30 days | Supabase database |
| FR-502 | Overlay cache | Cache overlay query results for 30 days | Supabase database |
| FR-503 | Cache invalidation | Manual cache refresh option for admin users | Admin UI |
| FR-504 | Schema validation | Validate all API responses against expected schemas | JSON schema validators |
| FR-505 | Data completeness | Flag missing critical fields in data_flags array | Validation functions |
| FR-506 | Retry logic | Retry failed API calls up to 3 times with exponential backoff | Edge function logic |
| FR-507 | Circuit breaker | Temporarily disable failing external APIs | Service health tracking |
| FR-508 | Fallback sources | Use alternative data sources when primary source fails | Multi-source configuration |

### M7. Monitoring & Error Handling

**Scope**: System health monitoring, error tracking, performance metrics, alerting.

| Req ID | Requirement | Description | Dependencies |
|--------|-------------|-------------|--------------|
| FR-601 | Job logging | Log all enrichment jobs to jobs_enrichment table | Supabase database |
| FR-602 | Error tracking | Capture detailed error messages and stack traces | Sentry integration |
| FR-603 | Performance metrics | Track API latency, report generation time | OpenTelemetry |
| FR-604 | Uptime monitoring | Monitor external API availability | Service health checks |
| FR-605 | Cost tracking | Monitor API usage and associated costs | Usage analytics |
| FR-606 | Alerting | Alert on job failures, API errors, quota limits | Monitoring service |
| FR-607 | Audit trail | Log all API calls with timestamps and responses | enrichment_raw table |
| FR-608 | User analytics | Track user behavior and feature usage | Analytics platform |
| FR-609 | Report analytics | Aggregate statistics on report types and scores | Analytics queries |
| FR-610 | SLA monitoring | Track success rate and latency against SLA targets | Metrics dashboard |

## 4. Non-Functional Requirements

### Performance
- Report generation: ≤60 seconds end-to-end
- API response time: ≤2 seconds for intake
- Concurrent users: Support 100+ simultaneous report generations

### Reliability
- Uptime: 99.5% availability
- Data accuracy: 95%+ match with source datasets
- Error recovery: Automatic retry on transient failures

### Security
- Encryption: TLS 1.3 for all API calls
- Authentication: JWT-based with Supabase Auth
- Authorization: Row-Level Security on all tables
- API keys: Secure storage in Supabase Secrets
- Data privacy: GDPR compliant; user data isolation

### Scalability
- Support 10,000+ reports per month
- Horizontal scaling of Edge Functions
- Database optimization for large datasets
- CDN for static assets and PDFs

### Usability
- Mobile-responsive design
- Accessible (WCAG 2.1 AA)
- Clear error messages
- Progress indicators for long-running operations
- Intuitive navigation and information architecture

## 5. Acceptance Criteria

Each functional requirement must meet the following acceptance criteria:
- Unit tests with ≥80% coverage
- Integration tests for API endpoints
- End-to-end tests for critical user flows
- Documentation complete and accurate
- Code review approved
- QA testing passed
- Performance benchmarks met
- Security review completed
