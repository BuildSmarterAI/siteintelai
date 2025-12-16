import { useEffect } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { H3CellData } from '@/hooks/useH3Cells';
import { cellsToGeoJSON } from '@/hooks/useH3Cells';

interface H3LayerProps {
  map: MapLibreMap | null;
  cells: H3CellData[];
  minValue: number;
  maxValue: number;
  metric: 'population' | 'income' | 'growth' | 'spending';
  opacity?: number;
  visible?: boolean;
}

// Color scales for different metrics
const colorScales: Record<string, [number, string][]> = {
  population: [
    [0, '#f7fcf5'],
    [0.2, '#c7e9c0'],
    [0.4, '#74c476'],
    [0.6, '#31a354'],
    [0.8, '#006d2c'],
    [1, '#00441b'],
  ],
  income: [
    [0, '#f7fbff'],
    [0.2, '#c6dbef'],
    [0.4, '#6baed6'],
    [0.6, '#2171b5'],
    [0.8, '#08519c'],
    [1, '#08306b'],
  ],
  growth: [
    [0, '#fff5eb'],
    [0.2, '#fdd0a2'],
    [0.4, '#fdae6b'],
    [0.6, '#f16913'],
    [0.8, '#d94801'],
    [1, '#8c2d04'],
  ],
  spending: [
    [0, '#f7f4f9'],
    [0.2, '#d4b9da'],
    [0.4, '#c994c7'],
    [0.6, '#df65b0'],
    [0.8, '#ce1256'],
    [1, '#91003f'],
  ],
};

const SOURCE_ID = 'h3-cells-source';
const LAYER_ID = 'h3-cells-layer';
const OUTLINE_LAYER_ID = 'h3-cells-outline';

export function H3Layer({ 
  map, 
  cells, 
  minValue, 
  maxValue, 
  metric,
  opacity = 0.6,
  visible = true 
}: H3LayerProps) {
  useEffect(() => {
    if (!map) return;

    // Generate GeoJSON from cells
    const geojson = cellsToGeoJSON(cells);

    // Add or update source
    const source = map.getSource(SOURCE_ID);
    if (source) {
      (source as any).setData(geojson);
    } else {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: geojson,
      });
    }

    // Build color expression
    const colorScale = colorScales[metric] || colorScales.population;
    const colorExpression: maplibregl.ExpressionSpecification = [
      'interpolate', 
      ['linear'], 
      ['get', 'value'],
      minValue, colorScale[0][1],
      minValue + (maxValue - minValue) * 0.25, colorScale[1][1],
      minValue + (maxValue - minValue) * 0.5, colorScale[2][1],
      minValue + (maxValue - minValue) * 0.75, colorScale[4][1],
      maxValue, colorScale[5][1],
    ];

    // Add or update fill layer
    if (!map.getLayer(LAYER_ID)) {
      map.addLayer({
        id: LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': colorExpression as any,
          'fill-opacity': opacity,
        },
      });
    } else {
      map.setPaintProperty(LAYER_ID, 'fill-color', colorExpression);
      map.setPaintProperty(LAYER_ID, 'fill-opacity', opacity);
    }

    // Add or update outline layer
    if (!map.getLayer(OUTLINE_LAYER_ID)) {
      map.addLayer({
        id: OUTLINE_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': '#ffffff',
          'line-width': 0.5,
          'line-opacity': 0.3,
        },
      });
    }

    // Set visibility
    map.setLayoutProperty(LAYER_ID, 'visibility', visible ? 'visible' : 'none');
    map.setLayoutProperty(OUTLINE_LAYER_ID, 'visibility', visible ? 'visible' : 'none');

    return () => {
      // Cleanup on unmount - check if map style still exists
      if (!map.getStyle()) return;
      try {
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
        if (map.getLayer(OUTLINE_LAYER_ID)) map.removeLayer(OUTLINE_LAYER_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      } catch (e) {
        // Map may already be destroyed
      }
    };
  }, [map, cells, minValue, maxValue, metric, opacity, visible]);

  return null;
}

// Legend component
interface H3LegendProps {
  metric: 'population' | 'income' | 'growth' | 'spending';
  minValue: number;
  maxValue: number;
}

export function H3Legend({ metric, minValue, maxValue }: H3LegendProps) {
  const colorScale = colorScales[metric] || colorScales.population;
  
  const formatValue = (value: number) => {
    if (metric === 'income') return `$${(value / 1000).toFixed(0)}k`;
    if (metric === 'growth') return `${value.toFixed(0)}%`;
    if (metric === 'spending') return value.toFixed(0);
    return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0);
  };

  const labels: Record<string, string> = {
    population: 'Population',
    income: 'Median Income',
    growth: 'Growth Rate',
    spending: 'Spending Index',
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
      <div className="text-xs font-medium text-slate-700 mb-2">
        {labels[metric]}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-500">{formatValue(minValue)}</span>
        <div 
          className="flex-1 h-3 rounded"
          style={{
            background: `linear-gradient(to right, ${colorScale.map(([, c]) => c).join(', ')})`
          }}
        />
        <span className="text-xs text-slate-500">{formatValue(maxValue)}</span>
      </div>
    </div>
  );
}
