# API Integration Mapping – BuildSmarter™ Feasibility

**Last Updated:** 2025-10-07  
**Project ID:** mcmfwlgovubpdcfiqfvk  
**Environment:** Production  
**Implementation Status:** ✅ Fully Operational

---

## 1. Property & Parcel Data

### 1.1 Unified Parcels (ArcGIS Feature Service)

- **Description:** Authoritative parcel polygons with standardized attributes.
- **Endpoint:** `https://services.arcgis.com/P3R2k6gLFw9E4wWi/arcgis/rest/services/UnifiedParcels/FeatureServer/0`
- **Geometry Type:** `esriGeometryPolygon`
- **Fields Mapped:**

| Field Name (ArcGIS) | applications Field | Data Type | Notes |
|---|---|---|---|
| APN | parcel_id | TEXT | Primary key |
| OwnerName | parcel_owner | TEXT |  |
| Acreage | acreage_cad | NUMERIC |  |
| Address | property_address | TEXT |  |

### 1.2 Harris County Appraisal District (HCAD)

- **Description:** Harris County parcel attributes.
- **Endpoint:** `https://gis.hcad.org/arcgis/rest/services/cad/real_property/MapServer/0`
- **Geometry Type:** `esriGeometryPolygon`
- **Fields Mapped:**

| Field Name (HCAD) | applications Field | Data Type | Notes |
|---|---|---|---|
| PARCEL | parcel_id | TEXT |  |
| OWNER1 | parcel_owner | TEXT |  |
| ACRES | acreage_cad | NUMERIC |  |
| SITUS | situs_address | TEXT |  |
| PROP_CLASS | prop_type | TEXT |  |
| EXEMPTION | exemption_code | TEXT |  |

### 1.3 Fort Bend County Appraisal District (FBCAD)

- **Description:** Fort Bend County parcel attributes.
- **Endpoint:** `https://fbcad.org/arcgis/rest/services/FBCAD_Parcels/MapServer/0`
- **Geometry Type:** `esriGeometryPolygon`
- **Fields Mapped:**

| Field Name (FBCAD) | applications Field | Data Type | Notes |
|---|---|---|---|
| PARCEL_NUM | parcel_id | TEXT |  |
| OWNER_NAME | parcel_owner | TEXT |  |
| ACRES | acreage_cad | NUMERIC |  |
| PROPERTY_ADDRESS | property_address | TEXT |  |
| PROP_CLASS | prop_type | TEXT |  |
| EXEMPTION_CODE | exemption_code | TEXT |  |

## 2. Zoning & Entitlements

### 2.1 City of Houston Zoning

- **Description:** Zoning districts and overlay districts.
- **Endpoint:** `https://cohgis.houstontx.gov/arcgis/rest/services/planning/zoning/MapServer/0`
- **Geometry Type:** `esriGeometryPolygon`
- **Fields Mapped:**

| Field Name (Houston) | applications Field | Data Type | Notes |
|---|---|---|---|
| ZONING | zoning_code | TEXT |  |
| OVERLAY | overlay_district | TEXT |  |

## 3. Floodplain & Environmental

### 3.1 FEMA Flood Hazard Zones (OpenFEMA)

- **Description:** FEMA flood zones and base flood elevations.
- **Endpoint:** `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/3`
- **Geometry Type:** `esriGeometryPolygon`
- **Fields Mapped:**

| Field Name (FEMA) | applications Field | Data Type | Notes |
|---|---|---|---|
| ZONE_SUBTY | floodplain_zone | TEXT |  |
| BFE | base_flood_elevation | NUMERIC |  |

### 3.2 FEMA Flood Hazard Zones (NFHL)

- **Description:** FEMA flood zones and base flood elevations.
- **Endpoint:** `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/3`
  - **Note:** This is the primary NFHL endpoint.
- **Geometry Type:** `esriGeometryPolygon`
- **Fields Mapped:**

| Field Name (FEMA) | applications Field | Data Type | Notes |
|---|---|---|---|
| ZONE_SUBTY | floodplain_zone | TEXT |  |
| BFE_REVISED | base_flood_elevation | NUMERIC |  |

### 3.3 EPA Envirofacts (FRS)

- **Description:** EPA regulated facilities and environmental cleanup sites.
- **Endpoint:** `https://enviro.epa.gov/envirofacts/rest/services/frs/MapServer/0`
- **Geometry Type:** `esriGeometryPoint`
- **Fields Mapped:**

| Field Name (EPA) | applications Field | Data Type | Notes |
|---|---|---|---|
| FACILITY_NAME | environmental_sites->site_name | TEXT |  |
| PGM_SYS_ACRNM | environmental_sites->program | TEXT |  |
| FAC_SRCE_ST_CD | environmental_sites->status | TEXT |  |

