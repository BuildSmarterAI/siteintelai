-- Fix search_path for helper functions created in previous migration
CREATE OR REPLACE FUNCTION get_active_datasets(p_jurisdiction TEXT)
RETURNS SETOF public.datasets
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.datasets
  WHERE jurisdiction = p_jurisdiction
    AND status = 'active'
    AND (effective_to IS NULL OR effective_to > now())
  ORDER BY dataset_type, effective_from DESC;
$$;

CREATE OR REPLACE FUNCTION get_override_stats(p_application_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_build_object(
      'total_overrides', COUNT(*),
      'fields_overridden', array_agg(DISTINCT field_name),
      'avg_delta_percent', ROUND(AVG(ABS(delta_percent))::numeric, 2)
    ),
    '{}'::jsonb
  )
  FROM public.application_overrides
  WHERE application_id = p_application_id;
$$;