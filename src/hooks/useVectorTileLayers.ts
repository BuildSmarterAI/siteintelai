import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useVectorTileSources } from './useTilesets';

/**
 * Vector tile layer configuration for MapLibre
 * Defines styling for each layer category from CloudFront CDN tiles
 */
const VECTOR_TILE_LAYER_CONFIG = {
  parcels: {
    sourceId: 'siteintel-parcels',
    layers: [
      {
        id: 'siteintel-parcels-fill',
        type: 'fill' as const,
        'source-layer': 'parcels',
        paint: {
          'fill-color': '#6366F1', // Indigo for parcels
          'fill-opacity': 0.2,
        },
      },
      {
        id: 'siteintel-parcels-line',
        type: 'line' as const,
        'source-layer': 'parcels',
        paint: {
          'line-color': '#6366F1',
          'line-width': 1,
        },
      },
    ],
  },
  flood: {
    sourceId: 'siteintel-flood',
    layers: [
      {
        id: 'siteintel-flood-fill',
        type: 'fill' as const,
        'source-layer': 'flood',
        paint: {
          'fill-color': [
            'match',
            ['get', 'zone'],
            'AE', '#EF4444', // Red for AE zone
            'VE', '#DC2626', // Darker red for VE zone
            'AO', '#F97316', // Orange for AO zone
            'AH', '#FB923C', // Light orange for AH zone
            'X', '#10B981', // Green for X zone (minimal risk)
            'X500', '#6EE7B7', // Light green for X500
            '#6B7280', // Gray default
          ],
          'fill-opacity': 0.4,
        },
      },
      {
        id: 'siteintel-flood-line',
        type: 'line' as const,
        'source-layer': 'flood',
        paint: {
          'line-color': '#991B1B',
          'line-width': 1,
        },
      },
    ],
  },
  utilities: {
    sourceId: 'siteintel-utilities',
    layers: [
      {
        id: 'siteintel-utilities-line',
        type: 'line' as const,
        'source-layer': 'utilities',
        paint: {
          'line-color': [
            'match',
            ['get', 'utility_type'],
            'water', '#3B82F6', // Blue for water
            'sewer', '#10B981', // Green for sewer
            'storm', '#14B8A6', // Teal for storm
            'gas', '#F59E0B', // Amber for gas
            'electric', '#FBBF24', // Yellow for electric
            '#6B7280', // Gray default
          ],
          'line-width': 2,
        },
      },
    ],
  },
  transportation: {
    sourceId: 'siteintel-transportation',
    layers: [
      {
        id: 'siteintel-transportation-line',
        type: 'line' as const,
        'source-layer': 'transportation',
        paint: {
          'line-color': '#F59E0B', // Amber for roads
          'line-width': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'aadt'], 0],
            0, 1,
            10000, 2,
            50000, 4,
            100000, 6,
          ],
        },
      },
    ],
  },
  zoning: {
    sourceId: 'siteintel-zoning',
    layers: [
      {
        id: 'siteintel-zoning-fill',
        type: 'fill' as const,
        'source-layer': 'zoning',
        paint: {
          'fill-color': '#EC4899', // Pink for zoning
          'fill-opacity': 0.2,
        },
      },
      {
        id: 'siteintel-zoning-line',
        type: 'line' as const,
        'source-layer': 'zoning',
        paint: {
          'line-color': '#BE185D',
          'line-width': 1,
          'line-dasharray': [2, 2],
        },
      },
    ],
  },
  wetlands: {
    sourceId: 'siteintel-wetlands',
    layers: [
      {
        id: 'siteintel-wetlands-fill',
        type: 'fill' as const,
        'source-layer': 'wetlands',
        paint: {
          'fill-color': '#0D9488', // Teal for wetlands
          'fill-opacity': 0.3,
        },
      },
    ],
  },
};

interface UseVectorTileLayersOptions {
  map: maplibregl.Map | null;
  mapLoaded: boolean;
  jurisdiction?: string;
  layerVisibility?: Record<string, boolean>;
}

interface VectorTileLayerResult {
  sources: Record<string, any>;
  layers: Record<string, any>;
  isLoading: boolean;
  error: Error | null;
  hasVectorTiles: boolean;
  activeSources: string[];
}

