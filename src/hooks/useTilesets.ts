import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface Tileset {
  id: string;
  tileset_key: string;
  name: string;
  category: string;
  jurisdiction: string;
  tile_url_template: string;
  min_zoom: number;
  max_zoom: number;
  bounds: number[] | null;
  record_count: number | null;
  size_bytes: number | null;
  generated_at: string | null;
  expires_at: string | null;
  refresh_frequency_hours: number | null;
  is_active: boolean;
  vector_layers: any;
}

export interface TileJob {
  id: string;
  tileset_key: string;
  job_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  input_records: number | null;
  output_tiles: number | null;
  duration_ms: number | null;
  error_message: string | null;
  triggered_by: string | null;
  trigger_type: string | null;
}

/**
 * Fetch active tilesets from the catalog
 */
export function useTilesets(options?: { category?: string; jurisdiction?: string }) {
  return useQuery({
    queryKey: ['tilesets', options?.category, options?.jurisdiction],
    queryFn: async () => {
      logger.tile('useTilesets query started', {
        category: options?.category,
        jurisdiction: options?.jurisdiction,
      });

      let query = supabase
        .from('tilesets')
        .select('*')
        .eq('is_active', true)
        .order('generated_at', { ascending: false });

      if (options?.category) {
        query = query.eq('category', options.category as any);
      }

      if (options?.jurisdiction) {
        query = query.eq('jurisdiction', options.jurisdiction);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('useTilesets query FAILED', error);
        throw new Error(`Failed to fetch tilesets: ${error.message}`);
      }

      logger.tile('useTilesets query SUCCESS', {
        count: data?.length || 0,
        tilesets: data?.map(t => ({
          key: t.tileset_key,
          category: t.category,
          url: t.tile_url_template,
        })),
      });

      return (data || []) as unknown as Tileset[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch tile generation job history
 */
export function useTileJobs(options?: { tileset_key?: string; limit?: number }) {
  return useQuery({
    queryKey: ['tile_jobs', options?.tileset_key, options?.limit],
    queryFn: async () => {
      let query = supabase
        .from('tile_jobs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(options?.limit || 50);

      if (options?.tileset_key) {
        query = query.eq('tileset_key', options.tileset_key);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch tile jobs: ${error.message}`);
      }

      return (data || []) as unknown as TileJob[];
    },
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Get tile URL for a specific layer with the latest version
 */
export function useTileUrl(category: string, jurisdiction: string = 'tx') {
  const { data: tilesets } = useTilesets({ category, jurisdiction });

  const tileset = tilesets?.[0];

  if (!tileset) {
    return null;
  }

  return {
    url: tileset.tile_url_template,
    minZoom: tileset.min_zoom,
    maxZoom: tileset.max_zoom,
    generatedAt: tileset.generated_at,
    recordCount: tileset.record_count,
  };
}

/**
 * Get all active tile sources for MapLibre
 */
export function useVectorTileSources(jurisdiction: string = 'tx') {
  const { data: tilesets, isLoading, error } = useTilesets({ jurisdiction });

  const sources: Record<string, {
    type: 'vector';
    tiles: string[];
    minzoom: number;
    maxzoom: number;
    attribution?: string;
  }> = {};

  const layers: Record<string, {
    sourceLayer: string;
    category: string;
    generatedAt: string | null;
  }> = {};

  if (tilesets) {
    logger.tile('useVectorTileSources building sources from', tilesets.length, 'tilesets');
    
    for (const tileset of tilesets) {
      const tileUrl = tileset.tile_url_template;
      const sourceId = `siteintel-${tileset.category}`;

      logger.tile('Building source', {
        sourceId,
        category: tileset.category,
        tileUrl,
        minZoom: tileset.min_zoom,
        maxZoom: tileset.max_zoom,
      });

      sources[sourceId] = {
        type: 'vector',
        tiles: [tileUrl],
        minzoom: tileset.min_zoom,
        maxzoom: tileset.max_zoom,
        attribution: '© SiteIntel',
      };

      // Map category to source layer name (usually same as category)
      layers[sourceId] = {
        sourceLayer: tileset.category,
        category: tileset.category,
        generatedAt: tileset.generated_at,
      };
    }
    
    logger.tile('useVectorTileSources complete', {
      sourceCount: Object.keys(sources).length,
      sourceIds: Object.keys(sources),
    });
  }

  return { sources, layers, isLoading, error, tilesets };
}

/**
 * Calculate tileset freshness metrics
 */
export function useTilesetFreshness() {
  const { data: tilesets } = useTilesets();

  if (!tilesets) {
    return { fresh: 0, stale: 0, expired: 0 };
  }

  const now = new Date();
  let fresh = 0;
  let stale = 0;
  let expired = 0;

  for (const tileset of tilesets) {
    if (!tileset.generated_at) {
      stale++;
      continue;
    }

    const generatedAt = new Date(tileset.generated_at);
    const refreshHours = tileset.refresh_frequency_hours || 24;
    const ageHours = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60);

    if (ageHours < refreshHours) {
      fresh++;
    } else if (tileset.expires_at && now > new Date(tileset.expires_at)) {
      expired++;
    } else {
      stale++;
    }
  }

  return { fresh, stale, expired };
}
