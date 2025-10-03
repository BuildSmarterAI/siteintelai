-- Add traffic-related columns to applications table for TxDOT AADT data
ALTER TABLE applications 
  ADD COLUMN IF NOT EXISTS traffic_aadt INTEGER,
  ADD COLUMN IF NOT EXISTS traffic_year INTEGER,
  ADD COLUMN IF NOT EXISTS traffic_segment_id TEXT,
  ADD COLUMN IF NOT EXISTS traffic_distance_ft NUMERIC,
  ADD COLUMN IF NOT EXISTS traffic_road_name TEXT,
  ADD COLUMN IF NOT EXISTS traffic_direction TEXT,
  ADD COLUMN IF NOT EXISTS traffic_map_url TEXT,
  ADD COLUMN IF NOT EXISTS truck_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS congestion_level TEXT;