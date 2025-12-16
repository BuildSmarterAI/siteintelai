import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface TradeArea {
  id: string;
  user_id: string;
  name: string;
  preset_id: string | null;
  center_lat: number;
  center_lng: number;
  geometry: Json;
  area_sq_miles: number | null;
  h3_resolution: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTradeAreaInput {
  name: string;
  preset_id?: string;
  center_lat: number;
  center_lng: number;
  geometry: Json;
  area_sq_miles?: number;
  h3_resolution?: number;
}

export function useTradeAreas() {
  const queryClient = useQueryClient();

  const { data: tradeAreas = [], isLoading, error } = useQuery({
    queryKey: ['trade-areas'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('trade_areas')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TradeArea[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateTradeAreaInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('trade_areas')
        .insert({
          name: input.name,
          preset_id: input.preset_id,
          center_lat: input.center_lat,
          center_lng: input.center_lng,
          geometry: input.geometry,
          area_sq_miles: input.area_sq_miles,
          h3_resolution: input.h3_resolution,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TradeArea;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trade-areas'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trade_areas')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trade-areas'] });
    },
  });

  return {
    tradeAreas,
    isLoading,
    error,
    createTradeArea: createMutation.mutateAsync,
    deleteTradeArea: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
