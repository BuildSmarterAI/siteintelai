# Census Data Moat Architecture

> **SiteIntel™ Proprietary Demographics Infrastructure**

This document describes the Census Data Moat—SiteIntel's proprietary demographic intelligence layer that replaces dependency on Census API with internally-controlled, spatially-indexed demographic data.

## Overview

The Census Data Moat ingests 83+ American Community Survey (ACS) variables from Google BigQuery public datasets, computes 6 proprietary CRE indices, and serves demographics via sub-50ms PostGIS spatial lookups.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Census Data Moat Architecture                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────────┐       ┌──────────────────────────────────────┐   │
│   │   BigQuery       │       │        Supabase PostgreSQL           │   │
│   │ (Public Datasets)│       │                                      │   │
│   │                  │  ETL  │  ┌─────────────────────────────┐    │   │
│   │ census_tract_2020├──────►│  │  canonical_demographics     │    │   │
│   │ geo_census_tracts│       │  │  - 83+ ACS variables        │    │   │
│   └──────────────────┘       │  │  - 6 proprietary indices    │    │   │
│                               │  │  - PostGIS geometry         │    │   │
│                               │  └─────────────────────────────┘    │   │
│                               │                 │                    │   │
│                               │                 ▼                    │   │
│                               │  ┌─────────────────────────────┐    │   │
│                               │  │ get_demographics_for_point  │    │   │
│                               │  │ RPC (ST_DWithin 500m)       │    │   │
│                               │  └─────────────────────────────┘    │   │
│                               │                 │                    │   │
│                               │                 ▼                    │   │
│                               │  ┌─────────────────────────────┐    │   │
│                               │  │     applications table      │    │   │
│                               │  │  demographics_source:       │    │   │
│                               │  │    'census_moat'            │    │   │
│                               │  └─────────────────────────────┘    │   │
│                               └──────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Sources

### BigQuery Public Datasets

| Dataset | Table | Description |
|---------|-------|-------------|
| `bigquery-public-data.census_bureau_acs` | `census_tract_2020_5yr` | 5-year ACS estimates at tract level |
| `bigquery-public-data.geo_census_tracts` | `census_tracts_texas` | Census tract geometries |

### ACS Variables Collected (83+)

#### Demographics (15 variables)
- `total_pop` - Total population
- `median_age` - Median age
- `under_18_pct` - Under 18 percentage
- `over_65_pct` - Over 65 percentage
- `working_age_pct` - Working age (18-64) percentage
- `white_pct`, `black_pct`, `asian_pct`, `hispanic_pct` - Race/ethnicity

#### Housing (12 variables)
- `total_housing_units` - Total housing units
- `owner_occupied_pct` - Owner-occupied percentage
- `renter_occupied_pct` - Renter-occupied percentage
- `vacancy_rate` - Vacancy rate
- `median_home_value` - Median home value
- `median_rent` - Median gross rent
- `median_year_built` - Median year structure built
- `single_family_pct`, `multi_family_pct` - Housing type mix

#### Economics (18 variables)
- `median_income` - Median household income
- `mean_household_income` - Mean household income
- `per_capita_income` - Per capita income
- `poverty_rate` - Poverty rate percentage
- `gini_index` - Income inequality index
- `households_5mi` - Estimated households within 5 miles

#### Employment (12 variables)
- `labor_force` - Total labor force
- `unemployment_rate` - Unemployment rate
- `white_collar_pct` - Management/professional occupations
- `blue_collar_pct` - Production/construction occupations
- `service_sector_pct` - Service industry employment

#### Commute Patterns (10 variables)
- `drive_alone_pct` - Drive alone to work
- `public_transit_pct` - Public transit commuters
- `walk_bike_pct` - Walk/bike commuters
- `work_from_home_pct` - Work from home
- `mean_commute_time_min` - Mean travel time to work

#### Education (8 variables)
- `high_school_only_pct` - High school diploma only
- `some_college_pct` - Some college, no degree
- `bachelors_pct` - Bachelor's degree
- `graduate_degree_pct` - Graduate/professional degree
- `college_attainment_pct` - Bachelor's or higher

