import { useEffect, useRef, useCallback, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { 
  CountyTileSource, 
  COUNTY_TILE_SOURCES, 
  buildArcGISExportTileUrl,
  findCountiesInBounds 
} from '@/lib/countyTileSources';
import { logger } from '@/lib/logger';

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

  // ----------------------------
  // Refs (keep all refs together)
  // ----------------------------
  const addedSourcesRef = useRef<Set<string>>(new Set());
  const addedLayersRef = useRef<Set<string>>(new Set());

  // Avoid stale closures in long-lived map event handlers
  const isMountedRef = useRef(false);
  const mapRef = useRef<MapLibreMap | null>(null);
  const mapLoadedRef = useRef(false);

  // Keep latest values in refs for long-lived event handlers
  const activeCountiesRef = useRef<CountyTileSource[]>([]);
  const addCountyOverlayRef = useRef<(county: CountyTileSource) => void>(() => {});
  const removeCountyOverlayRef = useRef<(countyId: string) => void>(() => {});

  // ---------------------------------
  // Helpers (non-hook, safe to call)
  // ---------------------------------
  const isMapReady = (): boolean => {
    const m = mapRef.current;
    if (!isMountedRef.current || !m || !mapLoadedRef.current) return false;
    try {
      return !!m.getStyle();
    } catch {
      return false;
    }
  };

  // ----------------------------
  // Callbacks (keep together)
  // ----------------------------
  const addCountyOverlay = useCallback(
    (county: CountyTileSource) => {
      if (!isMapReady()) return;

      const m = mapRef.current;
      if (!m) return;

      const sourceId = `${SOURCE_PREFIX}${county.id}`;
      const layerId = `${LAYER_PREFIX}${county.id}`;

      try {
        // Check if source already exists
        if (m.getSource(sourceId)) {
          logger.debug('CountyTiles', `Source ${sourceId} already exists`);
          return;
        }

        const tileUrl = buildArcGISExportTileUrl(county);
        logger.debug('CountyTiles', `Adding county overlay: ${county.name}`, { tileUrl });

        // Add raster tile source
        m.addSource(sourceId, {
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
        const layers = m.getStyle()?.layers || [];
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
          logger.debug('CountyTiles', 'No symbol layer found, inserting at top of layer stack');
        }

        // Add raster layer with lowered minzoom to 11 for earlier visibility
        m.addLayer(
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

        setActiveCounties((prev) => {
          if (prev.find((c) => c.id === county.id)) return prev;
          return [...prev, county];
        });

        onCountyAdded?.(county);
        logger.debug('CountyTiles', `Successfully added ${county.name}`);
      } catch (err) {
        logger.error(`[CountyTiles] Failed to add ${county.name}:`, err);
        setError(`Failed to add ${county.name} overlay`);
      }
    },
    [enabled, opacity, onCountyAdded]
  );

  const removeCountyOverlay = useCallback(
    (countyId: string) => {
      if (!isMapReady()) return;

      const m = mapRef.current;
      if (!m) return;

      const sourceId = `${SOURCE_PREFIX}${countyId}`;
      const layerId = `${LAYER_PREFIX}${countyId}`;

      try {
        if (m.getLayer(layerId)) {
          m.removeLayer(layerId);
          addedLayersRef.current.delete(layerId);
        }

        if (m.getSource(sourceId)) {
          m.removeSource(sourceId);
          addedSourcesRef.current.delete(sourceId);
        }

        setActiveCounties((prev) => prev.filter((c) => c.id !== countyId));
        onCountyRemoved?.(countyId);
        logger.debug('CountyTiles', `Removed ${countyId}`);
      } catch (err) {
        // Can happen during navigation/unmount; safe to ignore
        logger.debug('CountyTiles', `Remove skipped for ${countyId} (map not ready)`);
      }
    },
    [onCountyRemoved]
  );

  const toggleCounty = useCallback(
    (countyId: string) => {
      const isActive = activeCounties.some((c) => c.id === countyId);
      if (isActive) {
        removeCountyOverlay(countyId);
      } else {
        const county = COUNTY_TILE_SOURCES.find((c) => c.id === countyId);
        if (county) {
          addCountyOverlay(county);
        }
      }
    },
    [activeCounties, addCountyOverlay, removeCountyOverlay]
  );

  const setVisibility = useCallback(
    (visible: boolean) => {
      if (!isMapReady()) return;

      const m = mapRef.current;
      if (!m) return;

      activeCounties.forEach((county) => {
        const layerId = `${LAYER_PREFIX}${county.id}`;
        try {
          if (m.getLayer(layerId)) {
            m.setPaintProperty(layerId, 'raster-opacity', visible ? opacity : 0);
          }
        } catch {
          // Ignore errors during map transitions
        }
      });
    },
    [activeCounties, opacity]
  );

  // ----------------------------
  // Effects (keep together)
  // ----------------------------

  // Sync latest map + loaded state into refs
  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  useEffect(() => {
    mapLoadedRef.current = mapLoaded;
  }, [mapLoaded]);

  // Track mounted state to prevent late async/event callbacks during unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      mapRef.current = null;
    };
  }, []);

  // Keep latest callbacks + active counties for long-lived event handlers
  useEffect(() => {
    activeCountiesRef.current = activeCounties;
  }, [activeCounties]);

  useEffect(() => {
    addCountyOverlayRef.current = addCountyOverlay;
  }, [addCountyOverlay]);

  useEffect(() => {
    removeCountyOverlayRef.current = removeCountyOverlay;
  }, [removeCountyOverlay]);

  // Update opacity when it changes
  useEffect(() => {
    if (!isMapReady()) return;

    const m = mapRef.current;
    if (!m) return;

    activeCounties.forEach((county) => {
      const layerId = `${LAYER_PREFIX}${county.id}`;
      try {
        if (m.getLayer(layerId)) {
          m.setPaintProperty(layerId, 'raster-opacity', enabled ? opacity : 0);
        }
      } catch {
        // Ignore errors during map transitions
      }
    });
  }, [activeCounties, enabled, opacity]);

  // Auto-detect counties based on viewport
  useEffect(() => {
    // Guard FIRST (before touching map refs) to avoid any accidental access order issues
    if (!autoDetect || countyIds) return;

    const attachedMap = mapRef.current;
    if (!attachedMap || !mapLoadedRef.current) return;

    const updateCountiesInView = () => {
      const m = mapRef.current;
      if (!isMountedRef.current || !m || m !== attachedMap) return;
      if (!isMapReady()) return;

      let bounds: any;
      try {
        bounds = m.getBounds();
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
        zoom = m.getZoom();
      } catch {
        return;
      }

      const currentActive = activeCountiesRef.current;

      // Only load county tiles at zoom 11+ (lowered from 13 for better initial visibility)
      if (zoom < 11) {
        currentActive.forEach((county) => {
          removeCountyOverlayRef.current(county.id);
        });
        return;
      }

      const countiesInView = findCountiesInBounds(viewBounds);

      countiesInView.forEach((county) => {
        if (!currentActive.find((c) => c.id === county.id)) {
          addCountyOverlayRef.current(county);
        }
      });
    };

    updateCountiesInView();

    attachedMap.on('moveend', updateCountiesInView);
    attachedMap.on('zoomend', updateCountiesInView);

    return () => {
      try {
        attachedMap.off('moveend', updateCountiesInView);
        attachedMap.off('zoomend', updateCountiesInView);
      } catch {
        // ignore
      }
    };
  }, [autoDetect, countyIds, map, mapLoaded]);

  // Load specific counties if countyIds provided
  useEffect(() => {
    if (!countyIds) return;
    if (!isMapReady()) return;

    const currentActive = activeCountiesRef.current;

    countyIds.forEach((countyId) => {
      const county = COUNTY_TILE_SOURCES.find((c) => c.id === countyId);
      if (county && !currentActive.find((c) => c.id === countyId)) {
        addCountyOverlayRef.current(county);
      }
    });
  }, [countyIds, map, mapLoaded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Immediately flag as unmounted to stop late async/event callbacks
      isMountedRef.current = false;

      const m = mapRef.current;
      if (!m) return;

      // Only attempt cleanup if the style is still available
      let styleOk = false;
      try {
        styleOk = !!m.getStyle();
      } catch {
        styleOk = false;
      }
      if (!styleOk) return;

      addedLayersRef.current.forEach((layerId) => {
        try {
          if (m.getLayer(layerId)) m.removeLayer(layerId);
        } catch {
          // ignore
        }
      });

      addedSourcesRef.current.forEach((sourceId) => {
        try {
          if (m.getSource(sourceId)) m.removeSource(sourceId);
        } catch {
          // ignore
        }
      });

      mapRef.current = null;
    };
  }, []);

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
