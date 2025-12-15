-- Modify get_demographics_for_point to return tract geometry
-- Add new function get_county_demographics for county-level comparison metrics

-- First, drop and recreate get_demographics_for_point to include tract geometry
DROP FUNCTION IF EXISTS public.get_demographics_for_point(double precision, double precision);

CREATE OR REPLACE FUNCTION public.get_demographics_for_point(
  p_lng double precision,
  p_lat double precision
)
RETURNS TABLE (
  geoid text,
  tract_id text,
  county_fips text,
  state_fips text,
  acs_vintage text,
  total_population integer,
  median_household_income numeric,
  median_home_value numeric,
  median_rent numeric,
  vacancy_rate numeric,
  unemployment_rate numeric,
  median_age numeric,
  labor_force integer,
  total_housing_units integer,
  owner_occupied_pct numeric,
  renter_occupied_pct numeric,
  bachelors_pct numeric,
  graduate_degree_pct numeric,
  high_school_only_pct numeric,
  some_college_pct numeric,
  poverty_rate numeric,
  gini_index numeric,
  mean_commute_time_min numeric,
  drive_alone_pct numeric,
  public_transit_pct numeric,
  walk_bike_pct numeric,
  work_from_home_pct numeric,
  under_18_pct numeric,
  working_age_pct numeric,
  over_65_pct numeric,
  white_pct numeric,
  black_pct numeric,
  asian_pct numeric,
  hispanic_pct numeric,
  per_capita_income numeric,
  mean_household_income numeric,
  avg_household_size numeric,
  population_density_sqmi numeric,
  single_family_pct numeric,
  multi_family_pct numeric,
  median_year_built integer,
  white_collar_pct numeric,
  blue_collar_pct numeric,
  service_sector_pct numeric,
  -- Proprietary indices
  retail_spending_index numeric,
  workforce_availability_score numeric,
  growth_potential_index numeric,
  affluence_concentration numeric,
  labor_pool_depth numeric,
  daytime_population_estimate integer,
  -- NEW: Tract geometry as GeoJSON
  tract_geom_geojson text,
  confidence numeric,
  accuracy_tier text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.geoid,
    d.tract_id,
    d.county_fips,
    d.state_fips,
    d.acs_vintage,
    d.total_population::integer,
    d.median_household_income,
    d.median_home_value,
    d.median_rent,
    d.vacancy_rate,
    d.unemployment_rate,
    d.median_age,
    d.labor_force::integer,
    d.total_housing_units::integer,
    d.owner_occupied_pct,
    d.renter_occupied_pct,
    d.bachelors_pct,
    d.graduate_degree_pct,
    d.high_school_only_pct,
    d.some_college_pct,
    d.poverty_rate,
    d.gini_index,
    d.mean_commute_time_min,
    d.drive_alone_pct,
    d.public_transit_pct,
    d.walk_bike_pct,
    d.work_from_home_pct,
    d.under_18_pct,
    d.working_age_pct,
    d.over_65_pct,
    d.white_pct,
    d.black_pct,
    d.asian_pct,
    d.hispanic_pct,
    d.per_capita_income,
    d.mean_household_income,
    d.avg_household_size,
    d.population_density_sqmi,
    d.single_family_pct,
    d.multi_family_pct,
    d.median_year_built::integer,
    d.white_collar_pct,
    d.blue_collar_pct,
    d.service_sector_pct,
    d.retail_spending_index,
    d.workforce_availability_score,
    d.growth_potential_index,
    d.affluence_concentration,
    d.labor_pool_depth,
    d.daytime_population_estimate::integer,
    -- Return tract geometry as GeoJSON string
    ST_AsGeoJSON(d.geom)::text as tract_geom_geojson,
    d.confidence,
    d.accuracy_tier
  FROM canonical_demographics d
  WHERE ST_DWithin(
    d.geom,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326),
    0.01  -- ~1km tolerance
  )
  ORDER BY ST_Distance(
    d.centroid,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)
  )
  LIMIT 1;
END;
$$;

-- Create function to get county-level demographic averages for comparison
CREATE OR REPLACE FUNCTION public.get_county_demographics(
  p_county_fips text
)
RETURNS TABLE (
  county_fips text,
  tract_count integer,
  avg_median_income numeric,
  avg_median_home_value numeric,
  avg_vacancy_rate numeric,
  avg_unemployment_rate numeric,
  avg_median_rent numeric,
  avg_median_age numeric,
  total_population bigint,
  total_housing_units bigint,
  avg_college_attainment_pct numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.county_fips,
    COUNT(*)::integer as tract_count,
    ROUND(AVG(d.median_household_income), 0) as avg_median_income,
    ROUND(AVG(d.median_home_value), 0) as avg_median_home_value,
    ROUND(AVG(d.vacancy_rate), 1) as avg_vacancy_rate,
    ROUND(AVG(d.unemployment_rate), 1) as avg_unemployment_rate,
    ROUND(AVG(d.median_rent), 0) as avg_median_rent,
    ROUND(AVG(d.median_age), 1) as avg_median_age,
    SUM(d.total_population)::bigint as total_population,
    SUM(d.total_housing_units)::bigint as total_housing_units,
    ROUND(AVG(COALESCE(d.bachelors_pct, 0) + COALESCE(d.graduate_degree_pct, 0)), 1) as avg_college_attainment_pct
  FROM canonical_demographics d
  WHERE d.county_fips = p_county_fips
  GROUP BY d.county_fips;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_demographics_for_point(double precision, double precision) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_demographics_for_point(double precision, double precision) TO anon;
GRANT EXECUTE ON FUNCTION public.get_county_demographics(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_county_demographics(text) TO anon;