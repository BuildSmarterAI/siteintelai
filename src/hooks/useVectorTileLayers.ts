import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { useVectorTileSources } from './useTilesets';

/**
 * Vector tile layer configuration for MapLibre
 * Defines styling for each layer category from CloudFront CDN tiles
 * Uses SiteIntel brand colors: Feasibility Orange #FF7A00, Data Cyan #06B6D4
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
          'fill-color': '#FF7A00', // Feasibility Orange
          'fill-opacity': 0.15,
        },
      },
      {
        id: 'siteintel-parcels-line',
        type: 'line' as const,
        'source-layer': 'parcels',
        paint: {
          'line-color': '#FF7A00', // Feasibility Orange
          'line-width': 1.5,
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
  styleVersion?: number; // Increment to force re-add after style changes
  onParcelClick?: (feature: any) => void;
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
  styleVersion = 0,
  onParcelClick,
}: UseVectorTileLayersOptions): VectorTileLayerResult {
  const { sources, layers, isLoading, error, tilesets } = useVectorTileSources(jurisdiction);
  const addedSourcesRef = useRef<Set<string>>(new Set());
  const addedLayersRef = useRef<Set<string>>(new Set());
  const clickHandlerRef = useRef<((e: any) => void) | null>(null);
  const errorHandlerRef = useRef<((e: any) => void) | null>(null);

  console.log('🔍 TILE DEBUG: useVectorTileLayers render', {
    hasMap: !!map,
    mapLoaded,
    isLoading,
    tilesetCount: tilesets?.length || 0,
    sourceCount: Object.keys(sources).length,
    styleVersion,
  });

  // Function to add all sources and layers
  const addSourcesAndLayers = useCallback(() => {
    if (!map || !map.isStyleLoaded()) {
      console.log('🔍 TILE DEBUG: addSourcesAndLayers skipped - map not ready', {
        hasMap: !!map,
        styleLoaded: map?.isStyleLoaded?.() || false,
      });
      return;
    }
    
    console.log('🔍 TILE DEBUG: addSourcesAndLayers starting', {
      sourcesToAdd: Object.keys(sources),
    });
    
    // Clear refs since we're re-adding (style may have cleared them)
    addedSourcesRef.current.clear();
    addedLayersRef.current.clear();

    // Set up tile error handler
    if (errorHandlerRef.current) {
      map.off('error', errorHandlerRef.current);
    }
    errorHandlerRef.current = (e: any) => {
      if (e.error?.status === 403 || e.error?.message?.includes('403')) {
        console.error('🔍 TILE DEBUG: Tile load 403 error (Access Denied)', {
          sourceId: e.sourceId,
          tileUrl: e.tile?.url || e.error?.url,
          error: e.error,
        });
      } else if (e.sourceId?.startsWith('siteintel-')) {
        console.error('🔍 TILE DEBUG: Tile load error', {
          sourceId: e.sourceId,
          error: e.error,
        });
      }
    };
    map.on('error', errorHandlerRef.current);

    // Track source data loading
    map.on('sourcedata', (e) => {
      if (e.sourceId?.startsWith('siteintel-') && e.isSourceLoaded) {
        console.log('🔍 TILE DEBUG: Source data loaded', {
          sourceId: e.sourceId,
          isSourceLoaded: e.isSourceLoaded,
        });
      }
    });

    // Add sources that don't exist yet
    for (const [sourceId, sourceConfig] of Object.entries(sources)) {
      if (!map.getSource(sourceId)) {
        try {
          map.addSource(sourceId, sourceConfig);
          addedSourcesRef.current.add(sourceId);
          console.log('🔍 TILE DEBUG: Added source to map', {
            sourceId,
            tiles: sourceConfig.tiles,
            minzoom: sourceConfig.minzoom,
            maxzoom: sourceConfig.maxzoom,
          });
        } catch (err) {
          console.error('🔍 TILE DEBUG: Failed to add source', { sourceId, err });
        }
      } else {
        addedSourcesRef.current.add(sourceId);
        console.log('🔍 TILE DEBUG: Source already exists', { sourceId });
      }
    }

    // Add layers based on available sources
    for (const [category, config] of Object.entries(VECTOR_TILE_LAYER_CONFIG)) {
      if (!sources[config.sourceId]) {
        console.log('🔍 TILE DEBUG: Skipping layer category - no source', { category, sourceId: config.sourceId });
        continue;
      }

      for (const layerConfig of config.layers) {
        if (map.getLayer(layerConfig.id)) {
          addedLayersRef.current.add(layerConfig.id);
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
          console.log('🔍 TILE DEBUG: Added layer to map', {
            layerId: layerConfig.id,
            sourceId: config.sourceId,
            sourceLayer: layerConfig['source-layer'],
          });
        } catch (err) {
          console.error('🔍 TILE DEBUG: Failed to add layer', { layerId: layerConfig.id, err });
        }
      }
    }

    console.log('🔍 TILE DEBUG: addSourcesAndLayers complete', {
      addedSources: Array.from(addedSourcesRef.current),
      addedLayers: Array.from(addedLayersRef.current),
    });

    // Add click handler for parcels
    if (map.getLayer('siteintel-parcels-fill')) {
      // Remove existing handler if any
      if (clickHandlerRef.current) {
        map.off('click', 'siteintel-parcels-fill', clickHandlerRef.current);
      }
      
      clickHandlerRef.current = (e: any) => {
        if (e.features && e.features.length > 0 && onParcelClick) {
          console.log('🔍 TILE DEBUG: Parcel clicked from vector tile', e.features[0]);
          onParcelClick(e.features[0]);
        }
      };
      
      map.on('click', 'siteintel-parcels-fill', clickHandlerRef.current);
      
      // Hover effects
      map.on('mouseenter', 'siteintel-parcels-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'siteintel-parcels-fill', () => {
        map.getCanvas().style.cursor = '';
      });
    }
  }, [map, sources, onParcelClick]);

  // Add vector tile sources and layers to map
  useEffect(() => {
    console.log('🔍 TILE DEBUG: useEffect triggered', {
      hasMap: !!map,
      mapLoaded,
      isLoading,
      tilesetCount: tilesets?.length || 0,
      styleVersion,
    });

    if (!map || !mapLoaded || isLoading) {
      console.log('🔍 TILE DEBUG: useEffect early return', {
        reason: !map ? 'no map' : !mapLoaded ? 'map not loaded' : 'still loading tilesets',
      });
      return;
    }
    if (!tilesets || tilesets.length === 0) {
      console.log('🔍 TILE DEBUG: No tilesets available from Supabase query');
      return;
    }

    // Wait for style to be loaded, then add layers
    if (!map.isStyleLoaded()) {
      console.log('🔍 TILE DEBUG: Map style not loaded, waiting for styledata event');
      const handler = () => {
        console.log('🔍 TILE DEBUG: styledata event fired, adding sources/layers');
        addSourcesAndLayers();
      };
      map.once('styledata', handler);
      return () => {
        map.off('styledata', handler);
      };
    }

    addSourcesAndLayers();
  }, [map, mapLoaded, sources, layers, isLoading, tilesets, styleVersion, addSourcesAndLayers]);

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
