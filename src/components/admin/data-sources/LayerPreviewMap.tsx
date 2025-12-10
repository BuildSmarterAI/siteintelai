import { useEffect, useRef, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface SampleFeature {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: any;
  };
  properties: Record<string, any>;
}

interface LayerPreviewMapProps {
  features: SampleFeature[];
  geometryType: string;
  className?: string;
}

export function LayerPreviewMap({ features, geometryType, className = '' }: LayerPreviewMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const geojsonData = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: features
  }), [features]);

  // Calculate bounds from features
  const bounds = useMemo(() => {
    if (features.length === 0) return null;
    
    let minLng = Infinity, maxLng = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    const processCoords = (coords: any) => {
      if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        const [lng, lat] = coords;
        if (lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        }
      } else if (Array.isArray(coords)) {
        coords.forEach(processCoords);
      }
    };

    features.forEach(f => {
      if (f.geometry?.coordinates) {
        processCoords(f.geometry.coordinates);
      }
    });

    if (minLng === Infinity) return null;
    return [[minLng, minLat], [maxLng, maxLat]] as [[number, number], [number, number]];
  }, [features]);

  useEffect(() => {
    if (!mapContainer.current || features.length === 0) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto': {
            type: 'raster',
            tiles: ['https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© CARTO'
          }
        },
        layers: [{
          id: 'carto-layer',
          type: 'raster',
          source: 'carto'
        }]
      },
      center: [-95.36, 29.76], // Houston default
      zoom: 10,
      interactive: false,
      attributionControl: false
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Add source
      map.current.addSource('preview', {
        type: 'geojson',
        data: geojsonData as GeoJSON.FeatureCollection
      });

      // Add layer based on geometry type
      if (geometryType === 'Polygon') {
        map.current.addLayer({
          id: 'preview-fill',
          type: 'fill',
          source: 'preview',
          paint: {
            'fill-color': '#FF7A00',
            'fill-opacity': 0.3
          }
        });
        map.current.addLayer({
          id: 'preview-outline',
          type: 'line',
          source: 'preview',
          paint: {
            'line-color': '#FF7A00',
            'line-width': 1.5
          }
        });
      } else if (geometryType === 'LineString') {
        map.current.addLayer({
          id: 'preview-line',
          type: 'line',
          source: 'preview',
          paint: {
            'line-color': '#06B6D4',
            'line-width': 2
          }
        });
      } else if (geometryType === 'Point' || geometryType === 'MultiPoint') {
        map.current.addLayer({
          id: 'preview-points',
          type: 'circle',
          source: 'preview',
          paint: {
            'circle-color': '#FF7A00',
            'circle-radius': 4,
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 1
          }
        });
      }

      // Fit bounds
      if (bounds) {
        map.current.fitBounds(bounds, {
          padding: 20,
          maxZoom: 14,
          duration: 0
        });
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [features, geometryType, geojsonData, bounds]);

  if (features.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-muted/30 rounded ${className}`}>
        <p className="text-xs text-muted-foreground">No preview available</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainer} 
      className={`rounded overflow-hidden ${className}`}
    />
  );
}