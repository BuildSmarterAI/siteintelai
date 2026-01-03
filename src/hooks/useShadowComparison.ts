/**
 * Shadow Comparison Hook
 * Renders shadow overlays at multiple times simultaneously
 */

import { useCallback, useRef, useEffect } from "react";
import {
  Viewer as CesiumViewer,
  Entity,
  Color,
  HeightReference,
} from "cesium";
import { useDesignStore } from "@/stores/useDesignStore";
import {
  calculateShadowProjection,
  generateShadowPolygon,
} from "@/lib/shadowCalculator";
import { geojsonToCesiumPositions, feetToMeters } from "@/lib/cesiumGeometry";

interface UseShadowComparisonOptions {
  viewer: CesiumViewer | null;
  latitude: number;
  longitude: number;
}

export function useShadowComparison({
  viewer,
  latitude,
  longitude,
}: UseShadowComparisonOptions) {
  const shadowEntitiesRef = useRef<Entity[]>([]);

  const {
    shadowComparisonMode,
    shadowComparisonTimes,
    shadowDateTime,
    variants,
    activeVariantId,
  } = useDesignStore();

  const activeVariant = variants.find((v) => v.id === activeVariantId);

  // Clear all shadow entities
  const clearShadowEntities = useCallback(() => {
    if (!viewer) return;

    shadowEntitiesRef.current.forEach((entity) => {
      try {
        viewer.entities.remove(entity);
      } catch (e) {
        // Entity may already be removed
      }
    });
    shadowEntitiesRef.current = [];
  }, [viewer]);

  // Render shadow comparison overlays
  const renderShadowComparison = useCallback(() => {
    if (!viewer || !shadowComparisonMode || !activeVariant?.footprint) {
      return;
    }

    // Clear existing shadows
    clearShadowEntities();

    const buildingHeightMeters = feetToMeters(activeVariant.heightFt);

    // Generate shadows for each enabled time
    shadowComparisonTimes
      .filter((time) => time.visible)
      .forEach((time) => {
        // Create date at this hour
        const timeDate = new Date(shadowDateTime);
        timeDate.setHours(time.hour, 0, 0, 0);

        // Calculate shadow projection
        const projection = calculateShadowProjection(timeDate, latitude, longitude);

        // Skip if sun is below horizon
        if (projection.sunAltitude < 2) {
          return;
        }

        // Generate shadow polygon
        const shadowPolygon = generateShadowPolygon(
          activeVariant.footprint!,
          buildingHeightMeters,
          projection
        );

        if (!shadowPolygon) {
          return;
        }

        // Create Cesium entity for shadow
        try {
          const positions = geojsonToCesiumPositions(shadowPolygon);
          const color = Color.fromCssColorString(time.color).withAlpha(0.35);

          const entity = viewer.entities.add({
            name: `shadow-${time.id}`,
            polygon: {
              hierarchy: positions,
              material: color,
              outline: true,
              outlineColor: Color.fromCssColorString(time.color).withAlpha(0.6),
              outlineWidth: 1,
              height: 0.1, // Slightly above ground to prevent z-fighting
              heightReference: HeightReference.RELATIVE_TO_GROUND,
            },
          });

          shadowEntitiesRef.current.push(entity);

          // Add time label at shadow center
          const coords = shadowPolygon.coordinates[0];
          const centerLng = coords.reduce((sum, p) => sum + p[0], 0) / coords.length;
          const centerLat = coords.reduce((sum, p) => sum + p[1], 0) / coords.length;

          const labelEntity = viewer.entities.add({
            name: `shadow-label-${time.id}`,
            position: {
              getValue: () => {
                const { Cartesian3 } = require("cesium");
                return Cartesian3.fromDegrees(centerLng, centerLat, 1);
              },
            } as any,
            label: {
              text: time.label,
              font: "12px sans-serif",
              fillColor: Color.fromCssColorString(time.color),
              outlineColor: Color.BLACK,
              outlineWidth: 2,
              style: 2, // FILL_AND_OUTLINE
              heightReference: HeightReference.RELATIVE_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
          });

          shadowEntitiesRef.current.push(labelEntity);
        } catch (e) {
          console.warn(`Error creating shadow entity for ${time.label}:`, e);
        }
      });
  }, [
    viewer,
    shadowComparisonMode,
    shadowComparisonTimes,
    shadowDateTime,
    activeVariant,
    latitude,
    longitude,
    clearShadowEntities,
  ]);

  // Update shadows when dependencies change
  useEffect(() => {
    if (shadowComparisonMode) {
      renderShadowComparison();
    } else {
      clearShadowEntities();
    }

    return () => {
      clearShadowEntities();
    };
  }, [shadowComparisonMode, renderShadowComparison, clearShadowEntities]);

  // Re-render when times or visibility changes
  useEffect(() => {
    if (shadowComparisonMode) {
      renderShadowComparison();
    }
  }, [shadowComparisonTimes, shadowComparisonMode, renderShadowComparison]);

  return {
    clearShadowEntities,
    renderShadowComparison,
  };
}
