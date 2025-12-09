-- ======================================================================
-- CANONICAL SCHEMA TABLES - ETL Data Moat Foundation
-- ======================================================================

create extension if not exists postgis;
create extension if not exists "uuid-ossp";

-- Helper trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 1. PARCELS CANONICAL
create table if not exists public.parcels_canonical (
    id bigserial primary key,
    jurisdiction text not null,
    parcel_id text not null,
    apn text,
    owner_name text,
    owner_address text,
    situs_address text,
    city text,
    county text,
    state text,
    zip text,
    lot_size_sqft numeric,
    lot_size_acres numeric generated always as (lot_size_sqft / 43560.0) stored,
    zoning_code text,
    land_use_code text,
    total_value numeric,
    land_value numeric,
    improvement_value numeric,
    geom geometry(MultiPolygon, 4326) not null,
    centroid geometry(Point, 4326) generated always as (st_centroid(geom)) stored,
    dataset_version text not null,
    source_dataset text,
    source_layer_id uuid,
    mapserver_id uuid,
    etl_job_id uuid,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(jurisdiction, parcel_id, dataset_version)
);

create index if not exists idx_parcels_can_geom on public.parcels_canonical using gist (geom);
create index if not exists idx_parcels_can_centroid on public.parcels_canonical using gist (centroid);
create index if not exists idx_parcels_can_jurisdiction on public.parcels_canonical (jurisdiction);
create index if not exists idx_parcels_can_parcel_id on public.parcels_canonical (parcel_id);
create index if not exists idx_parcels_can_version on public.parcels_canonical (dataset_version);

create trigger trg_parcels_canonical_updated_at
before update on public.parcels_canonical
for each row execute procedure update_updated_at_column();

-- 2. ZONING CANONICAL
create table if not exists public.zoning_canonical (
    id bigserial primary key,
    jurisdiction text not null,
    district_code text not null,
    district_name text,
    permitted_uses text,
    conditional_uses text,
    prohibited_uses text,
    height_limit numeric,
    height_limit_stories integer,
    far numeric,
    lot_coverage numeric,
    front_setback numeric,
    side_setback numeric,
    rear_setback numeric,
    corner_setback numeric,
    min_lot_size numeric,
    min_lot_width numeric,
    min_lot_depth numeric,
    overlay_flags text[],
    geom geometry(MultiPolygon, 4326) not null,
    dataset_version text not null,
    source_dataset text,
    source_layer_id uuid,
    mapserver_id uuid,
    etl_job_id uuid,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(jurisdiction, district_code, dataset_version)
);

create index if not exists idx_zoning_can_geom on public.zoning_canonical using gist (geom);
create index if not exists idx_zoning_can_jurisdiction on public.zoning_canonical (jurisdiction);
create index if not exists idx_zoning_can_code on public.zoning_canonical (district_code);
create index if not exists idx_zoning_can_version on public.zoning_canonical (dataset_version);

create trigger trg_zoning_canonical_updated_at
before update on public.zoning_canonical
for each row execute procedure update_updated_at_column();