/**
 * Hook to manage vector tile layers from CloudFront CDN
 * Automatically adds sources and layers to MapLibre map when available
 * Falls back gracefully when vector tiles are not available
 */
export function useVectorTileLayers({
  map,
  mapLoaded,
  jurisdiction = 'tx',
  layerVisibility = {},
}: UseVectorTileLayersOptions): VectorTileLayerResult {
  const { sources, layers, isLoading, error, tilesets } = useVectorTileSources(jurisdiction);
  const addedSourcesRef = useRef<Set<string>>(new Set());
  const addedLayersRef = useRef<Set<string>>(new Set());

  // Add vector tile sources and layers to map
  useEffect(() => {
    if (!map || !mapLoaded || isLoading) return;
    if (!tilesets || tilesets.length === 0) return;

    // Wait for style to be loaded
    if (!map.isStyleLoaded()) {
      const handler = () => {
        // Re-trigger effect after style loads
      };
      map.once('styledata', handler);
      return;
    }

    // Add sources that don't exist yet
    for (const [sourceId, sourceConfig] of Object.entries(sources)) {
      if (!map.getSource(sourceId) && !addedSourcesRef.current.has(sourceId)) {
        try {
          map.addSource(sourceId, sourceConfig);
          addedSourcesRef.current.add(sourceId);
          console.log(`📍 Added vector tile source: ${sourceId}`);
        } catch (err) {
          console.warn(`Failed to add source ${sourceId}:`, err);
        }
      }
    }

    // Add layers based on available sources
    for (const [category, config] of Object.entries(VECTOR_TILE_LAYER_CONFIG)) {
      if (!sources[config.sourceId]) continue;

      for (const layerConfig of config.layers) {
        if (map.getLayer(layerConfig.id) || addedLayersRef.current.has(layerConfig.id)) {
          continue;
        }

        try {
          const layerSpec: any = {
            id: layerConfig.id,
            type: layerConfig.type,
            source: config.sourceId,
            'source-layer': layerConfig['source-layer'],
            paint: layerConfig.paint,
            layout: {
              visibility: 'visible',
            },
          };
          map.addLayer(layerSpec);
          addedLayersRef.current.add(layerConfig.id);
          console.log(`🎨 Added vector tile layer: ${layerConfig.id}`);
        } catch (err) {
          console.warn(`Failed to add layer ${layerConfig.id}:`, err);
        }
      }
    }

    // Cleanup on unmount
    return () => {
      // Don't remove sources/layers on unmount - they persist with the map
    };
  }, [map, mapLoaded, sources, layers, isLoading, tilesets]);

  // Update layer visibility when toggle changes
  useEffect(() => {
    if (!map || !mapLoaded) return;

    // Map visibility keys to vector tile layer prefixes
    const visibilityMap: Record<string, string[]> = {
      hcadParcels: ['siteintel-parcels-fill', 'siteintel-parcels-line'],
      floodZones: ['siteintel-flood-fill', 'siteintel-flood-line'],
      utilities: ['siteintel-utilities-line'],
      traffic: ['siteintel-transportation-line'],
      zoningDistricts: ['siteintel-zoning-fill', 'siteintel-zoning-line'],
    };

    for (const [key, layerIds] of Object.entries(visibilityMap)) {
      const isVisible = layerVisibility[key] ?? true;
      const visibility = isVisible ? 'visible' : 'none';

      for (const layerId of layerIds) {
        if (map.getLayer(layerId)) {
          try {
            map.setLayoutProperty(layerId, 'visibility', visibility);
          } catch (err) {
            // Layer might not exist yet
          }
        }
      }
    }
  }, [map, mapLoaded, layerVisibility]);

  return {
    sources,
    layers,
    isLoading,
    error,
    hasVectorTiles: Object.keys(sources).length > 0,
    activeSources: Array.from(addedSourcesRef.current),
  };
}

/**
 * Check if a specific layer category has vector tiles available
 */
export function hasVectorTileSource(
  sources: Record<string, any>,
  category: 'parcels' | 'flood' | 'utilities' | 'transportation' | 'zoning' | 'wetlands'
): boolean {
  const sourceId = `siteintel-${category}`;
  return sourceId in sources;
}

export { VECTOR_TILE_LAYER_CONFIG };
