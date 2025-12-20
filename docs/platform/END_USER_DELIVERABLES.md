# SiteIntel™ Feasibility — End-User Deliverables

> **Version**: 1.0 | **Last Updated**: December 2025  
> Complete reference for what SiteIntel™ Feasibility delivers to developers, investors, and lenders.

---

## Executive Summary

SiteIntel™ Feasibility transforms commercial real estate due diligence from a $10K+ / 3-week consultant process into a **$795 / 10-minute AI-powered intelligence report**. Every report is lender-ready, citation-backed, and verified against 8+ authoritative data sources.

### Core Value Proposition

| Traditional Consultant | SiteIntel™ Feasibility |
|------------------------|------------------------|
| $10,000 – $25,000 | $795 per report |
| 2–4 weeks delivery | < 10 minutes |
| Manual data collection | 8+ automated API sources |
| PDF via email | Interactive dashboard + PDF |
| Static snapshots | Real-time data refresh |
| No audit trail | Full citation provenance |

---

## Report Deliverables Overview

### 1. Feasibility Score & Verdict

**The centerpiece of every report** — a proprietary 0–100 score with actionable verdict.

| Score Range | Band | Verdict | Recommendation |
|-------------|------|---------|----------------|
| 80–100 | A | Excellent | Proceed with confidence |
| 65–79 | B | Good | Proceed with due diligence |
| 50–64 | C | Fair | Proceed with caution |
| 35–49 | D | Poor | Significant concerns |
| 0–34 | F | Critical | Not recommended |

**Score Components**:
- Zoning Compatibility (20%)
- Flood Risk Assessment (20%)
- Infrastructure Availability (15%)
- Market Demographics (15%)
- Environmental Constraints (15%)
- Traffic & Accessibility (15%)

**Kill Factor Detection**: Automatic identification of deal-breaking issues that could halt development:
- 100-year floodplain (Zone AE/VE)
- Wetlands coverage > 25%
- EPA Superfund proximity
- Zoning incompatibility
- No utility access

---

### 2. Property Information

**Parcel Data** (sourced from County CAD records):

| Field | Description | Source |
|-------|-------------|--------|
| `parcel_id` | County assessor parcel number | HCAD/FBCAD/MCAD |
| `parcel_owner` | Current owner of record | County CAD |
| `acreage_cad` | Parcel acreage from CAD | County CAD |
| `situs_address` | Property street address | County CAD |
| `legal_dscr_1–4` | Legal description | County CAD |
| `subdivision` | Subdivision name | County CAD |
| `lot` / `block` | Lot and block numbers | County CAD |

**Coordinates & Geography**:

| Field | Description | Format |
|-------|-------------|--------|
| `geo_lat` | Latitude | WGS84 decimal degrees |
| `geo_lng` | Longitude | WGS84 decimal degrees |
| `formatted_address` | Full geocoded address | Google Places |
| `city` | City name | Google Places |
| `county` | County name | Google Places |
| `postal_code` | ZIP code | Google Places |

---

### 3. Valuation & Tax Data

**Appraisal Values** (updated bi-weekly for Harris, annually for Fort Bend):

| Field | Description | Source |
|-------|-------------|--------|
| `land_val` | Land value only | County CAD |
| `imprv_val` | Improvement value | County CAD |
| `tot_market_val` | Total market value | County CAD |
| `tot_appr_val` | Total appraised value | County CAD |
| `taxable_value` | Taxable value after exemptions | County CAD |

**Tax Information**:

| Field | Description | Source |
|-------|-------------|--------|
| `tax_rate_total` | Combined tax rate (%) | County CAD |
| `taxing_jurisdictions` | Array of taxing entities | County CAD |
| `homestead` | Homestead exemption flag | County CAD |
| `ag_use` | Agricultural use flag | County CAD |
| `exemption_code` | Exemption type code | County CAD |

---

### 4. Zoning & Entitlements

**Zoning Analysis**:

| Field | Description | Source |
|-------|-------------|--------|
| `zoning_code` | Current zoning designation | City/County GIS |
| `land_use_code` | Land use classification | County CAD |
| `land_use_description` | Human-readable land use | County CAD |
| `overlay_district` | Overlay zone if applicable | City GIS |
| `etj_provider` | ETJ jurisdiction | County GIS |
| `governing_path` | Jurisdiction hierarchy | Buildability Engine |

