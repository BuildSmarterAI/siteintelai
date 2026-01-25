

## Seed Census Canonical - 100% Texas Coverage

### Current State
- **Seeded Tracts:** 3,797 (72% coverage)
- **Target:** ~5,265 Texas Census tracts
- **Gap:** ~1,468 tracts remaining

### Execution Plan

#### Step 1: Invoke seed-census-canonical Edge Function
Call the function to complete Texas-wide Census tract seeding:

```text
POST https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/seed-census-canonical
```

The function will:
1. Authenticate with BigQuery using your new service account key
2. Query all Texas tracts from `bigquery-public-data.census_bureau_acs.censustract_2020_5yr`
3. Join with geometry from `bigquery-public-data.geo_census_tracts.census_tracts_texas`
4. Compute 6 proprietary CRE indices for each tract
5. Upsert to `canonical_demographics` table with conflict resolution on `geoid`

#### Step 2: Monitor Progress via Logs
Watch real-time logs at the Edge Function dashboard showing:
- BigQuery authentication success
- Row fetching with pagination
- Batch upsert progress (500-record batches)
- Geometry updates
- Final validation summary

#### Step 3: Verify Final Coverage
Query database to confirm 100% coverage:

```sql
SELECT 
  COUNT(*) as total_seeded,
  COUNT(DISTINCT LEFT(geoid, 5)) as counties_covered
FROM canonical_demographics 
WHERE state_fips = '48';
```

### Technical Details

**Function Behavior:**
- Performs full upsert (updates existing + inserts new)
- Batch size: 500 records per database call
- Handles BigQuery pagination for large datasets (10,000 records per page)
- Timeout: 5 minutes for BigQuery queries
- Geometry updates in batches of 50

**Data Pipeline:**
```text
BigQuery ACS Tables --> Transform (83+ variables) --> Compute Indices --> Validate --> Upsert Supabase
```

**Expected Output:**
- ~5,265 total tracts in `canonical_demographics`
- 245+ of 254 Texas counties covered
- All 6 proprietary indices populated:
  - Retail Spending Index
  - Workforce Availability Score
  - Growth Potential Index
  - Affluence Concentration
  - Labor Pool Depth
  - Daytime Population Estimate

### Post-Seeding Verification
After completion, I will:
1. Query final tract count and county coverage
2. Sample 5 random tracts to verify data quality
3. Confirm all proprietary indices are non-null
4. Report summary statistics

