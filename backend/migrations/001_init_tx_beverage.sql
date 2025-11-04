-- Enable PostGIS extension
create extension if not exists postgis;

-- Create base table for Texas Mixed Beverage Activity data
create table if not exists public.tx_mixed_beverage_activity (
  id bigserial primary key,
  taxpayer_number text,
  taxpayer_name text,
  location_number text,
  location_name text,
  address text,
  city text,
  county text,
  zip_code text,
  period_end_date date not null,
  total_receipts numeric not null,
  beer_receipts numeric,
  wine_receipts numeric,
  liquor_receipts numeric,
  lat double precision,
  lon double precision,
  geog geography(point, 4326),
  src_hash text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes for performance
create index if not exists idx_tx_mba_city on tx_mixed_beverage_activity(city);
create index if not exists idx_tx_mba_county on tx_mixed_beverage_activity(county);
create index if not exists idx_tx_mba_period on tx_mixed_beverage_activity(period_end_date);
create index if not exists idx_tx_mba_geog on tx_mixed_beverage_activity using gist(geog);
create index if not exists idx_tx_mba_receipts on tx_mixed_beverage_activity(total_receipts);

-- Enable Row Level Security
alter table public.tx_mixed_beverage_activity enable row level security;

-- Create policy for public read access
create policy "Allow public read access to beverage activity data"
  on public.tx_mixed_beverage_activity
  for select
  using (true);

-- Create policy for service role write access
create policy "Allow service role to insert/update beverage activity data"
  on public.tx_mixed_beverage_activity
  for all
  using (auth.role() = 'service_role');

-- Add comment for documentation
comment on table public.tx_mixed_beverage_activity is 'Texas Mixed Beverage Gross Receipts - sourced from Texas Comptroller Open Data Portal';
