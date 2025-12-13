# GIS Data Ingestion Guide

> Step-by-step guide for populating canonical tables using SiteIntel edge functions.

## Overview

SiteIntel uses two primary edge functions for GIS data ingestion:

| Function | Purpose | Target Tables |
|----------|---------|---------------|
| `bootstrap-gis-data` | Fetch from registered GIS layers in `gis_layers` table | Various canonical tables based on layer config |
| `seed-houston-canonical` | Direct Houston-specific seeding with hardcoded configs | `canonical_parcels`, `utilities_canonical`, `flood_zones_canonical`, etc. |

```mermaid
flowchart LR
    A[gis_layers Registry] --> B[bootstrap-gis-data]
    B --> C[gis-fetch-with-versioning]
    C --> D[gis-transform-to-canonical]
    D --> E[Canonical Tables]
    
    F[Hardcoded Configs] --> G[seed-houston-canonical]
    G --> E
```

---

## Prerequisites

### 1. Verify Supabase Connection

```bash
# Check your Supabase project is accessible
curl -X GET "https://mcmfwlgovubpdcfiqfvk.supabase.co/rest/v1/" \
  -H "apikey: YOUR_ANON_KEY"
```

### 2. Required Environment Variables

For edge function invocation, ensure these are set:
- `SUPABASE_URL`: `https://mcmfwlgovubpdcfiqfvk.supabase.co`
- `SUPABASE_ANON_KEY`: Your project's anon key
- `SUPABASE_SERVICE_ROLE_KEY`: For admin operations (optional)

### 3. Check GIS Layers Registry

Before running `bootstrap-gis-data`, verify layers are registered:

```sql
-- Check registered GIS layers
SELECT layer_key, display_name, source_url, is_active, last_fetched_at
FROM gis_layers
WHERE is_active = true
ORDER BY layer_key;
```

---

## Method 1: Using seed-houston-canonical (Recommended for Initial Setup)

This function has hardcoded Houston layer configurations and is the fastest way to populate canonical tables.

### Step 1: Invoke the Function

**Via Supabase Dashboard:**
1. Go to [Edge Functions](https://supabase.com/dashboard/project/mcmfwlgovubpdcfiqfvk/functions)
2. Find `seed-houston-canonical`
3. Click "Invoke" with empty body `{}`

**Via cURL:**

```bash
curl -X POST "https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/seed-houston-canonical" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Via JavaScript:**

```typescript
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase.functions.invoke('seed-houston-canonical', {
  body: {}
});

console.log('Seeding result:', data);
```

### Step 2: Seed Specific Layers Only

To seed only specific layers, pass a `layers` array:

```bash
curl -X POST "https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/seed-houston-canonical" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "layers": ["parcels", "water_lines", "sewer_lines"]
  }'
```

**Available layer keys:**
- `parcels` → `canonical_parcels`
- `water_lines` → `utilities_canonical`
- `sewer_lines` → `utilities_canonical`
- `flood_zones` → `flood_zones_canonical`
- `wetlands` → `wetlands_canonical`
- `ccn_water` → `utilities_ccn_canonical`
- `ccn_sewer` → `utilities_ccn_canonical`
- `pipelines` → `pipelines_canonical`

### Step 3: Verify Results

```sql
-- Check canonical_parcels
SELECT COUNT(*) as parcel_count, 
       MAX(created_at) as latest_record
FROM canonical_parcels;

-- Check utilities_canonical
SELECT utility_type, COUNT(*) as count
FROM utilities_canonical
GROUP BY utility_type;

-- Check all canonical table counts
SELECT 'canonical_parcels' as table_name, COUNT(*) as count FROM canonical_parcels
UNION ALL
SELECT 'utilities_canonical', COUNT(*) FROM utilities_canonical
UNION ALL
SELECT 'flood_zones_canonical', COUNT(*) FROM flood_zones_canonical
UNION ALL
SELECT 'wetlands_canonical', COUNT(*) FROM wetlands_canonical
UNION ALL
SELECT 'utilities_ccn_canonical', COUNT(*) FROM utilities_ccn_canonical;
```

---

## Method 2: Using bootstrap-gis-data (Registry-Based)

This function reads from the `gis_layers` table and processes registered layers dynamically.

### Step 1: Ensure Layers Are Registered

```sql
-- View all registered layers
SELECT 
  layer_key,
  display_name,
  source_url,
  geometry_type,
  is_active,
  etl_adapter
FROM gis_layers
WHERE is_active = true;
```

### Step 2: Invoke Bootstrap Function

**Full bootstrap (all active layers):**

```bash
curl -X POST "https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/bootstrap-gis-data" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Selective bootstrap by layer keys:**

```bash
curl -X POST "https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/bootstrap-gis-data" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "layer_keys": ["houston_parcels", "houston_water_lines"]
  }'
```

**Filter by category:**

```bash
curl -X POST "https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/bootstrap-gis-data" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "utilities"
  }'
```

**Force refresh (ignore cache):**

```bash
curl -X POST "https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/bootstrap-gis-data" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "force_refresh": true
  }'
```

### Step 3: Monitor Progress

Check the `cron_job_history` table for execution status:

```sql
SELECT 
  job_name,
  status,
  started_at,
  finished_at,
  records_processed,
  error_message,
  metadata
FROM cron_job_history
WHERE job_name = 'bootstrap-gis-data'
ORDER BY started_at DESC
LIMIT 5;
```

