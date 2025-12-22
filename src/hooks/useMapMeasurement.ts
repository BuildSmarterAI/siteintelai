import { useState, useCallback, useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import * as turf from '@turf/turf';
import { logger } from '@/lib/logger';

export type MeasurementMode = 'distance' | 'area' | null;

export interface MeasurementResult {
  miles?: number;
  feet?: number;
  acres?: number;
  sqft?: number;
}

interface UseMapMeasurementOptions {
  map: maplibregl.Map | null;
  mapLoaded: boolean;
}

interface UseMapMeasurementReturn {
  activeTool: MeasurementMode;
  measurementResult: MeasurementResult | null;
  measurementPoints: [number, number][];
  setActiveTool: (tool: MeasurementMode) => void;
  clearMeasurement: () => void;
  handleMapClick: (lngLat: { lng: number; lat: number }) => void;
}

const MEASUREMENT_SOURCE_ID = 'measurement-source';
const MEASUREMENT_LINE_LAYER = 'measurement-line';
const MEASUREMENT_FILL_LAYER = 'measurement-fill';
const MEASUREMENT_POINTS_LAYER = 'measurement-points';

/**
 * Hook to manage map measurement tools (distance and area)
 * Extracted from MapLibreCanvas for better separation of concerns
 */
export function useMapMeasurement({
  map,
  mapLoaded,
}: UseMapMeasurementOptions): UseMapMeasurementReturn {
  const [activeTool, setActiveToolState] = useState<MeasurementMode>(null);
  const [measurementResult, setMeasurementResult] = useState<MeasurementResult | null>(null);
  const [measurementPoints, setMeasurementPoints] = useState<[number, number][]>([]);
  const mapRef = useRef(map);

  // Keep map ref current
  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  /**
   * Calculate distance between two points using Haversine formula
   */
  const calculateDistance = useCallback((point1: [number, number], point2: [number, number]): number => {
    const from = turf.point(point1);
    const to = turf.point(point2);
    return turf.distance(from, to, { units: 'miles' });
  }, []);

  /**
   * Calculate area of a polygon
   */
  const calculateArea = useCallback((points: [number, number][]): number => {
    if (points.length < 3) return 0;
    const polygon = turf.polygon([[...points, points[0]]]);
    const area = turf.area(polygon);
    return area / 4046.86; // Convert sq meters to acres
  }, []);

  /**
   * Clear measurement layers from map
   */
  const clearMeasurementLayers = useCallback(() => {
    const currentMap = mapRef.current;
    if (!currentMap) return;

    try {
      if (currentMap.getLayer(MEASUREMENT_LINE_LAYER)) {
        currentMap.removeLayer(MEASUREMENT_LINE_LAYER);
      }
      if (currentMap.getLayer(MEASUREMENT_FILL_LAYER)) {
        currentMap.removeLayer(MEASUREMENT_FILL_LAYER);
      }
      if (currentMap.getLayer(MEASUREMENT_POINTS_LAYER)) {
        currentMap.removeLayer(MEASUREMENT_POINTS_LAYER);
      }
      if (currentMap.getSource(MEASUREMENT_SOURCE_ID)) {
        currentMap.removeSource(MEASUREMENT_SOURCE_ID);
      }
    } catch (error) {
      logger.warn('Failed to clear measurement layers:', error);
    }
  }, []);

  /**
   * Update measurement visualization on map
   */
  const updateMeasurementVisualization = useCallback((points: [number, number][], mode: MeasurementMode) => {
    const currentMap = mapRef.current;
    if (!currentMap || !mapLoaded || points.length === 0) return;

    try {
      // Clear existing layers
      clearMeasurementLayers();

      // Create GeoJSON for visualization
      const geojsonData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [],
      };

      // Add points
      points.forEach((point, idx) => {
        geojsonData.features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: point },
          properties: { index: idx },
        });
      });

      // Add line for distance or polygon for area
      if (points.length >= 2) {
        if (mode === 'distance') {
          geojsonData.features.push({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: points },
            properties: {},
          });
        } else if (mode === 'area' && points.length >= 3) {
          geojsonData.features.push({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [[...points, points[0]]] },
            properties: {},
          });
        }
      }

      // Add source
      currentMap.addSource(MEASUREMENT_SOURCE_ID, {
        type: 'geojson',
        data: geojsonData,
      });

      // Add line layer
      if (points.length >= 2) {
        currentMap.addLayer({
          id: MEASUREMENT_LINE_LAYER,
          type: 'line',
          source: MEASUREMENT_SOURCE_ID,
          filter: ['==', '$type', 'LineString'],
          paint: {
            'line-color': '#3B82F6',
            'line-width': 3,
            'line-dasharray': [2, 2],
          },
        });
      }

      // Add fill layer for area
      if (mode === 'area' && points.length >= 3) {
        currentMap.addLayer({
          id: MEASUREMENT_FILL_LAYER,
          type: 'fill',
          source: MEASUREMENT_SOURCE_ID,
          filter: ['==', '$type', 'Polygon'],
          paint: {
            'fill-color': '#10B981',
            'fill-opacity': 0.2,
          },
        });
      }

      // Add points layer
      currentMap.addLayer({
        id: MEASUREMENT_POINTS_LAYER,
        type: 'circle',
        source: MEASUREMENT_SOURCE_ID,
        filter: ['==', '$type', 'Point'],
        paint: {
          'circle-radius': 6,
          'circle-color': '#FF7A00',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
        },
      });

      logger.debug('Measurement', `Updated visualization with ${points.length} points`);
    } catch (error) {
      logger.error('Failed to update measurement visualization:', error);
    }
  }, [mapLoaded, clearMeasurementLayers]);

  /**
   * Set active measurement tool
   */
  const setActiveTool = useCallback((tool: MeasurementMode) => {
    setActiveToolState(tool);
    setMeasurementPoints([]);
    setMeasurementResult(null);
    clearMeasurementLayers();

    logger.debug('Measurement', `Tool changed to: ${tool || 'none'}`);
  }, [clearMeasurementLayers]);

  /**
   * Clear current measurement
   */
  const clearMeasurement = useCallback(() => {
    setMeasurementPoints([]);
    setMeasurementResult(null);
    clearMeasurementLayers();
    setActiveToolState(null);
  }, [clearMeasurementLayers]);

  /**
   * Handle map click for measurement
   */
  const handleMapClick = useCallback((lngLat: { lng: number; lat: number }) => {
    if (!activeTool) return;

    const newPoint: [number, number] = [lngLat.lng, lngLat.lat];
    const newPoints = [...measurementPoints, newPoint];
    setMeasurementPoints(newPoints);

    // Update visualization
    updateMeasurementVisualization(newPoints, activeTool);

    // Calculate result
    if (activeTool === 'distance' && newPoints.length >= 2) {
      let totalDistance = 0;
      for (let i = 1; i < newPoints.length; i++) {
        totalDistance += calculateDistance(newPoints[i - 1], newPoints[i]);
      }
      setMeasurementResult({
        miles: totalDistance,
        feet: totalDistance * 5280,
      });
    } else if (activeTool === 'area' && newPoints.length >= 3) {
      const acres = calculateArea(newPoints);
      setMeasurementResult({
        acres,
        sqft: acres * 43560,
      });
    }
  }, [activeTool, measurementPoints, updateMeasurementVisualization, calculateDistance, calculateArea]);

  return {
    activeTool,
    measurementResult,
    measurementPoints,
    setActiveTool,
    clearMeasurement,
    handleMapClick,
  };
}