**AI-Generated Zoning Output** (`zoning_output`):
- Permitted uses analysis
- Conditional use requirements
- Setback requirements
- Height/FAR limitations
- Parking requirements
- Variance recommendations

**Development Controls** (from Buildability Engine):

| Field | Description |
|-------|-------------|
| `max_buildable_sf` | Maximum buildable square footage |
| `net_buildable_area_sf` | Net buildable after setbacks |
| `derived_max_far` | Maximum floor area ratio |
| `derived_max_height` | Maximum building height |

---

### 5. Flood Risk Assessment

**FEMA Flood Data**:

| Field | Description | Source |
|-------|-------------|--------|
| `floodplain_zone` | FEMA flood zone (X, AE, VE, etc.) | FEMA NFHL |
| `base_flood_elevation` | BFE in feet NAVD88 | FEMA NFHL |
| `fema_firm_panel` | FIRM panel number | FEMA NFHL |
| `fema_panel_id` | Panel effective date | FEMA NFHL |

**NFIP Claims & History** (OpenFEMA API):

| Field | Description | Source |
|-------|-------------|--------|
| `nfip_claims_count` | Number of claims in county | OpenFEMA v2 |
| `nfip_claims_total_paid` | Total claims paid ($) | OpenFEMA v2 |
| `disaster_declarations` | Federal disaster history | OpenFEMA v2 |
| `historical_flood_events` | Array of flood events | OpenFEMA v2 |

**Flood Zone Risk Matrix**:

| Zone | Risk Level | Insurance Required | Score Impact |
|------|------------|-------------------|--------------|
| X | Minimal | No | +10 |
| X500 | Moderate | No | 0 |
| AE | High | Yes | -15 |
| AO | High | Yes | -15 |
| VE | Very High | Yes | -25 |

---

### 6. Environmental Analysis

**Wetlands Data** (USFWS National Wetlands Inventory):

| Field | Description | Source |
|-------|-------------|--------|
| `wetlands_type` | Cowardin classification | USFWS NWI |
| `wetlands_area_pct` | Percent of parcel in wetlands | Calculated |

**EPA Facility Proximity** (1-mile radius):

| Field | Description | Source |
|-------|-------------|--------|
| `epa_facilities_count` | Regulated facilities nearby | EPA ECHO |
| `nearest_facility_dist` | Distance to nearest (miles) | EPA ECHO |
| `nearest_facility_type` | Facility program type | EPA ECHO |
| `environmental_sites` | Array of site details | EPA ECHO |
| `environmental_constraints` | Array of constraint types | Calculated |

**Soil & Topography**:

| Field | Description | Source |
|-------|-------------|--------|
| `elevation` | Site elevation (feet) | USGS NED |
| `soil_series` | Soil series name | USDA NRCS |
| `soil_drainage_class` | Drainage classification | USDA NRCS |
| `soil_slope_percent` | Average slope (%) | USDA NRCS |

---

### 7. Utilities & Infrastructure

**Water Infrastructure**:

| Field | Description | Source |
|-------|-------------|--------|
| `water_lines` | GeoJSON of nearby water mains | City GIS |
| `water_capacity_mgd` | Available capacity (MGD) | Utility Provider |
| `mud_district` | MUD district name | County GIS |
| `wcid_district` | WCID district name | County GIS |

**Sewer Infrastructure**:

| Field | Description | Source |
|-------|-------------|--------|
| `sewer_lines` | GeoJSON of sewer mains | City GIS |
| `sewer_capacity_mgd` | Available capacity (MGD) | Utility Provider |

**Storm Drainage**:

| Field | Description | Source |
|-------|-------------|--------|
| `storm_lines` | GeoJSON of storm drains | City GIS |

**Utility Access Summary**:

| Field | Description |
|-------|-------------|
| `utility_access` | Array of available utilities |
| `utilities_summary` | JSON summary object |
| `fiber_available` | Fiber internet available |
| `power_kv_nearby` | Nearest power line voltage |
| `broadband_providers` | Array of ISP coverage |

