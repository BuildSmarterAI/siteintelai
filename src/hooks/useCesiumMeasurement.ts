/**
 * Cesium 3D Measurement Hook
 * Handles distance, area, and height measurements in 3D view
 * Enhanced with snapping to parcel boundaries, buildable areas, and buildings
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
import { findSnapPoint, formatSnapSource, formatSnapType, type SnapTarget } from "@/lib/measurementSnapping";

type DesignMeasurementMode = "distance" | "area" | "height" | null;

interface UseCesiumMeasurementOptions {
  viewer: CesiumViewer | null;
}

export function useCesiumMeasurement({ viewer }: UseCesiumMeasurementOptions) {
  const handlerRef = useRef<ScreenSpaceEventHandler | null>(null);
  const measurementEntitiesRef = useRef<Entity[]>([]);
  const annotationEntitiesRef = useRef<Entity[]>([]);
  const snapIndicatorRef = useRef<Entity | null>(null);
  const pointsRef = useRef<Cartesian3[]>([]);

  const {
    measurementMode,
    measurementPoints,
    setMeasurementPoints,
    setMeasurementResult,
    measurementAnnotations,
    envelope,
    variants,
    activeVariantId,
    measurementSnappingEnabled,
    measurementSnapSettings,
    setCurrentSnapPoint,
    setLastSnappedSource,
  } = useDesignStore();

  // Get current geometries for snapping
  const getSnapGeometries = useCallback(() => {
    const activeVariant = variants.find((v) => v.id === activeVariantId);
    const buildings = activeVariant?.footprint ? [activeVariant.footprint] : [];

    return {
      parcel: envelope?.parcelGeometry || null,
      buildable: envelope?.buildableFootprint2d || null,
      buildings,
    };
  }, [envelope, variants, activeVariantId]);

  // Clear snap indicator
  const clearSnapIndicator = useCallback(() => {
    if (!viewer || !snapIndicatorRef.current) return;
    try {
      viewer.entities.remove(snapIndicatorRef.current);
    } catch {
      // Entity may already be removed
    }
    snapIndicatorRef.current = null;
    setCurrentSnapPoint(null);
  }, [viewer, setCurrentSnapPoint]);

  // Show snap indicator
  const showSnapIndicator = useCallback(
    (snapTarget: SnapTarget) => {
      if (!viewer) return;

      // Clear existing indicator
      clearSnapIndicator();

      const position = Cartesian3.fromDegrees(snapTarget.point[0], snapTarget.point[1]);
      const isVertex = snapTarget.type === "vertex";

      // Create snap indicator entity
      snapIndicatorRef.current = viewer.entities.add({
        position,
        point: {
          pixelSize: isVertex ? 14 : 10,
          color: isVertex
            ? Color.fromCssColorString("#FBBF24") // Yellow for vertices
            : Color.fromCssColorString("#06B6D4"), // Cyan for edges
          outlineColor: Color.WHITE,
          outlineWidth: 2,
          heightReference: HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `${formatSnapType(snapTarget.type)} • ${formatSnapSource(snapTarget.source)}`,
          font: "11px sans-serif",
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.TOP,
          horizontalOrigin: HorizontalOrigin.CENTER,
          pixelOffset: new Cartesian2(0, 10),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: true,
          backgroundColor: Color.BLACK.withAlpha(0.7),
        },
      });

      // Update store for UI feedback
      setCurrentSnapPoint({
        point: snapTarget.point,
        type: snapTarget.type,
        source: snapTarget.source,
      });
    },
    [viewer, clearSnapIndicator, setCurrentSnapPoint]
  );

  // Clear active measurement entities (not saved annotations)
  const clearEntities = useCallback(() => {
    if (!viewer) return;

    measurementEntitiesRef.current.forEach((entity) => {
      viewer.entities.remove(entity);
    });
    measurementEntitiesRef.current = [];
    pointsRef.current = [];
    clearSnapIndicator();
  }, [viewer, clearSnapIndicator]);

  // Clear annotation entities
  const clearAnnotationEntities = useCallback(() => {
    if (!viewer) return;

    annotationEntitiesRef.current.forEach((entity) => {
      try {
        viewer.entities.remove(entity);
      } catch (e) {
        // Entity may already be removed
      }
    });
    annotationEntitiesRef.current = [];
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
  const calculateHeight = useCallback(
    (points: Cartesian3[]): number | null => {
      if (!viewer || points.length < 2) return null;

      const globe = viewer.scene.globe;
      if (!globe) return null;

      const carto1 = Cartographic.fromCartesian(points[0]);
      const carto2 = Cartographic.fromCartesian(points[1]);

      const height1 = globe.getHeight(carto1) ?? carto1.height;
      const height2 = globe.getHeight(carto2) ?? carto2.height;

      return Math.abs(height2 - height1) * 3.28084; // meters to feet
    },
    [viewer]
  );

  // Add point entity
  const addPointEntity = useCallback(
    (position: Cartesian3, index: number) => {
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
    },
    [viewer]
  );

  // Add line entity
  const addLineEntity = useCallback(
    (positions: Cartesian3[]) => {
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
    },
    [viewer]
  );

  // Add polygon entity
  const addPolygonEntity = useCallback(
    (positions: Cartesian3[]) => {
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
    },
    [viewer]
  );

  // Add label entity with custom styling
  const addLabelEntity = useCallback(
    (position: Cartesian3, text: string, color?: string, isAnnotation: boolean = false) => {
      if (!viewer) return null;

      const labelColor = color ? Color.fromCssColorString(color) : Color.WHITE;

      const entity = viewer.entities.add({
        position,
        label: {
          text,
          font: isAnnotation ? "13px sans-serif" : "14px sans-serif",
          fillColor: labelColor,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.BOTTOM,
          horizontalOrigin: HorizontalOrigin.CENTER,
          pixelOffset: new Cartesian2(0, -15),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: isAnnotation,
          backgroundColor: isAnnotation ? Color.BLACK.withAlpha(0.6) : undefined,
        },
      });

      return entity;
    },
    [viewer]
  );

  // Add label to active measurement entities
  const addMeasurementLabel = useCallback(
    (position: Cartesian3, text: string) => {
      const entity = addLabelEntity(position, text);
      if (entity) {
        measurementEntitiesRef.current.push(entity);
      }
    },
    [addLabelEntity]
  );

  // Render saved annotations
  const renderAnnotations = useCallback(() => {
    if (!viewer) return;

    // Clear existing annotation entities
    clearAnnotationEntities();

    // Render each visible annotation
    measurementAnnotations
      .filter((a) => a.visible)
      .forEach((annotation) => {
        const cesiumPoints = annotation.points.map(([lng, lat]) => Cartesian3.fromDegrees(lng, lat));
        const annotationColor = Color.fromCssColorString(annotation.color);

        // Add point markers
        cesiumPoints.forEach((pos) => {
          const entity = viewer.entities.add({
            position: pos,
            point: {
              pixelSize: 8,
              color: annotationColor,
              outlineColor: Color.WHITE,
              outlineWidth: 1,
              heightReference: HeightReference.CLAMP_TO_GROUND,
            },
          });
          annotationEntitiesRef.current.push(entity);
        });

        // Add line or polygon
        if (annotation.type === "distance" && cesiumPoints.length >= 2) {
          const entity = viewer.entities.add({
            polyline: {
              positions: cesiumPoints,
              width: 2,
              material: new PolylineGlowMaterialProperty({
                glowPower: 0.15,
                color: annotationColor,
              }),
              clampToGround: true,
            },
          });
          annotationEntitiesRef.current.push(entity);

          // Add label
          const midIndex = Math.floor(cesiumPoints.length / 2);
          const labelText = `${annotation.label}: ${annotation.result.feet?.toFixed(1)} ft`;
          const labelEntity = addLabelEntity(cesiumPoints[midIndex], labelText, annotation.color, true);
          if (labelEntity) annotationEntitiesRef.current.push(labelEntity);
        } else if (annotation.type === "area" && cesiumPoints.length >= 3) {
          const entity = viewer.entities.add({
            polygon: {
              hierarchy: cesiumPoints,
              material: annotationColor.withAlpha(0.25),
              outline: true,
              outlineColor: annotationColor,
              heightReference: HeightReference.CLAMP_TO_GROUND,
            },
          });
          annotationEntitiesRef.current.push(entity);

          // Add label at centroid
          const centerLng = annotation.points.reduce((sum, p) => sum + p[0], 0) / annotation.points.length;
          const centerLat = annotation.points.reduce((sum, p) => sum + p[1], 0) / annotation.points.length;
          const labelText = `${annotation.label}: ${annotation.result.sqft?.toLocaleString()} sq ft`;
          const labelEntity = addLabelEntity(
            Cartesian3.fromDegrees(centerLng, centerLat),
            labelText,
            annotation.color,
            true
          );
          if (labelEntity) annotationEntitiesRef.current.push(labelEntity);
        } else if (annotation.type === "height" && cesiumPoints.length >= 2) {
          const entity = viewer.entities.add({
            polyline: {
              positions: cesiumPoints,
              width: 2,
              material: new PolylineGlowMaterialProperty({
                glowPower: 0.15,
                color: annotationColor,
              }),
              clampToGround: false,
            },
          });
          annotationEntitiesRef.current.push(entity);

          // Add label
          const midpoint = Cartesian3.midpoint(cesiumPoints[0], cesiumPoints[1], new Cartesian3());
          const labelText = `${annotation.label}: ${annotation.result.heightFt?.toFixed(1)} ft`;
          const labelEntity = addLabelEntity(midpoint, labelText, annotation.color, true);
          if (labelEntity) annotationEntitiesRef.current.push(labelEntity);
        }
      });
  }, [viewer, measurementAnnotations, clearAnnotationEntities, addLabelEntity]);

  // Update visualization
  const updateVisualization = useCallback(() => {
    if (!viewer || !measurementMode) return;

    // Clear previous entities
    clearEntities();

    const cesiumPoints = measurementPoints.map(([lng, lat]) => Cartesian3.fromDegrees(lng, lat));
    pointsRef.current = cesiumPoints;

    // Add point markers
    cesiumPoints.forEach((pos, idx) => addPointEntity(pos, idx));

    if (measurementMode === "distance" && cesiumPoints.length >= 2) {
      addLineEntity(cesiumPoints);
      const feet = calculateDistance(cesiumPoints);

      // Add label at midpoint
      const midIndex = Math.floor(cesiumPoints.length / 2);
      addMeasurementLabel(cesiumPoints[midIndex], `${feet.toFixed(1)} ft`);

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
      addMeasurementLabel(Cartesian3.fromDegrees(centerLng, centerLat), `${sqft.toLocaleString()} sq ft`);

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
        addMeasurementLabel(midpoint, `${heightFt.toFixed(1)} ft`);

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
    addMeasurementLabel,
    calculateDistance,
    calculateArea,
    calculateHeight,
    setMeasurementResult,
  ]);

  // Handle click and move events
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

    // Mouse move handler for snap preview
    handlerRef.current.setInputAction((movement: ScreenSpaceEventHandler.MotionEvent) => {
      if (!measurementSnappingEnabled) {
        clearSnapIndicator();
        return;
      }

      const ray = viewer.camera.getPickRay(movement.endPosition);
      if (!ray) return;

      const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
      if (!cartesian) return;

      const cartographic = Cartographic.fromCartesian(cartesian);
      const lng = CesiumMath.toDegrees(cartographic.longitude);
      const lat = CesiumMath.toDegrees(cartographic.latitude);

      // Find snap point
      const geometries = getSnapGeometries();
      const snapTarget = findSnapPoint([lng, lat], geometries, measurementSnapSettings);

      if (snapTarget) {
        showSnapIndicator(snapTarget);
      } else {
        clearSnapIndicator();
      }
    }, ScreenSpaceEventType.MOUSE_MOVE);

    // Click handler
    handlerRef.current.setInputAction(
      (movement: ScreenSpaceEventHandler.PositionedEvent) => {
        const ray = viewer.camera.getPickRay(movement.position);
        if (!ray) return;

        const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        if (!cartesian) return;

        const cartographic = Cartographic.fromCartesian(cartesian);
        let lng = CesiumMath.toDegrees(cartographic.longitude);
        let lat = CesiumMath.toDegrees(cartographic.latitude);

        // Check for snap if enabled
        if (measurementSnappingEnabled) {
          const geometries = getSnapGeometries();
          const snapTarget = findSnapPoint([lng, lat], geometries, measurementSnapSettings);

          if (snapTarget) {
            lng = snapTarget.point[0];
            lat = snapTarget.point[1];
            setLastSnappedSource(`${formatSnapType(snapTarget.type)} • ${formatSnapSource(snapTarget.source)}`);
          } else {
            setLastSnappedSource(null);
          }
        }

        // For height mode, only allow 2 points
        if (measurementMode === "height" && measurementPoints.length >= 2) {
          return;
        }

        setMeasurementPoints([...measurementPoints, [lng, lat]]);
      },
      ScreenSpaceEventType.LEFT_CLICK
    );

    return () => {
      viewer.canvas.style.cursor = "default";
      if (handlerRef.current) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }
    };
  }, [
    viewer,
    measurementMode,
    measurementPoints,
    setMeasurementPoints,
    clearEntities,
    measurementSnappingEnabled,
    measurementSnapSettings,
    getSnapGeometries,
    showSnapIndicator,
    clearSnapIndicator,
    setLastSnappedSource,
  ]);

  // Update visualization when points change
  useEffect(() => {
    updateVisualization();
  }, [measurementPoints, updateVisualization]);

  // Render annotations when they change
  useEffect(() => {
    renderAnnotations();
  }, [measurementAnnotations, renderAnnotations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearEntities();
      clearAnnotationEntities();
      if (handlerRef.current) {
        handlerRef.current.destroy();
      }
    };
  }, [clearEntities, clearAnnotationEntities]);

  return {
    clearEntities,
    renderAnnotations,
  };
}
