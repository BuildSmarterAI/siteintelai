# Census Data Moat Migrations

> **Migration History for Census Data Moat Infrastructure**

This document tracks all database migrations related to the Census Data Moat feature.

## Migration Timeline

| Date | Migration | Purpose |
|------|-----------|---------|
| 2024-12-15 | `fix_demographics_rpc_spatial` | Fix ST_DWithin spatial lookup |
| 2024-12-15 | `drop_numeric_function` | Remove conflicting function overload |
| 2024-12-15 | `fix_demographics_return_type` | Correct RPC return type |

---

## Migration 1: Fix Demographics RPC Spatial Lookup

**File:** `20251215_fix_demographics_rpc_spatial.sql`

**Problem:** Original RPC function used geometry comparison which failed for geographic distance calculations.

**Solution:** Updated to use `ST_DWithin` with geography casting for proper meter-based distance.

```sql
-- Before (broken)
WHERE ST_Contains(cd.geom, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326))

-- After (fixed)
WHERE ST_DWithin(
  cd.geom::geography,
  ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
  500  -- 500 meter radius
)
```

**Full Migration:**

```sql
DROP FUNCTION IF EXISTS get_demographics_for_point(double precision, double precision);

CREATE OR REPLACE FUNCTION get_demographics_for_point(
  p_lat double precision,
  p_lng double precision
)
RETURNS TABLE (
  geoid text,
  total_pop integer,
  median_age numeric,
  median_household_income numeric,
  mean_household_income numeric,
  per_capita_income numeric,
  poverty_rate numeric,
  unemployment_rate numeric,
  labor_force integer,
  bachelors_pct numeric,
  median_home_value numeric,
  median_rent numeric,
  vacancy_rate numeric,
  total_housing_units integer,
  -- Proprietary indices
  retail_spending_index numeric,
  workforce_availability_score numeric,
  growth_potential_index numeric,
  affluence_concentration numeric,
  labor_pool_depth numeric,
  daytime_population_estimate numeric,
  -- Growth metrics
  population_cagr numeric,
  growth_trajectory text,
  market_outlook text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cd.geoid,
    cd.total_pop,
    cd.median_age,
    cd.median_household_income,
    cd.mean_household_income,
    cd.per_capita_income,
    cd.poverty_rate,
    cd.unemployment_rate,
    cd.labor_force,
    cd.bachelors_pct,
    cd.median_home_value,
    cd.median_rent,
    cd.vacancy_rate,
    cd.total_housing_units,
    cd.retail_spending_index,
    cd.workforce_availability_score,
    cd.growth_potential_index,
    cd.affluence_concentration,
    cd.labor_pool_depth,
    cd.daytime_population_estimate,
    cd.population_cagr,
    cd.growth_trajectory,
    cd.market_outlook
  FROM canonical_demographics cd
  WHERE ST_DWithin(
    cd.geom::geography,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    500
  )
  ORDER BY ST_Distance(
    cd.centroid::geography,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  )
  LIMIT 1;
END;
$$;
```

---

## Migration 2: Drop Numeric Function Overload

**File:** `20251215_drop_numeric_function.sql`

**Problem:** Conflicting function signature with `numeric` parameter types caused ambiguous function calls.

**Solution:** Drop the numeric-typed overload, keeping only `double precision` version.

```sql
DROP FUNCTION IF EXISTS get_demographics_for_point(numeric, numeric);
```

---

## Migration 3: Fix Return Type

**File:** `20251215_fix_demographics_return_type.sql`

**Problem:** Some return columns had incorrect types (e.g., `bigint` vs `integer`).

**Solution:** Align return types with `canonical_demographics` table schema.

```sql
-- Ensure consistent return types
ALTER TABLE canonical_demographics 
  ALTER COLUMN total_pop TYPE integer,
  ALTER COLUMN labor_force TYPE integer,
  ALTER COLUMN total_housing_units TYPE integer;
```

---

## Verification Queries

### Check Function Exists

```sql
SELECT 
  routine_name,
  data_type as return_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'get_demographics_for_point'
  AND routine_schema = 'public';
```

### Test Spatial Lookup

```sql
-- Houston downtown coordinates
SELECT * FROM get_demographics_for_point(29.7604, -95.3698);
```

### Verify Canonical Data

```sql
SELECT 
  COUNT(*) as tract_count,
  COUNT(retail_spending_index) as with_indices,
  AVG(retail_spending_index) as avg_retail_index
FROM canonical_demographics
WHERE state_fips = '48';  -- Texas
```

---

## Rollback Procedures

### Rollback Migration 1

```sql
-- Restore original ST_Contains logic (not recommended)
DROP FUNCTION IF EXISTS get_demographics_for_point(double precision, double precision);

CREATE OR REPLACE FUNCTION get_demographics_for_point(
  p_lat double precision,
  p_lng double precision
)
RETURNS TABLE (...) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT ...
  FROM canonical_demographics cd
  WHERE ST_Contains(cd.geom, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326))
  LIMIT 1;
END;
$$;
```

**Warning:** Rolling back Migration 1 will break spatial lookups for coordinates not exactly inside tract polygons.

---

## Related Files

| File | Purpose |
|------|---------|
| `supabase/functions/admin-trigger-enrich/index.ts` | Calls RPC function |
| `supabase/functions/seed-census-canonical/index.ts` | Populates canonical_demographics |
| `src/components/report/ExtendedDemographicsCard.tsx` | Displays proprietary indices |

---

## Related Documentation

- [Census Data Moat Architecture](../architecture/CENSUS_DATA_MOAT.md)
- [Demographics Enrichment](../features/DEMOGRAPHICS_ENRICHMENT.md)
