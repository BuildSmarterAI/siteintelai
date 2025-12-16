import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

export interface MarketPreset {
  id: string;
  name: string;
  description: string | null;
  preset_type: 'radius' | 'drive_time' | 'custom';
  radius_miles: number | null;
  drive_time_minutes: number | null;
  is_default: boolean;
  display_order: number;
}

export function useMarketPresets() {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const { data: presets = [], isLoading, error } = useQuery({
    queryKey: ['market-presets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_presets')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as MarketPreset[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  const selectedPreset = presets.find(p => p.id === selectedPresetId) 
    || presets.find(p => p.is_default) 
    || presets[0];

  return {
    presets,
    isLoading,
    error,
    selectedPreset,
    selectedPresetId: selectedPreset?.id || null,
    setSelectedPresetId,
  };
}
