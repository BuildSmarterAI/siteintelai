# BuildSmarter™ Feasibility — GIS & Spatial Analysis Logic Document

## 1. Purpose & Scope

This document defines the geospatial computation logic underlying the BuildSmarter™ Feasibility Engine. It explains how parcel, floodplain, utility, environmental, and transportation datasets are spatially joined, buffered, and normalized to produce canonical fields consumed by the AI Feasibility Engine and OData outputs.

The intent is **reproducibility** — any engineer should be able to recreate the same enrichment logic using ArcGIS REST services, OpenFEMA APIs, and standard spatial relationships (intersects, within, contains).

**Scope includes**:
- Parcel and overlay intersection logic
- Spatial reference harmonization
- Buffer calculations (distance-based joins)
- Visualization parameterization for map rendering in reports

## 2. Coordinate System & Spatial Reference Management

### Primary SRID

**EPSG:2278** — NAD83 / Texas South Central (ft), as used by HCAD/FBCAD/Unified parcel services

### Normalized SRID for Storage

**EPSG:4326** (WGS84)

### Transformation Rule

```sql
geometry = ST_Transform(geometry, 4326)
-- store geometry as GeoJSON (lat/lon)
-- persist original SRID under enrichment_raw.metadata.srid
```

### Reasoning

All parcel datasets (HCAD, FBCAD, Unified) and city utilities (StormwaterUtilities MapServer, Force Main (ID:24)) operate in **Texas State Plane Feet (2278)**. By transforming to WGS84 for storage, we ensure compatibility with web mapping libraries, OData queries, and PDF map rendering engines while preserving measurement accuracy in the original coordinate system.

## 3. Spatial Operation Logic (Per Dataset)

### 3.1 Parcel Base Layers

#### Unified Parcels (ID:7)
**Purpose**: Primary parcel footprint layer for spatial anchor

**Query**:
```
geometry=<lat,lon>
geometryType=esriGeometryPoint
spatialRel=esriSpatialRelIntersects
outFields=OBJECTID,TAX_ID,ADDRESS,COUNTY,ACREAGE,OWNER
returnGeometry=true
```

**Operation**: Point-in-polygon (centroid intersect)

**Output**: Parcel polygon geometry + base attributes → `applications.parcel_id`, `owner`, `acreage_cad`

#### HCAD Parcels (ID:4) / FBCAD Parcels (ID:5)
**Purpose**: County-specific attribute enrichment layers

**Query**:
```
geometry=<parcel geometry>
spatialRel=esriSpatialRelIntersects
outFields=OwnerName,Situs,TotalValue,LandValue,ImprovementValue,Legal
returnGeometry=false
```

**Operation**: Attribute join by intersection

**Normalization**: 
- Numeric coercion of value fields
- Concatenation of legal descriptions

### 3.2 Floodplain & FEMA Integration

**Dataset**: OpenFEMA NFIP Multiple Loss, DisasterDeclarationsSummaries

**NFHL Overlay**: Parcel polygon intersect with NFHL flood zones

**Spatial Relation**: `esriSpatialRelIntersects`

#### Derived Attributes

| Field            | Description                  |
|------------------|------------------------------|
| flood_zone       | e.g., AE, X                  |
| bfe_ft           | Base flood elevation         |
| flood_panel_id   | FEMA panel identifier        |

#### Flood Risk Logic

| Condition                                    | Score |
|----------------------------------------------|-------|
| Parcel centroid in Zone X                    | 100   |
| Zone AE with bfe_ft < site elevation         | 70    |
| Zone AE with bfe_ft ≥ site elevation         | 40    |
| VE/Coastal zones                             | 20    |

#### FEMA Refresh Handling

- Retrieve `lastDataSetRefresh` via OpenFEMA DataSets endpoint
- Append metadata in report citations

### 3.3 Utilities Overlays

#### StormwaterUtilities (MapServer)

**Layers**: Drainage Class, Stormdrain mains, inlets, ponds, easements

**Query**: Buffer join with distance ≤ 300 ft

**Spatial Relation**: `esriSpatialRelIntersects`

**Derived Fields**:
- `nearest_storm_asset`
- `distance_ft`
- `asset_type`