### 3.4 USFWS Wetlands

- **Description:** National Wetlands Inventory data.
- **Endpoint:** `https://www.fws.gov/wetlands/data/mapper.html`
  - **Note:** Data is typically accessed via download and spatial join.
- **Geometry Type:** `esriGeometryPolygon`
- **Fields Mapped:**

| Field Name (USFWS) | applications Field | Data Type | Notes |
|---|---|---|---|
| WETLAND_TYPE | wetlands_type | TEXT |  |

### 3.5 USDA SSURGO Soils

- **Description:** Soil Survey Geographic (SSURGO) database.
- **Endpoint:** `https://sdmdataaccess.nrcs.usda.gov/Spatial/SDM.wms`
  - **Note:** Accessed via WMS and spatial query.
- **Geometry Type:** `esriGeometryPolygon`
- **Fields Mapped:**

| Field Name (USDA) | applications Field | Data Type | Notes |
|---|---|---|---|
| MUSYM | soil_series | TEXT |  |
| SLOPE | soil_slope_percent | NUMERIC |  |
| DRAINA | soil_drainage_class | TEXT |  |

## 4. Utilities & Infrastructure

### 4.1 City of Houston Water Lines

- **Description:** Water line locations and attributes.
- **Endpoint:** `https://cohgis.houstontx.gov/arcgis/rest/services/public/water/MapServer/0`
- **Geometry Type:** `esriGeometryPolyline`
- **Fields Mapped:**

| Field Name (Houston) | applications Field | Data Type | Notes |
|---|---|---|---|
| DIAMETER | water_lines->diameter | TEXT |  |
| STATUS | water_lines->status | TEXT |  |

### 4.2 City of Houston Sewer Lines

- **Description:** Sewer line locations and attributes.
- **Endpoint:** `https://cohgis.houstontx.gov/arcgis/rest/services/public/sewer/MapServer/0`
- **Geometry Type:** `esriGeometryPolyline`
- **Fields Mapped:**

| Field Name (Houston) | applications Field | Data Type | Notes |
|---|---|---|---|
| DIAMETER | sewer_lines->diameter | TEXT |  |
| STATUS | sewer_lines->status | TEXT |  |

### 4.3 City of Houston Storm Sewer Lines

- **Description:** Storm sewer line locations and attributes.
- **Endpoint:** `https://cohgis.houstontx.gov/arcgis/rest/services/public/storm/MapServer/0`
- **Geometry Type:** `esriGeometryPolyline`
- **Fields Mapped:**

| Field Name (Houston) | applications Field | Data Type | Notes |
|---|---|---|---|
| DIAMETER | storm_lines->diameter | TEXT |  |
| STATUS | storm_lines->status | TEXT |  |

## 5. Traffic & Mobility

### 5.1 TxDOT AADT Traffic Counts

- **Description:** Annual Average Daily Traffic counts on Texas roadways.
- **Endpoint:** `https://gis.txdot.gov/arcgis/rest/services/TxDOT_AADT/MapServer/0`
- **Geometry Type:** `esriGeometryPolyline`
- **Fields Mapped:**

| Field Name (TxDOT) | applications Field | Data Type | Notes |
|---|---|---|---|
| AADT | traffic_aadt | NUMERIC |  |
| YEAR | traffic_year | INT |  |
| ROAD_NAME | traffic_road_name | TEXT |  |
| DIRECTION | traffic_direction | TEXT |  |
| MAP_URL | traffic_map_url | TEXT |  |

## 6. Demographics & Market

### 6.1 Census ACS (American Community Survey)

- **Description:** Demographic data from the US Census Bureau.
- **Endpoint:** `https://api.census.gov/data/2022/acs/acs5`
  - **Note:** Accessed via Census API and spatial query.
- **Fields Mapped:**

| Field Name (Census) | applications Field | Data Type | Notes |
|---|---|---|---|
| B01003_001E | population_1mi | NUMERIC |  |
| B19013_001E | median_income | NUMERIC |  |

### 6.2 BLS QCEW (Quarterly Census of Employment and Wages)

- **Description:** Employment data from the Bureau of Labor Statistics.
- **Endpoint:** `https://www.bls.gov/cew/data.htm`
  - **Note:** Accessed via BLS API and spatial query.
- **Fields Mapped:**

| Field Name (BLS) | applications Field | Data Type | Notes |
|---|---|---|---|
| NAICS | employment_clusters->sector | TEXT |  |
| ESTAB | employment_clusters->jobs | NUMERIC |  |

---

**Disclaimer:** This document is for informational purposes only and is subject to change. Please verify all data with the source providers.
