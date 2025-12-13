# SiteIntel Vector Tile Pipeline

> Complete operational reference for the GIS data export → Tippecanoe → S3 → CloudFront → MapLibre tile serving pipeline.

---

## Table of Contents

1. [Executive Overview](#executive-overview)
2. [Architecture](#architecture)
3. [Pipeline Components](#pipeline-components)
4. [Layer Configuration](#layer-configuration)
5. [AWS Infrastructure](#aws-infrastructure)
6. [URL Patterns & Versioning](#url-patterns--versioning)
7. [Supabase Catalog Schema](#supabase-catalog-schema)
8. [Frontend Integration](#frontend-integration)
9. [GitHub Actions Workflow](#github-actions-workflow)
10. [Manual Operations](#manual-operations)
11. [Troubleshooting](#troubleshooting)
12. [Security Considerations](#security-considerations)
13. [Quick Reference](#quick-reference)

---

## Executive Overview

### Purpose

The SiteIntel Vector Tile Pipeline transforms authoritative GIS data from PostGIS canonical tables into high-performance vector tiles served via CloudFront CDN. This infrastructure is the **core of SiteIntel's data moat**—by owning and serving our own tiles, we eliminate dependency on external city GIS endpoints while achieving sub-200ms response times globally.

### Key Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Cache Hit Rate | 90-99% | CloudFront edge cache efficiency |
| Response Time | <200ms | P95 tile delivery latency |
| Tile Freshness | <24h | Maximum age for actively-used layers |
| Coverage | 8 TX Counties | Harris, Fort Bend, Montgomery, Travis, Bexar, Dallas, Tarrant, Williamson |

### Data Moat Significance

This pipeline creates permanent competitive advantage through:

1. **Dataset Ownership** — All tiles generated from SiteIntel-controlled PostGIS tables
2. **Version Control** — Every tile version tracked with generation timestamp
3. **Independence** — No runtime dependency on city/county GIS servers
4. **Performance** — CDN-cached tiles outperform live API queries by 10-100x
5. **Audit Trail** — Complete lineage from source dataset to delivered tile

---

## Architecture

### High-Level Flow

```mermaid
flowchart LR
    subgraph PostGIS["Supabase PostGIS"]
        CP[canonical_parcels]
        CZ[zoning_canonical]
        FC[flood_zones_canonical]
        UC[utilities_canonical]
        TC[transportation_canonical]
        WC[wetlands_canonical]
    end

    subgraph ETL["ETL Pipeline"]
        EX[export_canonical.py]
        TP[Tippecanoe]
        REG[register_tileset.py]
    end

    subgraph AWS["AWS Infrastructure"]
        S3[(S3 Bucket)]
        CF[CloudFront CDN]
    end

    subgraph Frontend["Frontend"]
        ML[MapLibre GL]
        RH[React Hooks]
    end

    subgraph Supabase["Supabase"]
        TS[tilesets table]
        TJ[tile_jobs table]
    end

    CP --> EX
    CZ --> EX
    FC --> EX
    UC --> EX
    TC --> EX
    WC --> EX
    
    EX -->|GeoJSON| TP
    TP -->|PBF/MVT| S3
    S3 --> CF
    
    REG --> TS
    REG --> TJ
    
    TS --> RH
    CF --> ML
    RH --> ML
```

### Processing Stages

| Stage | Tool | Input | Output | Duration |
|-------|------|-------|--------|----------|
| 1. Export | `export_canonical.py` | PostGIS tables | GeoJSON files | 2-10 min |
| 2. Generate | Tippecanoe | GeoJSON | MBTiles | 5-30 min |
| 3. Extract | mb-util | MBTiles | PBF directory | 1-5 min |
| 4. Upload | AWS CLI | PBF files | S3 objects | 5-15 min |
| 5. Register | `register_tileset.py` | Tile metadata | Supabase catalog | <1 min |
| 6. Invalidate | CloudFront API | Path pattern | Cache purge | 1-5 min |

---

## Pipeline Components

### File Reference

| Component | Path | Purpose |
|-----------|------|---------|
| GitHub Workflow | `.github/workflows/generate-tiles.yml` | Orchestrates entire pipeline |
| GeoJSON Export | `etl/jobs/export_canonical.py` | Extracts PostGIS data to GeoJSON |
| Tileset Registration | `etl/jobs/register_tileset.py` | Updates Supabase catalog |
| Tippecanoe Config | `etl/config/tippecanoe.config.json` | Layer-specific tile settings |
| Upload Edge Function | `supabase/functions/upload-tiles/index.ts` | Alternative S3 upload path |
| Tile Hooks | `src/hooks/useTilesets.ts` | React data fetching |
| Vector Layers | `src/hooks/useVectorTileLayers.ts` | MapLibre layer management |
| Architecture Docs | `src/pages/docs/TileArchitecture.tsx` | User-facing documentation |

### export_canonical.py

Exports canonical geospatial tables from Supabase PostgreSQL into versioned GeoJSON files.

```python
# Layer configuration mapping
LAYER_CONFIG = {
    "parcels": {"table": "canonical_parcels", "geom_col": "geom", ...},
    "zoning": {"table": "zoning_canonical", "geom_col": "geom", ...},
    "flood": {"table": "flood_zones_canonical", "geom_col": "geom", ...},
    # ... additional layers
}

# Usage
python etl/jobs/export_canonical.py --layer parcels --jurisdiction harris --output-dir export/
```

**Key Features:**
- Transforms geometry to WGS84 (EPSG:4326)
- Generates versioned filenames (`parcels_harris_2025_12_13.geojson`)
- Creates manifest.json with export statistics
- Supports single layer or all-layer export

### register_tileset.py

Registers generated tilesets in Supabase catalog after successful tile generation.

```python
# Usage
python etl/jobs/register_tileset.py \
    --layer parcels \
    --version 2025_12_13 \
    --jurisdiction harris \
    --tile-dir output/parcels \
    --stats-file output/parcels.stats.json
```

**Actions Performed:**
1. Constructs `tileset_key` (e.g., `parcels_harris_2025_12_13`)
2. Builds `tile_url_template` pointing to CloudFront
3. Reads Tippecanoe statistics for record count and zoom ranges
4. Upserts record to `tilesets` table
5. Creates audit entry in `tile_jobs` table
6. Optionally deactivates old tileset versions

---

## Layer Configuration

### Tippecanoe Settings

Configuration stored in `etl/config/tippecanoe.config.json`:

```json
{
  "layers": {
    "parcels": {
      "minzoom": 10,
      "maxzoom": 16,
      "simplification": 4,
      "options": [
        "--drop-densest-as-needed",
        "--extend-zooms-if-still-dropping"
      ]
    },
    "zoning": {
      "minzoom": 8,
      "maxzoom": 14,
      "simplification": 6
    },
    "flood": {
      "minzoom": 8,
      "maxzoom": 14,
      "simplification": 8
    },
    "utilities": {
      "minzoom": 12,
      "maxzoom": 16,
      "simplification": 2
    },
    "transportation": {
      "minzoom": 6,
      "maxzoom": 14,
      "simplification": 10
    },
    "wetlands": {
      "minzoom": 8,
      "maxzoom": 14,
      "simplification": 8
    },
    "jurisdiction": {
      "minzoom": 4,
      "maxzoom": 12,
      "simplification": 12
    }
  },
  "global": {
    "attribution": "© SiteIntel",
    "description": "SiteIntel GIS Vector Tiles"
  }
}
```

### Layer Specifications

| Layer | Min Zoom | Max Zoom | Simplification | Primary Table | Use Case |
|-------|----------|----------|----------------|---------------|----------|
| `parcels` | 10 | 16 | 4 | `canonical_parcels` | Parcel boundaries, selection |
| `zoning` | 8 | 14 | 6 | `zoning_canonical` | Zoning districts overlay |
| `flood` | 8 | 14 | 8 | `flood_zones_canonical` | FEMA flood zone display |
| `utilities` | 12 | 16 | 2 | `utilities_canonical` | Water/sewer/storm lines |
| `transportation` | 6 | 14 | 10 | `transportation_canonical` | Roads, highways |
| `wetlands` | 8 | 14 | 8 | `wetlands_canonical` | NWI wetland areas |
| `jurisdiction` | 4 | 12 | 12 | `jurisdiction_boundaries` | City/county limits |

### Simplification Guide

Simplification values control geometry detail retention:
- **Lower values (2-4)**: More detail retained, larger tiles (use for utilities, parcels)
- **Higher values (8-12)**: More simplification, smaller tiles (use for jurisdiction, transportation)

---

## AWS Infrastructure

### Resources

| Resource | Value | Purpose |
|----------|-------|---------|
| S3 Bucket | `siteintel-tiles` | Tile storage |
| CloudFront Distribution | `EVBS45478OD2Z` | CDN delivery |
| CDN Domain | `tiles.siteintel.ai` | Public tile URL |
| AWS Region | `us-east-1` | Primary region |

### S3 Bucket Structure

```
siteintel-tiles/
├── us/
│   └── tx/
│       ├── parcels/
│       │   └── 2025_12_13/
│       │       ├── 10/
│       │       │   └── {x}/{y}.pbf
│       │       ├── 11/
│       │       ├── ...
│       │       └── 16/
│       ├── zoning/
│       │   └── 2025_12_13/
│       ├── flood/
│       ├── utilities/
│       ├── transportation/
│       └── wetlands/
└── style.json
```

### CloudFront Configuration

**Cache Behavior:**
- Default TTL: 86400 seconds (24 hours)
- Max TTL: 604800 seconds (7 days)
- Compress: Enabled (gzip/brotli)
- Query String Forwarding: None
- CORS: Enabled for `*.lovable.app`, `*.siteintel.ai`

**Headers Returned:**
```http
Content-Type: application/x-protobuf
Content-Encoding: gzip
Cache-Control: public, max-age=86400
Access-Control-Allow-Origin: *
X-Cache: Hit from cloudfront
```

### IAM Permissions Required

The GitHub Actions workflow requires an IAM user with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::siteintel-tiles",
        "arn:aws:s3:::siteintel-tiles/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::*:distribution/EVBS45478OD2Z"
    }
  ]
}
```

---

## URL Patterns & Versioning

### Tile URL Template

```
https://tiles.siteintel.ai/us/{jurisdiction}/{layer}/{version}/{z}/{x}/{y}.pbf
```

### Examples

| Layer | Jurisdiction | URL |
|-------|--------------|-----|
| Parcels | Harris County | `https://tiles.siteintel.ai/us/tx/parcels/2025_12_13/14/3823/6532.pbf` |
| Zoning | Travis County | `https://tiles.siteintel.ai/us/tx/zoning/2025_12_13/12/945/1621.pbf` |
| Flood | All TX | `https://tiles.siteintel.ai/us/tx/flood/nfhl_2025_q4/10/234/405.pbf` |

### Version String Formats

| Source Type | Format | Example |
|-------------|--------|---------|
| City/County data | `YYYY_MM_DD` | `2025_12_13` |
| Federal data (FEMA) | `{source}_{YYYY}_{quarter}` | `nfhl_2025_q4` |
| State data (TxDOT) | `{source}_{YYYY}` | `txdot_2025` |

### Style JSON

A MapLibre style document is available at:
```
https://tiles.siteintel.ai/style.json
```

This style references all active tileset layers with appropriate styling.

---

## Supabase Catalog Schema

### tilesets Table

Catalogs all generated vector tilesets with metadata.

```sql
CREATE TABLE tilesets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tileset_key TEXT UNIQUE NOT NULL,        -- e.g., "parcels_harris_2025_12_13"
    name TEXT NOT NULL,                       -- Human-readable name
    category TEXT NOT NULL,                   -- parcels, zoning, flood, etc.
    jurisdiction TEXT,                        -- harris, travis, tx, etc.
    tile_url_template TEXT NOT NULL,          -- CloudFront URL pattern
    min_zoom INTEGER NOT NULL DEFAULT 0,
    max_zoom INTEGER NOT NULL DEFAULT 16,
    bounds NUMERIC[4],                        -- [west, south, east, north]
    center NUMERIC[3],                        -- [lng, lat, zoom]
    source_map_server_id UUID REFERENCES map_servers(id),
    source_layer_ids TEXT[],
    vector_layers JSONB,                      -- Layer metadata
    record_count INTEGER,
    size_bytes BIGINT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    refresh_frequency_hours INTEGER DEFAULT 168,  -- 1 week
    tippecanoe_options JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### tile_jobs Table

Tracks ETL job execution for auditing and debugging.

```sql
CREATE TABLE tile_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tileset_key TEXT NOT NULL,
    job_type TEXT NOT NULL,                   -- full, incremental, repair
    status TEXT NOT NULL DEFAULT 'queued',    -- queued, running, complete, failed
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    duration_ms INTEGER,
    input_records INTEGER,
    output_tiles INTEGER,
    input_file_path TEXT,
    output_file_path TEXT,
    tippecanoe_options JSONB,
    error_message TEXT,
    error_details JSONB,
    retry_count INTEGER DEFAULT 0,
    triggered_by TEXT,                        -- cron, manual, webhook
    worker_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### Querying Active Tilesets

```sql
-- Get all active tilesets
SELECT tileset_key, tile_url_template, min_zoom, max_zoom, generated_at
FROM tilesets
WHERE is_active = true
ORDER BY category, jurisdiction;

-- Get latest tileset for a layer/jurisdiction
SELECT * FROM tilesets
WHERE category = 'parcels' 
  AND jurisdiction = 'harris'
  AND is_active = true
ORDER BY generated_at DESC
LIMIT 1;

-- Check tileset freshness
SELECT 
    tileset_key,
    generated_at,
    refresh_frequency_hours,
    CASE 
        WHEN generated_at > now() - (refresh_frequency_hours || ' hours')::INTERVAL THEN 'fresh'
        WHEN generated_at > now() - (refresh_frequency_hours * 2 || ' hours')::INTERVAL THEN 'stale'
        ELSE 'expired'
    END as freshness
FROM tilesets
WHERE is_active = true;
```

---

## Frontend Integration

### useTilesets Hook

Fetches active tilesets from Supabase catalog.

```typescript
import { useTilesets } from '@/hooks/useTilesets';

// Fetch all tilesets
const { data: tilesets, isLoading, error } = useTilesets();

// Filter by category
const { data: parcelTilesets } = useTilesets({ category: 'parcels' });

// Filter by jurisdiction
const { data: harrisTilesets } = useTilesets({ 
    category: 'parcels',
    jurisdiction: 'harris' 
});
```

### useTileUrl Hook

Gets the tile URL template for a specific layer.

```typescript
import { useTileUrl } from '@/hooks/useTilesets';

const parcelTiles = useTileUrl('parcels', 'harris');
// Returns: { url, minZoom, maxZoom, generatedAt, recordCount }

if (parcelTiles) {
    console.log(parcelTiles.url);
    // https://tiles.siteintel.ai/us/tx/parcels/2025_12_13/{z}/{x}/{y}.pbf
}
```

### useVectorTileSources Hook

Formats tileset data for MapLibre GL JS sources.

```typescript
import { useVectorTileSources } from '@/hooks/useTilesets';

const { sources, layers, isLoading, error, tilesets } = useVectorTileSources('harris');

// sources: Record<string, { type: 'vector'; tiles: string[]; ... }>
// layers: Record<string, { sourceLayer: string; category: string; ... }>
```

### useVectorTileLayers Hook

Complete MapLibre layer management with visibility controls.

```typescript
import { useVectorTileLayers } from '@/hooks/useVectorTileLayers';

const { sources, layers, isLoading, hasVectorTiles } = useVectorTileLayers({
    map,
    mapLoaded: true,
    jurisdiction: 'harris',
    layerVisibility: {
        parcels: true,
        zoning: false,
        flood: true,
        utilities: false
    }
});
```

### Layer Styling Configuration

Vector tile layers are styled in `useVectorTileLayers.ts`:

```typescript
const VECTOR_TILE_LAYER_CONFIG = {
    parcels: {
        layerId: 'siteintel-parcels-fill',
        type: 'fill',
        sourceLayer: 'parcels',
        paint: {
            'fill-color': 'hsl(var(--primary) / 0.1)',
            'fill-outline-color': 'hsl(var(--primary))'
        }
    },
    flood: {
        layerId: 'siteintel-flood-fill',
        type: 'fill',
        sourceLayer: 'flood',
        paint: {
            'fill-color': [
                'match', ['get', 'zone_code'],
                'AE', 'hsla(200, 80%, 50%, 0.4)',
                'A', 'hsla(200, 80%, 50%, 0.3)',
                'X', 'hsla(120, 60%, 50%, 0.1)',
                'hsla(0, 0%, 50%, 0.1)'
            ]
        }
    }
    // ... additional layer configs
};
```

---

## GitHub Actions Workflow

### Required Secrets

Configure these secrets in GitHub repository settings:

| Secret | Value | Description |
|--------|-------|-------------|
| `SUPABASE_DB_URL` | `postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres` | Database connection |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIs...` | Service role JWT |
| `AWS_ACCESS_KEY_ID` | `AKIA...` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | `...` | IAM user secret key |
| `AWS_S3_BUCKET` | `siteintel-tiles` | S3 bucket name |
| `AWS_CLOUDFRONT_DISTRIBUTION_ID` | `EVBS45478OD2Z` | CloudFront distribution |

### Workflow Triggers

```yaml
on:
  # Daily at 4 AM UTC
  schedule:
    - cron: '0 4 * * *'
  
  # Manual trigger with options
  workflow_dispatch:
    inputs:
      layers:
        description: 'Comma-separated layer names (or "all")'
        default: 'all'
      jurisdiction:
        description: 'Jurisdiction filter (optional)'
        default: ''
```

### Manual Trigger Steps

1. Go to **Actions** tab in GitHub repository
2. Select **Generate Vector Tiles** workflow
3. Click **Run workflow**
4. Optionally specify:
   - `layers`: `parcels` or `parcels,zoning` or `all`
   - `jurisdiction`: `harris` or leave empty for all

### Workflow Matrix

The workflow processes layers in parallel:

```yaml
strategy:
  matrix:
    layer: [parcels, zoning, utilities, transportation, flood]
```

Each layer runs as an independent job, allowing faster completion and isolated failures.

---

## Manual Operations

### Triggering Tile Generation

**Via GitHub Actions (Recommended):**
```bash
# Using GitHub CLI
gh workflow run generate-tiles.yml -f layers=parcels -f jurisdiction=harris
```

**Via Local Script:**
```bash
# Export GeoJSON
python etl/jobs/export_canonical.py --layer parcels --jurisdiction harris

# Generate tiles
tippecanoe -o parcels.mbtiles \
    --minimum-zoom=10 --maximum-zoom=16 \
    --drop-densest-as-needed \
    --extend-zooms-if-still-dropping \
    export/parcels_harris_2025_12_13.geojson

# Extract to directory
mb-util parcels.mbtiles tiles/parcels --image_format=pbf

# Upload to S3
aws s3 sync tiles/parcels s3://siteintel-tiles/us/tx/parcels/2025_12_13/ \
    --content-type application/x-protobuf \
    --content-encoding gzip

# Register in catalog
python etl/jobs/register_tileset.py \
    --layer parcels \
    --version 2025_12_13 \
    --jurisdiction harris
```

### Testing S3 Access

```bash
# List bucket contents
aws s3 ls s3://siteintel-tiles/us/tx/

# Download a test tile
aws s3 cp s3://siteintel-tiles/us/tx/parcels/2025_12_13/14/3823/6532.pbf ./test.pbf

# Check tile size
ls -la test.pbf
```

### Testing CloudFront Delivery

```bash
# Fetch tile via CDN
curl -I "https://tiles.siteintel.ai/us/tx/parcels/2025_12_13/14/3823/6532.pbf"

# Check cache status (X-Cache header)
curl -s -o /dev/null -w "%{http_code}" \
    "https://tiles.siteintel.ai/us/tx/parcels/2025_12_13/14/3823/6532.pbf"
```

### Cache Invalidation

```bash
# Invalidate specific layer
aws cloudfront create-invalidation \
    --distribution-id EVBS45478OD2Z \
    --paths "/us/tx/parcels/*"

# Invalidate all tiles
aws cloudfront create-invalidation \
    --distribution-id EVBS45478OD2Z \
    --paths "/us/*"

# Check invalidation status
aws cloudfront get-invalidation \
    --distribution-id EVBS45478OD2Z \
    --id INVALIDATION_ID
```

### Querying Tile Status

```sql
-- Check latest tile generation
SELECT tileset_key, generated_at, record_count, size_bytes
FROM tilesets
WHERE is_active = true
ORDER BY generated_at DESC
LIMIT 10;

-- Check recent job failures
SELECT tileset_key, status, error_message, started_at
FROM tile_jobs
WHERE status = 'failed'
ORDER BY started_at DESC
LIMIT 5;

-- Tileset freshness report
SELECT 
    category,
    jurisdiction,
    generated_at,
    now() - generated_at as age,
    CASE 
        WHEN generated_at > now() - INTERVAL '1 day' THEN '🟢 Fresh'
        WHEN generated_at > now() - INTERVAL '7 days' THEN '🟡 Stale'
        ELSE '🔴 Expired'
    END as status
FROM tilesets
WHERE is_active = true
ORDER BY category, jurisdiction;
```

---

## Troubleshooting

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` on DB export | Database connection failed | Verify `SUPABASE_DB_URL` secret |
| `AccessDenied` on S3 upload | IAM permissions | Check IAM policy includes `s3:PutObject` |
| `InvalidArgument` on CloudFront | Invalid distribution ID | Verify `AWS_CLOUDFRONT_DISTRIBUTION_ID` |
| Empty tiles generated | No data in canonical tables | Run `seed-houston-canonical` first |
| `ENOMEM` during Tippecanoe | Large dataset | Increase runner memory or add `--drop-fraction-as-needed` |
| Tiles not appearing in map | Wrong URL template | Check `tile_url_template` in `tilesets` table |

### Debug Commands

```bash
# Check export output
cat export/manifest.json | jq .

# Validate GeoJSON
ogrinfo -so export/parcels_harris_2025_12_13.geojson

# Inspect MBTiles
sqlite3 parcels.mbtiles "SELECT * FROM metadata;"

# Test tile decompression
zcat test.pbf | protoc --decode_raw

# Check Supabase connection
psql $SUPABASE_DB_URL -c "SELECT COUNT(*) FROM canonical_parcels;"
```

### Monitoring Tile Freshness

The `useTilesetFreshness` hook provides freshness metrics:

```typescript
import { useTilesetFreshness } from '@/hooks/useTilesets';

const { fresh, stale, expired } = useTilesetFreshness();
// fresh: 5, stale: 2, expired: 0
```

Dashboard alert conditions (configured in `alert-check` cron):
- **Warning**: Any tileset stale (>1 week old)
- **Critical**: Any tileset expired (>2 weeks old)

---

## Security Considerations

### Secrets Management

1. **Never commit secrets** to repository
2. **Rotate AWS keys** every 90 days
3. **Use GitHub Environments** for production secrets
4. **Audit secret access** via GitHub security logs

### IAM Best Practices

1. Create dedicated IAM user for tile uploads (not root)
2. Apply least-privilege policy (S3 + CloudFront only)
3. Enable MFA for IAM user console access
4. Use IAM Access Analyzer to review permissions

### Service Role Key Security

The Supabase service role key has full database access:
- Only use in server-side contexts (GitHub Actions, edge functions)
- Never expose to client-side code
- Rotate if compromised via Supabase dashboard

### Tile Access Control

Current configuration allows public tile access. To restrict:
1. Add CloudFront signed URLs
2. Configure origin access control (OAC) for S3
3. Implement token validation at edge with Lambda@Edge

---

## Quick Reference

### Environment Variables

| Variable | Context | Purpose |
|----------|---------|---------|
| `SUPABASE_DB_URL` | ETL scripts | Database connection |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge functions | Authenticated Supabase access |
| `AWS_ACCESS_KEY_ID` | GitHub Actions | S3/CloudFront authentication |
| `AWS_SECRET_ACCESS_KEY` | GitHub Actions | S3/CloudFront authentication |
| `AWS_S3_BUCKET` | GitHub Actions | Target bucket name |
| `AWS_CLOUDFRONT_DISTRIBUTION_ID` | GitHub Actions | CDN invalidation target |
| `AWS_REGION` | GitHub Actions | AWS region (us-east-1) |

### CLI Commands Cheatsheet

```bash
# Export all layers
python etl/jobs/export_canonical.py --all

# Generate tiles for single layer
tippecanoe -o output.mbtiles -z16 -Z10 input.geojson

# Sync tiles to S3
aws s3 sync ./tiles s3://siteintel-tiles/us/tx/layer/version/

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id EVBS45478OD2Z --paths "/*"

# Trigger workflow
gh workflow run generate-tiles.yml
```

### Layer Zoom Ranges

| Layer | Min | Max | Typical Use |
|-------|-----|-----|-------------|
| jurisdiction | 4 | 12 | State/county overview |
| transportation | 6 | 14 | Regional road context |
| zoning | 8 | 14 | District-level planning |
| flood | 8 | 14 | Flood zone overlay |
| wetlands | 8 | 14 | Environmental constraints |
| parcels | 10 | 16 | Property selection |
| utilities | 12 | 16 | Infrastructure detail |

---

## Related Documentation

- [ETL System Blueprint](../architecture/ETL_SYSTEM_BLUEPRINT.md)
- [Canonical Schema](../architecture/CANONICAL_SCHEMA.md)
- [Houston Replication Moat](../architecture/HOUSTON_REPLICATION_MOAT.md)
- [Tile Architecture (User Docs)](../../src/pages/docs/TileArchitecture.tsx)
- [ETL Jobs Reference](./ETL_JOBS.md)

---

*Last Updated: December 2025*
*Maintainer: SiteIntel Engineering Team*
