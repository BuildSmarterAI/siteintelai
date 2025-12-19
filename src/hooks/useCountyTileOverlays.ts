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

  // Add a county tile overlay to the map
  const addCountyOverlay = useCallback((county: CountyTileSource) => {
    if (!map || !mapLoaded) return;
    
    const sourceId = `${SOURCE_PREFIX}${county.id}`;
    const layerId = `${LAYER_PREFIX}${county.id}`;

    try {
      // Check if source already exists
      if (map.getSource(sourceId)) {
        console.log(`[CountyTiles] Source ${sourceId} already exists`);
        return;
      }

      const tileUrl = buildArcGISExportTileUrl(county);
      console.log(`[CountyTiles] Adding county overlay: ${county.name}`, { tileUrl });

      // Add raster tile source
      map.addSource(sourceId, {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        bounds: county.bounds,
        minzoom: county.minZoom,
        maxzoom: county.maxZoom,
        attribution: county.attribution,
      });

      addedSourcesRef.current.add(sourceId);

      // Find the first symbol layer to insert below labels
      const layers = map.getStyle()?.layers || [];
      let beforeLayerId: string | undefined;
      for (const layer of layers) {
        if (layer.type === 'symbol') {
          beforeLayerId = layer.id;
          break;
        }
      }

      // Add raster layer
      map.addLayer({
        id: layerId,
        type: 'raster',
        source: sourceId,
        minzoom: county.minZoom,
        maxzoom: county.maxZoom,
        paint: {
          'raster-opacity': enabled ? opacity : 0,
          'raster-fade-duration': 300,
        },
      }, beforeLayerId);

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
  }, [map, mapLoaded, enabled, opacity, onCountyAdded]);

  // Remove a county tile overlay from the map
  const removeCountyOverlay = useCallback((countyId: string) => {
    if (!map) return;

    const sourceId = `${SOURCE_PREFIX}${countyId}`;
    const layerId = `${LAYER_PREFIX}${countyId}`;

    try {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
        addedLayersRef.current.delete(layerId);
      }

      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
        addedSourcesRef.current.delete(sourceId);
      }

      setActiveCounties(prev => prev.filter(c => c.id !== countyId));
      onCountyRemoved?.(countyId);
      console.log(`[CountyTiles] Removed ${countyId}`);
    } catch (err) {
      console.error(`[CountyTiles] Failed to remove ${countyId}:`, err);
    }
  }, [map, onCountyRemoved]);

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
    if (!map) return;

    activeCounties.forEach(county => {
      const layerId = `${LAYER_PREFIX}${county.id}`;
      if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, 'raster-opacity', visible ? opacity : 0);
      }
    });
  }, [map, activeCounties, opacity]);

  // Update opacity when it changes
  useEffect(() => {
    if (!map || !mapLoaded) return;

    activeCounties.forEach(county => {
      const layerId = `${LAYER_PREFIX}${county.id}`;
      if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, 'raster-opacity', enabled ? opacity : 0);
      }
    });
  }, [map, mapLoaded, activeCounties, enabled, opacity]);

  // Auto-detect counties based on viewport
  useEffect(() => {
    if (!map || !mapLoaded || !autoDetect || countyIds) return;

    const updateCountiesInView = () => {
      const bounds = map.getBounds();
      if (!bounds) return;

      const viewBounds: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ];

      const zoom = map.getZoom();
      
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
      map.off('moveend', updateCountiesInView);
      map.off('zoomend', updateCountiesInView);
    };
  }, [map, mapLoaded, autoDetect, countyIds, activeCounties, addCountyOverlay, removeCountyOverlay]);

  // Load specific counties if countyIds provided
  useEffect(() => {
    if (!map || !mapLoaded || !countyIds) return;

    countyIds.forEach(countyId => {
      const county = COUNTY_TILE_SOURCES.find(c => c.id === countyId);
      if (county && !activeCounties.find(c => c.id === countyId)) {
        addCountyOverlay(county);
      }
    });
  }, [map, mapLoaded, countyIds, activeCounties, addCountyOverlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!map) return;
      
      addedLayersRef.current.forEach(layerId => {
        try {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      });

      addedSourcesRef.current.forEach(sourceId => {
        try {
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
          }
        } catch (e) {
          // Ignore cleanup errors
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