**AI-Generated Utilities Output** (`utilities_output`):
- Connection feasibility assessment
- Estimated tap fees
- Capacity constraints
- Recommended utility contacts

---

### 8. Traffic & Accessibility

**TxDOT Traffic Data**:

| Field | Description | Source |
|-------|-------------|--------|
| `traffic_aadt` | Annual average daily traffic | TxDOT |
| `traffic_road_name` | Road name for AADT | TxDOT |
| `traffic_year` | AADT measurement year | TxDOT |
| `traffic_direction` | Traffic direction | TxDOT |
| `traffic_distance_ft` | Distance to count point | Calculated |
| `peak_hour_volume` | Peak hour traffic volume | TxDOT |
| `truck_percent` | Truck traffic percentage | TxDOT |
| `congestion_level` | Congestion rating | Calculated |

**Proximity Analysis**:

| Field | Description | Source |
|-------|-------------|--------|
| `distance_highway_ft` | Distance to nearest highway | Calculated |
| `distance_transit_ft` | Distance to transit stop | Calculated |
| `nearest_highway` | Highway name | TxDOT |
| `nearest_transit_stop` | Transit stop name | Metro |
| `nearest_signal_distance_ft` | Distance to traffic signal | City GIS |
| `road_classification` | Functional classification | TxDOT |

**AI-Generated Traffic Output** (`traffic_output`):
- Traffic impact assessment
- Access point recommendations
- Visibility analysis
- Peak hour considerations

---

### 9. Market Demographics

**83+ ACS Variables** from Census Bureau American Community Survey (5-year estimates):

#### Population & Households

| Field | Description |
|-------|-------------|
| `population_1mi` | Population within 1 mile |
| `population_3mi` | Population within 3 miles |
| `population_5mi` | Population within 5 miles |
| `population_block_group` | Block group population |
| `population_density_sqmi` | People per square mile |
| `households_5mi` | Households within 5 miles |
| `total_housing_units` | Total housing units |
| `avg_household_size` | Average household size |

#### Income & Economics

| Field | Description |
|-------|-------------|
| `median_income` | Median household income |
| `mean_household_income` | Mean household income |
| `per_capita_income` | Per capita income |
| `poverty_rate` | Poverty rate (%) |
| `unemployment_rate` | Unemployment rate (%) |
| `gini_index` | Income inequality index |

#### Age Distribution

| Field | Description |
|-------|-------------|
| `median_age` | Median age |
| `under_18_pct` | Under 18 percentage |
| `working_age_pct` | Working age (18-64) % |
| `over_65_pct` | Over 65 percentage |

#### Education

| Field | Description |
|-------|-------------|
| `high_school_only_pct` | High school only % |
| `some_college_pct` | Some college % |
| `bachelors_pct` | Bachelor's degree % |
| `graduate_degree_pct` | Graduate degree % |
| `college_attainment_pct` | Total college % |

#### Housing

| Field | Description |
|-------|-------------|
| `median_home_value` | Median home value |
| `median_rent` | Median gross rent |
| `owner_occupied_pct` | Owner-occupied % |
| `renter_occupied_pct` | Renter-occupied % |
| `vacancy_rate` | Housing vacancy rate |
| `single_family_pct` | Single-family % |
| `multi_family_pct` | Multi-family % |
| `median_year_built` | Median year built |

#### Commute & Transportation

| Field | Description |
|-------|-------------|
| `mean_commute_time_min` | Mean commute (minutes) |
| `drive_alone_pct` | Drive alone % |
| `public_transit_pct` | Public transit % |
| `walk_bike_pct` | Walk/bike % |
| `work_from_home_pct` | Work from home % |

#### Race & Ethnicity

| Field | Description |
|-------|-------------|
| `white_pct` | White percentage |
| `black_pct` | Black percentage |
| `asian_pct` | Asian percentage |
| `hispanic_pct` | Hispanic percentage |

#### Workforce

| Field | Description |
|-------|-------------|
| `labor_force` | Total labor force |
| `white_collar_pct` | White collar % |
| `blue_collar_pct` | Blue collar % |
| `service_sector_pct` | Service sector % |
| `top_industries` | Top 5 industries JSON |
| `daytime_population_estimate` | Daytime population |

---

### 10. Proprietary CRE Indices

