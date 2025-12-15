-- =====================================================
-- Census Data Moat: Canonical Demographics Tables
-- 83+ ACS variables, 6 proprietary CRE indices, 5-year projections
-- =====================================================

-- Table 1: canonical_demographics (Texas Block Groups - ~15,000 records)
CREATE TABLE IF NOT EXISTS public.canonical_demographics (
  -- Core Identification
  geoid TEXT PRIMARY KEY,                    -- Block group ID (e.g., 484533201001)
  acs_vintage TEXT DEFAULT '2022_5yr',       -- Data vintage
  county_fips TEXT,                          -- County FIPS code
  tract_id TEXT,                             -- Census tract ID
  state_fips TEXT DEFAULT '48',              -- Texas = 48
  
  -- Core Demographics
  total_population INTEGER,
  population_density_sqmi NUMERIC,
  median_age NUMERIC,
  under_18_pct NUMERIC,
  working_age_pct NUMERIC,                   -- 18-64
  over_65_pct NUMERIC,

  -- Race & Ethnicity (5 fields)
  white_pct NUMERIC,
  black_pct NUMERIC,
  asian_pct NUMERIC,
  hispanic_pct NUMERIC,
  two_or_more_races_pct NUMERIC,

  -- Housing (13 fields)
  total_housing_units INTEGER,
  occupied_housing_units INTEGER,
  vacant_housing_units INTEGER,
  vacancy_rate NUMERIC,
  owner_occupied_pct NUMERIC,
  renter_occupied_pct NUMERIC,
  median_home_value NUMERIC,
  median_rent NUMERIC,
  median_year_built INTEGER,
  median_rooms NUMERIC,
  avg_household_size NUMERIC,
  single_family_pct NUMERIC,
  multi_family_pct NUMERIC,

  -- Economics (10 fields)
  median_household_income NUMERIC,
  per_capita_income NUMERIC,
  mean_household_income NUMERIC,
  median_earnings NUMERIC,
  poverty_rate NUMERIC,
  snap_recipients_pct NUMERIC,
  gini_index NUMERIC,
  income_below_50k_pct NUMERIC,
  income_50k_100k_pct NUMERIC,
  income_above_100k_pct NUMERIC,

  -- Employment (12 fields)
  labor_force INTEGER,
  employed_population INTEGER,
  unemployment_rate NUMERIC,
  work_from_home_pct NUMERIC,
  white_collar_pct NUMERIC,
  blue_collar_pct NUMERIC,
  service_sector_pct NUMERIC,
  retail_workers INTEGER,
  healthcare_workers INTEGER,
  professional_services_workers INTEGER,
  manufacturing_workers INTEGER,
  top_industries JSONB,

  -- Commute Patterns (8 fields)
  mean_commute_time_min NUMERIC,
  drive_alone_pct NUMERIC,
  carpool_pct NUMERIC,
  public_transit_pct NUMERIC,
  walk_bike_pct NUMERIC,
  work_from_home_commute_pct NUMERIC,
  commute_under_30min_pct NUMERIC,
  commute_over_60min_pct NUMERIC,

  -- Education (6 fields)
  less_than_high_school_pct NUMERIC,
  high_school_only_pct NUMERIC,
  some_college_pct NUMERIC,
  bachelors_pct NUMERIC,
  graduate_degree_pct NUMERIC,
  stem_degree_pct NUMERIC,

  -- PROPRIETARY CRE INDICES (6 computed fields)
  retail_spending_index NUMERIC,             -- 0-100, consumer spending potential
  workforce_availability_score NUMERIC,      -- 0-100, labor pool depth
  growth_potential_index NUMERIC,            -- 0-100, forward trajectory
  affluence_concentration NUMERIC,           -- 0-100, high-income density
  labor_pool_depth NUMERIC,                  -- 0-100, available workers
  daytime_population_estimate INTEGER,       -- Workers + residents

  -- Geometry (PostGIS)
  geom GEOMETRY(MultiPolygon, 4326),
  centroid GEOMETRY(Point, 4326),

  -- Metadata
  accuracy_tier TEXT DEFAULT 'T1',
  confidence NUMERIC DEFAULT 95,
  source_dataset TEXT DEFAULT 'bigquery_acs_5yr',
  ingestion_run_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: demographics_historical (Multi-vintage time series)
CREATE TABLE IF NOT EXISTS public.demographics_historical (
  id SERIAL,
  geoid TEXT NOT NULL,
  acs_vintage TEXT NOT NULL,                 -- '2017_5yr', '2019_5yr', '2022_5yr'
  total_population INTEGER,
  median_household_income NUMERIC,
  median_home_value NUMERIC,
  median_rent NUMERIC,
  labor_force INTEGER,
  unemployment_rate NUMERIC,
  vacancy_rate NUMERIC,
  population_density_sqmi NUMERIC,
  median_age NUMERIC,
  bachelors_pct NUMERIC,
  poverty_rate NUMERIC,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (geoid, acs_vintage)
);

-- Table 3: demographics_projections (5-year forward estimates)
CREATE TABLE IF NOT EXISTS public.demographics_projections (
  geoid TEXT PRIMARY KEY,
  population_cagr NUMERIC,                   -- Compound annual growth rate
  income_cagr NUMERIC,
  housing_value_cagr NUMERIC,
  rent_cagr NUMERIC,
  population_5yr_projection INTEGER,
  median_income_5yr_projection NUMERIC,
  median_home_value_5yr_projection NUMERIC,
  median_rent_5yr_projection NUMERIC,
  growth_trajectory TEXT,                    -- 'rapid', 'steady', 'stable', 'declining'
  market_outlook TEXT,                       -- 'expansion', 'mature', 'transitional', 'contraction'
  projection_confidence NUMERIC,
  base_vintage TEXT DEFAULT '2022_5yr',
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for spatial queries
CREATE INDEX IF NOT EXISTS idx_canonical_demographics_geom 
  ON public.canonical_demographics USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_canonical_demographics_centroid 
  ON public.canonical_demographics USING GIST (centroid);
CREATE INDEX IF NOT EXISTS idx_canonical_demographics_county 
  ON public.canonical_demographics (county_fips);
CREATE INDEX IF NOT EXISTS idx_canonical_demographics_vintage 
  ON public.canonical_demographics (acs_vintage);

-- Create indexes for historical lookups
CREATE INDEX IF NOT EXISTS idx_demographics_historical_geoid 
  ON public.demographics_historical (geoid);
CREATE INDEX IF NOT EXISTS idx_demographics_historical_vintage 
  ON public.demographics_historical (acs_vintage);

-- Add new columns to applications table for Census Data Moat
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS census_block_group TEXT,
ADD COLUMN IF NOT EXISTS census_vintage TEXT DEFAULT '2022_5yr',
ADD COLUMN IF NOT EXISTS population_block_group INTEGER,
ADD COLUMN IF NOT EXISTS population_density_sqmi NUMERIC,
ADD COLUMN IF NOT EXISTS under_18_pct NUMERIC,
ADD COLUMN IF NOT EXISTS working_age_pct NUMERIC,
ADD COLUMN IF NOT EXISTS over_65_pct NUMERIC,
ADD COLUMN IF NOT EXISTS white_pct NUMERIC,
ADD COLUMN IF NOT EXISTS black_pct NUMERIC,
ADD COLUMN IF NOT EXISTS asian_pct NUMERIC,
ADD COLUMN IF NOT EXISTS hispanic_pct NUMERIC,
ADD COLUMN IF NOT EXISTS owner_occupied_pct NUMERIC,
ADD COLUMN IF NOT EXISTS renter_occupied_pct NUMERIC,
ADD COLUMN IF NOT EXISTS median_year_built INTEGER,
ADD COLUMN IF NOT EXISTS avg_household_size NUMERIC,
ADD COLUMN IF NOT EXISTS single_family_pct NUMERIC,
ADD COLUMN IF NOT EXISTS multi_family_pct NUMERIC,
ADD COLUMN IF NOT EXISTS per_capita_income NUMERIC,
ADD COLUMN IF NOT EXISTS mean_household_income NUMERIC,
ADD COLUMN IF NOT EXISTS poverty_rate NUMERIC,
ADD COLUMN IF NOT EXISTS gini_index NUMERIC,
ADD COLUMN IF NOT EXISTS white_collar_pct NUMERIC,
ADD COLUMN IF NOT EXISTS blue_collar_pct NUMERIC,
ADD COLUMN IF NOT EXISTS service_sector_pct NUMERIC,
ADD COLUMN IF NOT EXISTS work_from_home_pct NUMERIC,
ADD COLUMN IF NOT EXISTS top_industries JSONB,
ADD COLUMN IF NOT EXISTS mean_commute_time_min NUMERIC,
ADD COLUMN IF NOT EXISTS drive_alone_pct NUMERIC,
ADD COLUMN IF NOT EXISTS public_transit_pct NUMERIC,
ADD COLUMN IF NOT EXISTS walk_bike_pct NUMERIC,
ADD COLUMN IF NOT EXISTS high_school_only_pct NUMERIC,
ADD COLUMN IF NOT EXISTS some_college_pct NUMERIC,
ADD COLUMN IF NOT EXISTS bachelors_pct NUMERIC,
ADD COLUMN IF NOT EXISTS graduate_degree_pct NUMERIC,
ADD COLUMN IF NOT EXISTS retail_spending_index NUMERIC,
ADD COLUMN IF NOT EXISTS workforce_availability_score NUMERIC,
ADD COLUMN IF NOT EXISTS growth_potential_index NUMERIC,
ADD COLUMN IF NOT EXISTS affluence_concentration NUMERIC,
ADD COLUMN IF NOT EXISTS labor_pool_depth NUMERIC,
ADD COLUMN IF NOT EXISTS daytime_population_estimate INTEGER,
ADD COLUMN IF NOT EXISTS population_5yr_projection INTEGER,
ADD COLUMN IF NOT EXISTS median_income_5yr_projection NUMERIC,
ADD COLUMN IF NOT EXISTS median_home_value_5yr_projection NUMERIC,
ADD COLUMN IF NOT EXISTS population_cagr NUMERIC,
ADD COLUMN IF NOT EXISTS growth_trajectory TEXT,
ADD COLUMN IF NOT EXISTS market_outlook TEXT,
ADD COLUMN IF NOT EXISTS demographics_source TEXT DEFAULT 'census_api';

-- Create RPC function for spatial lookup of demographics by point
CREATE OR REPLACE FUNCTION public.get_demographics_for_point(p_lat NUMERIC, p_lng NUMERIC)
RETURNS TABLE(
  geoid TEXT,
  acs_vintage TEXT,
  county_fips TEXT,
  total_population INTEGER,
  population_density_sqmi NUMERIC,
  median_age NUMERIC,
  under_18_pct NUMERIC,
  working_age_pct NUMERIC,
  over_65_pct NUMERIC,
  white_pct NUMERIC,
  black_pct NUMERIC,
  asian_pct NUMERIC,
  hispanic_pct NUMERIC,
  two_or_more_races_pct NUMERIC,
  total_housing_units INTEGER,
  occupied_housing_units INTEGER,
  vacant_housing_units INTEGER,
  vacancy_rate NUMERIC,
  owner_occupied_pct NUMERIC,
  renter_occupied_pct NUMERIC,
  median_home_value NUMERIC,
  median_rent NUMERIC,
  median_year_built INTEGER,
  median_rooms NUMERIC,
  avg_household_size NUMERIC,
  single_family_pct NUMERIC,
  multi_family_pct NUMERIC,
  median_household_income NUMERIC,
  per_capita_income NUMERIC,
  mean_household_income NUMERIC,
  median_earnings NUMERIC,
  poverty_rate NUMERIC,
  snap_recipients_pct NUMERIC,
  gini_index NUMERIC,
  income_below_50k_pct NUMERIC,
  income_50k_100k_pct NUMERIC,
  income_above_100k_pct NUMERIC,
  labor_force INTEGER,
  employed_population INTEGER,
  unemployment_rate NUMERIC,
  work_from_home_pct NUMERIC,
  white_collar_pct NUMERIC,
  blue_collar_pct NUMERIC,
  service_sector_pct NUMERIC,
  retail_workers INTEGER,
  healthcare_workers INTEGER,
  professional_services_workers INTEGER,
  manufacturing_workers INTEGER,
  top_industries JSONB,
  mean_commute_time_min NUMERIC,
  drive_alone_pct NUMERIC,
  carpool_pct NUMERIC,
  public_transit_pct NUMERIC,
  walk_bike_pct NUMERIC,
  work_from_home_commute_pct NUMERIC,
  commute_under_30min_pct NUMERIC,
  commute_over_60min_pct NUMERIC,
  less_than_high_school_pct NUMERIC,
  high_school_only_pct NUMERIC,
  some_college_pct NUMERIC,
  bachelors_pct NUMERIC,
  graduate_degree_pct NUMERIC,
  stem_degree_pct NUMERIC,
  retail_spending_index NUMERIC,
  workforce_availability_score NUMERIC,
  growth_potential_index NUMERIC,
  affluence_concentration NUMERIC,
  labor_pool_depth NUMERIC,
  daytime_population_estimate INTEGER,
  population_cagr NUMERIC,
  income_cagr NUMERIC,
  housing_value_cagr NUMERIC,
  rent_cagr NUMERIC,
  population_5yr_projection INTEGER,
  median_income_5yr_projection NUMERIC,
  median_home_value_5yr_projection NUMERIC,
  median_rent_5yr_projection NUMERIC,
  growth_trajectory TEXT,
  market_outlook TEXT,
  projection_confidence NUMERIC,
  accuracy_tier TEXT,
  confidence NUMERIC,
  source_dataset TEXT
)
LANGUAGE sql STABLE
SET search_path = 'public'
AS $$
  SELECT 
    d.geoid,
    d.acs_vintage,
    d.county_fips,
    d.total_population,
    d.population_density_sqmi,
    d.median_age,
    d.under_18_pct,
    d.working_age_pct,
    d.over_65_pct,
    d.white_pct,
    d.black_pct,
    d.asian_pct,
    d.hispanic_pct,
    d.two_or_more_races_pct,
    d.total_housing_units,
    d.occupied_housing_units,
    d.vacant_housing_units,
    d.vacancy_rate,
    d.owner_occupied_pct,
    d.renter_occupied_pct,
    d.median_home_value,
    d.median_rent,
    d.median_year_built,
    d.median_rooms,
    d.avg_household_size,
    d.single_family_pct,
    d.multi_family_pct,
    d.median_household_income,
    d.per_capita_income,
    d.mean_household_income,
    d.median_earnings,
    d.poverty_rate,
    d.snap_recipients_pct,
    d.gini_index,
    d.income_below_50k_pct,
    d.income_50k_100k_pct,
    d.income_above_100k_pct,
    d.labor_force,
    d.employed_population,
    d.unemployment_rate,
    d.work_from_home_pct,
    d.white_collar_pct,
    d.blue_collar_pct,
    d.service_sector_pct,
    d.retail_workers,
    d.healthcare_workers,
    d.professional_services_workers,
    d.manufacturing_workers,
    d.top_industries,
    d.mean_commute_time_min,
    d.drive_alone_pct,
    d.carpool_pct,
    d.public_transit_pct,
    d.walk_bike_pct,
    d.work_from_home_commute_pct,
    d.commute_under_30min_pct,
    d.commute_over_60min_pct,
    d.less_than_high_school_pct,
    d.high_school_only_pct,
    d.some_college_pct,
    d.bachelors_pct,
    d.graduate_degree_pct,
    d.stem_degree_pct,
    d.retail_spending_index,
    d.workforce_availability_score,
    d.growth_potential_index,
    d.affluence_concentration,
    d.labor_pool_depth,
    d.daytime_population_estimate,
    p.population_cagr,
    p.income_cagr,
    p.housing_value_cagr,
    p.rent_cagr,
    p.population_5yr_projection,
    p.median_income_5yr_projection,
    p.median_home_value_5yr_projection,
    p.median_rent_5yr_projection,
    p.growth_trajectory,
    p.market_outlook,
    p.projection_confidence,
    d.accuracy_tier,
    d.confidence,
    d.source_dataset
  FROM public.canonical_demographics d
  LEFT JOIN public.demographics_projections p ON d.geoid = p.geoid
  WHERE ST_Contains(d.geom, ST_SetSRID(ST_Point(p_lng, p_lat), 4326))
  LIMIT 1;
$$;

-- Enable RLS on new tables
ALTER TABLE public.canonical_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demographics_historical ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demographics_projections ENABLE ROW LEVEL SECURITY;

-- Create policies for read access (public data)
CREATE POLICY "Allow public read access to canonical_demographics"
  ON public.canonical_demographics FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to demographics_historical"
  ON public.demographics_historical FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to demographics_projections"
  ON public.demographics_projections FOR SELECT
  USING (true);

-- Create policies for service role write access
CREATE POLICY "Allow service role to manage canonical_demographics"
  ON public.canonical_demographics FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role to manage demographics_historical"
  ON public.demographics_historical FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role to manage demographics_projections"
  ON public.demographics_projections FOR ALL
  USING (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE public.canonical_demographics IS 'Census Data Moat: 83+ ACS variables at block group level with 6 proprietary CRE indices';
COMMENT ON TABLE public.demographics_historical IS 'Historical time series for trend analysis (2017, 2019, 2022 vintages)';
COMMENT ON TABLE public.demographics_projections IS '5-year forward projections based on historical CAGR';
COMMENT ON FUNCTION public.get_demographics_for_point IS 'Spatial lookup returning all 83+ demographics fields for a lat/lng point';