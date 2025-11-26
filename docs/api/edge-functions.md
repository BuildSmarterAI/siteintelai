# Edge Functions Reference

Complete reference for SiteIntel™ Supabase Edge Functions.

## Overview

Edge functions are serverless functions running on Deno that handle:
- External API integrations
- Data enrichment pipeline
- AI report generation
- Payment processing
- Utility operations

## Base URL

```
https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/
```

## Authentication

Most functions require JWT authentication:

```typescript
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { /* payload */ },
});
```

Public functions have `verify_jwt = false` in config.

## Function Categories

### Orchestration Functions

#### orchestrate-application

Coordinates the complete enrichment pipeline.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Method** | POST |

**Request:**
```json
{
  "applicationId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "applicationId": "uuid",
  "status": "completed"
}
```

---

#### submit-application

Creates a new application and triggers processing.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Method** | POST |

**Request:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "555-1234",
  "company": "Acme Corp",
  "property_address": {
    "street": "123 Main St",
    "city": "Houston",
    "state": "TX",
    "zip": "77001"
  },
  "lot_size_value": 2.5,
  "lot_size_unit": "acres",
  "project_type": ["retail", "office"],
  "quality_level": "professional"
}
```

---

### Enrichment Functions

#### enrich-feasibility

Main enrichment orchestrator for parcel data.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (internal) |
| **Method** | POST |

**Request:**
```json
{
  "applicationId": "uuid"
}
```

---

#### fetch-hcad-parcels

Fetches parcel data from Harris County Appraisal District.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (internal) |
| **Method** | POST |

**Request:**
```json
{
  "lat": 29.7604,
  "lng": -95.3698
}
```

**Response:**
```json
{
  "parcel_id": "1234567890",
  "owner_name": "ACME CORP",
  "acreage": 2.5,
  "land_value": 500000,
  "improvement_value": 1500000
}
```

---

#### query-fema-by-point

Queries FEMA flood zone for a coordinate.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (internal) |
| **Method** | POST |

**Request:**
```json
{
  "lat": 29.7604,
  "lng": -95.3698
}
```

**Response:**
```json
{
  "flood_zone": "X",
  "panel_id": "48201C0405J",
  "base_flood_elevation": null,
  "in_sfha": false
}
```

---

#### enrich-utilities

Fetches utility infrastructure data from city GIS.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (internal) |
| **Method** | POST |

**Request:**
```json
{
  "applicationId": "uuid",
  "lat": 29.7604,
  "lng": -95.3698
}
```

---

#### enrich-wetlands

Queries USFWS National Wetlands Inventory.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (internal) |
| **Method** | POST |

**Request:**
```json
{
  "applicationId": "uuid",
  "lat": 29.7604,
  "lng": -95.3698
}
```

---

#### enrich-epa-echo

Queries EPA ECHO for nearby regulated facilities.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes (internal) |
| **Method** | POST |

**Request:**
```json
{
  "applicationId": "uuid",
  "lat": 29.7604,
  "lng": -95.3698
}
```

---

### Report Generation

#### generate-ai-report

Generates AI narrative content for reports.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Method** | POST |

**Request:**
```json
{
  "applicationId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "report_id": "uuid",
  "feasibility_score": 85,
  "score_band": "B"
}
```

---

#### generate-pdf

Generates PDF report from application data.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Method** | POST |

**Request:**
```json
{
  "applicationId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "pdf_url": "https://storage.../report.pdf"
}
```

---

#### generate-quick-check

Generates a free QuickCheck analysis.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Method** | POST |

**Request:**
```json
{
  "address": "123 Main St, Houston, TX 77001"
}
```

---

### Payment Functions

#### create-checkout-session

Creates Stripe checkout session.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Method** | POST |

**Request:**
```json
{
  "priceId": "price_xxx",
  "mode": "subscription" | "payment",
  "successUrl": "https://...",
  "cancelUrl": "https://..."
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

---

#### stripe-webhook

Handles Stripe webhook events.

| Property | Value |
|----------|-------|
| **Auth Required** | No (webhook signature) |
| **Method** | POST |

**Events Handled:**
- `checkout.session.completed`
- `invoice.paid`
- `customer.subscription.updated`
- `customer.subscription.deleted`

---

#### customer-portal

Generates Stripe customer portal URL.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Method** | POST |

**Response:**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

---

#### get-credits

Returns user's current credit balance.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Method** | GET |

**Response:**
```json
{
  "reports_remaining": 8,
  "quickchecks_unlimited": true,
  "tier_name": "Pro",
  "purchased_credits": 2
}
```

---

#### use-credit

Deducts a credit for report generation.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Method** | POST |

**Request:**
```json
{
  "creditType": "report",
  "applicationId": "uuid"
}
```

---

### Utility Functions

#### geocode-intersection

Geocodes an address using Google Geocoding API.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Method** | POST |

**Request:**
```json
{
  "address": "123 Main St, Houston, TX"
}
```

**Response:**
```json
{
  "lat": 29.7604,
  "lng": -95.3698,
  "formatted_address": "123 Main St, Houston, TX 77001",
  "place_id": "ChIJ..."
}
```

---

#### fetch-elevation

Fetches elevation data for coordinates.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Method** | POST |

**Request:**
```json
{
  "lat": 29.7604,
  "lng": -95.3698
}
```

---

#### render-static-map

Generates static map image URL.

| Property | Value |
|----------|-------|
| **Auth Required** | Yes |
| **Method** | POST |

**Request:**
```json
{
  "lat": 29.7604,
  "lng": -95.3698,
  "zoom": 16,
  "size": "600x400",
  "maptype": "hybrid"
}
```

---

#### v2_health_check

Health check endpoint.

| Property | Value |
|----------|-------|
| **Auth Required** | No |
| **Method** | GET, POST |

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-26T12:00:00Z"
}
```

## Error Handling

All functions return errors in a consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input |
| `EXTERNAL_API_ERROR` | 502 | External API failed |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limits

- Standard functions: 100 requests/minute
- Enrichment functions: 30 requests/minute
- AI functions: 10 requests/minute

---

**Next**: [External Integrations →](./external-integrations.md)
