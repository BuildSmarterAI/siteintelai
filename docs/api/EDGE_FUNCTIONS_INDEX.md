# Edge Functions Index

> **Complete Reference for SiteIntel™ Supabase Edge Functions**

This document catalogs all Supabase Edge Functions deployed in the SiteIntel platform.

## Base URL

```
https://[PROJECT_ID].supabase.co/functions/v1/
```

## Authentication

Most functions require JWT authentication via the `Authorization` header:

```typescript
const { data } = await supabase.functions.invoke('function-name', {
  body: { ... }
});
```

Public functions have `verify_jwt = false` in `supabase/config.toml`.

---

## Census Data Moat Functions

### admin-trigger-enrich

**Purpose:** Manual re-enrichment of application demographics using Census Data Moat.

| Property | Value |
|----------|-------|
| Auth | Public (no JWT) |
| Method | POST |

**Request:**
```json
{
  "application_id": "uuid",
  "lat": 29.7604,    // Optional override
  "lng": -95.3698    // Optional override
}
```

**Response:**
```json
{
  "success": true,
  "application_id": "uuid",
  "demographics_source": "census_moat",
  "fields_updated": 45
}
```

---

### seed-census-canonical

**Purpose:** ETL pipeline to ingest Census ACS data from BigQuery into `canonical_demographics` table.

| Property | Value |
|----------|-------|
| Auth | JWT Required |
| Method | POST |
| Secrets | `BIGQUERY_SERVICE_ACCOUNT_KEY` |

**Request:**
```json
{
  "state_fips": "48",     // Texas
  "limit": 1000           // Optional batch size
}
```

---

### enrich-census-canonical

**Purpose:** Lookup demographics for a coordinate from Census Data Moat.

| Property | Value |
|----------|-------|
| Auth | JWT Required |
| Method | POST |

**Request:**
```json
{
  "lat": 29.7604,
  "lng": -95.3698
}
```

---

## Application Orchestration

### orchestrate-application

**Purpose:** Master orchestrator coordinating all enrichment functions.

| Property | Value |
|----------|-------|
| Auth | JWT Required |
| Method | POST |

**Request:**
```json
{
  "application_id": "uuid"
}
```

**Orchestration Flow:**
1. `enrich-feasibility` - Parcel/flood/zoning
2. `enrich-utilities` - Utility infrastructure
3. `enrich-traffic` - TxDOT AADT data
4. `enrich-wetlands` - USFWS NWI data
5. `enrich-epa-echo` - EPA facility proximity
6. `generate-ai-report` - GPT-4 narrative
7. `generate-pdf` - PDF generation

---

### submit-application

**Purpose:** Create new application and trigger orchestration.

| Property | Value |
|----------|-------|
| Auth | JWT Required |
| Method | POST |

