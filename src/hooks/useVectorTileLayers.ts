import { useEffect, useRef, useCallback, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { useVectorTileSources } from './useTilesets';
import { 
  UTILITY_COLORS, 
  UTILITY_LAYER_IDS,
  LINE_WIDTH_BY_ZOOM,
} from '@/lib/utilityLayerConfig';

// Terrain/Hillshade source configuration (free MapLibre demo tiles)
const TERRAIN_SOURCE_ID = 'terrain-dem-source';
const HILLSHADE_LAYER_ID = 'terrain-hillshade';

/**
 * Vector tile layer configuration for MapLibre
 * Defines styling for each layer category from CloudFront CDN tiles
 * 
 * PRD-Compliant Utility Colors (§6.1):
 * - Water: Blue #1F6AE1
 * - Sewer: Brown #7A4A2E  
 * - Stormwater: Teal #1C7C7C
 * 
 * SiteIntel brand colors: Feasibility Orange #FF7A00, Data Cyan #06B6D4
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
          'fill-opacity': 0.25, // Increased from 0.15 for better visibility
        },
      },
      {
        id: 'siteintel-parcels-line',
        type: 'line' as const,
        'source-layer': 'parcels',
        paint: {
          'line-color': '#FF7A00', // Feasibility Orange
          'line-width': 2.5, // Increased from 1.5 for clearer boundaries
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
          'fill-opacity': 0.2, // Reduced from 0.4 for less clutter
        },
      },
      {
        id: 'siteintel-flood-line',
        type: 'line' as const,
        'source-layer': 'flood',
        paint: {
          'line-color': '#991B1B',
          'line-width': 0.5, // Reduced from 1 for less visual noise
          'line-opacity': 0.5, // Semi-transparent
        },
      },
    ],
  },
  // ==========================================================================
  // UTILITIES - PRD-Compliant Styling (§6)
  // Colors: Water #1F6AE1, Sewer #7A4A2E, Stormwater #1C7C7C
  // ==========================================================================
  utilities: {
    sourceId: 'siteintel-utilities',
    layers: [
      // ===== WATER LAYERS =====
      // Water Mains - Solid blue line (§6.2)
      {
        id: UTILITY_LAYER_IDS.water_mains,
        type: 'line' as const,
        'source-layer': 'utilities',
        filter: ['all', 
          ['==', ['get', 'utility_type'], 'water'],
          ['in', ['get', 'feature_type'], ['literal', ['main', 'transmission']]],
        ],
        paint: {
          'line-color': UTILITY_COLORS.water, // #1F6AE1
          'line-width': LINE_WIDTH_BY_ZOOM,
          'line-opacity': 0.9,
        },
        minzoom: 12,
      },
      // Water Valves - Small blue circles (§6.3)
      {
        id: UTILITY_LAYER_IDS.water_valves,
        type: 'circle' as const,
        'source-layer': 'utilities',
        filter: ['all',
          ['==', ['get', 'utility_type'], 'water'],
          ['==', ['get', 'feature_type'], 'valve'],
        ],
        paint: {
          'circle-radius': 5,
          'circle-color': UTILITY_COLORS.water,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 1,
        },
        minzoom: 15,
      },
      // Water Pump Stations - Larger blue circles (§6.3)
      {
        id: UTILITY_LAYER_IDS.water_pump_stations,
        type: 'circle' as const,
        'source-layer': 'utilities',
        filter: ['all',
          ['==', ['get', 'utility_type'], 'water'],
          ['==', ['get', 'feature_type'], 'pump_station'],
        ],
        paint: {
          'circle-radius': 8,
          'circle-color': UTILITY_COLORS.water,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 1.5,
        },
        minzoom: 13,
      },

      // ===== SEWER LAYERS =====
      // Gravity Sewer - Dashed brown line [4,2] (§6.2)
      {
        id: UTILITY_LAYER_IDS.sewer_gravity,
        type: 'line' as const,
        'source-layer': 'utilities',
        filter: ['all',
          ['==', ['get', 'utility_type'], 'sewer'],
          ['in', ['get', 'feature_type'], ['literal', ['main', 'gravity']]],
        ],
        paint: {
          'line-color': UTILITY_COLORS.sewer, // #7A4A2E
          'line-width': LINE_WIDTH_BY_ZOOM,
          'line-opacity': 0.9,
          'line-dasharray': [4, 2],
        },
        minzoom: 12,
      },
      // Force Mains - Tight dashed, darker brown [1,1] (§6.2)
      // WARNING: Direct connections typically prohibited
      {
        id: UTILITY_LAYER_IDS.sewer_force,
        type: 'line' as const,
        'source-layer': 'utilities',
        filter: ['all',
          ['==', ['get', 'utility_type'], 'sewer'],
          ['==', ['get', 'feature_type'], 'force_main'],
        ],
        paint: {
          'line-color': UTILITY_COLORS.sewer_force, // #5A3A1E (darker)
          'line-width': LINE_WIDTH_BY_ZOOM,
          'line-opacity': 0.9,
          'line-dasharray': [1, 1],
        },
        minzoom: 12,
      },
      // Manholes - Brown circles 6px (§6.3)
      {
        id: UTILITY_LAYER_IDS.sewer_manholes,
        type: 'circle' as const,
        'source-layer': 'utilities',
        filter: ['all',
          ['==', ['get', 'utility_type'], 'sewer'],
          ['==', ['get', 'feature_type'], 'manhole'],
        ],
        paint: {
          'circle-radius': 6,
          'circle-color': UTILITY_COLORS.sewer,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 1,
        },
        minzoom: 15,
      },
      // Lift Stations - Larger brown circles 8px (§6.3 - triangle via circle fallback)
      // Must render above lines per PRD
      {
        id: UTILITY_LAYER_IDS.sewer_lift_stations,
        type: 'circle' as const,
        'source-layer': 'utilities',
        filter: ['all',
          ['==', ['get', 'utility_type'], 'sewer'],
          ['==', ['get', 'feature_type'], 'lift_station'],
        ],
        paint: {
          'circle-radius': 8,
          'circle-color': UTILITY_COLORS.sewer,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 1.5,
        },
        minzoom: 13,
      },

      // ===== STORMWATER LAYERS =====
      // Storm Trunks - Dotted teal line [2,3] (§6.2)
      {
        id: UTILITY_LAYER_IDS.storm_trunks,
        type: 'line' as const,
        'source-layer': 'utilities',
        filter: ['all',
          ['==', ['get', 'utility_type'], 'storm'],
          ['in', ['get', 'feature_type'], ['literal', ['trunk', 'main']]],
        ],
        paint: {
          'line-color': UTILITY_COLORS.stormwater, // #1C7C7C
          'line-width': LINE_WIDTH_BY_ZOOM,
          'line-opacity': 0.8,
          'line-dasharray': [2, 3],
        },
        minzoom: 12,
      },
      // Storm Inlets - Square 6px (§6.3 - using circle fallback)
      {
        id: UTILITY_LAYER_IDS.storm_inlets,
        type: 'circle' as const,
        'source-layer': 'utilities',
        filter: ['all',
          ['==', ['get', 'utility_type'], 'storm'],
          ['==', ['get', 'feature_type'], 'inlet'],
        ],
        paint: {
          'circle-radius': 6,
          'circle-color': UTILITY_COLORS.stormwater,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 1,
        },
        minzoom: 15,
      },
      // Storm Outfalls - Larger teal circles
      {
        id: UTILITY_LAYER_IDS.storm_outfalls,
        type: 'circle' as const,
        'source-layer': 'utilities',
        filter: ['all',
          ['==', ['get', 'utility_type'], 'storm'],
          ['==', ['get', 'feature_type'], 'outfall'],
        ],
        paint: {
          'circle-radius': 7,
          'circle-color': UTILITY_COLORS.stormwater,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 1,
        },
        minzoom: 14,
      },

      // ===== LEGACY FALLBACK (for non-typed utilities) =====
      {
        id: 'siteintel-utilities-line-legacy',
        type: 'line' as const,
        'source-layer': 'utilities',
        filter: ['!', ['has', 'feature_type']],
        paint: {
          'line-color': [
            'match',
            ['get', 'utility_type'],
            'water', UTILITY_COLORS.water,
            'sewer', UTILITY_COLORS.sewer,
            'storm', UTILITY_COLORS.stormwater,
            'gas', '#F59E0B',
            'electric', '#FBBF24',
            '#6B7280',
          ],
          'line-width': 2,
          'line-opacity': 0.7,
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
  tileLoadFailed?: boolean; // True when tiles return 403/404
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
  
  // Track tile load failures (403, 404, etc.) to trigger fallback
  const [tileLoadFailed, setTileLoadFailed] = useState(false);
  const failedSourcesRef = useRef<Set<string>>(new Set());
  
  // Use ref to avoid stale closure in click handler
  const onParcelClickRef = useRef(onParcelClick);
  
  // Keep ref updated with latest callback
  useEffect(() => {
    onParcelClickRef.current = onParcelClick;
    console.log('[useVectorTileLayers] onParcelClick ref updated:', !!onParcelClick);
  }, [onParcelClick]);

  console.log('🔍 TILE DEBUG: useVectorTileLayers render', {
    hasMap: !!map,
    mapLoaded,
    isLoading,
    tilesetCount: tilesets?.length || 0,
    sourceCount: Object.keys(sources).length,
    styleVersion,
    hasOnParcelClick: !!onParcelClick,
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

    // Set up tile error handler - detect 403/404 to trigger fallback
    if (errorHandlerRef.current) {
      map.off('error', errorHandlerRef.current);
    }
    errorHandlerRef.current = (e: any) => {
      const status = e.error?.status || e.error?.statusCode;
      const is403or404 = status === 403 || status === 404 || 
        e.error?.message?.includes('403') || 
        e.error?.message?.includes('404') ||
        e.error?.message?.includes('Access Denied');
      
      if (is403or404 && e.sourceId?.startsWith('siteintel-')) {
        console.error('🔍 TILE DEBUG: Tile load FAILED (triggering fallback)', {
          sourceId: e.sourceId,
          status,
          tileUrl: e.tile?.url || e.error?.url,
          error: e.error,
        });
        // Mark this source as failed and trigger fallback
        failedSourcesRef.current.add(e.sourceId);
        // If parcel tiles failed, enable fallback mode
        if (e.sourceId === 'siteintel-parcels') {
          console.warn('🔍 TILE DEBUG: Parcel tiles failed - enabling fallback mode');
          setTileLoadFailed(true);
        }
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

    // Add click handler for parcels - uses ref to avoid stale closure
    if (map.getLayer('siteintel-parcels-fill')) {
      // Remove existing handler if any
      if (clickHandlerRef.current) {
        map.off('click', 'siteintel-parcels-fill', clickHandlerRef.current);
      }
      
      clickHandlerRef.current = (e: any) => {
        console.log('[useVectorTileLayers] Click event on parcels-fill layer', {
          hasFeatures: !!e.features?.length,
          hasCallback: !!onParcelClickRef.current,
        });
        
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          console.log('[useVectorTileLayers] Clicked parcel properties:', feature.properties);
          
          if (onParcelClickRef.current) {
            onParcelClickRef.current(feature);
          } else {
            console.warn('[useVectorTileLayers] No click callback available');
          }
        }
      };
      
      map.on('click', 'siteintel-parcels-fill', clickHandlerRef.current);
      console.log('[useVectorTileLayers] Registered click handler on siteintel-parcels-fill');
      
      // Hover effects
      map.on('mouseenter', 'siteintel-parcels-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'siteintel-parcels-fill', () => {
        map.getCanvas().style.cursor = '';
      });
    }
  }, [map, sources]); // onParcelClick removed - using ref instead

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
    if (!map || !mapLoaded || !map.style) return;

    // Map visibility keys to vector tile layer prefixes
    // PRD-compliant: Utilities expanded to include all sublayers (§5.1)
    const visibilityMap: Record<string, string[]> = {
      hcadParcels: ['siteintel-parcels-fill', 'siteintel-parcels-line'],
      floodZones: ['siteintel-flood-fill', 'siteintel-flood-line'],
      // Utilities group - all PRD-compliant sublayers
      utilities: [
        // Water layers
        UTILITY_LAYER_IDS.water_mains,
        UTILITY_LAYER_IDS.water_valves,
        UTILITY_LAYER_IDS.water_pump_stations,
        // Sewer layers
        UTILITY_LAYER_IDS.sewer_gravity,
        UTILITY_LAYER_IDS.sewer_force,
        UTILITY_LAYER_IDS.sewer_manholes,
        UTILITY_LAYER_IDS.sewer_lift_stations,
        // Stormwater layers
        UTILITY_LAYER_IDS.storm_trunks,
        UTILITY_LAYER_IDS.storm_inlets,
        UTILITY_LAYER_IDS.storm_outfalls,
        // Legacy fallback
        'siteintel-utilities-line-legacy',
      ],
      traffic: ['siteintel-transportation-line'],
      zoningDistricts: ['siteintel-zoning-fill', 'siteintel-zoning-line'],
      topography: [HILLSHADE_LAYER_ID],
    };

    for (const [key, layerIds] of Object.entries(visibilityMap)) {
      const isVisible = layerVisibility[key] ?? true;
      const visibility = isVisible ? 'visible' : 'none';

      for (const layerId of layerIds) {
        try {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', visibility);
          }
        } catch (err) {
          // Layer might not exist yet or map was destroyed
        }
      }
    }
  }, [map, mapLoaded, layerVisibility]);

  // Add terrain/hillshade layer when topography visibility is enabled
  useEffect(() => {
    if (!map || !mapLoaded || !map.style) return;
    try {
      if (!map.isStyleLoaded()) return;
    } catch {
      return; // Map may have been destroyed
    }
    
    const showTerrain = layerVisibility.topography ?? false;
    
    // Add terrain source if not exists
    if (!map.getSource(TERRAIN_SOURCE_ID)) {
      try {
        map.addSource(TERRAIN_SOURCE_ID, {
          type: 'raster-dem',
          tiles: [
            'https://demotiles.maplibre.org/terrain-tiles/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          maxzoom: 14,
        });
        console.log('🏔️ Added terrain DEM source');
      } catch (err) {
        console.error('Failed to add terrain source:', err);
        return;
      }
    }
    
    // Add or update hillshade layer
    if (!map.getLayer(HILLSHADE_LAYER_ID)) {
      try {
        map.addLayer({
          id: HILLSHADE_LAYER_ID,
          type: 'hillshade',
          source: TERRAIN_SOURCE_ID,
          paint: {
            'hillshade-exaggeration': 0.5,
            'hillshade-shadow-color': '#0A0F2C', // Midnight Blue
            'hillshade-highlight-color': '#FFFFFF',
            'hillshade-accent-color': '#06B6D4', // Data Cyan
          },
          layout: {
            visibility: showTerrain ? 'visible' : 'none',
          },
        }, 'siteintel-parcels-fill'); // Insert below parcels so they appear on top
        console.log('🏔️ Added hillshade layer');
      } catch (err) {
        // Try adding without before parameter if layer doesn't exist
        try {
          map.addLayer({
            id: HILLSHADE_LAYER_ID,
            type: 'hillshade',
            source: TERRAIN_SOURCE_ID,
            paint: {
              'hillshade-exaggeration': 0.5,
              'hillshade-shadow-color': '#0A0F2C',
              'hillshade-highlight-color': '#FFFFFF',
              'hillshade-accent-color': '#06B6D4',
            },
            layout: {
              visibility: showTerrain ? 'visible' : 'none',
            },
          });
          console.log('🏔️ Added hillshade layer (fallback)');
        } catch (err2) {
          console.error('Failed to add hillshade layer:', err2);
        }
      }
    } else {
      // Update visibility
      try {
        map.setLayoutProperty(HILLSHADE_LAYER_ID, 'visibility', showTerrain ? 'visible' : 'none');
      } catch (err) {
        // Layer might be in a bad state
      }
    }
  }, [map, mapLoaded, layerVisibility.topography]);

  return {
    sources,
    layers,
    isLoading,
    error,
    // hasVectorTiles is false if sources exist but tiles failed to load (403/404)
    hasVectorTiles: Object.keys(sources).length > 0 && !tileLoadFailed,
    activeSources: Array.from(addedSourcesRef.current),
    tileLoadFailed, // Expose this for debugging
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
