-- Add GIS & Enrichment Fields (Hidden)
ALTER TABLE public.applications ADD COLUMN geo_lat numeric;
ALTER TABLE public.applications ADD COLUMN geo_lng numeric;
ALTER TABLE public.applications ADD COLUMN formatted_address text;
ALTER TABLE public.applications ADD COLUMN place_id text;
ALTER TABLE public.applications ADD COLUMN neighborhood_raw text;
ALTER TABLE public.applications ADD COLUMN sublocality text;
ALTER TABLE public.applications ADD COLUMN locality text;
ALTER TABLE public.applications ADD COLUMN administrative_area_level_2 text;
ALTER TABLE public.applications ADD COLUMN submarket_enriched text;
ALTER TABLE public.applications ADD COLUMN zoning_code text;
ALTER TABLE public.applications ADD COLUMN overlay_district text;
ALTER TABLE public.applications ADD COLUMN floodplain text;
ALTER TABLE public.applications ADD COLUMN water_lines jsonb;
ALTER TABLE public.applications ADD COLUMN sewer_lines jsonb;
ALTER TABLE public.applications ADD COLUMN storm_lines jsonb;
ALTER TABLE public.applications ADD COLUMN elevation numeric;
ALTER TABLE public.applications ADD COLUMN topography_map_url text;
ALTER TABLE public.applications ADD COLUMN aerial_imagery_url text;

-- Add AI Output Fields (Hidden)
ALTER TABLE public.applications ADD COLUMN executive_summary_output text;
ALTER TABLE public.applications ADD COLUMN property_overview_output text;
ALTER TABLE public.applications ADD COLUMN zoning_output text;
ALTER TABLE public.applications ADD COLUMN utilities_output text;
ALTER TABLE public.applications ADD COLUMN market_output text;
ALTER TABLE public.applications ADD COLUMN costs_output text;
ALTER TABLE public.applications ADD COLUMN schedule_output text;
ALTER TABLE public.applications ADD COLUMN highest_best_use_output text;
ALTER TABLE public.applications ADD COLUMN conclusion_output text;

-- Create indexes for JSONB fields for efficient querying
CREATE INDEX idx_applications_water_lines ON public.applications USING GIN(water_lines);
CREATE INDEX idx_applications_sewer_lines ON public.applications USING GIN(sewer_lines);
CREATE INDEX idx_applications_storm_lines ON public.applications USING GIN(storm_lines);

-- Create indexes for commonly queried GIS fields
CREATE INDEX idx_applications_geo_location ON public.applications(geo_lat, geo_lng);
CREATE INDEX idx_applications_locality ON public.applications(locality);
CREATE INDEX idx_applications_place_id ON public.applications(place_id);