**Request:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "company": "Acme Corp",
  "property_address": {...},
  "project_type": ["industrial"],
  // ... full application payload
}
```

---

### save-draft

**Purpose:** Persist application draft for resume capability.

| Property | Value |
|----------|-------|
| Auth | JWT Required |
| Method | POST |

---

## Enrichment Functions

### enrich-feasibility

**Purpose:** Core feasibility enrichment (parcel, flood, zoning, demographics).

| Property | Value |
|----------|-------|
| Auth | Internal |
| Method | POST |

---

### enrich-utilities

**Purpose:** Query utility infrastructure (water, sewer, electric, gas).

| Property | Value |
|----------|-------|
| Auth | Internal |
| Method | POST |

---

### enrich-traffic

**Purpose:** Fetch TxDOT AADT traffic counts.

| Property | Value |
|----------|-------|
| Auth | Internal |
| Method | POST |

---

### enrich-wetlands

**Purpose:** Query USFWS National Wetlands Inventory.

| Property | Value |
|----------|-------|
| Auth | Internal |
| Method | POST |

---

### enrich-epa-echo

**Purpose:** Query EPA ECHO facility database.

| Property | Value |
|----------|-------|
| Auth | Internal |
| Method | POST |

---

### fetch-hcad-parcels

**Purpose:** Fetch parcel data from Harris County Appraisal District.

| Property | Value |
|----------|-------|
| Auth | Internal |
| Method | POST |

---

### query-fema-by-point

**Purpose:** Query FEMA flood zone data for coordinates.

| Property | Value |
|----------|-------|
| Auth | Internal |
| Method | POST |

---

## Report Generation

### generate-ai-report

**Purpose:** Generate GPT-4 narrative report sections.

| Property | Value |
|----------|-------|
| Auth | Internal |
| Method | POST |
| Secrets | `OPENAI_API_KEY` |

---

### generate-pdf

**Purpose:** Generate PDF report via PDFShift.

| Property | Value |
|----------|-------|
| Auth | Internal |
| Method | POST |
| Secrets | `PDFSHIFT_API_KEY` |

---

### generate-quick-check

**Purpose:** Generate free QuickCheck feasibility preview.

| Property | Value |
|----------|-------|
| Auth | Public |
| Method | POST |

---

### get-sanitized-report

**Purpose:** Fetch report data with sensitive fields redacted.

| Property | Value |
|----------|-------|
| Auth | Public |
| Method | GET |

---

## Payment Functions

### create-checkout-session

**Purpose:** Create Stripe checkout session for report purchase.

| Property | Value |
|----------|-------|
| Auth | JWT Required |
| Method | POST |
| Secrets | `STRIPE_SECRET_KEY` |

---

### stripe-webhook

**Purpose:** Handle Stripe webhook events.

| Property | Value |
|----------|-------|
| Auth | Stripe Signature |
| Method | POST |
| Secrets | `STRIPE_WEBHOOK_SECRET` |

**Events Handled:**
- `checkout.session.completed`
- `invoice.paid`
- `customer.subscription.updated`
- `customer.subscription.deleted`

---

### customer-portal

**Purpose:** Generate Stripe customer portal URL.

| Property | Value |
|----------|-------|
| Auth | JWT Required |
| Method | POST |

---

### get-credits

**Purpose:** Fetch user's current credit balance.

| Property | Value |
|----------|-------|
| Auth | JWT Required |
| Method | GET |

---

### use-credit

**Purpose:** Deduct credit for report generation.

| Property | Value |
|----------|-------|
| Auth | JWT Required |
| Method | POST |

---

## Utility Functions

### geocode-with-cache

**Purpose:** Geocode address with 30-day TTL cache.

| Property | Value |
|----------|-------|
| Auth | Internal |
| Method | POST |
| Secrets | `GOOGLE_MAPS_API_KEY` |

---

### geocode-intersection

**Purpose:** Geocode cross-street intersection.

| Property | Value |
|----------|-------|
| Auth | Public |
| Method | POST |

---

### fetch-elevation

**Purpose:** Fetch elevation data from USGS.

| Property | Value |
|----------|-------|
| Auth | Internal |
| Method | POST |

---

### render-static-map

**Purpose:** Generate static map image.

| Property | Value |
|----------|-------|
| Auth | Internal |
| Method | POST |
| Secrets | `GOOGLE_MAPS_API_KEY` |

---

### render-streetview

**Purpose:** Generate Street View image.

| Property | Value |
|----------|-------|
| Auth | Internal |
| Method | POST |
| Secrets | `GOOGLE_MAPS_API_KEY` |

---

## GIS Functions

### gis-health-check

**Purpose:** Validate GIS endpoint availability.

| Property | Value |
|----------|-------|
| Auth | JWT Required |
| Method | GET |

---

### discover-gis-layers

**Purpose:** Auto-discover layers from GIS MapServer.

| Property | Value |
|----------|-------|
| Auth | JWT Required |
| Method | POST |

---

### bootstrap-gis-data

**Purpose:** Trigger GIS data ingestion pipeline.

| Property | Value |
|----------|-------|
| Auth | JWT Required |
| Method | POST |

---

## Scheduled Jobs (Cron)

| Function | Schedule | Purpose |
|----------|----------|---------|
| `cron-enrichment` | Every 5 min | Process queued applications |
| `gis-refresh-scheduler` | Daily 3 AM | Refresh GIS data |
| `validate-gis-endpoints` | Every 6 hours | Check endpoint health |
| `credit-reset` | Monthly | Reset subscription credits |
| `cache-cleanup` | Daily 4 AM | Purge expired cache |
| `alert-check` | Every 15 min | Check alert conditions |

---

## API v2 Gateway

### api-v2

**Purpose:** Unified API gateway for v2 endpoints.

| Property | Value |
|----------|-------|
| Auth | JWT or API Key |
| Method | GET, POST, PATCH |

**Endpoints:**
- `GET /v2/parcels/{id}/flood/risk-summary`
- `GET /v2/parcels/{id}/utilities/capacity`
- `GET /v2/parcels/{id}/traffic/access-score`
- `GET /v2/feasibility/{id}/score`
- `GET /v2/lender/kill-factors`
- `PATCH /v2/lender/kill-factors`

---

## OData Gateway

### odata

**Purpose:** OData v4.01 compliant API for enterprise integrations.

| Property | Value |
|----------|-------|
| Auth | JWT or API Key |
| Method | GET |

**Endpoints:**
- `GET /odata/$metadata` - CSDL schema
- `GET /odata/Applications` - Application entities
- `GET /odata/Reports` - Report entities

**Query Options:**
- `$select`, `$filter`, `$orderby`, `$top`, `$skip`, `$count`, `$expand`

---

## Error Handling

All functions return consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid application_id format",
    "details": {}
  }
}
```

**Error Codes:**
| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input |
| `UNAUTHORIZED` | 401 | Missing/invalid auth |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Related Documentation

- [Census Data Moat](../architecture/CENSUS_DATA_MOAT.md)
- [Demographics Enrichment](../features/DEMOGRAPHICS_ENRICHMENT.md)
- [API External Integrations](./external-integrations.md)
