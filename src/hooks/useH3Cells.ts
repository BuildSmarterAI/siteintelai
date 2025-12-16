import { useMemo } from 'react';
import * as h3 from 'h3-js';

export interface H3CellData {
  h3Index: string;
  lat: number;
  lng: number;
  value: number;
  population?: number;
  income?: number;
  growth?: number;
}

interface UseH3CellsOptions {
  centerLat: number;
  centerLng: number;
  radiusMiles: number;
  resolution?: number;
  metric?: 'population' | 'income' | 'growth' | 'spending';
}

// Convert miles to kilometers for h3 functions
const milesToKm = (miles: number) => miles * 1.60934;

export function useH3Cells(options: UseH3CellsOptions) {
  const { 
    centerLat, 
    centerLng, 
    radiusMiles, 
    resolution = 8,
    metric = 'population' 
  } = options;

  const cells = useMemo(() => {
    if (!centerLat || !centerLng || !radiusMiles) return [];

    try {
      // Get center cell
      const centerCell = h3.latLngToCell(centerLat, centerLng, resolution);
      
      // Calculate k-ring size based on radius
      // At resolution 8, each hex edge is ~0.46km (~0.29 miles)
      const hexEdgeKm = h3.getHexagonEdgeLengthAvg(resolution, 'km');
      const radiusKm = milesToKm(radiusMiles);
      const kRingSize = Math.ceil(radiusKm / (hexEdgeKm * 1.5));
      
      // Get all cells within k-ring
      const cellSet = h3.gridDisk(centerCell, kRingSize);
      
      // Generate cell data with simulated values
      const cellData: H3CellData[] = cellSet.map((h3Index) => {
        const [lat, lng] = h3.cellToLatLng(h3Index);
        
        // Calculate distance from center for gradient effect
        const distance = Math.sqrt(
          Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2)
        );
        const maxDistance = radiusMiles * 0.0145; // Approximate degrees per mile
        const normalizedDistance = Math.min(distance / maxDistance, 1);
        
        // Generate value based on metric type with distance falloff
        let value: number;
        switch (metric) {
          case 'income':
            value = 75000 * (1 - normalizedDistance * 0.5) * (0.7 + Math.random() * 0.6);
            break;
          case 'growth':
            value = 12 * (1 - normalizedDistance * 0.3) * (0.5 + Math.random() * 1);
            break;
          case 'spending':
            value = 100 * (1 - normalizedDistance * 0.4) * (0.6 + Math.random() * 0.8);
            break;
          case 'population':
          default:
            value = 5000 * (1 - normalizedDistance * 0.6) * (0.4 + Math.random() * 1.2);
        }
        
        return {
          h3Index,
          lat,
          lng,
          value: Math.round(value),
          population: Math.round(3000 + Math.random() * 7000),
          income: Math.round(45000 + Math.random() * 80000),
          growth: Math.round(2 + Math.random() * 18),
        };
      });
      
      return cellData;
    } catch (error) {
      console.error('[useH3Cells] Error generating cells:', error);
      return [];
    }
  }, [centerLat, centerLng, radiusMiles, resolution, metric]);

  // Get min/max for color scaling
  const { minValue, maxValue } = useMemo(() => {
    if (cells.length === 0) return { minValue: 0, maxValue: 100 };
    const values = cells.map(c => c.value);
    return {
      minValue: Math.min(...values),
      maxValue: Math.max(...values),
    };
  }, [cells]);

  return {
    cells,
    cellCount: cells.length,
    minValue,
    maxValue,
    resolution,
  };
}

// Generate GeoJSON for MapLibre rendering
export function cellsToGeoJSON(cells: H3CellData[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: cells.map(cell => {
      const boundary = h3.cellToBoundary(cell.h3Index, true);
      return {
        type: 'Feature',
        properties: {
          h3Index: cell.h3Index,
          value: cell.value,
          population: cell.population,
          income: cell.income,
          growth: cell.growth,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [boundary],
        },
      };
    }),
  };
}