---

## Method 3: Admin Dashboard (UI-Based)

### Step 1: Navigate to Data Sources

1. Go to `/admin/data-sources` in your browser
2. View all registered map servers and layers

### Step 2: Trigger Layer Refresh

1. Click on a specific data source
2. Navigate to the "ETL Status" tab
3. Click "Trigger Refresh" button

### Step 3: Monitor Health

1. Go to `/admin/system-health`
2. Check the "Pipeline Health" tab for ingestion status

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `CORS error` | Function not configured for browser | Use server-side invocation or Supabase client |
| `401 Unauthorized` | Invalid or missing API key | Check `Authorization` header |
| `Empty results` | Source endpoint down or changed | Check `data_source_errors` table |
| `Timeout` | Large dataset or slow source | Use `layer_keys` filter to process fewer layers |
| `Geometry errors` | Invalid source geometries | Check source data quality |

### Check Edge Function Logs

1. Go to [Edge Function Logs](https://supabase.com/dashboard/project/mcmfwlgovubpdcfiqfvk/functions/seed-houston-canonical/logs)
2. Filter by timestamp around your invocation
3. Look for error messages or stack traces

### Verify Source Endpoints

```sql
-- Check for endpoint errors
SELECT 
  source_url,
  error_type,
  error_message,
  occurred_at
FROM data_source_errors
ORDER BY occurred_at DESC
LIMIT 10;

-- Check map server health
SELECT 
  server_key,
  base_url,
  health_status,
  last_health_check
FROM map_servers
WHERE is_active = true;
```

### Manual Endpoint Test

Test a source endpoint directly:

```bash
# Test Houston Water GIS
curl "https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWWaterLineIPS/MapServer/3/query?where=1=1&outFields=*&f=json&resultRecordCount=1"
```

---

## Recommended Ingestion Sequence

For a fresh setup, follow this order:

```mermaid
flowchart TD
    A[1. seed-houston-canonical<br/>layers: parcels] --> B[2. seed-houston-canonical<br/>layers: water_lines, sewer_lines]
    B --> C[3. seed-houston-canonical<br/>layers: flood_zones]
    C --> D[4. seed-houston-canonical<br/>layers: ccn_water, ccn_sewer]
    D --> E[5. Verify Counts]
    E --> F[6. Run bootstrap-gis-data<br/>for additional layers]
```

### Quick Start Commands

```bash
# Step 1: Seed parcels first (largest dataset)
curl -X POST "https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/seed-houston-canonical" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"layers": ["parcels"]}'

# Step 2: Seed utilities
curl -X POST "https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/seed-houston-canonical" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"layers": ["water_lines", "sewer_lines"]}'

# Step 3: Seed flood data
curl -X POST "https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/seed-houston-canonical" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"layers": ["flood_zones"]}'

# Step 4: Seed CCN boundaries
curl -X POST "https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/seed-houston-canonical" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"layers": ["ccn_water", "ccn_sewer"]}'
```

---

## Post-Ingestion Validation

### Verify Data Quality

```sql
-- Check for NULL geometries
SELECT 'canonical_parcels' as table_name, 
       COUNT(*) FILTER (WHERE geom IS NULL) as null_geom_count
FROM canonical_parcels
UNION ALL
SELECT 'utilities_canonical', 
       COUNT(*) FILTER (WHERE geom IS NULL)
FROM utilities_canonical;

-- Check jurisdiction distribution
SELECT jurisdiction, COUNT(*) as count
FROM canonical_parcels
GROUP BY jurisdiction
ORDER BY count DESC;

-- Check data freshness
SELECT 
  'canonical_parcels' as table_name,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM canonical_parcels
UNION ALL
SELECT 
  'utilities_canonical',
  MIN(created_at),
  MAX(created_at)
FROM utilities_canonical;
```

### Generate Tiles After Ingestion

Once canonical tables are populated, trigger tile generation:

```bash
# Via GitHub Actions (recommended)
# Go to Actions tab → "Generate Vector Tiles" → "Run workflow"

# Or via edge function
curl -X POST "https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/upload-tiles" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"layer": "parcels"}'
```

---

## Quick Reference

### Edge Function URLs

| Function | URL |
|----------|-----|
| seed-houston-canonical | `https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/seed-houston-canonical` |
| bootstrap-gis-data | `https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/bootstrap-gis-data` |
| gis-health-check | `https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1/gis-health-check` |

### Canonical Tables Reference

| Table | Primary Source | Key Fields |
|-------|----------------|------------|
| `canonical_parcels` | HCAD, FBCAD, MCAD | `source_parcel_id`, `apn`, `geom` |
| `utilities_canonical` | Houston Water GIS | `utility_type`, `diameter`, `geom` |
| `flood_zones_canonical` | FEMA NFHL | `zone_code`, `bfe`, `geom` |
| `wetlands_canonical` | USFWS NWI | `wetland_type`, `cowardin_code`, `geom` |
| `utilities_ccn_canonical` | PUCT | `provider_name`, `service_type`, `geom` |

### Related Documentation

- [Tile Pipeline Guide](./TILE_PIPELINE.md)
- [ETL Jobs Reference](./ETL_JOBS.md)
- [ETL System Blueprint](../architecture/ETL_SYSTEM_BLUEPRINT.md)
- [Canonical Schema](../architecture/CANONICAL_SCHEMA.md)
