-- Create Hospitality Impact Index (HII) scoring function
create or replace function public.fn_hii(
  p_lat double precision,
  p_lon double precision,
  p_radius_m integer default 1609,  -- 1 mile default
  p_months_back integer default 12
) returns jsonb language plpgsql stable as
$$
declare
  v_cnt bigint;
  v_sum numeric;
  v_city text;
  v_city_avg numeric;
  v_city_yoy numeric;
  v_score numeric;
  v_establishments jsonb;
begin
  -- Count establishments and sum receipts within radius
  select count(*), sum(total_receipts)
  into v_cnt, v_sum
  from public.tx_mixed_beverage_activity
  where st_dwithin(geog, st_makepoint(p_lon, p_lat)::geography, p_radius_m)
    and period_end_date >= current_date - (p_months_back || ' months')::interval;

  -- Identify primary city in the area
  select city
  into v_city
  from public.tx_mixed_beverage_activity
  where st_dwithin(geog, st_makepoint(p_lon, p_lat)::geography, p_radius_m)
    and city is not null
  group by city 
  order by count(*) desc 
  limit 1;

  -- Calculate city average receipts
  if v_city is not null then
    select avg(total_receipts) 
    into v_city_avg
    from public.tx_mixed_beverage_activity 
    where city = v_city
      and period_end_date >= current_date - (p_months_back || ' months')::interval;
  end if;

  -- Calculate year-over-year growth relative to city average
  if v_city_avg is not null and v_city_avg > 0 and v_cnt > 0 then
    v_city_yoy := 100 * ((v_sum / v_cnt) / v_city_avg - 1);
  else
    v_city_yoy := 0;
  end if;

  -- Calculate normalized score (0-100)
  v_score := least(100, greatest(0, round(50 + (v_city_yoy / 2), 2)));

  -- Get top establishments in area
  select jsonb_agg(
    jsonb_build_object(
      'name', location_name,
      'address', address,
      'receipts', total_receipts,
      'distance_meters', round(st_distance(geog, st_makepoint(p_lon, p_lat)::geography)::numeric, 0)
    )
  )
  into v_establishments
  from (
    select location_name, address, total_receipts, geog
    from public.tx_mixed_beverage_activity
    where st_dwithin(geog, st_makepoint(p_lon, p_lat)::geography, p_radius_m)
      and period_end_date >= current_date - (p_months_back || ' months')::interval
    order by total_receipts desc
    limit 10
  ) top_establishments;

  -- Return comprehensive result
  return jsonb_build_object(
    'hii_score', v_score,
    'establishment_count', coalesce(v_cnt, 0),
    'total_receipts', coalesce(v_sum, 0),
    'avg_receipts_per_establishment', case when v_cnt > 0 then round(v_sum / v_cnt, 2) else 0 end,
    'city', coalesce(v_city, 'Unknown'),
    'city_avg_receipts', coalesce(round(v_city_avg, 2), 0),
    'yoy_vs_city_avg', coalesce(round(v_city_yoy, 2), 0),
    'radius_meters', p_radius_m,
    'months_analyzed', p_months_back,
    'top_establishments', coalesce(v_establishments, '[]'::jsonb)
  );
end;
$$;

-- Add comment for documentation
comment on function public.fn_hii is 'Calculates Hospitality Impact Index score for a given location based on mixed beverage receipts data';