## Proprietary CRE Indices

SiteIntel computes 6 proprietary indices optimized for commercial real estate feasibility analysis:

### 1. Retail Spending Index (0-100)

Measures consumer spending potential for retail site selection.

```sql
retail_spending_index = (
  (median_income / 150000) * 35 +           -- Income weight
  (owner_occupied_pct / 100) * 20 +         -- Stability weight
  ((100 - poverty_rate) / 100) * 20 +       -- Affluence weight
  (per_capita_income / 75000) * 25          -- Purchasing power
) * 100
```

### 2. Workforce Availability Score (0-100)

Evaluates labor pool depth for industrial/office site selection.

```sql
workforce_availability_score = (
  (labor_force / 50000) * 25 +              -- Pool size
  ((100 - unemployment_rate) / 100) * 25 +  -- Employment health
  (working_age_pct / 100) * 20 +            -- Age demographics
  (college_attainment_pct / 100) * 15 +     -- Education level
  ((100 - mean_commute_time_min) / 60) * 15 -- Accessibility
) * 100
```

### 3. Growth Potential Index (0-100)

Projects forward trajectory for land acquisition timing.

```sql
growth_potential_index = (
  (population_cagr + 5) * 10 +              -- Population momentum
  (income_cagr + 3) * 15 +                  -- Income momentum
  (bachelors_pct / 100) * 20 +              -- Talent attraction
  (under_18_pct / 100) * 15 +               -- Family formation
  ((100 - median_age) / 50) * 20            -- Demographic youth
) * 100
```

### 4. Affluence Concentration (0-100)

Identifies high-income density for luxury retail/multifamily.

```sql
affluence_concentration = (
  (income_over_100k_pct / 100) * 30 +       -- High earners
  (median_home_value / 500000) * 25 +       -- Property values
  (graduate_degree_pct / 100) * 20 +        -- Education proxy
  (white_collar_pct / 100) * 25             -- Professional jobs
) * 100
```

### 5. Labor Pool Depth (0-100)

Measures workforce quality for employer site selection.

```sql
labor_pool_depth = (
  (labor_force / 100000) * 30 +             -- Raw pool size
  (college_attainment_pct / 100) * 25 +     -- Education quality
  ((100 - unemployment_rate) / 100) * 20 +  -- Current employment
  (working_age_pct / 100) * 25              -- Available workers
) * 100
```

### 6. Daytime Population Estimate

Estimates actual population during business hours.

```sql
daytime_population_estimate = 
  total_pop 
  - (total_pop * drive_alone_pct * 0.8)     -- Commute out
  + (labor_force * 0.3)                      -- Commute in estimate
  + (total_pop * work_from_home_pct)         -- WFH retention
```

## Database Schema

### canonical_demographics Table

```sql
CREATE TABLE canonical_demographics (
  id SERIAL PRIMARY KEY,
  geoid TEXT NOT NULL UNIQUE,              -- Census tract GEOID
  geo_name TEXT,                           -- Human-readable name
  state_fips TEXT,
  county_fips TEXT,
  tract_code TEXT,
  
  -- Geometry
  geom GEOMETRY(MultiPolygon, 4326),
  centroid GEOMETRY(Point, 4326),
  
  -- Demographics (83+ columns)
  total_pop INTEGER,
  median_age NUMERIC,
  -- ... all ACS variables ...
  
  -- Proprietary Indices
  retail_spending_index NUMERIC,
  workforce_availability_score NUMERIC,
  growth_potential_index NUMERIC,
  affluence_concentration NUMERIC,
  labor_pool_depth NUMERIC,
  daytime_population_estimate NUMERIC,
  
  -- Growth Projections
  population_cagr NUMERIC,
  income_cagr NUMERIC,
  growth_trajectory TEXT,                  -- 'rapid_growth'|'steady'|'stable'|'declining'
  market_outlook TEXT,                     -- 'expansion'|'mature'|'transitional'|'contraction'
  
  -- Metadata
  vintage TEXT,                            -- ACS vintage year
  dataset_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for fast lookups
CREATE INDEX idx_canonical_demographics_geom 
ON canonical_demographics USING GIST (geom);
```

