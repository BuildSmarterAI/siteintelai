-- Drop and recreate the execute_canonical_insert function with proper geometry handling
DROP FUNCTION IF EXISTS execute_canonical_insert(text, jsonb);

CREATE OR REPLACE FUNCTION execute_canonical_insert(
  p_table_name text,
  p_record jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sql text;
  v_columns text[];
  v_values text[];
  v_key text;
  v_value jsonb;
  v_result jsonb;
BEGIN
  -- Build dynamic INSERT statement
  FOR v_key, v_value IN SELECT * FROM jsonb_each(p_record)
  LOOP
    -- Skip generated columns
    IF v_key = 'lot_size_acres' THEN
      CONTINUE;
    END IF;
    
    v_columns := array_append(v_columns, quote_ident(v_key));
    
    -- Handle geometry column specially - convert GeoJSON to PostGIS
    IF v_key = 'geom' AND v_value IS NOT NULL AND v_value != 'null'::jsonb THEN
      v_values := array_append(v_values, 
        format('ST_SetSRID(ST_GeomFromGeoJSON(%L), 4326)', v_value::text)
      );
    ELSIF v_value IS NULL OR v_value = 'null'::jsonb THEN
      v_values := array_append(v_values, 'NULL');
    ELSIF jsonb_typeof(v_value) = 'string' THEN
      v_values := array_append(v_values, quote_literal(v_value #>> '{}'));
    ELSIF jsonb_typeof(v_value) = 'number' THEN
      v_values := array_append(v_values, v_value::text);
    ELSIF jsonb_typeof(v_value) = 'boolean' THEN
      v_values := array_append(v_values, v_value::text);
    ELSE
      v_values := array_append(v_values, quote_literal(v_value::text));
    END IF;
  END LOOP;
  
  -- Construct and execute the INSERT
  v_sql := format(
    'INSERT INTO %I (%s) VALUES (%s) RETURNING to_jsonb(%I.*)',
    p_table_name,
    array_to_string(v_columns, ', '),
    array_to_string(v_values, ', '),
    p_table_name
  );
  
  EXECUTE v_sql INTO v_result;
  
  RETURN jsonb_build_object('success', true, 'data', v_result);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'sql', v_sql);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION execute_canonical_insert(text, jsonb) TO service_role;