# SiteIntel™ Canonical Schema

> **The Master Data Model for Unified GIS Intelligence**

The canonical schema is the master data model that unifies ALL incoming city, county, state, and federal datasets into a single standardized format. Every dataset—parcels, zoning, flood, wetlands, utilities, traffic, stormwater, plats, land use—must be transformed into this schema before being used by AI engines, feasibility scoring, or tile generation.

This schema is the foundation of the **SiteIntel™ Data Moat**: once normalized, datasets become interoperable, comparable, AI-ready, and version-controlled. No competitor can reproduce this consistency without building identical pipelines.

---

## Table of Contents

1. [Purpose of the Canonical Schema](#purpose-of-the-canonical-schema)
2. [High-Level Schema Design](#high-level-schema-design)
3. [Full JSON Schema Definition](#full-json-schema-definition)
4. [Domain-Specific Field Documentation](#domain-specific-field-documentation)
5. [Schema Versioning Strategy](#schema-versioning-strategy)
6. [Transformation Examples](#transformation-examples)
7. [Cross-References](#cross-references)
8. [Why This Page Exists](#why-this-page-exists)

---

## Purpose of the Canonical Schema

The canonical schema serves as the single source of truth for all GIS data within SiteIntel:

| Purpose | Description |
|---------|-------------|
| **Standardization** | Unify heterogeneous GIS datasets from 1000+ sources into a single model |
| **AI Compatibility** | Ensure AI engines receive consistent, validated fields regardless of source |
| **Tile Generation** | Enable vector tile generation across all layers with predictable field names |
| **Multi-City Scaling** | Support fast expansion to new cities/states without schema changes |
| **Audit-Grade Outputs** | Provide lenders and developers with reproducible, traceable data |
| **Structural Moat** | Create permanent competitive advantage through data harmonization |

### What Gets Normalized

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        UPSTREAM DATA SOURCES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  City GIS     │  County CAD   │  State DOT   │  Federal (FEMA/EPA/USFWS)   │
│  - Parcels    │  - Appraisals │  - Traffic   │  - Flood Zones              │
│  - Utilities  │  - Ownership  │  - Roads     │  - Wetlands                 │
│  - Zoning     │  - Values     │  - AADT      │  - Environmental Sites      │
└───────────────┴───────────────┴──────────────┴─────────────────────────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │   CANONICAL SCHEMA    │
                        │   (This Document)     │
                        └───────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DOWNSTREAM CONSUMERS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  AI Engines   │  Tile Server  │  Feasibility  │  Reports & PDFs            │
│  - Zoning     │  - Vector PBF │  - Scoring    │  - Lender Packages         │
│  - Flood      │  - Raster     │  - Kill Fac.  │  - Executive Summary       │
│  - Utilities  │  - Overlays   │  - Confidence │  - Data Provenance         │
└───────────────┴───────────────┴───────────────┴─────────────────────────────┘
```

---

## High-Level Schema Design

The canonical schema is designed with the following **immutable principles**:

### 1. **Stability**
Field names **never change**. Once a field is added to the canonical schema, it remains forever. This ensures backward compatibility across all downstream consumers.

```
✓ parcel_id → Always "parcel_id" (never "parcelId", "PARCEL_ID", "pid")
✓ flood_zone → Always "flood_zone" (never "fld_zone", "ZONE", "floodZone")
```

### 2. **Extensibility**
New cities, states, or data types can be added **without breaking compatibility**. The schema uses optional fields and domain-specific extensions.

```json
{
  "parcel": { ... },           // Core fields (all sources)
  "parcel_houston": { ... },   // Houston-specific extensions
  "parcel_dallas": { ... }     // Dallas-specific extensions (future)
}
```

### 3. **AI Compatibility**
All fields are predictable and typed for AI reasoning. The schema eliminates ambiguity in field names and value formats.

| Raw Source Field | Canonical Field | AI-Ready Format |
|------------------|-----------------|-----------------|
| `FLD_ZONE`, `ZONE`, `FloodZone` | `flood_zone` | `"AE"`, `"X"`, `"VE"` |
| `ZONING`, `ZoneCode`, `ZONE_CD` | `zoning_code` | `"C-2"`, `"R-1"`, `"PD"` |
| `DIAMETER`, `DIA`, `pipe_dia` | `pipe_diameter_in` | `8`, `12`, `24` (integer) |

### 4. **GIS Interoperability**
The schema supports all standard GIS geometry types with consistent CRS handling:

- `Polygon` / `MultiPolygon` — Parcels, flood zones, wetlands
- `LineString` / `MultiLineString` — Utilities, roads, easements
- `Point` — Addresses, manholes, hydrants, meters
- All geometries stored in **EPSG:3857** (Web Mercator) for tile compatibility

### 5. **Versioned**
Every record includes version metadata for complete traceability:

- `source_version` — Version of upstream dataset (e.g., `hcad_2025_12_01`)
- `canonical_version` — Version of schema used for transformation (e.g., `v2.3.0`)
- `ingested_at` / `transformed_at` — Timestamps for audit trail

---

## Full JSON Schema Definition

The complete canonical schema with all domains:

```json
{
  "canonical_schema": {
    "_meta": {
      "source_name": "string",
      "source_url": "string",
      "source_layer_id": "number",
      "source_version": "string",
      "source_crs": "string",
      "ingested_at": "timestamp",
      "transformed_at": "timestamp",
      "canonical_version": "string",
      "record_hash": "string"
    },

    "geometry": {
      "type": "Polygon | MultiPolygon | LineString | Point | MultiLineString",
      "crs": "EPSG:3857",
      "coordinates": "array",
      "area_sqft": "number",
      "area_acres": "number",
      "perimeter_ft": "number",
      "centroid_lat": "number",
      "centroid_lon": "number",
      "bounding_box": {
        "min_lat": "number",
        "max_lat": "number",
        "min_lon": "number",
        "max_lon": "number"
      }
    },

    "parcel": {
      "parcel_id": "string (required)",
      "apn": "string",
      "account_number": "string",
      "county": "string (required)",
      "city": "string",
      "state": "string (required)",
      "situs_address": "string",
      "situs_city": "string",
      "situs_zip": "string",
      "owner_name": "string",
      "owner_address": "string",
      "legal_description": "string",
      "subdivision": "string",
      "block": "string",
      "lot": "string",
      "land_use_code": "string",
      "land_use_description": "string",
      "land_value": "number",
      "improvement_value": "number",
      "total_value": "number",
      "tax_year": "number",
      "year_built": "number",
      "building_sqft": "number",
      "stories": "number"
    },

    "zoning": {
      "zoning_code": "string",
      "zoning_description": "string",
      "zoning_category": "string",
      "overlay_district": "string",
      "future_land_use": "string",
      "min_lot_size_sqft": "number",
      "max_lot_coverage_pct": "number",
      "max_height_ft": "number",
      "max_stories": "number",
      "far": "number",
      "setback_front_ft": "number",
      "setback_side_ft": "number",
      "setback_rear_ft": "number",
      "parking_ratio": "number",
      "use_restrictions": "array<string>",
      "permitted_uses": "array<string>",
      "conditional_uses": "array<string>"
    },

    "flood": {
      "flood_zone": "string",
      "flood_zone_description": "string",
      "bfe": "number",
      "bfe_source": "string",
      "floodway_flag": "boolean",
      "floodway_width_ft": "number",
      "coastal_flag": "boolean",
      "sfha_flag": "boolean",
      "firm_panel_id": "string",
      "firm_effective_date": "date",
      "flood_risk_score": "number",
      "flood_insurance_required": "boolean"
    },

    "wetlands": {
      "wetland_flag": "boolean",
      "wetland_type": "string",
      "wetland_code": "string",
      "wetland_description": "string",
      "wetland_area_sqft": "number",
      "wetland_area_acres": "number",
      "wetland_pct_of_parcel": "number",
      "cowardin_class": "string",
      "nwi_source_date": "date"
    },

    "utilities": {
      "water_available": "boolean",
      "water_distance_ft": "number",
      "water_main_size_in": "number",
      "water_pressure_psi": "number",
      "water_provider": "string",
      
      "sewer_available": "boolean",
      "sewer_distance_ft": "number",
      "sewer_main_size_in": "number",
      "sewer_type": "string",
      "sewer_provider": "string",
      "septic_required": "boolean",
      
      "storm_available": "boolean",
      "storm_distance_ft": "number",
      "storm_main_size_in": "number",
      
      "electric_available": "boolean",
      "electric_provider": "string",
      "electric_voltage_kv": "number",
      
      "gas_available": "boolean",
      "gas_provider": "string",
      
      "fiber_available": "boolean",
      "fiber_provider": "string",
      
      "utility_serviceability_score": "number",
      "estimated_extension_cost": "number"
    },

    "topography": {
      "elevation_min_ft": "number",
      "elevation_max_ft": "number",
      "elevation_avg_ft": "number",
      "elevation_range_ft": "number",
      "avg_slope_percent": "number",
      "max_slope_percent": "number",
      "slope_direction": "string",
      "slope_class": "string",
      "cut_volume_cuyd": "number",
      "fill_volume_cuyd": "number",
      "net_earthwork_cuyd": "number"
    },

    "transportation": {
      "road_frontage_ft": "number",
      "road_name": "string",
      "road_classification": "string",
      "road_surface": "string",
      "speed_limit_mph": "number",
      "aadt": "number",
      "aadt_year": "number",
      "truck_pct": "number",
      "peak_hour_volume": "number",
      "nearest_intersection_ft": "number",
      "nearest_signal_ft": "number",
      "driveway_feasibility_score": "number",
      "access_points": "number",
      "curb_cut_available": "boolean"
    },

    "environmental": {
      "epa_facility_count_1mi": "number",
      "nearest_epa_facility_ft": "number",
      "nearest_epa_facility_type": "string",
      "brownfield_flag": "boolean",
      "superfund_flag": "boolean",
      "ust_count": "number",
      "phase1_recommended": "boolean",
      "environmental_risk_score": "number"
    },

    "jurisdiction": {
      "county_fips": "string",
      "municipality": "string",
      "etj_provider": "string",
      "school_district": "string",
      "mud_district": "string",
      "wcid_district": "string",
      "tax_rate_total": "number",
      "opportunity_zone": "boolean",
      "enterprise_zone": "boolean",
      "foreign_trade_zone": "boolean",
      "tirz_district": "string"
    }
  }
}
```

---

## Domain-Specific Field Documentation

### Parcel Domain

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `parcel_id` | string | ✓ | Unique identifier within county (e.g., HCAD account number) |
| `apn` | string | | Assessor's Parcel Number (alternative ID format) |
| `account_number` | string | | County appraisal account number |
| `county` | string | ✓ | County name (e.g., "Harris", "Fort Bend") |
| `city` | string | | City/municipality name |
| `state` | string | ✓ | Two-letter state code (e.g., "TX") |
| `situs_address` | string | | Property street address |
| `owner_name` | string | | Current owner name from CAD |
| `legal_description` | string | | Full legal description from deed |
| `subdivision` | string | | Subdivision name |
| `block` | string | | Block identifier within subdivision |
| `lot` | string | | Lot identifier within block |
| `land_use_code` | string | | County land use classification code |
| `land_value` | number | | Appraised land value (USD) |
| `improvement_value` | number | | Appraised improvement value (USD) |
| `total_value` | number | | Total appraised value (USD) |
| `year_built` | number | | Year of primary structure construction |
| `building_sqft` | number | | Total building square footage |

### Flood Domain

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `flood_zone` | string | | FEMA flood zone designation (A, AE, X, VE, etc.) |
| `bfe` | number | | Base Flood Elevation in feet NAVD88 |
| `bfe_source` | string | | Source of BFE (FEMA, local, interpolated) |
| `floodway_flag` | boolean | | True if parcel intersects regulatory floodway |
| `floodway_width_ft` | number | | Width of floodway crossing parcel |
| `coastal_flag` | boolean | | True if in coastal high hazard area |
| `sfha_flag` | boolean | | True if in Special Flood Hazard Area |
| `firm_panel_id` | string | | FEMA FIRM panel identifier |
| `flood_risk_score` | number | | Normalized risk score 0-100 |

### Utilities Domain

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `water_available` | boolean | | True if public water within service area |
| `water_distance_ft` | number | | Distance to nearest water main |
| `water_main_size_in` | number | | Diameter of nearest water main |
| `sewer_available` | boolean | | True if public sewer within service area |
| `sewer_distance_ft` | number | | Distance to nearest sewer main |
| `septic_required` | boolean | | True if septic system required |
| `utility_serviceability_score` | number | | Composite score 0-100 |
| `estimated_extension_cost` | number | | Estimated cost to extend utilities (USD) |

### Transportation Domain

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `road_frontage_ft` | number | | Length of road frontage |
| `road_classification` | string | | Functional class (arterial, collector, local) |
| `aadt` | number | | Annual Average Daily Traffic count |
| `aadt_year` | number | | Year of AADT measurement |
| `truck_pct` | number | | Percentage of truck traffic |
| `nearest_intersection_ft` | number | | Distance to nearest intersection |
| `nearest_signal_ft` | number | | Distance to nearest traffic signal |
| `driveway_feasibility_score` | number | | Score 0-100 for driveway access |

---

## Schema Versioning Strategy

### Version Format

```
canonical_version: "v{MAJOR}.{MINOR}.{PATCH}"

Examples:
- v1.0.0 — Initial release
- v1.1.0 — Added wetlands domain
- v1.1.1 — Bug fix in flood_zone normalization
- v2.0.0 — Breaking change: renamed fields
```

### Version Rules

| Change Type | Version Bump | Backward Compatible |
|-------------|--------------|---------------------|
| Add new optional field | PATCH | ✓ Yes |
| Add new domain | MINOR | ✓ Yes |
| Add new required field | MINOR | ⚠️ Partial |
| Rename existing field | MAJOR | ✗ No |
| Remove field | MAJOR | ✗ No |
| Change field type | MAJOR | ✗ No |

### Dataset Version Tracking

Every transformed dataset records its canonical version:

```json
{
  "_meta": {
    "source_name": "HCAD Parcels",
    "source_version": "hcad_2025_12_01",
    "canonical_version": "v2.3.0",
    "transformed_at": "2025-12-08T10:30:00Z"
  }
}
```

### Lender Snapshots

Lenders can request feasibility reports pinned to a specific schema version:

```
GET /api/v2/feasibility/{id}?canonical_version=v2.2.0
```

This enables:
- Regression testing against prior versions
- Reproducible reports for loan documentation
- Full audit traceability for compliance

---

## Transformation Examples

### Example 1: Houston HCAD Parcel → Canonical

**Raw HCAD Data:**
```json
{
  "OBJECTID": 12345,
  "HCAD_NUM": "0123450000001",
  "OWNER": "SMITH JOHN",
  "SITE_ADDR": "123 MAIN ST",
  "LEGAL1": "LT 1 BLK 2 RIVER OAKS",
  "LAND_VAL": 500000,
  "IMPR_VAL": 1500000,
  "TOT_APPR_VAL": 2000000,
  "YR_BUILT": 1985
}
```

**Canonical Output:**
```json
{
  "_meta": {
    "source_name": "HCAD Parcels",
    "source_url": "https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0",
    "source_version": "hcad_2025_12_01",
    "canonical_version": "v2.3.0",
    "ingested_at": "2025-12-08T08:00:00Z",
    "transformed_at": "2025-12-08T08:00:05Z"
  },
  "parcel": {
    "parcel_id": "0123450000001",
    "account_number": "0123450000001",
    "county": "Harris",
    "state": "TX",
    "situs_address": "123 MAIN ST",
    "owner_name": "SMITH JOHN",
    "legal_description": "LT 1 BLK 2 RIVER OAKS",
    "land_value": 500000,
    "improvement_value": 1500000,
    "total_value": 2000000,
    "year_built": 1985
  },
  "geometry": {
    "type": "Polygon",
    "crs": "EPSG:3857",
    "area_sqft": 8712,
    "area_acres": 0.2,
    "centroid_lat": 29.7604,
    "centroid_lon": -95.3698
  }
}
```

### Example 2: Houston Sewer Line → Canonical

**Raw Houston Water Data:**
```json
{
  "OBJECTID": 98765,
  "DIAMETER": 8,
  "MATERIAL": "PVC",
  "INSTALLDATE": "1995-06-15",
  "PIPETYPE": "GRAVITY"
}
```

**Canonical Output:**
```json
{
  "_meta": {
    "source_name": "Houston Water Sewer Mains",
    "source_url": "https://cogis.houstontx.gov/arcgis/rest/services/HWWastewaterLineIPS/MapServer/0",
    "source_version": "hw_sewer_2025_12_01",
    "canonical_version": "v2.3.0"
  },
  "utilities": {
    "sewer_main_size_in": 8,
    "sewer_type": "gravity"
  },
  "geometry": {
    "type": "LineString",
    "crs": "EPSG:3857"
  },
  "_raw": {
    "material": "PVC",
    "install_year": 1995
  }
}
```

---

## Cross-References

This canonical schema is used throughout the SiteIntel platform:

| Document | Relationship |
|----------|--------------|
| [HOUSTON_REPLICATION_MOAT.md](./HOUSTON_REPLICATION_MOAT.md) | Uses canonical schema for Houston dataset normalization |
| [docs/api/schema.json](../api/schema.json) | Application-level schema extends canonical types |
| [docs/api/geospatial_layers.schema.json](../api/geospatial_layers.schema.json) | Parcel geospatial schema follows canonical geometry format |
| [AI_PIPELINE_BLUEPRINT.md](./AI_PIPELINE_BLUEPRINT.md) | AI engines consume canonical schema fields |
| [GEOSPATIAL_INTEGRATION.md](./GEOSPATIAL_INTEGRATION.md) | Spatial analysis outputs conform to canonical format |

---

## Why This Page Exists

This page defines **SiteIntel's unified data model**. Everything else—ETL pipelines, normalization scripts, tileserver configuration, AI reasoning engines, feasibility scoring algorithms, lender-ready reports—**depends on this schema**.

The canonical schema is the **core of the SiteIntel data moat**:

> **No competitor can reproduce 10 years of dataset normalization, field harmonization, and edge case handling without building identical pipelines from scratch.**

Every field in this schema represents thousands of hours of:
- Source data analysis across 100+ city/county GIS systems
- Edge case handling for inconsistent field names
- Type coercion rules for mixed data formats
- CRS transformation logic for 50+ coordinate systems
- AI training data preparation for zoning/flood/utility inference

This schema is **versioned, immutable, and permanent**—the foundation upon which SiteIntel's competitive advantage is built.

---

## Appendix: Schema Evolution History

| Version | Date | Changes |
|---------|------|---------|
| v1.0.0 | 2024-01-15 | Initial schema with parcel, flood, utilities domains |
| v1.1.0 | 2024-03-01 | Added wetlands domain |
| v1.2.0 | 2024-05-15 | Added topography domain |
| v1.3.0 | 2024-07-01 | Added transportation domain |
| v2.0.0 | 2024-09-01 | Restructured geometry handling, added bounding_box |
| v2.1.0 | 2024-10-15 | Added environmental domain |
| v2.2.0 | 2024-11-01 | Added jurisdiction domain |
| v2.3.0 | 2025-12-01 | Added utility serviceability scoring fields |

---

*Last Updated: 2025-12-08*
*Canonical Version: v2.3.0*
*Maintainer: SiteIntel Engineering Team*
