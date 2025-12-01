# Functional Requirements Blueprint — BuildSmarter™ Feasibility

## 1. Document Purpose & Scope

This blueprint is the master functional specification for BuildSmarter™ Feasibility, an AI/GIS SaaS that ingests authoritative parcel, zoning, floodplain, utilities, environmental, traffic and demographic datasets and produces lender-ready feasibility reports (PDF + JSON).

### Key Objectives
- Deliver a 30-60 second, automated feasibility report flow with lender-friendly structure and citations
- Texas-first coverage with scalable data integrations (ArcGIS/CADs, FEMA, TxDOT, EPA, USFWS, USDA, Census/BLS)
- Interoperability via OData v4.01 (read-only) for enterprise/partner queries

## 2. Core Functionality

### 2.1 Intake & Geocoding
- Accept address, APN, or lat/lon as input
- Geocode via Google Places API (validated address + place_id)
- Auto-suggest addresses with fuzzy matching
- Handle ambiguous inputs (e.g., multiple parcels at address)

### 2.2 Parcel Selection & CAD Enrichment
- Intersect geocode centroid with Unified Parcels (master layer)
- Fallback: County CAD layers (HCAD, FBCAD, MCAD)
- Extract APN, owner, acreage, values, legal description
- Expose CAD attributes in normalized schema

### 2.3 Overlay Queries (GIS)
- Floodplain: FEMA NFHL/OpenFEMA (zone, BFE)
- Utilities: City stormwater/force mains
- Environmental: EPA FRS, USFWS Wetlands, USDA SSURGO Soils
- Traffic: TxDOT AADT (nearest segment + year + distance)
- Demographics/Employment: Census ACS, BLS QCEW

### 2.4 AI Report Generation
- Normalized schema → AI JSON (strict schema)
- Feasibility Score (0–100) with citations
- Executive Summary (≤ 120 words)
- Property Overview, Zoning, Utilities, Market, Costs, Schedule, HBU, Traffic, Conclusion
- JSON Schema validation (2020-12)

### 2.5 PDF Export
- Compositor with maps/tables
- "Data Sources & Timestamps" appendix
- Signed URLs for secure access

### 2.6 OData API
- Read-only OData v4.01 facade
- Enterprise/partner queries
- $filter, $select, $orderby, $compute

## 3. Data Sources & Integrations

### 3.1 GIS Data
- **Unified Parcels**: Master parcel fabric (statewide)
- **County CAD**: HCAD, FBCAD, MCAD (attributes)
- **City Utilities**: Stormwater, force mains
- **TxDOT**: AADT traffic counts

### 3.2 Open Data
- **FEMA**: NFHL, OpenFEMA datasets
- **EPA**: FRS sites
- **USFWS**: Wetlands
- **USDA**: SSURGO soils
- **Census**: ACS demographics
- **BLS**: QCEW employment

### 3.3 APIs
- **Google Places API**: Geocoding
- **ArcGIS FeatureServer/MapServer**: GIS layers

## 4. AI & Scoring Logic

### 4.1 Feasibility Score
- Weighted sum of factors (zoning, flood, utilities, traffic, demographics)
- Weights configurable per jurisdiction/property type
- Score bands (A/B/C/D) based on thresholds

### 4.2 AI Narrative
- Concise, lender-friendly prose
- Citations to source datasets
- Risk/mitigation analysis
- Constraints/data gaps

### 4.3 JSON Schema
- Strict schema for report output
- Validation on every AI pass
- Fallback to minimal viable JSON

## 5. User Interface (UI)

### 5.1 Intake Form
- Address/APN/lat-lon input
- Auto-suggest addresses
- Map preview
- Property type selector

### 5.2 Progress Bar
- Realtime updates via Supabase channel
- Status: Queued, Enriching, AI, Rendering, Complete, Error
- Estimated time remaining

### 5.3 Report Viewer
- PDF/JSON download
- Map overlays (flood, utilities, traffic)
- Source/citation appendix

## 6. Security Requirements

### 6.1 Authentication
- User accounts (email/password)
- Social login (Google, etc.)
- API keys for OData

### 6.2 Authorization
- Row-level security (RLS)
- Users can only access their own reports
- Admin role for all data

### 6.3 Data Encryption
- At rest (Supabase)
- In transit (HTTPS)

## 7. Performance & Scalability

### 7.1 Response Time
- 30-60 second report generation
- Sub-second API responses

### 7.2 Scalability
- Handle 1000s of concurrent users
- Scale data integrations
- Horizontally scalable workers

### 7.3 Caching
- 30-day parcel overlay cache
- Attribute-only pulls
- Rate limit management

## 8. Error Handling & Recovery

### 8.1 Error Detection
- API call monitoring
- Job status tracking
- Sentry error logging

### 8.2 Error Recovery
- Retry logic with backoff
- Graceful degradation
- User-facing error messages

## 9. OData API Specification

### 9.1 Endpoints
- /odata/Applications
- /odata/Reports

### 9.2 Query Options
- $filter
- $select
- $orderby
- $top
- $skip
- $count

### 9.3 Metadata
- $metadata endpoint
- EDM schema definition

## 10. Future Enhancements

### 10.1 National Expansion
- Multi-state parcel datasets
- Regional utility providers
- National environmental datasets

### 10.2 AI Enhancements
- Machine learning for scoring
- Predictive cost modeling
- Historical trend analysis

### 10.3 Integrations
- CRM integration (Salesforce, etc.)
- Accounting integration (QuickBooks, etc.)

## 11. Glossary

- **AADT**: Average Annual Daily Traffic
- **APN**: Assessor's Parcel Number
- **BFE**: Base Flood Elevation
- **CAD**: Computer-Aided Design
- **FEMA**: Federal Emergency Management Agency
- **HCAD**: Harris County Appraisal District
- **NFHL**: National Flood Hazard Layer
- **OData**: Open Data Protocol
- **RLS**: Row-Level Security
- **TxDOT**: Texas Department of Transportation

## 12. Revision History

| Version | Date       | Author | Description                                  |
| ------- | ---------- | ------ | -------------------------------------------- |
| 0.1     | 2024-01-01 | John   | Initial draft                                |
| 0.2     | 2024-02-15 | Jane   | Added data sources and integrations          |
| 0.3     | 2024-03-01 | John   | Refined AI and scoring logic                 |
| 0.4     | 2024-03-15 | Jane   | Updated UI requirements                      |
| 0.5     | 2024-04-01 | John   | Added security requirements                  |
| 0.6     | 2024-04-15 | Jane   | Updated performance and scalability          |
| 0.7     | 2024-05-01 | John   | Added error handling and recovery            |
| 0.8     | 2024-05-15 | Jane   | Updated OData API specification              |
| 0.9     | 2024-06-01 | John   | Added future enhancements                    |
| 1.0     | 2024-06-15 | Jane   | Finalized functional requirements blueprint |
