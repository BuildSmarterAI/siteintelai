# SiteIntel™ ETL System Blueprint

> **"ETL IS THE MOAT"** — Competitors call public APIs on the fly.  
> SiteIntel ingests, normalizes, versions, and owns its datasets.

---

## Table of Contents

1. [Core Principle](#core-principle)
2. [Competitive Advantage](#competitive-advantage)
3. [Folder Architecture](#folder-architecture)
4. [Workflow Overview](#workflow-overview)
5. [Base ETL Class](#base-etl-class)
6. [Shared Configuration Files](#shared-configuration-files)
7. [Shared Utilities](#shared-utilities)
8. [City-Specific ETL Examples](#city-specific-etl-examples)
9. [Canonical Table Design](#canonical-table-design)
10. [Job Runners & Orchestration](#job-runners--orchestration)
11. [Dataset Registration](#dataset-registration)
12. [Vector Tile Generation](#vector-tile-generation)
13. [Integration with Edge Functions](#integration-with-edge-functions)
14. [Deployment & Scheduling](#deployment--scheduling)
15. [Monitoring & Alerting](#monitoring--alerting)
16. [Error Handling & Recovery](#error-handling--recovery)
17. [Cross-References](#cross-references)

---

## Core Principle

The SiteIntel ETL system is the foundation of our **data moat**—the structural competitive advantage that cannot be replicated by competitors simply calling public APIs.

### What This Means

| Approach | Competitors | SiteIntel |
|----------|-------------|-----------|
| **Data Access** | Call city APIs on-demand | Own replicated datasets |
| **Uptime Dependency** | Fail when city servers down | Always available |
| **Schema Control** | Accept whatever city provides | Unified canonical schema |
| **Versioning** | No history | Full version tracking |
| **Provenance** | Unknown data lineage | Complete audit trail |
| **Performance** | API latency + rate limits | Instant local queries |
| **Reproducibility** | Cannot reproduce past reports | Any report reproducible |

---

## Competitive Advantage

### Why ETL Creates Permanent Moat

1. **No Dependency on City Endpoint Uptime**
   - City GIS servers go down for maintenance
   - Rate limits throttle real-time queries
   - SiteIntel serves from replicated PostGIS

2. **Unified Attribute Schemas Nationwide**
   - Houston uses `ZONE`, Austin uses `ZONING_CODE`, Dallas uses `ZN_DISTRICT`
   - All normalize to `district_code` in canonical schema
   - AI engines receive consistent inputs

3. **Versioned Datasets**
   - Format: `{city}_{dataset}_v{YYYY}_{MM}`
   - Example: `houston_zoning_v2025_03`
   - Full history preserved for audit

4. **Complete Provenance Logs**
   - Source MapServer URL
   - Layer ID and name
   - ETL version that processed it
   - Source data license
   - Fetch timestamp

5. **Instant Reproducibility**
   - Any feasibility report can be regenerated
   - Lender audits satisfied with exact data versions
   - Regulatory compliance maintained

---

## Folder Architecture

```
/etl/
├── _shared/
│   ├── config/
│   │   ├── schema_map.yml          # Field aliasing per dataset type
│   │   ├── layer_definitions.yml   # Layer metadata registry
│   │   ├── field_aliases.yml       # Canonical field mappings
│   │   ├── ingestion_rules.yml     # ETL behavior rules
│   │   └── crs_definitions.yml     # Coordinate reference systems
│   │
│   ├── utils/
│   │   ├── fetch_arcgis.py         # ArcGIS REST fetcher with pagination
│   │   ├── fetch_wfs.py            # WFS/GeoServer fetcher
│   │   ├── fetch_shapefile.py      # Shapefile/ZIP handler
│   │   ├── fetch_geojson.py        # GeoJSON URL fetcher
│   │   ├── normalize_fields.py     # Field alias resolution
│   │   ├── reprojection.py         # CRS transformation (pyproj)
│   │   ├── validator.py            # Geometry/attribute validation
│   │   ├── pg_uploader.py          # PostGIS insert/upsert
│   │   ├── tile_generator.py       # Tippecanoe wrapper
│   │   ├── s3_uploader.py          # AWS S3 tile upload
│   │   ├── cache_invalidator.py    # CloudFront cache purge
│   │   └── logger.py               # Structured logging
│   │
│   ├── base_etl.py                 # Abstract base class
│   ├── canonical_schema.sql        # DDL for canonical tables
│   └── canonical_schema.json       # JSON schema reference
│
├── houston/
│   ├── __init__.py
│   ├── parcels_houston.py          # HCAD parcel ingestion
│   ├── zoning_houston.py           # Houston zoning (unique - no traditional zones)
│   ├── flood_houston.py            # Harris County FEMA data
│   ├── wetlands_houston.py         # Local wetland overlays
│   ├── utilities_houston.py        # Water/sewer/storm lines
│   ├── stormwater_houston.py       # Stormwater infrastructure
│   └── wastewater_houston.py       # Wastewater force mains
│
├── austin/
│   ├── __init__.py
│   ├── parcels_austin.py           # TCAD parcel ingestion
│   ├── zoning_austin.py            # Austin zoning districts
│   ├── flood_austin.py             # Travis County FEMA
│   └── utilities_austin.py         # Austin Water utilities
│
├── dallas/
│   ├── __init__.py
│   ├── parcels_dallas.py           # DCAD parcel ingestion
│   ├── zoning_dallas.py            # Dallas zoning districts
│   └── utilities_dallas.py         # Dallas Water utilities
│
├── san_antonio/
│   ├── __init__.py
│   ├── parcels_san_antonio.py      # BCAD parcel ingestion
│   ├── zoning_san_antonio.py       # San Antonio zoning
│   └── utilities_san_antonio.py    # SAWS utilities
│
├── fort_worth/
│   ├── __init__.py
│   ├── parcels_fort_worth.py       # TAD parcel ingestion
│   └── zoning_fort_worth.py        # Fort Worth zoning
│
├── state_texas/
│   ├── __init__.py
│   ├── nfhl_statewide.py           # Texas-wide FEMA NFHL
│   ├── txdot_roads.py              # TxDOT road network
│   ├── txdot_aadt.py               # TxDOT traffic counts
│   └── railroad_commission.py      # Oil/gas wells, pipelines
│
├── national/
│   ├── __init__.py
│   ├── wetlands_usfws.py           # USFWS National Wetlands Inventory
│   ├── fema_nfhl.py                # FEMA National Flood Hazard Layer
│   ├── census_acs.py               # Census ACS demographics
│   ├── census_tiger.py             # TIGER/Line boundaries
│   ├── epa_echo.py                 # EPA facility data
│   └── usgs_ned.py                 # USGS elevation data
│
├── jobs/
│   ├── __init__.py
│   ├── ingest_city.py              # Single city orchestrator
│   ├── ingest_dataset.py           # Single dataset ingestion
│   ├── run_all.py                  # Full ETL runner
│   ├── run_houston.py              # Houston-only ETL
│   ├── run_texas.py                # Texas-wide ETL
│   ├── refresh_tiles.py            # Tile regeneration job
│   ├── validate_all.py             # Validation runner
│   └── cleanup_staging.py          # Staging table cleanup
│
├── tests/
│   ├── __init__.py
│   ├── test_fetch_arcgis.py
│   ├── test_normalize_fields.py
│   ├── test_validator.py
│   ├── test_houston_parcels.py
│   └── conftest.py                 # pytest fixtures
│
├── docker/
│   ├── Dockerfile                  # ETL worker container
│   ├── docker-compose.yml          # Local development
│   └── requirements.txt            # Python dependencies
│
├── .env.example                    # Environment template
└── README.md                       # Getting started guide
```

### Folder Descriptions

| Folder | Purpose |
|--------|---------|
| `_shared/` | Reusable components across all jurisdictions |
| `_shared/config/` | YAML configuration files for field mappings |
| `_shared/utils/` | Python utility modules |
| `houston/` | Houston-specific ETL scripts |
| `austin/` | Austin-specific ETL scripts |
| `dallas/` | Dallas-specific ETL scripts |
| `state_texas/` | Texas statewide datasets |
| `national/` | Federal/national datasets |
| `jobs/` | Orchestration and runner scripts |
| `tests/` | Unit and integration tests |
| `docker/` | Container configuration |

---

## Workflow Overview

### 9-Step ETL Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SiteIntel ETL Pipeline                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. FETCH                                                                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Pull raw data from source (ArcGIS REST, WFS, Shapefile, GeoJSON, ZIP)     │
│  Input: Source URL + Layer ID                                               │
│  Output: Raw GeoJSON in memory                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  2. NORMALIZE FIELDS                                                        │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Apply field alias map → canonical keys                                     │
│  Input: Raw GeoJSON with city-specific field names                          │
│  Output: GeoJSON with canonical field names                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  3. REPROJECT                                                               │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Transform coordinates → EPSG:4326 (geometry) + meters (distances)         │
│  Input: GeoJSON in source CRS (often State Plane)                           │
│  Output: GeoJSON in WGS84 (EPSG:4326)                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  4. VALIDATE                                                                │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Ensure valid geometries, required fields present, value ranges correct     │
│  Input: Normalized GeoJSON                                                  │
│  Output: Validated GeoJSON (invalid records logged/skipped)                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  5. INSERT → STAGING SCHEMA                                                 │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Load into raw staging table: staging_raw_{city}_{layer}_{version}          │
│  Input: Validated GeoJSON                                                   │
│  Output: PostGIS staging table                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  6. TRANSFORM → CANONICAL SCHEMA                                            │
│  ─────────────────────────────────────────────────────────────────────────  │
│  SQL transform from staging to canonical table with ST_MakeValid            │
│  Input: Staging table                                                       │
│  Output: Rows in canonical table (e.g., zoning_canonical)                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  7. VERSION + METADATA                                                      │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Register dataset in `datasets` + `map_servers` + `map_server_layers`       │
│  Input: Transform results                                                   │
│  Output: Dataset registration with version, record count, status            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  8. GENERATE VECTOR TILES                                                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Tippecanoe / Martin / pg_tileserv → /tiles/us/tx/{county}/{type}/{ver}/   │
│  Input: Canonical table subset                                              │
│  Output: .mbtiles + directory structure                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  9. PUBLISH & INVALIDATE                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Push to S3 + CloudFront, update dataset_version in Supabase                │
│  Input: Tile directory                                                      │
│  Output: CDN-hosted tiles, updated metadata                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Pipeline Diagram (Mermaid)

```mermaid
flowchart TD
    subgraph Sources["Data Sources"]
        S1[ArcGIS REST]
        S2[WFS/WMS]
        S3[Shapefile/ZIP]
        S4[GeoJSON URL]
    end

    subgraph Ingestion["1. Fetch"]
        F1[fetch_arcgis.py]
        F2[fetch_wfs.py]
        F3[fetch_shapefile.py]
        F4[fetch_geojson.py]
    end

    subgraph Transform["2-4. Transform & Validate"]
        T1[Normalize Fields]
        T2[Reproject → EPSG:4326]
        T3[Validate Geometry]
        T4[Validate Attributes]
    end

    subgraph Load["5-6. Load"]
        L1[staging_raw_*]
        L2[SQL Transform]
        L3[*_canonical tables]
    end

    subgraph Publish["7-9. Publish"]
        P1[Register in datasets]
        P2[Generate Tiles]
        P3[Upload to S3/CDN]
        P4[Invalidate Cache]
    end

    S1 --> F1
    S2 --> F2
    S3 --> F3
    S4 --> F4

    F1 --> T1
    F2 --> T1
    F3 --> T1
    F4 --> T1

    T1 --> T2
    T2 --> T3
    T3 --> T4

    T4 --> L1
    L1 --> L2
    L2 --> L3

    L3 --> P1
    P1 --> P2
    P2 --> P3
    P3 --> P4
```

---

## Base ETL Class

The `BaseETL` class provides the foundation for all dataset-specific ETL implementations.

### `_shared/base_etl.py`

```python
"""
SiteIntel ETL Base Class

Abstract base class for all dataset-specific ETL implementations.
Provides standardized workflow: fetch → normalize → reproject → validate → load → transform.
"""

import os
import json
import logging
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, List, Optional, Any

from utils.fetch_arcgis import fetch_arcgis
from utils.fetch_wfs import fetch_wfs
from utils.fetch_shapefile import fetch_shapefile
from utils.normalize_fields import normalize_fields
from utils.reprojection import reproject_to_4326
from utils.validator import validate_features
from utils.pg_uploader import upload_to_staging, run_sql
from utils.logger import get_logger

logger = get_logger(__name__)


class BaseETL(ABC):
    """
    Abstract base class for all ETL jobs.
    
    Subclasses must implement:
        - to_canonical(): SQL transform from staging to canonical table
    
    Optional overrides:
        - fetch(): Custom fetch logic
        - validate(): Custom validation rules
        - post_process(): Post-transform hooks
    """
    
    # Class-level configuration
    SOURCE_TYPE = "arcgis"  # arcgis | wfs | shapefile | geojson
    
    def __init__(
        self,
        source_url: str,
        layer_name: str,
        dataset_type: str,
        jurisdiction: str,
        version: str,
        source_crs: int = 4326,
        target_crs: int = 4326,
        config: Optional[Dict] = None
    ):
        """
        Initialize ETL job.
        
        Args:
            source_url: Base URL of data source
            layer_name: Layer ID or name
            dataset_type: Type (parcels, zoning, flood, utilities, etc.)
            jurisdiction: City/county name (houston, austin, etc.)
            version: Version string (v2025_03)
            source_crs: Source coordinate reference system (EPSG code)
            target_crs: Target CRS (default EPSG:4326)
            config: Optional configuration overrides
        """
        self.source_url = source_url
        self.layer_name = layer_name
        self.dataset_type = dataset_type
        self.jurisdiction = jurisdiction
        self.version = version
        self.source_crs = source_crs
        self.target_crs = target_crs
        self.config = config or {}
        
        # Derived paths
        self.staging_table = f"staging_raw_{jurisdiction}_{dataset_type}_{version}"
        self.raw_path = f"tmp/{jurisdiction}_{dataset_type}_{version}.geojson"
        
        # Metrics
        self.metrics = {
            "started_at": None,
            "finished_at": None,
            "records_fetched": 0,
            "records_valid": 0,
            "records_loaded": 0,
            "records_transformed": 0,
            "errors": []
        }
        
        logger.info(f"Initialized ETL: {jurisdiction}/{dataset_type} v{version}")
    
    def run(self) -> Dict[str, Any]:
        """
        Execute full ETL pipeline.
        
        Returns:
            Metrics dictionary with job results
        """
        self.metrics["started_at"] = datetime.utcnow().isoformat()
        
        try:
            # Step 1: Fetch raw data
            logger.info(f"[1/6] Fetching data from {self.source_url}")
            data = self.fetch()
            self.metrics["records_fetched"] = len(data.get("features", []))
            logger.info(f"Fetched {self.metrics['records_fetched']} features")
            
            # Step 2: Normalize field names
            logger.info(f"[2/6] Normalizing fields for {self.dataset_type}")
            data = normalize_fields(data, self.dataset_type)
            
            # Step 3: Reproject to target CRS
            if self.source_crs != self.target_crs:
                logger.info(f"[3/6] Reprojecting {self.source_crs} → {self.target_crs}")
                data = reproject_to_4326(data, self.source_crs)
            else:
                logger.info(f"[3/6] Skipping reprojection (already {self.target_crs})")
            
            # Step 4: Validate geometry and attributes
            logger.info(f"[4/6] Validating features")
            data, invalid = self.validate(data)
            self.metrics["records_valid"] = len(data.get("features", []))
            if invalid:
                logger.warning(f"Skipped {len(invalid)} invalid features")
                self.metrics["errors"].extend(invalid[:10])  # Log first 10
            
            # Step 5: Upload to staging table
            logger.info(f"[5/6] Uploading to staging: {self.staging_table}")
            upload_to_staging(data, self.jurisdiction, self.dataset_type, self.version)
            self.metrics["records_loaded"] = self.metrics["records_valid"]
            
            # Step 6: Transform to canonical schema
            logger.info(f"[6/6] Transforming to canonical schema")
            self.to_canonical()
            self.metrics["records_transformed"] = self._count_canonical_records()
            
            # Optional post-processing
            self.post_process()
            
            logger.info(f"ETL complete: {self.metrics['records_transformed']} records in canonical table")
            
        except Exception as e:
            logger.error(f"ETL failed: {e}")
            self.metrics["errors"].append(str(e))
            raise
        
        finally:
            self.metrics["finished_at"] = datetime.utcnow().isoformat()
        
        return self.metrics
    
    def fetch(self) -> Dict:
        """
        Fetch raw data from source.
        
        Override for custom fetch logic.
        
        Returns:
            GeoJSON FeatureCollection
        """
        if self.SOURCE_TYPE == "arcgis":
            return fetch_arcgis(self.source_url, self.layer_name, self.config)
        elif self.SOURCE_TYPE == "wfs":
            return fetch_wfs(self.source_url, self.layer_name, self.config)
        elif self.SOURCE_TYPE == "shapefile":
            return fetch_shapefile(self.source_url, self.config)
        else:
            raise ValueError(f"Unknown source type: {self.SOURCE_TYPE}")
    
    def validate(self, data: Dict) -> tuple:
        """
        Validate features.
        
        Override for custom validation rules.
        
        Args:
            data: GeoJSON FeatureCollection
            
        Returns:
            Tuple of (valid_data, invalid_features)
        """
        return validate_features(data, self.dataset_type)
    
    @abstractmethod
    def to_canonical(self) -> None:
        """
        Transform staging data to canonical schema.
        
        Must be implemented by subclass.
        """
        raise NotImplementedError("Subclass must implement to_canonical()")
    
    def post_process(self) -> None:
        """
        Optional post-transform hook.
        
        Override to add custom post-processing (e.g., index refresh, notifications).
        """
        pass
    
    def _count_canonical_records(self) -> int:
        """Count records inserted into canonical table."""
        # Determine canonical table name based on dataset_type
        canonical_tables = {
            "parcels": "parcels_canonical",
            "zoning": "zoning_canonical",
            "flood": "fema_flood_canonical",
            "utilities": "utilities_canonical",
            "wetlands": "wetlands_canonical",
        }
        table = canonical_tables.get(self.dataset_type, f"{self.dataset_type}_canonical")
        
        sql = f"""
        SELECT COUNT(*) 
        FROM {table} 
        WHERE jurisdiction = '{self.jurisdiction}' 
          AND dataset_version = '{self.version}'
        """
        result = run_sql(sql, fetch=True)
        return result[0][0] if result else 0
    
    def get_staging_table_name(self) -> str:
        """Return the staging table name."""
        return self.staging_table
    
    def cleanup_staging(self) -> None:
        """Drop the staging table after successful ETL."""
        sql = f"DROP TABLE IF EXISTS {self.staging_table}"
        run_sql(sql)
        logger.info(f"Dropped staging table: {self.staging_table}")
```

### Usage Example

```python
from _shared.base_etl import BaseETL

class HoustonZoningETL(BaseETL):
    def __init__(self):
        super().__init__(
            source_url="https://gis.houstontx.gov/arcgis/rest/services/Zoning/MapServer",
            layer_name="0",
            dataset_type="zoning",
            jurisdiction="houston",
            version="v2025_03",
            source_crs=2278,  # Texas State Plane South Central
        )
    
    def to_canonical(self):
        sql = f"""
        INSERT INTO zoning_canonical (
            jurisdiction, district_code, permitted_uses, height_limit,
            far, lot_coverage, front_setback, side_setback, rear_setback,
            overlay_flags, geom, dataset_version
        )
        SELECT
            'houston',
            zone AS district_code,
            permitted_uses,
            height_limit,
            far,
            lot_coverage,
            front_setback,
            side_setback,
            rear_setback,
            overlay_flags,
            ST_MakeValid(geom),
            '{self.version}'
        FROM {self.staging_table}
        ON CONFLICT (jurisdiction, district_code, geom)
        DO NOTHING;
        """
        run_sql(sql)
```

---

## Shared Configuration Files

### `_shared/config/schema_map.yml`

Field mappings for each canonical dataset type. Lists all known source field names that map to each canonical field.

```yaml
# schema_map.yml
# Maps source field names (aliases) to canonical field names
# Format: canonical_field: [list, of, source, field, aliases]

# ============================================================================
# PARCELS
# ============================================================================
parcels:
  # Identifiers
  id:
    - OBJECTID
    - FID
    - OID
  parcel_id:
    - PARCEL_ID
    - PARCELID
    - LOWPARCELID
    - HCAD_NUM
    - PROP_ID
  apn:
    - APN
    - ACCOUNT
    - ACCT
    - ACCT_NUM
    - ACCOUNT_NUM
    - TAX_ID
    
  # Owner information
  owner_name:
    - OWNERNAME
    - OWNER_NAME
    - OWNER1
    - CurrOwner
    - OWNER
    - GRANTEE
  owner_address:
    - OWNER_ADDR
    - OWNERADDR
    - MAIL_ADDR
    - MAILING_ADDRESS
  
  # Site information
  situs_address:
    - SITUS
    - SITUS_ADDR
    - SITE_ADDR
    - PROPERTY_ADDRESS
    - ADDRESS
    - FULL_ADDRESS
  city:
    - CITY
    - SITUS_CITY
    - SITE_CITY
  county:
    - COUNTY
    - COUNTY_NAME
  state:
    - STATE
    - STATE_CODE
  zip:
    - ZIP
    - ZIP_CODE
    - POSTAL_CODE
    
  # Size and dimensions
  lot_size_sqft:
    - LOT_SIZE
    - AREA_SQFT
    - LAND_SQFT
    - GIS_ACRES  # multiply by 43560
    - StatedArea
    - SHAPE_Area
  lot_size_acres:
    - ACRES
    - GIS_ACRES
    - LAND_ACRES
    - ACREAGE
    
  # Zoning
  zoning_code:
    - ZONE
    - ZONING
    - ZONING_CODE
    - ZN_CODE
    
  # Value
  total_value:
    - TOT_VAL
    - TOTAL_VALUE
    - MARKET_VALUE
    - APPRAISED_VALUE
  land_value:
    - LAND_VAL
    - LAND_VALUE
  improvement_value:
    - IMPR_VAL
    - IMPRV_VAL
    - IMPROVEMENT_VALUE
    
  # Geometry
  geometry:
    - geometry
    - geom
    - SHAPE

# ============================================================================
# ZONING
# ============================================================================
zoning:
  id:
    - OBJECTID
    - FID
  district_code:
    - ZONE
    - ZONINGCODE
    - ZONING_CODE
    - ZN_CODE
    - ZN_DISTRICT
    - ZONE_CODE
    - DISTRICT
  district_name:
    - ZONE_NAME
    - ZONE_DESC
    - DESCRIPTION
    - ZONING_NAME
  permitted_uses:
    - USE
    - PERMIT_USE
    - PERMITTED_USES
    - ALLOWED_USES
  height_limit:
    - HEIGHT_LIM
    - MAX_HEIGHT
    - HEIGHT_MAX
    - BLDG_HEIGHT
    - HEIGHT_FT
  height_limit_stories:
    - MAX_STORIES
    - STORIES_MAX
    - NUM_STORIES
  far:
    - FAR
    - FLOOR_AREA_RATIO
    - F_A_R
  lot_coverage:
    - LOT_COV
    - LOT_COVERAGE
    - MAX_COVERAGE
    - COVERAGE_PCT
  front_setback:
    - SET_F
    - FRONT
    - FRONT_SETBACK
    - SETBACK_FRONT
    - FRONT_YD
  side_setback:
    - SET_S
    - SIDE
    - SIDE_SETBACK
    - SETBACK_SIDE
    - SIDE_YD
  rear_setback:
    - SET_R
    - REAR
    - REAR_SETBACK
    - SETBACK_REAR
    - REAR_YD
  min_lot_size:
    - MIN_LOT
    - MIN_LOT_SIZE
    - LOT_MIN_SQFT
  min_lot_width:
    - MIN_WIDTH
    - MIN_LOT_WIDTH
    - LOT_WIDTH
  overlay_flags:
    - OVERLAY
    - DISTRICT_OVER
    - OVERLAY_DISTRICT
    - OVERLAYS
  geometry:
    - geometry
    - geom
    - SHAPE

# ============================================================================
# FLOOD
# ============================================================================
flood:
  id:
    - OBJECTID
    - FID
  flood_zone:
    - ZONE
    - FLD_ZONE
    - FLOOD_ZONE
    - SFHA_TF
    - ZONE_SUBTY
  flood_zone_subtype:
    - ZONE_SUBTY
    - FLD_SUBTY
  bfe:
    - BFE
    - BASE_FLOOD_ELEV
    - STATIC_BFE
    - BFE_REVERT
  bfe_unit:
    - BFE_LN_TYP
    - ELEV_UNIT
  floodway:
    - FLOODWAY
    - FW
    - FLOODWAY_FLAG
  coastal:
    - COASTAL
    - V_DATUM
    - COASTAL_FLAG
  panel_id:
    - DFIRM_ID
    - FIRM_PAN
    - PANEL_ID
    - PANEL
  effective_date:
    - EFF_DATE
    - EFFECTIVE_DATE
  geometry:
    - geometry
    - geom
    - SHAPE

# ============================================================================
# UTILITIES
# ============================================================================
utilities:
  id:
    - OBJECTID
    - FID
    - FACILITYID
    - FACILITY_ID
  line_id:
    - PIPE_ID
    - LINE_ID
    - MAIN_ID
    - SEGMENT_ID
  utility_type:
    - UTIL_TYPE
    - UTILITY_TYPE
    - TYPE
  diameter:
    - DIAMETER
    - PIPE_DIAM
    - SIZE
    - WTR_SIZE
    - SEWER_SIZE
    - MAINSIZE
  diameter_unit:
    - DIAM_UNIT
    - SIZE_UNIT
  material:
    - MATERIAL
    - PIPE_MAT
    - PIPEMATERIAL
    - MAT
  install_year:
    - INSTALL_YEAR
    - YR_INSTALL
    - INSTALLYEAR
    - INSERVICEDATE
  install_date:
    - INSTALLDATE
    - INSTALL_DATE
    - DATE_INSTALLED
  status:
    - STATUS
    - LIFECYCLE
    - ACTIVE
    - PIPE_STATUS
  owner:
    - OWNER
    - OWNEDBY
    - OWNED_BY
    - OPERATOR
  capacity:
    - CAPACITY
    - FLOW_RATE
    - GPM
    - MGD
  pressure:
    - PRESSURE
    - PSI
    - PRESSURE_ZONE
  depth:
    - DEPTH
    - BURY_DEPTH
    - COVER
  geometry:
    - geometry
    - geom
    - SHAPE

# ============================================================================
# WETLANDS
# ============================================================================
wetlands:
  id:
    - OBJECTID
    - FID
  wetland_code:
    - ATTRIBUTE
    - WETLAND_TYPE
    - NWI_CODE
    - COWARDIN
  wetland_type:
    - WETLAND_TYPE
    - TYPE
    - CLASSIFICATION
  system:
    - SYSTEM
    - SYS
  subsystem:
    - SUBSYSTEM
    - SUBSYS
  class:
    - CLASS
    - CLS
  subclass:
    - SUBCLASS
    - SUBCLS
  water_regime:
    - WATER_REGIME
    - REGIME
    - HYDRO
  special_modifier:
    - SPECIAL_MOD
    - MODIFIER
  area_acres:
    - ACRES
    - AREA_ACRES
    - Shape_Area  # divide by 43560 if sqft
  geometry:
    - geometry
    - geom
    - SHAPE
```

### `_shared/config/field_aliases.yml`

Simplified alias lookup (subset of schema_map for quick resolution):

```yaml
# field_aliases.yml
# Quick lookup for most common field aliases

parcels:
  parcel_id: ["PARCEL_ID", "LOWPARCELID", "HCAD_NUM", "ACCT_NUM"]
  owner_name: ["OWNERNAME", "OWNER_NAME", "CurrOwner"]
  situs_address: ["SITUS", "SITUS_ADDR", "ADDRESS"]
  lot_size_sqft: ["LOT_SIZE", "AREA_SQFT", "LAND_SQFT"]
  zoning_code: ["ZONE", "ZONING", "ZONING_CODE"]

zoning:
  district_code: ["ZONE", "ZONINGCODE", "ZN_CODE", "DISTRICT"]
  height_limit: ["HEIGHT_LIM", "MAX_HEIGHT", "HEIGHT_FT"]
  far: ["FAR", "FLOOR_AREA_RATIO"]
  front_setback: ["SET_F", "FRONT", "FRONT_SETBACK"]
  side_setback: ["SET_S", "SIDE", "SIDE_SETBACK"]
  rear_setback: ["SET_R", "REAR", "REAR_SETBACK"]

flood:
  flood_zone: ["ZONE", "FLD_ZONE", "FLOOD_ZONE"]
  bfe: ["BFE", "BASE_FLOOD_ELEV", "STATIC_BFE"]
  floodway: ["FLOODWAY", "FW"]

utilities:
  diameter: ["DIAMETER", "PIPE_DIAM", "SIZE", "MAINSIZE"]
  material: ["MATERIAL", "PIPE_MAT", "MAT"]
  install_year: ["INSTALL_YEAR", "YR_INSTALL", "INSTALLYEAR"]
  status: ["STATUS", "LIFECYCLE", "ACTIVE"]
```

### `_shared/config/layer_definitions.yml`

Registry of all known layers by jurisdiction:

```yaml
# layer_definitions.yml
# Master registry of all data layers by jurisdiction

houston:
  parcels:
    source_url: "https://gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer"
    layer_id: 0
    source_crs: 2278
    refresh_frequency: weekly
    priority: 1
    
  water_mains:
    source_url: "https://geogimstest.houstontx.gov/arcgis/rest/services/Water/MapServer"
    layer_id: 5
    source_crs: 2278
    refresh_frequency: monthly
    priority: 2
    
  sewer_mains:
    source_url: "https://geogimstest.houstontx.gov/arcgis/rest/services/Wastewater/MapServer"
    layer_id: 1
    source_crs: 2278
    refresh_frequency: monthly
    priority: 2
    
  stormwater:
    source_url: "https://geogimstest.houstontx.gov/arcgis/rest/services/Stormwater/MapServer"
    layer_id: 0
    source_crs: 2278
    refresh_frequency: monthly
    priority: 3

austin:
  parcels:
    source_url: "https://services.arcgis.com/0L95CJ0VTaxqcmED/ArcGIS/rest/services"
    layer_id: 0
    source_crs: 2277
    refresh_frequency: weekly
    priority: 1
    
  zoning:
    source_url: "https://services.arcgis.com/0L95CJ0VTaxqcmED/ArcGIS/rest/services/Zoning"
    layer_id: 0
    source_crs: 2277
    refresh_frequency: monthly
    priority: 1

national:
  wetlands_nwi:
    source_url: "https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer"
    layer_id: 0
    source_crs: 3857
    refresh_frequency: quarterly
    priority: 2
    
  fema_nfhl:
    source_url: "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer"
    layer_id: 28  # S_FLD_HAZ_AR
    source_crs: 4326
    refresh_frequency: quarterly
    priority: 1
```

### `_shared/config/ingestion_rules.yml`

Behavioral rules for ETL processing:

```yaml
# ingestion_rules.yml
# Rules governing ETL behavior

global:
  # Geometry validation
  geometry:
    repair_invalid: true
    repair_method: "ST_MakeValid"
    skip_empty: true
    skip_null: true
    simplify_tolerance: 0.0001  # degrees, for overly complex geometries
    
  # Pagination
  pagination:
    max_record_count: 2000
    retry_on_failure: 3
    retry_delay_seconds: 5
    
  # Deduplication
  deduplication:
    default_strategy: "keep_latest"
    timestamp_field: "last_modified"
    
  # Staging cleanup
  staging:
    cleanup_after_success: true
    retain_days_on_failure: 7

# Dataset-specific rules
parcels:
  required_fields:
    - parcel_id
    - geometry
  geometry_type: "MultiPolygon"
  min_area_sqft: 100
  max_area_acres: 10000
  
zoning:
  required_fields:
    - district_code
    - geometry
  geometry_type: "MultiPolygon"
  
flood:
  required_fields:
    - flood_zone
    - geometry
  geometry_type: "MultiPolygon"
  valid_zones:
    - "A"
    - "AE"
    - "AH"
    - "AO"
    - "A99"
    - "V"
    - "VE"
    - "X"
    - "D"
    
utilities:
  required_fields:
    - geometry
  geometry_type: "MultiLineString"
  min_length_meters: 1
  max_length_meters: 50000
  valid_statuses:
    - "ACTIVE"
    - "IN_SERVICE"
    - "UNKNOWN"
    
wetlands:
  required_fields:
    - wetland_code
    - geometry
  geometry_type: "MultiPolygon"
```

### `_shared/config/crs_definitions.yml`

Coordinate Reference System definitions:

```yaml
# crs_definitions.yml
# Common CRS definitions and transformations

# EPSG codes by name
codes:
  wgs84: 4326
  web_mercator: 3857
  texas_state_plane_south_central: 2278
  texas_state_plane_central: 2277
  texas_state_plane_north_central: 2276
  nad83: 4269
  
# Jurisdiction default CRS
jurisdictions:
  houston:
    native_crs: 2278
    crs_name: "NAD83 / Texas South Central (ftUS)"
    
  austin:
    native_crs: 2277
    crs_name: "NAD83 / Texas Central (ftUS)"
    
  dallas:
    native_crs: 2276
    crs_name: "NAD83 / Texas North Central (ftUS)"
    
  san_antonio:
    native_crs: 2278
    crs_name: "NAD83 / Texas South Central (ftUS)"
    
  fort_worth:
    native_crs: 2276
    crs_name: "NAD83 / Texas North Central (ftUS)"

# Target CRS for all canonical tables
target:
  canonical: 4326
  tiles: 3857
```

---

## Shared Utilities

### `_shared/utils/fetch_arcgis.py`

```python
"""
ArcGIS REST API Fetcher

Fetches GeoJSON from ArcGIS REST MapServer/FeatureServer endpoints
with automatic pagination, retry logic, and ETag caching.
"""

import os
import time
import json
import hashlib
import requests
from typing import Dict, Optional, List
from utils.logger import get_logger

logger = get_logger(__name__)

# Cache directory for ETags
CACHE_DIR = os.environ.get("ETL_CACHE_DIR", "/tmp/etl_cache")


def fetch_arcgis(
    base_url: str,
    layer_id: str,
    config: Optional[Dict] = None
) -> Dict:
    """
    Fetch all features from an ArcGIS REST layer.
    
    Args:
        base_url: Base MapServer/FeatureServer URL
        layer_id: Layer index (e.g., "0", "5")
        config: Optional configuration overrides
            - where: SQL where clause (default: "1=1")
            - out_fields: Fields to return (default: "*")
            - max_record_count: Records per page (default: 2000)
            - timeout: Request timeout seconds (default: 60)
            - retry_count: Number of retries (default: 3)
            
    Returns:
        GeoJSON FeatureCollection
    """
    config = config or {}
    
    # Configuration
    where = config.get("where", "1=1")
    out_fields = config.get("out_fields", "*")
    max_records = config.get("max_record_count", 2000)
    timeout = config.get("timeout", 60)
    retry_count = config.get("retry_count", 3)
    
    # Build query URL
    query_url = f"{base_url}/{layer_id}/query"
    
    # First, get total count
    count_params = {
        "where": where,
        "returnCountOnly": "true",
        "f": "json"
    }
    
    total_count = _fetch_with_retry(query_url, count_params, timeout, retry_count)
    total_count = total_count.get("count", 0)
    logger.info(f"Total features to fetch: {total_count}")
    
    if total_count == 0:
        return {"type": "FeatureCollection", "features": []}
    
    # Fetch in pages
    all_features = []
    offset = 0
    
    while offset < total_count:
        query_params = {
            "where": where,
            "outFields": out_fields,
            "resultOffset": offset,
            "resultRecordCount": max_records,
            "f": "geojson"
        }
        
        logger.info(f"Fetching records {offset} to {offset + max_records}")
        
        response = _fetch_with_retry(query_url, query_params, timeout, retry_count)
        features = response.get("features", [])
        
        if not features:
            break
            
        all_features.extend(features)
        offset += len(features)
        
        # Respect rate limits
        time.sleep(0.5)
    
    logger.info(f"Fetched {len(all_features)} total features")
    
    return {
        "type": "FeatureCollection",
        "features": all_features
    }


def _fetch_with_retry(
    url: str,
    params: Dict,
    timeout: int,
    retry_count: int
) -> Dict:
    """Fetch with exponential backoff retry."""
    last_error = None
    
    for attempt in range(retry_count):
        try:
            response = requests.get(url, params=params, timeout=timeout)
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            last_error = e
            wait_time = 2 ** attempt  # Exponential backoff
            logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {wait_time}s...")
            time.sleep(wait_time)
    
    raise Exception(f"Failed after {retry_count} attempts: {last_error}")


def get_layer_metadata(base_url: str, layer_id: str) -> Dict:
    """
    Fetch layer metadata (fields, geometry type, etc.).
    
    Args:
        base_url: Base MapServer/FeatureServer URL
        layer_id: Layer index
        
    Returns:
        Layer metadata dictionary
    """
    url = f"{base_url}/{layer_id}"
    params = {"f": "json"}
    
    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()
    
    return response.json()
```

### `_shared/utils/normalize_fields.py`

```python
"""
Field Normalizer

Resolves source field names to canonical field names using alias mappings.
"""

import os
import yaml
from typing import Dict, List, Optional
from utils.logger import get_logger

logger = get_logger(__name__)

# Load field aliases
ALIASES_PATH = os.path.join(os.path.dirname(__file__), "../config/field_aliases.yml")

with open(ALIASES_PATH, "r") as f:
    ALIASES = yaml.safe_load(f)


def normalize_fields(geojson: Dict, dataset_type: str) -> Dict:
    """
    Normalize field names from source aliases to canonical names.
    
    Args:
        geojson: GeoJSON FeatureCollection
        dataset_type: Type of dataset (parcels, zoning, flood, utilities, wetlands)
        
    Returns:
        GeoJSON with normalized field names
    """
    mapping = ALIASES.get(dataset_type, {})
    
    if not mapping:
        logger.warning(f"No field aliases defined for dataset type: {dataset_type}")
        return geojson
    
    # Build reverse lookup: source_field -> canonical_field
    reverse_map = {}
    for canonical, aliases in mapping.items():
        for alias in aliases:
            reverse_map[alias.upper()] = canonical
            reverse_map[alias.lower()] = canonical
            reverse_map[alias] = canonical
    
    # Normalize each feature's properties
    normalized_features = []
    
    for feature in geojson.get("features", []):
        props = feature.get("properties", {})
        normalized_props = {}
        
        for source_field, value in props.items():
            # Check if this field has a canonical mapping
            canonical_field = reverse_map.get(source_field)
            
            if canonical_field:
                normalized_props[canonical_field] = value
            else:
                # Keep original field name (lowercase for consistency)
                normalized_props[source_field.lower()] = value
        
        normalized_features.append({
            "type": "Feature",
            "geometry": feature.get("geometry"),
            "properties": normalized_props
        })
    
    logger.info(f"Normalized {len(normalized_features)} features for {dataset_type}")
    
    return {
        "type": "FeatureCollection",
        "features": normalized_features
    }


def get_canonical_fields(dataset_type: str) -> List[str]:
    """Get list of canonical field names for a dataset type."""
    return list(ALIASES.get(dataset_type, {}).keys())


def find_source_field(
    properties: Dict,
    canonical_field: str,
    dataset_type: str
) -> Optional[str]:
    """
    Find which source field maps to a canonical field.
    
    Args:
        properties: Feature properties dictionary
        canonical_field: Target canonical field name
        dataset_type: Dataset type
        
    Returns:
        Value of the matching source field, or None
    """
    aliases = ALIASES.get(dataset_type, {}).get(canonical_field, [])
    
    for alias in aliases:
        # Try exact match
        if alias in properties:
            return properties[alias]
        # Try case-insensitive
        for key in properties:
            if key.upper() == alias.upper():
                return properties[key]
    
    return None
```

### `_shared/utils/reprojection.py`

```python
"""
Coordinate Reprojection Utility

Transforms geometries between coordinate reference systems using pyproj.
"""

import json
from typing import Dict, List, Tuple, Union
from functools import lru_cache

try:
    from pyproj import Transformer, CRS
    HAS_PYPROJ = True
except ImportError:
    HAS_PYPROJ = False
    
from utils.logger import get_logger

logger = get_logger(__name__)


@lru_cache(maxsize=32)
def get_transformer(source_crs: int, target_crs: int) -> "Transformer":
    """
    Get cached transformer for CRS conversion.
    
    Args:
        source_crs: Source EPSG code
        target_crs: Target EPSG code
        
    Returns:
        pyproj Transformer
    """
    if not HAS_PYPROJ:
        raise ImportError("pyproj is required for reprojection. Install with: pip install pyproj")
    
    return Transformer.from_crs(
        CRS.from_epsg(source_crs),
        CRS.from_epsg(target_crs),
        always_xy=True
    )


def reproject_to_4326(geojson: Dict, source_crs: int) -> Dict:
    """
    Reproject all geometries to WGS84 (EPSG:4326).
    
    Args:
        geojson: GeoJSON FeatureCollection
        source_crs: Source EPSG code
        
    Returns:
        GeoJSON with reprojected geometries
    """
    if source_crs == 4326:
        logger.info("Source already in EPSG:4326, skipping reprojection")
        return geojson
    
    transformer = get_transformer(source_crs, 4326)
    
    reprojected_features = []
    
    for feature in geojson.get("features", []):
        geometry = feature.get("geometry")
        
        if geometry is None:
            continue
            
        reprojected_geom = reproject_geometry(geometry, transformer)
        
        reprojected_features.append({
            "type": "Feature",
            "geometry": reprojected_geom,
            "properties": feature.get("properties", {})
        })
    
    logger.info(f"Reprojected {len(reprojected_features)} features from EPSG:{source_crs} to EPSG:4326")
    
    return {
        "type": "FeatureCollection",
        "features": reprojected_features
    }


def reproject_geometry(geometry: Dict, transformer: "Transformer") -> Dict:
    """
    Reproject a single geometry.
    
    Args:
        geometry: GeoJSON geometry object
        transformer: pyproj Transformer
        
    Returns:
        Reprojected geometry
    """
    geom_type = geometry.get("type")
    coords = geometry.get("coordinates")
    
    if geom_type == "Point":
        new_coords = transform_point(coords, transformer)
    elif geom_type == "MultiPoint":
        new_coords = [transform_point(p, transformer) for p in coords]
    elif geom_type == "LineString":
        new_coords = [transform_point(p, transformer) for p in coords]
    elif geom_type == "MultiLineString":
        new_coords = [[transform_point(p, transformer) for p in line] for line in coords]
    elif geom_type == "Polygon":
        new_coords = [[transform_point(p, transformer) for p in ring] for ring in coords]
    elif geom_type == "MultiPolygon":
        new_coords = [
            [[transform_point(p, transformer) for p in ring] for ring in polygon]
            for polygon in coords
        ]
    else:
        logger.warning(f"Unknown geometry type: {geom_type}")
        return geometry
    
    return {
        "type": geom_type,
        "coordinates": new_coords
    }


def transform_point(
    coords: Union[List, Tuple],
    transformer: "Transformer"
) -> List[float]:
    """
    Transform a single point coordinate.
    
    Args:
        coords: [x, y] or [x, y, z] coordinate
        transformer: pyproj Transformer
        
    Returns:
        Transformed coordinate
    """
    x, y = coords[0], coords[1]
    new_x, new_y = transformer.transform(x, y)
    
    if len(coords) > 2:
        return [new_x, new_y, coords[2]]
    return [new_x, new_y]
```

### `_shared/utils/validator.py`

```python
"""
Geometry and Attribute Validator

Validates GeoJSON features for geometry validity and required attributes.
"""

import os
import yaml
from typing import Dict, List, Tuple, Optional
from utils.logger import get_logger

logger = get_logger(__name__)

# Load validation rules
RULES_PATH = os.path.join(os.path.dirname(__file__), "../config/ingestion_rules.yml")

with open(RULES_PATH, "r") as f:
    RULES = yaml.safe_load(f)


def validate_features(
    geojson: Dict,
    dataset_type: str
) -> Tuple[Dict, List[Dict]]:
    """
    Validate all features in a GeoJSON FeatureCollection.
    
    Args:
        geojson: GeoJSON FeatureCollection
        dataset_type: Type of dataset for rule lookup
        
    Returns:
        Tuple of (valid_geojson, list_of_invalid_features)
    """
    rules = RULES.get(dataset_type, {})
    global_rules = RULES.get("global", {})
    
    required_fields = rules.get("required_fields", [])
    expected_geom_type = rules.get("geometry_type")
    
    valid_features = []
    invalid_features = []
    
    for i, feature in enumerate(geojson.get("features", [])):
        errors = validate_feature(feature, required_fields, expected_geom_type, rules)
        
        if errors:
            invalid_features.append({
                "index": i,
                "feature_id": feature.get("properties", {}).get("id"),
                "errors": errors
            })
        else:
            valid_features.append(feature)
    
    logger.info(f"Validation complete: {len(valid_features)} valid, {len(invalid_features)} invalid")
    
    return (
        {"type": "FeatureCollection", "features": valid_features},
        invalid_features
    )


def validate_feature(
    feature: Dict,
    required_fields: List[str],
    expected_geom_type: Optional[str],
    rules: Dict
) -> List[str]:
    """
    Validate a single feature.
    
    Args:
        feature: GeoJSON Feature
        required_fields: List of required property fields
        expected_geom_type: Expected geometry type
        rules: Dataset-specific validation rules
        
    Returns:
        List of error messages (empty if valid)
    """
    errors = []
    
    # Check geometry exists
    geometry = feature.get("geometry")
    if geometry is None:
        errors.append("Missing geometry")
        return errors
    
    # Check geometry type
    geom_type = geometry.get("type")
    if expected_geom_type and geom_type not in [expected_geom_type, f"Multi{expected_geom_type}"]:
        errors.append(f"Expected {expected_geom_type}, got {geom_type}")
    
    # Check geometry coordinates exist
    coords = geometry.get("coordinates")
    if coords is None or (isinstance(coords, list) and len(coords) == 0):
        errors.append("Empty geometry coordinates")
    
    # Check required fields
    props = feature.get("properties", {})
    for field in required_fields:
        if field not in props or props[field] is None:
            errors.append(f"Missing required field: {field}")
    
    # Check value ranges
    value_ranges = rules.get("value_ranges", {})
    for field, range_def in value_ranges.items():
        if field in props and props[field] is not None:
            value = props[field]
            if "min" in range_def and value < range_def["min"]:
                errors.append(f"{field} below minimum: {value} < {range_def['min']}")
            if "max" in range_def and value > range_def["max"]:
                errors.append(f"{field} above maximum: {value} > {range_def['max']}")
    
    # Check valid values
    valid_values = rules.get("valid_values", {})
    for field, allowed in valid_values.items():
        if field in props and props[field] is not None:
            if props[field] not in allowed:
                errors.append(f"Invalid {field} value: {props[field]}")
    
    return errors


def check_geometry_validity(geometry: Dict) -> Tuple[bool, Optional[str]]:
    """
    Check if a geometry is valid (basic check without PostGIS).
    
    Args:
        geometry: GeoJSON geometry object
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if geometry is None:
        return False, "Geometry is null"
    
    geom_type = geometry.get("type")
    coords = geometry.get("coordinates")
    
    if not geom_type:
        return False, "Missing geometry type"
    
    if coords is None:
        return False, "Missing coordinates"
    
    # Type-specific validation
    if geom_type == "Point":
        if not isinstance(coords, list) or len(coords) < 2:
            return False, "Point must have at least 2 coordinates"
            
    elif geom_type == "LineString":
        if not isinstance(coords, list) or len(coords) < 2:
            return False, "LineString must have at least 2 points"
            
    elif geom_type == "Polygon":
        if not isinstance(coords, list) or len(coords) < 1:
            return False, "Polygon must have at least 1 ring"
        for ring in coords:
            if len(ring) < 4:
                return False, "Polygon ring must have at least 4 points"
            if ring[0] != ring[-1]:
                return False, "Polygon ring must be closed"
    
    return True, None
```

### `_shared/utils/pg_uploader.py`

```python
"""
PostGIS Uploader

Uploads GeoJSON to PostGIS staging tables and executes SQL transforms.
"""

import os
import json
from typing import Dict, List, Optional, Any

try:
    import geopandas as gpd
    from sqlalchemy import create_engine, text
    HAS_GEOPANDAS = True
except ImportError:
    HAS_GEOPANDAS = False

from utils.logger import get_logger

logger = get_logger(__name__)

# Database connection
DATABASE_URL = os.environ.get("DATABASE_URL")


def get_engine():
    """Get SQLAlchemy engine."""
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable not set")
    return create_engine(DATABASE_URL)


def upload_to_staging(
    geojson: Dict,
    jurisdiction: str,
    dataset_type: str,
    version: str,
    if_exists: str = "replace"
) -> int:
    """
    Upload GeoJSON to PostGIS staging table.
    
    Args:
        geojson: GeoJSON FeatureCollection
        jurisdiction: City/county name
        dataset_type: Dataset type (parcels, zoning, etc.)
        version: Version string (v2025_03)
        if_exists: Behavior if table exists ("replace", "append", "fail")
        
    Returns:
        Number of features uploaded
    """
    if not HAS_GEOPANDAS:
        raise ImportError("geopandas is required. Install with: pip install geopandas")
    
    # Convert to GeoDataFrame
    features = geojson.get("features", [])
    
    if not features:
        logger.warning("No features to upload")
        return 0
    
    gdf = gpd.GeoDataFrame.from_features(features)
    gdf.set_crs(epsg=4326, inplace=True)
    
    # Generate table name
    table_name = f"staging_raw_{jurisdiction}_{dataset_type}_{version}"
    table_name = table_name.replace("-", "_").lower()
    
    # Upload to PostGIS
    engine = get_engine()
    
    gdf.to_postgis(
        table_name,
        engine,
        if_exists=if_exists,
        index=False,
        schema="public"
    )
    
    logger.info(f"Uploaded {len(gdf)} features to {table_name}")
    
    return len(gdf)


def run_sql(
    sql: str,
    fetch: bool = False,
    params: Optional[Dict] = None
) -> Optional[List]:
    """
    Execute SQL statement.
    
    Args:
        sql: SQL statement to execute
        fetch: Whether to fetch results
        params: Optional parameters for parameterized queries
        
    Returns:
        Query results if fetch=True, else None
    """
    engine = get_engine()
    
    with engine.begin() as conn:
        result = conn.execute(text(sql), params or {})
        
        if fetch:
            return result.fetchall()
    
    return None


def table_exists(table_name: str, schema: str = "public") -> bool:
    """Check if a table exists."""
    sql = f"""
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = '{schema}'
        AND table_name = '{table_name}'
    )
    """
    result = run_sql(sql, fetch=True)
    return result[0][0] if result else False


def drop_table(table_name: str, schema: str = "public") -> None:
    """Drop a table if it exists."""
    sql = f"DROP TABLE IF EXISTS {schema}.{table_name} CASCADE"
    run_sql(sql)
    logger.info(f"Dropped table: {schema}.{table_name}")


def create_spatial_index(
    table_name: str,
    geom_column: str = "geometry",
    schema: str = "public"
) -> None:
    """Create a GIST spatial index on geometry column."""
    index_name = f"idx_{table_name}_geom"
    sql = f"""
    CREATE INDEX IF NOT EXISTS {index_name}
    ON {schema}.{table_name}
    USING GIST ({geom_column})
    """
    run_sql(sql)
    logger.info(f"Created spatial index: {index_name}")
```

### `_shared/utils/tile_generator.py`

```python
"""
Vector Tile Generator

Generates vector tiles from PostGIS tables using Tippecanoe.
"""

import os
import subprocess
import tempfile
from typing import Dict, Optional, List
from utils.logger import get_logger

logger = get_logger(__name__)

# Tippecanoe defaults
DEFAULT_MIN_ZOOM = 8
DEFAULT_MAX_ZOOM = 16


def generate_tiles(
    table: str,
    layer_name: str,
    output_dir: str,
    where: Optional[str] = None,
    min_zoom: int = DEFAULT_MIN_ZOOM,
    max_zoom: int = DEFAULT_MAX_ZOOM,
    tippecanoe_options: Optional[List[str]] = None
) -> str:
    """
    Generate vector tiles from a PostGIS table.
    
    Args:
        table: Source PostGIS table name
        layer_name: Output layer name
        output_dir: Directory for output tiles
        where: Optional SQL WHERE clause
        min_zoom: Minimum zoom level
        max_zoom: Maximum zoom level
        tippecanoe_options: Additional Tippecanoe options
        
    Returns:
        Path to generated .mbtiles file
    """
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Export to GeoJSON
    geojson_path = os.path.join(tempfile.gettempdir(), f"{layer_name}.geojson")
    
    export_to_geojson(table, geojson_path, where)
    
    # Generate tiles with Tippecanoe
    mbtiles_path = os.path.join(output_dir, f"{layer_name}.mbtiles")
    
    cmd = [
        "tippecanoe",
        "-o", mbtiles_path,
        f"--layer={layer_name}",
        f"--minimum-zoom={min_zoom}",
        f"--maximum-zoom={max_zoom}",
        "--drop-densest-as-needed",
        "--force"
    ]
    
    # Add custom options
    if tippecanoe_options:
        cmd.extend(tippecanoe_options)
    
    cmd.append(geojson_path)
    
    logger.info(f"Running Tippecanoe: {' '.join(cmd)}")
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        logger.error(f"Tippecanoe failed: {result.stderr}")
        raise Exception(f"Tippecanoe failed: {result.stderr}")
    
    logger.info(f"Generated tiles: {mbtiles_path}")
    
    # Convert to directory structure for CDN
    tiles_dir = os.path.join(output_dir, "tiles")
    extract_tiles(mbtiles_path, tiles_dir)
    
    # Cleanup temp file
    os.remove(geojson_path)
    
    return mbtiles_path


def export_to_geojson(
    table: str,
    output_path: str,
    where: Optional[str] = None
) -> None:
    """
    Export PostGIS table to GeoJSON using ogr2ogr.
    
    Args:
        table: Source table name
        output_path: Output GeoJSON file path
        where: Optional WHERE clause
    """
    # Build SQL query
    sql = f"SELECT * FROM {table}"
    if where:
        sql += f" WHERE {where}"
    
    # Build ogr2ogr command
    pg_conn = os.environ.get("DATABASE_URL", "").replace("postgresql://", "PG:")
    
    cmd = [
        "ogr2ogr",
        "-f", "GeoJSON",
        output_path,
        pg_conn,
        "-sql", sql
    ]
    
    logger.info(f"Exporting to GeoJSON: {output_path}")
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        logger.error(f"ogr2ogr failed: {result.stderr}")
        raise Exception(f"ogr2ogr failed: {result.stderr}")


def extract_tiles(mbtiles_path: str, output_dir: str) -> None:
    """
    Extract .mbtiles to directory structure for CDN hosting.
    
    Args:
        mbtiles_path: Path to .mbtiles file
        output_dir: Output directory for tile structure
    """
    os.makedirs(output_dir, exist_ok=True)
    
    cmd = [
        "tile-join",
        "--force",
        f"--output-to-directory={output_dir}",
        mbtiles_path
    ]
    
    logger.info(f"Extracting tiles to: {output_dir}")
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        # tile-join might not be available, fall back to mb-util
        try:
            cmd = ["mb-util", mbtiles_path, output_dir, "--image_format=pbf"]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                logger.warning(f"Tile extraction failed: {result.stderr}")
        except FileNotFoundError:
            logger.warning("Neither tile-join nor mb-util available for tile extraction")
```

### `_shared/utils/logger.py`

```python
"""
Structured Logger

Provides consistent logging across all ETL components.
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import Optional


class StructuredFormatter(logging.Formatter):
    """JSON-structured log formatter."""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, "extra"):
            log_data.update(record.extra)
        
        return json.dumps(log_data)


class ConsoleFormatter(logging.Formatter):
    """Human-readable console formatter with colors."""
    
    COLORS = {
        "DEBUG": "\033[36m",    # Cyan
        "INFO": "\033[32m",     # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",    # Red
        "CRITICAL": "\033[35m", # Magenta
    }
    RESET = "\033[0m"
    
    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, "")
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        
        return f"{color}{timestamp} [{record.levelname:8}]{self.RESET} {record.name}: {record.getMessage()}"


def get_logger(
    name: str,
    level: Optional[str] = None,
    structured: bool = False
) -> logging.Logger:
    """
    Get a configured logger.
    
    Args:
        name: Logger name (typically __name__)
        level: Log level (DEBUG, INFO, WARNING, ERROR)
        structured: Use JSON structured logging
        
    Returns:
        Configured logger
    """
    logger = logging.getLogger(name)
    
    # Don't add handlers if already configured
    if logger.handlers:
        return logger
    
    # Determine log level
    level = level or os.environ.get("LOG_LEVEL", "INFO")
    logger.setLevel(getattr(logging, level.upper()))
    
    # Create handler
    handler = logging.StreamHandler(sys.stdout)
    
    # Choose formatter
    if structured or os.environ.get("LOG_FORMAT") == "json":
        handler.setFormatter(StructuredFormatter())
    else:
        handler.setFormatter(ConsoleFormatter())
    
    logger.addHandler(handler)
    
    return logger
```

---

## City-Specific ETL Examples

### `houston/zoning_houston.py`

```python
"""
Houston Zoning ETL

Note: Houston does not have traditional zoning. This ingests deed restrictions,
special districts, and overlay information where available.
"""

from _shared.base_etl import BaseETL
from utils.pg_uploader import run_sql


class HoustonZoningETL(BaseETL):
    """
    Houston "zoning" ETL.
    
    Houston is unique in that it has no traditional zoning ordinance.
    Instead, land use is governed by:
    - Deed restrictions
    - Municipal management districts
    - Tax increment reinvestment zones
    - Historic districts
    
    This ETL ingests overlay districts where available.
    """
    
    SOURCE_TYPE = "arcgis"
    
    def __init__(self, version: str = None):
        from datetime import datetime
        version = version or f"v{datetime.now().strftime('%Y_%m')}"
        
        super().__init__(
            source_url="https://gis.houstontx.gov/arcgis/rest/services/Boundaries/MapServer",
            layer_name="0",  # Adjust to actual layer
            dataset_type="zoning",
            jurisdiction="houston",
            version=version,
            source_crs=2278,  # Texas State Plane South Central
        )
    
    def to_canonical(self):
        """
        Transform Houston overlay districts to canonical zoning schema.
        
        Since Houston has no zoning, we populate with overlay information
        and set district_code to indicate the special treatment.
        """
        sql = f"""
        INSERT INTO zoning_canonical (
            jurisdiction,
            district_code,
            district_name,
            permitted_uses,
            height_limit,
            far,
            lot_coverage,
            front_setback,
            side_setback,
            rear_setback,
            overlay_flags,
            geom,
            dataset_version
        )
        SELECT
            'houston' AS jurisdiction,
            COALESCE(district_code, 'NO_ZONING') AS district_code,
            COALESCE(district_name, 'No Traditional Zoning') AS district_name,
            NULL AS permitted_uses,
            NULL AS height_limit,
            NULL AS far,
            NULL AS lot_coverage,
            NULL AS front_setback,
            NULL AS side_setback,
            NULL AS rear_setback,
            CASE 
                WHEN overlay_flags IS NOT NULL THEN ARRAY[overlay_flags]
                ELSE ARRAY['deed_restricted']::text[]
            END AS overlay_flags,
            ST_MakeValid(ST_Multi(geometry)) AS geom,
            '{self.version}' AS dataset_version
        FROM {self.staging_table}
        WHERE geometry IS NOT NULL
        ON CONFLICT (jurisdiction, district_code, geom)
        DO UPDATE SET
            district_name = EXCLUDED.district_name,
            overlay_flags = EXCLUDED.overlay_flags,
            dataset_version = EXCLUDED.dataset_version
        """
        run_sql(sql)


if __name__ == "__main__":
    etl = HoustonZoningETL()
    metrics = etl.run()
    print(f"Completed: {metrics}")
```

### `houston/utilities_houston.py`

```python
"""
Houston Utilities ETL

Ingests water, sewer, and stormwater lines from Houston Water GIS.
"""

from _shared.base_etl import BaseETL
from utils.pg_uploader import run_sql


class HoustonWaterMainsETL(BaseETL):
    """Houston water mains ETL."""
    
    SOURCE_TYPE = "arcgis"
    
    def __init__(self, version: str = None):
        from datetime import datetime
        version = version or f"v{datetime.now().strftime('%Y_%m')}"
        
        super().__init__(
            source_url="https://geogimstest.houstontx.gov/arcgis/rest/services/Water/MapServer",
            layer_name="5",  # Active Water Mains
            dataset_type="utilities",
            jurisdiction="houston",
            version=version,
            source_crs=2278,
        )
    
    def to_canonical(self):
        sql = f"""
        INSERT INTO utilities_canonical (
            jurisdiction,
            utility_type,
            line_id,
            diameter,
            material,
            install_year,
            owner,
            status,
            geom,
            dataset_version
        )
        SELECT
            'houston' AS jurisdiction,
            'water' AS utility_type,
            COALESCE(line_id, 'WTR_' || id::text) AS line_id,
            diameter,
            material,
            install_year,
            COALESCE(owner, 'City of Houston') AS owner,
            COALESCE(status, 'ACTIVE') AS status,
            ST_MakeValid(ST_Multi(geometry)) AS geom,
            '{self.version}' AS dataset_version
        FROM {self.staging_table}
        WHERE geometry IS NOT NULL
        ON CONFLICT (jurisdiction, utility_type, line_id)
        DO UPDATE SET
            diameter = EXCLUDED.diameter,
            material = EXCLUDED.material,
            install_year = EXCLUDED.install_year,
            status = EXCLUDED.status,
            geom = EXCLUDED.geom,
            dataset_version = EXCLUDED.dataset_version
        """
        run_sql(sql)


class HoustonSewerMainsETL(BaseETL):
    """Houston sewer mains ETL."""
    
    SOURCE_TYPE = "arcgis"
    
    def __init__(self, version: str = None):
        from datetime import datetime
        version = version or f"v{datetime.now().strftime('%Y_%m')}"
        
        super().__init__(
            source_url="https://geogimstest.houstontx.gov/arcgis/rest/services/Wastewater/MapServer",
            layer_name="1",  # Active Gravity Mains
            dataset_type="utilities",
            jurisdiction="houston",
            version=version,
            source_crs=2278,
        )
    
    def to_canonical(self):
        sql = f"""
        INSERT INTO utilities_canonical (
            jurisdiction,
            utility_type,
            line_id,
            diameter,
            material,
            install_year,
            owner,
            status,
            geom,
            dataset_version
        )
        SELECT
            'houston' AS jurisdiction,
            'sewer' AS utility_type,
            COALESCE(line_id, 'SWR_' || id::text) AS line_id,
            diameter,
            material,
            install_year,
            COALESCE(owner, 'City of Houston') AS owner,
            COALESCE(status, 'ACTIVE') AS status,
            ST_MakeValid(ST_Multi(geometry)) AS geom,
            '{self.version}' AS dataset_version
        FROM {self.staging_table}
        WHERE geometry IS NOT NULL
        ON CONFLICT (jurisdiction, utility_type, line_id)
        DO UPDATE SET
            diameter = EXCLUDED.diameter,
            material = EXCLUDED.material,
            install_year = EXCLUDED.install_year,
            status = EXCLUDED.status,
            geom = EXCLUDED.geom,
            dataset_version = EXCLUDED.dataset_version
        """
        run_sql(sql)


if __name__ == "__main__":
    HoustonWaterMainsETL().run()
    HoustonSewerMainsETL().run()
```

### `national/wetlands_usfws.py`

```python
"""
USFWS National Wetlands Inventory ETL

Ingests wetlands data from the U.S. Fish & Wildlife Service NWI.
"""

from _shared.base_etl import BaseETL
from utils.pg_uploader import run_sql


class USFWSWetlandsETL(BaseETL):
    """National Wetlands Inventory ETL."""
    
    SOURCE_TYPE = "arcgis"
    
    def __init__(self, version: str = None, bbox: tuple = None):
        """
        Initialize NWI ETL.
        
        Args:
            version: Version string
            bbox: Bounding box to limit query (minx, miny, maxx, maxy)
        """
        from datetime import datetime
        version = version or f"v{datetime.now().strftime('%Y_%m')}"
        
        super().__init__(
            source_url="https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer",
            layer_name="0",
            dataset_type="wetlands",
            jurisdiction="national",
            version=version,
            source_crs=3857,  # Web Mercator
        )
        
        self.bbox = bbox
    
    def fetch(self):
        """Override fetch to apply bounding box filter."""
        config = {}
        
        if self.bbox:
            minx, miny, maxx, maxy = self.bbox
            config["geometry"] = f"{minx},{miny},{maxx},{maxy}"
            config["geometryType"] = "esriGeometryEnvelope"
            config["spatialRel"] = "esriSpatialRelIntersects"
        
        from utils.fetch_arcgis import fetch_arcgis
        return fetch_arcgis(self.source_url, self.layer_name, config)
    
    def to_canonical(self):
        sql = f"""
        INSERT INTO wetlands_canonical (
            wetland_code,
            wetland_type,
            area_acres,
            geom,
            dataset_version
        )
        SELECT
            wetland_code,
            CASE 
                WHEN wetland_code LIKE 'PEM%' THEN 'Freshwater Emergent Wetland'
                WHEN wetland_code LIKE 'PFO%' THEN 'Freshwater Forested Wetland'
                WHEN wetland_code LIKE 'PSS%' THEN 'Freshwater Shrub Wetland'
                WHEN wetland_code LIKE 'PUB%' THEN 'Freshwater Pond'
                WHEN wetland_code LIKE 'PAB%' THEN 'Freshwater Aquatic Bed'
                WHEN wetland_code LIKE 'L%' THEN 'Lacustrine'
                WHEN wetland_code LIKE 'R%' THEN 'Riverine'
                WHEN wetland_code LIKE 'E%' THEN 'Estuarine'
                WHEN wetland_code LIKE 'M%' THEN 'Marine'
                ELSE 'Other Wetland'
            END AS wetland_type,
            ST_Area(ST_Transform(geometry, 2278)) / 43560.0 AS area_acres,
            ST_MakeValid(ST_Multi(geometry)) AS geom,
            '{self.version}' AS dataset_version
        FROM {self.staging_table}
        WHERE geometry IS NOT NULL
        ON CONFLICT DO NOTHING
        """
        run_sql(sql)


if __name__ == "__main__":
    # Example: Ingest wetlands for Texas bounding box
    texas_bbox = (-106.65, 25.84, -93.51, 36.50)
    etl = USFWSWetlandsETL(bbox=texas_bbox)
    etl.run()
```

---

## Canonical Table Design

### `_shared/canonical_schema.sql`

```sql
-- ============================================================================
-- SiteIntel Canonical Schema DDL
-- ============================================================================
-- These tables store normalized, validated data from all upstream sources.
-- All geometries are in EPSG:4326 (WGS84).
-- All tables include jurisdiction and dataset_version for provenance.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PARCELS CANONICAL
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parcels_canonical (
    id BIGSERIAL PRIMARY KEY,
    
    -- Identifiers
    jurisdiction TEXT NOT NULL,
    parcel_id TEXT NOT NULL,
    apn TEXT,
    
    -- Owner
    owner_name TEXT,
    owner_address TEXT,
    
    -- Location
    situs_address TEXT,
    city TEXT,
    county TEXT,
    state TEXT DEFAULT 'TX',
    zip TEXT,
    
    -- Size
    lot_size_sqft NUMERIC,
    lot_size_acres NUMERIC GENERATED ALWAYS AS (lot_size_sqft / 43560.0) STORED,
    
    -- Zoning
    zoning_code TEXT,
    land_use_code TEXT,
    
    -- Values
    total_value NUMERIC,
    land_value NUMERIC,
    improvement_value NUMERIC,
    
    -- Geometry
    geom GEOMETRY(MultiPolygon, 4326),
    centroid GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_Centroid(geom)) STORED,
    
    -- Provenance
    dataset_version TEXT NOT NULL,
    source_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(jurisdiction, parcel_id, dataset_version)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_parcels_canonical_geom ON parcels_canonical USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_parcels_canonical_centroid ON parcels_canonical USING GIST(centroid);
CREATE INDEX IF NOT EXISTS idx_parcels_canonical_jurisdiction ON parcels_canonical(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_parcels_canonical_parcel_id ON parcels_canonical(parcel_id);
CREATE INDEX IF NOT EXISTS idx_parcels_canonical_version ON parcels_canonical(dataset_version);

-- ----------------------------------------------------------------------------
-- ZONING CANONICAL
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.zoning_canonical (
    id BIGSERIAL PRIMARY KEY,
    
    -- Identifiers
    jurisdiction TEXT NOT NULL,
    district_code TEXT NOT NULL,
    district_name TEXT,
    
    -- Regulations
    permitted_uses TEXT,
    conditional_uses TEXT,
    prohibited_uses TEXT,
    
    -- Dimensional Standards
    height_limit NUMERIC,           -- feet
    height_limit_stories INTEGER,
    far NUMERIC,                    -- Floor Area Ratio
    lot_coverage NUMERIC,           -- percentage
    
    -- Setbacks (feet)
    front_setback NUMERIC,
    side_setback NUMERIC,
    rear_setback NUMERIC,
    corner_setback NUMERIC,
    
    -- Lot Requirements
    min_lot_size NUMERIC,           -- square feet
    min_lot_width NUMERIC,          -- feet
    min_lot_depth NUMERIC,          -- feet
    
    -- Overlays
    overlay_flags TEXT[],
    
    -- Geometry
    geom GEOMETRY(MultiPolygon, 4326),
    
    -- Provenance
    dataset_version TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(jurisdiction, district_code, geom)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_zoning_canonical_geom ON zoning_canonical USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_zoning_canonical_jurisdiction ON zoning_canonical(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_zoning_canonical_code ON zoning_canonical(district_code);

-- ----------------------------------------------------------------------------
-- FEMA FLOOD CANONICAL
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fema_flood_canonical (
    id BIGSERIAL PRIMARY KEY,
    
    -- Location
    jurisdiction TEXT,
    county TEXT,
    state TEXT DEFAULT 'TX',
    
    -- Flood Zone
    flood_zone TEXT NOT NULL,       -- A, AE, AH, AO, V, VE, X, D
    flood_zone_subtype TEXT,
    
    -- Elevations
    bfe NUMERIC,                    -- Base Flood Elevation (feet NAVD88)
    bfe_unit TEXT DEFAULT 'NAVD88',
    static_bfe NUMERIC,
    
    -- Flags
    floodway_flag BOOLEAN DEFAULT FALSE,
    coastal_flag BOOLEAN DEFAULT FALSE,
    
    -- FIRM Panel
    panel_id TEXT,
    effective_date DATE,
    
    -- Geometry
    geom GEOMETRY(MultiPolygon, 4326),
    
    -- Provenance
    dataset_version TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_flood_canonical_geom ON fema_flood_canonical USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_flood_canonical_zone ON fema_flood_canonical(flood_zone);
CREATE INDEX IF NOT EXISTS idx_flood_canonical_jurisdiction ON fema_flood_canonical(jurisdiction);

-- ----------------------------------------------------------------------------
-- UTILITIES CANONICAL
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.utilities_canonical (
    id BIGSERIAL PRIMARY KEY,
    
    -- Location
    jurisdiction TEXT NOT NULL,
    
    -- Type
    utility_type TEXT NOT NULL,     -- water, sewer, storm, gas, electric
    
    -- Identifiers
    line_id TEXT,
    facility_id TEXT,
    
    -- Physical Attributes
    diameter NUMERIC,               -- inches
    diameter_unit TEXT DEFAULT 'inches',
    material TEXT,
    length_ft NUMERIC,
    
    -- Dates
    install_year INTEGER,
    install_date DATE,
    
    -- Operations
    status TEXT DEFAULT 'ACTIVE',
    owner TEXT,
    operator TEXT,
    
    -- Capacity
    capacity NUMERIC,
    capacity_unit TEXT,
    pressure NUMERIC,
    pressure_unit TEXT,
    
    -- Depth
    depth NUMERIC,                  -- feet
    
    -- Geometry
    geom GEOMETRY(MultiLineString, 4326),
    
    -- Provenance
    dataset_version TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(jurisdiction, utility_type, line_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_utilities_canonical_geom ON utilities_canonical USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_utilities_canonical_type ON utilities_canonical(utility_type);
CREATE INDEX IF NOT EXISTS idx_utilities_canonical_jurisdiction ON utilities_canonical(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_utilities_canonical_status ON utilities_canonical(status);

-- ----------------------------------------------------------------------------
-- WETLANDS CANONICAL
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wetlands_canonical (
    id BIGSERIAL PRIMARY KEY,
    
    -- Classification
    wetland_code TEXT NOT NULL,     -- Cowardin code (e.g., PFO1A)
    wetland_type TEXT,              -- Human-readable type
    
    -- Cowardin Components
    system TEXT,                    -- P, L, R, E, M
    subsystem TEXT,
    class TEXT,
    subclass TEXT,
    water_regime TEXT,
    special_modifier TEXT,
    
    -- Size
    area_acres NUMERIC,
    
    -- Geometry
    geom GEOMETRY(MultiPolygon, 4326),
    
    -- Provenance
    dataset_version TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wetlands_canonical_geom ON wetlands_canonical USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_wetlands_canonical_code ON wetlands_canonical(wetland_code);
CREATE INDEX IF NOT EXISTS idx_wetlands_canonical_type ON wetlands_canonical(wetland_type);

-- ----------------------------------------------------------------------------
-- TRANSPORTATION CANONICAL
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transportation_canonical (
    id BIGSERIAL PRIMARY KEY,
    
    -- Location
    jurisdiction TEXT,
    county TEXT,
    
    -- Road Identification
    road_name TEXT,
    road_class TEXT,                -- interstate, highway, arterial, collector, local
    route_number TEXT,
    
    -- Traffic
    aadt NUMERIC,                   -- Annual Average Daily Traffic
    aadt_year INTEGER,
    truck_percent NUMERIC,
    
    -- Physical
    lanes INTEGER,
    surface_type TEXT,
    speed_limit INTEGER,
    
    -- Geometry
    geom GEOMETRY(MultiLineString, 4326),
    
    -- Provenance
    dataset_version TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transportation_canonical_geom ON transportation_canonical USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_transportation_canonical_class ON transportation_canonical(road_class);

-- ----------------------------------------------------------------------------
-- UPDATE TRIGGER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to parcels_canonical
DROP TRIGGER IF EXISTS update_parcels_canonical_updated_at ON parcels_canonical;
CREATE TRIGGER update_parcels_canonical_updated_at
    BEFORE UPDATE ON parcels_canonical
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## Job Runners & Orchestration

### `jobs/run_all.py`

```python
"""
Full ETL Runner

Orchestrates all ETL jobs for all jurisdictions.
"""

import sys
import logging
from datetime import datetime
from typing import List, Tuple

# Import all ETL classes
from houston.parcels_houston import HoustonParcelsETL
from houston.zoning_houston import HoustonZoningETL
from houston.utilities_houston import HoustonWaterMainsETL, HoustonSewerMainsETL
from national.wetlands_usfws import USFWSWetlandsETL
from national.fema_nfhl import FEMAFloodETL

from _shared.utils.logger import get_logger

logger = get_logger("run_all")

# Define ETL job registry
ETL_JOBS: List[Tuple[str, type]] = [
    # Houston
    ("Houston Parcels", HoustonParcelsETL),
    ("Houston Zoning", HoustonZoningETL),
    ("Houston Water Mains", HoustonWaterMainsETL),
    ("Houston Sewer Mains", HoustonSewerMainsETL),
    
    # National
    ("USFWS Wetlands", USFWSWetlandsETL),
    ("FEMA NFHL", FEMAFloodETL),
]


def run_all(jobs: List[Tuple[str, type]] = None) -> List[dict]:
    """
    Run all ETL jobs.
    
    Args:
        jobs: Optional list of (name, ETLClass) tuples. Defaults to all jobs.
        
    Returns:
        List of job results with metrics
    """
    jobs = jobs or ETL_JOBS
    
    start_time = datetime.utcnow()
    results = []
    
    logger.info(f"Starting ETL run with {len(jobs)} jobs")
    
    for name, ETLClass in jobs:
        job_result = {
            "name": name,
            "status": "pending",
            "metrics": None,
            "error": None
        }
        
        try:
            logger.info(f"{'='*60}")
            logger.info(f"Starting: {name}")
            logger.info(f"{'='*60}")
            
            etl = ETLClass()
            metrics = etl.run()
            
            job_result["status"] = "success"
            job_result["metrics"] = metrics
            
            logger.info(f"Completed: {name}")
            logger.info(f"  Records: {metrics.get('records_transformed', 0)}")
            
        except Exception as e:
            job_result["status"] = "failed"
            job_result["error"] = str(e)
            
            logger.error(f"Failed: {name}")
            logger.error(f"  Error: {e}")
        
        results.append(job_result)
    
    # Summary
    elapsed = (datetime.utcnow() - start_time).total_seconds()
    
    success_count = sum(1 for r in results if r["status"] == "success")
    failed_count = sum(1 for r in results if r["status"] == "failed")
    
    logger.info(f"\n{'='*60}")
    logger.info(f"ETL RUN COMPLETE")
    logger.info(f"{'='*60}")
    logger.info(f"Duration: {elapsed:.1f} seconds")
    logger.info(f"Success: {success_count}/{len(results)}")
    logger.info(f"Failed: {failed_count}/{len(results)}")
    
    for result in results:
        status_icon = "✓" if result["status"] == "success" else "✗"
        logger.info(f"  {status_icon} {result['name']}: {result['status']}")
        if result["error"]:
            logger.info(f"      Error: {result['error']}")
    
    return results


if __name__ == "__main__":
    results = run_all()
    
    # Exit with error code if any jobs failed
    if any(r["status"] == "failed" for r in results):
        sys.exit(1)
```

### `jobs/ingest_city.py`

```python
"""
City-Specific ETL Runner

Run all ETL jobs for a specific city/jurisdiction.
"""

import sys
import argparse
from datetime import datetime

from _shared.utils.logger import get_logger

logger = get_logger("ingest_city")

# City job registry
CITY_JOBS = {
    "houston": [
        ("houston.parcels_houston", "HoustonParcelsETL"),
        ("houston.zoning_houston", "HoustonZoningETL"),
        ("houston.utilities_houston", "HoustonWaterMainsETL"),
        ("houston.utilities_houston", "HoustonSewerMainsETL"),
    ],
    "austin": [
        ("austin.parcels_austin", "AustinParcelsETL"),
        ("austin.zoning_austin", "AustinZoningETL"),
    ],
    "dallas": [
        ("dallas.parcels_dallas", "DallasParcelsETL"),
        ("dallas.zoning_dallas", "DallasZoningETL"),
    ],
}


def run_city(city: str) -> dict:
    """
    Run all ETL jobs for a specific city.
    
    Args:
        city: City name (houston, austin, dallas, etc.)
        
    Returns:
        Results dictionary
    """
    city = city.lower()
    
    if city not in CITY_JOBS:
        raise ValueError(f"Unknown city: {city}. Available: {list(CITY_JOBS.keys())}")
    
    jobs = CITY_JOBS[city]
    results = []
    
    logger.info(f"Running ETL for {city.upper()}")
    
    for module_name, class_name in jobs:
        try:
            # Dynamic import
            module = __import__(module_name, fromlist=[class_name])
            ETLClass = getattr(module, class_name)
            
            logger.info(f"Running: {class_name}")
            
            etl = ETLClass()
            metrics = etl.run()
            
            results.append({
                "job": class_name,
                "status": "success",
                "metrics": metrics
            })
            
        except Exception as e:
            logger.error(f"Failed: {class_name} - {e}")
            results.append({
                "job": class_name,
                "status": "failed",
                "error": str(e)
            })
    
    return {
        "city": city,
        "jobs_run": len(results),
        "success": sum(1 for r in results if r["status"] == "success"),
        "failed": sum(1 for r in results if r["status"] == "failed"),
        "results": results
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run ETL for a specific city")
    parser.add_argument("city", help="City name (houston, austin, dallas)")
    
    args = parser.parse_args()
    
    result = run_city(args.city)
    
    if result["failed"] > 0:
        sys.exit(1)
```

---

## Dataset Registration

### Registration SQL Template

After each successful ETL run, register the dataset:

```sql
-- Register dataset in datasets table
INSERT INTO datasets (
    jurisdiction,
    dataset_key,
    dataset_type,
    dataset_version,
    layer_name,
    mapserver_id,
    status,
    record_count,
    effective_from,
    metadata
)
VALUES (
    'houston',
    'houston_zoning_v2025_03',
    'zoning',
    'v2025_03',
    'Houston Overlay Districts',
    (SELECT id FROM map_servers WHERE jurisdiction = 'houston' AND name LIKE '%Zoning%' LIMIT 1),
    'active',
    (SELECT COUNT(*) FROM zoning_canonical WHERE jurisdiction = 'houston' AND dataset_version = 'v2025_03'),
    NOW(),
    jsonb_build_object(
        'source_url', 'https://gis.houstontx.gov/arcgis/rest/services/Boundaries/MapServer',
        'layer_id', 0,
        'etl_version', '1.0.0',
        'ingested_at', NOW()
    )
)
ON CONFLICT (jurisdiction, dataset_type, dataset_version) 
DO UPDATE SET
    status = EXCLUDED.status,
    record_count = EXCLUDED.record_count,
    updated_at = NOW();
```

### `_shared/utils/register_dataset.py`

```python
"""
Dataset Registration Utility

Registers completed ETL datasets in the datasets table.
"""

from datetime import datetime
from typing import Dict, Optional
from utils.pg_uploader import run_sql
from utils.logger import get_logger

logger = get_logger(__name__)


def register_dataset(
    jurisdiction: str,
    dataset_type: str,
    version: str,
    layer_name: str,
    source_url: str,
    layer_id: int,
    mapserver_id: Optional[str] = None
) -> None:
    """
    Register a completed dataset.
    
    Args:
        jurisdiction: City/county name
        dataset_type: Type (parcels, zoning, flood, etc.)
        version: Version string
        layer_name: Human-readable layer name
        source_url: Source MapServer URL
        layer_id: Source layer ID
        mapserver_id: Optional FK to map_servers table
    """
    dataset_key = f"{jurisdiction}_{dataset_type}_{version}"
    
    # Count records in canonical table
    canonical_tables = {
        "parcels": "parcels_canonical",
        "zoning": "zoning_canonical",
        "flood": "fema_flood_canonical",
        "utilities": "utilities_canonical",
        "wetlands": "wetlands_canonical",
    }
    
    table = canonical_tables.get(dataset_type, f"{dataset_type}_canonical")
    
    count_sql = f"""
    SELECT COUNT(*) FROM {table}
    WHERE jurisdiction = '{jurisdiction}'
      AND dataset_version = '{version}'
    """
    result = run_sql(count_sql, fetch=True)
    record_count = result[0][0] if result else 0
    
    # Build metadata
    metadata = {
        "source_url": source_url,
        "layer_id": layer_id,
        "etl_version": "1.0.0",
        "ingested_at": datetime.utcnow().isoformat()
    }
    
    # Insert/update dataset registration
    sql = f"""
    INSERT INTO datasets (
        jurisdiction,
        dataset_key,
        dataset_type,
        dataset_version,
        layer_name,
        mapserver_id,
        status,
        record_count,
        effective_from,
        metadata
    )
    VALUES (
        '{jurisdiction}',
        '{dataset_key}',
        '{dataset_type}',
        '{version}',
        '{layer_name}',
        {f"'{mapserver_id}'" if mapserver_id else 'NULL'},
        'active',
        {record_count},
        NOW(),
        '{json.dumps(metadata)}'::jsonb
    )
    ON CONFLICT (jurisdiction, dataset_type, dataset_version) 
    DO UPDATE SET
        status = EXCLUDED.status,
        record_count = EXCLUDED.record_count,
        updated_at = NOW()
    """
    
    run_sql(sql)
    logger.info(f"Registered dataset: {dataset_key} ({record_count} records)")
```

---

## Integration with Edge Functions

The ETL system integrates with existing Supabase Edge Functions:

### Data Flow Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ETL ←→ Edge Function Integration                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│   ETL Pipeline       │     │   Supabase Tables    │     │  Edge Functions  │
│   (Python Workers)   │     │   (PostGIS)          │     │  (Deno)          │
└──────────────────────┘     └──────────────────────┘     └──────────────────┘
         │                            │                           │
         │  1. Ingest & Transform     │                           │
         │ ─────────────────────────> │                           │
         │                            │                           │
         │                            │  2. Query Canonical Data  │
         │                            │ <───────────────────────  │
         │                            │                           │
         │  3. On-Demand Refresh      │                           │
         │ <───────────────────────── │ <───────────────────────  │
         │                            │                           │
         │  4. Update Version         │                           │
         │ ─────────────────────────> │                           │
         │                            │                           │
```

### Edge Function Integration Points

| Edge Function | Integration |
|---------------|-------------|
| `gis-fetch-with-versioning` | Triggers on-demand ETL refresh for stale layers |
| `gis-refresh-scheduler` | Orchestrates scheduled ETL runs via pg_cron |
| `enrich-utilities` | Queries `utilities_canonical` for enrichment |
| `enrich-wetlands` | Queries `wetlands_canonical` for enrichment |
| `query-fema-by-point` | Queries `fema_flood_canonical` for flood data |
| `fetch-parcels` | Queries `parcels_canonical` for parcel selection |

### Triggering ETL from Edge Functions

```typescript
// Example: Trigger ETL refresh from edge function
async function triggerETLRefresh(
  jurisdiction: string,
  datasetType: string
): Promise<void> {
  // Option 1: Direct API call to ETL worker
  const response = await fetch(`${ETL_WORKER_URL}/ingest`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ETL_API_KEY}` },
    body: JSON.stringify({
      jurisdiction,
      dataset_type: datasetType,
      force: true
    })
  });
  
  // Option 2: Queue job via database
  await supabase.from('etl_job_queue').insert({
    jurisdiction,
    dataset_type: datasetType,
    priority: 1,
    status: 'queued'
  });
}
```

---

## Deployment & Scheduling

### Docker Configuration

#### `docker/Dockerfile`

```dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gdal-bin \
    libgdal-dev \
    tippecanoe \
    && rm -rf /var/lib/apt/lists/*

# Set GDAL environment
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal

# Create app directory
WORKDIR /app

# Install Python dependencies
COPY docker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy ETL code
COPY . .

# Set Python path
ENV PYTHONPATH=/app

# Default command
CMD ["python", "jobs/run_all.py"]
```

#### `docker/requirements.txt`

```
geopandas>=0.14.0
sqlalchemy>=2.0.0
psycopg2-binary>=2.9.0
pyproj>=3.6.0
requests>=2.31.0
pyyaml>=6.0
shapely>=2.0.0
```

#### `docker/docker-compose.yml`

```yaml
version: '3.8'

services:
  etl-worker:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - LOG_LEVEL=INFO
      - LOG_FORMAT=json
    volumes:
      - ./tmp:/app/tmp
    depends_on:
      - db
    
  db:
    image: postgis/postgis:15-3.3
    environment:
      - POSTGRES_DB=siteintel
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  pgdata:
```

### pg_cron Scheduling

```sql
-- Schedule daily ETL refresh at 3 AM CST
SELECT cron.schedule(
    'etl-daily-refresh',
    '0 3 * * *',
    $$
    SELECT net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/gis-refresh-scheduler',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
            'Content-Type', 'application/json'
        ),
        body := '{"force_refresh": false}'::jsonb
    )
    $$
);

-- Schedule weekly full refresh on Sundays at 2 AM
SELECT cron.schedule(
    'etl-weekly-full-refresh',
    '0 2 * * 0',
    $$
    SELECT net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/gis-refresh-scheduler',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
            'Content-Type', 'application/json'
        ),
        body := '{"force_refresh": true}'::jsonb
    )
    $$
);
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/etl.yml
name: ETL Pipeline

on:
  schedule:
    - cron: '0 8 * * *'  # Daily at 8 AM UTC (3 AM CST)
  workflow_dispatch:
    inputs:
      city:
        description: 'City to ingest (or "all")'
        required: true
        default: 'all'

jobs:
  etl:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          
      - name: Install dependencies
        run: |
          pip install -r etl/docker/requirements.txt
          
      - name: Run ETL
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          cd etl
          if [ "${{ github.event.inputs.city }}" = "all" ]; then
            python jobs/run_all.py
          else
            python jobs/ingest_city.py ${{ github.event.inputs.city }}
          fi
```

---

## Monitoring & Alerting

### Job History Table

```sql
-- Track all ETL job executions
CREATE TABLE IF NOT EXISTS public.etl_job_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    jurisdiction TEXT,
    dataset_type TEXT,
    version TEXT,
    status TEXT NOT NULL,  -- queued, running, success, failed
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    duration_ms INTEGER,
    records_fetched INTEGER,
    records_valid INTEGER,
    records_loaded INTEGER,
    records_transformed INTEGER,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON etl_job_history(job_name, created_at DESC);
CREATE INDEX ON etl_job_history(status);
CREATE INDEX ON etl_job_history(jurisdiction);
```

### Alert Conditions

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Job failure | Any | Slack notification + PagerDuty |
| Duration > 2x average | Per job | Warning notification |
| Record count < 80% of previous | Per dataset | Warning notification |
| Source unavailable | 3 consecutive failures | Critical alert |
| Transform errors > 5% | Per job | Warning notification |

---

## Error Handling & Recovery

### Retry Strategy

```python
# Retry configuration by error type
RETRY_CONFIG = {
    "network_error": {
        "max_retries": 5,
        "base_delay": 2,
        "exponential": True
    },
    "rate_limit": {
        "max_retries": 10,
        "base_delay": 60,
        "exponential": False
    },
    "transform_error": {
        "max_retries": 2,
        "base_delay": 5,
        "exponential": False
    }
}
```

### Recovery Procedures

1. **Partial Failure Recovery**
   - Resume from last successful offset
   - Skip invalid records, log for review
   - Continue to transform phase

2. **Complete Failure Recovery**
   - Preserve staging table
   - Log full error context
   - Queue for manual review
   - Notify ops team

3. **Data Rollback**
   ```sql
   -- Rollback a failed dataset version
   DELETE FROM zoning_canonical
   WHERE jurisdiction = 'houston'
     AND dataset_version = 'v2025_03';
   
   -- Reactivate previous version
   UPDATE datasets
   SET status = 'active'
   WHERE jurisdiction = 'houston'
     AND dataset_type = 'zoning'
     AND dataset_version = 'v2025_02';
   ```

---

## Cross-References

| Document | Description |
|----------|-------------|
| [`CANONICAL_SCHEMA.md`](./CANONICAL_SCHEMA.md) | Target schema definitions for all canonical tables |
| [`TRANSFORM_CONFIG_DSL.md`](./TRANSFORM_CONFIG_DSL.md) | Declarative transformation language reference |
| [`HOUSTON_REPLICATION_MOAT.md`](./HOUSTON_REPLICATION_MOAT.md) | Houston-specific data sources and configs |
| [`ETL_JOBS.md`](../operations/ETL_JOBS.md) | Scheduled job documentation |
| [`GIS_SPATIAL_LOGIC.md`](./GIS_SPATIAL_LOGIC.md) | Geospatial query patterns |

---

## Quick Reference

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/db
ETL_CACHE_DIR=/tmp/etl_cache

# Optional
LOG_LEVEL=INFO          # DEBUG, INFO, WARNING, ERROR
LOG_FORMAT=console      # console, json
AWS_ACCESS_KEY_ID=xxx   # For S3 tile upload
AWS_SECRET_ACCESS_KEY=xxx
S3_TILE_BUCKET=siteintel-tiles
CLOUDFRONT_DISTRIBUTION_ID=xxx
```

### Common Commands

```bash
# Run all ETL jobs
python jobs/run_all.py

# Run single city
python jobs/ingest_city.py houston

# Run single dataset
python jobs/ingest_dataset.py houston zoning

# Regenerate tiles
python jobs/refresh_tiles.py --dataset houston_zoning_v2025_03

# Validate all datasets
python jobs/validate_all.py

# Cleanup old staging tables
python jobs/cleanup_staging.py --older-than 7d
```

---

*Last Updated: 2025-03-15*  
*Version: 1.0.0*  
*Maintainer: SiteIntel Engineering*
