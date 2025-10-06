# BuildSmarter Feasibility - Changelog

All notable changes to API endpoints and enrichment logic are documented here.

---

## [v1.3.0] - 2025-10-06

### 🔧 Fixed
- **FEMA NFHL Endpoint**: Switched from deprecated Layer 28 to Layer 0 (`/MapServer/0/query`)
  - Added exponential backoff retry logic (3 attempts: 500ms → 1000ms → 2000ms)
  - Added `api_meta.fema_nfhl` tracking with status code, layer index, and record count
  
- **Harris County Parcels**: Implemented EPSG:2278 coordinate transformation
  - Added `proj4` library for WGS84 → Texas South Central Feet conversion
  - Added 50ft buffer to parcel query to account for coordinate precision
  - Updated endpoint to official HCAD service: `https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0/query`
  
- **EPA Environmental Sites**: Replaced deprecated FRS endpoint with EFService
  - New endpoint: `https://enviro.epa.gov/efservice/FRS_INTEREST/latitude/{lat}/longitude/{lng}/JSON`
  - Direct lat/lng query instead of county-based search
  
- **FCC Broadband API**: Added HTTP/1.1 fallback
  - Added `Connection: keep-alive` header to force HTTP/1.1
  - Prevents HTTP/2 stream errors in Supabase edge runtime
  
- **TxDOT Traffic Counts**: Expanded urban search radius
  - Increased from 2500ft to 3000ft for major urban cores
  - Reduces `traffic_not_found` flags in dense urban areas

### 🆕 Added
- **OpenFEMA Disaster Declarations API**: New data source for historical flood context
  - Endpoint: `https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries`
  - Aggregates flood events by type with latest declaration dates
  - Populates `historical_flood_events` with actual disaster data (replacing zone-based estimation)
  - Adds `api_meta.openfema_disasters` with event counts and latency tracking

- **Observability Columns**: Added metadata tracking to `applications` table
  - `api_meta` (JSONB): Stores per-API response status, record counts, and latency
  - `enrichment_status` (TEXT): Overall completion status (`complete`, `partial`, `failed`)
  
- **Standardized Error Flags**: Unified error flag naming convention
  - `fema_nfhl_unavailable` - FEMA endpoint failed after retries
  - `utilities_api_unreachable` - DNS resolution failure (Houston GIS)
  - `openfema_no_match` - No disaster declarations found
  - `parcel_projection_error` - Coordinate transformation failure
  - `parcel_not_found` - No parcel features returned
  - `floodplain_missing` - No FEMA flood zone data
  - `utilities_not_found` - No utility line data
  - `traffic_not_found` - No TxDOT counts within radius

### 📝 Documentation
- Updated `API_INTEGRATIONS.md` with new endpoints and projection notes
- Added `endpoint_catalog.json` versioning (v1.3.0)
- Created `CHANGELOG.md` for tracking API changes

### ⚠️ Known Issues
- **Houston Utilities DNS**: `cohgis.houstontx.gov` fails to resolve from Supabase edge runtime
  - **Workaround Options**:
    1. Deploy external proxy (Cloudflare Worker or Vercel Edge)
    2. Contact Houston GIS to update DNS configuration
    3. Use alternative Houston utility data sources
  - **Impact**: All Houston utility queries fail with `utilities_api_unreachable` flag

---

## [v1.2.0] - 2025-09-15

### 🔧 Fixed
- Improved error handling for flaky FEMA API responses
- Added fallback elevation sources (Google → Open-Elevation → USGS)

### 🆕 Added
- Support for Fort Bend, Galveston, Montgomery County parcels
- Census ACS demographic data integration
- Google Places API for mobility data (highways, transit)

---

## [v1.1.0] - 2025-08-01

### 🆕 Added
- Initial county parcel data integration (Harris, Dallas, Travis)
- FEMA NFHL flood zone queries
- Basic utility line queries for major Texas cities

---

## [v1.0.0] - 2025-07-01

### 🎉 Initial Release
- Core enrichment pipeline with geocoding
- Address normalization via Google Geocoding API
- Basic database schema for applications table