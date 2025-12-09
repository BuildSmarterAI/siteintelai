# SiteIntel™ Geospatial Intelligence Integration

> **Complete architectural reference for tileserver multi-tenancy, data quality scoring, and AI risk computation.**

---

## Table of Contents

1. [Overview](#overview)
2. [Part A: Tileserver Multi-Tenancy Architecture](#part-a-tileserver-multi-tenancy-architecture)
3. [Part B: Data Quality Scoring Engine](#part-b-data-quality-scoring-engine)
4. [Part C: AI Risk Scoring Flow](#part-c-ai-risk-scoring-flow)
5. [Cross-References](#cross-references)

---

## Overview

The SiteIntel geospatial intelligence system provides structured spatial analysis for parcels through three integrated subsystems:

1. **Tileserver Multi-Tenancy** — Serve nationwide vector tiles to multiple tenants from a single canonical store
2. **Data Quality Scoring** — Compute reliability scores (0–100) for every ingested dataset
3. **AI Risk Scoring** — Use canonical RPCs + tiles to compute Feasibility Risk Scores

### Key Components

| Component | Purpose | Output |
|-----------|---------|--------|
| Tileserver | Serve vector tiles with tenant isolation | PBF tiles at `/tiles/...` |
| Quality Engine | Score dataset reliability | 0–100 score per dataset |
| Risk Engine | Compute parcel feasibility | 0–100 score + risk flags |

---

## Part A: Tileserver Multi-Tenancy Architecture

> **Goal:** Serve nationwide vector tiles to many tenants (SaaS, white-label partners, enterprise) from a single canonical store while preserving clean isolation, simple paths, and zero data duplication.

### A.1 Namespace & URL Design

#### Public Tiles (Read-Only, Globally Shared)

```
/tiles/{country}/{state}/{county}/{dataset_type}/{dataset_version}/{z}/{x}/{y}.pbf
```

**Examples:**

```bash
# Harris County parcels
/tiles/us/tx/harris/parcels/hou_parcels_v2025_11/12/873/1352.pbf

# Dallas zoning
/tiles/us/tx/dallas/zoning/dallas_zoning_v2025_03/13/2212/3280.pbf

# Statewide flood (all counties)
/tiles/us/tx/all/flood/nfhl_v2025_09/10/270/390.pbf

# Nationwide wetlands
/tiles/us/all/all/wetlands/usfws_v2025_06/8/64/95.pbf
```

#### Tenant-Scoped Tiles (Filtered, Access-Controlled)

```
/tiles/tenant/{tenant_id}/{country}/{state}/{county}/{dataset_type}/{dataset_version}/{z}/{x}/{y}.pbf
```

**Examples:**

```bash
# MaxxBuilders sees only their permitted jurisdictions
/tiles/tenant/maxxbuilders/us/tx/harris/parcels/hou_parcels_v2025_11/13/873/1352.pbf

# Enterprise client with custom masking
/tiles/tenant/lender_abc/us/tx/travis/parcels/tcad_parcels_v2025_11/14/4400/6720.pbf
```

**Under the Hood:** The geometry is the same canonical table; the tenant layer applies a `WHERE` filter (jurisdictions, product tiers, masking rules) plus authentication.

---

### A.2 Logical Architecture

```mermaid
flowchart LR
  subgraph POSTGIS["PostGIS (Canonical Tables)"]
    P1[(parcels_canonical)]
    P2[(zoning_canonical)]
    P3[(fema_flood_canonical)]
    P4[(wetlands_canonical)]
    P5[(utilities_canonical)]
    P6[(transportation_canonical)]
  end

  subgraph TILEENGINE["Tile Engine (pg_tileserv / Martin)"]
    T1["Base Tile Service<br/>/tiles/{country}/{state}/..."]
    T2["Tenant Tile Service<br/>/tiles/tenant/{tenant_id}/..."]
  end

  subgraph GATEWAY["API Gateway / CDN"]
    G1[Auth & Tenant Router]
    G2[Cache Layer<br/>z/x/y keyed]
    G3[Rate Limiter]
  end

  subgraph CLIENTS["Clients"]
    C1[SiteIntel Web App]
    C2[White-Label Partners]
    C3[Enterprise APIs]
  end

  POSTGIS --> TILEENGINE
  TILEENGINE --> GATEWAY
  GATEWAY --> CLIENTS
```

#### Key Behaviors

| Service | Description |
|---------|-------------|
| **Base Tile Service** | Reads directly from canonical tables. No tenant logic; purely public dataset + version. |
| **Tenant Tile Service** | Wraps Base queries with tenant-aware filters: allowed datasets, jurisdictions, optional masking (hide owners, aggregate geometry). |
| **Gateway** | Validates API keys / JWT → resolves `tenant_id`. Routes to public or tenant paths. Applies rate limits per tenant. |

---

### A.3 Multi-Tenancy Strategy

#### Single Database, Logical Multi-Tenancy

All tiles come from the same canonical tables. Tenants are modeled via:

1. **`tenant_permissions`** — Which datasets/jurisdictions they can access
2. **`tenant_filters`** — Optional row-level filters per tile type
3. **`tenant_masking`** — Field-level masking rules (e.g., hide owner names)

#### Table: `tenant_permissions`

```sql
CREATE TABLE public.tenant_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  dataset_type TEXT NOT NULL,        -- parcels, zoning, flood, wetlands, utilities
  country TEXT DEFAULT 'us',
  state TEXT,                         -- NULL = all states
  county TEXT,                        -- NULL = all counties in state
  max_zoom INT DEFAULT 18,
  min_zoom INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, dataset_type, country, state, county)
);

CREATE INDEX idx_tenant_permissions_tenant ON tenant_permissions(tenant_id);
CREATE INDEX idx_tenant_permissions_dataset ON tenant_permissions(dataset_type);

COMMENT ON TABLE tenant_permissions IS 'Controls which datasets/jurisdictions each tenant can access';
```

#### Table: `tenant_filters`

```sql
CREATE TABLE public.tenant_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  dataset_type TEXT NOT NULL,
  filter_type TEXT NOT NULL,          -- 'where_clause', 'geometry_clip', 'value_range'
  filter_config JSONB NOT NULL,       -- {"where": "lot_size_acres > 1", "columns": ["apn", "owner"]}
  priority INT DEFAULT 0,             -- Higher priority filters apply first
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, dataset_type, filter_type)
);

COMMENT ON TABLE tenant_filters IS 'Custom row-level filters applied to tenant tile requests';
```

#### Table: `tenant_masking`

```sql
CREATE TABLE public.tenant_masking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  dataset_type TEXT NOT NULL,
  masked_fields TEXT[] NOT NULL,      -- ['owner_name', 'mailing_address']
  mask_type TEXT DEFAULT 'redact',    -- 'redact', 'hash', 'aggregate'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, dataset_type)
);

COMMENT ON TABLE tenant_masking IS 'Field-level masking rules for tenant data access';
```

---

### A.4 Tile Engine Configuration

#### pg_tileserv Configuration

```yaml
# pg_tileserv.toml
[Server]
HttpHost = "0.0.0.0"
HttpPort = 7800
CacheTTL = 3600
BasePath = "/tiles"

[Database]
ConnectionString = "postgresql://user:pass@host:5432/siteintel"

[Security]
# API key validation handled at gateway level
EnableCORS = true
CORSOrigins = ["*"]
```

#### Martin Configuration (Alternative)

```yaml
# martin.yaml
listen_addresses: '0.0.0.0:3000'
connection_string: 'postgresql://user:pass@host:5432/siteintel'

# Table sources with tenant filtering
table_sources:
  parcels_canonical:
    schema: public
    table: parcels_canonical
    srid: 4326
    geometry_column: geom
    id_column: id
    
  zoning_canonical:
    schema: public
    table: zoning_canonical
    srid: 4326
    geometry_column: geom
    id_column: id

# Function sources for tenant-filtered tiles
function_sources:
  get_tenant_parcels:
    schema: public
    function: get_tenant_parcels
    
  get_tenant_zoning:
    schema: public
    function: get_tenant_zoning
```

#### Tenant Tile Function Example

```sql
-- Function to generate tenant-filtered parcel tiles
CREATE OR REPLACE FUNCTION get_tenant_parcels(
  z INTEGER,
  x INTEGER,
  y INTEGER,
  tenant_id TEXT DEFAULT NULL
)
RETURNS BYTEA AS $$
DECLARE
  tile BYTEA;
  bounds GEOMETRY;
  allowed_jurisdictions TEXT[];
  masked_fields TEXT[];
BEGIN
  -- Calculate tile bounds
  bounds := ST_TileEnvelope(z, x, y);
  
  -- Get tenant permissions
  IF tenant_id IS NOT NULL THEN
    SELECT ARRAY_AGG(DISTINCT county)
    INTO allowed_jurisdictions
    FROM tenant_permissions
    WHERE tenant_permissions.tenant_id = get_tenant_parcels.tenant_id
      AND dataset_type = 'parcels'
      AND is_active = true;
      
    SELECT tm.masked_fields
    INTO masked_fields
    FROM tenant_masking tm
    WHERE tm.tenant_id = get_tenant_parcels.tenant_id
      AND dataset_type = 'parcels';
  END IF;
  
  -- Generate MVT tile
  SELECT ST_AsMVT(tile_data, 'parcels', 4096, 'geom')
  INTO tile
  FROM (
    SELECT
      id,
      parcel_id,
      CASE WHEN 'owner_name' = ANY(masked_fields) THEN '[REDACTED]' ELSE owner_name END AS owner_name,
      CASE WHEN 'situs_address' = ANY(masked_fields) THEN '[REDACTED]' ELSE situs_address END AS situs_address,
      lot_size_acres,
      zoning_code,
      ST_AsMVTGeom(geom, bounds, 4096, 256, true) AS geom
    FROM parcels_canonical
    WHERE ST_Intersects(geom, bounds)
      AND (allowed_jurisdictions IS NULL OR county = ANY(allowed_jurisdictions))
  ) AS tile_data;
  
  RETURN tile;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

### A.5 Tenant Isolation Guarantees

| Layer | Isolation Mechanism |
|-------|---------------------|
| **Gateway** | JWT/API key validation → resolves `tenant_id` before any DB access |
| **Tile Engine** | SQL views/functions filter by tenant; no raw table access |
| **Cache** | Tenant-prefixed cache keys prevent cross-tenant leakage |
| **Audit** | All tile requests logged with `tenant_id`, `user_id`, timestamp |

#### Product Tier Mapping

```sql
CREATE TABLE public.product_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE,     -- 'free', 'pro', 'enterprise'
  max_zoom INT DEFAULT 14,
  allowed_datasets TEXT[] DEFAULT ARRAY['parcels'],
  allowed_states TEXT[],              -- NULL = all states
  rate_limit_per_hour INT DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default tiers
INSERT INTO product_tiers (tier_name, max_zoom, allowed_datasets, rate_limit_per_hour) VALUES
  ('free', 12, ARRAY['parcels'], 100),
  ('pro', 16, ARRAY['parcels', 'zoning', 'flood'], 5000),
  ('enterprise', 18, ARRAY['parcels', 'zoning', 'flood', 'wetlands', 'utilities'], 50000);
```

---

### A.6 CDN & Caching Strategy

```mermaid
flowchart LR
  subgraph ORIGIN["Origin (Tile Engine)"]
    TE[pg_tileserv / Martin]
  end
  
  subgraph CDN["CloudFront / Fastly"]
    C1[Edge Cache]
    C2[Origin Shield]
  end
  
  subgraph CLIENTS["Clients"]
    CL1[Browser]
    CL2[Mobile]
    CL3[API]
  end
  
  CLIENTS --> CDN --> ORIGIN
```

#### Cache Key Structure

```
# Public tiles
{country}/{state}/{county}/{dataset}/{version}/{z}/{x}/{y}

# Tenant tiles (cache per tenant)
tenant/{tenant_id}/{country}/{state}/{county}/{dataset}/{version}/{z}/{x}/{y}
```

#### Cache TTLs

| Tile Type | TTL | Reason |
|-----------|-----|--------|
| Parcels | 7 days | Rarely change |
| Zoning | 30 days | Very stable |
| Flood | 90 days | FEMA updates quarterly |
| Utilities | 7 days | City updates vary |

---

## Part B: Data Quality Scoring Engine

> **Goal:** Every dataset ingested gets a Data Quality Score (0–100) so the AI and users know how much to trust it.

### B.1 Score Dimensions

The total score (0–100) is derived from four dimensions:

| Dimension | Max Points | Weight |
|-----------|------------|--------|
| Schema Completeness | 30 | 30% |
| Spatial Coherence | 30 | 30% |
| Metadata Freshness | 20 | 20% |
| Coverage & Consistency | 20 | 20% |

```mermaid
pie title Data Quality Score Composition
    "Schema Completeness" : 30
    "Spatial Coherence" : 30
    "Metadata Freshness" : 20
    "Coverage & Consistency" : 20
```

---

### B.2 Dimension Breakdown

#### 1. Schema Completeness (0–30 points)

**Checks:**
- Required canonical fields present (e.g., `apn`, `owner_name`, `geom` for parcels)
- No critical fields with >10% NULL
- Geometry type matches expected (Polygon for parcels, LineString for utilities)

**Scoring Criteria:**

| Condition | Score |
|-----------|-------|
| All required fields present + <5% NULLs | 26–30 |
| Missing 1 non-critical field OR 5–10% NULLs | 20–25 |
| Missing 2+ non-critical fields OR 10–20% NULLs | 10–19 |
| Missing critical fields OR >20% NULLs | 0–9 |

**Required Fields by Dataset Type:**

```yaml
parcels:
  critical: [parcel_id, geom]
  required: [apn, owner_name, situs_address, lot_size_sqft]
  optional: [zoning_code, city, county]

zoning:
  critical: [district_code, geom]
  required: [permitted_uses, height_limit, far]
  optional: [front_setback, side_setback, rear_setback]

flood:
  critical: [flood_zone, geom]
  required: [bfe, floodway_flag]
  optional: [coastal_flag, study_date]

utilities:
  critical: [utility_type, geom]
  required: [diameter, material]
  optional: [install_year, owner, status]
```

---

#### 2. Spatial Coherence (0–30 points)

**Checks:**
- `ST_IsValid(geom)` ratio
- No self-intersections for polygons
- Parcel centroid within jurisdiction boundaries
- Reasonable area range (no 0.0001 sqft or 10M acre outliers)

**Scoring Criteria:**

| Condition | Score |
|-----------|-------|
| ≥99% valid + within expected area ranges | 26–30 |
| 95–99% valid with minor anomalies | 20–25 |
| 90–95% valid OR some area outliers | 10–19 |
| <90% valid OR many absurd features | 0–9 |

**Validation SQL:**

```sql
-- Compute spatial coherence metrics
WITH spatial_stats AS (
  SELECT
    COUNT(*) AS total_features,
    COUNT(*) FILTER (WHERE ST_IsValid(geom)) AS valid_count,
    COUNT(*) FILTER (WHERE ST_Area(geom::geography) < 1) AS tiny_count,
    COUNT(*) FILTER (WHERE ST_Area(geom::geography) > 1000000000) AS huge_count,
    COUNT(*) FILTER (WHERE ST_GeometryType(geom) != 'ST_MultiPolygon' 
                       AND ST_GeometryType(geom) != 'ST_Polygon') AS wrong_type_count
  FROM parcels_canonical
  WHERE dataset_version = 'v2025_11'
)
SELECT
  ROUND(100.0 * valid_count / NULLIF(total_features, 0), 2) AS valid_pct,
  ROUND(100.0 * tiny_count / NULLIF(total_features, 0), 2) AS tiny_pct,
  ROUND(100.0 * huge_count / NULLIF(total_features, 0), 2) AS huge_pct,
  ROUND(100.0 * wrong_type_count / NULLIF(total_features, 0), 2) AS wrong_type_pct
FROM spatial_stats;
```

---

#### 3. Metadata Freshness (0–20 points)

**Checks:**
- `effective_from` and `effective_to` for dataset
- Time since last update
- Source metadata completeness

**Scoring Criteria:**

| Condition | Score |
|-----------|-------|
| Updated <3 months ago + complete metadata | 18–20 |
| Updated 3–6 months ago | 14–17 |
| Updated 6–12 months ago | 8–13 |
| Updated 12–24 months ago | 4–7 |
| >24 months or unknown update date | 0–3 |

**Freshness Calculation:**

```python
def score_freshness(dataset_id: str) -> int:
    """Calculate freshness score (0-20) based on dataset age."""
    dataset = get_dataset(dataset_id)
    
    if not dataset.effective_from:
        return 0  # Unknown freshness
    
    age_days = (datetime.now() - dataset.effective_from).days
    
    if age_days <= 90:      # <3 months
        return 20
    elif age_days <= 180:   # 3-6 months
        return 15
    elif age_days <= 365:   # 6-12 months
        return 10
    elif age_days <= 730:   # 12-24 months
        return 5
    else:                   # >24 months
        return 2
```

---

#### 4. Coverage & Consistency (0–20 points)

**Checks:**
- Percentage of jurisdiction covered (parcels for all city blocks)
- No major gaps or overlaps compared to other datasets
- ETL coverage events (missing layers, errors)

**Scoring Criteria:**

| Condition | Score |
|-----------|-------|
| ≥95% coverage, minimal ETL flags | 18–20 |
| 85–95% coverage, few ETL flags | 14–17 |
| 70–85% coverage, some ETL flags | 8–13 |
| 50–70% coverage, many ETL flags | 4–7 |
| <50% coverage or critical ETL flags | 0–3 |

**Coverage Calculation:**

```sql
-- Calculate coverage as % of jurisdiction boundary filled by parcels
WITH jurisdiction_area AS (
  SELECT ST_Area(geometry::geography) AS total_sqm
  FROM county_boundaries
  WHERE county_name = 'Harris'
),
parcel_coverage AS (
  SELECT ST_Area(ST_Union(geom)::geography) AS covered_sqm
  FROM parcels_canonical
  WHERE jurisdiction = 'houston'
    AND dataset_version = 'v2025_11'
)
SELECT
  ROUND(100.0 * covered_sqm / NULLIF(total_sqm, 0), 2) AS coverage_pct
FROM jurisdiction_area, parcel_coverage;
```

---

### B.3 Implementation

#### Table: `dataset_quality`

```sql
CREATE TABLE public.dataset_quality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  
  -- Individual dimension scores
  schema_score INT CHECK (schema_score >= 0 AND schema_score <= 30),
  spatial_score INT CHECK (spatial_score >= 0 AND spatial_score <= 30),
  freshness_score INT CHECK (freshness_score >= 0 AND freshness_score <= 20),
  coverage_score INT CHECK (coverage_score >= 0 AND coverage_score <= 20),
  
  -- Composite score
  total_score INT GENERATED ALWAYS AS (
    COALESCE(schema_score, 0) + 
    COALESCE(spatial_score, 0) + 
    COALESCE(freshness_score, 0) + 
    COALESCE(coverage_score, 0)
  ) STORED,
  
  -- Detailed breakdown
  details JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  computed_by TEXT DEFAULT 'etl_quality_engine',
  
  UNIQUE(dataset_id)
);

CREATE INDEX idx_dataset_quality_score ON dataset_quality(total_score DESC);
CREATE INDEX idx_dataset_quality_computed ON dataset_quality(computed_at);

COMMENT ON TABLE dataset_quality IS 'Data quality scores (0-100) for each ingested dataset';
```

#### Quality Score Computation (Python)

```python
# _shared/utils/quality_scorer.py

from dataclasses import dataclass
from typing import Dict, Any, Optional
import json

@dataclass
class QualityScore:
    schema_score: int
    spatial_score: int
    freshness_score: int
    coverage_score: int
    details: Dict[str, Any]
    
    @property
    def total_score(self) -> int:
        return (
            self.schema_score + 
            self.spatial_score + 
            self.freshness_score + 
            self.coverage_score
        )
    
    @property
    def tier(self) -> str:
        """Return quality tier based on total score."""
        if self.total_score >= 90:
            return "excellent"
        elif self.total_score >= 75:
            return "good"
        elif self.total_score >= 50:
            return "acceptable"
        elif self.total_score >= 25:
            return "poor"
        else:
            return "critical"


def compute_dataset_quality(dataset_id: str, conn) -> QualityScore:
    """
    Compute comprehensive data quality score for a dataset.
    
    Args:
        dataset_id: UUID of the dataset to score
        conn: Database connection
        
    Returns:
        QualityScore object with all dimension scores
    """
    # Fetch dataset metadata
    dataset = fetch_dataset_metadata(dataset_id, conn)
    
    # Compute each dimension
    schema_result = score_schema_completeness(dataset_id, dataset.dataset_type, conn)
    spatial_result = score_spatial_coherence(dataset_id, dataset.dataset_type, conn)
    freshness_result = score_metadata_freshness(dataset, conn)
    coverage_result = score_coverage_consistency(dataset_id, dataset.jurisdiction, conn)
    
    # Assemble details
    details = {
        "schema": schema_result["details"],
        "spatial": spatial_result["details"],
        "freshness": freshness_result["details"],
        "coverage": coverage_result["details"],
        "computed_at": datetime.now().isoformat(),
        "dataset_version": dataset.dataset_version
    }
    
    score = QualityScore(
        schema_score=schema_result["score"],
        spatial_score=spatial_result["score"],
        freshness_score=freshness_result["score"],
        coverage_score=coverage_result["score"],
        details=details
    )
    
    # Persist to database
    save_quality_score(dataset_id, score, conn)
    
    return score


def score_schema_completeness(dataset_id: str, dataset_type: str, conn) -> Dict:
    """Score schema completeness (0-30)."""
    required_fields = REQUIRED_FIELDS[dataset_type]
    
    # Query for NULL percentages
    null_pcts = query_null_percentages(dataset_id, required_fields, conn)
    
    # Calculate score
    critical_nulls = sum(1 for f, pct in null_pcts.items() 
                         if f in required_fields["critical"] and pct > 10)
    avg_null_pct = sum(null_pcts.values()) / len(null_pcts) if null_pcts else 0
    
    if critical_nulls > 0:
        score = min(9, 30 - critical_nulls * 10)
    elif avg_null_pct < 5:
        score = 28 + int((5 - avg_null_pct) / 2.5)  # 28-30
    elif avg_null_pct < 10:
        score = 23 + int((10 - avg_null_pct))       # 23-28
    elif avg_null_pct < 20:
        score = 13 + int((20 - avg_null_pct) / 2)   # 13-23
    else:
        score = max(0, 13 - int((avg_null_pct - 20) / 5))
    
    return {
        "score": min(30, max(0, score)),
        "details": {
            "null_percentages": null_pcts,
            "critical_nulls": critical_nulls,
            "avg_null_pct": round(avg_null_pct, 2)
        }
    }


def score_spatial_coherence(dataset_id: str, dataset_type: str, conn) -> Dict:
    """Score spatial coherence (0-30)."""
    sql = f"""
    WITH stats AS (
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE ST_IsValid(geom)) AS valid,
        COUNT(*) FILTER (WHERE ST_Area(geom::geography) < 1) AS tiny,
        COUNT(*) FILTER (WHERE ST_Area(geom::geography) > 1e9) AS huge
      FROM {dataset_type}_canonical
      WHERE dataset_version = (SELECT dataset_version FROM datasets WHERE id = %s)
    )
    SELECT 
      100.0 * valid / NULLIF(total, 0) AS valid_pct,
      100.0 * tiny / NULLIF(total, 0) AS tiny_pct,
      100.0 * huge / NULLIF(total, 0) AS huge_pct
    FROM stats
    """
    
    result = conn.execute(sql, [dataset_id]).fetchone()
    valid_pct = result.valid_pct or 0
    anomaly_pct = (result.tiny_pct or 0) + (result.huge_pct or 0)
    
    if valid_pct >= 99 and anomaly_pct < 1:
        score = 28 + int((99 - anomaly_pct) / 50)  # 28-30
    elif valid_pct >= 95:
        score = 20 + int((valid_pct - 95) * 2)     # 20-28
    elif valid_pct >= 90:
        score = 10 + int((valid_pct - 90) * 2)     # 10-20
    else:
        score = max(0, int(valid_pct / 10))        # 0-9
    
    return {
        "score": min(30, max(0, score)),
        "details": {
            "valid_pct": round(valid_pct, 2),
            "tiny_pct": round(result.tiny_pct or 0, 2),
            "huge_pct": round(result.huge_pct or 0, 2)
        }
    }
```

---

### B.4 Quality Score Usage

#### 1. AI Weighting

The AI Risk Engine uses quality scores to weight data confidence:

```python
def get_weighted_attribute(parcel_id: str, attribute: str, datasets: List[Dataset]) -> Tuple[Any, float]:
    """
    Get attribute value weighted by dataset quality.
    Returns (value, confidence) tuple.
    """
    values = []
    for ds in datasets:
        value = get_attribute_from_dataset(parcel_id, attribute, ds)
        quality = get_dataset_quality(ds.id)
        if value is not None:
            values.append((value, quality.total_score / 100.0))
    
    if not values:
        return (None, 0.0)
    
    # Return highest-quality value
    best = max(values, key=lambda x: x[1])
    return best
```

#### 2. UI Display

```tsx
// Quality badge component
const QualityBadge = ({ score }: { score: number }) => {
  const tier = score >= 90 ? 'excellent' : 
               score >= 75 ? 'good' : 
               score >= 50 ? 'acceptable' : 'poor';
  
  return (
    <Badge variant={tier}>
      Data Quality: {score}/100
    </Badge>
  );
};
```

#### 3. ETL Prioritization

Low-quality datasets are automatically queued for refresh:

```python
def prioritize_etl_refresh(conn):
    """Queue low-quality datasets for re-ingestion."""
    sql = """
    SELECT d.id, d.dataset_key, dq.total_score
    FROM datasets d
    JOIN dataset_quality dq ON d.id = dq.dataset_id
    WHERE dq.total_score < 50
      AND d.status = 'active'
    ORDER BY dq.total_score ASC
    LIMIT 10
    """
    
    low_quality = conn.execute(sql).fetchall()
    for dataset in low_quality:
        queue_etl_refresh(dataset.id, priority="high")
```

---

## Part C: AI Risk Scoring Flow

> **Goal:** Define how AI uses only canonical RPCs + canonical tiles to compute a Feasibility Risk Score for any parcel.

### C.1 Data Access Contract

**Principle:** All AI data access goes through RPCs, not ad-hoc SQL.

For any parcel `p`:

```sql
-- Canonical RPC calls for parcel analysis
SELECT * FROM get_zoning_for_parcel(p.id);
SELECT * FROM get_flood_for_parcel(p.id);
SELECT * FROM get_wetlands_for_parcel(p.id);
SELECT * FROM get_utilities_for_parcel(p.id);
SELECT * FROM get_topography_for_parcel(p.id);
SELECT * FROM get_transportation_for_parcel(p.id);
```

---

### C.2 Scoring Flow Diagram

```mermaid
flowchart LR
  subgraph CANONICAL["Canonical Tables"]
    P[(parcels_canonical)]
    Z[(zoning_canonical)]
    F[(fema_flood_canonical)]
    W[(wetlands_canonical)]
    U[(utilities_canonical)]
    T[(transportation_canonical)]
  end

  subgraph RPCS["Canonical RPCs"]
    RPC1[get_zoning_for_parcel]
    RPC2[get_flood_for_parcel]
    RPC3[get_wetlands_for_parcel]
    RPC4[get_utilities_for_parcel]
    RPC5[get_topography_for_parcel]
  end

  subgraph ENGINE["AI Risk Engine"]
    E1[Rules-Based Core]
    E2[Kill-Factor Detection]
    E3[AI Augmentation]
  end

  subgraph OUTPUT["Output"]
    S1[Feasibility Score 0-100]
    S2[Risk Flags]
    S3[Narrative Explanation]
  end

  P --> RPC1 & RPC2 & RPC3 & RPC4 & RPC5
  Z --> RPC1
  F --> RPC2
  W --> RPC3
  U --> RPC4
  T --> RPC5

  RPC1 & RPC2 & RPC3 & RPC4 & RPC5 --> ENGINE
  ENGINE --> OUTPUT
```

---

### C.3 RPC Function Definitions

#### `get_zoning_for_parcel`

```sql
CREATE OR REPLACE FUNCTION get_zoning_for_parcel(parcel_uuid UUID)
RETURNS TABLE (
  district_code TEXT,
  permitted_uses TEXT,
  height_limit NUMERIC,
  far NUMERIC,
  lot_coverage NUMERIC,
  front_setback NUMERIC,
  side_setback NUMERIC,
  rear_setback NUMERIC,
  overlay_flags TEXT[],
  dataset_version TEXT,
  data_quality_score INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    z.district_code,
    z.permitted_uses,
    z.height_limit,
    z.far,
    z.lot_coverage,
    z.front_setback,
    z.side_setback,
    z.rear_setback,
    z.overlay_flags,
    z.dataset_version,
    COALESCE(dq.total_score, 0) AS data_quality_score
  FROM parcels_canonical p
  JOIN zoning_canonical z ON ST_Intersects(p.geom, z.geom)
  LEFT JOIN datasets d ON d.dataset_key = 'zoning_' || p.jurisdiction
  LEFT JOIN dataset_quality dq ON dq.dataset_id = d.id
  WHERE p.id = parcel_uuid
  ORDER BY ST_Area(ST_Intersection(p.geom, z.geom)) DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;
```

#### `get_flood_for_parcel`

```sql
CREATE OR REPLACE FUNCTION get_flood_for_parcel(parcel_uuid UUID)
RETURNS TABLE (
  flood_zone TEXT,
  bfe NUMERIC,
  floodway_flag BOOLEAN,
  coastal_flag BOOLEAN,
  flood_pct NUMERIC,
  most_restrictive_zone TEXT,
  dataset_version TEXT,
  data_quality_score INT
) AS $$
BEGIN
  RETURN QUERY
  WITH parcel AS (
    SELECT geom, jurisdiction FROM parcels_canonical WHERE id = parcel_uuid
  ),
  flood_intersections AS (
    SELECT 
      f.flood_zone,
      f.bfe,
      f.floodway_flag,
      f.coastal_flag,
      f.dataset_version,
      ST_Area(ST_Intersection(p.geom, f.geom)::geography) / 
        NULLIF(ST_Area(p.geom::geography), 0) * 100 AS pct_coverage
    FROM parcel p
    JOIN fema_flood_canonical f ON ST_Intersects(p.geom, f.geom)
  ),
  aggregated AS (
    SELECT 
      STRING_AGG(DISTINCT flood_zone, ', ') AS zones,
      MAX(bfe) AS max_bfe,
      BOOL_OR(floodway_flag) AS any_floodway,
      BOOL_OR(coastal_flag) AS any_coastal,
      SUM(pct_coverage) AS total_flood_pct,
      MAX(dataset_version) AS version,
      -- Most restrictive: floodway > AE > A > AO > X
      CASE 
        WHEN BOOL_OR(floodway_flag) THEN 'FLOODWAY'
        WHEN 'AE' = ANY(ARRAY_AGG(flood_zone)) THEN 'AE'
        WHEN 'A' = ANY(ARRAY_AGG(flood_zone)) THEN 'A'
        WHEN 'AO' = ANY(ARRAY_AGG(flood_zone)) THEN 'AO'
        ELSE 'X'
      END AS most_restrictive
    FROM flood_intersections
  )
  SELECT 
    a.zones,
    a.max_bfe,
    a.any_floodway,
    a.any_coastal,
    ROUND(a.total_flood_pct, 2),
    a.most_restrictive,
    a.version,
    COALESCE(dq.total_score, 0)
  FROM aggregated a
  LEFT JOIN datasets d ON d.dataset_type = 'flood'
  LEFT JOIN dataset_quality dq ON dq.dataset_id = d.id;
END;
$$ LANGUAGE plpgsql STABLE;
```

#### `get_wetlands_for_parcel`

```sql
CREATE OR REPLACE FUNCTION get_wetlands_for_parcel(parcel_uuid UUID)
RETURNS TABLE (
  wetland_types TEXT[],
  wetland_pct NUMERIC,
  has_wetlands BOOLEAN,
  dataset_version TEXT,
  data_quality_score INT
) AS $$
BEGIN
  RETURN QUERY
  WITH parcel AS (
    SELECT geom FROM parcels_canonical WHERE id = parcel_uuid
  ),
  wetland_intersections AS (
    SELECT 
      w.wetland_type,
      w.dataset_version,
      ST_Area(ST_Intersection(p.geom, w.geom)::geography) / 
        NULLIF(ST_Area(p.geom::geography), 0) * 100 AS pct_coverage
    FROM parcel p
    JOIN wetlands_canonical w ON ST_Intersects(p.geom, w.geom)
  )
  SELECT 
    ARRAY_AGG(DISTINCT wetland_type),
    COALESCE(SUM(pct_coverage), 0),
    COALESCE(SUM(pct_coverage), 0) > 0,
    MAX(dataset_version),
    COALESCE(MAX(dq.total_score), 0)
  FROM wetland_intersections wi
  LEFT JOIN datasets d ON d.dataset_type = 'wetlands'
  LEFT JOIN dataset_quality dq ON dq.dataset_id = d.id;
END;
$$ LANGUAGE plpgsql STABLE;
```

#### `get_utilities_for_parcel`

```sql
CREATE OR REPLACE FUNCTION get_utilities_for_parcel(parcel_uuid UUID)
RETURNS TABLE (
  water_distance_ft NUMERIC,
  water_main_size NUMERIC,
  sewer_distance_ft NUMERIC,
  sewer_main_size NUMERIC,
  storm_distance_ft NUMERIC,
  has_water_access BOOLEAN,
  has_sewer_access BOOLEAN,
  serviceability_tier TEXT,
  dataset_version TEXT,
  data_quality_score INT
) AS $$
BEGIN
  RETURN QUERY
  WITH parcel AS (
    SELECT geom, ST_Centroid(geom) AS centroid 
    FROM parcels_canonical 
    WHERE id = parcel_uuid
  ),
  nearest_water AS (
    SELECT 
      ST_Distance(p.centroid::geography, u.geom::geography) * 3.28084 AS dist_ft,
      u.diameter,
      u.dataset_version
    FROM parcel p, utilities_canonical u
    WHERE u.utility_type = 'water'
    ORDER BY p.centroid <-> u.geom
    LIMIT 1
  ),
  nearest_sewer AS (
    SELECT 
      ST_Distance(p.centroid::geography, u.geom::geography) * 3.28084 AS dist_ft,
      u.diameter,
      u.dataset_version
    FROM parcel p, utilities_canonical u
    WHERE u.utility_type = 'sewer'
    ORDER BY p.centroid <-> u.geom
    LIMIT 1
  ),
  nearest_storm AS (
    SELECT 
      ST_Distance(p.centroid::geography, u.geom::geography) * 3.28084 AS dist_ft
    FROM parcel p, utilities_canonical u
    WHERE u.utility_type = 'storm'
    ORDER BY p.centroid <-> u.geom
    LIMIT 1
  )
  SELECT
    COALESCE(w.dist_ft, 99999),
    w.diameter,
    COALESCE(s.dist_ft, 99999),
    s.diameter,
    COALESCE(st.dist_ft, 99999),
    COALESCE(w.dist_ft, 99999) < 500,
    COALESCE(s.dist_ft, 99999) < 500,
    CASE
      WHEN COALESCE(w.dist_ft, 99999) < 200 AND COALESCE(s.dist_ft, 99999) < 200 THEN 'gravity'
      WHEN COALESCE(w.dist_ft, 99999) < 500 AND COALESCE(s.dist_ft, 99999) < 1000 THEN 'extension'
      WHEN COALESCE(s.dist_ft, 99999) < 2000 THEN 'lift_station'
      ELSE 'septic'
    END,
    COALESCE(w.dataset_version, s.dataset_version),
    COALESCE(dq.total_score, 0)
  FROM nearest_water w, nearest_sewer s, nearest_storm st
  LEFT JOIN datasets d ON d.dataset_type = 'utilities'
  LEFT JOIN dataset_quality dq ON dq.dataset_id = d.id;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

### C.4 Risk Engine Implementation

#### Step 1: Fetch Canonical Attributes

```typescript
// Edge Function: enrich-feasibility
async function fetchCanonicalAttributes(parcelId: string) {
  const supabase = createClient();
  
  const [zoning, flood, wetlands, utilities] = await Promise.all([
    supabase.rpc("get_zoning_for_parcel", { parcel_uuid: parcelId }),
    supabase.rpc("get_flood_for_parcel", { parcel_uuid: parcelId }),
    supabase.rpc("get_wetlands_for_parcel", { parcel_uuid: parcelId }),
    supabase.rpc("get_utilities_for_parcel", { parcel_uuid: parcelId }),
  ]);
  
  return {
    zoning: zoning.data?.[0] ?? null,
    flood: flood.data?.[0] ?? null,
    wetlands: wetlands.data?.[0] ?? null,
    utilities: utilities.data?.[0] ?? null,
  };
}
```

#### Step 2: Assemble Normalized JSON

```typescript
interface CanonicalParcelData {
  zoning: {
    district_code: string;
    permitted_uses: string;
    height_limit: number;
    far: number;
    data_quality_score: number;
  } | null;
  flood: {
    flood_zone: string;
    bfe: number;
    floodway_flag: boolean;
    flood_pct: number;
    most_restrictive_zone: string;
    data_quality_score: number;
  } | null;
  wetlands: {
    wetland_types: string[];
    wetland_pct: number;
    has_wetlands: boolean;
    data_quality_score: number;
  } | null;
  utilities: {
    water_distance_ft: number;
    sewer_distance_ft: number;
    serviceability_tier: string;
    data_quality_score: number;
  } | null;
}
```

#### Step 3: Rules-Based Core + AI Augmentation

```typescript
// Kill-factor detection
interface KillFactor {
  code: string;
  severity: 'critical' | 'major' | 'moderate';
  description: string;
  score_impact: number;
}

const KILL_FACTORS: Record<string, KillFactor> = {
  FLOODWAY: {
    code: 'FLOODWAY',
    severity: 'critical',
    description: 'Parcel intersects FEMA regulatory floodway',
    score_impact: -100,  // Automatic zero
  },
  NO_UTILITIES: {
    code: 'NO_UTILITIES',
    severity: 'critical',
    description: 'No public water/sewer within 2000 ft',
    score_impact: -50,
  },
  WETLAND_MAJORITY: {
    code: 'WETLAND_MAJORITY',
    severity: 'critical',
    description: 'Wetlands cover >50% of parcel',
    score_impact: -40,
  },
  STEEP_SLOPE: {
    code: 'STEEP_SLOPE',
    severity: 'major',
    description: '>30% of parcel has slope >15%',
    score_impact: -25,
  },
  FLOOD_HIGH_RISK: {
    code: 'FLOOD_HIGH_RISK',
    severity: 'major',
    description: 'Parcel in AE/A zone (>50% coverage)',
    score_impact: -20,
  },
};

function detectKillFactors(data: CanonicalParcelData): KillFactor[] {
  const factors: KillFactor[] = [];
  
  // Floodway check
  if (data.flood?.floodway_flag) {
    factors.push(KILL_FACTORS.FLOODWAY);
  }
  
  // Utility check
  if (data.utilities?.serviceability_tier === 'septic' && 
      data.utilities?.water_distance_ft > 2000) {
    factors.push(KILL_FACTORS.NO_UTILITIES);
  }
  
  // Wetlands check
  if (data.wetlands?.wetland_pct > 50) {
    factors.push(KILL_FACTORS.WETLAND_MAJORITY);
  }
  
  // Flood zone check
  if (data.flood?.flood_pct > 50 && 
      ['AE', 'A'].includes(data.flood?.most_restrictive_zone)) {
    factors.push(KILL_FACTORS.FLOOD_HIGH_RISK);
  }
  
  return factors;
}
```

#### Step 4: Compute Final Score

```typescript
interface FeasibilityResult {
  feasibility_score: number;
  risk_tier: 'Low' | 'Moderate' | 'High' | 'Critical';
  risk_flags: string[];
  kill_factors: KillFactor[];
  explanation: string;
  data_confidence: number;
}

function computeFeasibilityScore(data: CanonicalParcelData): FeasibilityResult {
  // Start with base score
  let score = 100;
  const riskFlags: string[] = [];
  
  // Detect kill factors
  const killFactors = detectKillFactors(data);
  
  // Apply kill factor penalties
  for (const kf of killFactors) {
    score += kf.score_impact;
    riskFlags.push(kf.code);
  }
  
  // Apply moderate penalties
  if (data.flood?.flood_pct > 20 && data.flood?.flood_pct <= 50) {
    score -= 10;
    riskFlags.push('PARTIAL_FLOOD_ZONE');
  }
  
  if (data.wetlands?.wetland_pct > 20 && data.wetlands?.wetland_pct <= 50) {
    score -= 10;
    riskFlags.push('PARTIAL_WETLANDS');
  }
  
  if (data.utilities?.serviceability_tier === 'lift_station') {
    score -= 15;
    riskFlags.push('REQUIRES_LIFT_STATION');
  } else if (data.utilities?.serviceability_tier === 'extension') {
    score -= 8;
    riskFlags.push('UTILITY_EXTENSION_NEEDED');
  }
  
  // Normalize score
  score = Math.max(0, Math.min(100, score));
  
  // Calculate data confidence (average of quality scores)
  const qualityScores = [
    data.zoning?.data_quality_score,
    data.flood?.data_quality_score,
    data.wetlands?.data_quality_score,
    data.utilities?.data_quality_score,
  ].filter(Boolean) as number[];
  
  const dataConfidence = qualityScores.length > 0 
    ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length / 100
    : 0.5;
  
  // Determine risk tier
  const riskTier = 
    score >= 80 ? 'Low' :
    score >= 60 ? 'Moderate' :
    score >= 30 ? 'High' : 'Critical';
  
  return {
    feasibility_score: score,
    risk_tier: riskTier,
    risk_flags: riskFlags,
    kill_factors: killFactors,
    explanation: generateExplanation(score, riskTier, riskFlags, data),
    data_confidence: dataConfidence,
  };
}
```

---

### C.5 Output Schema

```typescript
// Final feasibility response
interface FeasibilityResponse {
  parcel_id: string;
  feasibility_score: number;         // 0-100
  risk_tier: string;                  // Low, Moderate, High, Critical
  risk_flags: string[];               // Array of flag codes
  kill_factors: {
    code: string;
    severity: string;
    description: string;
  }[];
  explanation: string;                // AI-generated narrative
  data_confidence: number;            // 0-1 based on quality scores
  data_sources: {
    zoning: { version: string; quality: number };
    flood: { version: string; quality: number };
    wetlands: { version: string; quality: number };
    utilities: { version: string; quality: number };
  };
  computed_at: string;                // ISO timestamp
}
```

**Example Output:**

```json
{
  "parcel_id": "550e8400-e29b-41d4-a716-446655440000",
  "feasibility_score": 72,
  "risk_tier": "Moderate",
  "risk_flags": [
    "PARTIAL_FLOOD_ZONE",
    "UTILITY_EXTENSION_NEEDED"
  ],
  "kill_factors": [],
  "explanation": "Site is buildable by-right in C-2 zoning with modest off-site sewer extension (estimated 350 ft) and low-to-moderate flood risk. Approximately 25% of parcel lies within AE flood zone; recommend building footprint oriented to avoid flood-prone areas. No wetlands or environmental constraints detected.",
  "data_confidence": 0.87,
  "data_sources": {
    "zoning": { "version": "v2025_03", "quality": 92 },
    "flood": { "version": "v2025_09", "quality": 88 },
    "wetlands": { "version": "v2025_06", "quality": 85 },
    "utilities": { "version": "v2025_11", "quality": 82 }
  },
  "computed_at": "2025-12-09T14:30:00Z"
}
```

---

## Cross-References

| Document | Purpose |
|----------|---------|
| [CANONICAL_SCHEMA.md](./CANONICAL_SCHEMA.md) | Canonical data model definitions |
| [ETL_SYSTEM_BLUEPRINT.md](./ETL_SYSTEM_BLUEPRINT.md) | ETL pipeline architecture |
| [TRANSFORM_CONFIG_DSL.md](./TRANSFORM_CONFIG_DSL.md) | Dataset transformation language |
| [HOUSTON_REPLICATION_MOAT.md](./HOUSTON_REPLICATION_MOAT.md) | Houston-specific data moat |

---

## Quick Reference

### Tile URL Patterns

```bash
# Public tiles
/tiles/us/tx/harris/parcels/v2025_11/{z}/{x}/{y}.pbf

# Tenant-scoped tiles
/tiles/tenant/{tenant_id}/us/tx/harris/parcels/v2025_11/{z}/{x}/{y}.pbf
```

### Quality Score Thresholds

| Score | Tier | Action |
|-------|------|--------|
| 90-100 | Excellent | Production-ready |
| 75-89 | Good | Minor improvements |
| 50-74 | Acceptable | Schedule refresh |
| 25-49 | Poor | Priority refresh |
| 0-24 | Critical | Block from use |

### Kill Factors

| Code | Severity | Score Impact |
|------|----------|--------------|
| FLOODWAY | Critical | -100 (zero) |
| NO_UTILITIES | Critical | -50 |
| WETLAND_MAJORITY | Critical | -40 |
| STEEP_SLOPE | Major | -25 |
| FLOOD_HIGH_RISK | Major | -20 |

---

*Last Updated: December 2025*
*Version: 2.0.0*
