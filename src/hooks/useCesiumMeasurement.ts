/**
 * Cesium 3D Measurement Hook
 * Handles distance, area, and height measurements in 3D view
 */

import { useCallback, useRef, useEffect } from "react";
import {
  Viewer as CesiumViewer,
  Cartesian2,
  Cartesian3,
  Cartographic,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Math as CesiumMath,
  Color,
  Entity,
  PolylineGlowMaterialProperty,
  HeightReference,
  VerticalOrigin,
  HorizontalOrigin,
  LabelStyle,
} from "cesium";
import * as turf from "@turf/turf";
import { useDesignStore } from "@/stores/useDesignStore";

type DesignMeasurementMode = "distance" | "area" | "height" | null;

interface UseCesiumMeasurementOptions {
  viewer: CesiumViewer | null;
}

export function useCesiumMeasurement({ viewer }: UseCesiumMeasurementOptions) {
  const handlerRef = useRef<ScreenSpaceEventHandler | null>(null);
  const measurementEntitiesRef = useRef<Entity[]>([]);
  const pointsRef = useRef<Cartesian3[]>([]);

  const {
    measurementMode,
    measurementPoints,
    setMeasurementPoints,
    setMeasurementResult,
  } = useDesignStore();

  // Clear all measurement entities
  const clearEntities = useCallback(() => {
    if (!viewer) return;
    
    measurementEntitiesRef.current.forEach((entity) => {
      viewer.entities.remove(entity);
    });
    measurementEntitiesRef.current = [];
    pointsRef.current = [];
  }, [viewer]);

  // Calculate distance between points
  const calculateDistance = useCallback((points: Cartesian3[]): number => {
    if (points.length < 2) return 0;
    
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += Cartesian3.distance(points[i - 1], points[i]);
    }
    return total * 3.28084; // meters to feet
  }, []);

  // Calculate area of polygon
  const calculateArea = useCallback((points: [number, number][]): number => {
    if (points.length < 3) return 0;
    
    try {
      const polygon = turf.polygon([[...points, points[0]]]);
      const area = turf.area(polygon);
      return area * 10.7639; // sq meters to sq ft
    } catch {
      return 0;
    }
  }, []);

  // Calculate height difference
  const calculateHeight = useCallback((points: Cartesian3[]): number | null => {
    if (!viewer || points.length < 2) return null;
    
    const globe = viewer.scene.globe;
    if (!globe) return null;

    const carto1 = Cartographic.fromCartesian(points[0]);
    const carto2 = Cartographic.fromCartesian(points[1]);

    const height1 = globe.getHeight(carto1) ?? carto1.height;
    const height2 = globe.getHeight(carto2) ?? carto2.height;

    return Math.abs(height2 - height1) * 3.28084; // meters to feet
  }, [viewer]);

  // Add point entity
  const addPointEntity = useCallback((position: Cartesian3, index: number) => {
    if (!viewer) return;

    const entity = viewer.entities.add({
      position,
      point: {
        pixelSize: 10,
        color: Color.fromCssColorString("#FF7A00"),
        outlineColor: Color.WHITE,
        outlineWidth: 2,
        heightReference: HeightReference.CLAMP_TO_GROUND,
      },
    });

    measurementEntitiesRef.current.push(entity);
  }, [viewer]);

  // Add line entity
  const addLineEntity = useCallback((positions: Cartesian3[]) => {
    if (!viewer || positions.length < 2) return;

    const entity = viewer.entities.add({
      polyline: {
        positions,
        width: 3,
        material: new PolylineGlowMaterialProperty({
          glowPower: 0.2,
          color: Color.fromCssColorString("#06B6D4"),
        }),
        clampToGround: true,
      },
    });

    measurementEntitiesRef.current.push(entity);
  }, [viewer]);

  // Add polygon entity
  const addPolygonEntity = useCallback((positions: Cartesian3[]) => {
    if (!viewer || positions.length < 3) return;

    const entity = viewer.entities.add({
      polygon: {
        hierarchy: positions,
        material: Color.fromCssColorString("#10B981").withAlpha(0.3),
        outline: true,
        outlineColor: Color.fromCssColorString("#10B981"),
        heightReference: HeightReference.CLAMP_TO_GROUND,
      },
    });

    measurementEntitiesRef.current.push(entity);
  }, [viewer]);

  // Add label entity
  const addLabelEntity = useCallback((position: Cartesian3, text: string) => {
    if (!viewer) return;

    const entity = viewer.entities.add({
      position,
      label: {
        text,
        font: "14px sans-serif",
        fillColor: Color.WHITE,
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        style: LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: VerticalOrigin.BOTTOM,
        horizontalOrigin: HorizontalOrigin.CENTER,
        pixelOffset: new Cartesian2(0, -15),
        heightReference: HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    measurementEntitiesRef.current.push(entity);
  }, [viewer]);

  // Update visualization
  const updateVisualization = useCallback(() => {
    if (!viewer || !measurementMode) return;

    // Clear previous entities
    clearEntities();

    const cesiumPoints = measurementPoints.map(([lng, lat]) => 
      Cartesian3.fromDegrees(lng, lat)
    );
    pointsRef.current = cesiumPoints;

    // Add point markers
    cesiumPoints.forEach((pos, idx) => addPointEntity(pos, idx));

    if (measurementMode === "distance" && cesiumPoints.length >= 2) {
      addLineEntity(cesiumPoints);
      const feet = calculateDistance(cesiumPoints);
      
      // Add label at midpoint
      const midIndex = Math.floor(cesiumPoints.length / 2);
      addLabelEntity(cesiumPoints[midIndex], `${feet.toFixed(1)} ft`);
      
      setMeasurementResult({
        feet,
        miles: feet / 5280,
      });
    } else if (measurementMode === "area" && cesiumPoints.length >= 3) {
      addPolygonEntity(cesiumPoints);
      const sqft = calculateArea(measurementPoints);
      
      // Add label at centroid
      const centerLng = measurementPoints.reduce((sum, p) => sum + p[0], 0) / measurementPoints.length;
      const centerLat = measurementPoints.reduce((sum, p) => sum + p[1], 0) / measurementPoints.length;
      addLabelEntity(
        Cartesian3.fromDegrees(centerLng, centerLat),
        `${sqft.toLocaleString()} sq ft`
      );
      
      setMeasurementResult({
        sqft,
        acres: sqft / 43560,
      });
    } else if (measurementMode === "height" && cesiumPoints.length >= 2) {
      // Draw vertical line between points
      addLineEntity(cesiumPoints);
      const heightFt = calculateHeight(cesiumPoints);
      
      if (heightFt !== null) {
        const midpoint = Cartesian3.midpoint(cesiumPoints[0], cesiumPoints[1], new Cartesian3());
        addLabelEntity(midpoint, `${heightFt.toFixed(1)} ft`);
        
        setMeasurementResult({ heightFt });
      }
    }
  }, [
    viewer,
    measurementMode,
    measurementPoints,
    clearEntities,
    addPointEntity,
    addLineEntity,
    addPolygonEntity,
    addLabelEntity,
    calculateDistance,
    calculateArea,
    calculateHeight,
    setMeasurementResult,
  ]);

  // Handle click events
  useEffect(() => {
    if (!viewer || !measurementMode) {
      if (handlerRef.current) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }
      clearEntities();
      return;
    }

    viewer.canvas.style.cursor = "crosshair";
    
    handlerRef.current = new ScreenSpaceEventHandler(viewer.canvas);

    handlerRef.current.setInputAction((movement: ScreenSpaceEventHandler.PositionedEvent) => {
      const ray = viewer.camera.getPickRay(movement.position);
      if (!ray) return;

      const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
      if (!cartesian) return;

      const cartographic = Cartographic.fromCartesian(cartesian);
      const lng = CesiumMath.toDegrees(cartographic.longitude);
      const lat = CesiumMath.toDegrees(cartographic.latitude);

      // For height mode, only allow 2 points
      if (measurementMode === "height" && measurementPoints.length >= 2) {
        return;
      }

      setMeasurementPoints([...measurementPoints, [lng, lat]]);
    }, ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      viewer.canvas.style.cursor = "default";
      if (handlerRef.current) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }
    };
  }, [viewer, measurementMode, measurementPoints, setMeasurementPoints, clearEntities]);

  // Update visualization when points change
  useEffect(() => {
    updateVisualization();
  }, [measurementPoints, updateVisualization]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearEntities();
      if (handlerRef.current) {
        handlerRef.current.destroy();
      }
    };
  }, [clearEntities]);

  return {
    clearEntities,
  };
}
