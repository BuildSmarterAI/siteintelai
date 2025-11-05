import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { debounce } from 'lodash-es';
import { useMemo } from 'react';
import type { HIIGeoJSON, HIIGeoJSONParams } from '../types';

interface UseHiiGeoJSONOptions extends HIIGeoJSONParams {
  enabled?: boolean;
  debounceMs?: number;
}

export const useHiiGeoJSON = ({ 
  minLng, 
  minLat, 
  maxLng, 
  maxLat, 
  months_back = 12,
  enabled = true,
  debounceMs = 300 
}: UseHiiGeoJSONOptions) => {
  // Validate bounds
  const isValidBounds = useMemo(() => {
    return minLng < maxLng && minLat < maxLat &&
           !isNaN(minLng) && !isNaN(minLat) && 
           !isNaN(maxLng) && !isNaN(maxLat);
  }, [minLng, minLat, maxLng, maxLat]);

  const query = useQuery({
    queryKey: ['hii-geojson', minLng, minLat, maxLng, maxLat, months_back],
    queryFn: async () => {
      console.log('[useHiiGeoJSON] Fetching GeoJSON for bbox:', { minLng, minLat, maxLng, maxLat });
      
      const { data, error } = await supabase.functions.invoke('hii-geojson', {
        body: { minLng, minLat, maxLng, maxLat, months_back }
      });

      if (error) {
        console.error('[useHiiGeoJSON] Error:', error);
        toast.error('Failed to load hospitality data');
        throw error;
      }

      if (!data?.success) {
        console.error('[useHiiGeoJSON] API returned error:', data?.error);
        toast.error(data?.error || 'Failed to load GeoJSON data');
        throw new Error(data?.error || 'Failed to load GeoJSON data');
      }

      console.log('[useHiiGeoJSON] Success: loaded', data.data?.features?.length || 0, 'features');
      return data.data as HIIGeoJSON;
    },
    enabled: enabled && isValidBounds,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  return query;
};

// Debounced version for map viewport changes
export const useDebouncedHiiGeoJSON = (
  options: UseHiiGeoJSONOptions
) => {
  const debouncedFetch = useMemo(
    () => debounce(() => options, options.debounceMs || 300),
    [options.debounceMs]
  );

  return useHiiGeoJSON(options);
};
