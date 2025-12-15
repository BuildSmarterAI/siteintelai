# Demographics Enrichment

> **Feature Documentation: Census Data Moat Integration**

This document describes the demographics enrichment pipeline that populates application records with Census Data Moat demographics and proprietary CRE indices.

## Overview

Demographics enrichment transforms raw geographic coordinates into rich demographic intelligence by querying the internal `canonical_demographics` table via PostGIS spatial lookup.

## Data Flow

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│ Application │────►│ admin-trigger-   │────►│ get_demographics_   │
│ (lat/lng)   │     │ enrich           │     │ for_point RPC       │
└─────────────┘     └──────────────────┘     └─────────────────────┘
                                                       │
                                                       ▼
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│ Application │◄────│ Update with      │◄────│ canonical_          │
│ (enriched)  │     │ demographics     │     │ demographics        │
└─────────────┘     └──────────────────┘     └─────────────────────┘
```

## Enrichment Methods

### 1. Automatic Enrichment (Primary)

During application submission, `orchestrate-application` triggers demographic enrichment:

```typescript
// orchestrate-application flow
await supabase.functions.invoke('enrich-feasibility', {
  body: { application_id }
});
// Demographics populated via Census Moat RPC
```

### 2. Manual Re-Enrichment (Admin)

The `admin-trigger-enrich` edge function enables manual re-enrichment:

```bash
POST /functions/v1/admin-trigger-enrich
Content-Type: application/json

{
  "application_id": "uuid-here",
  "lat": 29.7604,    // Optional: override coordinates
  "lng": -95.3698
}
```

**Response:**
```json
{
  "success": true,
  "application_id": "uuid-here",
  "demographics_source": "census_moat",
  "fields_updated": 45
}
```

## Fields Populated

### Standard Demographics

| Application Field | RPC Source | Description |
|-------------------|------------|-------------|
| `median_income` | `median_household_income` | Median household income |
| `mean_household_income` | `mean_household_income` | Mean household income |
| `per_capita_income` | `per_capita_income` | Per capita income |
| `median_age` | `median_age` | Median age |
| `total_pop` | `total_pop` | Total population |
| `median_home_value` | `median_home_value` | Median home value |
| `median_rent` | `median_rent` | Median gross rent |
| `vacancy_rate` | `vacancy_rate` | Housing vacancy rate |
| `unemployment_rate` | `unemployment_rate` | Unemployment rate |
| `college_attainment_pct` | `bachelors_pct` | Bachelor's degree or higher |
| `labor_force` | `labor_force` | Total labor force |
| `total_housing_units` | `total_housing_units` | Total housing units |

### Proprietary CRE Indices

| Application Field | Range | Description |
|-------------------|-------|-------------|
| `retail_spending_index` | 0-100 | Consumer spending potential |
| `workforce_availability_score` | 0-100 | Labor pool depth |
| `growth_potential_index` | 0-100 | Forward growth trajectory |
| `affluence_concentration` | 0-100 | High-income density |
| `labor_pool_depth` | 0-100 | Workforce quality |
| `daytime_population_estimate` | Integer | Business-hours population |

### Growth Projections

| Application Field | Values | Description |
|-------------------|--------|-------------|
| `population_cagr` | Percentage | 5-year population CAGR |
| `growth_rate_5yr` | Percentage | 5-year growth rate |
| `growth_trajectory` | `rapid_growth`, `steady`, `stable`, `declining` | Classification |
| `market_outlook` | `expansion`, `mature`, `transitional`, `contraction` | Market phase |

### Metadata

| Application Field | Value |
|-------------------|-------|
| `demographics_source` | `census_moat` |
| `census_vintage` | ACS vintage year |
| `census_block_group` | GEOID reference |

## UI Components

### ExtendedDemographicsCard

Displays all proprietary indices with visual gauges:

```tsx
<ExtendedDemographicsCard application={application} />
```

**Features:**
- 6 gauge visualizations (0-100 scale)
- Color coding: Green (>75), Amber (50-75), Red (<50)
- Growth trajectory badge
- Market outlook indicator
- "Source: SiteIntel Census Moat" attribution
- Toggle for current vs 5-year projection view

### MarketCard

Displays market context with Census Moat badge:

```tsx
<MarketCard application={application} />
// Shows "CENSUS ACS" badge when demographics_source = 'census_moat'
```

## Fallback Hierarchy

The enrichment pipeline follows this hierarchy:

1. **Census Data Moat** (Primary)
   - PostGIS spatial lookup via `get_demographics_for_point`
   - Sub-50ms response time
   - Sets `demographics_source = 'census_moat'`

2. **Census API** (Fallback)
   - Direct Census Bureau API call
   - Used when canonical data unavailable
   - Sets `demographics_source = 'census_api'`

3. **Graceful Degradation**
   - If both fail, application proceeds with null demographics
   - Adds `'demographics_unavailable'` to `data_flags`

## Edge Function: admin-trigger-enrich

### Purpose
Manual re-enrichment of application demographics using Census Data Moat.

### Authentication
Public endpoint (no JWT required) - intended for admin tooling.

### Request

```typescript
interface AdminTriggerEnrichRequest {
  application_id: string;
  lat?: number;   // Optional coordinate override
  lng?: number;   // Optional coordinate override
}
```

### Response

```typescript
interface AdminTriggerEnrichResponse {
  success: boolean;
  application_id: string;
  demographics_source: 'census_moat';
  fields_updated: number;
  error?: string;
}
```

### Field Mapping

The function maps RPC response fields to application columns:

```typescript
const fieldMapping = {
  // Standard demographics
  median_income: demographics.median_household_income,
  mean_household_income: demographics.mean_household_income,
  per_capita_income: demographics.per_capita_income,
  college_attainment_pct: demographics.bachelors_pct,
  
  // Proprietary indices (direct mapping)
  retail_spending_index: demographics.retail_spending_index,
  workforce_availability_score: demographics.workforce_availability_score,
  growth_potential_index: demographics.growth_potential_index,
  affluence_concentration: demographics.affluence_concentration,
  labor_pool_depth: demographics.labor_pool_depth,
  daytime_population_estimate: demographics.daytime_population_estimate,
  
  // Metadata
  demographics_source: 'census_moat'
};
```

## Testing

### Verify Census Moat Enrichment

```sql
-- Check applications using Census Moat
SELECT 
  id,
  formatted_address,
  demographics_source,
  retail_spending_index,
  workforce_availability_score
FROM applications
WHERE demographics_source = 'census_moat'
ORDER BY updated_at DESC
LIMIT 10;
```

### Manual Re-Enrichment via cURL

```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/admin-trigger-enrich' \
  -H 'Content-Type: application/json' \
  -d '{"application_id": "your-app-id"}'
```

## Related Documentation

- [Census Data Moat Architecture](../architecture/CENSUS_DATA_MOAT.md)
- [Edge Functions Index](../api/EDGE_FUNCTIONS_INDEX.md)
- [Report Generation](./REPORT_GENERATION.md)
