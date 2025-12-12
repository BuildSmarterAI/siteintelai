-- Add new traffic-related columns to applications table for TxDOT AADT integration
-- These support roadway classification, peak hour estimation, and signal distance

-- Road classification (arterial/collector/local)
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS road_classification text;

-- Peak hour volume (estimated from AADT × K-factor)
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS peak_hour_volume integer;

-- Distance to nearest signalized intersection (when available)
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS nearest_signal_distance_ft numeric;

-- Traffic data source attribution
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS traffic_data_source text;

-- Add comments for documentation
COMMENT ON COLUMN public.applications.road_classification IS 'FHWA functional classification: arterial, collector, or local';
COMMENT ON COLUMN public.applications.peak_hour_volume IS 'Estimated peak hour volume (AADT × K-factor, typically 10%)';
COMMENT ON COLUMN public.applications.nearest_signal_distance_ft IS 'Distance in feet to nearest signalized intersection';
COMMENT ON COLUMN public.applications.traffic_data_source IS 'Source of traffic data (e.g., TxDOT_AADT)';

-- Create index for traffic queries
CREATE INDEX IF NOT EXISTS idx_applications_road_classification 
ON public.applications(road_classification) 
WHERE road_classification IS NOT NULL;