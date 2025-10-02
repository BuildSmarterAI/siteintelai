# BuildSmarter Feasibility - API Integrations

## Overview
This document maps each external API to the database fields it populates in the `applications` table.

---

## 🔹 1. Google Maps APIs

### Geocoding API
- **Endpoint**: `https://maps.googleapis.com/maps/api/geocode/json`
- **Purpose**: Convert user address to coordinates and location data
- **Populates**:
  - `geo_lat` - Latitude
  - `geo_lng` - Longitude
  - `formatted_address` - Google normalized address
  - `place_id` - Google Place ID
  - `city` - City name
  - `county` - County name
  - `administrative_area_level_1` - State code
  - `postal_code` - ZIP code
  - `neighborhood` - Neighborhood name
  - `sublocality` - Sublocality

### Places API (Optional)
- **Endpoint**: `https://maps.googleapis.com/maps/api/place/nearbysearch/json`
- **Purpose**: Find nearby highways and transit stops
- **Populates**:
  - `nearest_highway` - Nearest major highway
  - `distance_highway_ft` - Distance to highway in feet
  - `nearest_transit_stop` - Nearest public transit
  - `distance_transit_ft` - Distance to transit in feet

### Distance Matrix API (Optional)
- **Endpoint**: `https://maps.googleapis.com/maps/api/distancematrix/json`
- **Purpose**: Calculate drive time population sheds
- **Populates**:
  - `drive_time_15min_population` - Population within 15min drive
  - `drive_time_30min_population` - Population within 30min drive

---

## 🔹 2. County Parcel / CAD Data

### County-Specific ArcGIS Services
Each Texas county has its own CAD (Central Appraisal District) GIS service:

#### Harris County
- **Endpoint**: `https://maps.hcad.org/arcgis/rest/services/Parcels/MapServer/0/query`
- **Fields**: `ACCOUNT`, `OWNER`, `ACRES`

#### Fort Bend County
- **Endpoint**: `https://gisweb.fbcad.org/arcgis/rest/services/Hosted/FBCAD_Public_Data/FeatureServer/0/query`
- **Fallback**: `https://gisweb.fortbendcountytx.gov/arcgis/rest/services/General/Parcels/MapServer/0/query`
- **Fields**: `PARCEL_ID`, `OWNER_NAME`, `ACRES`

#### Dallas County
- **Endpoint**: `https://gisservices.dallasopendata.com/arcgis/rest/services/Parcels/MapServer/0/query`
- **Fields**: `PARCEL`, `OWNER`, `ACRES`

#### Galveston County
- **Endpoint**: `https://www1.cityofwebster.com/arcgis/rest/services/Landbase/CountyGalveston/MapServer/0/query`
- **Fields**: `PARCEL_ID`, `OWNER`, `ACRES`

*See `ENDPOINT_CATALOG` in code for full county list*

**Populates**:
- `parcel_id` - Parcel APN/ID
- `parcel_owner` - Legal owner name
- `acreage_cad` - Verified lot size
- `situs_address` - Legal situs address

---

## 🔹 3. City Zoning & Entitlements

### City-Specific ArcGIS Zoning Services

#### Houston
- **Endpoint**: `https://gis.houstontx.gov/arcgis/rest/services/Zoning/MapServer/0/query`
- **Fields**: `ZONING`, `OVERLAY_DISTRICT`

#### Dallas
- **Endpoint**: `https://gis.dallascityhall.com/arcgis/rest/services/Zoning/MapServer/0/query`
- **Fields**: `ZONE_CODE`, `OVERLAY`

#### Austin
- **Endpoint**: `https://data.austintexas.gov/resource/zoning.json`
- **Fields**: `ZONE`, `OVERLAY`

#### San Antonio
- **Endpoint**: `https://gis.sanantonio.gov/PDS/onestop/index.html`
- **Note**: Requires different API approach

**Populates**:
- `zoning_code` - Current zoning classification
- `overlay_district` - Special overlays (historic, airport, etc.)
- `entitlement_notes` - AI-generated notes on variances/risks

---

## 🔹 4. Floodplain & Elevation

