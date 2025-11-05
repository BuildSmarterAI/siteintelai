import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { HIIScoreResult, HIIScoreParams } from '../types';

interface UseHiiScoreOptions extends HIIScoreParams {
  enabled?: boolean;
}

export const useHiiScore = ({ 
  lat, 
  lon, 
  radius_m = 1609, 
  months_back = 12,
  enabled = true 
}: UseHiiScoreOptions) => {
  return useQuery({
    queryKey: ['hii-score', lat, lon, radius_m, months_back],
    queryFn: async () => {
      console.log(`[useHiiScore] Fetching HII score for lat=${lat}, lon=${lon}, radius=${radius_m}m`);
      
      const { data, error } = await supabase.functions.invoke('hii-score', {
        body: { lat, lon, radius_m, months_back }
      });

      if (error) {
        console.error('[useHiiScore] Error:', error);
        toast.error('Failed to load HII score');
        throw error;
      }

      if (!data?.success) {
        console.error('[useHiiScore] API returned error:', data?.error);
        toast.error(data?.error || 'Failed to calculate HII score');
        throw new Error(data?.error || 'Failed to calculate HII score');
      }

      console.log('[useHiiScore] Success:', data.data);
      return data.data as HIIScoreResult;
    },
    enabled: enabled && !!lat && !!lon,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};
