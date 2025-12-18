import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Maximize2, Minimize2, Download, Ruler, X, Copy, Box, Map, Database, CloudOff, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapLegend } from './MapLegend';
import { MapLayerFAB } from './MapLayerFAB';
import { MeasurementTools, MeasurementMode } from './MeasurementTools';
import { MapSearchBar } from './MapSearchBar';
import { toast } from 'sonner';
import * as turf from '@turf/turf';
import { useVectorTileLayers, hasVectorTileSource } from '@/hooks/useVectorTileLayers';
import { useFallbackParcels } from '@/hooks/useFallbackParcels';

// Layer metadata with data sources and intent relevance
export const LAYER_CONFIG = {
  countyParcels: {
    id: 'county-parcels',
    title: 'County Parcels',
    source: 'Multi-County Appraisal Districts',
    color: '#6366F1',
    opacity: 0.3,
    intentRelevance: { build: true, buy: true },
  },
  waterLines: {
    id: 'water-lines',
    title: 'Water Lines',
    source: 'City of Houston Public Works',
    color: '#3B82F6',
    opacity: 0.8,
    intentRelevance: { build: true, buy: true },
  },
  sewerLines: {
    id: 'sewer-lines',
    title: 'Sewer Lines',
    source: 'City of Houston Public Works',
    color: '#10B981',
    opacity: 0.8,
    intentRelevance: { build: true, buy: true },
  },
  stormLines: {
    id: 'storm-lines',
    title: 'Storm Drain Lines',
    source: 'Houston Water HPW Stormdrain Line IPS',
    color: '#14B8A6',
    opacity: 0.8,
    intentRelevance: { build: true, buy: true },
  },
  stormManholes: {
    id: 'storm-manholes',
    title: 'Storm Drain Manholes',
    source: 'Houston Water HPW Manhole IPS',
    color: '#60A5FA',
    opacity: 0.9,
    intentRelevance: { build: true, buy: true },
  },
  forceMain: {
    id: 'force-main',
    title: 'Force Main',
    source: 'City of Houston Wastewater',
    color: '#F59E0B',
    opacity: 0.8,
    intentRelevance: { build: true, buy: true },
  },
  floodZones: {
    id: 'flood-zones',
    title: 'Flood Zones',
    source: 'FEMA NFHL',
    color: '#EF4444',
    opacity: 0.7,
    intentRelevance: { build: true, buy: true },
  },
  zoningDistricts: {
    id: 'zoning-districts',
    title: 'Zoning Districts',
    source: 'City Planning Department',
    color: '#EC4899',
    opacity: 0.4,
    intentRelevance: { build: true, buy: true },
  },
};

/**
 * Calculate default layer visibility based on user intent
 */
function getInitialLayerVisibility(
  intentType: 'build' | 'buy' | null,
  savedPreferences: any | null
): LayerVisibility {
  // If user has saved preferences, respect them (merge with defaults for new layers)
  const defaults: LayerVisibility = {
    parcel: true,
    drawnParcels: true,
    traffic: true,
    employment: true,
    flood: true,
    utilities: true,
    hcadParcels: true,
    waterLines: true,
    sewerLines: true,
    stormLines: true,
    stormManholes: true,
    forceMain: true,
    floodZones: true,
    zoningDistricts: true,
    topography: false, // Off by default - terrain can be heavy
  };
  
  if (savedPreferences && Object.keys(savedPreferences).length > 0) {
    return { ...defaults, ...savedPreferences };
  }
  
  return defaults;
}

interface EmploymentCenter {
  name: string;
  jobs: number;
  distance_miles: number;
  coordinates: [number, number];
}

interface DrawParcel {
  id: string;
  name: string;
  geometry: any;
  acreage_calc: number;
}

interface LayerVisibility {
  parcel: boolean;
  flood: boolean;
  utilities: boolean;
  traffic: boolean;
  employment: boolean;
  drawnParcels: boolean;
  hcadParcels: boolean;
  waterLines: boolean;
  sewerLines: boolean;
  stormLines: boolean;
  stormManholes: boolean;
  forceMain: boolean;
  floodZones: boolean;
  zoningDistricts: boolean;
  topography: boolean;
}

interface MapLibreCanvasProps {
  center: [number, number]; // [lat, lng] - Leaflet format
  zoom?: number;
  parcel?: any;
  floodZones?: any[];
  utilities?: any[];
  traffic?: any[];
  employmentCenters?: EmploymentCenter[];
  drawnParcels?: DrawParcel[];
  drawingEnabled?: boolean;
  onParcelDrawn?: (geometry: any) => void;
  onParcelSelected?: (parcel: DrawParcel | null) => void;
  selectedParcelId?: string | null;
  editingParcelId?: string | null;
  className?: string;
  propertyAddress?: string;
  femaFloodZone?: string;
  intentType?: 'build' | 'buy' | null;
  hcadParcels?: any[];
  waterLines?: any[];
  sewerLines?: any[];
  stormLines?: any[];
  stormManholes?: any[];
  forceMain?: any[];
  zoningDistricts?: any[];
  showParcels?: boolean;
  onParcelSelect?: (parcel: any) => void;
  onMapLoad?: () => void;
}

/**
 * MapLibreCanvas - Hardware-accelerated geospatial visualization component
 * 
 * Renders interactive maps with 5 layer types:
 * - Parcel boundaries (property footprint)
 * - FEMA flood zones (risk-based color coding)
 * - Utility infrastructure (water, sewer, storm)
 * - TxDOT traffic segments (AADT-based styling)
 * - Employment centers (clustered markers)
 * 
 * @accessibility WCAG 2.1 AA compliant with keyboard nav and screen reader support
 * @performance 60fps pan/zoom, <1.5s initial load
 */
