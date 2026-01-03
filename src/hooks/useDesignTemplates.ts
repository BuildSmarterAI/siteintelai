/**
 * useDesignTemplates Hook
 * Fetches and caches design templates from database
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DesignTemplate, UseType } from '@/types/wizard';

interface UseDesignTemplatesOptions {
  useTypes?: UseType[];
  onlyDefaults?: boolean;
}

export function useDesignTemplates(options: UseDesignTemplatesOptions = {}) {
  const { useTypes, onlyDefaults } = options;

  return useQuery({
    queryKey: ['design-templates', useTypes, onlyDefaults],
    queryFn: async () => {
      let query = supabase
        .from('design_templates')
        .select('*')
        .order('sort_order', { ascending: true });

      if (useTypes && useTypes.length > 0) {
        query = query.in('use_type', useTypes);
      }

      if (onlyDefaults) {
        query = query.eq('is_recommended_default', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Templates] Fetch error:', error);
        throw error;
      }

      return (data || []) as DesignTemplate[];
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - templates rarely change
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days cache
  });
}

/**
 * Get templates grouped by use type
 */
export function useTemplatesByUseType() {
  const { data: templates, ...rest } = useDesignTemplates();

  const grouped = templates?.reduce((acc, template) => {
    const useType = template.use_type as UseType;
    if (!acc[useType]) {
      acc[useType] = [];
    }
    acc[useType].push(template);
    return acc;
  }, {} as Record<UseType, DesignTemplate[]>);

  return { templates, grouped, ...rest };
}
