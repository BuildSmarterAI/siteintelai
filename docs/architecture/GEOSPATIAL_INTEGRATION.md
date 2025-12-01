# BuildSmarter™ Geospatial Intelligence Integration

## Overview

The geospatial intelligence system provides structured spatial analysis for parcels, computing feasibility scores based on county boundaries, FEMA flood risk, and traffic exposure.

### Key Components

1.  **Data Ingestion**: Ingests parcel boundaries, FEMA flood zones, and TxDOT traffic data.
2.  **Spatial Analysis**: Performs spatial intersection and proximity calculations.
3.  **Scoring Engine**: Computes a composite geospatial feasibility score.
4.  **Metadata Storage**: Stores spatial metadata and scores in Supabase.

## 1. Data Sources

### 1.1 Parcel Boundaries

-   **Source**: Unified Parcels Layer (ArcGIS Feature Service)
-   **Attributes**: Parcel ID, geometry (polygon)
-   **Update Frequency**: Monthly

### 1.2 FEMA Flood Zones

-   **Source**: OpenFEMA Flood Hazard API
-   **Attributes**: Flood zone code, base flood elevation (BFE)
-   **Update Frequency**: Quarterly

### 1.3 Traffic Data

-   **Source**: TxDOT AADT (Average Annual Daily Traffic)
-   **Attributes**: AADT count, roadway name, segment geometry (polyline)
-   **Update Frequency**: Annually

## 2. Spatial Analysis Logic

### 2.1 Parcel Geocoding

-   **Input**: Property address (string)
-   **Process**: Geocode address to latitude/longitude using Google Maps API.
-   **Output**: `geo_lat`, `geo_lng`

### 2.2 County Boundary Intersection

-   **Input**: Parcel centroid (`geo_lat`, `geo_lng`)
-   **Process**: Spatial intersection with county boundary polygons (HCAD, FBCAD).
-   **Output**: `county_name`

### 2.3 Flood Zone Determination

-   **Input**: Parcel centroid (`geo_lat`, `geo_lng`)
-   **Process**: Spatial intersection with FEMA flood zone polygons.
-   **Output**: `floodplain_zone`, `bfe`

### 2.4 Traffic Exposure Analysis

-   **Input**: Parcel centroid (`geo_lat`, `geo_lng`)
-   **Process**:
    1.  Identify nearest TxDOT traffic segment (polyline) within 500 ft.
    2.  Calculate distance from parcel centroid to segment.
-   **Output**: `traffic_aadt`, `traffic_road_name`, `traffic_distance_ft`

## 3. Geospatial Scoring

### 3.1 Scoring Factors

1.  **Jurisdiction Confidence**:
    -   High if parcel intersects a known county boundary.
    -   Low if no county match or multiple intersections.
2.  **Flood Risk Index**:
    -   Based on flood zone code (e.g., AE = high risk, X = low risk).
    -   Normalized 0–1 scale.
3.  **Traffic Visibility Index**:
    -   Based on AADT count and distance to traffic segment.
    -   Normalized 0–1 scale.

### 3.2 Composite Score

`overall_geospatial_score = w1 * jurisdiction_confidence + w2 * (1 - flood_risk_index) + w3 * traffic_visibility_index`

-   `w1`, `w2`, `w3` are configurable weights.
-   Score ranges from 0 to 100.

## 4. Data Storage

### 4.1 Supabase Tables

1.  `applications`:
    -   `geo_lat`, `geo_lng`
    -   `county_name`
    -   `floodplain_zone`, `bfe`
    -   `traffic_aadt`, `traffic_road_name`, `traffic_distance_ft`
    -   `overall_geospatial_score`
2.  `geospatial_metadata`:
    -   Stores raw spatial data (GeoJSON) for auditability.

### 4.2 JSON Schema

-   Defines the structure for spatial metadata attached to each parcel.
-   Enforces data quality and consistency.
-   See `geospatial_layers.schema.json` for full schema definition.

## 5. API Endpoints

### 5.1 ArcGIS Feature Services

-   **Unified Parcels**: `https://gis.txdot.gov/arcgis/rest/services/...`
-   **HCAD Parcels**: `https://www.hcad.org/arcgis/rest/services/...`
-   **FBCAD Parcels**: `https://www.fbcad.org/arcgis/rest/services/...`

### 5.2 OpenFEMA API

-   `https://hazards.fema.gov/gis/services/public/NFHL/MapServer/WFSServer?request=GetFeature&typeName=public:Nfhl_Polygons&outputFormat=geojson`

### 5.3 TxDOT AADT

-   Direct file download (shapefile)
-   Future: ArcGIS REST endpoint

## 6. Code Snippets

### 6.1 PostGIS Query (Example)

```sql
SELECT
  parcel_id,
  ST_AsGeoJSON(geometry) AS geojson
FROM
  parcels
WHERE
  ST_Intersects(geometry, ST_SetSRID(ST_MakePoint(lng, lat), 4326));
```

### 6.2 JavaScript (Example)

```javascript
// Fetch flood zone data from OpenFEMA API
const response = await fetch(
  `https://hazards.fema.gov/gis/services/public/NFHL/MapServer/WFSServer?request=GetFeature&typeName=public:Nfhl_Polygons&outputFormat=geojson&bbox=${lng},${lat},${lng},${lat},4326`
);
const data = await response.json();
```

## 7. Future Enhancements

1.  **3D Analysis**: Incorporate LiDAR data for elevation modeling.
2.  **Real-time Traffic**: Integrate live traffic feeds for dynamic scoring.
3.  **Environmental Risk**: Expand environmental data sources (EPA, USFWS).
4.  **Predictive Modeling**: Use machine learning to predict future flood risk.