export function MapLibreCanvas({
  center,
  zoom = 15,
  parcel,
  floodZones = [],
  utilities = [],
  traffic = [],
  employmentCenters = [],
  drawnParcels = [],
  drawingEnabled = false,
  onParcelDrawn,
  onParcelSelected,
  selectedParcelId = null,
  editingParcelId = null,
  className = '',
  propertyAddress = 'Property location',
  femaFloodZone,
  intentType = null,
  hcadParcels = [],
  waterLines = [],
  sewerLines = [],
  stormLines = [],
  stormManholes = [],
  forceMain = [],
  zoningDistricts = [],
  showParcels = false,
  onParcelSelect,
  onMapLoad,
}: MapLibreCanvasProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [styleVersion, setStyleVersion] = useState(0); // Triggers re-add after style changes
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  const [activeMeasurementTool, setActiveMeasurementTool] = useState<MeasurementMode>(null);
  const [measurementResult, setMeasurementResult] = useState<any>(null);
  const [measurementPoints, setMeasurementPoints] = useState<[number, number][]>([]);
  const [parcelLoadError, setParcelLoadError] = useState<string | null>(null);
  const [parcelLoading, setParcelLoading] = useState(false);
  const retryParcelLoad = useRef<(() => void) | null>(null);
  const measurementSourceId = 'measurement-source';
  
  // Use ref to avoid stale closure in click handlers
  const onParcelSelectRef = useRef(onParcelSelect);
  
  // Basemap style state (persisted in localStorage)
  const [basemapStyle, setBasemapStyle] = useState<'streets' | 'satellite' | 'hybrid'>(() => {
    const saved = localStorage.getItem('mapBasemapStyle');
    return (saved as 'streets' | 'satellite' | 'hybrid') || 'streets';
  });
  
  // Layer visibility state (persisted in localStorage with intent-aware defaults)
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>(() => {
    const saved = localStorage.getItem('mapLayerVisibility');
    const savedPrefs = saved ? JSON.parse(saved) : null;
    return getInitialLayerVisibility(intentType, savedPrefs);
  });

  // Layer opacity state (persisted in localStorage)
  const [layerOpacity, setLayerOpacity] = useState(() => {
    const saved = localStorage.getItem('mapLayerOpacity');
    return saved ? JSON.parse(saved) : {
      flood: 0.7,
      traffic: 0.8,
      utilities: 0.8,
    };
  });

  // Vector tile layers from CloudFront CDN
  const { 
    sources: vectorTileSources, 
    hasVectorTiles, 
    isLoading: vectorTilesLoading,
    activeSources: activeVectorSources,
    error: vectorTileError,
  } = useVectorTileLayers({
    map: mapInstance, // Use state, not ref - triggers re-render
    mapLoaded,
    jurisdiction: 'tx',
    layerVisibility: { ...layerVisibility },
    styleVersion, // Re-add layers after style changes
    onParcelClick: onParcelSelect, // Forward parcel clicks
  });

  // Fallback parcels via GeoJSON when vector tiles unavailable
  const shouldUseFallback = showParcels && !hasVectorTiles && !vectorTilesLoading;
  
  const {
    isLoading: fallbackLoading,
    error: fallbackError,
    metadata: fallbackMetadata,
    featureCount: fallbackFeatureCount,
    isFallbackMode,
  } = useFallbackParcels({
    map: mapInstance,
    mapLoaded,
    enabled: shouldUseFallback,
    onParcelClick: onParcelSelect,
    minZoom: 14,
    debounceMs: 500,
  });

  // Debug log vector tile and fallback state
  useEffect(() => {
    console.log('🔍 TILE DEBUG: MapLibreCanvas parcel display state', {
      hasVectorTiles,
      vectorTilesLoading,
      vectorTileError: vectorTileError?.message,
      activeVectorSources,
      sourceCount: Object.keys(vectorTileSources).length,
      mapLoaded,
      hasMapInstance: !!mapInstance,
      // Fallback state
      shouldUseFallback,
      fallbackLoading,
      fallbackFeatureCount,
      isFallbackMode,
      fallbackSource: fallbackMetadata?.source,
    });
  }, [hasVectorTiles, vectorTilesLoading, vectorTileError, activeVectorSources, vectorTileSources, mapLoaded, mapInstance, shouldUseFallback, fallbackLoading, fallbackFeatureCount, isFallbackMode, fallbackMetadata]);

  // Keep ref updated with latest callback to avoid stale closures
  useEffect(() => {
    onParcelSelectRef.current = onParcelSelect;
    console.log('[MapLibreCanvas] onParcelSelect ref updated:', !!onParcelSelect);
  }, [onParcelSelect]);

  // Convert Leaflet [lat, lng] to MapLibre [lng, lat]
  const toMapLibre = (coords: [number, number]): [number, number] => [coords[1], coords[0]];

  // Basemap style configuration
  const getBasemapStyle = (styleType: 'streets' | 'satellite' | 'hybrid') => {
    const styles = {
      streets: {
        version: 8 as const,
        sources: {
          'osm-tiles': {
            type: 'raster' as const,
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster' as const,
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      satellite: {
        version: 8 as const,
        sources: {
          'google-satellite': {
            type: 'raster' as const,
            tiles: [
              'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
              'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
              'https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
              'https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
            ],
            tileSize: 256,
            attribution: '© Google',
          },
        },
        layers: [
          {
            id: 'google-satellite-layer',
            type: 'raster' as const,
            source: 'google-satellite',
            minzoom: 0,
            maxzoom: 20,
          },
        ],
      },
      hybrid: {
        version: 8 as const,
        sources: {
          'google-satellite': {
            type: 'raster' as const,
            tiles: [
              'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
              'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
              'https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
              'https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
            ],
            tileSize: 256,
            attribution: '© Google',
          },
          'osm-labels': {
            type: 'raster' as const,
            tiles: [
              'https://stamen-tiles.a.ssl.fastly.net/toner-hybrid/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: 'google-satellite-layer',
            type: 'raster' as const,
            source: 'google-satellite',
            minzoom: 0,
            maxzoom: 20,
          },
          {
            id: 'osm-labels-layer',
            type: 'raster' as const,
            source: 'osm-labels',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
    };
    
    return styles[styleType];
  };

  // Save visibility state to localStorage
  useEffect(() => {
    localStorage.setItem('mapLayerVisibility', JSON.stringify(layerVisibility));
  }, [layerVisibility]);

  // Save basemap style to localStorage
  useEffect(() => {
    localStorage.setItem('mapBasemapStyle', basemapStyle);
  }, [basemapStyle]);

  // Save opacity state to localStorage
  useEffect(() => {
    localStorage.setItem('mapLayerOpacity', JSON.stringify(layerOpacity));
  }, [layerOpacity]);

  // Toggle layer visibility
  const toggleLayer = (layerName: keyof LayerVisibility) => {
    setLayerVisibility(prev => ({ ...prev, [layerName]: !prev[layerName] }));
  };

  // Update layer opacity
  const updateLayerOpacity = (layerName: keyof typeof layerOpacity, opacity: number) => {
    setLayerOpacity(prev => ({ ...prev, [layerName]: opacity }));
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  // Toggle basemap style - increment styleVersion to re-add vector tiles
  const toggleBasemap = () => {
    const styles: Array<'streets' | 'satellite' | 'hybrid'> = ['streets', 'satellite', 'hybrid'];
    const currentIndex = styles.indexOf(basemapStyle);
    // Style change will trigger re-add of vector tile layers
    setStyleVersion(v => v + 1);
    const nextStyle = styles[(currentIndex + 1) % styles.length];
    
    if (map.current) {
      // Change basemap style
      map.current.setStyle(getBasemapStyle(nextStyle));
      
      // Wait for style to load, then trigger layer re-rendering
      map.current.once('styledata', () => {
        setMapLoaded(true);
      });
      
      setBasemapStyle(nextStyle);
      
      const labels = {
        streets: 'Streets',
        satellite: 'Satellite',
        hybrid: 'Hybrid'
      };
      toast.success(`Switched to ${labels[nextStyle]} view`);
    }
  };

  // Export map as PNG
  const exportMapAsPNG = () => {
    if (!map.current) return;
    
    try {
      const canvas = map.current.getCanvas();
      const link = document.createElement('a');
      link.download = `SiteIntel_Map_${propertyAddress.replace(/\s+/g, '_')}_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 2.0); // 2x resolution for retina
      link.click();
      toast.success('Map exported as PNG');
    } catch (error) {
      console.error('Failed to export map:', error);
      toast.error('Export failed');
    }
  };

  // Handle measurement tool changes
  const handleMeasurementToolChange = (tool: MeasurementMode) => {
    setActiveMeasurementTool(tool);
    setMeasurementPoints([]);
    setMeasurementResult(null);
    
    // Clear measurement layer if exists
    if (map.current && map.current.getSource(measurementSourceId)) {
      if (map.current.getLayer('measurement-line')) map.current.removeLayer('measurement-line');
      if (map.current.getLayer('measurement-fill')) map.current.removeLayer('measurement-fill');
      if (map.current.getLayer('measurement-points')) map.current.removeLayer('measurement-points');
      map.current.removeSource(measurementSourceId);
    }
  };

  // Calculate distance using Haversine formula
  const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
    const from = turf.point(point1);
    const to = turf.point(point2);
    const distance = turf.distance(from, to, { units: 'miles' });
    return distance;
  };

  // Calculate area
  const calculateArea = (points: [number, number][]): number => {
    if (points.length < 3) return 0;
    const polygon = turf.polygon([[...points, points[0]]]);
    const area = turf.area(polygon);
    return area / 4046.86; // Convert to acres
  };

  // Fit map to parcel bounds
  const fitToParcel = () => {
    if (!map.current || !parcel?.geometry?.coordinates?.[0]) return;
    
    try {
      const coords = parcel.geometry.coordinates[0];
      const lngs = coords.map((c: [number, number]) => c[0]);
      const lats = coords.map((c: [number, number]) => c[1]);
      
      const bounds = new maplibregl.LngLatBounds(
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)]
      );
      
      map.current.fitBounds(bounds, { padding: 32, duration: 800 });
    } catch (error) {
      console.error('Failed to fit bounds:', error);
    }
  };

  // Generate accessible description for screen readers
  const getMapDescription = () => {
    const parts = [`Map showing ${propertyAddress}`];
    const visible = [];
    
    if (parcel && layerVisibility.parcel) visible.push('parcel boundary in orange');
    if (floodZones.length > 0 && layerVisibility.flood) visible.push(`${floodZones.length} flood zone(s)`);
    if (utilities.length > 0 && layerVisibility.utilities) visible.push(`${utilities.length} utility line(s)`);
    if (waterLines.length > 0 && layerVisibility.waterLines) visible.push(`${waterLines.length} water line(s) in blue`);
    if (sewerLines.length > 0 && layerVisibility.sewerLines) visible.push(`${sewerLines.length} sewer line(s) in green`);
    if (stormLines.length > 0 && layerVisibility.stormLines) visible.push(`${stormLines.length} storm drain line(s) in teal`);
    if (stormManholes.length > 0 && layerVisibility.stormManholes) visible.push(`${stormManholes.length} storm manhole(s) in blue circles`);
    if (traffic.length > 0 && layerVisibility.traffic) visible.push(`${traffic.length} traffic segment(s)`);
    if (employmentCenters.length > 0 && layerVisibility.employment) visible.push(`${employmentCenters.length} employment center(s)`);
    
    if (visible.length > 0) parts.push(`with ${visible.join(', ')}`);
    
    return parts.join(' ');
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        preserveDrawingBuffer: true, // Enable PNG export
        style: getBasemapStyle(basemapStyle),
        center: toMapLibre(center),
        zoom: zoom,
        antialias: true,
      });

      // Add navigation controls
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

      // Set loaded flag and map instance for hooks
      map.current.on('load', () => {
        setMapLoaded(true);
        setMapInstance(map.current); // Trigger hook with state
        onMapLoad?.(); // Notify parent that map is ready
        console.log('🗺️ Map loaded, vector tiles will initialize');
        
        // Add 3D building layer (initially hidden)
        if (map.current) {
          map.current.addLayer({
            id: '3d-buildings',
            source: {
              type: 'vector',
              url: 'https://tiles.openfreemap.org/planet'
            },
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 15,
            paint: {
              'fill-extrusion-color': '#aaa',
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15, 0,
                15.05, ['get', 'height']
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15, 0,
                15.05, ['get', 'min_height']
              ],
              'fill-extrusion-opacity': 0.6
            },
            layout: {
              visibility: 'none'
            }
          });
        }
      });

      // Handle errors gracefully
      map.current.on('error', (e) => {
        console.warn('Map error:', e);
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update center and zoom when props change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    map.current.flyTo({
      center: toMapLibre(center),
      zoom: zoom,
      duration: 1000,
    });
  }, [center, zoom, mapLoaded]);

  // Add parcel layer
  useEffect(() => {
    if (!map.current || !mapLoaded || !parcel?.geometry) return;

    // Wait for style to finish loading after basemap change
    if (map.current.isStyleLoaded() === false) {
      const handler = () => {
        setMapLoaded(true);
      };
      map.current.once('styledata', handler);
      return;
    }

    const sourceId = 'parcel-source';
    const fillLayerId = 'parcel-fill';
    const lineLayerId = 'parcel-line';

    try {
      // Remove existing layers/source
      if (map.current.getLayer(fillLayerId)) map.current.removeLayer(fillLayerId);
      if (map.current.getLayer(lineLayerId)) map.current.removeLayer(lineLayerId);
      if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);

      // Add source
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: parcel.geometry,
            properties: parcel.properties || {},
          }],
        },
      });

      // Add fill layer - Feasibility Orange #FF7A00
      map.current.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#FF7A00',
          'fill-opacity': 0.2,
        },
        layout: {
          visibility: layerVisibility.parcel ? 'visible' : 'none',
        },
      });

      // Add line layer
      map.current.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#FF7A00',
          'line-width': 2.5,
        },
        layout: {
          visibility: layerVisibility.parcel ? 'visible' : 'none',
        },
      });

      // Add click handler for parcel info
      map.current.on('click', lineLayerId, (e) => {
        const acreage = parcel.properties?.acreage || 'Unknown';
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="padding: 8px;">
              <strong>${propertyAddress}</strong><br>
              Acreage: ${typeof acreage === 'number' ? acreage.toFixed(2) : acreage}
            </div>
          `)
          .addTo(map.current!);
      });

      // Change cursor on hover
      map.current.on('mouseenter', lineLayerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', lineLayerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });

      // Fit to parcel on initial load
      fitToParcel();
    } catch (error) {
      console.error('Failed to add parcel layer:', error);
    }

    if (map.current?.getLayer(lineLayerId)) {
      console.log('🧩 Parcel layer added', {
        featureType: parcel.geometry?.type,
        points: Array.isArray(parcel.geometry?.coordinates?.[0]) ? parcel.geometry.coordinates[0].length : undefined,
      });
    }
  }, [parcel, mapLoaded, layerVisibility.parcel, propertyAddress]);

  // Update parcel visibility when toggle changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const visibility = layerVisibility.parcel ? 'visible' : 'none';
    if (map.current.getLayer('parcel-fill')) {
      map.current.setLayoutProperty('parcel-fill', 'visibility', visibility);
    }
    if (map.current.getLayer('parcel-line')) {
      map.current.setLayoutProperty('parcel-line', 'visibility', visibility);
    }
  }, [layerVisibility.parcel, mapLoaded]);

  // Add FEMA flood zone overlay circle
  useEffect(() => {
    if (!map.current || !mapLoaded || !femaFloodZone) return;

    const sourceId = 'flood-zone-circle';
    const fillLayerId = 'flood-zone-circle-fill';
    const lineLayerId = 'flood-zone-circle-line';

    try {
      // Remove existing layers
      if (map.current.getLayer(fillLayerId)) map.current.removeLayer(fillLayerId);
      if (map.current.getLayer(lineLayerId)) map.current.removeLayer(lineLayerId);
      if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);

      // Determine color based on flood zone
      const floodColor = femaFloodZone === 'Zone X' ? '#10b981' : 
                        femaFloodZone.includes('A') || femaFloodZone.includes('V') ? '#ef4444' : 
                        '#eab308';
      const floodRisk = femaFloodZone === 'Zone X' ? 'Low Risk' : 
                       femaFloodZone.includes('A') || femaFloodZone.includes('V') ? 'High Risk' : 
                       'Moderate Risk';
      
      // Create circle geometry (150m radius)
      const radiusMeters = 150;
      const radiusInDegrees = radiusMeters / 111320;
      const numPoints = 64;
      const coordinates: number[][] = [];
      
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        const dx = radiusInDegrees * Math.cos(angle);
        const dy = radiusInDegrees * Math.sin(angle);
        coordinates.push([center[1] + dx, center[0] + dy]);
      }
      coordinates.push(coordinates[0]); // Close the polygon
      
      // Add source
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates]
          },
          properties: {
            zone: femaFloodZone,
            risk: floodRisk
          }
        }
      });
      
      // Add fill layer
      map.current.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': floodColor,
          'fill-opacity': 0.15
        }
      });
      
      // Add outline layer
      map.current.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': floodColor,
          'line-width': 2,
          'line-opacity': 0.6
        }
      });
      
      // Add click handler
      map.current.on('click', fillLayerId, (e: any) => {
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="padding: 8px;">
              <strong>FEMA Flood Zone</strong><br>
              Zone: ${femaFloodZone}<br>
              Risk Level: <span style="color: ${floodColor};">${floodRisk}</span>
            </div>
          `)
          .addTo(map.current!);
      });

      console.log('🌊 Flood zone overlay added:', femaFloodZone);
    } catch (error) {
      console.error('Failed to add flood zone overlay:', error);
    }
  }, [femaFloodZone, center, mapLoaded]);

  // Add flood zones layer
  useEffect(() => {
    if (!map.current || !mapLoaded || floodZones.length === 0) return;

    const sourceId = 'flood-source';
    const layerId = 'flood-layer';

    try {
      // Remove existing
      if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
      if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);

      // Add source
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: floodZones.map((zone, idx) => ({
            type: 'Feature',
            id: idx,
            geometry: zone.geometry,
            properties: { zone: zone.properties?.zone || zone.properties?.FLD_ZONE || 'X' },
          })),
        },
      });

      // Add fill layer with risk-based colors and click handler
      map.current.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': [
            'match',
            ['get', 'zone'],
            ['A', 'AE', 'AO', 'AH'], '#EF4444',  // High risk - Error Red
            ['X', 'AREA OF MINIMAL FLOOD HAZARD'], '#10B981',  // Low risk - Success Green
            '#FF7A00',  // Moderate - Feasibility Orange (brand aligned)
          ],
          'fill-opacity': 0.25,
        },
        layout: {
          visibility: layerVisibility.flood ? 'visible' : 'none',
        },
      });

      // Add click handler for flood zone info
      map.current.on('click', layerId, (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const props = e.features[0].properties;
        const zone = floodZones.find(z => z.properties.zone === props.zone);
        
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="padding: 32px; font-family: 'IBM Plex Sans', sans-serif;">
              <strong>FEMA Flood Zone ${props.zone}</strong><br>
              ${zone?.properties.bfe ? `Base Flood Elevation: ${zone.properties.bfe} ft` : 'No BFE data'}<br>
              Source: ${zone?.properties.source || 'FEMA NFHL'}
            </div>
          `)
          .addTo(map.current!);
      });

      // Cursor changes
      map.current.on('mouseenter', layerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', layerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    } catch (error) {
      console.error('Failed to add flood zones layer:', error);
    }
  }, [floodZones, mapLoaded, layerVisibility.flood]);

  // Update flood visibility
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const visibility = layerVisibility.flood ? 'visible' : 'none';
    if (map.current.getLayer('flood-layer')) {
      map.current.setLayoutProperty('flood-layer', 'visibility', visibility);
    }
  }, [layerVisibility.flood, mapLoaded]);

  // Add utilities layer
  useEffect(() => {
    if (!map.current || !mapLoaded || utilities.length === 0) return;

    const sourceId = 'utilities-source';
    const layerId = 'utilities-layer';

    try {
      // Remove existing
      if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
      if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);

      // Add source
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: utilities.map((util, idx) => ({
            type: 'Feature',
            id: idx,
            geometry: util.geometry,
            properties: { type: util.properties?.type || 'unknown' },
          })),
        },
      });

      // Add layer with utility type colors
      map.current.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': [
            'match',
            ['get', 'type'],
            'water', 'hsl(191, 91%, 43%)',  // --data-cyan
            'sewer', 'hsl(142, 76%, 36%)',  // green
            'storm', 'hsl(217, 9%, 45%)',   // gray
            'hsl(191, 91%, 43%)',  // default: cyan
          ],
          'line-width': 3,
          'line-opacity': 0.7,
        },
        layout: {
          visibility: layerVisibility.utilities ? 'visible' : 'none',
        },
      });
    } catch (error) {
      console.error('Failed to add utilities layer:', error);
    }
  }, [utilities, mapLoaded, layerVisibility.utilities]);

  // Update utilities visibility
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const visibility = layerVisibility.utilities ? 'visible' : 'none';
    if (map.current.getLayer('utilities-layer')) {
      map.current.setLayoutProperty('utilities-layer', 'visibility', visibility);
    }
  }, [layerVisibility.utilities, mapLoaded]);

  // Add storm drain lines layer
  useEffect(() => {
    if (!map.current || !mapLoaded || stormLines.length === 0) return;

    const sourceId = 'storm-lines-source';
    const layerId = 'storm-lines-layer';

    try {
      // Remove existing layers if present
      if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
      if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);

      // Transform storm lines data to GeoJSON features
      const features = stormLines
        .filter(line => line.geometry && line.geometry.coordinates)
        .map((line, idx) => ({
          type: 'Feature' as const,
          id: idx,
          geometry: line.geometry,
          properties: {
            facility_id: line.facility_id || line.attributes?.FACILITYID || 'Unknown',
            diameter_in: line.diameter_in || line.attributes?.DIAMETER || null,
            material: line.material || line.attributes?.MATERIAL || 'Unknown',
            install_year: line.install_year || line.attributes?.INSTALL_YEAR || null,
            condition: line.condition || line.attributes?.CONDITION || 'Unknown',
            status: line.status || line.attributes?.STATUS || 'Active',
            distance_ft: line.distance_ft || null,
          },
        }));

      // Add GeoJSON source
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
      });

      // Add storm drain polyline layer with teal styling
      map.current.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#14B8A6',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12, 2,
            16, 4,
          ],
          'line-opacity': 0.8,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
          visibility: layerVisibility.stormLines ? 'visible' : 'none',
        },
      });

      // Add hover popup with facility details
      map.current.on('click', layerId, (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const props = e.features[0].properties;
        const diameterDisplay = props.diameter_in 
          ? `${props.diameter_in}" diameter` 
          : 'Unknown diameter';
        const conditionColor = 
          props.condition === 'Active' ? '#10B981' :
          props.condition === 'Planned' ? '#F59E0B' :
          props.condition === 'Abandoned' ? '#EF4444' : '#6B7280';
        
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="padding: 12px; font-family: 'IBM Plex Sans', sans-serif; min-width: 220px;">
              <div style="font-weight: 600; font-size: 14px; color: #14B8A6; margin-bottom: 6px;">
                Storm Drain Line
              </div>
              <div style="font-size: 12px; line-height: 1.6; color: #374151;">
                <div style="margin-bottom: 4px;">
                  <strong>Facility ID:</strong> ${props.facility_id}
                </div>
                <div style="margin-bottom: 4px;">
                  <strong>Diameter:</strong> ${diameterDisplay}
                </div>
                <div style="margin-bottom: 4px;">
                  <strong>Material:</strong> ${props.material}
                </div>
                <div style="margin-bottom: 4px;">
                  <strong>Condition:</strong> 
                  <span style="color: ${conditionColor}; font-weight: 600;">
                    ${props.condition}
                  </span>
                </div>
                ${props.install_year ? `
                  <div style="margin-bottom: 4px;">
                    <strong>Installed:</strong> ${props.install_year}
                  </div>
                ` : ''}
                ${props.distance_ft ? `
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #6B7280;">
                    ${props.distance_ft.toFixed(0)} ft from parcel
                  </div>
                ` : ''}
              </div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB; font-size: 10px; color: #9CA3AF;">
                Source: Houston Water HPW IPS
              </div>
            </div>
          `)
          .addTo(map.current!);
      });

      // Cursor changes on hover
      map.current.on('mouseenter', layerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', layerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });

      console.log(`🌊 Storm drain lines rendered: ${features.length} segments`);
    } catch (error) {
      console.error('Failed to add storm lines layer:', error);
    }
  }, [stormLines, mapLoaded, layerVisibility.stormLines]);

  // Update storm lines visibility when toggled
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const visibility = layerVisibility.stormLines ? 'visible' : 'none';
    if (map.current.getLayer('storm-lines-layer')) {
      map.current.setLayoutProperty('storm-lines-layer', 'visibility', visibility);
    }
  }, [layerVisibility.stormLines, mapLoaded]);

  // Add storm manholes layer (point features)
  useEffect(() => {
    if (!map.current || !mapLoaded || stormManholes.length === 0) return;

    const sourceId = 'storm-manholes-source';
    const layerId = 'storm-manholes-layer';

    try {
      // Remove existing layers if present
      if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
      if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);

      // Transform manhole data to GeoJSON features
      const features = stormManholes
        .filter(manhole => manhole.geometry && manhole.geometry.coordinates)
        .map((manhole, idx) => ({
          type: 'Feature' as const,
          id: idx,
          geometry: manhole.geometry,
          properties: {
            facility_id: manhole.facility_id || 'Unknown',
            struct_type: manhole.struct_type || 'Storm',
            diameter: manhole.diameter || null,
            rim_elevation: manhole.rim_elevation || null,
            invert_elevation: manhole.invert_elevation || null,
            material: manhole.material || 'Unknown',
            install_date: manhole.install_date || null,
            owner: manhole.owner || 'Unknown',
            status: manhole.status || 'Active',
            distance_ft: manhole.distance_ft || null,
          },
        }));

      // Add GeoJSON source
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
      });

      // Add storm manhole circle layer with blue styling
      map.current.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12, 4,
            16, 8,
          ],
          'circle-color': '#60A5FA',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#1E40AF',
          'circle-opacity': 0.85,
          'circle-stroke-opacity': 1,
        },
        layout: {
          visibility: layerVisibility.stormManholes ? 'visible' : 'none',
        },
      });

      // Add hover popup with manhole details
      map.current.on('click', layerId, (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const props = e.features[0].properties;
        const elevationDiff = props.rim_elevation && props.invert_elevation
          ? (props.rim_elevation - props.invert_elevation).toFixed(1)
          : 'N/A';
        
        const statusColor = 
          props.status === 'Active' ? '#10B981' :
          props.status === 'Planned' ? '#F59E0B' :
          props.status === 'Abandoned' ? '#EF4444' : '#6B7280';
        
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="padding: 12px; font-family: 'IBM Plex Sans', sans-serif; min-width: 240px;">
              <div style="font-weight: 600; font-size: 14px; color: #60A5FA; margin-bottom: 6px;">
                Storm Drain Manhole
              </div>
              <div style="font-size: 12px; line-height: 1.6; color: #374151;">
                <div style="margin-bottom: 4px;">
                  <strong>Facility ID:</strong> ${props.facility_id}
                </div>
                <div style="margin-bottom: 4px;">
                  <strong>Type:</strong> ${props.struct_type}
                </div>
                ${props.diameter ? `
                  <div style="margin-bottom: 4px;">
                    <strong>Diameter:</strong> ${props.diameter}"
                  </div>
                ` : ''}
                <div style="margin-bottom: 4px;">
                  <strong>Owner:</strong> ${props.owner}
                </div>
                <div style="margin-bottom: 4px;">
                  <strong>Status:</strong> 
                  <span style="color: ${statusColor}; font-weight: 600;">
                    ${props.status}
                  </span>
                </div>
                ${props.rim_elevation ? `
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">
                    <strong>Rim Elevation:</strong> ${props.rim_elevation.toFixed(1)} ft<br/>
                    <strong>Invert Elevation:</strong> ${props.invert_elevation ? props.invert_elevation.toFixed(1) + ' ft' : 'N/A'}<br/>
                    <strong>Depth:</strong> ${elevationDiff} ft
                  </div>
                ` : ''}
                ${props.distance_ft ? `
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #6B7280;">
                    ${props.distance_ft.toFixed(0)} ft from parcel
                  </div>
                ` : ''}
              </div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB; font-size: 10px; color: #9CA3AF;">
                Source: Houston Water HPW Manhole IPS
              </div>
            </div>
          `)
          .addTo(map.current!);
      });

      // Cursor changes on hover
      map.current.on('mouseenter', layerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', layerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });

      console.log(`🕳️ Storm manholes rendered: ${features.length} manholes`);
    } catch (error) {
      console.error('Failed to add storm manholes layer:', error);
    }
  }, [stormManholes, mapLoaded, layerVisibility.stormManholes]);

  // Update storm manholes visibility when toggled
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const visibility = layerVisibility.stormManholes ? 'visible' : 'none';
    if (map.current.getLayer('storm-manholes-layer')) {
      map.current.setLayoutProperty('storm-manholes-layer', 'visibility', visibility);
    }
  }, [layerVisibility.stormManholes, mapLoaded]);

  // Add water lines layer
  useEffect(() => {
    if (!map.current || !mapLoaded || waterLines.length === 0) return;

    const sourceId = 'water-lines-source';
    const layerId = 'water-lines-layer';

    try {
      // Remove existing layers if present
      if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
      if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);

      // Transform water lines data to GeoJSON features
      const features = waterLines
        .filter(line => line.geometry && line.geometry.coordinates)
        .map((line, idx) => ({
          type: 'Feature' as const,
          id: idx,
          geometry: line.geometry,
          properties: {
            facility_id: line.facility_id || line.attributes?.FACILITYID || 'Unknown',
            diameter_in: line.diameter_in || line.attributes?.DIAMETER || null,
            material: line.material || line.attributes?.MATERIAL || 'Unknown',
            install_year: line.install_year || line.attributes?.INSTALL_YEAR || null,
            condition: line.condition || line.attributes?.CONDITION || 'Unknown',
            status: line.status || line.attributes?.STATUS || 'Active',
            distance_ft: line.distance_ft || null,
          },
        }));

      // Add GeoJSON source
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
      });

      // Add water line polyline layer with blue styling
      map.current.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#3B82F6',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12, 2,
            16, 4,
          ],
          'line-opacity': 0.8,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
          visibility: layerVisibility.waterLines ? 'visible' : 'none',
        },
      });

      // Add hover popup with facility details
      map.current.on('click', layerId, (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const props = e.features[0].properties;
        const diameterDisplay = props.diameter_in 
          ? `${props.diameter_in}" diameter` 
          : 'Unknown diameter';
        const conditionColor = 
          props.condition === 'Active' ? '#10B981' :
          props.condition === 'Planned' ? '#F59E0B' :
          props.condition === 'Abandoned' ? '#EF4444' : '#6B7280';
        
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="padding: 12px; font-family: 'IBM Plex Sans', sans-serif; min-width: 220px;">
              <div style="font-weight: 600; font-size: 14px; color: #3B82F6; margin-bottom: 6px;">
                Water Line
              </div>
              <div style="font-size: 12px; line-height: 1.6; color: #374151;">
                <div style="margin-bottom: 4px;">
                  <strong>Facility ID:</strong> ${props.facility_id}
                </div>
                <div style="margin-bottom: 4px;">
                  <strong>Diameter:</strong> ${diameterDisplay}
                </div>
                <div style="margin-bottom: 4px;">
                  <strong>Material:</strong> ${props.material}
                </div>
                <div style="margin-bottom: 4px;">
                  <strong>Condition:</strong> 
                  <span style="color: ${conditionColor}; font-weight: 600;">
                    ${props.condition}
                  </span>
                </div>
                ${props.install_year ? `
                  <div style="margin-bottom: 4px;">
                    <strong>Installed:</strong> ${props.install_year}
                  </div>
                ` : ''}
                ${props.distance_ft ? `
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #6B7280;">
                    ${props.distance_ft.toFixed(0)} ft from parcel
                  </div>
                ` : ''}
              </div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB; font-size: 10px; color: #9CA3AF;">
                Source: City of Houston Public Works
              </div>
            </div>
          `)
          .addTo(map.current!);
      });

      // Cursor changes on hover
      map.current.on('mouseenter', layerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', layerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });

      console.log(`💧 Water lines rendered: ${features.length} segments`);
    } catch (error) {
      console.error('Failed to add water lines layer:', error);
    }
  }, [waterLines, mapLoaded, layerVisibility.waterLines]);

  // Update water lines visibility when toggled
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const visibility = layerVisibility.waterLines ? 'visible' : 'none';
    if (map.current.getLayer('water-lines-layer')) {
      map.current.setLayoutProperty('water-lines-layer', 'visibility', visibility);
    }
  }, [layerVisibility.waterLines, mapLoaded]);

  // Add sewer lines layer
  useEffect(() => {
    if (!map.current || !mapLoaded || sewerLines.length === 0) return;

    const sourceId = 'sewer-lines-source';
    const layerId = 'sewer-lines-layer';

    try {
      // Remove existing layers if present
      if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
      if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);

      // Transform sewer lines data to GeoJSON features
      const features = sewerLines
        .filter(line => line.geometry && line.geometry.coordinates)
        .map((line, idx) => ({
          type: 'Feature' as const,
          id: idx,
          geometry: line.geometry,
          properties: {
            facility_id: line.facility_id || line.attributes?.FACILITYID || 'Unknown',
            diameter_in: line.diameter_in || line.attributes?.DIAMETER || null,
            material: line.material || line.attributes?.MATERIAL || 'Unknown',
            install_year: line.install_year || line.attributes?.INSTALL_YEAR || null,
            condition: line.condition || line.attributes?.CONDITION || 'Unknown',
            status: line.status || line.attributes?.STATUS || 'Active',
            distance_ft: line.distance_ft || null,
          },
        }));

      // Add GeoJSON source
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features,
        },
      });

      // Add sewer line polyline layer with green styling
      map.current.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#10B981',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12, 2,
            16, 4,
          ],
          'line-opacity': 0.8,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
          visibility: layerVisibility.sewerLines ? 'visible' : 'none',
        },
      });

      // Add hover popup with facility details
      map.current.on('click', layerId, (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const props = e.features[0].properties;
        const diameterDisplay = props.diameter_in 
          ? `${props.diameter_in}" diameter` 
          : 'Unknown diameter';
        const conditionColor = 
          props.condition === 'Active' ? '#10B981' :
          props.condition === 'Planned' ? '#F59E0B' :
          props.condition === 'Abandoned' ? '#EF4444' : '#6B7280';
        
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="padding: 12px; font-family: 'IBM Plex Sans', sans-serif; min-width: 220px;">
              <div style="font-weight: 600; font-size: 14px; color: #10B981; margin-bottom: 6px;">
                Sewer Line
              </div>
              <div style="font-size: 12px; line-height: 1.6; color: #374151;">
                <div style="margin-bottom: 4px;">
                  <strong>Facility ID:</strong> ${props.facility_id}
                </div>
                <div style="margin-bottom: 4px;">
                  <strong>Diameter:</strong> ${diameterDisplay}
                </div>
                <div style="margin-bottom: 4px;">
                  <strong>Material:</strong> ${props.material}
                </div>
                <div style="margin-bottom: 4px;">
                  <strong>Condition:</strong> 
                  <span style="color: ${conditionColor}; font-weight: 600;">
                    ${props.condition}
                  </span>
                </div>
                ${props.install_year ? `
                  <div style="margin-bottom: 4px;">
                    <strong>Installed:</strong> ${props.install_year}
                  </div>
                ` : ''}
                ${props.distance_ft ? `
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #6B7280;">
                    ${props.distance_ft.toFixed(0)} ft from parcel
                  </div>
                ` : ''}
              </div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB; font-size: 10px; color: #9CA3AF;">
                Source: City of Houston Public Works
              </div>
            </div>
          `)
          .addTo(map.current!);
      });

      // Cursor changes on hover
      map.current.on('mouseenter', layerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', layerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });

      console.log(`🟢 Sewer lines rendered: ${features.length} segments`);
    } catch (error) {
      console.error('Failed to add sewer lines layer:', error);
    }
  }, [sewerLines, mapLoaded, layerVisibility.sewerLines]);

  // Update sewer lines visibility when toggled
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const visibility = layerVisibility.sewerLines ? 'visible' : 'none';
    if (map.current.getLayer('sewer-lines-layer')) {
      map.current.setLayoutProperty('sewer-lines-layer', 'visibility', visibility);
    }
  }, [layerVisibility.sewerLines, mapLoaded]);

  // Add traffic layer
  useEffect(() => {
    if (!map.current || !mapLoaded || traffic.length === 0) return;

    const sourceId = 'traffic-source';
    const layerId = 'traffic-layer';

    try {
      // Remove existing
      if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
      if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);

      // Add source
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: traffic.map((seg, idx) => ({
            type: 'Feature',
            id: idx,
            geometry: seg.geometry,
            properties: { aadt: seg.properties?.aadt || 0 },
          })),
        },
      });

      // Add layer with AADT-based styling and click handlers
      map.current.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': [
            'interpolate',
            ['linear'],
            ['get', 'aadt'],
            0, '#06B6D4',      // Low traffic - Data Cyan (brand aligned)
            50000, '#F59E0B',  // Medium - Warning Orange
            100000, '#EF4444'  // High - Error Red
          ],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 2,
            15, 6
          ],
          'line-opacity': 0.8,
        },
        layout: {
          visibility: layerVisibility.traffic ? 'visible' : 'none',
        },
      });

      // Add click handler for traffic info
      map.current.on('click', layerId, (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const props = e.features[0].properties;
        const segment = traffic.find(t => t.properties.aadt === props.aadt);
        
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="padding: 32px; font-family: 'IBM Plex Sans', sans-serif;">
              <strong>${segment?.properties.roadway || 'Road Segment'}</strong><br>
              AADT: ${props.aadt?.toLocaleString() || 'Unknown'} vehicles/day<br>
              ${segment?.properties.year ? `Year: ${segment.properties.year}` : ''}
            </div>
          `)
          .addTo(map.current!);
      });

      // Cursor changes
      map.current.on('mouseenter', layerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', layerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    } catch (error) {
      console.error('Failed to add traffic layer:', error);
    }
  }, [traffic, mapLoaded, layerVisibility.traffic]);

  // Update traffic visibility
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const visibility = layerVisibility.traffic ? 'visible' : 'none';
    if (map.current.getLayer('traffic-layer')) {
      map.current.setLayoutProperty('traffic-layer', 'visibility', visibility);
    }
  }, [layerVisibility.traffic, mapLoaded]);

  // Add employment centers layer
  useEffect(() => {
    if (!map.current || !mapLoaded || employmentCenters.length === 0) return;

    const sourceId = 'employment-source';
    const layerId = 'employment-layer';

    try {
      // Remove existing
      if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
      if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);

      // Add source
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: employmentCenters.map((center, idx) => ({
            type: 'Feature',
            id: idx,
            geometry: {
              type: 'Point',
              coordinates: toMapLibre(center.coordinates),
            },
            properties: {
              name: center.name,
              jobs: center.jobs,
              distance: center.distance_miles,
            },
          })),
        },
        cluster: employmentCenters.length > 10,
        clusterRadius: 50,
        clusterMaxZoom: 14,
      });

      // Add layer
      map.current.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#FF7A00',
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
        layout: {
          visibility: layerVisibility.employment ? 'visible' : 'none',
        },
      });

      // Add cluster layer
      if (employmentCenters.length > 10) {
        map.current.addLayer({
          id: `${layerId}-clusters`,
          type: 'circle',
          source: sourceId,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#FF7A00',
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              15, 5,
              20, 10,
              25,
            ],
          },
          layout: {
            visibility: layerVisibility.employment ? 'visible' : 'none',
          },
        });

        map.current.addLayer({
          id: `${layerId}-count`,
          type: 'symbol',
          source: sourceId,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-size': 12,
            visibility: layerVisibility.employment ? 'visible' : 'none',
          },
          paint: {
            'text-color': '#fff',
          },
        });
      }

      // Add popups on click
      map.current.on('click', layerId, (e) => {
        if (!e.features?.[0]) return;
        
        const feature = e.features[0];
        const props = feature.properties;
        
        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="padding: 32px; font-family: 'IBM Plex Sans', sans-serif;">
              <strong>${props.name}</strong><br>
              Jobs: ${props.jobs?.toLocaleString()}<br>
              Distance: ${props.distance?.toFixed(1)} mi
            </div>
          `)
          .addTo(map.current!);
      });

      // Change cursor on hover
      map.current.on('mouseenter', layerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', layerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    } catch (error) {
      console.error('Failed to add employment centers layer:', error);
    }
  }, [employmentCenters, mapLoaded, layerVisibility.employment]);

  // Update employment visibility
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const visibility = layerVisibility.employment ? 'visible' : 'none';
    if (map.current.getLayer('employment-layer')) {
      map.current.setLayoutProperty('employment-layer', 'visibility', visibility);
    }
    if (map.current.getLayer('employment-layer-clusters')) {
      map.current.setLayoutProperty('employment-layer-clusters', 'visibility', visibility);
    }
    if (map.current.getLayer('employment-layer-count')) {
      map.current.setLayoutProperty('employment-layer-count', 'visibility', visibility);
    }
  }, [layerVisibility.employment, mapLoaded]);

  // Initialize drawing plugin
  useEffect(() => {
    if (!map.current || !mapLoaded || draw.current) return;

    try {
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        styles: [
          // Polygon fill
          {
            id: 'gl-draw-polygon-fill',
            type: 'fill',
            filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            paint: {
              'fill-color': '#FF7A00',
              'fill-opacity': 0.3,
            },
          },
          // Polygon outline
          {
            id: 'gl-draw-polygon-stroke-active',
            type: 'line',
            filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            paint: {
              'line-color': '#FF7A00',
              'line-width': 2.5,
            },
          },
          // Vertex points
          {
            id: 'gl-draw-polygon-and-line-vertex-active',
            type: 'circle',
            filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
            paint: {
              'circle-radius': 5,
              'circle-color': '#FF7A00',
            },
          },
        ],
      });

      map.current.addControl(draw.current);
    } catch (error) {
      console.error('Failed to initialize drawing plugin:', error);
    }
  }, [mapLoaded]);

  // Handle drawing mode toggle
  useEffect(() => {
    if (!draw.current) return;

    if (drawingEnabled) {
      draw.current.changeMode('draw_polygon');
    } else {
      draw.current.changeMode('simple_select');
      draw.current.deleteAll();
    }
  }, [drawingEnabled]);

  // Handle polygon completion
  useEffect(() => {
    if (!map.current || !draw.current) return;

    const handleCreate = (e: any) => {
      const features = e.features;
      if (features.length > 0 && onParcelDrawn) {
        const geometry = features[0].geometry;
        onParcelDrawn(geometry);
      }
    };

    map.current.on('draw.create', handleCreate);
    return () => {
      if (map.current) {
        map.current.off('draw.create', handleCreate);
      }
    };
  }, [onParcelDrawn]);

  // Add drawn parcels layer
  useEffect(() => {
    if (!map.current || !mapLoaded || drawnParcels.length === 0) return;

    const sourceId = 'drawn-parcels-source';
    const fillLayerId = 'drawn-parcels-fill';
    const lineLayerId = 'drawn-parcels-line';

    try {
      // Remove existing layers/source
      if (map.current.getLayer(fillLayerId)) map.current.removeLayer(fillLayerId);
      if (map.current.getLayer(lineLayerId)) map.current.removeLayer(lineLayerId);
      if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);

      // Add source
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: drawnParcels.map(p => ({
            type: 'Feature',
            geometry: p.geometry,
            properties: {
              id: p.id,
              name: p.name,
              acreage: p.acreage_calc,
            },
          })),
        },
      });

      // Add fill layer - Feasibility Orange at 30% opacity
      map.current.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#FF7A00',
          'fill-opacity': 0.3,
        },
        layout: {
          visibility: layerVisibility.drawnParcels ? 'visible' : 'none',
        },
      });

      // Add line layer - 2.5px solid border
      map.current.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#FF7A00',
          'line-width': 2.5,
        },
        layout: {
          visibility: layerVisibility.drawnParcels ? 'visible' : 'none',
        },
      });

      // Add click handler for popups with edit/delete actions
      map.current.on('click', fillLayerId, (e: any) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const props = feature.properties;
        
        // Notify parent component of selection
        if (onParcelSelected) {
          const parcel = drawnParcels.find(p => p.id === props.id);
          if (parcel) onParcelSelected(parcel);
        }
        
        new maplibregl.Popup({ closeButton: true, closeOnClick: true })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="padding: 32px; font-family: 'IBM Plex Sans', sans-serif; font-size: 13px; min-width: 180px;">
              <div style="font-weight: 600; margin-bottom: 4px; color: #FF7A00;">${props.name || 'Drawn Parcel'}</div>
              <div style="margin-bottom: 8px; font-size: 18px; font-weight: bold; color: #FF7A00;">
                ${props.acreage?.toFixed(2) || 'N/A'} acres
              </div>
              <div id="parcel-actions-${props.id}" style="display: flex; gap: 8px; margin-top: 8px;">
                <button 
                  id="edit-parcel-${props.id}"
                  style="flex: 1; padding: 6px 12px; background: hsl(var(--primary)); color: white; border: none; border-radius: 12px; cursor: pointer; font-size: 12px; font-weight: 500;"
                >
                  Edit
                </button>
              </div>
            </div>
          `)
          .addTo(map.current!);
        
        // Add event listeners after popup is added to DOM
        setTimeout(() => {
          const editBtn = document.getElementById(`edit-parcel-${props.id}`);
          if (editBtn) {
            editBtn.onclick = () => {
              const parcel = drawnParcels.find(p => p.id === props.id);
              if (parcel && onParcelSelected) {
                onParcelSelected(parcel);
              }
            };
          }
        }, 50);
      });

      // Highlight selected parcel
      if (selectedParcelId) {
        map.current.setPaintProperty('drawn-parcels-fill', 'fill-opacity', [
          'case',
          ['==', ['get', 'id'], selectedParcelId],
          0.5, // Selected parcel
          0.3  // Normal parcels
        ]);
        map.current.setPaintProperty('drawn-parcels-line', 'line-width', [
          'case',
          ['==', ['get', 'id'], selectedParcelId],
          3,   // Selected parcel
          2.5  // Normal parcels
        ]);
      } else {
        // Reset to default
        if (map.current.getLayer('drawn-parcels-fill')) {
          map.current.setPaintProperty('drawn-parcels-fill', 'fill-opacity', 0.3);
        }
        if (map.current.getLayer('drawn-parcels-line')) {
          map.current.setPaintProperty('drawn-parcels-line', 'line-width', 2.5);
        }
      }

      // Change cursor on hover
      map.current.on('mouseenter', fillLayerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', fillLayerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    } catch (error) {
      console.error('Failed to add drawn parcels layer:', error);
    }
  }, [drawnParcels, mapLoaded, layerVisibility.drawnParcels, selectedParcelId, onParcelSelected]);

  // Update drawn parcels visibility
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const visibility = layerVisibility.drawnParcels ? 'visible' : 'none';
    if (map.current.getLayer('drawn-parcels-fill')) {
      map.current.setLayoutProperty('drawn-parcels-fill', 'visibility', visibility);
    }
    if (map.current.getLayer('drawn-parcels-line')) {
      map.current.setLayoutProperty('drawn-parcels-line', 'visibility', visibility);
    }
  }, [layerVisibility.drawnParcels, mapLoaded]);

  // DATA MOAT: All parcel display now uses internal vector tiles from tiles.siteintel.ai
  // No external API calls to city GIS endpoints - all data served from SiteIntel infrastructure
  // Parcel details are fetched from canonical_parcels table via query-canonical-parcel edge function

  // DATA MOAT: Vector Tile Parcel Display (replaces external API calls)
  // Parcels are now displayed via internal vector tiles from useVectorTileLayers hook
  // Click handlers fetch full details from canonical_parcels via query-canonical-parcel
  // FALLBACK: If tiles unavailable, clicks query canonical_parcels by coordinates
  useEffect(() => {
    if (!map.current || !mapLoaded || !showParcels) return;

    const sourceId = 'siteintel-parcels';
    const fillLayerId = 'siteintel-parcels-fill';

    console.log('[MapLibreCanvas] Setting up parcel click handlers', {
      hasOnParcelSelect: !!onParcelSelectRef.current,
    });

    // Helper to query parcel by coordinates (used as fallback) - uses ref to avoid stale closure
    const queryParcelByCoordinates = async (lng: number, lat: number) => {
      console.log('🔍 Querying canonical parcel by coordinates:', { lat, lng, hasCallback: !!onParcelSelectRef.current });
      
      try {
        const { data, error } = await supabase.functions.invoke('query-canonical-parcel', {
          body: { lat, lng }
        });
        
        if (error) throw error;
        
        if (data?.parcel) {
          console.log('✅ Found parcel via coordinate query:', data.parcel.source_parcel_id);
          // Create a GeoJSON-like feature for the popup
          const feature = {
            type: 'Feature',
            properties: {
              parcel_id: data.parcel.source_parcel_id,
              owner_name: data.parcel.owner_name,
              situs_address: data.parcel.situs_address,
              acreage: data.parcel.acreage,
              land_use_code: data.parcel.land_use_code,
              land_use_desc: data.parcel.land_use_desc,
              jurisdiction: data.parcel.jurisdiction,
              source: `SiteIntel (${data.parcel.dataset_version})`,
              dataset_version: data.parcel.dataset_version,
              source_agency: data.parcel.source_agency,
              city: data.parcel.city,
              state: data.parcel.state,
              zip: data.parcel.zip,
            },
            geometry: null // Geometry not needed for popup display
          };
          if (onParcelSelectRef.current) {
            onParcelSelectRef.current(feature as any);
          } else {
            console.warn('[MapLibreCanvas] No onParcelSelect callback available');
          }
          return true;
        } else {
          console.log('ℹ️ No parcel found at these coordinates');
          return false;
        }
      } catch (err) {
        console.warn('⚠️ Coordinate-based parcel lookup failed:', err);
        return false;
      }
    };

    // Check if vector tile source exists (from useVectorTileLayers)
    const hasVectorSource = map.current.getSource(sourceId);
    const hasVectorLayer = map.current.getLayer(fillLayerId);
    
    if (hasVectorSource && hasVectorLayer) {
      console.log('✅ Using SiteIntel vector tiles for parcels (data moat enforced)');
      setParcelLoading(false);
      setParcelLoadError(null);
      
      // Click handler for vector tile parcels - uses ref to avoid stale closure
      const handleParcelClick = async (e: maplibregl.MapLayerMouseEvent) => {
        console.log('[MapLibreCanvas] handleParcelClick fired', {
          hasFeatures: !!e.features?.length,
          hasCallback: !!onParcelSelectRef.current,
        });
        
        if (!e.features || e.features.length === 0) {
          // No features at click - try coordinate query as fallback
          await queryParcelByCoordinates(e.lngLat.lng, e.lngLat.lat);
          return;
        }
        
        const feature = e.features[0];
        const props = feature.properties || {};
        console.log('[MapLibreCanvas] Clicked parcel properties:', props);
        
        // Extract parcel ID from tile properties
        const parcelId = props.source_parcel_id || props.parcel_id || props.apn || props.id;
        
        if (parcelId && onParcelSelectRef.current) {
          console.log('🔍 Fetching canonical parcel details for:', parcelId);
          
          try {
            // Fetch full details from canonical_parcels
            const { data, error } = await supabase.functions.invoke('query-canonical-parcel', {
              body: { source_parcel_id: parcelId }
            });
            
            if (error) throw error;
            
            if (data?.parcel) {
              // Enrich the feature with canonical data
              const enrichedFeature = {
                ...feature,
                properties: {
                  ...props,
                  parcel_id: data.parcel.source_parcel_id,
                  owner_name: data.parcel.owner_name,
                  situs_address: data.parcel.situs_address,
                  acreage: data.parcel.acreage,
                  land_use_code: data.parcel.land_use_code,
                  land_use_desc: data.parcel.land_use_desc,
                  jurisdiction: data.parcel.jurisdiction,
                  source: `SiteIntel (${data.parcel.dataset_version})`,
                  dataset_version: data.parcel.dataset_version,
                  source_agency: data.parcel.source_agency,
                }
              };
              onParcelSelectRef.current(enrichedFeature);
            } else {
              // Use tile properties if canonical lookup fails
              onParcelSelectRef.current(feature);
            }
          } catch (err) {
            console.warn('⚠️ Canonical parcel lookup failed, using tile data:', err);
            if (onParcelSelectRef.current) {
              onParcelSelectRef.current(feature);
            }
          }
        } else if (onParcelSelectRef.current) {
          // No parcel ID in tile - fallback to coordinate query
          const found = await queryParcelByCoordinates(e.lngLat.lng, e.lngLat.lat);
          if (!found && onParcelSelectRef.current) {
            // Last resort: use tile properties
            onParcelSelectRef.current(feature);
          }
        } else {
          console.warn('[MapLibreCanvas] No onParcelSelect callback in handleParcelClick');
        }
      };
      
      map.current.on('click', fillLayerId, handleParcelClick);
      console.log('[MapLibreCanvas] Registered click handler on', fillLayerId);
      
      // Cursor handlers
      map.current.on('mouseenter', fillLayerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', fillLayerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
      
      return () => {
        map.current?.off('click', fillLayerId, handleParcelClick);
      };
    }

    // FALLBACK: No vector tiles available - set up direct map click handler
    // This allows parcel lookup by coordinates even when tiles fail (403, etc.)
    console.log('⏳ Vector tiles not available, enabling coordinate-based parcel lookup');
    setParcelLoading(false);
    
    const handleMapClick = async (e: maplibregl.MapMouseEvent) => {
      // Only handle clicks when zoom > 14 (parcel-level)
      if (!map.current || map.current.getZoom() < 14) return;
      
      // Check if click was on a vector tile parcel layer (if it exists later)
      if (map.current.getLayer(fillLayerId)) {
        const features = map.current.queryRenderedFeatures(e.point, { layers: [fillLayerId] });
        if (features && features.length > 0) {
          // Vector layer handled elsewhere
          return;
        }
      }
      
      // Query by coordinates
      await queryParcelByCoordinates(e.lngLat.lng, e.lngLat.lat);
    };
    
    map.current.on('click', handleMapClick);
    console.log('[MapLibreCanvas] Registered fallback map click handler');
    
    // Also show pointer cursor at zoom > 14 to indicate clickability
    const updateCursor = () => {
      if (map.current) {
        if (map.current.getZoom() >= 14) {
          map.current.getCanvas().style.cursor = 'crosshair';
        } else {
          map.current.getCanvas().style.cursor = '';
        }
      }
    };
    
    map.current.on('zoom', updateCursor);
    updateCursor();
    
    return () => {
      map.current?.off('click', handleMapClick);
      map.current?.off('zoom', updateCursor);
      if (map.current) map.current.getCanvas().style.cursor = '';
    };
  }, [mapLoaded, showParcels]); // onParcelSelect removed - using ref instead

  // Update 3D buildings visibility based on 3D mode
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const visibility = is3DMode ? 'visible' : 'none';
    if (map.current.getLayer('3d-buildings')) {
      map.current.setLayoutProperty('3d-buildings', 'visibility', visibility);
    }
  }, [is3DMode, mapLoaded]);

  return (
    <div className={`relative h-full w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      <div
        ref={mapContainer}
        className={`${isFullscreen ? 'h-screen w-screen' : (className || 'h-full w-full')} rounded-lg overflow-hidden ${drawingEnabled ? 'ring-4 ring-primary/50 animate-pulse' : ''}`}
        role="img"
        aria-label={getMapDescription()}
        tabIndex={0}
        style={{ minHeight: '300px' }}
      />

      {/* Parcel Loading/Error Overlay */}
      {showParcels && (parcelLoading || parcelLoadError || (mapLoaded && map.current && map.current.getZoom() < 14)) && (
        <div className="absolute bottom-4 left-4 z-20 max-w-xs">
          {parcelLoading && !parcelLoadError && (
            <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading parcels...</p>
            </div>
          )}
          {parcelLoadError && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 rounded-lg p-3 shadow-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                {parcelLoadError}
              </p>
              <Button 
                size="sm" 
                variant="outline"
                className="text-amber-700 border-amber-400 hover:bg-amber-100"
                onClick={() => retryParcelLoad.current?.()}
                disabled={parcelLoading}
              >
                {parcelLoading ? 'Retrying...' : 'Retry'}
              </Button>
            </div>
          )}
          {!parcelLoading && !parcelLoadError && mapLoaded && map.current && map.current.getZoom() < 14 && (
            <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
              <p className="text-sm text-muted-foreground">
                Zoom in to see parcel boundaries (current: {Math.round(map.current.getZoom())}, need: 14+)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Data Source Status Badge */}
      {(hasVectorTiles && activeVectorSources.length > 0) || isFallbackMode || fallbackFeatureCount > 0 ? (
        <div className={`absolute bottom-4 right-4 z-10 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg flex items-center gap-2 ${
          isFallbackMode 
            ? 'bg-amber-500/10 border-amber-500/30' 
            : 'bg-background/95 border-border'
        }`}>
          {isFallbackMode ? (
            <>
              <CloudOff className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                External Parcels
              </span>
              {fallbackMetadata?.source === 'mixed' && (
                <span className="text-xs text-muted-foreground">
                  ({fallbackMetadata.canonical_count} SiteIntel + {fallbackMetadata.external_count} External)
                </span>
              )}
            </>
          ) : fallbackFeatureCount > 0 && !hasVectorTiles ? (
            <>
              <Cloud className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">
                SiteIntel Parcels ({fallbackFeatureCount})
              </span>
            </>
          ) : (
            <>
              <Database className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">
                SiteIntel Tiles ({activeVectorSources.length} layers)
              </span>
            </>
          )}
        </div>
      ) : null}

      {/* Map Legend */}
      <MapLegend
        hasFloodZones={floodZones.length > 0 || hasVectorTileSource(vectorTileSources, 'flood')}
        hasTraffic={traffic.length > 0 || hasVectorTileSource(vectorTileSources, 'transportation')}
        hasEmployment={employmentCenters.length > 0}
        hasHcadParcels={hcadParcels.length > 0 || hasVectorTileSource(vectorTileSources, 'parcels')}
        hasWaterLines={waterLines.length > 0}
        hasSewerLines={sewerLines.length > 0}
        hasStormLines={stormLines.length > 0}
        hasStormManholes={stormManholes.length > 0}
        hasForceMain={forceMain.length > 0}
        hasZoningDistricts={zoningDistricts.length > 0 || hasVectorTileSource(vectorTileSources, 'zoning')}
      />

      {/* Top-right controls */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <Button
          onClick={toggleBasemap}
          size="sm"
          variant="secondary"
          className="shadow-lg bg-background hover:bg-muted min-w-[100px]"
          title={`Current: ${basemapStyle}. Click to change.`}
        >
          <Map className="h-4 w-4 mr-2" />
          {basemapStyle === 'streets' && 'Streets'}
          {basemapStyle === 'satellite' && 'Satellite'}
          {basemapStyle === 'hybrid' && 'Hybrid'}
        </Button>
        <Button
          onClick={() => {
            if (!map.current) return;
            setIs3DMode(!is3DMode);
            if (!is3DMode) {
              map.current.easeTo({ pitch: 60, bearing: -17.6, duration: 1000 });
            } else {
              map.current.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
            }
          }}
          size="sm"
          variant={is3DMode ? "default" : "secondary"}
          className="shadow-lg"
          title={is3DMode ? "2D View" : "3D View"}
        >
          {is3DMode ? <Map className="h-4 w-4" /> : <Box className="h-4 w-4" />}
        </Button>
        <Button
          onClick={exportMapAsPNG}
          size="sm"
          variant="secondary"
          className="shadow-lg"
          title="Export map as PNG"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          onClick={toggleFullscreen}
          size="sm"
          variant="secondary"
          className="shadow-lg"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Layer Toggle Controls - Desktop Only */}
      <div className="hidden lg:block absolute top-2 right-14 z-10 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-2 space-y-1 text-sm">
        {parcel && (
          <button
            onClick={() => toggleLayer('parcel')}
            className="flex items-center gap-2 w-full px-2 py-1 rounded hover:bg-muted transition-colors"
            aria-label={`${layerVisibility.parcel ? 'Hide' : 'Show'} parcel boundary`}
          >
            {layerVisibility.parcel ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 opacity-50" />}
            <span className={layerVisibility.parcel ? '' : 'opacity-50'}>Parcel</span>
            <div className="ml-auto w-3 h-3 rounded-full" style={{ backgroundColor: '#FF7A00' }} />
          </button>
        )}
        {floodZones.length > 0 && (
          <button
            onClick={() => toggleLayer('flood')}
            className="flex items-center gap-2 w-full px-2 py-1 rounded hover:bg-muted transition-colors"
            aria-label={`${layerVisibility.flood ? 'Hide' : 'Show'} flood zones`}
          >
            {layerVisibility.flood ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 opacity-50" />}
            <span className={layerVisibility.flood ? '' : 'opacity-50'}>Flood</span>
            <div className="ml-auto w-3 h-3 rounded-full bg-red-500/30 border border-red-500" />
          </button>
        )}
        {utilities.length > 0 && (
          <button
            onClick={() => toggleLayer('utilities')}
            className="flex items-center gap-2 w-full px-2 py-1 rounded hover:bg-muted transition-colors"
            aria-label={`${layerVisibility.utilities ? 'Hide' : 'Show'} utilities`}
          >
            {layerVisibility.utilities ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 opacity-50" />}
            <span className={layerVisibility.utilities ? '' : 'opacity-50'}>Utilities</span>
            <div className="ml-auto w-3 h-3 rounded-full bg-cyan-500" />
          </button>
        )}
        {traffic.length > 0 && (
          <button
            onClick={() => toggleLayer('traffic')}
            className="flex items-center gap-2 w-full px-2 py-1 rounded hover:bg-muted transition-colors"
            aria-label={`${layerVisibility.traffic ? 'Hide' : 'Show'} traffic`}
          >
            {layerVisibility.traffic ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 opacity-50" />}
            <span className={layerVisibility.traffic ? '' : 'opacity-50'}>Traffic</span>
            <div className="ml-auto w-3 h-3 rounded-full bg-yellow-500" />
          </button>
        )}
        {employmentCenters.length > 0 && (
          <button
            onClick={() => toggleLayer('employment')}
            className="flex items-center gap-2 w-full px-2 py-1 rounded hover:bg-muted transition-colors"
            aria-label={`${layerVisibility.employment ? 'Hide' : 'Show'} employment centers`}
          >
            {layerVisibility.employment ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 opacity-50" />}
            <span className={layerVisibility.employment ? '' : 'opacity-50'}>Jobs</span>
            <div className="ml-auto w-3 h-3 rounded-full" style={{ backgroundColor: '#FF7A00' }} />
          </button>
        )}
        {drawnParcels.length > 0 && (
          <button
            onClick={() => toggleLayer('drawnParcels')}
            className="flex items-center gap-2 w-full px-2 py-1 rounded hover:bg-muted transition-colors"
            aria-label={`${layerVisibility.drawnParcels ? 'Hide' : 'Show'} my parcels`}
          >
            {layerVisibility.drawnParcels ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 opacity-50" />}
            <span className={layerVisibility.drawnParcels ? '' : 'opacity-50'}>My Parcels</span>
            <div className="ml-auto w-3 h-3 rounded-full" style={{ backgroundColor: '#FF7A00', opacity: 0.6 }} />
          </button>
        )}
      </div>

      {/* Mobile FAB - Layer Controls */}
      <MapLayerFAB
        layerVisibility={layerVisibility}
        onToggleLayer={toggleLayer}
        hasFlood={floodZones.length > 0}
        hasUtilities={utilities.length > 0}
        hasTraffic={traffic.length > 0}
        hasEmployment={employmentCenters.length > 0}
        hasDrawnParcels={drawnParcels.length > 0}
        hasHcadParcels={hcadParcels.length > 0}
        hasWaterLines={waterLines.length > 0}
        hasSewerLines={sewerLines.length > 0}
        hasStormLines={stormLines.length > 0}
        hasStormManholes={stormManholes.length > 0}
        hasForceMain={forceMain.length > 0}
        hasFloodZones={floodZones.length > 0}
        hasZoningDistricts={zoningDistricts.length > 0}
        hasTopography={true}
      />
      
      {/* Measurement Results Panel */}
      {measurementResult && (
        <div className="absolute bottom-20 left-4 z-20 bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl p-4 min-w-[250px] border border-primary/20 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Ruler className="h-4 w-4 text-primary" />
              Measurement Result
            </h4>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setMeasurementResult(null);
                setMeasurementPoints([]);
                handleMeasurementToolChange(null);
              }}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {activeMeasurementTool === 'distance' && measurementResult.miles && (
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-xs text-blue-600 font-medium mb-1">Distance</div>
                <div className="text-2xl font-bold text-blue-900">
                  {measurementResult.miles.toFixed(2)} mi
                </div>
                <div className="text-xs text-blue-600">
                  {measurementResult.feet.toLocaleString()} ft
                </div>
              </div>
            )}
            
            {activeMeasurementTool === 'area' && measurementResult.acres && (
              <div className="bg-green-50 p-3 rounded">
                <div className="text-xs text-green-600 font-medium mb-1">Area</div>
                <div className="text-2xl font-bold text-green-900">
                  {measurementResult.acres.toFixed(2)} ac
                </div>
                <div className="text-xs text-green-600">
                  {measurementResult.sqft.toLocaleString()} sq ft
                </div>
              </div>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setMeasurementResult(null);
                setMeasurementPoints([]);
                handleMeasurementToolChange(null);
              }}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {activeMeasurementTool === 'distance' && measurementResult.miles && (
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-xs text-blue-600 font-medium mb-1">Distance</div>
                <div className="text-2xl font-bold text-blue-900">
                  {measurementResult.miles.toFixed(2)} mi
                </div>
                <div className="text-xs text-blue-600">
                  {measurementResult.feet.toLocaleString()} ft
                </div>
              </div>
            )}
            
            {activeMeasurementTool === 'area' && measurementResult.acres && (
              <div className="bg-green-50 p-3 rounded">
                <div className="text-xs text-green-600 font-medium mb-1">Area</div>
                <div className="text-2xl font-bold text-green-900">
                  {measurementResult.acres.toFixed(2)} ac
                </div>
                <div className="text-xs text-green-600">
                  {measurementResult.sqft.toLocaleString()} sq ft
                </div>
              </div>
            )}
            
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => {
                const text = activeMeasurementTool === 'distance'
                  ? `Distance: ${measurementResult.miles.toFixed(2)} mi (${measurementResult.feet.toLocaleString()} ft)`
                  : `Area: ${measurementResult.acres.toFixed(2)} ac (${measurementResult.sqft.toLocaleString()} sq ft)`;
                
                navigator.clipboard.writeText(text);
                toast.success('Copied to clipboard!');
              }}
            >
              <Copy className="h-3 w-3 mr-2" />
              Copy to Clipboard
            </Button>
          </div>
        </div>
      )}
      
      {/* Text alternative for screen readers */}
      <details className="sr-only">
        <summary>Map data description</summary>
        <div>
          <p>{getMapDescription()}</p>
          {parcel && <p>Parcel boundary is shown in orange.</p>}
          {floodZones.length > 0 && (
            <p>Flood zones: {floodZones.map((z, i) => `Zone ${z.properties?.zone || 'Unknown'} (${i + 1}/${floodZones.length})`).join(', ')}</p>
          )}
          {utilities.length > 0 && (
            <p>Utilities: {utilities.map((u, i) => `${u.properties?.type || 'Unknown'} (${i + 1}/${utilities.length})`).join(', ')}</p>
          )}
          {traffic.length > 0 && (
            <p>Traffic segments: {traffic.length} road segments with traffic data</p>
          )}
          {employmentCenters.length > 0 && (
            <p>Employment centers: {employmentCenters.map(e => `${e.name} (${e.jobs?.toLocaleString()} jobs, ${e.distance_miles?.toFixed(1)} mi away)`).join(', ')}</p>
          )}
        </div>
      </details>

      {/* Keyboard instructions */}
      <div className="sr-only" aria-live="polite">
        Use arrow keys to pan the map. Use plus and minus keys to zoom in and out. 
        Press Tab to focus on map markers, then Enter to view details.
      </div>
    </div>
  );
}
