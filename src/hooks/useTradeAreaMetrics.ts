import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TradeAreaMetrics {
  id: string;
  trade_area_id: string;
  total_population: number | null;
  median_income: number | null;
  mean_household_income: number | null;
  median_age: number | null;
  median_home_value: number | null;
  owner_occupied_pct: number | null;
  renter_occupied_pct: number | null;
  bachelor_degree_pct: number | null;
  unemployment_rate: number | null;
  growth_rate_5yr: number | null;
  retail_spending_index: number | null;
  workforce_availability_score: number | null;
  growth_potential_index: number | null;
  affluence_concentration: number | null;
  labor_pool_depth: number | null;
  daytime_population: number | null;
  total_housing_units: number | null;
  vacancy_rate: number | null;
  computed_at: string;
  data_sources: string[];
}

interface UseTradeAreaMetricsOptions {
  tradeAreaId?: string;
  centerLat?: number;
  centerLng?: number;
  radiusMiles?: number;
}

export function useTradeAreaMetrics(options: UseTradeAreaMetricsOptions) {
  const { tradeAreaId, centerLat, centerLng, radiusMiles } = options;

  return useQuery({
    queryKey: ['trade-area-metrics', tradeAreaId, centerLat, centerLng, radiusMiles],
    queryFn: async () => {
      // If we have a trade area ID, fetch stored metrics
      if (tradeAreaId) {
        const { data, error } = await supabase
          .from('market_metrics_trade_area')
          .select('*')
          .eq('trade_area_id', tradeAreaId)
          .order('computed_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as TradeAreaMetrics | null;
      }

      // Otherwise, try to get cached metrics for this location
      if (centerLat && centerLng) {
        // Simple geohash for caching (truncate to ~1km precision)
        const geohash = `${centerLat.toFixed(2)}_${centerLng.toFixed(2)}_${radiusMiles || 1}`;
        
        const { data, error } = await supabase
          .from('market_metrics_parcel_cache')
          .select('metrics')
          .eq('geohash', geohash)
          .gte('expires_at', new Date().toISOString())
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return (data?.metrics as unknown) as TradeAreaMetrics | null;
      }

      return null;
    },
    enabled: !!(tradeAreaId || (centerLat && centerLng)),
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
}

// Generate mock metrics for demo purposes
export function generateMockMetrics(radiusMiles: number = 1): TradeAreaMetrics {
  const basePopulation = radiusMiles * radiusMiles * 15000;
  
  return {
    id: 'mock',
    trade_area_id: 'mock',
    total_population: Math.round(basePopulation * (0.8 + Math.random() * 0.4)),
    median_income: Math.round(55000 + Math.random() * 40000),
    mean_household_income: Math.round(65000 + Math.random() * 50000),
    median_age: Math.round(32 + Math.random() * 15),
    median_home_value: Math.round(200000 + Math.random() * 300000),
    owner_occupied_pct: Math.round(40 + Math.random() * 40),
    renter_occupied_pct: Math.round(30 + Math.random() * 40),
    bachelor_degree_pct: Math.round(20 + Math.random() * 35),
    unemployment_rate: Math.round(3 + Math.random() * 5),
    growth_rate_5yr: Math.round(5 + Math.random() * 15),
    retail_spending_index: Math.round(80 + Math.random() * 40),
    workforce_availability_score: Math.round(60 + Math.random() * 30),
    growth_potential_index: Math.round(50 + Math.random() * 40),
    affluence_concentration: Math.round(40 + Math.random() * 50),
    labor_pool_depth: Math.round(55 + Math.random() * 35),
    daytime_population: Math.round(basePopulation * 1.2),
    total_housing_units: Math.round(basePopulation / 2.5),
    vacancy_rate: Math.round(5 + Math.random() * 10),
    computed_at: new Date().toISOString(),
    data_sources: ['census_acs_2022', 'esri_demographics'],
  };
}
