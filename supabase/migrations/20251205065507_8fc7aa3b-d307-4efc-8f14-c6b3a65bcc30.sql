-- =============================================
-- PHASE 1: Multi-County Parcel Selection System
-- Database Foundation
-- =============================================

-- 1. Counties Registry Table
CREATE TABLE public.counties (
  county_id TEXT PRIMARY KEY,
  cad_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  state_code TEXT NOT NULL DEFAULT 'TX',
  fips_code TEXT,
  data_source_url TEXT,
  data_source_type TEXT DEFAULT 'arcgis_rest',
  max_record_count INTEGER DEFAULT 1000,
  projection_srid INTEGER DEFAULT 4326,
  native_srid INTEGER,
  update_frequency TEXT DEFAULT 'monthly',
  last_sync_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  field_mappings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Unified Parcels Table with PostGIS Geometry
CREATE TABLE public.parcels (
  parcel_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county_id TEXT NOT NULL REFERENCES public.counties(county_id),
  geometry GEOMETRY(Polygon, 4326) NOT NULL,
  centroid GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_Centroid(geometry)) STORED,
  
  -- County-specific IDs (nullable, only one per parcel)
  hcad_num TEXT,
  fbcad_acct TEXT,
  mcad_parcel_id TEXT,
  tcad_prop_id TEXT,
  bcad_prop_id TEXT,
  dcad_acct TEXT,
  tad_account TEXT,
  wcad_parcel_id TEXT,
  
  -- Normalized attributes
  situs_address TEXT,
  situs_city TEXT,
  situs_zip TEXT,
  owner_name TEXT,
  owner_address TEXT,
  legal_description TEXT,
  subdivision TEXT,
  lot TEXT,
  block TEXT,
  
  -- Values
  land_value NUMERIC,
  improvement_value NUMERIC,
  total_value NUMERIC,
  assessed_value NUMERIC,
  
  -- Physical attributes
  acreage NUMERIC,
  sqft NUMERIC,
  year_built INTEGER,
  land_use_code TEXT,
  land_use_description TEXT,
  zoning_code TEXT,
  
  -- Metadata
  source_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Parcel Index for Fast CAD/APN Lookup
CREATE TABLE public.parcel_index (
  id SERIAL PRIMARY KEY,
  parcel_uuid UUID NOT NULL REFERENCES public.parcels(parcel_uuid) ON DELETE CASCADE,
  identifier TEXT NOT NULL,
  identifier_normalized TEXT NOT NULL,
  county_id TEXT NOT NULL REFERENCES public.counties(county_id),
  id_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(identifier_normalized, county_id, id_type)
);

-- 4. Address Points Table (TxGIO 911 Data)
CREATE TABLE public.address_points (
  address_id SERIAL PRIMARY KEY,
  geometry GEOMETRY(Point, 4326) NOT NULL,
  full_address TEXT,
  house_number TEXT,
  street_prefix TEXT,
  street_name TEXT,
  street_suffix TEXT,
  street_post_dir TEXT,
  unit_type TEXT,
  unit_number TEXT,
  city TEXT,
  state TEXT DEFAULT 'TX',
  zip TEXT,
  county_id TEXT REFERENCES public.counties(county_id),
  source TEXT DEFAULT 'txgio_911',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Geocoder Cache Table
CREATE TABLE public.geocoder_cache (
  input_hash TEXT PRIMARY KEY,
  input_query TEXT NOT NULL,
  query_type TEXT NOT NULL,
  geometry GEOMETRY(Point, 4326),
  parcel_uuid UUID REFERENCES public.parcels(parcel_uuid),
  county_id TEXT REFERENCES public.counties(county_id),
  confidence NUMERIC,
  source TEXT NOT NULL,
  result_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')
);

-- 6. Cross Street Index Table
CREATE TABLE public.cross_street_index (
  id SERIAL PRIMARY KEY,
  geometry GEOMETRY(Point, 4326) NOT NULL,
  street1_name TEXT NOT NULL,
  street2_name TEXT NOT NULL,
  city TEXT,
  county_id TEXT REFERENCES public.counties(county_id),
  intersection_type TEXT DEFAULT 'physical',
  source TEXT DEFAULT 'computed',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================

-- Parcels indexes
CREATE INDEX idx_parcels_geometry ON public.parcels USING GIST(geometry);
CREATE INDEX idx_parcels_centroid ON public.parcels USING GIST(centroid);
CREATE INDEX idx_parcels_county ON public.parcels(county_id);
CREATE INDEX idx_parcels_hcad ON public.parcels(hcad_num) WHERE hcad_num IS NOT NULL;
CREATE INDEX idx_parcels_fbcad ON public.parcels(fbcad_acct) WHERE fbcad_acct IS NOT NULL;
CREATE INDEX idx_parcels_mcad ON public.parcels(mcad_parcel_id) WHERE mcad_parcel_id IS NOT NULL;
CREATE INDEX idx_parcels_tcad ON public.parcels(tcad_prop_id) WHERE tcad_prop_id IS NOT NULL;
CREATE INDEX idx_parcels_bcad ON public.parcels(bcad_prop_id) WHERE bcad_prop_id IS NOT NULL;
CREATE INDEX idx_parcels_dcad ON public.parcels(dcad_acct) WHERE dcad_acct IS NOT NULL;
CREATE INDEX idx_parcels_tad ON public.parcels(tad_account) WHERE tad_account IS NOT NULL;
CREATE INDEX idx_parcels_wcad ON public.parcels(wcad_parcel_id) WHERE wcad_parcel_id IS NOT NULL;
CREATE INDEX idx_parcels_situs ON public.parcels(situs_address);
CREATE INDEX idx_parcels_updated ON public.parcels(updated_at);

-- Parcel index indexes
CREATE INDEX idx_parcel_index_identifier ON public.parcel_index(identifier_normalized);
CREATE INDEX idx_parcel_index_county ON public.parcel_index(county_id);
CREATE INDEX idx_parcel_index_type ON public.parcel_index(id_type);

-- Address points indexes
CREATE INDEX idx_address_points_geometry ON public.address_points USING GIST(geometry);
CREATE INDEX idx_address_points_city ON public.address_points(city);
CREATE INDEX idx_address_points_zip ON public.address_points(zip);
CREATE INDEX idx_address_points_county ON public.address_points(county_id);
CREATE INDEX idx_address_points_street ON public.address_points(street_name);

-- Geocoder cache indexes
CREATE INDEX idx_geocoder_cache_expires ON public.geocoder_cache(expires_at);
CREATE INDEX idx_geocoder_cache_type ON public.geocoder_cache(query_type);

-- Cross street index indexes
CREATE INDEX idx_cross_street_geometry ON public.cross_street_index USING GIST(geometry);
CREATE INDEX idx_cross_street_streets ON public.cross_street_index(street1_name, street2_name);
CREATE INDEX idx_cross_street_city ON public.cross_street_index(city);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcel_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.address_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geocoder_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_street_index ENABLE ROW LEVEL SECURITY;

-- Public read access for all reference tables
CREATE POLICY "Public read access to counties" ON public.counties FOR SELECT USING (true);
CREATE POLICY "Public read access to parcels" ON public.parcels FOR SELECT USING (true);
CREATE POLICY "Public read access to parcel_index" ON public.parcel_index FOR SELECT USING (true);
CREATE POLICY "Public read access to address_points" ON public.address_points FOR SELECT USING (true);
CREATE POLICY "Public read access to geocoder_cache" ON public.geocoder_cache FOR SELECT USING (true);
CREATE POLICY "Public read access to cross_street_index" ON public.cross_street_index FOR SELECT USING (true);

-- Admin management policies
CREATE POLICY "Admins can manage counties" ON public.counties FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage parcels" ON public.parcels FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage parcel_index" ON public.parcel_index FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage address_points" ON public.address_points FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage geocoder_cache" ON public.geocoder_cache FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage cross_street_index" ON public.cross_street_index FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role insert for geocoder cache (edge functions)
CREATE POLICY "Service can insert geocoder_cache" ON public.geocoder_cache FOR INSERT WITH CHECK (true);

-- =============================================
-- SEED DATA: Texas Counties Registry
-- =============================================

INSERT INTO public.counties (county_id, cad_name, display_name, fips_code, data_source_url, data_source_type, max_record_count, native_srid, field_mappings) VALUES
('HARRIS', 'HCAD', 'Harris County', '48201', 
 'https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0',
 'arcgis_rest', 1000, 2278,
 '{"parcel_id": "HCAD_NUM", "account": "acct_num", "owner": "owner_name_1", "address": "situs_address", "city": "city", "zip": "zip", "land_value": "land_val", "impr_value": "imprv_val", "total_value": "tot_market_val", "acreage": "acreage_1", "year_built": "year_built", "legal": "legal_dscr_1"}'::jsonb),

('FORT_BEND', 'FBCAD', 'Fort Bend County', '48157',
 'https://gisweb.fbcad.org/arcgis/rest/services/Hosted/FBCAD_Public_Data/FeatureServer/0',
 'arcgis_rest', 2000, 2278,
 '{"parcel_id": "propnumber", "account": "account", "owner": "ownername", "address": "situs", "total_value": "totalvalue", "land_value": "landvalue"}'::jsonb),

('MONTGOMERY', 'MCAD', 'Montgomery County', '48339',
 'https://gis.mctx.org/arcgis/rest/services/MCAD/Parcels/MapServer/0',
 'arcgis_rest', 2000, 4326,
 '{"parcel_id": "PARCEL_ID", "account": "ACCT_NUM", "owner": "OWNER", "address": "ADDRESS"}'::jsonb),

('TRAVIS', 'TCAD', 'Travis County', '48453',
 'https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/TCAD_Parcels_2024/FeatureServer/0',
 'arcgis_rest', 2000, 4326,
 '{"parcel_id": "PROP_ID", "account": "geo_id", "owner": "owner_name", "address": "situs_address", "total_value": "appraised_val"}'::jsonb),

('BEXAR', 'BCAD', 'Bexar County', '48029',
 'https://maps.bexar.org/arcgis/rest/services/BCAD/Parcels/MapServer/0',
 'arcgis_rest', 1000, 4326,
 '{"parcel_id": "PropID", "account": "AcctNumb", "owner": "OwnerName", "address": "SitusAddr"}'::jsonb),

('DALLAS', 'DCAD', 'Dallas County', '48113',
 'https://services6.arcgis.com/gVPg84LQ3nWvGDCN/arcgis/rest/services/Parcels_Public/FeatureServer/0',
 'arcgis_rest', 2000, 4326,
 '{"parcel_id": "Acct", "account": "Acct"}'::jsonb),

('TARRANT', 'TAD', 'Tarrant County', '48439',
 'https://mapit.tarrantcounty.com/arcgis/rest/services/Parcels/MapServer/0',
 'arcgis_rest', 10000, 4326,
 '{"parcel_id": "TAXPIN", "account": "ACCOUNT", "owner": "OWNER_NAME", "address": "SITUS_ADDR", "total_value": "TOTAL_VALUE", "acreage": "ACRES"}'::jsonb),

('WILLIAMSON', 'WCAD', 'Williamson County', '48491',
 'https://gis.wilco.org/arcgis/rest/services/WCAD/Parcels/MapServer/0',
 'arcgis_rest', 2000, 4326,
 '{"parcel_id": "QuickRefID", "account": "PropertyNumber", "owner": "OwnerName", "address": "SitusAddress"}'::jsonb);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to normalize parcel identifiers for indexing
CREATE OR REPLACE FUNCTION public.normalize_parcel_identifier(identifier TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT UPPER(REGEXP_REPLACE(identifier, '[^A-Za-z0-9]', '', 'g'))
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_parcel_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER trigger_parcels_updated
  BEFORE UPDATE ON public.parcels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_parcel_timestamp();

CREATE TRIGGER trigger_counties_updated
  BEFORE UPDATE ON public.counties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_parcel_timestamp();

CREATE TRIGGER trigger_address_points_updated
  BEFORE UPDATE ON public.address_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_parcel_timestamp();