import { useQuery } from '@tanstack/react-query';
import { logger } from "@/lib/logger";
import { supabase } from '@/integrations/supabase/client';
import { TradeAreaMetrics } from './useTradeAreaMetrics';
import { H3CellData } from './useH3Cells';

interface ComputeTradeAreaResponse {
  success: boolean;
  metrics: TradeAreaMetrics;
  cells: H3CellData[];
  cellCount: number;
  minValue: number;
  maxValue: number;
  coverage: {
    requestedCells: number;
    coveredCells: number;
    coveragePercent: number;
  };
  dataSource: string;
}

interface UseComputeTradeAreaOptions {
  centerLat: number;
  centerLng: number;
  radiusMiles: number;
  metric?: string;
  h3Resolution?: number;
  enabled?: boolean;
}

export function useComputeTradeAreaMetrics(options: UseComputeTradeAreaOptions) {
  const { 
    centerLat, 
    centerLng, 
    radiusMiles, 
    metric = 'population',
    h3Resolution = 8,
    enabled = true 
  } = options;

  // Round coordinates to 6 decimal places to prevent floating-point drift causing refetches
  const roundedLat = Math.round(centerLat * 1000000) / 1000000;
  const roundedLng = Math.round(centerLng * 1000000) / 1000000;

  return useQuery({
    queryKey: ['trade-area-computed', roundedLat, roundedLng, radiusMiles, metric, h3Resolution],
    queryFn: async (): Promise<ComputeTradeAreaResponse> => {
      logger.debug('useComputeTradeAreaMetrics', 'Fetching trade area data...');
      
      const { data, error } = await supabase.functions.invoke('compute-trade-area-metrics', {
        body: { 
          centerLat, 
          centerLng, 
          radiusMiles,
          metric,
          h3Resolution
        }
      });

      if (error) {
        logger.error('[useComputeTradeAreaMetrics] Error:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to compute trade area metrics');
      }

      logger.debug('useComputeTradeAreaMetrics', `Received ${data.cellCount} cells with ${data.coverage?.coveragePercent}% coverage`);
      return data;
    },
    enabled: enabled && !!centerLat && !!centerLng && radiusMiles > 0,
    staleTime: 1000 * 60 * 5, // 5 minute cache
    retry: 1,
  });
}