**6 Unique Indices** — exclusive to SiteIntel™, computed from Census Data Moat:

#### 1. Growth Potential Index (GPI)
```
GPI = (population_cagr × 0.3) + (income_growth × 0.25) + 
      (permit_activity × 0.25) + (infrastructure_investment × 0.2)
```
**Range**: 0–100 | **Interpretation**: Higher = stronger growth trajectory

#### 2. Affluence Concentration Score
```
ACS = (median_income / state_median) × (home_value_index) × 
      (education_attainment_factor)
```
**Range**: 0–200 | **Interpretation**: 100 = state average

#### 3. Labor Pool Depth Index
```
LPDI = (labor_force_size × 0.4) + (education_mix × 0.3) + 
       (commute_accessibility × 0.3)
```
**Range**: 0–100 | **Interpretation**: Higher = deeper talent pool

#### 4. Retail Spending Index
```
RSI = (disposable_income × 0.4) + (population_density × 0.3) + 
      (retail_leakage_factor × 0.3)
```
**Range**: 0–150 | **Interpretation**: 100 = market equilibrium

#### 5. Workforce Availability Score
```
WAS = (unemployment_rate × 0.3) + (labor_force_participation × 0.3) + 
      (commute_shed_population × 0.4)
```
**Range**: 0–100 | **Interpretation**: Higher = more available workers

#### 6. Market Outlook Rating
```
Categories: "Strong Growth" | "Moderate Growth" | "Stable" | 
           "Cautious" | "Declining"
```
**Based on**: 5-year projections for income, population, home values

---

### 11. Tax & Jurisdiction Analysis

**Taxing Jurisdictions** (`taxing_jurisdictions` JSON):
- County
- City
- School District (ISD)
- Community College
- Hospital District
- MUD/WCID (if applicable)
- Emergency Services District

**Special Districts & Incentives**:

| Field | Description |
|-------|-------------|
| `opportunity_zone` | Federal Opportunity Zone flag |
| `enterprise_zone` | State enterprise zone flag |
| `foreign_trade_zone` | FTZ designation |
| `average_permit_time_months` | Typical permit timeline |

---

### 12. Cost & Schedule Intelligence

**AI-Generated Outputs**:

| Output Field | Content |
|--------------|---------|
| `costs_output` | Development cost estimates |
| `schedule_output` | Project timeline projections |
| `highest_best_use_output` | Optimal use recommendations |
| `conclusion_output` | Final recommendations |

**Cost Categories Analyzed**:
- Land acquisition
- Site preparation
- Vertical construction
- Soft costs
- Financing costs
- Contingency

**Schedule Milestones**:
- Due diligence period
- Entitlement timeline
- Permitting duration
- Construction phases
- Stabilization period

---

## Interactive Decision Map

### Map Features

| Feature | Description |
|---------|-------------|
| **Basemap Options** | Streets, Satellite, Hybrid, Terrain |
| **Zoom Controls** | Mouse wheel, pinch, +/- buttons |
| **Pan/Rotate** | Click-drag, two-finger rotate |
| **Measure Tools** | Distance, area measurement |
| **Drawing Tools** | Custom parcel drawing |
| **Layer Toggle** | Individual layer visibility |
| **Legend** | Dynamic layer legend |

### Map Layer Presets

| Preset | Layers Included | Use Case |
|--------|-----------------|----------|
| **Decision Mode** | Parcel + Flood + Utilities | Quick feasibility check |
| **Lender Risk** | Flood + Wetlands + EPA Sites | Risk assessment |
| **Infrastructure** | All utility layers | Utility planning |
| **Environmental** | Wetlands + EPA + Flood | Environmental review |
| **Market Context** | Demographics + Traffic | Market analysis |
| **Full Analysis** | All available layers | Comprehensive view |

### Layer Categories

#### Parcel Layers
| Layer | Color | Source |
|-------|-------|--------|
| Subject Parcel | `#FF7A00` (orange) | County CAD |
| Adjacent Parcels | `#64748B` (slate) | County CAD |
| Drawn Parcels | `#8B5CF6` (violet) | User-created |

