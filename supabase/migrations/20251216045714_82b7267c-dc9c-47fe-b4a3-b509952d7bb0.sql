-- Market Intelligence Tables for Trade Area Analysis

-- Market Presets: Predefined trade area configurations
CREATE TABLE public.market_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  preset_type TEXT NOT NULL CHECK (preset_type IN ('radius', 'drive_time', 'custom')),
  radius_miles NUMERIC,
  drive_time_minutes INTEGER,
  is_default BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trade Areas: User-drawn or preset trade area boundaries
CREATE TABLE public.trade_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  preset_id UUID REFERENCES public.market_presets(id),
  center_lat NUMERIC NOT NULL,
  center_lng NUMERIC NOT NULL,
  geometry JSONB NOT NULL, -- GeoJSON polygon
  area_sq_miles NUMERIC,
  h3_resolution INTEGER DEFAULT 8,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trade Area H3 Cells: H3 hexagon cells for granular visualization
CREATE TABLE public.trade_area_h3 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_area_id UUID NOT NULL REFERENCES public.trade_areas(id) ON DELETE CASCADE,
  h3_index TEXT NOT NULL,
  resolution INTEGER NOT NULL,
  population INTEGER,
  median_income NUMERIC,
  spending_index NUMERIC,
  growth_rate NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Market Metrics Trade Area: Aggregated metrics per trade area
CREATE TABLE public.market_metrics_trade_area (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_area_id UUID NOT NULL REFERENCES public.trade_areas(id) ON DELETE CASCADE,
  total_population INTEGER,
  median_income NUMERIC,
  mean_household_income NUMERIC,
  median_age NUMERIC,
  median_home_value NUMERIC,
  owner_occupied_pct NUMERIC,
  renter_occupied_pct NUMERIC,
  bachelor_degree_pct NUMERIC,
  unemployment_rate NUMERIC,
  growth_rate_5yr NUMERIC,
  retail_spending_index NUMERIC,
  workforce_availability_score NUMERIC,
  growth_potential_index NUMERIC,
  affluence_concentration NUMERIC,
  labor_pool_depth NUMERIC,
  daytime_population INTEGER,
  total_housing_units INTEGER,
  vacancy_rate NUMERIC,
  computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_sources JSONB DEFAULT '[]'::jsonb
);

-- Market Metrics Parcel Cache: Cached metrics per parcel location
CREATE TABLE public.market_metrics_parcel_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parcel_id TEXT,
  center_lat NUMERIC NOT NULL,
  center_lng NUMERIC NOT NULL,
  geohash TEXT NOT NULL,
  metrics JSONB NOT NULL,
  computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

-- Create indexes
CREATE INDEX idx_trade_areas_user_id ON public.trade_areas(user_id);
CREATE INDEX idx_trade_areas_center ON public.trade_areas(center_lat, center_lng);
CREATE INDEX idx_trade_area_h3_trade_area_id ON public.trade_area_h3(trade_area_id);
CREATE INDEX idx_trade_area_h3_index ON public.trade_area_h3(h3_index);
CREATE INDEX idx_market_metrics_trade_area_id ON public.market_metrics_trade_area(trade_area_id);
CREATE INDEX idx_market_metrics_parcel_cache_geohash ON public.market_metrics_parcel_cache(geohash);
CREATE INDEX idx_market_metrics_parcel_cache_expires ON public.market_metrics_parcel_cache(expires_at);

-- Enable RLS
ALTER TABLE public.market_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_area_h3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_metrics_trade_area ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_metrics_parcel_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for market_presets (public read)
CREATE POLICY "Public read access to market_presets"
  ON public.market_presets FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage market_presets"
  ON public.market_presets FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for trade_areas
CREATE POLICY "Users can view own trade_areas"
  ON public.trade_areas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own trade_areas"
  ON public.trade_areas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trade_areas"
  ON public.trade_areas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trade_areas"
  ON public.trade_areas FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for trade_area_h3
CREATE POLICY "Users can view own trade_area_h3"
  ON public.trade_area_h3 FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.trade_areas ta
    WHERE ta.id = trade_area_h3.trade_area_id AND ta.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own trade_area_h3"
  ON public.trade_area_h3 FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.trade_areas ta
    WHERE ta.id = trade_area_h3.trade_area_id AND ta.user_id = auth.uid()
  ));

-- RLS Policies for market_metrics_trade_area
CREATE POLICY "Users can view own market_metrics"
  ON public.market_metrics_trade_area FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.trade_areas ta
    WHERE ta.id = market_metrics_trade_area.trade_area_id AND ta.user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage market_metrics"
  ON public.market_metrics_trade_area FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for market_metrics_parcel_cache
CREATE POLICY "Public read access to parcel_cache"
  ON public.market_metrics_parcel_cache FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage parcel_cache"
  ON public.market_metrics_parcel_cache FOR ALL
  USING (auth.role() = 'service_role');

-- Seed default presets
INSERT INTO public.market_presets (name, description, preset_type, radius_miles, drive_time_minutes, is_default, display_order) VALUES
  ('1-Mile Radius', 'Immediate neighborhood trade area', 'radius', 1, NULL, true, 1),
  ('3-Mile Radius', 'Primary trade area for most retail', 'radius', 3, NULL, false, 2),
  ('5-Mile Radius', 'Extended trade area for destination retail', 'radius', 5, NULL, false, 3),
  ('15-Min Drive', '15-minute drive time isochrone', 'drive_time', NULL, 15, false, 4),
  ('Custom Area', 'Draw a custom trade area polygon', 'custom', NULL, NULL, false, 5);