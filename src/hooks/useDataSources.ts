import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DataSource {
  id: string;
  server_key: string;
  server_name: string;
  base_url: string;
  service_type: string;
  jurisdiction: string;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
  dataset_family: string | null;
  agency: string | null;
  update_frequency: string | null;
  accuracy_tier: string | null;
  reliability_score: number | null;
  notes: string | null;
  ingestion_run_id: string | null;
}

// Map DB fields to display names
export const mapSourceFields = (source: any): DataSource => ({
  ...source,
  name: source.server_name,
  source_type: source.service_type,
});

export interface DataSourceVersion {
  id: string;
  map_server_id: string;
  dataset_version: string;
  schema_hash: string | null;
  field_schema: Record<string, unknown> | null;
  ingested_at: string;
  ingestion_run_id: string | null;
  diff_from_previous: Record<string, unknown> | null;
  record_count: number | null;
  created_at: string;
}

export interface DataSourceError {
  id: string;
  map_server_id: string;
  error_type: string;
  error_message: string | null;
  status_code: number | null;
  layer_id: number | null;
  endpoint_url: string | null;
  occurred_at: string;
}

export interface DataSourceFormData {
  server_key: string;
  server_name: string;
  base_url: string;
  service_type: string;
  jurisdiction: string;
  is_active: boolean;
  dataset_family: string | null;
  agency: string | null;
  update_frequency: string | null;
  accuracy_tier: string | null;
  reliability_score: number | null;
  notes: string | null;
}

// Helper functions
export const getReliabilityColor = (score: number | null): string => {
  if (score === null) return 'bg-muted text-muted-foreground';
  if (score >= 80) return 'bg-green-500/20 text-green-600 dark:text-green-400';
  if (score >= 50) return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400';
  return 'bg-red-500/20 text-red-600 dark:text-red-400';
};

export const getAccuracyTierColor = (tier: string | null): string => {
  switch (tier) {
    case 'T1': return 'bg-primary/20 text-primary';
    case 'T2': return 'bg-accent/20 text-accent-foreground';
    case 'T3': return 'bg-muted text-muted-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

export const getHealthStatus = (source: DataSource): { status: string; color: string } => {
  if (!source.is_active) return { status: 'inactive', color: 'bg-muted text-muted-foreground' };
  if (!source.last_sync_at) return { status: 'never synced', color: 'bg-yellow-500/20 text-yellow-600' };
  
  const lastSync = new Date(source.last_sync_at);
  const hoursSince = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
  
  if (hoursSince < 24) return { status: 'healthy', color: 'bg-green-500/20 text-green-600' };
  if (hoursSince < 168) return { status: 'stale', color: 'bg-yellow-500/20 text-yellow-600' };
  return { status: 'degraded', color: 'bg-red-500/20 text-red-600' };
};

// Fetch all data sources
export const useDataSources = (filters?: {
  jurisdiction?: string;
  dataset_family?: string;
  is_active?: boolean;
  accuracy_tier?: string;
}) => {
  return useQuery({
    queryKey: ['data-sources', filters],
    queryFn: async () => {
      let query = supabase
        .from('map_servers')
        .select('*')
        .order('name');

      if (filters?.jurisdiction) {
        query = query.eq('jurisdiction', filters.jurisdiction);
      }
      if (filters?.dataset_family) {
        query = query.eq('dataset_family', filters.dataset_family);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.accuracy_tier) {
        query = query.eq('accuracy_tier', filters.accuracy_tier);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DataSource[];
    },
  });
};

// Fetch single data source
export const useDataSource = (id: string) => {
  return useQuery({
    queryKey: ['data-source', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('map_servers')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as DataSource;
    },
    enabled: !!id,
  });
};

// Fetch layers for a data source
export const useDataSourceLayers = (mapServerId: string) => {
  return useQuery({
    queryKey: ['data-source-layers', mapServerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('map_server_layers')
        .select('*')
        .eq('map_server_id', mapServerId)
        .order('layer_id');
      if (error) throw error;
      return data;
    },
    enabled: !!mapServerId,
  });
};

// Fetch versions for a data source
export const useDataSourceVersions = (mapServerId?: string) => {
  return useQuery({
    queryKey: ['data-source-versions', mapServerId],
    queryFn: async () => {
      let query = supabase
        .from('data_source_versions')
        .select('*, map_servers(name, server_key)')
        .order('ingested_at', { ascending: false });

      if (mapServerId) {
        query = query.eq('map_server_id', mapServerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

// Fetch errors for a data source
export const useDataSourceErrors = (mapServerId?: string) => {
  return useQuery({
    queryKey: ['data-source-errors', mapServerId],
    queryFn: async () => {
      let query = supabase
        .from('data_source_errors')
        .select('*, map_servers(name, server_key)')
        .order('occurred_at', { ascending: false })
        .limit(100);

      if (mapServerId) {
        query = query.eq('map_server_id', mapServerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

// Create data source
export const useCreateDataSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: DataSourceFormData) => {
      const { data, error } = await supabase
        .from('map_servers')
        .insert(formData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-sources'] });
      toast.success('Data source created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create data source: ${error.message}`);
    },
  });
};

// Update data source
export const useUpdateDataSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...formData }: DataSourceFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('map_servers')
        .update({ ...formData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['data-sources'] });
      queryClient.invalidateQueries({ queryKey: ['data-source', variables.id] });
      toast.success('Data source updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update data source: ${error.message}`);
    },
  });
};

// Delete data source
export const useDeleteDataSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('map_servers')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-sources'] });
      toast.success('Data source deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete data source: ${error.message}`);
    },
  });
};

// Create version snapshot
export const useCreateVersionSnapshot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      mapServerId, 
      version, 
      fieldSchema,
      recordCount
    }: { 
      mapServerId: string; 
      version: string; 
      fieldSchema?: Record<string, unknown>;
      recordCount?: number;
    }) => {
      // Generate schema hash
      const schemaHash = fieldSchema 
        ? btoa(JSON.stringify(fieldSchema)).slice(0, 32) 
        : null;

      const { data, error } = await supabase
        .from('data_source_versions')
        .insert({
          map_server_id: mapServerId,
          dataset_version: version,
          schema_hash: schemaHash,
          field_schema: fieldSchema,
          record_count: recordCount,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['data-source-versions', variables.mapServerId] });
      toast.success('Version snapshot created');
    },
    onError: (error) => {
      toast.error(`Failed to create version snapshot: ${error.message}`);
    },
  });
};

// Get unique filter options
export const useDataSourceFilterOptions = () => {
  return useQuery({
    queryKey: ['data-source-filter-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('map_servers')
        .select('jurisdiction, dataset_family, accuracy_tier');
      
      if (error) throw error;

      const jurisdictions = [...new Set(data.map(d => d.jurisdiction).filter(Boolean))];
      const families = [...new Set(data.map(d => d.dataset_family).filter(Boolean))];
      const tiers = [...new Set(data.map(d => d.accuracy_tier).filter(Boolean))];

      return { jurisdictions, families, tiers };
    },
  });
};
