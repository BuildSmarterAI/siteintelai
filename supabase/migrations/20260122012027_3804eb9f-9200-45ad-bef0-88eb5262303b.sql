-- Fix remaining Security Definer Views (Part 2)
-- Recreate all user-defined views with SECURITY INVOKER
-- Note: geometry_columns and geography_columns are PostGIS system views

-- ============================================================
-- v_parcels - Applications as parcels view
-- ============================================================
DROP VIEW IF EXISTS public.v_parcels CASCADE;
CREATE VIEW public.v_parcels
WITH (security_invoker = true)
AS
SELECT 
    id AS application_id,
    formatted_address,
    property_address,
    geo_lat,
    geo_lng,
    parcel_id,
    county,
    city,
    neighborhood,
    zoning_code,
    overlay_district,
    lot_size_value,
    lot_size_unit,
    acreage_cad,
    elevation,
    ownership_status,
    existing_improvements,
    created_at,
    updated_at
FROM applications;

GRANT SELECT ON public.v_parcels TO authenticated;

-- ============================================================
-- v_parcels_current - Latest dataset version parcels
-- ============================================================
DROP VIEW IF EXISTS public.v_parcels_odata CASCADE;
DROP VIEW IF EXISTS public.v_parcels_current CASCADE;

CREATE VIEW public.v_parcels_current
WITH (security_invoker = true)
AS
SELECT 
    cp.id,
    cp.jurisdiction,
    cp.county_fips,
    cp.source_agency,
    cp.dataset_version,
    cp.source_parcel_id,
    cp.apn,
    cp.situs_address,
    cp.city,
    cp.state,
    cp.zip,
    cp.acreage,
    cp.land_use_code,
    cp.land_use_desc,
    cp.owner_name,
    cp.owner_mailing_address,
    cp.owner_city,
    cp.owner_state,
    cp.owner_zip,
    cp.centroid,
    cp.geom,
    cp.source_url,
    cp.source_system,
    cp.ingestion_run_id,
    cp.accuracy_tier,
    cp.confidence,
    cp.created_at,
    cp.updated_at
FROM canonical_parcels cp
JOIN (
    SELECT jurisdiction, max(dataset_version) AS dataset_version
    FROM canonical_parcels
    GROUP BY jurisdiction
) latest ON cp.jurisdiction = latest.jurisdiction AND cp.dataset_version = latest.dataset_version;

GRANT SELECT ON public.v_parcels_current TO authenticated;

-- ============================================================
-- v_parcels_odata - OData-ready parcels with GeoJSON
-- ============================================================
CREATE VIEW public.v_parcels_odata
WITH (security_invoker = true)
AS
SELECT 
    id,
    jurisdiction,
    county_fips,
    source_agency,
    dataset_version,
    source_parcel_id,
    apn,
    situs_address,
    city,
    state,
    zip,
    acreage,
    land_use_code,
    land_use_desc,
    owner_name,
    owner_mailing_address,
    owner_city,
    owner_state,
    owner_zip,
    st_asgeojson(centroid)::jsonb AS centroid_geojson,
    st_asgeojson(geom)::jsonb AS geom_geojson,
    created_at,
    updated_at
FROM v_parcels_current;

GRANT SELECT ON public.v_parcels_odata TO authenticated;

-- ============================================================
-- v_reports_public - Public report data with application info
-- ============================================================
DROP VIEW IF EXISTS public.v_reports_public CASCADE;
CREATE VIEW public.v_reports_public
WITH (security_invoker = true)
AS
SELECT 
    r.id,
    r.application_id,
    r.user_id,
    r.feasibility_score,
    r.score_band,
    r.report_type,
    r.created_at,
    r.updated_at,
    r.status,
    r.pdf_url,
    r.json_data,
    a.formatted_address,
    a.county,
    a.city,
    a.zoning_code,
    a.lot_size_value,
    a.lot_size_unit,
    a.intent_type
FROM reports r
JOIN applications a ON r.application_id = a.id;

GRANT SELECT ON public.v_reports_public TO authenticated;

-- ============================================================
-- regulatory_envelopes_geojson - Envelope data with GeoJSON
-- ============================================================
DROP VIEW IF EXISTS public.regulatory_envelopes_geojson CASCADE;
CREATE VIEW public.regulatory_envelopes_geojson
WITH (security_invoker = true)
AS
SELECT 
    id,
    application_id,
    st_asgeojson(parcel_geometry)::jsonb AS parcel_geometry_geojson,
    st_asgeojson(buildable_footprint_2d)::jsonb AS buildable_footprint_2d_geojson,
    far_cap,
    height_cap_ft,
    coverage_cap_pct,
    setbacks,
    exclusion_zones,
    constraints_version,
    constraints_source,
    computed_at
FROM regulatory_envelopes;

GRANT SELECT ON public.regulatory_envelopes_geojson TO authenticated;

COMMENT ON VIEW public.v_parcels IS 'Application data formatted as parcel-like records. Uses security_invoker to respect RLS.';
COMMENT ON VIEW public.v_parcels_current IS 'Latest version canonical parcels per jurisdiction. Uses security_invoker.';
COMMENT ON VIEW public.v_reports_public IS 'Reports with application context for display. Uses security_invoker to respect RLS.';