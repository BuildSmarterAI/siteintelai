/**
 * Calibration Map Canvas
 * Simplified MapLibre map for marking control points during calibration.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { ControlPointPair } from '@/types/surveyCalibration';

interface CalibrationMapCanvasProps {
  points: ControlPointPair[];
  onPointAdded: (lat: number, lng: number) => void;
  onPointRemoved: (pointId: string) => void;
  activePointLabel: string | null;
  initialCenter?: [number, number]; // [lng, lat]
  initialZoom?: number;
}

const POINT_COLORS: Record<string, string> = {
  A: '#ef4444',
  B: '#22c55e',
  C: '#3b82f6',
  D: '#f59e0b',
};

export function CalibrationMapCanvas({
  points,
  onPointAdded,
  onPointRemoved,
  activePointLabel,
  initialCenter = [-95.37, 29.76], // Houston default
  initialZoom = 14,
}: CalibrationMapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: initialCenter,
      zoom: initialZoom,
    });

    map.on('load', () => {
      setIsMapLoaded(true);
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initialCenter, initialZoom]);

  // Handle click to add point
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      if (!activePointLabel) return;
      onPointAdded(e.lngLat.lat, e.lngLat.lng);
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [isMapLoaded, activePointLabel, onPointAdded]);

  // Update cursor based on active state
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    map.getCanvas().style.cursor = activePointLabel ? 'crosshair' : '';
  }, [activePointLabel]);

  // Sync markers with points
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    // Remove old markers that are no longer in points
    const currentIds = new Set(points.map(p => p.id));
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add/update markers for current points
    for (const point of points) {
      let marker = markersRef.current.get(point.id);
      
      if (!marker) {
        // Create marker element
        const el = document.createElement('div');
        el.className = 'calibration-marker';
        el.innerHTML = `
          <div style="
            width: 24px;
            height: 24px;
            background: ${POINT_COLORS[point.label] || '#fff'};
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
          ">${point.label}</div>
        `;
        
        el.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          onPointRemoved(point.id);
        });

        marker = new maplibregl.Marker({ element: el })
          .setLngLat([point.map_lng, point.map_lat])
          .addTo(map);
        
        markersRef.current.set(point.id, marker);
      } else {
        // Update position if changed
        marker.setLngLat([point.map_lng, point.map_lat]);
      }
    }
  }, [points, isMapLoaded, onPointRemoved]);

  // Fit to points when they change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded || points.length === 0) return;

    if (points.length >= 2) {
      const bounds = new maplibregl.LngLatBounds();
      points.forEach(p => bounds.extend([p.map_lng, p.map_lat]));
      map.fitBounds(bounds, { padding: 50, maxZoom: 17 });
    } else if (points.length === 1) {
      map.flyTo({ center: [points[0].map_lng, points[0].map_lat], zoom: 16 });
    }
  }, [points, isMapLoaded]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {activePointLabel && (
        <div className="absolute bottom-3 left-3 bg-background/90 px-3 py-1.5 rounded text-xs">
          Click to place point <span className="font-bold" style={{ color: POINT_COLORS[activePointLabel] }}>{activePointLabel}</span>
        </div>
      )}
    </div>
  );
}
