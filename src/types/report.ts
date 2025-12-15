// Report types extracted from ReportViewer.tsx

export interface ReportApplications {
  formatted_address: string;
  geo_lat: number;
  geo_lng: number;
  parcel_id: string;
  zoning_code: string;
  floodplain_zone: string;
  intent_type?: string | null;
  traffic_aadt: number | null;
  traffic_year: number | null;
  traffic_road_name: string | null;
  truck_percent: number | null;
  congestion_level: string | null;
  traffic_direction: string | null;
  traffic_map_url: string | null;
  traffic_distance_ft?: number | null;
  employment_clusters: any | null;
  updated_at?: string;
  user_id?: string;
  // Project Intent fields
  project_type?: string[] | null;
  building_size_value?: number | null;
  building_size_unit?: string | null;
  stories_height?: string | null;
  desired_budget?: number | null;
  prototype_requirements?: string | null;
  quality_level?: string | null;
  tenant_requirements?: string | null;
  access_priorities?: string[] | null;
  known_risks?: string[] | null;
  utility_access?: string[] | null;
  environmental_constraints?: string[] | null;
  // Valuation fields
  tot_appr_val?: number | null;
  tot_market_val?: number | null;
  land_val?: number | null;
  imprv_val?: number | null;
  taxable_value?: number | null;
  // Building characteristics
  bldg_sqft?: number | null;
  year_built?: number | null;
  effective_yr?: number | null;
  num_stories?: number | null;
  state_class?: string | null;
  prop_type?: string | null;
  land_use_code?: string | null;
  // Location details
  subdivision?: string | null;
  block?: string | null;
  lot?: string | null;
  exemption_code?: string | null;
  // Cost & Schedule fields
  costs_output?: string | null;
  schedule_output?: string | null;
  // Tax & Incentives fields
  tax_rate_total?: number | null;
  taxing_jurisdictions?: any | null;
  opportunity_zone?: boolean | null;
  enterprise_zone?: boolean | null;
  foreign_trade_zone?: boolean | null;
  mud_district?: string | null;
  etj_provider?: string | null;
  wcid_district?: string | null;
  // Infrastructure fields
  power_kv_nearby?: number | null;
  fiber_available?: boolean | null;
  broadband_providers?: any | null;
  distance_highway_ft?: number | null;
  distance_transit_ft?: number | null;
  // Owner field
  parcel_owner?: string | null;
  // HCAD fields
  acct_num?: string | null;
  legal_dscr_1?: string | null;
  legal_dscr_2?: string | null;
  legal_dscr_3?: string | null;
  legal_dscr_4?: string | null;
  bldg_style_cd?: string | null;
  ag_use?: boolean | null;
  homestead?: boolean | null;
  // FEMA fields
  fema_firm_panel?: string | null;
  base_flood_elevation?: number | null;
  base_flood_elevation_source?: string | null;
  // Environmental fields
  wetlands_type?: string | null;
  wetlands_area_pct?: number | null;
  soil_series?: string | null;
  soil_drainage_class?: string | null;
  soil_slope_percent?: number | null;
  environmental_sites?: any;
  historical_flood_events?: any;
  // Lot size fields
  lot_size_value?: number | null;
  lot_size_unit?: string | null;
  acreage_cad?: number | null;
  // Permitting fields
  average_permit_time_months?: number | null;
  city?: string | null;
  county?: string | null;
  neighborhood?: string | null;
  submarket_enriched?: string | null;
  disaster_declarations?: string | null;
  // Market demographics - drive time
  drive_time_15min_population?: number | null;
  drive_time_30min_population?: number | null;
  population_1mi?: number | null;
  population_3mi?: number | null;
  population_5mi?: number | null;
  growth_rate_5yr?: number | null;
  median_income?: number | null;
  households_5mi?: number | null;
  // Extended Census ACS demographics
  median_home_value?: number | null;
  median_rent?: number | null;
  vacancy_rate?: number | null;
  unemployment_rate?: number | null;
  median_age?: number | null;
  college_attainment_pct?: number | null;
  total_housing_units?: number | null;
  labor_force?: number | null;
  // Proprietary CRE Indices (Census Data Moat)
  retail_spending_index?: number | null;
  workforce_availability_score?: number | null;
  growth_potential_index?: number | null;
  affluence_concentration?: number | null;
  labor_pool_depth?: number | null;
  daytime_population_estimate?: number | null;
  growth_trajectory?: string | null;
  market_outlook?: string | null;
  demographics_source?: string | null;
  census_block_group?: string | null;
  census_vintage?: string | null;
  // Google Maps integration
  drivetimes?: Array<{
    destination: string;
    duration_min: number;
    distance_mi: number;
  }>;
  nearby_places?: Array<{
    name: string;
    type: string;
    distance_ft: number;
  }>;
  water_lines?: Array<{
    diameter: number | null;
    material: string | null;
    status?: string | null;
    install_date?: string | null;
    distance_ft?: number;
    source?: string;
    owner?: string;
  }>;
  sewer_lines?: Array<{
    diameter: number | null;
    material: string | null;
    status?: string | null;
    distance_ft?: number;
    source?: string;
  }>;
  storm_lines?: Array<{
    diameter: number | null;
    material: string | null;
    status?: string | null;
    distance_ft?: number;
    source?: string;
  }>;
  data_flags?: string[];
  // Additional fields
  nfip_claims_count?: number | null;
  water_capacity_mgd?: number | null;
  sewer_capacity_mgd?: number | null;
  epa_facilities_count?: number | null;
  peak_hour_volume?: number | null;
  nearest_highway?: string | null;
  nearest_transit_stop?: string | null;
  nearest_signal_distance_ft?: number | null;
  road_classification?: string | null;
  elevation?: number | null;
  topography_map_url?: string | null;
}

export interface Report {
  id: string;
  application_id: string;
  feasibility_score: number;
  score_band: string;
  json_data: any;
  pdf_url: string | null;
  created_at: string;
  report_assets?: {
    static_map_url?: string;
    streetview?: Array<{
      direction: string;
      heading: number;
      url: string;
    }>;
  };
  applications: ReportApplications;
}

export interface CountyComparison {
  avgMedianIncome?: number | null;
  avgMedianHomeValue?: number | null;
  avgVacancyRate?: number | null;
  avgUnemploymentRate?: number | null;
  avgMedianRent?: number | null;
  tractCount?: number | null;
}

export interface ParsedReportData {
  summary?: any;
  zoning?: any;
  flood?: any;
  utilities?: any;
  environmental?: any;
  traffic?: any;
  market_demographics?: any;
  data_sources?: any[];
}

export type DataFreshness = "fresh" | "recent" | "stale";