#### Utility Layers
| Layer | Color | Source |
|-------|-------|--------|
| Water Mains | `#1F6AE1` (blue) | City GIS |
| Sewer Lines | `#7A4A2E` (brown) | City GIS |
| Storm Drains | `#1C7C7C` (teal) | City GIS |
| Force Mains | `#9333EA` (purple) | City GIS |

#### Flood Layers
| Layer | Color | Source |
|-------|-------|--------|
| Zone AE (100-yr) | `#EF4444` (red) | FEMA NFHL |
| Zone VE (Coastal) | `#DC2626` (dark red) | FEMA NFHL |
| Zone X500 (500-yr) | `#F59E0B` (amber) | FEMA NFHL |
| Zone X (Minimal) | `#22C55E` (green) | FEMA NFHL |

#### Environmental Layers
| Layer | Color | Source |
|-------|-------|--------|
| Wetlands | `#0D9488` (teal) | USFWS NWI |
| EPA Facilities | `#EF4444` (red) | EPA ECHO |

#### Transportation Layers
| Layer | Color | Source |
|-------|-------|--------|
| AADT Points | `#F59E0B` (amber) | TxDOT |
| Road Network | `#64748B` (slate) | TxDOT |

---

## PDF Report Specifications

### Report Format

| Specification | Value |
|---------------|-------|
| **Format** | PDF/A (archival) |
| **Page Size** | 8.5" × 11" (Letter) |
| **Pages** | 15–25 pages typical |
| **Resolution** | 300 DPI for images |
| **File Size** | 2–5 MB typical |

### Report Sections

1. **Cover Page** — Property address, date, feasibility score
2. **Executive Summary** — Key findings, verdict, recommendations
3. **Property Overview** — Parcel data, ownership, improvements
4. **Zoning Analysis** — Current zoning, permitted uses, constraints
5. **Flood Risk Assessment** — FEMA zones, BFE, insurance requirements
6. **Environmental Review** — Wetlands, EPA sites, soil conditions
7. **Utilities & Infrastructure** — Water, sewer, storm, electric, fiber
8. **Traffic & Access** — AADT, road classification, access points
9. **Market Demographics** — Population, income, housing, employment
10. **Tax & Jurisdiction** — Tax rates, taxing entities, incentives
11. **Cost & Schedule** — Development costs, timeline projections
12. **Conclusion** — Final recommendations, next steps
13. **Data Sources & Citations** — Full provenance for all data

### Lender-Ready Features

- ✅ All data sources cited with timestamps
- ✅ FEMA flood zone documentation
- ✅ Environmental clearance indicators
- ✅ Professional formatting
- ✅ Digital signature ready
- ✅ Archival PDF format

### Secure Sharing

| Feature | Description |
|---------|-------------|
| **Signed URLs** | Time-limited secure links |
| **Expiration** | 72-hour default lifetime |
| **Access Logging** | View tracking for compliance |
| **Watermarking** | Optional recipient watermark |

---

## Pricing & Subscriptions

### Per-Report Pricing

| Product | Price | Delivery | Contents |
|---------|-------|----------|----------|
| **QuickCheck™** | Free | Instant | Feasibility score + summary |
| **Site Feasibility Report** | $795 | < 10 min | Full report + PDF + map |

### Subscription Plans

| Plan | Price | Reports/Month | Features |
|------|-------|---------------|----------|
| **Pro** | $1,950/mo | 10 reports | Dashboard, API access, priority support |
| **Enterprise** | $9,990/mo | Unlimited | White-label, custom integrations, SLA |

### Add-Ons

| Add-On | Price | Description |
|--------|-------|-------------|
| Additional Reports | $695/ea | Discounted rate for Pro subscribers |
| Historical Data | $250/report | Access to prior versions |
| API Integration | Included (Pro+) | Programmatic access |
| Custom Branding | Enterprise only | White-label reports |

---

## API & Integration Access

### REST API v2

**Base URL**: `https://api.siteintel.dev/v2`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/reports` | POST | Generate new report |
| `/reports/{id}` | GET | Retrieve report |
| `/reports/{id}/pdf` | GET | Download PDF |
| `/parcels/lookup` | GET | Parcel search by address |
| `/parcels/{id}` | GET | Parcel details |
| `/layers/{type}` | GET | GeoJSON layer data |

### OData v4.01 Gateway

**Base URL**: `https://odata.siteintel.dev/v4`

