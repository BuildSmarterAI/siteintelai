/**
 * SiteIntel™ Design Mode - Cesium 3D Viewer
 * 
 * Renders regulatory envelopes and design footprints as 3D primitives
 * with terrain, camera presets, orbit controls, shadow analysis, and basemaps.
 * Supports Google Photorealistic 3D Tiles for immersive visualization.
 */

import React, { useRef, useEffect, useCallback, useMemo, useState, MutableRefObject } from "react";
import { throttle } from "lodash-es";
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
  EasingFunction,
  Cartographic,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { useDesignStore, CameraPreset, type BasemapType } from "@/stores/useDesignStore";
import { ShadowControls } from "./ShadowControls";
import { ShadowTimeline } from "./ShadowTimeline";
import { ShadowComparisonPanel } from "./ShadowComparisonPanel";
import { MeasurementAnnotationsPanel } from "./MeasurementAnnotationsPanel";
import { GoogleEarthControls } from "./GoogleEarthControls";
import { LayersPanel } from "./LayersPanel";
import { StreetViewHUD } from "./StreetViewHUD";
import { useFirstPersonCamera } from "@/hooks/useFirstPersonCamera";
import { useShadowComparison } from "@/hooks/useShadowComparison";
import {
  feetToMeters,
  geojsonToCesiumPositions,
  getPolygonCentroid,
  DESIGN_COLORS,
  getVariantColor,
  getVariantOutlineColor,
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
  const isUserControllingRef = useRef(false); // Prevents feedback loop
  const hasInitializedViewerRef = useRef(false); // Prevents re-initialization loop
  const hasDoneInitialFlyToRef = useRef(false); // Prevents repeated fly-to
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
    shadowPlaybackSpeed,
    isStreetViewMode,
    setIsStreetViewMode,
    streetViewSettings,
    setStreetViewSettings,
    shadowComparisonMode,
  } = useDesignStore();

  // Track camera heading for street view HUD
  const [cameraHeading, setCameraHeading] = useState(0);

  // Use first-person camera hook for street view
  useFirstPersonCamera(
    viewerRef.current,
    isStreetViewMode,
    {
      walkSpeed: streetViewSettings.walkSpeed,
      eyeHeightMeters: streetViewSettings.eyeHeightMeters,
      mouseSensitivity: streetViewSettings.mouseSensitivity,
    }
  );

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

  // Use shadow comparison hook (after centroid is defined)
  useShadowComparison({
    viewer: viewerRef.current,
    latitude: centroid?.lat ?? 29.76,
    longitude: centroid?.lng ?? -95.36,
  });

  // Helper for async camera flight
  const flyAsync = useCallback((
    viewer: CesiumViewer,
    options: {
      destination: Cartesian3;
      orientation: { heading: number; pitch: number; roll: number };
      duration: number;
      easingFunction?: typeof EasingFunction.QUADRATIC_OUT;
    }
  ): Promise<void> => {
    return new Promise((resolve) => {
      viewer.camera.flyTo({
        ...options,
        complete: resolve,
        cancel: resolve,
      });
    });
  }, []);

  // Auto-tilt based on altitude for natural viewing
  const getAutoTiltForHeight = useCallback((height: number): number => {
    if (height > 1000) return -70;
    if (height > 500) return -55;
    if (height > 300) return -45;
    if (height > 100) return -30;
    return -15;
  }, []);

  // Google Earth-style fly-to with rise-travel-descend motion
  const googleEarthFlyTo = useCallback(async (
    viewer: CesiumViewer,
    targetLng: number,
    targetLat: number,
    finalHeight: number = 500,
    finalPitch: number = -45,
    finalHeading: number = 0
  ) => {
    const currentPosition = viewer.camera.positionCartographic;
    const currentHeight = currentPosition.height;
    const cruiseAltitude = Math.max(currentHeight, finalHeight) + 300;
    
    // Phase 1: Rise to cruise altitude (0.6s)
    await flyAsync(viewer, {
      destination: Cartesian3.fromRadians(
        currentPosition.longitude,
        currentPosition.latitude,
        cruiseAltitude
      ),
      orientation: { 
        heading: viewer.camera.heading, 
        pitch: CesiumMath.toRadians(-60), 
        roll: 0 
      },
      duration: 0.6,
      easingFunction: EasingFunction.QUADRATIC_OUT,
    });
    
    // Phase 2: Travel to target at cruise altitude (1.0s)
    await flyAsync(viewer, {
      destination: Cartesian3.fromDegrees(targetLng, targetLat, cruiseAltitude),
      orientation: { 
        heading: CesiumMath.toRadians(finalHeading), 
        pitch: CesiumMath.toRadians(-65), 
        roll: 0 
      },
      duration: 1.0,
      easingFunction: EasingFunction.CUBIC_IN_OUT,
    });
    
    // Phase 3: Descend to final position (0.8s)
    await flyAsync(viewer, {
      destination: Cartesian3.fromDegrees(targetLng, targetLat, finalHeight),
      orientation: { 
        heading: CesiumMath.toRadians(finalHeading), 
        pitch: CesiumMath.toRadians(finalPitch), 
        roll: 0 
      },
      duration: 0.8,
      easingFunction: EasingFunction.QUADRATIC_IN,
    });
  }, [flyAsync]);

  // Fly camera to preset position with Google Earth-style animation
  const flyToPreset = useCallback((preset: CameraPreset) => {
    const viewer = viewerRef.current;
    if (!viewer || !centroid) return;

    let heading = 0;
    let pitch = -90;
    let range = 500;

    switch (preset) {
      case "overhead":
        heading = 0;
        pitch = -85;
        range = 600;
        break;
      case "perspective_ne":
        heading = 45;
        pitch = -45;
        range = 500;
        break;
      case "perspective_sw":
        heading = 225;
        pitch = -45;
        range = 500;
        break;
      case "street":
        heading = 0;
        pitch = -15;
        range = 200;
        break;
      case "orbit":
        return;
    }

    // Use cinematic fly-to animation
    googleEarthFlyTo(viewer, centroid.lng, centroid.lat, range, pitch, heading);
  }, [centroid, googleEarthFlyTo]);

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

  // Camera state tracking for controls
  const [currentHeading, setCurrentHeading] = useState(0);
  const [currentTilt, setCurrentTilt] = useState(45);

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

  // Reset to north (heading = 0)
  const handleResetNorth = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer || !centroid) return;
    
    const currentPosition = viewer.camera.positionCartographic;
    viewer.camera.flyTo({
      destination: Cartesian3.fromRadians(
        currentPosition.longitude,
        currentPosition.latitude,
        currentPosition.height
      ),
      orientation: {
        heading: 0,
        pitch: viewer.camera.pitch,
        roll: 0,
      },
      duration: 0.5,
    });
    setCurrentHeading(0);
  }, [centroid]);

  // Tilt change handler - uses setView for instant feedback, no flyTo animation
  const handleTiltChange = useCallback((degrees: number) => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    
    // Mark as user controlling to prevent feedback loop
    isUserControllingRef.current = true;
    
    // Convert degrees (0=perspective, 90=overhead) to radians for pitch
    // Cesium pitch: -90deg = looking straight down, 0deg = looking horizontal
    const pitch = CesiumMath.toRadians(-(90 - degrees));
    
    // Use setView for instant response (no animation = no feedback loop)
    viewer.camera.setView({
      orientation: {
        heading: viewer.camera.heading,
        pitch: pitch,
        roll: 0,
      },
    });
    
    setCurrentTilt(degrees);
    
    // Reset flag after a short delay
    setTimeout(() => {
      isUserControllingRef.current = false;
    }, 50);
  }, []);

  // Reset to 3D perspective view
  const handleReset3D = useCallback(() => {
    flyToPreset("perspective_ne");
    setCurrentHeading(45);
    setCurrentTilt(45);
  }, [flyToPreset]);

  // Track camera changes with throttling to prevent feedback loops
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !viewerReady) return;

    const updateCameraState = throttle(() => {
      // Skip updates while user is actively controlling
      if (isUserControllingRef.current) return;
      
      const headingDegrees = CesiumMath.toDegrees(viewer.camera.heading);
      const pitchDegrees = CesiumMath.toDegrees(viewer.camera.pitch);
      // Convert pitch back to tilt (0=perspective, 90=overhead)
      const tilt = 90 + pitchDegrees;
      
      setCurrentHeading(headingDegrees);
      setCurrentTilt(Math.max(0, Math.min(90, tilt)));
      setCameraHeading(headingDegrees); // For street view HUD
    }, 100); // Throttle to max 10 updates/sec

    viewer.camera.changed.addEventListener(updateCameraState);
    return () => {
      viewer.camera.changed.removeEventListener(updateCameraState);
      updateCameraState.cancel();
    };
  }, [viewerReady]);

  // Enter street view mode
  const enterStreetView = useCallback(async () => {
    const viewer = viewerRef.current;
    if (!viewer || !centroid) return;

    setIsStreetViewMode(true);

    // Fly down to street level
    await googleEarthFlyTo(
      viewer,
      centroid.lng,
      centroid.lat + 0.0003, // Offset slightly to view parcel
      streetViewSettings.eyeHeightMeters,
      -5, // Nearly level horizon
      0   // Face north initially
    );
  }, [centroid, googleEarthFlyTo, setIsStreetViewMode, streetViewSettings.eyeHeightMeters]);

  // Exit street view mode
  const exitStreetView = useCallback(() => {
    setIsStreetViewMode(false);
    // Return to perspective view
    flyToPreset("perspective_ne");
  }, [setIsStreetViewMode, flyToPreset]);

  // Handle height change in street view
  const handleStreetViewHeightChange = useCallback((height: number) => {
    setStreetViewSettings({ eyeHeightMeters: height });
    
    const viewer = viewerRef.current;
    if (!viewer) return;

    const currentPosition = viewer.camera.positionCartographic;
    const newPosition = Cartesian3.fromRadians(
      currentPosition.longitude,
      currentPosition.latitude,
      height
    );

    viewer.camera.setView({
      destination: newPosition,
      orientation: {
        heading: viewer.camera.heading,
        pitch: viewer.camera.pitch,
        roll: viewer.camera.roll,
      },
    });
  }, [setStreetViewSettings]);

  // Keyboard shortcuts for 3D navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const viewer = viewerRef.current;
      if (!viewer) return;
      
      // Skip if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'n':
          // Reset to north
          handleResetNorth();
          break;
        case 'r':
          // Reset 3D view
          handleReset3D();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case 'arrowup':
          if (e.shiftKey) {
            // Tilt up (more overhead)
            handleTiltChange(Math.min(currentTilt + 10, 90));
          } else {
            // Pan forward
            viewer.camera.moveForward(50);
          }
          e.preventDefault();
          break;
        case 'arrowdown':
          if (e.shiftKey) {
            // Tilt down (more perspective)
            handleTiltChange(Math.max(currentTilt - 10, 0));
          } else {
            // Pan backward
            viewer.camera.moveBackward(50);
          }
          e.preventDefault();
          break;
        case 'arrowleft':
          // Pan left
          if (!isStreetViewMode) {
            viewer.camera.moveLeft(50);
          }
          e.preventDefault();
          break;
        case 'arrowright':
          // Pan right
          if (!isStreetViewMode) {
            viewer.camera.moveRight(50);
          }
          e.preventDefault();
          break;
        case 'g':
          // Toggle street view
          if (isStreetViewMode) {
            exitStreetView();
          } else {
            enterStreetView();
          }
          break;
        case ' ':
          // Toggle shadow animation
          if (shadowsEnabled) {
            setIsShadowAnimating(!isShadowAnimating);
            e.preventDefault();
          }
          break;
        case 'escape':
          // Exit street view on ESC
          if (isStreetViewMode) {
            exitStreetView();
            e.preventDefault();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleResetNorth, handleReset3D, handleZoomIn, handleZoomOut, handleTiltChange, currentTilt, isStreetViewMode, enterStreetView, exitStreetView, shadowsEnabled, isShadowAnimating, setIsShadowAnimating]);

  // Initialize viewer - runs ONLY ONCE
  const handleViewerReady = useCallback((viewer: CesiumViewer) => {
    // Guard: Only initialize once to prevent re-init loop
    if (hasInitializedViewerRef.current) return;
    hasInitializedViewerRef.current = true;
    
    viewerRef.current = viewer;

    // Enable shadows if configured
    if (shadowsEnabled) {
      viewer.shadows = true;
      viewer.terrainShadows = ShadowMode.RECEIVE_ONLY;
      viewer.clock.currentTime = JulianDate.fromDate(shadowDateTime);
    }

    // NOTE: Do NOT apply basemap here - the basemap useEffect handles it
    // This prevents the repeated "Applied basemap" loop

    // Mark viewer as ready - triggers the basemap effect
    setViewerReady(true);
  }, [shadowsEnabled, shadowDateTime]);
  
  // Initial fly-to when viewer AND centroid are ready (runs ONCE)
  useEffect(() => {
    if (!viewerReady || !centroid || hasDoneInitialFlyToRef.current) return;
    
    hasDoneInitialFlyToRef.current = true;
    
    // Delay initial fly to let tiles load
    const timeoutId = setTimeout(() => {
      flyToPreset("perspective_ne");
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [viewerReady, centroid, flyToPreset]);

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

      {/* Street View HUD - Only in street view mode */}
      {isStreetViewMode && (
        <StreetViewHUD
          className="absolute inset-0 z-20"
          heading={cameraHeading}
          eyeHeight={streetViewSettings.eyeHeightMeters}
          walkSpeed={streetViewSettings.walkSpeed}
          onExit={exitStreetView}
          onSpeedChange={(speed) => setStreetViewSettings({ walkSpeed: speed })}
          onHeightChange={handleStreetViewHeightChange}
        />
      )}

      {/* Google Earth-Style Navigation Controls - Hidden in street view */}
      {!isStreetViewMode && (
        <GoogleEarthControls
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetNorth={handleResetNorth}
          onTiltChange={handleTiltChange}
          onReset3D={handleReset3D}
          currentHeading={currentHeading}
          currentTilt={currentTilt}
        />
      )}

      {/* Layers Panel - Hidden in street view */}
      {!isStreetViewMode && (
        <LayersPanel 
          className="absolute bottom-4 left-4 z-10" 
          onEnterStreetView={enterStreetView}
        />
      )}

      {/* Shadow Controls - Hidden in street view */}
      {!isStreetViewMode && shadowsEnabled && !shadowComparisonMode && (
        <ShadowTimeline 
          className="absolute top-4 right-4 z-10" 
          latitude={centroid?.lat}
          longitude={centroid?.lng}
        />
      )}

      {/* Shadow Comparison Panel - When in comparison mode */}
      {!isStreetViewMode && shadowsEnabled && shadowComparisonMode && (
        <ShadowComparisonPanel className="absolute top-4 right-4 z-10" />
      )}
      
      {/* Shadow Enable Button - When shadows disabled */}
      {!isStreetViewMode && !shadowsEnabled && (
        <ShadowControls className="absolute top-4 right-4 z-10" />
      )}

      {/* Measurement Annotations Panel */}
      {!isStreetViewMode && (
        <MeasurementAnnotationsPanel className="absolute top-20 left-4 z-10" />
      )}

      {/* Drawing Mode Indicator */}
      {isDrawing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg z-10">
          <p className="text-sm font-medium">
            Click to draw polygon vertices. Double-click to complete.
          </p>
        </div>
      )}

      {/* Legend - Hidden in street view */}
      {!isStreetViewMode && (
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
      )}
    </div>
  );
}

export default CesiumViewerComponent;
