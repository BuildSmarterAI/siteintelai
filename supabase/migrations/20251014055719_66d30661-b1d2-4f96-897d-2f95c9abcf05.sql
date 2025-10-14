-- Create function to save drawn parcel and calculate acreage using PostGIS
CREATE OR REPLACE FUNCTION public.save_drawn_parcel_with_acreage(
  p_user_id uuid,
  p_name text,
  p_geometry text,
  p_application_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_geom geometry;
  v_acreage numeric;
  v_parcel_id uuid;
  v_result json;
BEGIN
  -- Convert GeoJSON to PostGIS geometry
  v_geom := ST_GeomFromGeoJSON(p_geometry);
  
  -- Transform to SRID 4326 if not already
  IF ST_SRID(v_geom) = 0 THEN
    v_geom := ST_SetSRID(v_geom, 4326);
  END IF;
  
  -- Validate geometry is a Polygon
  IF GeometryType(v_geom) != 'POLYGON' THEN
    RAISE EXCEPTION 'Geometry must be a Polygon';
  END IF;
  
  -- Calculate acreage using existing calculate_acreage function
  v_acreage := public.calculate_acreage(v_geom);
  
  -- Insert drawn parcel
  INSERT INTO public.drawn_parcels (
    user_id,
    name,
    geometry,
    acreage_calc,
    application_id,
    source
  ) VALUES (
    p_user_id,
    p_name,
    v_geom,
    v_acreage,
    p_application_id,
    'user_drawn'
  )
  RETURNING id INTO v_parcel_id;
  
  -- Return result as JSON with GeoJSON geometry
  SELECT json_build_object(
    'id', v_parcel_id,
    'name', p_name,
    'acreage_calc', v_acreage,
    'geometry', ST_AsGeoJSON(v_geom)::json,
    'created_at', now()
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;