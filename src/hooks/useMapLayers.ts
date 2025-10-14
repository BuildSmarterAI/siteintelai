import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MapLayersData {
  parcel: any | null;
  floodZones: any[];
  utilities: any[];
  traffic: any[];
  employmentCenters: any[];
}

/**
 * Custom hook to fetch and transform map layer data from Supabase
 * 
 * Transforms stored geospatial data into MapLibre-compatible formats
 * with React Query caching for optimal performance.
 * 
 * @param applicationId - The application ID to fetch data for
 * @returns Query result with layer data
 */
export function useMapLayers(applicationId: string) {
  return useQuery<MapLayersData>({
    queryKey: ['map-layers', applicationId],
    queryFn: async () => {
      // Fetch application data with relevant fields
      const { data: app, error } = await supabase
        .from('applications')
        .select('parcel_id, formatted_address, employment_clusters')
        .eq('id', applicationId)
        .single();

      if (error) throw error;

      // Note: Parcel geometry, flood zones, utilities, and traffic layers
      // will be populated in future phases when geospatial data is integrated
      // For now, returning empty arrays as placeholders
      
      const parcel = null; // TODO: Fetch from parcel table or enrichment_raw

      const floodZones: any[] = []; // TODO: Fetch from fema_flood_zones table

      const utilities: any[] = []; // TODO: Fetch from utility data

      const traffic: any[] = []; // TODO: Fetch from txdot_traffic_segments table

      // Transform employment centers from JSON to array format
      const employmentCenters = Array.isArray(app.employment_clusters)
        ? app.employment_clusters
            .filter((c: any) => c.lat && c.lng)
            .map((cluster: any) => ({
              name: cluster.name || 'Employment Center',
              jobs: cluster.jobs || 0,
              distance_miles: cluster.distance || 0,
              coordinates: [cluster.lat, cluster.lng] as [number, number],
            }))
        : [];

      return {
        parcel,
        floodZones,
        utilities,
        traffic,
        employmentCenters,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000,   // 10 minutes garbage collection
    enabled: !!applicationId,
  });
}
