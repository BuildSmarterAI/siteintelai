# BuildSmarter Feasibility - API Integrations

## Overview
This document maps each external API to the database fields it populates in the `applications` table.

## Google Geocoding API
- **Purpose**: Geocodes the input address to obtain latitude, longitude, and formatted address.
- **Endpoint**: `https://maps.googleapis.com/maps/api/geocode/json`
- **Database Fields Populated**:
    - `geo_lat`
    - `geo_lng`
    - `formatted_address`
    - `place_id`

## Harris County Appraisal District (HCAD) API
- **Purpose**: Retrieves property details such as owner, acreage, and market value.
- **Endpoint**: Internal ArcGIS FeatureServer
- **Database Fields Populated**:
    - `parcel_owner`
    - `acreage_cad`
    - `property_address`
    - `situs_address`

## Fort Bend County Appraisal District (FBCAD) API
- **Purpose**: Retrieves property details for properties located in Fort Bend County.
- **Endpoint**: Internal ArcGIS FeatureServer
- **Database Fields Populated**:
    - `parcel_owner`
    - `acreage_cad`
    - `property_address`
    - `situs_address`

## OpenFEMA API
- **Purpose**: Determines the flood zone and base flood elevation for a given location.
- **Endpoint**: `https://www.fema.gov/api/open/v1/FIRM_Flood_Hazard_Area`
- **Database Fields Populated**:
    - `floodplain_zone`
    - `base_flood_elevation`

## EPA Enforcement and Compliance History Online (ECHO) API
- **Purpose**: Retrieves environmental compliance records for nearby facilities.
- **Endpoint**: `https://echo.epa.gov/`
- **Database Fields Populated**:
    - `environmental_sites` (JSON array of site details)

## Texas Department of Transportation (TxDOT) API
- **Purpose**: Fetches traffic volume data (AADT) for the nearest road segment.
- **Endpoint**: Internal ArcGIS FeatureServer
- **Database Fields Populated**:
    - `traffic_aadt`
    - `traffic_year`
    - `traffic_segment_id`
    - `traffic_distance_ft`
    - `traffic_road_name`
    - `traffic_direction`
    - `traffic_map_url`

## US Fish and Wildlife Service (USFWS) Wetlands API
- **Purpose**: Identifies nearby wetlands.
- **Endpoint**: Internal ArcGIS FeatureServer
- **Database Fields Populated**:
    - `wetlands_type`

## USDA Soil Survey Geographic Database (SSURGO) API
- **Purpose**: Retrieves soil characteristics for the parcel.
- **Endpoint**: Internal ArcGIS FeatureServer
- **Database Fields Populated**:
    - `soil_series`
    - `soil_slope_percent`
    - `soil_drainage_class`

## City of Houston Utilities API
- **Purpose**: Determines the availability and capacity of water, sewer, and storm utilities.
- **Endpoints**: Internal ArcGIS FeatureServers
- **Database Fields Populated**:
    - `utility_access` (array of utility types available)
    - `water_lines` (JSON array of water line details)
    - `sewer_lines` (JSON array of sewer line details)
    - `storm_lines` (JSON array of storm line details)
    - `water_capacity_mgd`
    - `sewer_capacity_mgd`

## Census Bureau API
- **Purpose**: Retrieves demographic data for the area surrounding the parcel.
- **Endpoint**: `https://www.census.gov/data/developers/data-sets.html`
- **Database Fields Populated**:
    - `population_1mi`
    - `population_3mi`
    - `population_5mi`
    - `growth_rate_5yr`
    - `median_income`
    - `households_5mi`

## Bureau of Labor Statistics (BLS) API
- **Purpose**: Retrieves employment statistics for the area surrounding the parcel.
- **Endpoint**: `https://www.bls.gov/developers/`
- **Database Fields Populated**:
    - `employment_clusters` (JSON array of employment sector and job count)

## API Endpoint Configuration Table

| API Name                                  | Purpose                                                                 | Endpoint