### Spatial Lookup RPC

```sql
CREATE OR REPLACE FUNCTION get_demographics_for_point(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION
)
RETURNS TABLE (
  geoid TEXT,
  total_pop INTEGER,
  median_income NUMERIC,
  -- ... all demographic fields ...
  retail_spending_index NUMERIC,
  workforce_availability_score NUMERIC,
  growth_potential_index NUMERIC,
  affluence_concentration NUMERIC,
  labor_pool_depth NUMERIC,
  daytime_population_estimate NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cd.geoid,
    cd.total_pop,
    cd.median_income,
    -- ... all fields ...
    cd.retail_spending_index,
    cd.workforce_availability_score,
    cd.growth_potential_index,
    cd.affluence_concentration,
    cd.labor_pool_depth,
    cd.daytime_population_estimate
  FROM canonical_demographics cd
  WHERE ST_DWithin(
    cd.geom::geography,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    500  -- 500 meter search radius
  )
  ORDER BY ST_Distance(
    cd.centroid::geography,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  )
  LIMIT 1;
END;
$$;
```

## ETL Pipeline

### seed-census-canonical Edge Function

The `seed-census-canonical` edge function performs BigQuery ETL:

1. **Authentication**: Uses `BIGQUERY_SERVICE_ACCOUNT_KEY` secret
2. **Query**: Fetches ACS data joined with tract geometries
3. **Transform**: Computes proprietary indices
4. **Load**: Upserts to `canonical_demographics` table

```typescript
// Simplified ETL flow
const bigquery = new BigQuery({
  credentials: JSON.parse(Deno.env.get('BIGQUERY_SERVICE_ACCOUNT_KEY'))
});

const [rows] = await bigquery.query(`
  SELECT 
    acs.*,
    ST_AsGeoJSON(geo.tract_geom) as geometry
  FROM \`bigquery-public-data.census_bureau_acs.census_tract_2020_5yr\` acs
  JOIN \`bigquery-public-data.geo_census_tracts.census_tracts_texas\` geo
    ON acs.geo_id = geo.geo_id
  WHERE acs.geo_id LIKE '48%'  -- Texas FIPS
`);

// Compute indices and upsert to Supabase
for (const row of rows) {
  const indices = computeProprietaryIndices(row);
  await supabase.from('canonical_demographics').upsert({
    ...row,
    ...indices
  });
}
```

## Integration Points

### Application Enrichment

The `admin-trigger-enrich` function enriches applications with Census Moat data:

```typescript
// Call RPC to get demographics
const { data: demographics } = await supabase
  .rpc('get_demographics_for_point', {
    p_lat: application.geo_lat,
    p_lng: application.geo_lng
  });

// Update application with Census Moat data
await supabase.from('applications').update({
  demographics_source: 'census_moat',
  median_income: demographics.median_household_income,
  retail_spending_index: demographics.retail_spending_index,
  // ... all indices ...
}).eq('id', application_id);
```

### Report Display

The `ExtendedDemographicsCard` component displays proprietary indices:

- 6 gauge visualizations for CRE indices
- Growth trajectory classification badge
- Market outlook indicator
- "Source: SiteIntel Census Moat" attribution

## Competitive Advantage

The Census Data Moat provides:

1. **Speed**: Sub-50ms lookups vs 2-5 second Census API calls
2. **Reliability**: No external API dependencies or rate limits
3. **Proprietary Indices**: CRE-optimized metrics unavailable elsewhere
4. **Version Control**: Consistent data across all reports
5. **Cost Efficiency**: Zero per-query costs after initial ETL

## Required Secrets

| Secret | Description |
|--------|-------------|
| `BIGQUERY_SERVICE_ACCOUNT_KEY` | Google Cloud service account JSON with BigQuery Data Viewer role |

## Related Documentation

- [Demographics Enrichment](../features/DEMOGRAPHICS_ENRICHMENT.md)
- [Edge Functions Index](../api/EDGE_FUNCTIONS_INDEX.md)
- [Canonical Schema](./CANONICAL_SCHEMA.md)