#### Force Main (ID:24)

**Query**:
```
geometry=<parcel centroid>
geometryType=esriGeometryPoint
spatialRel=esriSpatialRelIntersects
buffer=250
outFields=DIAMETER,OWNER,LENGTH,PLANNUMBER
returnGeometry=true
```

**Derived Fields**:
- `nearest_force_main_diameter_in`
- `owner`
- `distance_ft`

**Buffer Distance**:
- 250 ft for small parcels
- 500 ft for large parcels (>5 acres)

**Unit**: Feet (converted to meters for visualization)

### 3.4 Environmental Layers

#### USFWS Wetlands (MapServer/0)
**Operation**: Intersection test within 50 ft buffer

#### EPA FRS / ECHO
**Operation**: Proximity filter radius 1 mi; derived count of regulated facilities

#### USDA SSURGO Soils
**Operation**: Direct polygon intersect with parcel footprint

#### Spatial Relations & Derived Fields

| Dataset          | Spatial Relation | Derived Fields                        |
|------------------|------------------|---------------------------------------|
| USFWS Wetlands   | Intersects       | wetlands_type                         |
| EPA FRS          | Within 1 mi      | epa_facility_count                    |
| USDA SSURGO      | Intersects       | soil_series, drainage_class           |

### 3.5 Transportation & Demographic Context

#### TxDOT AADT Traffic Counts (ArcGIS)

**Query**: Nearest line segment within 0.5 mi of centroid

```
geometry=<parcel centroid>&spatialRel=esriSpatialRelIntersects
```

**Derived**:
- `aadt_value`
- `segment_name`
- `distance_ft`

#### Census ACS / BLS QCEW

**Aggregation**: By buffer radius (1 mi, 3 mi, 5 mi)

**Derived**:
- Population density
- Median income
- Employment by NAICS sector

## 4. Buffer & Distance Calculations

| Use Case             | Geometry       | Buffer Distance | Unit | Method          |
|---------------------|----------------|-----------------|------|-----------------|
| Force Main proximity| Centroid       | 250–500         | ft   | Geodesic buffer |
| Stormwater assets   | Centroid       | 300             | ft   | Planar          |
| Wetlands            | Parcel polygon | 50              | ft   | Planar          |
| EPA facilities      | Centroid       | 1               | mi   | Geodesic        |
| TxDOT AADT          | Centroid       | 0.5             | mi   | Geodesic        |

**Note**: All distances normalized to feet for internal storage; converted to miles or meters for visualization.

## 5. Overlay Hierarchy & Precedence Rules

When multiple geometries intersect:

1. **Parcel Polygon** = primary spatial anchor
2. **Flood Zones** supersede utilities overlays in narrative weighting
3. **Utilities** take precedence in proximity-based metrics
4. **Environmental layers** (wetlands, EPA) aggregate as constraints
5. **If multiple county parcel matches occur**:
   - Choose feature with smallest centroid distance
   - If tie: prefer HCAD > FBCAD > Unified

## 6. Error Handling & Tie-Breaker Logic

| Scenario                      | Resolution Strategy                                           |
|------------------------------|---------------------------------------------------------------|
| No parcel found              | Fallback to nearest within 50 ft buffer                       |
| Multiple intersecting parcels| Rank by `ST_Distance(centroid, feature.centroid)` ascending   |
| API timeout                  | Retry ×3 exponential backoff; flag `data_flags`               |
| Empty geometry               | Substitute bounding box centroid; mark `geometry_flag: "approximate"` |

**Data Flags**:
- `zoning_missing`
- `nfhl_unavailable`
- `utilities_unknown`
- `wetlands_query_failed`
- `txdot_aadt_missing`

## 7. Map Visualization Parameters

| Layer           | Color (RGBA)          | Opacity | Z-Order | Symbol          |
|----------------|----------------------|---------|---------|-----------------|
| Parcel Boundary| [0, 120, 255, 255]   | 0.6     | 100     | Solid outline   |
| FEMA Flood (AE)| [255, 200, 0, 180]   | 0.4     | 200     | Polygon fill    |
| Force Mains    | [230, 76, 0, 255]    | 1.0     | 300     | 12px solid line |
| Stormwater     | [0, 168, 132, 255]   | 0.8     | 310     | Dashed line     |
| Wetlands       | [102, 153, 204, 200] | 0.5     | 350     | Crosshatch      |

