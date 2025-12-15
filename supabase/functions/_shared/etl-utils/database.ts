// deno-lint-ignore-file no-explicit-any
// Shared database utilities for GIS ETL operations
// Version: 1.0.0

// Insert single record with PostGIS geometry handling via RPC
export async function insertRecord(
  supabase: any, 
  tableName: string, 
  record: any
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('execute_canonical_insert', {
      p_table_name: tableName,
      p_record: record,
    });
    
    if (error) {
      console.error(`[etl] RPC insert error:`, error.message);
      return false;
    }
    
    return data?.success === true;
  } catch (err) {
    console.error(`[etl] Insert exception:`, err);
    return false;
  }
}

// Query existing record count for resume capability
export async function getExistingCount(
  supabase: any, 
  tableName: string, 
  layerKey: string
): Promise<number> {
  try {
    // Tables that use source_dataset for layer filtering
    const tablesWithSourceDataset = [
      'utilities_canonical', 
      'fema_flood_canonical', 
      'wetlands_canonical', 
      'transportation_canonical'
    ];
    
    if (tablesWithSourceDataset.includes(tableName)) {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq('source_dataset', layerKey);
      
      if (error) {
        console.log(`[etl] Count query error for ${tableName}:`, error.message);
        return 0;
      }
      return count || 0;
    }
    
    // For canonical_parcels, filter by jurisdiction if possible
    if (tableName === 'canonical_parcels') {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`[etl] Count query error for ${tableName}:`, error.message);
        return 0;
      }
      return count || 0;
    }
    
    // For other tables (CCN, pipelines), count all
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`[etl] Count query error for ${tableName}:`, error.message);
      return 0;
    }
    return count || 0;
  } catch (err) {
    console.log(`[etl] Count exception:`, err);
    return 0;
  }
}

// Log ETL operation to gis_fetch_logs
export async function logEtlOperation(
  supabase: any,
  operation: string,
  status: 'success' | 'partial' | 'error',
  recordsProcessed: number,
  durationMs: number,
  metadata: Record<string, any>
): Promise<void> {
  try {
    await supabase.from('gis_fetch_logs').insert({
      operation,
      status,
      records_processed: recordsProcessed,
      duration_ms: durationMs,
      metadata,
    });
  } catch {
    // Ignore log errors - don't fail the seeding operation
  }
}

// Get canonical table counts
export async function getTableCounts(supabase: any): Promise<Record<string, number>> {
  const tables = [
    'canonical_parcels', 
    'fema_flood_canonical', 
    'utilities_canonical', 
    'wetlands_canonical', 
    'transportation_canonical', 
    'utilities_ccn_canonical', 
    'pipelines_canonical'
  ];
  
  const counts: Record<string, number> = {};
  
  for (const table of tables) {
    try {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      counts[table] = count || 0;
    } catch {
      counts[table] = -1; // Table might not exist
    }
  }
  
  return counts;
}
