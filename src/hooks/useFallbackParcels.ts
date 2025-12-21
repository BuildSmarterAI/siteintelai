import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import maplibregl from "maplibre-gl";

interface ParcelFeature {
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
  onParcelClick?: (parcel: any) => void;
  minZoom?: number;
  debounceMs?: number;
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
  onParcelClick,
  minZoom = 14,
  debounceMs = 500,
}: UseFallbackParcelsOptions): UseFallbackParcelsResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<FallbackMetadata | null>(null);
  const [featureCount, setFeatureCount] = useState(0);

  const debounceTimeout = useRef<number | null>(null);
  const lastBbox = useRef<string | null>(null);
  const layersAdded = useRef(false);
  
  // Use ref to avoid stale closure in click handler
  const onParcelClickRef = useRef(onParcelClick);
  
  // Keep ref updated with latest callback
  useEffect(() => {
    onParcelClickRef.current = onParcelClick;
  }, [onParcelClick]);

  // Fetch parcels for current viewport
  const fetchParcelsForViewport = useCallback(async () => {
    if (!map || !enabled) return;

    const zoom = map.getZoom();
    if (zoom < minZoom) {
      console.log(`[useFallbackParcels] Zoom ${zoom.toFixed(1)} < ${minZoom}, skipping fetch`);
      return;
    }

    const bounds = map.getBounds();
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

    console.log(`[useFallbackParcels] Fetching parcels for bbox: ${bboxKey}`);
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
        console.log("[useFallbackParcels] No features returned");
        setFeatureCount(0);
        setMetadata(null);
        return;
      }

      console.log(`[useFallbackParcels] Received ${data.features.length} features (source: ${data.metadata?.source})`);

      // Update map source
      updateMapSource(data.features);

      setFeatureCount(data.features.length);
      setMetadata(data.metadata || null);
    } catch (err: any) {
      console.error("[useFallbackParcels] Fetch error:", err);
      setError(err.message || "Failed to fetch parcels");
    } finally {
      setIsLoading(false);
    }
  }, [map, enabled, minZoom]);

  // Update map GeoJSON source with new features
  // Remove onParcelClick from dependencies since we use ref
  const updateMapSource = useCallback(
    (features: ParcelFeature[]) => {
      if (!map) return;

      const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: features.filter((f) => f.geometry) as GeoJSON.Feature[],
      };

      // Add or update source
      if (map.getSource(FALLBACK_SOURCE_ID)) {
        (map.getSource(FALLBACK_SOURCE_ID) as maplibregl.GeoJSONSource).setData(geojson);
      } else {
        map.addSource(FALLBACK_SOURCE_ID, {
          type: "geojson",
          data: geojson,
        });
      }

      // Add layers if not exists
      if (!layersAdded.current) {
        // Fill layer
        if (!map.getLayer(FALLBACK_FILL_LAYER_ID)) {
          map.addLayer({
            id: FALLBACK_FILL_LAYER_ID,
            type: "fill",
            source: FALLBACK_SOURCE_ID,
            paint: {
              "fill-color": [
                "match",
                ["get", "source"],
                "canonical",
                "#FF7A00", // Feasibility Orange for SiteIntel data
                "external",
                "#FBBF24", // Amber for external data
                "#FF7A00",
              ],
              "fill-opacity": 0.15,
            },
          });
        }

        // Line layer
        if (!map.getLayer(FALLBACK_LINE_LAYER_ID)) {
          map.addLayer({
            id: FALLBACK_LINE_LAYER_ID,
            type: "line",
            source: FALLBACK_SOURCE_ID,
            paint: {
              "line-color": [
                "match",
                ["get", "source"],
                "canonical",
                "#FF7A00", // Feasibility Orange
                "external",
                "#F59E0B", // Amber
                "#FF7A00",
              ],
              "line-width": 1.5,
            },
          });
        }

        // Click handler - uses ref to avoid stale closure
        map.on("click", FALLBACK_FILL_LAYER_ID, (e) => {
          console.log("[useFallbackParcels] Click event on fill layer", {
            hasFeatures: !!e.features?.length,
            hasCallback: !!onParcelClickRef.current,
          });
          
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            console.log("[useFallbackParcels] Clicked parcel properties:", feature.properties);
            
            if (onParcelClickRef.current) {
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
            } else {
              console.warn("[useFallbackParcels] No click callback available");
            }
          }
        });

        // Hover effects
        map.on("mouseenter", FALLBACK_FILL_LAYER_ID, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", FALLBACK_FILL_LAYER_ID, () => {
          map.getCanvas().style.cursor = "";
        });

        layersAdded.current = true;
      }
    },
    [map] // onParcelClick removed - using ref instead
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

  // Setup map event listeners
  useEffect(() => {
    if (!map || !mapLoaded || !enabled) return;

    // Initial fetch
    fetchParcelsForViewport();

    // Listen for map movements
    map.on("moveend", handleMapMove);

    return () => {
      map.off("moveend", handleMapMove);
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [map, mapLoaded, enabled, handleMapMove, fetchParcelsForViewport]);

  // Cleanup layers on disable
  useEffect(() => {
    if (!map || enabled) return;

    // Safety check: ensure map style is loaded before cleanup
    try {
      if (map.getStyle()) {
        // Remove layers and source when disabled
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
    } catch (e) {
      // Map may be unmounting, ignore cleanup errors
      console.debug('[useFallbackParcels] Cleanup skipped - map not ready');
    }
    layersAdded.current = false;
  }, [map, enabled]);

  // Determine if we're in fallback mode based on metadata
  const isFallbackMode = metadata?.source === "external" || metadata?.source === "mixed";

  return {
    isLoading,
    error,
    metadata,
    featureCount,
    isFallbackMode,
  };
}
