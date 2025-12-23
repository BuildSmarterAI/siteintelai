-- Create user_saved_locations table for recent searches and favorites
CREATE TABLE public.user_saved_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    query TEXT NOT NULL,
    query_type TEXT NOT NULL CHECK (query_type IN ('address', 'apn', 'coordinates', 'intersection', 'draw')),
    lat NUMERIC,
    lng NUMERIC,
    parcel_id TEXT,
    county TEXT,
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    use_count INTEGER NOT NULL DEFAULT 1,
    last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_user_saved_locations_user_id ON public.user_saved_locations(user_id);
CREATE INDEX idx_user_saved_locations_last_used ON public.user_saved_locations(user_id, last_used_at DESC);
CREATE INDEX idx_user_saved_locations_favorites ON public.user_saved_locations(user_id, is_favorite) WHERE is_favorite = true;

-- Enable RLS
ALTER TABLE public.user_saved_locations ENABLE ROW LEVEL SECURITY;

-- Users can only view their own saved locations
CREATE POLICY "Users can view own saved locations"
ON public.user_saved_locations
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own saved locations
CREATE POLICY "Users can insert own saved locations"
ON public.user_saved_locations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved locations
CREATE POLICY "Users can update own saved locations"
ON public.user_saved_locations
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own saved locations
CREATE POLICY "Users can delete own saved locations"
ON public.user_saved_locations
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_user_saved_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_saved_locations_updated_at
BEFORE UPDATE ON public.user_saved_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_user_saved_locations_updated_at();