-- 3. FEMA FLOOD CANONICAL
create table if not exists public.fema_flood_canonical (
    id bigserial primary key,
    jurisdiction text,
    county text,
    state text,
    flood_zone text not null,
    flood_zone_subtype text,
    bfe numeric,
    bfe_unit text default 'NAVD88',
    static_bfe numeric,
    floodway_flag boolean,
    coastal_flag boolean,
    panel_id text,
    effective_date date,
    geom geometry(MultiPolygon, 4326) not null,
    dataset_version text not null,
    source_dataset text,
    source_layer_id uuid,
    mapserver_id uuid,
    etl_job_id uuid,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_flood_can_geom on public.fema_flood_canonical using gist (geom);
create index if not exists idx_flood_can_zone on public.fema_flood_canonical (flood_zone);
create index if not exists idx_flood_can_county on public.fema_flood_canonical (county);
create index if not exists idx_flood_can_version on public.fema_flood_canonical (dataset_version);

create trigger trg_flood_canonical_updated_at
before update on public.fema_flood_canonical
for each row execute procedure update_updated_at_column();

-- 4. UTILITIES CANONICAL
create table if not exists public.utilities_canonical (
    id bigserial primary key,
    jurisdiction text not null,
    utility_type text not null,
    line_id text,
    facility_id text,
    diameter numeric,
    diameter_unit text,
    material text,
    length_ft numeric,
    install_year integer,
    install_date date,
    status text,
    owner text,
    operator text,
    capacity numeric,
    capacity_unit text,
    pressure numeric,
    pressure_unit text,
    depth numeric,
    geom geometry(MultiLineString, 4326) not null,
    dataset_version text not null,
    source_dataset text,
    source_layer_id uuid,
    mapserver_id uuid,
    etl_job_id uuid,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(jurisdiction, utility_type, line_id, dataset_version)
);

create index if not exists idx_utilities_can_geom on public.utilities_canonical using gist (geom);
create index if not exists idx_utilities_can_version on public.utilities_canonical (dataset_version);
create index if not exists idx_utilities_can_type on public.utilities_canonical (utility_type);

create trigger trg_utilities_canonical_updated_at
before update on public.utilities_canonical
for each row execute procedure update_updated_at_column();

-- 5. WETLANDS CANONICAL
create table if not exists public.wetlands_canonical (
    id bigserial primary key,
    wetland_code text not null,
    wetland_type text,
    system text,
    subsystem text,
    class text,
    subclass text,
    water_regime text,
    special_modifier text,
    area_acres numeric,
    geom geometry(MultiPolygon, 4326) not null,
    dataset_version text not null,
    source_dataset text,
    source_layer_id uuid,
    mapserver_id uuid,
    etl_job_id uuid,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_wetlands_can_geom on public.wetlands_canonical using gist (geom);
create index if not exists idx_wetlands_can_type on public.wetlands_canonical (wetland_type);
create index if not exists idx_wetlands_can_code on public.wetlands_canonical (wetland_code);
create index if not exists idx_wetlands_can_version on public.wetlands_canonical (dataset_version);

create trigger trg_wetlands_canonical_updated_at
before update on public.wetlands_canonical
for each row execute procedure update_updated_at_column();

-- 6. TRANSPORTATION CANONICAL
create table if not exists public.transportation_canonical (
    id bigserial primary key,
    jurisdiction text,
    county text,
    road_name text,
    road_class text,
    route_number text,
    aadt numeric,
    aadt_year integer,
    truck_percent numeric,
    lanes integer,
    surface_type text,
    speed_limit integer,
    geom geometry(MultiLineString, 4326) not null,
    dataset_version text not null,
    source_dataset text,
    source_layer_id uuid,
    mapserver_id uuid,
    etl_job_id uuid,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_transport_can_geom on public.transportation_canonical using gist (geom);
create index if not exists idx_transport_can_version on public.transportation_canonical (dataset_version);

create trigger trg_transport_canonical_updated_at
before update on public.transportation_canonical
for each row execute procedure update_updated_at_column();

-- Enable RLS
alter table public.parcels_canonical enable row level security;
alter table public.zoning_canonical enable row level security;
alter table public.fema_flood_canonical enable row level security;
alter table public.utilities_canonical enable row level security;
alter table public.wetlands_canonical enable row level security;
alter table public.transportation_canonical enable row level security;

-- Public read policies
create policy "Public read parcels_canonical" on public.parcels_canonical for select using (true);
create policy "Public read zoning_canonical" on public.zoning_canonical for select using (true);
create policy "Public read fema_flood_canonical" on public.fema_flood_canonical for select using (true);
create policy "Public read utilities_canonical" on public.utilities_canonical for select using (true);
create policy "Public read wetlands_canonical" on public.wetlands_canonical for select using (true);
create policy "Public read transportation_canonical" on public.transportation_canonical for select using (true);

-- Admin write policies
create policy "Admin write parcels_canonical" on public.parcels_canonical for all using (public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "Admin write zoning_canonical" on public.zoning_canonical for all using (public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "Admin write fema_flood_canonical" on public.fema_flood_canonical for all using (public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "Admin write utilities_canonical" on public.utilities_canonical for all using (public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "Admin write wetlands_canonical" on public.wetlands_canonical for all using (public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "Admin write transportation_canonical" on public.transportation_canonical for all using (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Service role write policies (ETL)
create policy "Service write parcels_canonical" on public.parcels_canonical for all using (auth.role() = 'service_role');
create policy "Service write zoning_canonical" on public.zoning_canonical for all using (auth.role() = 'service_role');
create policy "Service write fema_flood_canonical" on public.fema_flood_canonical for all using (auth.role() = 'service_role');
create policy "Service write utilities_canonical" on public.utilities_canonical for all using (auth.role() = 'service_role');
create policy "Service write wetlands_canonical" on public.wetlands_canonical for all using (auth.role() = 'service_role');
create policy "Service write transportation_canonical" on public.transportation_canonical for all using (auth.role() = 'service_role');

-- Table comments
comment on table public.parcels_canonical is 'Canonical parcel data - ETL data moat foundation';
comment on table public.zoning_canonical is 'Canonical zoning districts with development constraints';
comment on table public.fema_flood_canonical is 'Canonical FEMA NFHL flood zone data';
comment on table public.utilities_canonical is 'Canonical utility infrastructure (water, sewer, storm, gas, electric)';
comment on table public.wetlands_canonical is 'Canonical NWI wetlands with Cowardin classification';
comment on table public.transportation_canonical is 'Canonical road network with AADT traffic counts';