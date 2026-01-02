/**
 * SiteIntel™ Design Mode - Map Canvas
 * 
 * Renders the regulatory envelope and design footprint on MapLibre.
 * Handles drawing, editing, and real-time compliance visualization.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import maplibregl from "maplibre-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "maplibre-gl/dist/maplibre-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { useDesignStore } from "@/stores/useDesignStore";
import { cn } from "@/lib/utils";
import * as turf from "@turf/turf";
import { toast } from "sonner";

interface DesignModeCanvasProps {
  className?: string;
  onFootprintChange?: (geometry: GeoJSON.Polygon | null) => void;
}

// Layer IDs for consistent reference
const LAYERS = {
  PARCEL_FILL: "design-parcel-fill",
  PARCEL_LINE: "design-parcel-line",
  ENVELOPE_FILL: "design-envelope-fill",
  ENVELOPE_LINE: "design-envelope-line",
  FOOTPRINT_FILL: "design-footprint-fill",
  FOOTPRINT_LINE: "design-footprint-line",
  VIOLATION_LINE: "design-violation-line",
};

const SOURCES = {
  PARCEL: "design-parcel",
  ENVELOPE: "design-envelope",
  FOOTPRINT: "design-footprint",
  VIOLATION: "design-violation",
};

export function DesignModeCanvas({ 
  className,
  onFootprintChange 
}: DesignModeCanvasProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const {
    envelope,
    variants,
    activeVariantId,
    isDrawing,
    setIsDrawing,
    updateVariant,
  } = useDesignStore();

  const activeVariant = variants.find(v => v.id === activeVariantId);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const center: [number, number] = envelope?.parcelGeometry
      ? turf.centroid(envelope.parcelGeometry).geometry.coordinates as [number, number]
      : [-95.37, 29.76]; // Houston default

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: [
              "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "osm-tiles-layer",
            type: "raster",
            source: "osm-tiles",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center,
      zoom: 17,
      attributionControl: false,
    });

    // Initialize MapboxDraw for footprint drawing
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      defaultMode: "simple_select",
      styles: [
        // Active drawing line
        {
          id: "gl-draw-line",
          type: "line",
          filter: ["all", ["==", "$type", "LineString"]],
          paint: {
            "line-color": "#FF7A00",
            "line-width": 3,
          },
        },
        // Active polygon fill
        {
          id: "gl-draw-polygon-fill",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"]],
          paint: {
            "fill-color": "#FF7A00",
            "fill-opacity": 0.3,
          },
        },
        // Active polygon stroke
        {
          id: "gl-draw-polygon-stroke",
          type: "line",
          filter: ["all", ["==", "$type", "Polygon"]],
          paint: {
            "line-color": "#FF7A00",
            "line-width": 3,
          },
        },
        // Vertex points
        {
          id: "gl-draw-point",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"]],
          paint: {
            "circle-radius": 6,
            "circle-color": "#FF7A00",
            "circle-stroke-color": "#FFFFFF",
            "circle-stroke-width": 2,
          },
        },
      ],
    });

    map.current.addControl(draw.current);
    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    // Handle draw events
    map.current.on("draw.create", handleDrawCreate);
    map.current.on("draw.update", handleDrawUpdate);
    map.current.on("draw.delete", handleDrawDelete);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add envelope and parcel layers when map loads
  useEffect(() => {
    if (!mapLoaded || !map.current || !envelope) return;

    // Add parcel source and layers
    if (!map.current.getSource(SOURCES.PARCEL)) {
      map.current.addSource(SOURCES.PARCEL, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: envelope.parcelGeometry,
        },
      });

      map.current.addLayer({
        id: LAYERS.PARCEL_FILL,
        type: "fill",
        source: SOURCES.PARCEL,
        paint: {
          "fill-color": "#6366F1",
          "fill-opacity": 0.1,
        },
      });

      map.current.addLayer({
        id: LAYERS.PARCEL_LINE,
        type: "line",
        source: SOURCES.PARCEL,
        paint: {
          "line-color": "#6366F1",
          "line-width": 2,
          "line-dasharray": [4, 2],
        },
      });
    }

    // Add envelope source and layers
    if (!map.current.getSource(SOURCES.ENVELOPE)) {
      map.current.addSource(SOURCES.ENVELOPE, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: envelope.buildableFootprint2d,
        },
      });

      map.current.addLayer({
        id: LAYERS.ENVELOPE_FILL,
        type: "fill",
        source: SOURCES.ENVELOPE,
        paint: {
          "fill-color": "#64748B",
          "fill-opacity": 0.15,
        },
      });

      map.current.addLayer({
        id: LAYERS.ENVELOPE_LINE,
        type: "line",
        source: SOURCES.ENVELOPE,
        paint: {
          "line-color": "#64748B",
          "line-width": 2,
          "line-dasharray": [6, 3],
        },
      });
    }

    // Add footprint source (empty initially)
    if (!map.current.getSource(SOURCES.FOOTPRINT)) {
      map.current.addSource(SOURCES.FOOTPRINT, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      map.current.addLayer({
        id: LAYERS.FOOTPRINT_FILL,
        type: "fill",
        source: SOURCES.FOOTPRINT,
        paint: {
          "fill-color": "#FF7A00",
          "fill-opacity": 0.4,
        },
      });

      map.current.addLayer({
        id: LAYERS.FOOTPRINT_LINE,
        type: "line",
        source: SOURCES.FOOTPRINT,
        paint: {
          "line-color": "#FF7A00",
          "line-width": 3,
        },
      });
    }

    // Add violation highlight source
    if (!map.current.getSource(SOURCES.VIOLATION)) {
      map.current.addSource(SOURCES.VIOLATION, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      map.current.addLayer({
        id: LAYERS.VIOLATION_LINE,
        type: "line",
        source: SOURCES.VIOLATION,
        paint: {
          "line-color": "#EF4444",
          "line-width": 4,
          "line-dasharray": [2, 2],
        },
      });
    }

    // Fit bounds to envelope
    const bounds = turf.bbox(envelope.parcelGeometry);
    map.current.fitBounds(
      [[bounds[0], bounds[1]], [bounds[2], bounds[3]]],
      { padding: 60, duration: 1000 }
    );
  }, [mapLoaded, envelope]);

  // Update footprint layer when active variant changes
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    const source = map.current.getSource(SOURCES.FOOTPRINT) as maplibregl.GeoJSONSource;
    if (!source) return;

    if (activeVariant?.footprint) {
      source.setData({
        type: "Feature",
        properties: {},
        geometry: activeVariant.footprint,
      });

      // Update violation highlight if there are violations
      updateViolationHighlight();
    } else {
      source.setData({
        type: "FeatureCollection",
        features: [],
      });
      // Clear violations
      const violationSource = map.current.getSource(SOURCES.VIOLATION) as maplibregl.GeoJSONSource;
      if (violationSource) {
        violationSource.setData({ type: "FeatureCollection", features: [] });
      }
    }
  }, [mapLoaded, activeVariant?.footprint, activeVariant?.complianceResult]);

  // Handle drawing mode changes
  useEffect(() => {
    if (!draw.current) return;

    if (isDrawing) {
      draw.current.changeMode("draw_polygon");
    } else {
      draw.current.changeMode("simple_select");
    }
  }, [isDrawing]);

  // Update violation highlight based on compliance result
  const updateViolationHighlight = useCallback(() => {
    if (!map.current || !activeVariant?.footprint || !envelope) return;

    const violationSource = map.current.getSource(SOURCES.VIOLATION) as maplibregl.GeoJSONSource;
    if (!violationSource) return;

    // Check if footprint extends outside envelope
    const isContained = turf.booleanContains(
      envelope.buildableFootprint2d,
      activeVariant.footprint
    );

    if (!isContained) {
      // Calculate the portion outside the envelope
      try {
        const difference = turf.difference(
          turf.featureCollection([
            turf.feature(activeVariant.footprint),
            turf.feature(envelope.buildableFootprint2d),
          ])
        );
        if (difference) {
          violationSource.setData(difference);
        }
      } catch {
        // If difference fails, highlight the whole footprint
        violationSource.setData({
          type: "Feature",
          properties: {},
          geometry: activeVariant.footprint,
        });
      }
    } else {
      violationSource.setData({ type: "FeatureCollection", features: [] });
    }
  }, [activeVariant?.footprint, envelope]);

  // Draw event handlers
  const handleDrawCreate = useCallback((e: any) => {
    if (!activeVariant || !e.features?.length) return;

    const drawnGeometry = e.features[0].geometry as GeoJSON.Polygon;
    
    // Clear the draw control after capture
    draw.current?.deleteAll();
    setIsDrawing(false);

    // Update variant
    updateVariant(activeVariant.id, {
      footprint: drawnGeometry,
    });

    onFootprintChange?.(drawnGeometry);
    toast.success("Footprint created");
  }, [activeVariant, updateVariant, setIsDrawing, onFootprintChange]);

  const handleDrawUpdate = useCallback((e: any) => {
    if (!activeVariant || !e.features?.length) return;

    const updatedGeometry = e.features[0].geometry as GeoJSON.Polygon;
    updateVariant(activeVariant.id, {
      footprint: updatedGeometry,
    });

    onFootprintChange?.(updatedGeometry);
  }, [activeVariant, updateVariant, onFootprintChange]);

  const handleDrawDelete = useCallback(() => {
    if (!activeVariant) return;

    updateVariant(activeVariant.id, {
      footprint: null,
    });

    onFootprintChange?.(null);
  }, [activeVariant, updateVariant, onFootprintChange]);

  return (
    <div className={cn("relative w-full h-full", className)}>
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border rounded-lg p-3 text-xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 border-2 border-dashed border-slate-500 bg-slate-500/15" />
          <span className="text-muted-foreground">Regulatory Envelope</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 border-2 border-dashed border-indigo-500 bg-indigo-500/10" />
          <span className="text-muted-foreground">Parcel Boundary</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 border-2 border-orange-500 bg-orange-500/40" />
          <span className="text-muted-foreground">Design Footprint</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 border-2 border-dashed border-red-500" />
          <span className="text-muted-foreground">Violation Area</span>
        </div>
      </div>

      {/* Drawing mode indicator */}
      {isDrawing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg">
          Click to draw footprint • Press Escape to cancel
        </div>
      )}
    </div>
  );
}
