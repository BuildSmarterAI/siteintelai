import { useEffect, useRef, useCallback, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { 
  CountyTileSource, 
  COUNTY_TILE_SOURCES, 
  buildArcGISExportTileUrl,
  findCountiesInBounds 
} from '@/lib/countyTileSources';

export interface UseCountyTileOverlaysOptions {
  map: MapLibreMap | null;
  mapLoaded: boolean;
  enabled: boolean;
  opacity?: number;
  /** If true, auto-detect and load counties based on viewport */
  autoDetect?: boolean;
  /** Specific county IDs to load (overrides autoDetect) */
  countyIds?: string[];
  /** Callback when a county tile layer is added */
  onCountyAdded?: (county: CountyTileSource) => void;
  /** Callback when a county tile layer is removed */
  onCountyRemoved?: (countyId: string) => void;
}

export interface UseCountyTileOverlaysResult {
  /** Currently active county overlays */
  activeCounties: CountyTileSource[];
  /** Loading state */
  isLoading: boolean;
  /** Any error that occurred */
  error: string | null;
  /** Manually add a county overlay */
  addCounty: (countyId: string) => void;
  /** Manually remove a county overlay */
  removeCounty: (countyId: string) => void;
  /** Toggle a county overlay */
  toggleCounty: (countyId: string) => void;
  /** Set visibility of all county overlays */
  setVisibility: (visible: boolean) => void;
  /** Get all available counties */
  availableCounties: CountyTileSource[];
}

const SOURCE_PREFIX = 'county-tiles-';
const LAYER_PREFIX = 'county-tiles-layer-';

export function useCountyTileOverlays({
  map,
  mapLoaded,
  enabled,
  opacity = 0.8,
  autoDetect = true,
  countyIds,
  onCountyAdded,
  onCountyRemoved,
}: UseCountyTileOverlaysOptions): UseCountyTileOverlaysResult {
  const [activeCounties, setActiveCounties] = useState<CountyTileSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addedSourcesRef = useRef<Set<string>>(new Set());
  const addedLayersRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);

  // Helper to check if map is ready for operations
  const isMapReady = useCallback(() => {
    if (!isMountedRef.current || !map || !mapLoaded) return false;
    try {
      return !!map.getStyle();
    } catch {
      return false;
    }
  }, [map, mapLoaded]);

  // Add a county tile overlay to the map
  const addCountyOverlay = useCallback((county: CountyTileSource) => {
    if (!isMapReady()) return;

    const sourceId = `${SOURCE_PREFIX}${county.id}`;
    const layerId = `${LAYER_PREFIX}${county.id}`;

    try {
      // Check if source already exists
      if (map!.getSource(sourceId)) {
        console.log(`[CountyTiles] Source ${sourceId} already exists`);
        return;
      }

      const tileUrl = buildArcGISExportTileUrl(county);
      console.log(`[CountyTiles] Adding county overlay: ${county.name}`, { tileUrl });

      // Add raster tile source
      map!.addSource(sourceId, {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        bounds: county.bounds,
        minzoom: county.minZoom,
        maxzoom: county.maxZoom,
        attribution: county.attribution,
      });

      addedSourcesRef.current.add(sourceId);

      // Find the best layer to insert county tiles above basemap but below labels
      const layers = map!.getStyle()?.layers || [];
      let beforeLayerId: string | undefined;

      // First, try to find first symbol layer (labels)
      for (const layer of layers) {
        if (layer.type === 'symbol') {
          beforeLayerId = layer.id;
          break;
        }
      }

      // If no symbol layer found, insert at the top (above all raster layers)
      // This ensures county tiles are visible above the basemap
      if (!beforeLayerId && layers.length > 0) {
        console.log(`[CountyTiles] No symbol layer found, inserting at top of layer stack`);
      }

      // Add raster layer with lowered minzoom to 11 for earlier visibility
      map!.addLayer(
        {
          id: layerId,
          type: 'raster',
          source: sourceId,
          minzoom: 11, // Force minzoom 11 regardless of county config
          maxzoom: county.maxZoom,
          paint: {
            'raster-opacity': enabled ? opacity : 0,
            'raster-fade-duration': 300,
          },
        },
        beforeLayerId
      );

      addedLayersRef.current.add(layerId);

      setActiveCounties(prev => {
        if (prev.find(c => c.id === county.id)) return prev;
        return [...prev, county];
      });

      onCountyAdded?.(county);
      console.log(`[CountyTiles] Successfully added ${county.name}`);
    } catch (err) {
      console.error(`[CountyTiles] Failed to add ${county.name}:`, err);
      setError(`Failed to add ${county.name} overlay`);
    }
  }, [isMapReady, map, enabled, opacity, onCountyAdded]);

  // Remove a county tile overlay from the map
  const removeCountyOverlay = useCallback((countyId: string) => {
    if (!isMapReady()) return;

    const sourceId = `${SOURCE_PREFIX}${countyId}`;
    const layerId = `${LAYER_PREFIX}${countyId}`;

    try {
      if (map!.getLayer(layerId)) {
        map!.removeLayer(layerId);
        addedLayersRef.current.delete(layerId);
      }

      if (map!.getSource(sourceId)) {
        map!.removeSource(sourceId);
        addedSourcesRef.current.delete(sourceId);
      }

      setActiveCounties(prev => prev.filter(c => c.id !== countyId));
      onCountyRemoved?.(countyId);
      console.log(`[CountyTiles] Removed ${countyId}`);
    } catch (err) {
      // Can happen during navigation/unmount; safe to ignore
      console.debug(`[CountyTiles] Remove skipped for ${countyId} (map not ready)`);
    }
  }, [isMapReady, map, onCountyRemoved]);

  // Toggle a county overlay
  const toggleCounty = useCallback((countyId: string) => {
    const isActive = activeCounties.some(c => c.id === countyId);
    if (isActive) {
      removeCountyOverlay(countyId);
    } else {
      const county = COUNTY_TILE_SOURCES.find(c => c.id === countyId);
      if (county) {
        addCountyOverlay(county);
      }
    }
  }, [activeCounties, addCountyOverlay, removeCountyOverlay]);

  // Set visibility of all county overlays
  const setVisibility = useCallback((visible: boolean) => {
    if (!isMapReady()) return;

    activeCounties.forEach(county => {
      const layerId = `${LAYER_PREFIX}${county.id}`;
      try {
        if (map!.getLayer(layerId)) {
          map!.setPaintProperty(layerId, 'raster-opacity', visible ? opacity : 0);
        }
      } catch {
        // Ignore errors during map transitions
      }
    });
  }, [isMapReady, map, activeCounties, opacity]);

  // Update opacity when it changes
  useEffect(() => {
    if (!isMapReady()) return;

    activeCounties.forEach(county => {
      const layerId = `${LAYER_PREFIX}${county.id}`;
      try {
        if (map!.getLayer(layerId)) {
          map!.setPaintProperty(layerId, 'raster-opacity', enabled ? opacity : 0);
        }
      } catch {
        // Ignore errors during map transitions
      }
    });
  }, [isMapReady, map, activeCounties, enabled, opacity]);

  // Auto-detect counties based on viewport
  useEffect(() => {
    if (!map || !mapLoaded || !autoDetect || countyIds) return;

    const updateCountiesInView = () => {
      if (!isMapReady()) return;

      let bounds: any;
      try {
        bounds = map.getBounds();
      } catch {
        return;
      }
      if (!bounds) return;

      const viewBounds: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ];

      let zoom = 0;
      try {
        zoom = map.getZoom();
      } catch {
        return;
      }

      // Only load county tiles at zoom 11+ (lowered from 13 for better initial visibility)
      if (zoom < 11) {
        // Remove all county overlays at low zoom
        activeCounties.forEach(county => {
          removeCountyOverlay(county.id);
        });
        return;
      }

      const countiesInView = findCountiesInBounds(viewBounds);

      // Add new counties
      countiesInView.forEach(county => {
        if (!activeCounties.find(c => c.id === county.id)) {
          addCountyOverlay(county);
        }
      });

      // Remove counties no longer in view (optional - can keep them loaded)
      // Keeping them loaded for smoother panning experience
    };

    // Initial check
    updateCountiesInView();

    // Listen for map movements
    map.on('moveend', updateCountiesInView);
    map.on('zoomend', updateCountiesInView);

    return () => {
      try {
        map.off('moveend', updateCountiesInView);
        map.off('zoomend', updateCountiesInView);
      } catch {
        // ignore
      }
    };
  }, [map, mapLoaded, autoDetect, countyIds, activeCounties, addCountyOverlay, removeCountyOverlay, isMapReady]);

  // Load specific counties if countyIds provided
  useEffect(() => {
    if (!isMapReady() || !countyIds) return;

    countyIds.forEach(countyId => {
      const county = COUNTY_TILE_SOURCES.find(c => c.id === countyId);
      if (county && !activeCounties.find(c => c.id === countyId)) {
        addCountyOverlay(county);
      }
    });
  }, [isMapReady, countyIds, activeCounties, addCountyOverlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Prevent any late async/event callbacks from touching the map
      isMountedRef.current = false;

      if (!map) return;

      // Only attempt cleanup if the style is still available
      let styleOk = false;
      try {
        styleOk = !!map.getStyle();
      } catch {
        styleOk = false;
      }
      if (!styleOk) return;

      addedLayersRef.current.forEach(layerId => {
        try {
          if (map.getLayer(layerId)) map.removeLayer(layerId);
        } catch {
          // ignore
        }
      });

      addedSourcesRef.current.forEach(sourceId => {
        try {
          if (map.getSource(sourceId)) map.removeSource(sourceId);
        } catch {
          // ignore
        }
      });
    };
  }, [map]);

  return {
    activeCounties,
    isLoading,
    error,
    addCounty: (countyId: string) => {
      const county = COUNTY_TILE_SOURCES.find(c => c.id === countyId);
      if (county) addCountyOverlay(county);
    },
    removeCounty: removeCountyOverlay,
    toggleCounty,
    setVisibility,
    availableCounties: COUNTY_TILE_SOURCES.filter(c => c.isActive),
  };
}