| Entity Set | Description |
|------------|-------------|
| `Reports` | Feasibility reports |
| `Applications` | Report applications |
| `Parcels` | Parcel geometries |
| `Demographics` | Census block group data |
| `FloodZones` | FEMA flood zones |

**Supported Operations**:
- `$filter` — OData filter expressions
- `$select` — Field projection
- `$expand` — Related entity expansion
- `$orderby` — Result ordering
- `$top` / `$skip` — Pagination

### Webhooks

| Event | Payload |
|-------|---------|
| `report.created` | Report ID, status |
| `report.completed` | Report ID, score, PDF URL |
| `report.failed` | Report ID, error details |

---

## Data Quality & Compliance

### Data Freshness Guarantees

| Data Source | Update Frequency | SLA |
|-------------|------------------|-----|
| Parcel Data (HCAD) | Bi-weekly | < 14 days |
| Parcel Data (FBCAD) | Annually | < 365 days |
| FEMA Flood Zones | As published | < 30 days |
| Census ACS | Annually | Current vintage |
| TxDOT Traffic | 5-year cycle | Current dataset |
| EPA ECHO | Real-time | < 24 hours |

### Citation Standards

Every data point includes:
- Source agency name
- Dataset identifier
- Retrieval timestamp
- Data vintage/version

### Compliance

| Standard | Status |
|----------|--------|
| SOC 2 Type II | In progress |
| GDPR | Compliant |
| CCPA | Compliant |
| ADA/WCAG 2.1 | AA compliant |

---

## User Experience Features

### Dashboard

- **Report History** — All generated reports with search/filter
- **Saved Searches** — Bookmarked addresses and parcels
- **Quick Actions** — One-click report generation
- **Notifications** — Report completion alerts
- **Account Settings** — Profile, billing, API keys

### Mobile Experience

- **Responsive Design** — Full functionality on mobile
- **Touch-Optimized Maps** — Pinch, zoom, rotate
- **Offline PDF** — Downloaded reports available offline
- **Push Notifications** — Report completion alerts

### Accessibility

- **Keyboard Navigation** — Full keyboard support
- **Screen Reader** — ARIA labels throughout
- **High Contrast** — Dark mode support
- **Focus Indicators** — Visible focus states

---

## Data Sources Reference

### Authoritative Sources Integrated

| Source | Data Provided | API Type |
|--------|---------------|----------|
| **HCAD** | Harris County parcels, values | ArcGIS REST |
| **FBCAD** | Fort Bend County parcels, values | ArcGIS REST |
| **MCAD** | Montgomery County parcels, values | ArcGIS REST |
| **FEMA NFHL** | Flood zones, BFE | ArcGIS REST |
| **OpenFEMA** | NFIP claims, disasters | REST/OData |
| **USFWS NWI** | National wetlands | ArcGIS REST |
| **EPA ECHO** | Regulated facilities | REST |
| **TxDOT** | Traffic counts, roads | ArcGIS REST |
| **Census ACS** | Demographics (83+ vars) | Census API |
| **Google Places** | Geocoding, addresses | REST |
| **City of Houston GIS** | Utilities, infrastructure | ArcGIS REST |

---

## Support & Resources

### Documentation

- **API Reference**: `https://docs.siteintel.dev/api`
- **User Guide**: `https://docs.siteintel.dev/guide`
- **FAQ**: `https://siteintel.dev/faq`

### Support Channels

| Channel | Response Time | Availability |
|---------|---------------|--------------|
| Email | < 24 hours | 24/7 |
| Chat | < 2 hours | Business hours |
| Phone | Immediate | Enterprise only |

### Training

- **Onboarding Webinar** — Weekly sessions
- **Video Tutorials** — Self-paced learning
- **Custom Training** — Enterprise only

---

## Appendix: Field Reference

For complete field definitions, data types, and API schemas, see:
- `docs/api/EDGE_FUNCTIONS_INDEX.md`
- `docs/architecture/CENSUS_DATA_MOAT.md`
- `src/integrations/supabase/types.ts`
- `packages/types/src/report.ts`

---

*© 2025 SiteIntel™ — Precision. Proof. Possibility.*
