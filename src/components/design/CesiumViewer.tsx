/**
 * SiteIntel™ Design Mode - Cesium 3D Viewer
 * 
 * Renders regulatory envelopes and design footprints as 3D primitives
 * with terrain, camera presets, orbit controls, shadow analysis, and basemaps.
 * Supports Google Photorealistic 3D Tiles for immersive visualization.
 */

import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import {
  Viewer,
  Entity,
  PolygonGraphics,
} from "resium";
import {
  Viewer as CesiumViewer,
  Cartesian3,
  Color,
  Ion,
  OpenStreetMapImageryProvider,
  UrlTemplateImageryProvider,
  Math as CesiumMath,
  HeadingPitchRange,
  BoundingSphere,
  EllipsoidTerrainProvider,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  JulianDate,
  ShadowMode,
  Cesium3DTileset,
  createGooglePhotorealistic3DTileset,
  GoogleMaps,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { useDesignStore, CameraPreset, type BasemapType } from "@/stores/useDesignStore";
import { CameraControls } from "./CameraControls";
import { ShadowControls } from "./ShadowControls";
import {
  feetToMeters,
  geojsonToCesiumPositions,
  getPolygonCentroid,
  DESIGN_COLORS,
} from "@/lib/cesiumGeometry";
import { cn } from "@/lib/utils";
import * as turf from "@turf/turf";
import { useCesiumMeasurement } from "@/hooks/useCesiumMeasurement";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { useGoogleMapsToken } from "@/hooks/useGoogleMapsToken";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// Disable Ion default token warning - we're using open terrain
Ion.defaultAccessToken = "";

interface CesiumViewerComponentProps {
  className?: string;
  onFootprintChange?: (geometry: GeoJSON.Polygon | null) => void;
}

export function CesiumViewerComponent({
  className,
  onFootprintChange,
}: CesiumViewerComponentProps) {
  const viewerRef = useRef<CesiumViewer | null>(null);
  const orbitAnimationRef = useRef<number | null>(null);
  const shadowAnimationRef = useRef<number | null>(null);
  const drawingPointsRef = useRef<Cartesian3[]>([]);
  const [viewerReady, setViewerReady] = useState(false);
  const [google3DTileset, setGoogle3DTileset] = useState<Cesium3DTileset | null>(null);
  const [google3DError, setGoogle3DError] = useState<string | null>(null);

  // Fetch Mapbox token from Edge Function
  const { token: mapboxToken, isLoading: tokenLoading, error: tokenError } = useMapboxToken();
  
  // Fetch Google Maps token for 3D Tiles
  const { token: googleMapsToken, isLoading: googleTokenLoading } = useGoogleMapsToken();

  // Apply 2D basemap to viewer (for non-Google-3D modes)
  const applyBasemap = useCallback((viewer: CesiumViewer, currentBasemap: BasemapType, token: string | null) => {
    // Skip for google-3d - handled separately
    if (currentBasemap === "google-3d") {
      return;
    }
    
    // Remove all existing imagery layers
    viewer.imageryLayers.removeAll();

    // Add new basemap based on selection
    let imageryProvider;
    
    switch (currentBasemap) {
      case "satellite":
        if (token) {
          imageryProvider = new UrlTemplateImageryProvider({
            url: `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.png?access_token=${token}`,
            maximumLevel: 19,
            credit: "© Mapbox © OpenStreetMap",
          });
        } else {
          console.warn("No Mapbox token available for satellite imagery, falling back to OSM");
          imageryProvider = new OpenStreetMapImageryProvider({
            url: "https://tile.openstreetmap.org/",
          });
        }
        break;
      case "satellite-labels":
        if (token) {
          imageryProvider = new UrlTemplateImageryProvider({
            url: `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}@2x?access_token=${token}`,
            maximumLevel: 22,
            credit: "© Mapbox © OpenStreetMap",
          });
        } else {
          console.warn("No Mapbox token available for satellite-labels imagery, falling back to OSM");
          imageryProvider = new OpenStreetMapImageryProvider({
            url: "https://tile.openstreetmap.org/",
          });
        }
        break;
      case "terrain":
        if (token) {
          imageryProvider = new UrlTemplateImageryProvider({
            url: `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/{z}/{x}/{y}@2x?access_token=${token}`,
            maximumLevel: 22,
            credit: "© Mapbox © OpenStreetMap",
          });
        } else {
          console.warn("No Mapbox token available for terrain imagery, falling back to OSM");
          imageryProvider = new OpenStreetMapImageryProvider({
            url: "https://tile.openstreetmap.org/",
          });
        }
        break;
      case "osm":
      default:
        imageryProvider = new OpenStreetMapImageryProvider({
          url: "https://tile.openstreetmap.org/",
        });
        break;
    }

    viewer.imageryLayers.addImageryProvider(imageryProvider);
    console.log(`Applied basemap: ${currentBasemap}`, token ? "(with Mapbox token)" : "(OSM fallback)");
  }, []);
  
  // Load Google Photorealistic 3D Tiles
  const loadGoogle3DTiles = useCallback(async (viewer: CesiumViewer, apiKey: string) => {
    try {
      console.log("Loading Google Photorealistic 3D Tiles...");
      
      // Remove existing 3D tileset if any
      if (google3DTileset) {
        viewer.scene.primitives.remove(google3DTileset);
        setGoogle3DTileset(null);
      }
      
      // Set Google Maps API key for Cesium
      GoogleMaps.defaultApiKey = apiKey;
      
      // Create photorealistic 3D tileset
      const tileset = await createGooglePhotorealistic3DTileset();
      
      // Add to scene
      viewer.scene.primitives.add(tileset);
      setGoogle3DTileset(tileset);
      setGoogle3DError(null);
      
      console.log("Google Photorealistic 3D Tiles loaded successfully");
      toast.success("3D Buildings loaded");
    } catch (error) {
      console.error("Failed to load Google 3D Tiles:", error);
      setGoogle3DError(error instanceof Error ? error.message : "Failed to load 3D tiles");
      toast.error("Failed to load 3D buildings", {
        description: "Falling back to satellite imagery"
      });
    }
  }, [google3DTileset]);
  
  // Remove Google 3D Tiles
  const removeGoogle3DTiles = useCallback((viewer: CesiumViewer) => {
    if (google3DTileset) {
      viewer.scene.primitives.remove(google3DTileset);
      setGoogle3DTileset(null);
      console.log("Removed Google 3D Tiles");
    }
  }, [google3DTileset]);

  // Use measurement hook for 3D
  useCesiumMeasurement({ viewer: viewerRef.current });

  const {
    envelope,
    variants,
    activeVariantId,
    cameraPreset,
    isOrbiting,
    isDrawing,
    setIsDrawing,
    updateVariant,
    basemap,
    shadowsEnabled,
    shadowDateTime,
    isShadowAnimating,
    setShadowDateTime,
    setIsShadowAnimating,
  } = useDesignStore();


  const activeVariant = useMemo(
    () => variants.find((v) => v.id === activeVariantId),
    [variants, activeVariantId]
  );

  // Calculate violation geometry using Turf.js
  const violationGeometry = useMemo(() => {
    if (!activeVariant?.footprint || !envelope?.buildableFootprint2d) {
      return null;
    }

    try {
      const footprintFeature = turf.polygon(activeVariant.footprint.coordinates);
      const envelopeFeature = turf.polygon(envelope.buildableFootprint2d.coordinates);
      
      // Check if footprint is fully within envelope
      if (turf.booleanContains(envelopeFeature, footprintFeature)) {
        return null;
      }

      // Get the difference (parts outside envelope)
      const difference = turf.difference(
        turf.featureCollection([footprintFeature, envelopeFeature])
      );

      if (difference && difference.geometry.type === "Polygon") {
        return difference.geometry as GeoJSON.Polygon;
      }
    } catch (e) {
      console.warn("Error computing violation geometry:", e);
    }

    return null;
  }, [activeVariant?.footprint, envelope?.buildableFootprint2d]);

  // Get centroid for camera positioning
  const centroid = useMemo(() => {
    if (!envelope?.parcelGeometry) return null;
    return getPolygonCentroid(envelope.parcelGeometry);
  }, [envelope?.parcelGeometry]);

  // Fly camera to preset position
  const flyToPreset = useCallback((preset: CameraPreset) => {
    const viewer = viewerRef.current;
    if (!viewer || !centroid) return;

    const target = Cartesian3.fromDegrees(centroid.lng, centroid.lat);
    const range = 500; // meters

    let heading = 0;
    let pitch = -90; // Top-down
    let duration = 1.5;

    switch (preset) {
      case "overhead":
        heading = 0;
        pitch = -90;
        break;
      case "perspective_ne":
        heading = CesiumMath.toRadians(45);
        pitch = CesiumMath.toRadians(-45);
        break;
      case "perspective_sw":
        heading = CesiumMath.toRadians(225);
        pitch = CesiumMath.toRadians(-45);
        break;
      case "street":
        heading = 0;
        pitch = CesiumMath.toRadians(-15);
        break;
      case "orbit":
        // Don't fly, just start orbit
        return;
    }

    viewer.camera.flyToBoundingSphere(
      new BoundingSphere(target, range),
      {
        offset: new HeadingPitchRange(heading, pitch, range),
        duration,
      }
    );
  }, [centroid]);

  // Handle camera preset changes
  useEffect(() => {
    if (cameraPreset && cameraPreset !== "orbit") {
      flyToPreset(cameraPreset);
    }
  }, [cameraPreset, flyToPreset]);

  // Handle orbit animation
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !centroid) return;

    if (isOrbiting) {
      const target = Cartesian3.fromDegrees(centroid.lng, centroid.lat);
      
      // Start orbit
      const orbit = () => {
        viewer.camera.rotateRight(0.005);
        orbitAnimationRef.current = requestAnimationFrame(orbit);
      };
      
      // Set initial orbit position
      viewer.camera.flyToBoundingSphere(
        new BoundingSphere(target, 400),
        {
          offset: new HeadingPitchRange(0, CesiumMath.toRadians(-45), 400),
          duration: 1,
          complete: () => {
            orbit();
          },
        }
      );
    } else {
      if (orbitAnimationRef.current) {
        cancelAnimationFrame(orbitAnimationRef.current);
        orbitAnimationRef.current = null;
      }
    }

    return () => {
      if (orbitAnimationRef.current) {
        cancelAnimationFrame(orbitAnimationRef.current);
      }
    };
  }, [isOrbiting, centroid]);

  // Handle drawing mode
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (isDrawing) {
      drawingPointsRef.current = [];
      viewer.canvas.style.cursor = "crosshair";

      const handler = new ScreenSpaceEventHandler(viewer.canvas);

      handler.setInputAction((movement: ScreenSpaceEventHandler.PositionedEvent) => {
        const ray = viewer.camera.getPickRay(movement.position);
        if (!ray) return;

        const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        if (cartesian) {
          drawingPointsRef.current.push(cartesian);
        }
      }, ScreenSpaceEventType.LEFT_CLICK);

      handler.setInputAction(() => {
        // Complete polygon on double-click
        if (drawingPointsRef.current.length >= 3) {
          const positions = drawingPointsRef.current.map((cart) => {
            const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(cart);
            return [
              CesiumMath.toDegrees(cartographic.longitude),
              CesiumMath.toDegrees(cartographic.latitude),
            ];
          });

          // Close the polygon
          positions.push(positions[0]);

          const polygon: GeoJSON.Polygon = {
            type: "Polygon",
            coordinates: [positions],
          };

          if (activeVariantId) {
            updateVariant(activeVariantId, { footprint: polygon });
          }
          onFootprintChange?.(polygon);
          setIsDrawing(false);
        }
      }, ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

      return () => {
        handler.destroy();
        viewer.canvas.style.cursor = "default";
      };
    }
  }, [isDrawing, activeVariantId, updateVariant, onFootprintChange, setIsDrawing]);

  // Handle shadow animation
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !shadowsEnabled) return;

    if (isShadowAnimating) {
      let currentHour = shadowDateTime.getHours();
      
      const animate = () => {
        currentHour += 0.5; // Advance by 30 minutes
        if (currentHour > 20) {
          currentHour = 6;
        }
        
        const newDate = new Date(shadowDateTime);
        newDate.setHours(Math.floor(currentHour));
        newDate.setMinutes((currentHour % 1) * 60);
        setShadowDateTime(newDate);
        
        // Update Cesium clock
        viewer.clock.currentTime = JulianDate.fromDate(newDate);
        
        shadowAnimationRef.current = requestAnimationFrame(animate);
      };
      
      // Run at slower pace
      const intervalId = setInterval(() => {
        cancelAnimationFrame(shadowAnimationRef.current!);
        animate();
      }, 500);

      return () => {
        clearInterval(intervalId);
        if (shadowAnimationRef.current) {
          cancelAnimationFrame(shadowAnimationRef.current);
        }
      };
    } else {
      if (shadowAnimationRef.current) {
        cancelAnimationFrame(shadowAnimationRef.current);
      }
    }
  }, [isShadowAnimating, shadowsEnabled, shadowDateTime, setShadowDateTime]);

  // Update Cesium clock when shadow datetime changes
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !shadowsEnabled) return;

    viewer.clock.currentTime = JulianDate.fromDate(shadowDateTime);
  }, [shadowDateTime, shadowsEnabled]);

  // Handle basemap changes - runs when viewer is ready OR basemap/token changes
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !viewerReady) return;

    if (basemap === "google-3d") {
      // Remove 2D imagery layers for Google 3D (it has its own imagery)
      viewer.imageryLayers.removeAll();
      
      // Load Google 3D Tiles if we have the token
      if (googleMapsToken) {
        loadGoogle3DTiles(viewer, googleMapsToken);
      } else if (!googleTokenLoading) {
        console.warn("No Google Maps token available for 3D tiles");
        toast.error("Google Maps API key not configured");
      }
    } else {
      // Remove Google 3D tiles if switching away
      removeGoogle3DTiles(viewer);
      
      // Apply 2D basemap
      applyBasemap(viewer, basemap, mapboxToken);
    }
  }, [basemap, mapboxToken, googleMapsToken, googleTokenLoading, viewerReady, applyBasemap, loadGoogle3DTiles, removeGoogle3DTiles]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    const viewer = viewerRef.current;
    if (viewer) {
      viewer.camera.zoomIn(100);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    const viewer = viewerRef.current;
    if (viewer) {
      viewer.camera.zoomOut(100);
    }
  }, []);

  const handleResetCamera = useCallback(() => {
    flyToPreset("overhead");
  }, [flyToPreset]);

  // Initialize viewer
  const handleViewerReady = useCallback((viewer: CesiumViewer) => {
    viewerRef.current = viewer;

    // Enable shadows if configured
    if (shadowsEnabled) {
      viewer.shadows = true;
      viewer.terrainShadows = ShadowMode.RECEIVE_ONLY;
      viewer.clock.currentTime = JulianDate.fromDate(shadowDateTime);
    }

    // Apply initial basemap immediately
    applyBasemap(viewer, basemap, mapboxToken);

    // Mark viewer as ready - this will also trigger the basemap effect
    setViewerReady(true);

    // Fly to initial position
    if (centroid) {
      setTimeout(() => {
        flyToPreset("perspective_ne");
      }, 500);
    }
  }, [centroid, flyToPreset, shadowsEnabled, shadowDateTime, applyBasemap, basemap, mapboxToken]);

  // Show loading while fetching token
  if (tokenLoading) {
    return (
      <div className={cn("flex items-center justify-center bg-muted h-full", className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading 3D viewer...</span>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className={cn("flex items-center justify-center bg-muted h-full", className)}>
        <div className="text-center text-muted-foreground">
          <p>Failed to load 3D viewer</p>
          <p className="text-xs mt-1">{tokenError}</p>
        </div>
      </div>
    );
  }

  if (!envelope?.parcelGeometry) {
    return (
      <div className={cn("flex items-center justify-center bg-muted", className)}>
        <p className="text-muted-foreground">Loading envelope data...</p>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full", className)}>
      <Viewer
        full
        ref={(ref) => {
          if (ref?.cesiumElement) {
            handleViewerReady(ref.cesiumElement);
          }
        }}
        timeline={false}
        animation={false}
        baseLayerPicker={false}
        geocoder={false}
        homeButton={false}
        sceneModePicker={false}
        navigationHelpButton={false}
        fullscreenButton={false}
        // Use simple ellipsoid terrain - no Ion dependency, no async loading
        terrainProvider={new EllipsoidTerrainProvider()}
        shadows={shadowsEnabled}
        terrainShadows={shadowsEnabled ? ShadowMode.RECEIVE_ONLY : ShadowMode.DISABLED}
      >
        {/* Parcel Boundary (ground polygon) */}
        <Entity name="parcel-boundary">
          <PolygonGraphics
            hierarchy={geojsonToCesiumPositions(envelope.parcelGeometry)}
            material={DESIGN_COLORS.parcelBoundary}
            outline
            outlineColor={DESIGN_COLORS.parcelOutline}
            outlineWidth={2}
            height={0}
            classificationType={1}
          />
        </Entity>

        {/* Regulatory Envelope (extruded volume) */}
        {envelope.buildableFootprint2d && (
          <Entity name="regulatory-envelope">
            <PolygonGraphics
              hierarchy={geojsonToCesiumPositions(envelope.buildableFootprint2d)}
              extrudedHeight={feetToMeters(envelope.heightCapFt)}
              height={0}
              material={DESIGN_COLORS.envelope}
              outline
              outlineColor={DESIGN_COLORS.envelopeOutline}
              outlineWidth={1}
            />
          </Entity>
        )}

        {/* Design Footprint (extruded volume) */}
        {activeVariant?.footprint && (
          <Entity name="design-footprint">
            <PolygonGraphics
              hierarchy={geojsonToCesiumPositions(activeVariant.footprint)}
              extrudedHeight={feetToMeters(activeVariant.heightFt)}
              height={0}
              material={DESIGN_COLORS.footprint}
              outline
              outlineColor={DESIGN_COLORS.footprintOutline}
              outlineWidth={2}
              shadows={shadowsEnabled ? ShadowMode.ENABLED : ShadowMode.DISABLED}
            />
          </Entity>
        )}

        {/* Violation Zone (parts outside envelope) */}
        {violationGeometry && activeVariant && (
          <Entity name="violation-zone">
            <PolygonGraphics
              hierarchy={geojsonToCesiumPositions(violationGeometry)}
              extrudedHeight={feetToMeters(activeVariant.heightFt)}
              height={0}
              material={DESIGN_COLORS.violation}
              outline
              outlineColor={DESIGN_COLORS.violationOutline}
              outlineWidth={2}
              shadows={shadowsEnabled ? ShadowMode.ENABLED : ShadowMode.DISABLED}
            />
          </Entity>
        )}
      </Viewer>

      {/* Camera Controls Overlay */}
      <CameraControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetCamera={handleResetCamera}
      />

      {/* Shadow Controls - Only in 3D mode */}
      <ShadowControls className="absolute top-4 right-4 z-10" />

      {/* Drawing Mode Indicator */}
      {isDrawing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg z-10">
          <p className="text-sm font-medium">
            Click to draw polygon vertices. Double-click to complete.
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg border shadow-lg p-3 z-10">
        <h4 className="text-xs font-semibold text-muted-foreground mb-2">Legend</h4>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-blue-500/30 border border-blue-500" />
            <span>Parcel Boundary</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-slate-500/15 border border-slate-500/50" />
            <span>Regulatory Envelope</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#FF7A00]/60 border border-[#FF7A00]" />
            <span>Design Footprint</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-red-500/50 border border-red-500" />
            <span>Violation Zone</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CesiumViewerComponent;
