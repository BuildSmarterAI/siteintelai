-- Create alert tracking table
create table if not exists public.hii_alerts (
  id bigserial primary key,
  city text not null,
  yoy numeric not null,
  establishment_count integer,
  total_receipts numeric,
  sent_at timestamptz default now()
);

-- Create watchlist table for monitoring specific locations
create table if not exists public.hii_watchlist (
  id bigserial primary key,
  name text not null,
  lat double precision not null,
  lon double precision not null,
  radius_m integer default 1609,
  yoy_threshold numeric default 15,
  last_alert_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.hii_alerts enable row level security;
alter table public.hii_watchlist enable row level security;

-- Alerts: Read-only for authenticated users
create policy "Allow authenticated users to read alerts"
  on public.hii_alerts
  for select
  using (auth.role() = 'authenticated');

create policy "Allow service role to insert alerts"
  on public.hii_alerts
  for insert
  with check (auth.role() = 'service_role');

-- Watchlist: Full CRUD for authenticated users
create policy "Allow authenticated users to manage watchlist"
  on public.hii_watchlist
  for all
  using (auth.role() = 'authenticated');

-- Create function to check for threshold breaches
create or replace function public.hii_check_threshold()
returns table(city text, yoy numeric, establishment_count bigint, total_receipts numeric) 
language sql stable as
$$
  with recent_data as (
    select 
      city,
      count(*) as est_count,
      sum(total_receipts) as total_rcpts,
      avg(total_receipts) as avg_rcpts
    from public.tx_mixed_beverage_activity
    where period_end_date >= current_date - interval '12 months'
      and city is not null
    group by city
  ),
  city_baseline as (
    select 
      city,
      avg(total_receipts) as baseline_avg
    from public.tx_mixed_beverage_activity
    where period_end_date between current_date - interval '24 months' and current_date - interval '13 months'
      and city is not null
    group by city
  )
  select 
    rd.city,
    round(100 * ((rd.avg_rcpts / nullif(cb.baseline_avg, 0)) - 1), 2) as yoy,
    rd.est_count::bigint,
    rd.total_rcpts
  from recent_data rd
  inner join city_baseline cb on rd.city = cb.city
  where round(100 * ((rd.avg_rcpts / nullif(cb.baseline_avg, 0)) - 1), 2) > 15
  order by yoy desc;
$$;

-- Create indexes
create index if not exists idx_hii_alerts_city on hii_alerts(city);
create index if not exists idx_hii_alerts_sent_at on hii_alerts(sent_at);
create index if not exists idx_hii_watchlist_location on hii_watchlist(lat, lon);

-- Add comments
comment on table public.hii_alerts is 'Historical record of HII threshold breach alerts sent';
comment on table public.hii_watchlist is 'Locations to monitor for hospitality activity changes';
comment on function public.hii_check_threshold is 'Identifies cities with significant year-over-year growth in hospitality receipts';