### FEMA National Flood Hazard Layer (NFHL)
- **Endpoint**: `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query`
- **Purpose**: Flood zone classification
- **Populates**:
  - `floodplain_zone` - FEMA flood zone (AE, VE, X, etc.)
  - `base_flood_elevation` - BFE in feet

### USGS Elevation Point Query Service
- **Endpoint**: `https://nationalmap.gov/epqs/pqs.php`
- **Purpose**: Ground elevation
- **Populates**:
  - `elevation` - Ground elevation in feet

---

## 🔹 5. Environmental Data

### USFWS Wetlands Mapper
- **Endpoint**: `https://www.fws.gov/wetlands/arcgis/rest/services/Wetlands/MapServer/0/query`
- **Purpose**: Wetland identification
- **Populates**:
  - `wetlands_type` - Type of wetland if present

### USDA NRCS SSURGO Soils
- **Endpoint**: `https://sdmdataaccess.nrcs.usda.gov/Tabular/post.rest`
- **Purpose**: Soil properties
- **Populates**:
  - `soil_series` - Soil map unit name
  - `soil_slope_percent` - Slope percentage
  - `soil_drainage_class` - Drainage classification

### EPA Facility Registry Service (FRS)
- **Endpoint**: `https://enviro.epa.gov/frs/frs_rest_services`
- **Purpose**: Known contaminated sites
- **Populates**:
  - `environmental_sites` - JSONB array of EPA sites
    ```json
    [
      {
        "site_name": "Site Name",
        "program": "RCRA",
        "status": "Active"
      }
    ]
    ```

### NOAA Storm Events Database
- **Endpoint**: `https://www.ncdc.noaa.gov/stormevents/csv`
- **Purpose**: Historical flood events
- **Populates**:
  - `historical_flood_events` - Count of past flood events

---

## 🔹 6. Utilities & Infrastructure

### City GIS / Public Works (Varies by City)
Examples:
- Houston Water GIS: Water/sewer line layers
- Austin Water GIS: Utility layers
- **Pattern**: `/arcgis/rest/services/Utilities/Water/MapServer/0/query`

**Populates**:
- `water_lines` - JSONB array
  ```json
  [
    {
      "diameter": "12\"",
      "distance_ft": 250,
      "status": "Active"
    }
  ]
  ```
- `sewer_lines` - JSONB array (same structure)
- `storm_lines` - JSONB array (same structure)
- `water_capacity_mgd` - Water capacity in MGD
- `sewer_capacity_mgd` - Sewer capacity in MGD
- `power_kv_nearby` - Power line voltage

### FCC Broadband Map API
- **Endpoint**: `https://broadbandmap.fcc.gov/api/nationwide`
- **Purpose**: Internet service availability
- **Populates**:
  - `fiber_available` - Boolean for fiber availability
  - `broadband_providers` - JSONB array of providers
    ```json
    [
      {
        "provider": "AT&T",
        "technology": "Fiber",
        "max_download": 1000,
        "max_upload": 1000
      }
    ]
    ```

---

## 🔹 7. Traffic & Mobility

### TxDOT AADT Traffic Counts REST API
- **Endpoint**: `https://gis-txdot.opendata.arcgis.com/datasets/txdot::aadt-traffic-counts/api`
- **Purpose**: Traffic volume data
- **Populates**:
  - `traffic_aadt` - Annual Average Daily Traffic count
  - `traffic_year` - Year of traffic count
  - `traffic_segment_id` - TxDOT segment ID
  - `traffic_distance_ft` - Distance to traffic station
  - `traffic_road_name` - Road segment name
  - `traffic_direction` - Traffic direction measured
  - `traffic_map_url` - Link to TxDOT map

---

## 🔹 8. Demographics & Market Data

### U.S. Census ACS API
- **Endpoint**: `https://api.census.gov/data/2022/acs/acs5`
- **Variables**:
  - `B01003_001E` - Total population
  - `B19013_001E` - Median household income
  - `B25001_001E` - Total housing units
  - `B11001_001E` - Total households
