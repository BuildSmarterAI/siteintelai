-- Update RPC function to skip generated columns
CREATE OR REPLACE FUNCTION execute_canonical_insert(
  p_table TEXT,
  p_records JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record JSONB;
  v_inserted INT := 0;
  v_failed INT := 0;
  v_geom_wkt TEXT;
  v_sql TEXT;
  v_columns TEXT[];
  v_values TEXT[];
  v_col TEXT;
  v_val JSONB;
  v_generated_cols TEXT[];
BEGIN
  -- Validate table name to prevent SQL injection
  IF p_table NOT IN ('parcels_canonical', 'utilities_canonical', 'fema_flood_canonical', 'wetlands_canonical', 'transportation_canonical', 'zoning_canonical') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid table name');
  END IF;

  -- Get list of generated columns to skip
  SELECT array_agg(column_name::TEXT) INTO v_generated_cols
  FROM information_schema.columns 
  WHERE table_name = p_table 
    AND table_schema = 'public'
    AND is_generated = 'ALWAYS';
  
  v_generated_cols := COALESCE(v_generated_cols, ARRAY[]::TEXT[]);

  -- Process each record
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_records)
  LOOP
    BEGIN
      v_columns := ARRAY[]::TEXT[];
      v_values := ARRAY[]::TEXT[];
      v_geom_wkt := NULL;
      
      -- Extract columns and values
      FOR v_col IN SELECT * FROM jsonb_object_keys(v_record)
      LOOP
        -- Skip generated columns
        IF v_col = ANY(v_generated_cols) THEN
          CONTINUE;
        END IF;
        
        v_val := v_record->v_col;
        
        IF v_col = 'geom' THEN
          -- Handle geometry separately
          v_geom_wkt := v_record->>'geom';
        ELSE
          v_columns := array_append(v_columns, v_col);
          
          -- Handle null values
          IF v_val IS NULL OR v_val = 'null'::jsonb THEN
            v_values := array_append(v_values, 'NULL');
          ELSIF jsonb_typeof(v_val) = 'string' THEN
            v_values := array_append(v_values, format('%L', v_record->>v_col));
          ELSIF jsonb_typeof(v_val) = 'number' THEN
            v_values := array_append(v_values, v_record->>v_col);
          ELSIF jsonb_typeof(v_val) = 'boolean' THEN
            v_values := array_append(v_values, v_record->>v_col);
          ELSE
            v_values := array_append(v_values, format('%L', v_val::text));
          END IF;
        END IF;
      END LOOP;
      
      -- Add geometry column if present
      IF v_geom_wkt IS NOT NULL THEN
        v_columns := array_append(v_columns, 'geom');
        v_values := array_append(v_values, format('ST_GeomFromEWKT(%L)', v_geom_wkt));
      END IF;
      
      -- Build and execute INSERT
      v_sql := format(
        'INSERT INTO %I (%s) VALUES (%s)',
        p_table,
        array_to_string(v_columns, ', '),
        array_to_string(v_values, ', ')
      );
      
      EXECUTE v_sql;
      v_inserted := v_inserted + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
      RAISE NOTICE 'Insert error for table %, Error: %', p_table, SQLERRM;
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', v_inserted > 0,
    'inserted', v_inserted,
    'failed', v_failed
  );
END;
$$;