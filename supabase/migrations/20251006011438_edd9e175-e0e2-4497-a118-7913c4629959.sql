-- Change historical_flood_events from integer to jsonb
-- This will preserve existing integer values by converting them to jsonb
ALTER TABLE public.applications 
ALTER COLUMN historical_flood_events 
TYPE jsonb 
USING CASE 
  WHEN historical_flood_events IS NOT NULL 
  THEN jsonb_build_object('count', historical_flood_events)
  ELSE '[]'::jsonb
END;

-- Update the default to empty array
ALTER TABLE public.applications 
ALTER COLUMN historical_flood_events 
SET DEFAULT '[]'::jsonb;