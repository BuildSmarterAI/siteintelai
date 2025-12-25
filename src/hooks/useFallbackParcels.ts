import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import maplibregl from "maplibre-gl";
import { logger } from "@/lib/logger";
export interface ParcelFeature {
  type: "Feature";
  geometry: unknown;
  properties: {
    parcel_id: string;
    owner_name: string | null;
    situs_address: string | null;
    acreage: number | null;
    land_use_desc: string | null;
    jurisdiction: string | null;
    source: "canonical" | "external";
    source_agency: string | null;
  };
}

export interface HoveredParcel {
  parcel_id: string;
  owner_name: string | null;
  situs_address: string | null;
  acreage: number | null;
  land_use_desc: string | null;
  jurisdiction: string | null;
  source: "canonical" | "external";
}

interface FallbackMetadata {
  source: "canonical" | "external" | "mixed";
  canonical_count: number;
  external_count: number;
  coverage_gap: boolean;
}

interface UseFallbackParcelsOptions {
  map: maplibregl.Map | null;
  mapLoaded: boolean;
  enabled: boolean;
  showFill?: boolean; // Controls fill layer visibility (default: false)
  onParcelClick?: (parcel: any) => void;
  onParcelHover?: (parcel: HoveredParcel | null, position: { x: number; y: number } | null) => void;
  onParcelRightClick?: (parcel: any, position: { x: number; y: number }) => void;
  minZoom?: number;
  debounceMs?: number;
  hoverDebounceMs?: number;
}

interface UseFallbackParcelsResult {
  isLoading: boolean;
  error: string | null;
  metadata: FallbackMetadata | null;
  featureCount: number;
  isFallbackMode: boolean;
}

const FALLBACK_SOURCE_ID = "fallback-parcels";
const FALLBACK_FILL_LAYER_ID = "fallback-parcels-fill";
const FALLBACK_LINE_LAYER_ID = "fallback-parcels-line";

/**
 * Hook for loading parcels via GeoJSON fallback when vector tiles are unavailable
 * Implements debounced viewport-based loading with coverage gap detection
 */