- **Populates**:
  - `population_1mi` - Population within 1 mile
  - `population_3mi` - Population within 3 miles
  - `population_5mi` - Population within 5 miles
  - `median_income` - Median household income
  - `households_5mi` - Households within 5 miles
  - `growth_rate_5yr` - 5-year population growth rate

### BLS QCEW API (Quarterly Census of Employment & Wages)
- **Endpoint**: `https://api.bls.gov/publicAPI/v2/timeseries/data/`
- **Purpose**: Employment by sector
- **Populates**:
  - `employment_clusters` - JSONB array
    ```json
    [
      {
        "sector": "Healthcare",
        "jobs": 15000
      },
      {
        "sector": "Technology",
        "jobs": 8500
      }
    ]
    ```

---

## 🔹 9. Financial & Incentive Zones

### County CAD Tax APIs
- **Purpose**: Property tax rates
- **Varies by county**: Harris CAD, Travis CAD, etc.
- **Populates**:
  - `tax_rate_total` - Total tax rate as decimal
  - `taxing_jurisdictions` - JSONB array of taxing entities
    ```json
    [
      "City of Houston",
      "Houston ISD",
      "Harris County"
    ]
    ```

### US Treasury Opportunity Zones
- **Endpoint**: `https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/Opportunity_Zones/FeatureServer/0/query`
- **Purpose**: Federal tax incentive zones
- **Populates**:
  - `opportunity_zone` - Boolean

### Texas Enterprise Zones (TDED)
- **Source**: Texas Economic Development Office shapefiles
- **Purpose**: State enterprise zone eligibility
- **Populates**:
  - `enterprise_zone` - Boolean

### US Foreign Trade Zones Board
- **Source**: FTZ Board shapefiles
- **Purpose**: Foreign trade zone eligibility
- **Populates**:
  - `foreign_trade_zone` - Boolean

### City Permitting Data
- **Examples**: Austin, Dallas, Houston permit datasets
- **Purpose**: Average permitting timelines
- **Populates**:
  - `average_permit_time_months` - Average months for permits

---

## 🔹 10. AI-Generated Outputs

All AI outputs are generated using **Lovable AI** (Google Gemini models) based on the enriched data:

- `executive_summary_output` - 1-2 page executive summary
- `property_overview_output` - Site attributes narrative
- `zoning_output` - Zoning analysis in plain English
- `utilities_output` - Infrastructure adequacy narrative
- `market_output` - Demographics & economic drivers
- `costs_output` - Early cost benchmarking
- `schedule_output` - Permitting & schedule risks
- `highest_best_use_output` - HBU recommendation
- `traffic_output` - Traffic & mobility interpretation
- `conclusion_output` - Go/no-go recommendation

---

## Implementation Notes

### Error Handling
All API calls include try/catch blocks and populate `data_flags` array with any failures:
- `geocoding_failed`
- `parcel_not_found`
- `zoning_not_available`
- `fema_not_found`
- `traffic_data_not_found`
- `demographics_not_found`

### Rate Limiting
- Google APIs: Subject to daily quota limits
- Census API: No key required, generous limits
- County GIS: Usually unlimited for public access
- TxDOT: Public dataset, no rate limits

### Caching Strategy
Consider implementing caching for:
- Parcel data (rarely changes)
- Zoning data (changes infrequently)
- Demographics (annual updates)
- Traffic counts (annual updates)

Do NOT cache:
- Real-time utility availability
- Broadband providers
- Environmental site status

---

## Testing Resources

### API Documentation
Import `buildsmarter_feasibility_openapi.yaml` into:
- **Postman**: File → Import → OpenAPI 3.0
- **Insomnia**: Application → Import → OpenAPI 3.0
- **Swagger UI**: Paste YAML into online editor

### Sample Requests
See edge function logs for example API requests and responses.

### Test Addresses
- **Harris County**: `1200 McKinney St, Houston, TX 77010`
- **Fort Bend County**: `4150 Bluebonnet Dr, Stafford, TX 77477`
- **Dallas County**: `1500 Marilla St, Dallas, TX 75201`
- **Travis County**: `301 W 2nd St, Austin, TX 78701`
