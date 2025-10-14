-- Update the save_drawn_parcel_with_acreage function to support both insert and update
CREATE OR REPLACE FUNCTION public.save_drawn_parcel_with_acreage(
  p_user_id uuid,
  p_application_id uuid,
  p_name text,
  p_geometry jsonb,
  p_parcel_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  application_id uuid,
  name text,
  geometry geometry,
  acreage_calc numeric,
  source text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_geometry geometry;
  v_acreage numeric;
  v_id uuid;
BEGIN
  -- Convert JSON geometry to PostGIS geometry
  v_geometry := ST_SetSRID(ST_GeomFromGeoJSON(p_geometry::text), 4326);
  
  -- Calculate acreage: Convert square meters to acres (1 acre = 4046.86 sq meters)
  -- Use ST_Area with geography cast for accurate spherical calculation
  v_acreage := ST_Area(v_geometry::geography) / 4046.86;
  
  -- Check if this is an update or insert
  IF p_parcel_id IS NOT NULL THEN
    -- Update existing parcel
    UPDATE public.drawn_parcels
    SET 
      name = p_name,
      geometry = v_geometry,
      acreage_calc = v_acreage,
      updated_at = now()
    WHERE drawn_parcels.id = p_parcel_id
      AND drawn_parcels.user_id = p_user_id  -- Security: ensure user owns the parcel
    RETURNING 
      drawn_parcels.id,
      drawn_parcels.user_id,
      drawn_parcels.application_id,
      drawn_parcels.name,
      drawn_parcels.geometry,
      drawn_parcels.acreage_calc,
      drawn_parcels.source,
      drawn_parcels.created_at,
      drawn_parcels.updated_at
    INTO 
      id, user_id, application_id, name, geometry, acreage_calc, source, created_at, updated_at;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Parcel not found or access denied';
    END IF;
  ELSE
    -- Insert new parcel
    INSERT INTO public.drawn_parcels (
      user_id,
      application_id,
      name,
      geometry,
      acreage_calc,
      source
    )
    VALUES (
      p_user_id,
      p_application_id,
      p_name,
      v_geometry,
      v_acreage,
      'user_drawn'
    )
    RETURNING 
      drawn_parcels.id,
      drawn_parcels.user_id,
      drawn_parcels.application_id,
      drawn_parcels.name,
      drawn_parcels.geometry,
      drawn_parcels.acreage_calc,
      drawn_parcels.source,
      drawn_parcels.created_at,
      drawn_parcels.updated_at
    INTO 
      id, user_id, application_id, name, geometry, acreage_calc, source, created_at, updated_at;
  END IF;
  
  RETURN NEXT;
END;
$$;