## 8. Example Query Workflows

### 8.1 ArcGIS Parcel Intersection

```http
GET /FeatureServer/7/query?
  geometry=-95.37,29.76
  &geometryType=esriGeometryPoint
  &spatialRel=esriSpatialRelIntersects
  &outFields=OBJECTID,TAX_ID,OWNER,ACREAGE
  &returnGeometry=true
  &f=json
```

### 8.2 Force Main Proximity Query

```http
GET /MapServer/24/query?
  geometry=-95.37,29.76
  &geometryType=esriGeometryPoint
  &distance=250
  &units=esriSRUnit_Foot
  &spatialRel=esriSpatialRelIntersects
  &outFields=DIAMETER,OWNER,LENGTH
  &returnGeometry=true
```

### 8.3 OpenFEMA Data Refresh Check

```http
GET /api/open/v1/DataSets?
  $select=version,lastDataSetRefresh
  &$filter=name eq 'DisasterDeclarationsSummaries'
```

## 9. Compliance & Citation Handling

All FEMA datasets cited per OpenFEMA Terms of Use.

Each spatial overlay records:
- Dataset name, endpoint, query parameters, and `as_of` timestamp
- `lastDataSetRefresh` when available

### Example Citation Block (in Feasibility JSON)

```json
{
  "dataset": "OpenFEMA NFIP Multiple Loss Properties",
  "endpoint": "https://www.fema.gov/api/open/v1/NfipMultipleLossProperties",
  "query": "state eq 'TX' and intersects parcel centroid",
  "as_of": "2025-10-05T21:37Z",
  "lastDataSetRefresh": "2025-09-25T13:40Z"
}
```

## 10. Appendix — Spatial Query Examples

### Parcel + Flood Overlay Join (SQL)

```sql
SELECT 
  p.parcel_id, 
  f.zone, 
  f.bfe_ft
FROM parcels p
LEFT JOIN flood_zones f 
  ON ST_Intersects(p.geom, f.geom);
```

### Utility Buffer Join (Supabase/PostGIS)

```sql
SELECT 
  p.parcel_id, 
  u.type,
  ST_Distance(p.centroid, u.geom) AS distance_ft
FROM parcels p, utilities u
WHERE ST_DWithin(p.centroid, u.geom, 250)
ORDER BY distance_ft ASC;
```

### Environmental Multi-Join

```sql
SELECT 
  p.parcel_id, 
  w.wetland_type, 
  e.site_name
FROM parcels p
LEFT JOIN wetlands w 
  ON ST_Intersects(p.geom, w.geom)
LEFT JOIN epa_sites e 
  ON ST_DWithin(p.centroid, e.geom, 1609.34); -- 1 mile in meters
```

## Summary

This GIS logic ensures deterministic enrichment across all parcels in Texas. By applying unified coordinate normalization, consistent buffer distances, and standardized ArcGIS and OpenFEMA query contracts, BuildSmarter Feasibility guarantees reproducible, auditable, and lender-compliant geospatial analysis — forming the foundation for AI-generated feasibility intelligence.

## Implementation Guidelines

### Edge Function Integration

1. **Coordinate Transformation**: Always transform geometries to EPSG:4326 before storage
2. **Buffer Calculations**: Use appropriate buffer methods (geodesic vs planar) based on use case
3. **Error Recovery**: Implement retry logic with exponential backoff for all external API calls
4. **Caching**: Cache spatial query results for 30 days to reduce API costs
5. **Logging**: Log all spatial operations with timestamps and query parameters for audit trail
6. **Validation**: Validate all geometries before processing to prevent errors

### Database Storage

Store geospatial data in the following tables:
- `applications`: Main parcel data with normalized geometries (EPSG:4326)
- `enrichment_raw`: Raw API responses with original SRID metadata
- `feasibility_geospatial`: Computed spatial scores and relationships

### Map Rendering

Use the visualization parameters defined in Section 7 for consistent map rendering across:
- PDF reports
- Interactive web maps
- OData visualization endpoints
