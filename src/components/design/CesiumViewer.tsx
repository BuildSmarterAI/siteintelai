/**
 * SiteIntel™ Design Mode - Cesium 3D Viewer
 * 
 * Renders regulatory envelopes and design footprints as 3D primitives
 * with terrain, camera presets, orbit controls, shadow analysis, and basemaps.
 * Supports Google Photorealistic 3D Tiles for immersive visualization.
 */

import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { throttle } from "lodash-es";
import { shallow } from "zustand/shallow";
import {
  Viewer,
  Entity,
  PolygonGraphics,
  PolylineGraphics,
  ModelGraphics,
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
  createOsmBuildingsAsync,
  GoogleMaps,
  EasingFunction,
  Cartographic,
  createWorldTerrainAsync,
  TerrainProvider,
  sampleTerrainMostDetailed,
  HeadingPitchRoll,
  Transforms,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { useDesignStore, CameraPreset, type BasemapType, type Buildings3DSource } from "@/stores/useDesignStore";
import { useWizardStore } from "@/stores/useWizardStore";

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
import { useBuildingModel, getModelSignedUrl, DEFAULT_TRANSFORM } from "@/hooks/useBuildingModels";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// Set Cesium Ion token from environment for OSM Buildings
const cesiumIonToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
if (cesiumIonToken) {
  Ion.defaultAccessToken = cesiumIonToken;
} else {
  // Disable Ion default token warning if no token provided
  Ion.defaultAccessToken = "";
}

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
  const terrainLoadedRef = useRef(false); // Prevents duplicate terrain loads
  const osmBuildingsLoadingRef = useRef(false); // Prevents duplicate OSM buildings loads
  const google3DLoadingRef = useRef(false); // Prevents duplicate Google 3D loads
  
  // Stable refs for tilesets to avoid callback recreation
  const google3DTilesetRef = useRef<Cesium3DTileset | null>(null);
  const osmBuildingsTilesetRef = useRef<Cesium3DTileset | null>(null);
  const currentBasemapRef = useRef<BasemapType | null>(null);
  const currentBuildingsSourceRef = useRef<Buildings3DSource | null>(null);
  
  const [viewerReady, setViewerReady] = useState(false);
  const [google3DTileset, setGoogle3DTileset] = useState<Cesium3DTileset | null>(null);
  const [osmBuildingsTileset, setOsmBuildingsTileset] = useState<Cesium3DTileset | null>(null);
  const [google3DError, setGoogle3DError] = useState<string | null>(null);
  const [terrainProvider, setTerrainProvider] = useState<TerrainProvider | undefined>(undefined);
  const [terrainLoading, setTerrainLoading] = useState(false);
  const [buildings3DLoading, setBuildings3DLoading] = useState(false);
  
  // Ground height sampling for Google 3D mode
  const [groundHeightMeters, setGroundHeightMeters] = useState<number | null>(null);
  
  // Animation state for envelope 2D/3D transition
  const [envelopeAnimProgress, setEnvelopeAnimProgress] = useState(1); // 0 = 2D, 1 = 3D
  const envelopeAnimRef = useRef<number | null>(null);

  // Fetch Mapbox token from Edge Function
  const { token: mapboxToken, isLoading: tokenLoading, error: tokenError } = useMapboxToken();
  
  // Fetch Google Maps token for 3D Tiles
  const { token: googleMapsToken, isLoading: googleTokenLoading } = useGoogleMapsToken();

  // Get store actions for Google 3D state
  const setStoreGoogle3DAvailable = useDesignStore((state) => state.setGoogle3DAvailable);
  const setStoreGoogle3DError = useDesignStore((state) => state.setGoogle3DError);

  // Clamp to Google 3D Tiles surface for accurate ground height
  const clampToGoogle3DSurface = useCallback(async (viewer: CesiumViewer) => {
    const envelope = useDesignStore.getState().envelope;
    if (!envelope?.parcelGeometry) {
      console.warn("[GroundHeight] No parcel geometry for clamping");
      return;
    }

    try {
      const coords = envelope.parcelGeometry.coordinates[0] as [number, number][];
      const centroid = getPolygonCentroid(envelope.parcelGeometry);
      
      // Sample boundary vertices + centroid at high altitude for clamping
      const sampleCount = Math.min(8, coords.length);
      const step = Math.max(1, Math.floor(coords.length / sampleCount));
      
      const positions: Cartesian3[] = [];
      
      // Add centroid
      positions.push(Cartesian3.fromDegrees(centroid.lng, centroid.lat, 1000));
      
      // Add boundary vertices
      for (let i = 0; i < coords.length; i += step) {
        const [lng, lat] = coords[i];
        positions.push(Cartesian3.fromDegrees(lng, lat, 1000));
      }

      console.log(`[GroundHeight] Clamping ${positions.length} points to Google 3D surface...`);

      // Clamp positions to the rendered 3D Tiles surface
      const clampedPositions = await viewer.scene.clampToHeightMostDetailed(positions);
      
      const heights = clampedPositions
        .map(pos => {
          const carto = Cartographic.fromCartesian(pos);
          return carto.height;
        })
        .filter(h => !isNaN(h) && h !== undefined);

      if (heights.length > 0) {
        // Use minimum height to ensure no floating on sloped terrain
        const minHeight = Math.min(...heights);
        console.log(`[GroundHeight] Google 3D clamped height: ${minHeight.toFixed(2)}m (min of ${heights.length} points)`);
        setGroundHeightMeters(minHeight);
      } else {
        console.warn("[GroundHeight] No valid heights from clamping, using 0");
        setGroundHeightMeters(0);
      }
    } catch (error) {
      console.error("[GroundHeight] Error clamping to Google 3D surface:", error);
      setGroundHeightMeters(0);
    }
  }, []);

  // Sample terrain height for non-Google modes (OSM/terrain)
  const sampleTerrainHeight = useCallback(async () => {
    const envelope = useDesignStore.getState().envelope;
    if (!envelope?.parcelGeometry) {
      console.warn("[GroundHeight] No parcel geometry for terrain sampling");
      return;
    }

    try {
      const coords = envelope.parcelGeometry.coordinates[0] as [number, number][];
      const centroid = getPolygonCentroid(envelope.parcelGeometry);

      // Sample centroid + boundary vertices
      const sampleCount = Math.min(5, coords.length);
      const step = Math.max(1, Math.floor(coords.length / sampleCount));

      const cartographics: Cartographic[] = [
        Cartographic.fromDegrees(centroid.lng, centroid.lat)
      ];

      for (let i = 0; i < coords.length; i += step) {
        const [lng, lat] = coords[i];
        cartographics.push(Cartographic.fromDegrees(lng, lat));
      }

      console.log(`[GroundHeight] Sampling terrain at ${cartographics.length} points...`);

      const worldTerrain = await createWorldTerrainAsync();
      const sampledPositions = await sampleTerrainMostDetailed(worldTerrain, cartographics);

      const heights = sampledPositions
        .map(p => p.height)
        .filter(h => h !== undefined && !isNaN(h));

      if (heights.length > 0) {
        const minHeight = Math.min(...heights);
        console.log(`[GroundHeight] Terrain height: ${minHeight.toFixed(2)}m (min of ${heights.length} points)`);
        setGroundHeightMeters(minHeight);
      } else {
        console.warn("[GroundHeight] No valid terrain heights, using 0");
        setGroundHeightMeters(0);
      }
    } catch (error) {
      console.error("[GroundHeight] Terrain sampling failed:", error);
      setGroundHeightMeters(0);
    }
  }, []);

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
  
  // Load Google Photorealistic 3D Tiles with robust error handling
  const loadGoogle3DTiles = useCallback(async (viewer: CesiumViewer, apiKey: string, onFallbackToOsm?: () => void) => {
    // Prevent duplicate loads using ref
    if (google3DLoadingRef.current) {
      console.log("Google 3D Tiles already loading, skipping...");
      return;
    }
    
    // Check if already loaded via ref
    if (google3DTilesetRef.current) {
      console.log("Google 3D Tiles already loaded");
      return;
    }
    
    google3DLoadingRef.current = true;
    setBuildings3DLoading(true);
    
    try {
      console.log("[Google3D] Loading Photorealistic 3D Tiles...");
      console.log("[Google3D] API Key (first 10 chars):", apiKey.substring(0, 10) + "...");
      console.log("[Google3D] Current domain:", window.location.hostname);
      console.log("[Google3D] Current origin:", window.location.origin);
      
      // Remove existing OSM tileset using ref
      if (osmBuildingsTilesetRef.current) {
        viewer.scene.primitives.remove(osmBuildingsTilesetRef.current);
        osmBuildingsTilesetRef.current = null;
        setOsmBuildingsTileset(null);
      }
      
      // Set Google Maps API key for Cesium
      GoogleMaps.defaultApiKey = apiKey;
      console.log("[Google3D] GoogleMaps.defaultApiKey set");
      
      // Create photorealistic 3D tileset
      const tileset = await createGooglePhotorealistic3DTileset();
      console.log("[Google3D] Tileset created successfully");
      
      // === Performance Optimizations for Google 3D Tiles ===
      tileset.maximumScreenSpaceError = 16; // Default 16, lower = sharper but slower
      tileset.preloadWhenHidden = false; // Don't load tiles when not visible
      tileset.skipLevelOfDetail = false; // Ensure proper LOD loading
      tileset.dynamicScreenSpaceError = true; // Adaptive quality based on camera speed
      tileset.dynamicScreenSpaceErrorDensity = 0.00278;
      tileset.dynamicScreenSpaceErrorFactor = 4.0;
      
      // These properties may not be in TypeScript types but exist in Cesium runtime
      (tileset as any).maximumMemoryUsage = 512; // MB - prevents memory bloat
      (tileset as any).cullWithChildrenBounds = true; // Better culling performance
      
      // Add to scene
      viewer.scene.primitives.add(tileset);
      google3DTilesetRef.current = tileset;
      setGoogle3DTileset(tileset);
      setGoogle3DError(null);
      
      // === CRITICAL: Configure scene for Google 3D Tiles ===
      // Hide globe - Google 3D includes its own ground surface, prevents z-fighting
      viewer.scene.globe.show = false;
      // Disable globe depth testing - not needed with hidden globe
      viewer.scene.globe.depthTestAgainstTerrain = false;
      // Enable atmospheric fog for realistic perspective
      viewer.scene.fog.enabled = true;
      viewer.scene.fog.density = 0.0002;
      viewer.scene.fog.minimumBrightness = 0.03;
      
      // Wait briefly for tiles to load, then clamp to surface
      setTimeout(() => {
        if (viewerRef.current) {
          clampToGoogle3DSurface(viewerRef.current);
        }
      }, 2000); // Give tiles time to load
      
      console.log("[Google3D] Photorealistic 3D Tiles loaded successfully (with performance optimizations)");
      toast.success("Google 3D Buildings loaded");
      
      // Update store state on success
      setStoreGoogle3DAvailable(true);
      setStoreGoogle3DError(null);
    } catch (error) {
      console.error("[Google3D] Failed to load 3D Tiles:", error);
      
      // Enhanced error logging
      if (error instanceof Error) {
        console.error("[Google3D] Error name:", error.name);
        console.error("[Google3D] Error message:", error.message);
        console.error("[Google3D] Error stack:", error.stack);
      }
      try {
        console.error("[Google3D] Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      } catch {
        console.error("[Google3D] Could not stringify error");
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      setGoogle3DError(errorMessage);
      
      // Update store state on failure
      setStoreGoogle3DAvailable(false);
      setStoreGoogle3DError(errorMessage);
      
      // Provide specific error messages based on error type
      if (errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("Access Denied")) {
        toast.error("Google 3D Tiles Access Denied", {
          description: "Check API key restrictions: add your domain to HTTP referrers and enable Map Tiles API + Maps JavaScript API",
          duration: 8000,
        });
      } else if (errorMessage.includes("401") || errorMessage.includes("unauthorized")) {
        toast.error("Google 3D Tiles Unauthorized", {
          description: "Invalid or missing Google Maps API key",
          duration: 6000,
        });
      } else if (errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        toast.error("Google 3D Tiles Quota Exceeded", {
          description: "Your Google Maps API quota has been reached",
          duration: 6000,
        });
      } else {
        toast.error("Google 3D Tiles Unavailable", {
          description: "Switching to OSM Buildings",
          duration: 4000,
        });
      }
      
      // Auto-fallback to OSM Buildings via callback
      if (onFallbackToOsm) {
        console.log("Auto-falling back to OSM Buildings...");
        onFallbackToOsm();
      }
    } finally {
      google3DLoadingRef.current = false;
      setBuildings3DLoading(false);
    }
  }, [setStoreGoogle3DAvailable, setStoreGoogle3DError]); // Removed tileset dependencies - uses refs
  
  // Load Cesium OSM Buildings (requires Cesium Ion token)
  const loadOsmBuildings = useCallback(async (viewer: CesiumViewer, googleToken: string | null, onFallback?: (source: "google" | "none") => void) => {
    // Prevent duplicate loads
    if (osmBuildingsLoadingRef.current) {
      console.log("OSM Buildings already loading, skipping...");
      return;
    }
    
    // Check if already loaded via ref
    if (osmBuildingsTilesetRef.current) {
      console.log("OSM Buildings already loaded");
      return;
    }
    
    osmBuildingsLoadingRef.current = true;
    setBuildings3DLoading(true);
    
    try {
      console.log("Loading Cesium OSM Buildings...");
      
      // Remove existing Google tileset using ref
      if (google3DTilesetRef.current) {
        viewer.scene.primitives.remove(google3DTilesetRef.current);
        google3DTilesetRef.current = null;
        setGoogle3DTileset(null);
      }
      
      // Create OSM buildings tileset (uses Cesium Ion asset 96188)
      const tileset = await createOsmBuildingsAsync();
      
      // Add to scene
      viewer.scene.primitives.add(tileset);
      osmBuildingsTilesetRef.current = tileset;
      setOsmBuildingsTileset(tileset);
      
      console.log("Cesium OSM Buildings loaded successfully");
    } catch (error) {
      console.error("Failed to load OSM Buildings:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      
      // Check if this is a token-related error
      if (errorMsg.includes("401") || errorMsg.includes("token") || errorMsg.includes("unauthorized") || errorMsg.includes("Ion")) {
        console.log("OSM Buildings require Cesium Ion token - falling back to Google 3D or none");
        
        // Try Google 3D as fallback if token is available
        if (googleToken && onFallback) {
          toast.info("OSM Buildings unavailable", {
            description: "Using Google 3D Tiles instead"
          });
          onFallback("google");
        } else if (onFallback) {
          toast.error("3D Buildings unavailable", {
            description: "Configure Cesium Ion or Google Maps API key"
          });
          onFallback("none");
        }
      } else {
        toast.error("Failed to load OSM buildings");
      }
    } finally {
      osmBuildingsLoadingRef.current = false;
      setBuildings3DLoading(false);
    }
  }, []); // No dependencies - uses refs and passed parameters
  
  // Remove all 3D buildings - uses refs for stable callback
  const removeAllBuildings = useCallback((viewer: CesiumViewer) => {
    if (google3DTilesetRef.current) {
      viewer.scene.primitives.remove(google3DTilesetRef.current);
      google3DTilesetRef.current = null;
      setGoogle3DTileset(null);
    }
    if (osmBuildingsTilesetRef.current) {
      viewer.scene.primitives.remove(osmBuildingsTilesetRef.current);
      osmBuildingsTilesetRef.current = null;
      setOsmBuildingsTileset(null);
    }
    console.log("Removed all 3D buildings");
  }, []); // No dependencies - uses refs
  
  // Remove Google 3D Tiles - uses refs for stable callback
  const removeGoogle3DTiles = useCallback((viewer: CesiumViewer) => {
    if (google3DTilesetRef.current) {
      viewer.scene.primitives.remove(google3DTilesetRef.current);
      google3DTilesetRef.current = null;
      setGoogle3DTileset(null);
      
      // Restore scene settings
      viewer.scene.globe.show = true;
      viewer.scene.globe.depthTestAgainstTerrain = true;
      viewer.scene.fog.enabled = false;
      
      // Reset ground height when leaving Google mode
      setGroundHeightMeters(null);
      
      console.log("Removed Google 3D Tiles");
    }
  }, []); // No dependencies - uses refs

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
    buildings3dSource,
    setBuildings3dSource,
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
    // Preview geometry (ephemeral - from Building Type step)
    previewGeometry,
    previewHeightFt,
  } = useDesignStore();

  // Wizard state - only show building preview on step 3
  const wizardIsOpen = useWizardStore((s) => s.isOpen);
  const wizardCurrentStep = useWizardStore((s) => s.currentStep);
  const selectedModelId = useWizardStore((s) => s.selectedModelId);
  const modelTransform = useWizardStore((s) => s.modelTransform) || DEFAULT_TRANSFORM;
  
  // Fetch selected building model data
  const { data: selectedBuildingModel, isLoading: modelLoading } = useBuildingModel(selectedModelId);
  
  // State for GLB model signed URL
  const [glbModelUrl, setGlbModelUrl] = useState<string | null>(null);
  const [glbModelLoading, setGlbModelLoading] = useState(false);
  
  // Fetch signed URL when model changes
  useEffect(() => {
    if (!selectedBuildingModel?.glb_storage_path) {
      setGlbModelUrl(null);
      return;
    }
    
    let mounted = true;
    setGlbModelLoading(true);
    
    getModelSignedUrl(selectedBuildingModel.glb_storage_path)
      .then((url) => {
        if (mounted) {
          setGlbModelUrl(url);
          setGlbModelLoading(false);
          if (url) {
            console.log('[CesiumViewer] GLB model URL loaded');
          }
        }
      })
      .catch((err) => {
        console.error('[CesiumViewer] Failed to get GLB model URL:', err);
        if (mounted) {
          setGlbModelUrl(null);
          setGlbModelLoading(false);
        }
      });
    
    return () => {
      mounted = false;
    };
  }, [selectedBuildingModel?.glb_storage_path]);
  
  // NOTE: showGlbModel and showBuildingPreview are defined after centroid to avoid use-before-declaration

  // Animate envelope transition (2D ↔ 3D) when wizard opens/closes
  useEffect(() => {
    const duration = 500; // ms
    const startTime = performance.now();
    const startProgress = envelopeAnimProgress;
    const endProgress = wizardIsOpen ? 0 : 1; // 0 = 2D, 1 = 3D
    
    // Early exit if already at target
    if (Math.abs(startProgress - endProgress) < 0.01) return;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - t, 3);
      
      const newProgress = startProgress + (endProgress - startProgress) * eased;
      setEnvelopeAnimProgress(newProgress);
      
      if (t < 1) {
        envelopeAnimRef.current = requestAnimationFrame(animate);
      }
    };
    
    envelopeAnimRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (envelopeAnimRef.current) {
        cancelAnimationFrame(envelopeAnimRef.current);
      }
    };
  }, [wizardIsOpen]);

  // Compute animated envelope properties
  const envelopeAnimatedProps = useMemo(() => {
    const groundHeight = groundHeightMeters ?? 0;
    const maxHeight = groundHeight + feetToMeters(envelope?.heightCapFt ?? 0);
    
    // Interpolate height: 0 progress = ground height only (2D), 1 = full extrusion
    const animatedHeight = envelopeAnimProgress > 0.01 
      ? groundHeight + (maxHeight - groundHeight) * envelopeAnimProgress
      : undefined;
    
    // Interpolate material alpha: 0 progress = transparent, 1 = 0.15 alpha
    const baseAlpha = 0.15;
    const animatedAlpha = baseAlpha * envelopeAnimProgress;
    
    // Interpolate outline: more visible when 2D
    const outlineAlpha = 0.3 + 0.5 * (1 - envelopeAnimProgress);
    const outlineWidth = 2 - envelopeAnimProgress; // 2px when 2D, 1px when 3D
    
    return {
      extrudedHeight: animatedHeight,
      material: Color.fromCssColorString('#64748b').withAlpha(animatedAlpha),
      outlineColor: Color.fromCssColorString('#64748b').withAlpha(outlineAlpha),
      outlineWidth: Math.max(1, outlineWidth),
    };
  }, [envelopeAnimProgress, groundHeightMeters, envelope?.heightCapFt]);

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

  // Determine if we should show a 3D GLB model instead of extruded polygon
  const showGlbModel = !!(
    wizardIsOpen &&
    (wizardCurrentStep === 3 || wizardCurrentStep === 4) &&
    selectedModelId &&
    glbModelUrl &&
    centroid
  );
  
  // Show polygon preview when no GLB or loading
  const showBuildingPreview = !!(
    wizardIsOpen === true &&
    wizardCurrentStep === 3 &&
    previewGeometry &&
    previewHeightFt &&
    !showGlbModel
  );

  // Calculate optimal camera range based on parcel size
  const optimalCameraRange = useMemo(() => {
    if (!envelope?.parcelGeometry) return 400; // Default fallback
    
    try {
      // Calculate bounding box and diagonal distance
      const bbox = turf.bbox(envelope.parcelGeometry);
      const [minLng, minLat, maxLng, maxLat] = bbox;
      
      const corner1 = turf.point([minLng, minLat]);
      const corner2 = turf.point([maxLng, maxLat]);
      const diagonalKm = turf.distance(corner1, corner2, { units: 'kilometers' });
      const diagonalMeters = diagonalKm * 1000;
      
      // Optimal range = diagonal * 1.8 for good framing
      // Clamp between 150m (small parcels) and 1500m (large parcels)
      const range = Math.min(1500, Math.max(150, diagonalMeters * 1.8));
      
      console.log(`[Camera] Parcel diagonal: ${diagonalMeters.toFixed(0)}m, optimal range: ${range.toFixed(0)}m`);
      return range;
    } catch (e) {
      console.warn("[Camera] Failed to calculate optimal range:", e);
      return 400;
    }
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
    let range = optimalCameraRange;

    switch (preset) {
      case "parcel_fit": // Best initial view - SE perspective
        heading = 135;
        pitch = -42;
        range = optimalCameraRange;
        break;
      case "overhead":
        heading = 0;
        pitch = -85;
        range = optimalCameraRange * 1.2;
        break;
      case "perspective_ne":
        heading = 45;
        pitch = -45;
        range = optimalCameraRange;
        break;
      case "perspective_sw":
        heading = 225;
        pitch = -45;
        range = optimalCameraRange;
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
  }, [centroid, googleEarthFlyTo, optimalCameraRange]);

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

  // Handle shadow animation - optimized with pure requestAnimationFrame
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !shadowsEnabled || !isShadowAnimating) return;

    let currentHour = shadowDateTime.getHours() + shadowDateTime.getMinutes() / 60;
    let lastUpdateTime = 0;
    const updateInterval = 500 / shadowPlaybackSpeed; // ms between updates

    const animate = (timestamp: number) => {
      if (timestamp - lastUpdateTime >= updateInterval) {
        lastUpdateTime = timestamp;
        
        currentHour += 0.5; // Advance by 30 minutes
        if (currentHour > 20) currentHour = 6;
        
        const newDate = new Date(shadowDateTime);
        newDate.setHours(Math.floor(currentHour));
        newDate.setMinutes((currentHour % 1) * 60);
        
        setShadowDateTime(newDate);
        viewer.clock.currentTime = JulianDate.fromDate(newDate);
      }
      
      shadowAnimationRef.current = requestAnimationFrame(animate);
    };
    
    shadowAnimationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (shadowAnimationRef.current) {
        cancelAnimationFrame(shadowAnimationRef.current);
        shadowAnimationRef.current = null;
      }
    };
  }, [isShadowAnimating, shadowsEnabled, shadowPlaybackSpeed, setShadowDateTime]);

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
    
    // Skip if basemap hasn't actually changed
    if (currentBasemapRef.current === basemap) return;
    currentBasemapRef.current = basemap;

    if (basemap === "google-3d") {
      // For google-3d basemap, we need to use Google 3D tiles which includes imagery
      viewer.imageryLayers.removeAll();
      
      // Sync buildings source to google when basemap is google-3d
      if (buildings3dSource !== "google") {
        currentBuildingsSourceRef.current = "google";
        setBuildings3dSource("google");
      }
      
      // Load Google 3D tiles if we have a token
      if (googleMapsToken) {
        loadGoogle3DTiles(viewer, googleMapsToken, () => {
          currentBuildingsSourceRef.current = "osm";
          setBuildings3dSource("osm");
        });
      } else if (!googleTokenLoading) {
        console.warn("No Google Maps token available for 3D tiles");
        toast.error("Google Maps API key not configured");
      }
    } else {
      // Apply 2D basemap (OSM, satellite, etc.)
      applyBasemap(viewer, basemap, mapboxToken);
    }
  }, [basemap, mapboxToken, googleMapsToken, googleTokenLoading, viewerReady, applyBasemap, loadGoogle3DTiles, buildings3dSource, setBuildings3dSource]);

  // Handle 3D buildings source changes
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !viewerReady) return;

    // Skip if basemap is google-3d (handled by basemap effect)
    if (basemap === "google-3d") return;
    
    // Skip if buildings source hasn't actually changed
    if (currentBuildingsSourceRef.current === buildings3dSource) return;
    currentBuildingsSourceRef.current = buildings3dSource;

    switch (buildings3dSource) {
      case "osm":
        loadOsmBuildings(viewer, googleMapsToken, (fallback) => {
          currentBuildingsSourceRef.current = fallback;
          setBuildings3dSource(fallback);
        });
        break;
        
      case "google":
        if (googleMapsToken) {
          loadGoogle3DTiles(viewer, googleMapsToken, () => {
            currentBuildingsSourceRef.current = "osm";
            setBuildings3dSource("osm");
          });
        } else if (!googleTokenLoading) {
          toast.error("Google Maps API key required", {
            description: "Falling back to OSM buildings"
          });
          currentBuildingsSourceRef.current = "osm";
          setBuildings3dSource("osm");
        }
        break;
        
      case "none":
        removeAllBuildings(viewer);
        break;
    }
  }, [buildings3dSource, viewerReady, googleMapsToken, googleTokenLoading, basemap, loadOsmBuildings, loadGoogle3DTiles, removeAllBuildings, setBuildings3dSource]);

  // Sample terrain height for non-Google modes (OSM buildings or terrain-only)
  useEffect(() => {
    if (
      viewerReady && 
      buildings3dSource !== "google" && 
      envelope?.parcelGeometry && 
      groundHeightMeters === null
    ) {
      console.log("[GroundHeight] Triggering terrain sampling for non-Google mode");
      sampleTerrainHeight();
    }
  }, [viewerReady, buildings3dSource, envelope?.parcelGeometry, groundHeightMeters, sampleTerrainHeight]);
  const cameraStateRef = useRef({ heading: 0, tilt: 45 });
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

  // Track camera changes with throttling to prevent feedback loops - optimized
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !viewerReady) return;

    const updateCameraState = throttle(() => {
      // Skip updates while user is actively controlling
      if (isUserControllingRef.current) return;
      
      const headingDegrees = CesiumMath.toDegrees(viewer.camera.heading);
      const pitchDegrees = CesiumMath.toDegrees(viewer.camera.pitch);
      // Convert pitch back to tilt (0=perspective, 90=overhead)
      const tilt = Math.max(0, Math.min(90, 90 + pitchDegrees));
      
      // Update ref immediately (for keyboard handlers)
      cameraStateRef.current = { heading: headingDegrees, tilt };
      
      // Batch state updates
      setCurrentHeading(headingDegrees);
      setCurrentTilt(tilt);
      setCameraHeading(headingDegrees); // For street view HUD
    }, 150); // Increase throttle to 150ms for better performance

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

  // Load Cesium World Terrain (requires Ion token)
  const loadWorldTerrain = useCallback(async (viewer: CesiumViewer) => {
    if (terrainLoadedRef.current) return;
    terrainLoadedRef.current = true;
    
    if (!cesiumIonToken) {
      console.warn("No Cesium Ion token - using ellipsoid terrain");
      return;
    }
    
    try {
      setTerrainLoading(true);
      console.log("Loading Cesium World Terrain...");
      
      const terrain = await createWorldTerrainAsync({
        requestWaterMask: true,
        requestVertexNormals: true,
      });
      
      viewer.terrainProvider = terrain;
      setTerrainProvider(terrain);
      console.log("Cesium World Terrain loaded successfully");
    } catch (error) {
      console.error("Failed to load world terrain:", error);
      // Keep ellipsoid as fallback - already set in Viewer component
    } finally {
      setTerrainLoading(false);
    }
  }, []);

  // Initialize viewer - runs ONLY ONCE with scene performance optimizations
  const handleViewerReady = useCallback((viewer: CesiumViewer) => {
    // Guard: Only initialize once to prevent re-init loop
    if (hasInitializedViewerRef.current) return;
    hasInitializedViewerRef.current = true;
    
    viewerRef.current = viewer;

    // === Scene Performance Optimizations ===
    
    // Enable depth testing so buildings render correctly against terrain
    viewer.scene.globe.depthTestAgainstTerrain = true;
    viewer.scene.logarithmicDepthBuffer = true;
    
    // Reduce anti-aliasing for better performance
    viewer.scene.postProcessStages.fxaa.enabled = false;
    
    // Optimize globe rendering
    viewer.scene.globe.tileCacheSize = 100;
    viewer.scene.globe.maximumScreenSpaceError = 2;
    
    // Request render mode - only render when scene changes
    viewer.scene.requestRenderMode = true;
    viewer.scene.maximumRenderTimeChange = Infinity;
    
    // Disable unnecessary atmospheric effects for parcel-level views
    viewer.scene.fog.enabled = false;
    viewer.scene.skyAtmosphere.show = true; // Keep for visual quality
    
    // Enable FPS display in development mode
    if (import.meta.env.DEV) {
      viewer.scene.debugShowFramesPerSecond = true;
    }

    // Enable shadows if configured
    if (shadowsEnabled) {
      viewer.shadows = true;
      viewer.terrainShadows = ShadowMode.RECEIVE_ONLY;
      viewer.clock.currentTime = JulianDate.fromDate(shadowDateTime);
    }

    // Load world terrain for proper building rendering
    loadWorldTerrain(viewer);

    // NOTE: Do NOT apply basemap here - the basemap useEffect handles it
    // This prevents the repeated "Applied basemap" loop

    // Mark viewer as ready - triggers the basemap effect
    setViewerReady(true);
    
    console.log("[CesiumViewer] Initialized with performance optimizations");
  }, [shadowsEnabled, shadowDateTime, loadWorldTerrain]);
  
  // Initial fly-to when viewer AND centroid are ready (runs ONCE)
  useEffect(() => {
    if (!viewerReady || !centroid || hasDoneInitialFlyToRef.current) return;
    
    hasDoneInitialFlyToRef.current = true;
    
    // Delay initial fly to let tiles load
    const timeoutId = setTimeout(() => {
      flyToPreset("parcel_fit");
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
        // Start with ellipsoid, upgrade to world terrain async when Ion token available
        terrainProvider={terrainProvider}
        shadows={shadowsEnabled}
        terrainShadows={shadowsEnabled ? ShadowMode.RECEIVE_ONLY : ShadowMode.DISABLED}
      >
        {/* Parcel Boundary - polyline for Google 3D (at ground level), polygon otherwise */}
        {buildings3dSource === "google" ? (
          <Entity name="parcel-boundary">
            <PolylineGraphics
              positions={(() => {
                const coords = envelope.parcelGeometry.coordinates[0];
                const baseHeight = groundHeightMeters ?? 0;
                return coords.map(([lng, lat]) => 
                  Cartesian3.fromDegrees(lng, lat, baseHeight + 0.3)
                );
              })()}
              width={4}
              material={DESIGN_COLORS.parcelOutline}
              clampToGround={false}
            />
          </Entity>
        ) : (
          <Entity name="parcel-boundary">
            <PolygonGraphics
              hierarchy={geojsonToCesiumPositions(envelope.parcelGeometry)}
              material={DESIGN_COLORS.parcelBoundary}
              outline
              outlineColor={DESIGN_COLORS.parcelOutline}
              outlineWidth={4}
              height={(groundHeightMeters ?? 0) + 0.1}
              extrudedHeight={(groundHeightMeters ?? 0) + 0.4}
            />
          </Entity>
        )}

        {/* Regulatory Envelope - Animated 2D/3D transition */}
        {envelope.buildableFootprint2d && (
          <Entity name="regulatory-envelope">
            <PolygonGraphics
              hierarchy={geojsonToCesiumPositions(envelope.buildableFootprint2d)}
              extrudedHeight={envelopeAnimatedProps.extrudedHeight}
              height={groundHeightMeters ?? 0}
              material={envelopeAnimatedProps.material}
              outline
              outlineColor={envelopeAnimatedProps.outlineColor}
              outlineWidth={envelopeAnimatedProps.outlineWidth}
            />
          </Entity>
        )}

        {/* Building Type Preview (Ephemeral - only visible on wizard step 3) */}
        {showBuildingPreview && (
          <Entity name="building-preview">
            <PolygonGraphics
              hierarchy={geojsonToCesiumPositions(previewGeometry)}
              extrudedHeight={(groundHeightMeters ?? 0) + feetToMeters(previewHeightFt)}
              height={groundHeightMeters ?? 0}
              material={Color.GRAY.withAlpha(0.7)}
              outline
              outlineColor={Color.WHITE}
              outlineWidth={1.5}
              shadows={shadowsEnabled ? ShadowMode.ENABLED : ShadowMode.DISABLED}
            />
          </Entity>
        )}

        {/* 3D GLB Building Model (when selected in wizard) */}
        {showGlbModel && centroid && selectedBuildingModel && (
          <Entity
            name="glb-building-model"
            position={Cartesian3.fromDegrees(
              centroid.lng + (modelTransform.offsetX * 0.00001), // Convert meters to approx degrees
              centroid.lat + (modelTransform.offsetY * 0.00001),
              (groundHeightMeters ?? 0)
            )}
            orientation={Transforms.headingPitchRollQuaternion(
              Cartesian3.fromDegrees(centroid.lng, centroid.lat, groundHeightMeters ?? 0),
              new HeadingPitchRoll(
                CesiumMath.toRadians(modelTransform.rotationDeg),
                0,
                0
              )
            )}
          >
            <ModelGraphics
              uri={glbModelUrl}
              scale={Math.max(modelTransform.scaleX, modelTransform.scaleY, modelTransform.scaleZ)}
              minimumPixelSize={64}
              maximumScale={20000}
              shadows={shadowsEnabled ? ShadowMode.ENABLED : ShadowMode.DISABLED}
              silhouetteColor={Color.ORANGE}
              silhouetteSize={1.5}
            />
          </Entity>
        )}

        {/* Design Footprint (extruded volume) - Hidden while wizard is open */}
        {!wizardIsOpen && activeVariant?.footprint && (
          <Entity name="design-footprint">
            <PolygonGraphics
              hierarchy={geojsonToCesiumPositions(activeVariant.footprint)}
              extrudedHeight={(groundHeightMeters ?? 0) + feetToMeters(activeVariant.heightFt)}
              height={groundHeightMeters ?? 0}
              material={DESIGN_COLORS.footprint}
              outline
              outlineColor={DESIGN_COLORS.footprintOutline}
              outlineWidth={2}
              shadows={shadowsEnabled ? ShadowMode.ENABLED : ShadowMode.DISABLED}
            />
          </Entity>
        )}

        {/* Violation Zone (parts outside envelope) - Hidden while wizard is open */}
        {!wizardIsOpen && violationGeometry && activeVariant && (
          <Entity name="violation-zone">
            <PolygonGraphics
              hierarchy={geojsonToCesiumPositions(violationGeometry)}
              extrudedHeight={(groundHeightMeters ?? 0) + feetToMeters(activeVariant.heightFt)}
              height={groundHeightMeters ?? 0}
              material={DESIGN_COLORS.violation}
              outline
              outlineColor={DESIGN_COLORS.violationOutline}
              outlineWidth={2}
              shadows={shadowsEnabled ? ShadowMode.ENABLED : ShadowMode.DISABLED}
            />
          </Entity>
        )}
      </Viewer>

      {/* Terrain/Buildings Loading Indicator */}
      {(terrainLoading || buildings3DLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center gap-3 shadow-lg">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm font-medium">
              {terrainLoading ? "Loading terrain..." : "Loading 3D buildings..."}
            </span>
          </div>
        </div>
      )}

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

      {/* Shadow Comparison Panel - When in comparison mode, positioned below top bar */}
      {!isStreetViewMode && shadowsEnabled && shadowComparisonMode && (
        <ShadowComparisonPanel className="absolute top-16 right-4 z-30" />
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
              <div className="w-3 h-3 rounded-sm bg-[#FF7A00]/20 border-2 border-[#FF7A00] shadow-[0_0_6px_rgba(255,122,0,0.5)]" />
              <span>Parcel Boundary</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-slate-500/15 border border-slate-500/50" />
              <span>Regulatory Envelope</span>
            </div>
            {!wizardIsOpen && activeVariant?.footprint && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-[#FF7A00]/60 border border-[#FF7A00]" />
                <span>Design Footprint</span>
              </div>
            )}
            {!wizardIsOpen && violationGeometry && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-red-500/50 border border-red-500" />
                <span>Violation Zone</span>
              </div>
            )}
            {showBuildingPreview && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-gray-400/70 border border-white" />
                <span>Building Preview</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CesiumViewerComponent;