export function useFallbackParcels({
  map,
  mapLoaded,
  enabled,
  showFill = false,
  onParcelClick,
  onParcelHover,
  onParcelRightClick,
  minZoom = 14,
  debounceMs = 500,
  hoverDebounceMs = 50,
}: UseFallbackParcelsOptions): UseFallbackParcelsResult {
  // ----------------------------
  // State
  // ----------------------------
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<FallbackMetadata | null>(null);
  const [featureCount, setFeatureCount] = useState(0);

  // ----------------------------
  // Refs (keep all refs together)
  // ----------------------------
  const debounceTimeout = useRef<number | null>(null);
  const hoverDebounceTimeout = useRef<number | null>(null);
  const lastBbox = useRef<string | null>(null);
  const layersAdded = useRef(false);
  const isMountedRef = useRef(true);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // Refs for callbacks to avoid stale closures in event handlers
  const onParcelClickRef = useRef(onParcelClick);
  const onParcelHoverRef = useRef(onParcelHover);
  const onParcelRightClickRef = useRef(onParcelRightClick);
  const showFillRef = useRef(showFill);

  // Store event handler references for proper cleanup
  const clickHandlerRef = useRef<((e: maplibregl.MapLayerMouseEvent) => void) | null>(null);
  const mousemoveHandlerRef = useRef<((e: maplibregl.MapLayerMouseEvent) => void) | null>(null);
  const mouseleaveHandlerRef = useRef<(() => void) | null>(null);
  const mouseenterHandlerRef = useRef<(() => void) | null>(null);
  const contextmenuHandlerRef = useRef<((e: maplibregl.MapLayerMouseEvent) => void) | null>(null);
  const moveendHandlerRef = useRef<(() => void) | null>(null);

  // ----------------------------
  // Sync refs with latest values
  // ----------------------------
  useEffect(() => {
    onParcelClickRef.current = onParcelClick;
  }, [onParcelClick]);

  useEffect(() => {
    onParcelHoverRef.current = onParcelHover;
  }, [onParcelHover]);

  useEffect(() => {
    onParcelRightClickRef.current = onParcelRightClick;
  }, [onParcelRightClick]);

  useEffect(() => {
    showFillRef.current = showFill;
  }, [showFill]);

  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ----------------------------
  // Helpers
  // ----------------------------
  const isMapReady = (): boolean => {
    const m = mapRef.current;
    if (!isMountedRef.current || !m) return false;
    try {
      return !!m.getStyle();
    } catch {
      return false;
    }
  };

  const removeEventHandlers = useCallback((targetMap: maplibregl.Map) => {
    try {
      if (clickHandlerRef.current) {
        targetMap.off("click", FALLBACK_FILL_LAYER_ID, clickHandlerRef.current);
        clickHandlerRef.current = null;
      }
      if (mousemoveHandlerRef.current) {
        targetMap.off("mousemove", FALLBACK_FILL_LAYER_ID, mousemoveHandlerRef.current);
        mousemoveHandlerRef.current = null;
      }
      if (mouseleaveHandlerRef.current) {
        targetMap.off("mouseleave", FALLBACK_FILL_LAYER_ID, mouseleaveHandlerRef.current);
        mouseleaveHandlerRef.current = null;
      }
      if (mouseenterHandlerRef.current) {
        targetMap.off("mouseenter", FALLBACK_FILL_LAYER_ID, mouseenterHandlerRef.current);
        mouseenterHandlerRef.current = null;
      }
      if (contextmenuHandlerRef.current) {
        targetMap.off("contextmenu", FALLBACK_FILL_LAYER_ID, contextmenuHandlerRef.current);
        contextmenuHandlerRef.current = null;
      }
    } catch {
      // Map may be destroyed, ignore
    }
  }, []);

  // ----------------------------
  // Callbacks
  // ----------------------------

  // Fetch parcels for current viewport
  const fetchParcelsForViewport = useCallback(async () => {
    if (!mapRef.current || !enabled) return;

    const currentMap = mapRef.current;
    const zoom = currentMap.getZoom();
    if (zoom < minZoom) {
      logger.debug('useFallbackParcels', `Zoom ${zoom.toFixed(1)} < ${minZoom}, skipping fetch`);
      return;
    }

    const bounds = currentMap.getBounds();
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];

    // Skip if same bbox
    const bboxKey = bbox.map((v) => v.toFixed(5)).join(",");
    if (bboxKey === lastBbox.current) {
      return;
    }
    lastBbox.current = bboxKey;

    logger.debug('useFallbackParcels', `Fetching parcels for bbox: ${bboxKey}`);
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.functions.invoke(
        "fetch-parcels-geojson",
        {
          body: { bbox, zoom: Math.floor(zoom) },
        }
      );

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (!data || !data.features) {
        logger.debug('useFallbackParcels', 'No features returned');
        setFeatureCount(0);
        setMetadata(null);
        return;
      }

      logger.debug('useFallbackParcels', `Received ${data.features.length} features (source: ${data.metadata?.source})`);

      // Update map source
      updateMapSource(data.features);

      setFeatureCount(data.features.length);
      setMetadata(data.metadata || null);
    } catch (err: any) {
      logger.error("[useFallbackParcels] Fetch error:", err);
      setError(err.message || "Failed to fetch parcels");
    } finally {
      setIsLoading(false);
    }
  }, [enabled, minZoom]);

  // Update map GeoJSON source with new features
  const updateMapSource = useCallback(
    (features: ParcelFeature[]) => {
      if (!isMapReady()) return;

      const currentMap = mapRef.current;
      if (!currentMap) return;

      const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: features.filter((f) => f.geometry) as GeoJSON.Feature[],
      };

      // Add or update source
      if (currentMap.getSource(FALLBACK_SOURCE_ID)) {
        (currentMap.getSource(FALLBACK_SOURCE_ID) as maplibregl.GeoJSONSource).setData(geojson);
      } else {
        currentMap.addSource(FALLBACK_SOURCE_ID, {
          type: "geojson",
          data: geojson,
        });
      }

      // Add layers if not exists
      if (!layersAdded.current) {
        logger.debug('useFallbackParcels', 'Adding fallback parcel layers to map');

        // Fill layer - initially hidden unless showFill is true
        if (!currentMap.getLayer(FALLBACK_FILL_LAYER_ID)) {
          currentMap.addLayer({
            id: FALLBACK_FILL_LAYER_ID,
            type: "fill",
            source: FALLBACK_SOURCE_ID,
            layout: {
              visibility: showFillRef.current ? 'visible' : 'none',
            },
            paint: {
              "fill-color": [
                "match",
                ["get", "source"],
                "canonical",
                "#FF7A00",
                "external",
                "#FBBF24",
                "#FF7A00",
              ],
              "fill-opacity": 0.25,
            },
          });
          logger.debug('useFallbackParcels', 'Added fill layer:', FALLBACK_FILL_LAYER_ID);
        }

        // Line layer
        if (!currentMap.getLayer(FALLBACK_LINE_LAYER_ID)) {
          currentMap.addLayer({
            id: FALLBACK_LINE_LAYER_ID,
            type: "line",
            source: FALLBACK_SOURCE_ID,
            paint: {
              "line-color": [
                "match",
                ["get", "source"],
                "canonical",
                "#FF7A00",
                "external",
                "#F59E0B",
                "#FF7A00",
              ],
              "line-width": 2,
            },
          });
          logger.debug('useFallbackParcels', 'Added line layer:', FALLBACK_LINE_LAYER_ID);
        }

        // Create and store event handlers
        clickHandlerRef.current = (e) => {
          if (e.features && e.features.length > 0 && onParcelClickRef.current) {
            const feature = e.features[0];
            onParcelClickRef.current({
              parcel_id: feature.properties?.parcel_id,
              owner_name: feature.properties?.owner_name,
              situs_address: feature.properties?.situs_address,
              acreage: feature.properties?.acreage,
              land_use_desc: feature.properties?.land_use_desc,
              jurisdiction: feature.properties?.jurisdiction,
              source: feature.properties?.source,
              geometry: feature.geometry,
            });
          }
        };

        mousemoveHandlerRef.current = (e) => {
          if (hoverDebounceTimeout.current) {
            clearTimeout(hoverDebounceTimeout.current);
          }

          hoverDebounceTimeout.current = window.setTimeout(() => {
            if (e.features && e.features.length > 0 && onParcelHoverRef.current) {
              const feature = e.features[0];
              const parcel: HoveredParcel = {
                parcel_id: feature.properties?.parcel_id || '',
                owner_name: feature.properties?.owner_name || null,
                situs_address: feature.properties?.situs_address || null,
                acreage: feature.properties?.acreage || null,
                land_use_desc: feature.properties?.land_use_desc || null,
                jurisdiction: feature.properties?.jurisdiction || null,
                source: feature.properties?.source || 'external',
              };
              onParcelHoverRef.current(parcel, { x: e.point.x, y: e.point.y });
            }
          }, hoverDebounceMs);
        };

        mouseleaveHandlerRef.current = () => {
          if (hoverDebounceTimeout.current) {
            clearTimeout(hoverDebounceTimeout.current);
          }
          try {
            currentMap.getCanvas().style.cursor = "";
          } catch {
            // Ignore
          }
          if (onParcelHoverRef.current) {
            onParcelHoverRef.current(null, null);
          }
        };

        mouseenterHandlerRef.current = () => {
          try {
            currentMap.getCanvas().style.cursor = "pointer";
          } catch {
            // Ignore
          }
        };

        contextmenuHandlerRef.current = (e) => {
          e.preventDefault();
          if (e.features && e.features.length > 0 && onParcelRightClickRef.current) {
            const feature = e.features[0];
            onParcelRightClickRef.current({
              parcel_id: feature.properties?.parcel_id,
              owner_name: feature.properties?.owner_name,
              situs_address: feature.properties?.situs_address,
              acreage: feature.properties?.acreage,
              land_use_desc: feature.properties?.land_use_desc,
              jurisdiction: feature.properties?.jurisdiction,
              source: feature.properties?.source,
              geometry: feature.geometry,
            }, { x: e.point.x, y: e.point.y });
          }
        };

        // Attach event handlers
        currentMap.on("click", FALLBACK_FILL_LAYER_ID, clickHandlerRef.current);
        currentMap.on("mousemove", FALLBACK_FILL_LAYER_ID, mousemoveHandlerRef.current);
        currentMap.on("mouseleave", FALLBACK_FILL_LAYER_ID, mouseleaveHandlerRef.current);
        currentMap.on("mouseenter", FALLBACK_FILL_LAYER_ID, mouseenterHandlerRef.current);
        currentMap.on("contextmenu", FALLBACK_FILL_LAYER_ID, contextmenuHandlerRef.current);

        layersAdded.current = true;
      }
    },
    [hoverDebounceMs]
  );

  // Debounced handler for map movement
  const handleMapMove = useCallback(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = window.setTimeout(() => {
      fetchParcelsForViewport();
    }, debounceMs);
  }, [fetchParcelsForViewport, debounceMs]);

  // ----------------------------
  // Effects
  // ----------------------------

  // Setup map event listeners
  useEffect(() => {
    if (!map || !mapLoaded || !enabled) return;

    // Store the map reference for cleanup
    const attachedMap = map;

    // Initial fetch
    fetchParcelsForViewport();

    // Create and store moveend handler
    moveendHandlerRef.current = handleMapMove;
    attachedMap.on("moveend", handleMapMove);

    return () => {
      try {
        attachedMap.off("moveend", handleMapMove);
      } catch {
        // Map may be destroyed
      }
      moveendHandlerRef.current = null;
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [map, mapLoaded, enabled, handleMapMove, fetchParcelsForViewport]);

  // Toggle fill layer visibility based on showFill prop
  useEffect(() => {
    if (!map || !mapLoaded) return;
    
    try {
      if (map.getLayer(FALLBACK_FILL_LAYER_ID)) {
        map.setLayoutProperty(
          FALLBACK_FILL_LAYER_ID,
          'visibility',
          showFill ? 'visible' : 'none'
        );
      }
    } catch {
      // Layer may not exist yet
    }
  }, [map, mapLoaded, showFill]);

  // Cleanup layers and event handlers on disable or unmount
  useEffect(() => {
    if (!map) return;

    // Store map reference for cleanup
    const attachedMap = map;

    return () => {
      // Clear any pending timeouts
      if (hoverDebounceTimeout.current) {
        clearTimeout(hoverDebounceTimeout.current);
      }

      // Remove all event handlers first
      removeEventHandlers(attachedMap);

      // Then remove layers and source
      try {
        if (attachedMap.getStyle()) {
          if (attachedMap.getLayer(FALLBACK_FILL_LAYER_ID)) {
            attachedMap.removeLayer(FALLBACK_FILL_LAYER_ID);
          }
          if (attachedMap.getLayer(FALLBACK_LINE_LAYER_ID)) {
            attachedMap.removeLayer(FALLBACK_LINE_LAYER_ID);
          }
          if (attachedMap.getSource(FALLBACK_SOURCE_ID)) {
            attachedMap.removeSource(FALLBACK_SOURCE_ID);
          }
        }
      } catch {
        // Map may be destroyed, ignore
        console.debug('[useFallbackParcels] Cleanup skipped - map not ready');
      }

      layersAdded.current = false;
    };
  }, [map, removeEventHandlers]);

  // Cleanup layers when disabled (but map still exists)
  useEffect(() => {
    if (!map || enabled) return;

    // Remove event handlers
    removeEventHandlers(map);

    // Remove layers and source
    try {
      if (map.getStyle()) {
        if (map.getLayer(FALLBACK_FILL_LAYER_ID)) {
          map.removeLayer(FALLBACK_FILL_LAYER_ID);
        }
        if (map.getLayer(FALLBACK_LINE_LAYER_ID)) {
          map.removeLayer(FALLBACK_LINE_LAYER_ID);
        }
        if (map.getSource(FALLBACK_SOURCE_ID)) {
          map.removeSource(FALLBACK_SOURCE_ID);
        }
      }
    } catch {
      console.debug('[useFallbackParcels] Cleanup skipped - map not ready');
    }
    layersAdded.current = false;
  }, [map, enabled, removeEventHandlers]);

  // isFallbackMode is true when fallback parcels are enabled and we have features
  const isFallbackMode = enabled && featureCount > 0;

  return {
    isLoading,
    error,
    metadata,
    featureCount,
    isFallbackMode,
  };
}
