# BuildSmarter™ Feasibility — GIS & Spatial Analysis Logic Document

## 🔄 Houston GIS Endpoint Migration (January 2025)

**IMPORTANT:** City of Houston utility endpoints have migrated from legacy test servers to production infrastructure:\\

- **Water:** No direct API available. Using TCEQ Water Service Area polygons as proxy for service provider identification.
- **Sewer:** Migrated to ArcGIS Online feature services (`services.arcgis.com/04HiymDgLlsbhaV4/...`)
- **Storm:** Moved to production `mapsop1.houstontx.gov` server (Layer 7)
- **Traffic:** New integration with City of Houston Traffic Counts layer

All queries now use production endpoints with quarterly validation. See `API_INTEGRATIONS.md` for complete migration details.

---

## 1. Overview

This document outlines the GIS (Geographic Information System) and spatial analysis logic used within the BuildSmarter™ Feasibility platform. It details how spatial data is processed, analyzed, and integrated to generate feasibility insights.

### Key Concepts

- **Spatial Data**: Geographic data represented as points, lines, polygons, or rasters.
- **Spatial Analysis**: Techniques used to analyze spatial data, such as proximity analysis, overlay analysis, and spatial statistics.
- **GIS Software**: Software used to create, manage, analyze, and visualize spatial data (e.g., ArcGIS, QGIS).
- **Geospatial Libraries**: Programming libraries used to perform spatial operations (e.g., GeoPandas, Shapely).

## 2. Data Sources

BuildSmarter™ Feasibility integrates data from various sources, including:

- **Authoritative Parcel Data**: County Appraisal Districts (CAD) such as HCAD (Harris County) and FBCAD (Fort Bend County).
- **Floodplain Data**: FEMA National Flood Hazard Layer (NFHL) and local floodplain maps.
- **Utility Data**: City of Houston utility datasets (water, sewer, storm).
- **Traffic Data**: TxDOT Average Annual Daily Traffic (AADT) data.
- **Environmental Data**: EPA Facility Registry System (FRS) and USFWS Wetlands data.
- **Demographic Data**: US Census Bureau American Community Survey (ACS) data.

### Data Acquisition

- **APIs**: Direct API calls to ArcGIS Feature Servers and Map Servers.
- **File Downloads**: Downloading shapefiles, GeoJSON files, and other spatial data formats.
- **Database Connections**: Connecting to spatial databases (e.g., PostGIS) to retrieve data.

## 3. Spatial Analysis Techniques

BuildSmarter™ Feasibility employs several spatial analysis techniques to derive insights:

### 3.1 Proximity Analysis

- **Definition**: Determining the distance between two or more spatial features.
- **Use Case**: Identifying the distance from a parcel to the nearest utility line, traffic segment, or environmental site.
- **Implementation**: Using geospatial libraries to calculate distances between geometries.

### 3.2 Overlay Analysis

- **Definition**: Combining two or more spatial datasets to create a new dataset.
- **Use Case**: Determining if a parcel is located within a floodplain zone or overlay district.
- **Implementation**: Using spatial overlay operations (e.g., intersection, union) to combine datasets.

### 3.3 Spatial Statistics

- **Definition**: Analyzing spatial patterns and relationships using statistical methods.
- **Use Case**: Identifying clusters of environmental sites or areas with high traffic volume.
- **Implementation**: Using spatial statistics tools to analyze spatial distributions and correlations.

### 3.4 Geocoding

- **Definition**: Converting addresses into geographic coordinates (latitude and longitude).
- **Use Case**: Locating parcels on a map based on their address.
- **Implementation**: Using geocoding services (e.g., Google Geocoding API) to convert addresses into coordinates.

### 3.5 Reverse Geocoding

- **Definition**: Converting geographic coordinates into addresses.
- **Use Case**: Identifying the address of a parcel based on its coordinates.
- **Implementation**: Using reverse geocoding services to convert coordinates into addresses.

## 4. GIS Workflows

BuildSmarter™ Feasibility follows specific GIS workflows to process and analyze spatial data:

### 4.1 Parcel Identification

1. **Input**: Property address or coordinates.
2. **Process**:
   - Geocode the address to obtain coordinates.
   - Perform a spatial query to identify the parcel that intersects the coordinates.
   - Retrieve parcel attributes from the CAD database.
3. **Output**: Parcel ID, geometry, and attributes.

### 4.2 Floodplain Analysis

1. **Input**: Parcel geometry.
2. **Process**:
   - Perform a spatial overlay to determine if the parcel intersects a floodplain zone.
   - Retrieve floodplain attributes (e.g., zone code, base flood elevation) from the FEMA NFHL.
3. **Output**: Floodplain zone, base flood elevation, and flood risk assessment.

### 4.3 Utility Analysis

1. **Input**: Parcel geometry.
2. **Process**:
   - Perform proximity analysis to identify nearby utility lines (water, sewer, storm).
   - Retrieve utility attributes (e.g., diameter, material, capacity) from the city utility datasets.
3. **Output**: Utility access, line diameters, and capacity information.

### 4.4 Traffic Analysis

1. **Input**: Parcel geometry.
2. **Process**:
   - Perform proximity analysis to identify the nearest traffic segment.
   - Retrieve traffic attributes (e.g., AADT, road name, segment ID) from the TxDOT AADT data.
3. **Output**: Traffic volume, road name, and distance to the nearest segment.

### 4.5 Environmental Analysis

1. **Input**: Parcel geometry.
2. **Process**:
   - Perform a spatial overlay to identify environmental sites (e.g., EPA FRS sites, USFWS Wetlands) that intersect the parcel.
   - Retrieve environmental site attributes (e.g., site name, program, status) from the EPA FRS and USFWS Wetlands data.
3. **Output**: List of environmental sites and their attributes.

## 5. Spatial Data Storage

BuildSmarter™ Feasibility stores spatial data in a relational database with PostGIS extension:

- **Geometry Storage**: Using PostGIS geometry data types to store spatial features.
- **Spatial Indexes**: Creating spatial indexes to optimize spatial queries.
- **Metadata**: Storing metadata about spatial datasets, such as source, update frequency, and data quality.

## 6. Quality Control

To ensure the accuracy and reliability of spatial data, BuildSmarter™ Feasibility implements the following quality control measures:

- **Data Validation**: Validating spatial data against predefined rules and constraints.
- **Topology Checks**: Performing topology checks to identify and correct errors in spatial data.
- **Visual Inspection**: Visually inspecting spatial data to identify any anomalies or inconsistencies.
- **Regular Updates**: Regularly updating spatial data to reflect the latest changes and updates.

## 7. Technology Stack

BuildSmarter™ Feasibility utilizes the following technology stack for GIS and spatial analysis:

- **GIS Software**: ArcGIS Pro, QGIS
- **Geospatial Libraries**: GeoPandas, Shapely, Pyproj
- **Database**: PostgreSQL with PostGIS extension
- **Programming Languages**: Python, JavaScript
- **Web Mapping Libraries**: Leaflet, Mapbox GL JS

## 8. Future Enhancements

- **3D Spatial Analysis**: Incorporating 3D spatial analysis techniques to analyze vertical aspects of parcels and their surroundings.
- **Real-time Spatial Data**: Integrating real-time spatial data feeds, such as traffic cameras and weather sensors.
- **Advanced Spatial Statistics**: Implementing advanced spatial statistics methods to identify spatial patterns and trends.
- **Machine Learning**: Applying machine learning algorithms to spatial data to predict future feasibility outcomes.

---

*Document Version 1.0 — Last Updated: November 2024*
*For questions, contact the BuildSmarter™ GIS Architecture Team*
