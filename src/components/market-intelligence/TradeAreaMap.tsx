import { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl, { Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { H3Layer, H3Legend } from './H3Layer';
import { useH3Cells, H3CellData } from '@/hooks/useH3Cells';
import { cn } from '@/lib/utils';
import { Layers, ZoomIn, ZoomOut, Locate } from 'lucide-react';

interface TradeAreaMapProps {
  centerLat: number;
  centerLng: number;
  radiusMiles: number;
  metric: 'population' | 'income' | 'growth' | 'spending';
  onCenterChange?: (lat: number, lng: number) => void;
  className?: string;
  // External H3 cell data (from real Census data)
  externalCells?: H3CellData[];
  externalMinValue?: number;
  externalMaxValue?: number;
  isLoading?: boolean;
}

const MAPTILER_KEY = 'get_your_own_key'; // Will use OSM tiles instead
const DEFAULT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export function TradeAreaMap({
  centerLat,
  centerLng,
  radiusMiles,
  metric,
  onCenterChange,
  className,
  externalCells,
  externalMinValue,
  externalMaxValue,
  isLoading,
}: TradeAreaMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showH3, setShowH3] = useState(true);

  // Use external cells if provided, otherwise generate mock cells
  const mockCells = useH3Cells({
    centerLat,
    centerLng,
    radiusMiles,
    resolution: radiusMiles <= 1 ? 9 : radiusMiles <= 3 ? 8 : 7,
    metric,
  });

  // Prefer external (real) data over mock
  const cells = externalCells || mockCells.cells;
  const minValue = externalMinValue ?? mockCells.minValue;
  const maxValue = externalMaxValue ?? mockCells.maxValue;

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: DEFAULT_STYLE,
      center: [centerLng, centerLat],
      zoom: radiusMiles <= 1 ? 14 : radiusMiles <= 3 ? 12 : 10,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      setMapLoaded(true);
      mapRef.current = map;

      // Add trade area circle
      addTradeAreaCircle(map, centerLat, centerLng, radiusMiles);
    });

    map.on('moveend', () => {
      const center = map.getCenter();
      onCenterChange?.(center.lat, center.lng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update map center when props change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    
    mapRef.current.flyTo({
      center: [centerLng, centerLat],
      zoom: radiusMiles <= 1 ? 14 : radiusMiles <= 3 ? 12 : 10,
      duration: 1000,
    });

    // Update trade area circle
    addTradeAreaCircle(mapRef.current, centerLat, centerLng, radiusMiles);
  }, [centerLat, centerLng, radiusMiles, mapLoaded]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleRecenter = () => {
    mapRef.current?.flyTo({
      center: [centerLng, centerLat],
      zoom: radiusMiles <= 1 ? 14 : radiusMiles <= 3 ? 12 : 10,
    });
  };

  return (
    <div className={cn("relative w-full h-full min-h-[400px]", className)}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden" />
      
      {/* H3 Layer */}
      {mapLoaded && (
        <H3Layer
          map={mapRef.current}
          cells={cells}
          minValue={minValue}
          maxValue={maxValue}
          metric={metric}
          opacity={0.5}
          visible={showH3}
        />
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setShowH3(!showH3)}
          className={cn(
            "p-2 rounded-lg shadow-md transition-colors",
            showH3 
              ? "bg-[hsl(var(--data-cyan))] text-white" 
              : "bg-white text-slate-700 hover:bg-slate-50"
          )}
          title="Toggle H3 Hexagons"
        >
          <Layers className="h-5 w-5" />
        </button>
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white rounded-lg shadow-md text-slate-700 hover:bg-slate-50"
          title="Zoom In"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white rounded-lg shadow-md text-slate-700 hover:bg-slate-50"
          title="Zoom Out"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <button
          onClick={handleRecenter}
          className="p-2 bg-white rounded-lg shadow-md text-slate-700 hover:bg-slate-50"
          title="Recenter"
        >
          <Locate className="h-5 w-5" />
        </button>
      </div>

      {/* Legend */}
      {showH3 && cells.length > 0 && (
        <div className="absolute bottom-4 left-4">
          <H3Legend metric={metric} minValue={minValue} maxValue={maxValue} />
        </div>
      )}

      {/* Cell Count Badge */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-md">
        <span className="text-sm font-medium text-slate-700">
          {cells.length} hexagons
          {externalCells && <span className="ml-1 text-xs text-[hsl(var(--data-cyan))]">(Census)</span>}
        </span>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-2 text-slate-600">
            <div className="animate-spin h-5 w-5 border-2 border-slate-300 border-t-[hsl(var(--data-cyan))] rounded-full" />
            <span className="text-sm font-medium">Loading Census data...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to add trade area circle
function addTradeAreaCircle(map: MapLibreMap, lat: number, lng: number, radiusMiles: number) {
  const sourceId = 'trade-area-circle';
  const layerId = 'trade-area-circle-layer';
  const outlineLayerId = 'trade-area-circle-outline';

  // Generate circle polygon
  const points = 64;
  const radiusKm = radiusMiles * 1.60934;
  const coordinates: [number, number][] = [];
  
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = radiusKm * Math.cos(angle);
    const dy = radiusKm * Math.sin(angle);
    const pointLng = lng + (dx / (111.32 * Math.cos(lat * Math.PI / 180)));
    const pointLat = lat + (dy / 110.574);
    coordinates.push([pointLng, pointLat]);
  }

  const geojson: GeoJSON.Feature = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates],
    },
  };

  // Update or add source
  const source = map.getSource(sourceId);
  if (source) {
    (source as any).setData(geojson);
  } else {
    map.addSource(sourceId, {
      type: 'geojson',
      data: geojson,
    });
  }

  // Add fill layer
  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': '#06B6D4',
        'fill-opacity': 0.1,
      },
    });
  }

  // Add outline layer
  if (!map.getLayer(outlineLayerId)) {
    map.addLayer({
      id: outlineLayerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#06B6D4',
        'line-width': 2,
        'line-dasharray': [3, 2],
      },
    });
  }
}
