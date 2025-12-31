/**
 * Parcel Map Snapshot Component
 * Renders a static map image of a parcel boundary using MapLibre GL's canvas export.
 * Used in confirmation modals to provide visual confirmation of parcel selection.
 */

import { useEffect, useRef, useState, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as turf from "@turf/turf";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParcelMapSnapshotProps {
  /** GeoJSON geometry of the parcel (Polygon or MultiPolygon) */
  geometry: GeoJSON.Geometry | null | undefined;
  /** Optional class name for the container */
  className?: string;
  /** Width of the snapshot in pixels */
  width?: number;
  /** Height of the snapshot in pixels */
  height?: number;
}

export function ParcelMapSnapshot({
  geometry,
  className,
  width = 300,
  height = 160,
}: ParcelMapSnapshotProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate bounds from geometry
  const bounds = useMemo(() => {
    if (!geometry) return null;
    try {
      const bbox = turf.bbox(geometry);
      return [
        [bbox[0], bbox[1]], // SW
        [bbox[2], bbox[3]], // NE
      ] as [[number, number], [number, number]];
    } catch (e) {
      console.error("[ParcelMapSnapshot] Failed to calculate bounds:", e);
      return null;
    }
  }, [geometry]);

  // Create GeoJSON feature for the parcel
  const geojsonData = useMemo(() => {
    if (!geometry) return null;
    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: {},
          geometry,
        },
      ],
    };
  }, [geometry]);

  useEffect(() => {
    if (!mapContainerRef.current || !geometry || !bounds || !geojsonData) {
      setIsLoading(false);
      setError("No geometry available");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Create an off-screen map for rendering
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          "carto-light": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
              "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
              "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors, © CARTO",
          },
        },
        layers: [
          {
            id: "carto-light-layer",
            type: "raster",
            source: "carto-light",
            minzoom: 0,
            maxzoom: 20,
          },
        ],
      },
      center: [
        (bounds[0][0] + bounds[1][0]) / 2,
        (bounds[0][1] + bounds[1][1]) / 2,
      ],
      zoom: 14,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true, // Required for canvas export
    });

    mapRef.current = map;

    map.on("load", () => {
      // Add parcel source
      map.addSource("parcel", {
        type: "geojson",
        data: geojsonData,
      });

      // Add fill layer
      map.addLayer({
        id: "parcel-fill",
        type: "fill",
        source: "parcel",
        paint: {
          "fill-color": "hsl(24, 100%, 50%)", // Feasibility orange
          "fill-opacity": 0.25,
        },
      });

      // Add outline layer
      map.addLayer({
        id: "parcel-outline",
        type: "line",
        source: "parcel",
        paint: {
          "line-color": "hsl(24, 100%, 50%)", // Feasibility orange
          "line-width": 3,
        },
      });

      // Fit bounds with padding
      map.fitBounds(bounds, {
        padding: 30,
        duration: 0,
      });
    });

    // Wait for map to be fully rendered then capture
    map.on("idle", () => {
      try {
        const canvas = map.getCanvas();
        const dataUrl = canvas.toDataURL("image/png");
        setImageDataUrl(dataUrl);
        setIsLoading(false);
      } catch (e) {
        console.error("[ParcelMapSnapshot] Failed to export canvas:", e);
        setError("Failed to render map");
        setIsLoading(false);
      }
    });

    map.on("error", (e) => {
      console.error("[ParcelMapSnapshot] Map error:", e);
      setError("Map failed to load");
      setIsLoading(false);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [geometry, bounds, geojsonData]);

  // Fallback placeholder when no geometry
  if (!geometry) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-muted/50 border border-border",
          className
        )}
        style={{ width, height }}
      >
        <div className="text-center text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2 text-[hsl(var(--feasibility-orange))]" />
          <p className="text-xs">No boundary available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden rounded-lg border border-border", className)}
      style={{ width, height }}
    >
      {/* Hidden map container for rendering */}
      <div
        ref={mapContainerRef}
        className="absolute opacity-0 pointer-events-none"
        style={{ width, height }}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin text-[hsl(var(--feasibility-orange))]" />
            <p className="text-xs">Loading map...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-[hsl(var(--feasibility-orange))]" />
            <p className="text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* Rendered snapshot image */}
      {imageDataUrl && !isLoading && !error && (
        <img
          src={imageDataUrl}
          alt="Parcel boundary map"
          className="w-full h-full object-cover"
          style={{ width, height }}
        />
      )}
    </div>
  );
}
