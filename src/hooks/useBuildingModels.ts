/**
 * useBuildingModels Hook
 * Fetches building models from Supabase filtered by archetype
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BuildingModel {
  id: string;
  archetype_id: string;
  name: string;
  description: string | null;
  style: 'modern' | 'traditional' | 'industrial' | 'mixed';
  base_width_ft: number;
  base_depth_ft: number;
  base_height_ft: number;
  base_stories: number;
  glb_storage_path: string;
  thumbnail_url: string | null;
  preview_url: string | null;
  is_featured: boolean;
  min_scale: number;
  max_scale: number;
}

export interface ModelTransform {
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  rotationDeg: number;
  offsetX: number;
  offsetY: number;
}

export const DEFAULT_TRANSFORM: ModelTransform = {
  scaleX: 1.0,
  scaleY: 1.0,
  scaleZ: 1.0,
  rotationDeg: 0,
  offsetX: 0,
  offsetY: 0,
};

/**
 * Fetch all building models for a given archetype ID
 */
export function useBuildingModels(archetypeId: string | null) {
  return useQuery({
    queryKey: ['building-models', archetypeId],
    queryFn: async () => {
      if (!archetypeId) return [];
      
      // Map wizard archetype IDs to database archetype IDs
      const dbArchetypeId = mapArchetypeId(archetypeId);
      
      const { data, error } = await supabase
        .from('building_models')
        .select('*')
        .eq('archetype_id', dbArchetypeId)
        .eq('is_public', true)
        .order('is_featured', { ascending: false });
      
      if (error) {
        console.error('[useBuildingModels] Error fetching models:', error);
        throw error;
      }
      
      return (data || []) as BuildingModel[];
    },
    enabled: !!archetypeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch a single building model by ID
 */
export function useBuildingModel(modelId: string | null) {
  return useQuery({
    queryKey: ['building-model', modelId],
    queryFn: async () => {
      if (!modelId) return null;
      
      const { data, error } = await supabase
        .from('building_models')
        .select('*')
        .eq('id', modelId)
        .single();
      
      if (error) {
        console.error('[useBuildingModel] Error fetching model:', error);
        throw error;
      }
      
      return data as BuildingModel;
    },
    enabled: !!modelId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get signed URL for a GLB model file
 */
export async function getModelSignedUrl(storagePath: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('building-models')
      .createSignedUrl(storagePath, 3600); // 1 hour expiry
    
    if (error) {
      console.error('[getModelSignedUrl] Error:', error);
      return null;
    }
    
    return data.signedUrl;
  } catch (err) {
    console.error('[getModelSignedUrl] Exception:', err);
    return null;
  }
}

/**
 * Map wizard archetype IDs (snake_case) to database format
 */
function mapArchetypeId(wizardId: string): string {
  const mapping: Record<string, string> = {
    'single_story_retail_pad': 'single-story-retail',
    'multi_tenant_retail_strip': 'multi-tenant-strip',
    'medical_office': 'medical-office',
    'industrial_warehouse': 'industrial-warehouse',
    'low_rise_multifamily': 'low-rise-multifamily',
    'hotel_hospitality': 'hotel-hospitality',
    'qsr_drive_thru': 'qsr-drive-thru',
    'flex_light_mixed_use': 'flex-mixed-use',
  };
  
  return mapping[wizardId] || wizardId;
}

/**
 * Calculate final dimensions after applying transform
 */
export function calculateFinalDimensions(
  model: BuildingModel,
  transform: ModelTransform
): {
  widthFt: number;
  depthFt: number;
  heightFt: number;
  footprintSqft: number;
  gfa: number;
} {
  const widthFt = model.base_width_ft * transform.scaleX;
  const depthFt = model.base_depth_ft * transform.scaleY;
  const heightFt = model.base_height_ft * transform.scaleZ;
  const footprintSqft = widthFt * depthFt;
  const gfa = footprintSqft * model.base_stories;
  
  return { widthFt, depthFt, heightFt, footprintSqft, gfa };
}
