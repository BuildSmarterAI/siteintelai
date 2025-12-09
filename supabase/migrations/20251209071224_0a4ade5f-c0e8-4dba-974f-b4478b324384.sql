-- ============================================================================
-- Canonical Spatial RPC Functions
-- Query canonical tables using PostGIS ST_Intersects and ST_DWithin
-- ============================================================================

-- 1. get_zoning_for_parcel: Returns all zoning districts that intersect with parcel
CREATE OR REPLACE FUNCTION public.get_zoning_for_parcel(
    parcel_geom geometry
)
RETURNS TABLE (
    district_code text,
    district_name text,
    height_limit numeric,
    height_limit_stories integer,
    far numeric,
    lot_coverage numeric,
    front_setback numeric,
    side_setback numeric,
    rear_setback numeric,
    corner_setback numeric,
    min_lot_size numeric,
    overlay_flags text[],
    intersection_area_sqft numeric,
    intersection_pct numeric,
    dataset_version text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        z.district_code,
        z.district_name,
        z.height_limit,
        z.height_limit_stories,
        z.far,
        z.lot_coverage,
        z.front_setback,
        z.side_setback,
        z.rear_setback,
        z.corner_setback,
        z.min_lot_size,
        z.overlay_flags,
        ST_Area(ST_Intersection(z.geom, parcel_geom)::geography)::numeric * 10.7639 as intersection_area_sqft,
        (ST_Area(ST_Intersection(z.geom, parcel_geom)::geography) / 
            NULLIF(ST_Area(parcel_geom::geography), 0) * 100)::numeric as intersection_pct,
        z.dataset_version
    FROM public.zoning_canonical z
    WHERE ST_Intersects(z.geom, parcel_geom)
    ORDER BY intersection_area_sqft DESC;
$$;

COMMENT ON FUNCTION public.get_zoning_for_parcel(geometry) IS 
'Returns all zoning districts that intersect with the given parcel geometry, ordered by intersection area.';


-- 2. get_flood_for_parcel: Returns all FEMA flood zones that intersect with parcel
CREATE OR REPLACE FUNCTION public.get_flood_for_parcel(
    parcel_geom geometry
)
RETURNS TABLE (
    flood_zone text,
    flood_zone_subtype text,
    bfe numeric,
    bfe_unit text,
    static_bfe numeric,
    floodway_flag boolean,
    coastal_flag boolean,
    panel_id text,
    effective_date date,
    zone_area_sqft numeric,
    zone_pct numeric,
    most_restrictive boolean,
    dataset_version text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    WITH flood_data AS (
        SELECT 
            f.flood_zone,
            f.flood_zone_subtype,
            f.bfe,
            f.bfe_unit,
            f.static_bfe,
            f.floodway_flag,
            f.coastal_flag,
            f.panel_id,
            f.effective_date,
            ST_Area(ST_Intersection(f.geom, parcel_geom)::geography)::numeric * 10.7639 as zone_area_sqft,
            (ST_Area(ST_Intersection(f.geom, parcel_geom)::geography) / 
                NULLIF(ST_Area(parcel_geom::geography), 0) * 100)::numeric as zone_pct,
            f.dataset_version,
            CASE 
                WHEN f.flood_zone LIKE 'V%' THEN 1
                WHEN f.flood_zone = 'AE' AND f.floodway_flag THEN 2
                WHEN f.flood_zone = 'AE' THEN 3
                WHEN f.flood_zone = 'AO' THEN 4
                WHEN f.flood_zone = 'AH' THEN 5
                WHEN f.flood_zone LIKE 'A%' THEN 6
                WHEN f.flood_zone = 'X' AND f.flood_zone_subtype = 'SHADED' THEN 7
                WHEN f.flood_zone = 'X' THEN 8
                ELSE 9
            END as risk_rank
        FROM public.fema_flood_canonical f
        WHERE ST_Intersects(f.geom, parcel_geom)
    )
    SELECT 
        fd.flood_zone,
        fd.flood_zone_subtype,
        fd.bfe,
        fd.bfe_unit,
        fd.static_bfe,
        fd.floodway_flag,
        fd.coastal_flag,
        fd.panel_id,
        fd.effective_date,
        fd.zone_area_sqft,
        fd.zone_pct,
        fd.risk_rank = MIN(fd.risk_rank) OVER () as most_restrictive,
        fd.dataset_version
    FROM flood_data fd
    ORDER BY fd.risk_rank, fd.zone_area_sqft DESC;
$$;

COMMENT ON FUNCTION public.get_flood_for_parcel(geometry) IS 
'Returns all FEMA flood zones intersecting the parcel, with most_restrictive flag for the highest-risk zone.';


-- 3. get_utilities_for_parcel: Returns nearby utility infrastructure within search radius
CREATE OR REPLACE FUNCTION public.get_utilities_for_parcel(
    parcel_geom geometry,
    search_radius_ft numeric DEFAULT 500
)
RETURNS TABLE (
    utility_type text,
    line_id text,
    facility_id text,
    diameter numeric,
    diameter_unit text,
    material text,
    install_year integer,
    status text,
    owner text,
    capacity numeric,
    capacity_unit text,
    distance_ft numeric,
    dataset_version text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        u.utility_type,
        u.line_id,
        u.facility_id,
        u.diameter,
        u.diameter_unit,
        u.material,
        u.install_year,
        u.status,
        u.owner,
        u.capacity,
        u.capacity_unit,
        (ST_Distance(u.geom::geography, parcel_geom::geography) * 3.28084)::numeric as distance_ft,
        u.dataset_version
    FROM public.utilities_canonical u
    WHERE ST_DWithin(
        u.geom::geography, 
        parcel_geom::geography, 
        search_radius_ft / 3.28084
    )
    ORDER BY u.utility_type, distance_ft;
$$;

COMMENT ON FUNCTION public.get_utilities_for_parcel(geometry, numeric) IS 
'Returns utility infrastructure within search_radius_ft of the parcel, grouped by utility type.';


-- 4. get_wetlands_for_parcel: Returns overlapping wetlands
CREATE OR REPLACE FUNCTION public.get_wetlands_for_parcel(
    parcel_geom geometry
)
RETURNS TABLE (
    wetland_code text,
    wetland_type text,
    system text,
    subsystem text,
    class text,
    subclass text,
    water_regime text,
    overlap_area_sqft numeric,
    overlap_area_acres numeric,
    overlap_pct numeric,
    dataset_version text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        w.wetland_code,
        w.wetland_type,
        w.system,
        w.subsystem,
        w.class,
        w.subclass,
        w.water_regime,
        ST_Area(ST_Intersection(w.geom, parcel_geom)::geography)::numeric * 10.7639 as overlap_area_sqft,
        (ST_Area(ST_Intersection(w.geom, parcel_geom)::geography)::numeric * 10.7639 / 43560) as overlap_area_acres,
        (ST_Area(ST_Intersection(w.geom, parcel_geom)::geography) / 
            NULLIF(ST_Area(parcel_geom::geography), 0) * 100)::numeric as overlap_pct,
        w.dataset_version
    FROM public.wetlands_canonical w
    WHERE ST_Intersects(w.geom, parcel_geom)
    ORDER BY overlap_area_sqft DESC;
$$;

COMMENT ON FUNCTION public.get_wetlands_for_parcel(geometry) IS 
'Returns all NWI wetlands overlapping the parcel with calculated overlap area and percentage.';


-- 5. get_transportation_for_parcel: Returns nearby roads with traffic data
CREATE OR REPLACE FUNCTION public.get_transportation_for_parcel(
    parcel_geom geometry,
    search_radius_ft numeric DEFAULT 1000
)
RETURNS TABLE (
    road_name text,
    road_class text,
    route_number text,
    lanes integer,
    speed_limit integer,
    aadt numeric,
    aadt_year integer,
    truck_percent numeric,
    surface_type text,
    distance_ft numeric,
    dataset_version text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        t.road_name,
        t.road_class,
        t.route_number,
        t.lanes,
        t.speed_limit,
        t.aadt,
        t.aadt_year,
        t.truck_percent,
        t.surface_type,
        (ST_Distance(t.geom::geography, parcel_geom::geography) * 3.28084)::numeric as distance_ft,
        t.dataset_version
    FROM public.transportation_canonical t
    WHERE ST_DWithin(
        t.geom::geography, 
        parcel_geom::geography, 
        search_radius_ft / 3.28084
    )
    ORDER BY distance_ft, t.aadt DESC NULLS LAST;
$$;

COMMENT ON FUNCTION public.get_transportation_for_parcel(geometry, numeric) IS 
'Returns roads within search_radius_ft of the parcel with traffic data, ordered by distance.';


-- 6. get_all_constraints_for_parcel: Composite function returning unified JSON
CREATE OR REPLACE FUNCTION public.get_all_constraints_for_parcel(
    parcel_geom geometry,
    utility_radius_ft numeric DEFAULT 500,
    transportation_radius_ft numeric DEFAULT 1000
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
    zoning_data jsonb;
    flood_data jsonb;
    utilities_data jsonb;
    wetlands_data jsonb;
    transportation_data jsonb;
    parcel_area_sqft numeric;
BEGIN
    parcel_area_sqft := ST_Area(parcel_geom::geography)::numeric * 10.7639;

    SELECT COALESCE(jsonb_agg(row_to_json(z)::jsonb), '[]'::jsonb)
    INTO zoning_data
    FROM get_zoning_for_parcel(parcel_geom) z;

    SELECT COALESCE(jsonb_agg(row_to_json(f)::jsonb), '[]'::jsonb)
    INTO flood_data
    FROM get_flood_for_parcel(parcel_geom) f;

    SELECT COALESCE(
        jsonb_object_agg(utility_type, utilities_by_type),
        '{}'::jsonb
    )
    INTO utilities_data
    FROM (
        SELECT 
            u.utility_type,
            jsonb_agg(row_to_json(u)::jsonb ORDER BY u.distance_ft) as utilities_by_type
        FROM get_utilities_for_parcel(parcel_geom, utility_radius_ft) u
        GROUP BY u.utility_type
    ) grouped;

    SELECT COALESCE(jsonb_agg(row_to_json(w)::jsonb), '[]'::jsonb)
    INTO wetlands_data
    FROM get_wetlands_for_parcel(parcel_geom) w;

    SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
    INTO transportation_data
    FROM get_transportation_for_parcel(parcel_geom, transportation_radius_ft) t;

    result := jsonb_build_object(
        'parcel_area_sqft', parcel_area_sqft,
        'parcel_area_acres', parcel_area_sqft / 43560,
        'zoning', zoning_data,
        'flood', flood_data,
        'utilities', utilities_data,
        'wetlands', wetlands_data,
        'transportation', transportation_data,
        'summary', jsonb_build_object(
            'zoning_count', jsonb_array_length(zoning_data),
            'flood_zones_count', jsonb_array_length(flood_data),
            'wetlands_count', jsonb_array_length(wetlands_data),
            'roads_count', jsonb_array_length(transportation_data),
            'has_floodway', EXISTS (
                SELECT 1 FROM jsonb_array_elements(flood_data) f 
                WHERE (f->>'floodway_flag')::boolean = true
            ),
            'has_wetlands', jsonb_array_length(wetlands_data) > 0,
            'total_wetland_pct', (
                SELECT COALESCE(SUM((w->>'overlap_pct')::numeric), 0)
                FROM jsonb_array_elements(wetlands_data) w
            )
        ),
        'queried_at', now()
    );

    RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_all_constraints_for_parcel(geometry, numeric, numeric) IS 
'Composite function returning all constraints (zoning, flood, utilities, wetlands, transportation) as unified JSON.';


-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_zoning_for_parcel(geometry) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_flood_for_parcel(geometry) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_utilities_for_parcel(geometry, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_wetlands_for_parcel(geometry) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_transportation_for_parcel(geometry, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_constraints_for_parcel(geometry, numeric, numeric) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_zoning_for_parcel(geometry) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_flood_for_parcel(geometry) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_utilities_for_parcel(geometry, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_wetlands_for_parcel(geometry) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_transportation_for_parcel(geometry, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_all_constraints_for_parcel(geometry, numeric, numeric) TO service_role;