# SiteIntel™ Map System Architecture

> Technical reference for the MapLibre-based geospatial visualization layer

**Version:** 2.0  
**Last Updated:** 2025-01-19  
**Maintainers:** Engineering Team

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Component Hierarchy](#2-component-hierarchy)
3. [Core Components Reference](#3-core-components-reference)
4. [Hook Architecture](#4-hook-architecture)
5. [Data Sources & Tile Serving](#5-data-sources--tile-serving)
6. [Layer Configuration](#6-layer-configuration)
7. [Preset System](#7-preset-system)
8. [State Management](#8-state-management)
9. [Performance Optimization](#9-performance-optimization)
10. [Error Handling & Fallbacks](#10-error-handling--fallbacks)
11. [Security Considerations](#11-security-considerations)

---

## 1. System Overview

### 1.1 Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Rendering Engine** | MapLibre GL JS | 4.7.1 | WebGL-based vector map rendering |
| **React Integration** | Custom hooks | - | State management & lifecycle |
| **Tile Format** | MVT (Mapbox Vector Tiles) | 2.1 | Efficient vector data delivery |
| **Geometry Processing** | Turf.js | 7.2.0 | Client-side spatial operations |
| **H3 Indexing** | h3-js | 4.4.0 | Hexagonal grid for market intel |

### 1.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           REACT APPLICATION                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │   DecisionMap   │    │  TradeAreaMap   │    │  MapLibreCanvas │     │
│  │   (Report View) │    │  (Market Intel) │    │  (Core Engine)  │     │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘     │
│           │                      │                      │               │
│           └──────────────────────┼──────────────────────┘               │
│                                  │                                       │
│  ┌───────────────────────────────┴───────────────────────────────────┐  │
│  │                         HOOK LAYER                                 │  │
│  ├───────────────┬───────────────┬───────────────┬──────────────────┤  │
│  │useVectorTile  │useCountyTile  │useFallback    │useMapPresets     │  │
│  │Layers         │Overlays       │Parcels        │                  │  │
│  └───────────────┴───────────────┴───────────────┴──────────────────┘  │
│                                  │                                       │
└──────────────────────────────────┼──────────────────────────────────────┘
                                   │
┌──────────────────────────────────┼──────────────────────────────────────┐
│                           DATA LAYER                                     │
├──────────────────────────────────┼──────────────────────────────────────┤
│                                  │                                       │
│  ┌─────────────┐  ┌─────────────┐│┌─────────────┐  ┌─────────────┐     │
│  │ CloudFront  │  │ County      │││ Supabase    │  │ OSM/Google  │     │
│  │ Vector Tiles│  │ ArcGIS      │││ PostGIS     │  │ Basemaps    │     │
│  └─────────────┘  └─────────────┘│└─────────────┘  └─────────────┘     │
│                                  │                                       │
└──────────────────────────────────┴──────────────────────────────────────┘
```

### 1.3 Data Flow

```
User Action (click/pan/zoom)
         │
         ▼
┌─────────────────────┐
│  MapLibre GL Event  │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐     ┌─────────────────────┐
│  React State Update │────▶│  Hook Processing    │
└─────────────────────┘     └─────────────────────┘
         │                           │
         ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐
│  Tile Request       │     │  Supabase Query     │
│  (if viewport moves)│     │  (if data needed)   │
└─────────────────────┘     └─────────────────────┘
         │                           │
         ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐
│  CDN/ArcGIS Response│     │  GeoJSON Response   │
└─────────────────────┘     └─────────────────────┘
         │                           │
         └───────────┬───────────────┘
                     ▼
         ┌─────────────────────┐
         │  Layer Render/Update│
         └─────────────────────┘
```

---

## 2. Component Hierarchy

### 2.1 Component Tree

```
App
├── ApplicationForm (Step 1: Property Selection)
│   └── PropertyStep
│       └── MapLibreCanvas
│           ├── useVectorTileLayers
│           ├── useFallbackParcels
│           └── useCountyTileOverlays
│
├── ReportLayout (Report View)
│   └── MapPage
│       └── DecisionMap
│           ├── PresetSelector
│           ├── MapLibreCanvas
│           │   └── [All hooks above]
│           └── MapLegend
│
└── MarketIntelligencePage
    └── TradeAreaMap
        ├── useH3Cells
        └── MapLibre instance (inline)
```

### 2.2 Component Responsibilities

| Component | Responsibility | State Owned |
|-----------|---------------|-------------|
| `MapLibreCanvas` | Core map rendering, event handling | Map instance, loading state |
| `DecisionMap` | Report-specific map with presets | Active preset, highlights |
| `TradeAreaMap` | H3 hexagon visualization | Cell data, metric selection |
| `PresetSelector` | Preset switching UI | None (controlled) |
| `MapLegend` | Dynamic legend based on visible layers | Collapsed state |
| `MapLayerFAB` | Mobile layer controls | Open/closed state |

---

## 3. Core Components Reference

### 3.1 MapLibreCanvas

**Location:** `src/components/map/MapLibreCanvas.tsx`

**Props Interface:**

```typescript
interface MapLibreCanvasProps {
  // Required
  center: [number, number];          // [lng, lat] - Initial center
  
  // Optional - Appearance
  zoom?: number;                     // Initial zoom level (default: 15)
  className?: string;                // Container CSS classes
  basemap?: 'osm' | 'satellite' | 'hybrid';  // Base layer style
  
  // Optional - Data Layers
  parcel?: GeoJSON.Feature;          // Subject parcel geometry
  floodZones?: GeoJSON.FeatureCollection;  // FEMA flood data
  utilities?: GeoJSON.FeatureCollection;   // Utility lines
  drawnParcels?: GeoJSON.FeatureCollection; // User-drawn parcels
  
  // Optional - Utility Lines (individual)
  waterLines?: Json;                 // Water infrastructure
  sewerLines?: Json;                 // Sewer infrastructure
  stormLines?: Json;                 // Stormwater infrastructure
  
  // Optional - Layer Control
  layerVisibility?: LayerVisibilityState;  // Per-layer visibility
  
  // Optional - Callbacks
  onParcelClick?: (feature: ParcelFeature) => void;
  onMapLoad?: (map: MapLibreMap) => void;
  onViewportChange?: (bounds: LngLatBounds) => void;
}
```

**Key Features:**

1. **Lazy Initialization:** Map instance created only when container is visible
2. **Automatic Cleanup:** Removes all sources/layers on unmount
3. **Gesture Handling:** Supports touch zoom, scroll zoom, drag pan
4. **Style Switching:** Runtime basemap changes without full reload

**Usage Example:**

```tsx
<MapLibreCanvas
  center={[-95.3698, 29.7604]}
  zoom={16}
  parcel={parcelGeometry}
  floodZones={floodData}
  layerVisibility={{
    parcels: true,
    flood: true,
    utilities: false
  }}
  onParcelClick={(feature) => {
    console.log('Selected:', feature.properties.parcel_id);
  }}
/>
```

### 3.2 DecisionMap

**Location:** `src/components/report/DecisionMap.tsx`

**Purpose:** Wraps `MapLibreCanvas` with preset-based layer control for feasibility reports.

**Key Features:**

1. **Preset Integration:** Uses `useMapPresets` for state management
2. **Kill Factor Sync:** Highlights map features when kill factors are clicked
3. **Bidirectional Linking:** Map clicks can scroll to relevant report sections
4. **Layer Count Display:** Shows active layer count in header

**Props Interface:**

```typescript
interface DecisionMapProps {
  center: [number, number];
  zoom?: number;
  parcel?: GeoJSON.Feature;
  floodZones?: GeoJSON.FeatureCollection;
  utilities?: GeoJSON.FeatureCollection;
  waterLines?: Json;
  sewerLines?: Json;
  stormLines?: Json;
  drawnParcels?: GeoJSON.FeatureCollection;
  killFactors?: KillFactor[];
  onKillFactorClick?: (factor: KillFactor) => void;
  onGeometryClick?: (geometryId: string, type: string) => void;
  propertyAddress?: string;
  className?: string;
}
```

### 3.3 TradeAreaMap

**Location:** `src/components/market-intelligence/TradeAreaMap.tsx`

**Purpose:** H3 hexagon visualization for market demographics.

**Key Features:**

1. **H3 Grid Rendering:** Uses h3-js for hexagon calculations
2. **Dynamic Coloring:** Gradient based on metric values
3. **Census Integration:** Overlays ACS demographic data
4. **Trade Area Circle:** Visual boundary indicator

---

## 4. Hook Architecture

### 4.1 useVectorTileLayers

**Location:** `src/hooks/useVectorTileLayers.ts`

**Purpose:** Manages vector tile sources from CloudFront CDN with automatic layer creation.

**Interface:**

```typescript
interface UseVectorTileLayersOptions {
  map: MapLibreMap | null;
  mapLoaded: boolean;
  jurisdiction?: string;
  layerVisibility?: LayerVisibilityState;
  styleVersion?: number;
  onParcelClick?: (feature: ParcelFeature) => void;
}

interface VectorTileLayerResult {
  sources: TileSourceConfig[];
  layers: LayerConfig[];
  isLoading: boolean;
  error: Error | null;
  hasVectorTiles: boolean;
  activeSources: string[];
  tileLoadFailed: boolean;
}
```

**Layer Configuration:**

```typescript
const VECTOR_TILE_LAYER_CONFIG = {
  parcels: {
    sourceId: 'siteintel-parcels',
    layers: [
      { id: 'siteintel-parcels-fill', type: 'fill', ... },
      { id: 'siteintel-parcels-line', type: 'line', ... }
    ]
  },
  flood: {
    sourceId: 'siteintel-flood',
    layers: [
      { id: 'siteintel-flood-zone-fill', type: 'fill', ... },
      { id: 'siteintel-floodway-fill', type: 'fill', ... }
    ]
  },
  utilities: {
    sourceId: 'siteintel-utilities',
    layers: [
      { id: 'siteintel-water-lines', type: 'line', paint: { 'line-color': '#1F6AE1' } },
      { id: 'siteintel-sewer-lines', type: 'line', paint: { 'line-color': '#7A4A2E' } },
      { id: 'siteintel-storm-lines', type: 'line', paint: { 'line-color': '#1C7C7C' } }
    ]
  },
  // ... transportation, zoning, wetlands
};
```

### 4.2 useCountyTileOverlays

**Location:** `src/hooks/useCountyTileOverlays.ts`

**Purpose:** Dynamically loads county-specific tile layers based on map viewport.

**Key Features:**

1. **Auto-Detection:** Determines county from viewport center
2. **Lazy Loading:** Only loads tiles when county enters view
3. **Multiple Counties:** Supports overlapping county views
4. **Opacity Control:** Adjustable per-county transparency

**Interface:**

```typescript
interface UseCountyTileOverlaysOptions {
  map: MapLibreMap | null;
  mapLoaded: boolean;
  enabled?: boolean;
  opacity?: number;
  autoDetect?: boolean;
  countyIds?: string[];
  onCountyLayerAdded?: (countyId: string) => void;
  onCountyLayerRemoved?: (countyId: string) => void;
}
```

### 4.3 useFallbackParcels

**Location:** `src/hooks/useFallbackParcels.ts`

**Purpose:** GeoJSON-based parcel loading when vector tiles are unavailable.

**Trigger Conditions:**

1. Vector tile server returns 403/404
2. Tile load timeout exceeds 5 seconds
3. User is outside tile coverage area

**Features:**

1. **Viewport-Based Fetching:** Only loads parcels in view
2. **Debounced Updates:** 300ms debounce on map move
3. **Source Differentiation:** Different colors for canonical vs external parcels
4. **Click Handling:** Same parcel selection behavior as tile version

### 4.4 useMapPresets

**Location:** `src/hooks/useMapPresets.ts`

**Purpose:** Manages preset-based layer visibility state.

**Interface:**

```typescript
interface UseMapPresetsOptions {
  initialPreset?: string;
  persistToStorage?: boolean;
}

interface UseMapPresetsReturn {
  activePresetId: string;
  setPreset: (presetId: string) => void;
  resetToDecisionMode: () => void;
  highlightedFeatures: HighlightedFeature[];
  highlightKillFactor: (killFactor: KillFactor) => void;
  clearHighlights: () => void;
  getLayerVisibility: () => LayerVisibilityState;
  isLayerEnabled: (layerId: string) => boolean;
}
```

---

## 5. Data Sources & Tile Serving

### 5.1 CloudFront CDN (Primary)

**Endpoint:** `https://d2k7hy8kxpewl2.cloudfront.net`

| Tileset | Path | Zoom Range | Update Frequency |
|---------|------|------------|------------------|
| Parcels | `/tiles/parcels/{z}/{x}/{y}.pbf` | 10-18 | Weekly |
| Flood Zones | `/tiles/flood/{z}/{x}/{y}.pbf` | 8-18 | Monthly |
| Utilities | `/tiles/utilities/{z}/{x}/{y}.pbf` | 12-18 | Quarterly |
| Zoning | `/tiles/zoning/{z}/{x}/{y}.pbf` | 10-18 | Annual |
| Wetlands | `/tiles/wetlands/{z}/{x}/{y}.pbf` | 10-18 | Biannual |

**Tile Specification:**

- Format: Mapbox Vector Tiles (MVT) v2.1
- Compression: gzip
- Max tile size: 500KB
- Coordinate system: Web Mercator (EPSG:3857)

### 5.2 County ArcGIS Services (Fallback)

| County | Service URL | Layers |
|--------|-------------|--------|
| Harris (HCAD) | `gis.hctx.net/arcgis/rest/services/HCAD` | Parcels, Boundaries |
| Fort Bend (FBCAD) | `gisweb.fbcad.org/arcgis/rest/services` | Parcels, Values |
| Montgomery (MCAD) | `gis.mctx.org/arcgis/rest/services` | Parcels |

**Query Parameters:**

```
?f=pbf
&where=1=1
&outFields=*
&returnGeometry=true
&geometryType=esriGeometryEnvelope
&geometry={bbox}
&inSR=4326
&outSR=3857
```

### 5.3 Supabase PostGIS (Canonical Data)

**Tables Used:**

| Table | Purpose | Geometry Column |
|-------|---------|-----------------|
| `parcels` | Canonical parcel data | `geom` (Polygon) |
| `flood_zones_canonical` | FEMA NFHL data | `geom` (MultiPolygon) |
| `utilities_canonical` | Water/Sewer/Storm | `geom` (LineString) |
| `canonical_demographics` | Census block groups | `geom` (Polygon) |

**Edge Function:** `get-parcels-geojson`

```typescript
// Request
POST /functions/v1/get-parcels-geojson
{
  "bounds": [-95.5, 29.6, -95.3, 29.8],
  "zoom": 15
}

// Response
{
  "type": "FeatureCollection",
  "features": [...],
  "metadata": {
    "count": 150,
    "source": "canonical"
  }
}
```

### 5.4 Basemap Providers

| Provider | Style | Use Case |
|----------|-------|----------|
| OpenStreetMap | `osm` | Default, free, detailed |
| Google Satellite | `satellite` | Aerial imagery |
| Google Hybrid | `hybrid` | Satellite + labels |
| MapTiler Streets | `streets` | Clean cartography |

**Style URLs:**

```typescript
const BASEMAP_STYLES = {
  osm: 'https://api.maptiler.com/maps/streets-v2/style.json',
  satellite: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
  hybrid: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
};
```

---

## 6. Layer Configuration

### 6.1 Layer ID Naming Convention

```
siteintel-{category}-{type}[-{modifier}]

Examples:
- siteintel-parcels-fill
- siteintel-parcels-line
- siteintel-flood-zone-fill
- siteintel-water-lines
- siteintel-sewer-lines-dashed
```

### 6.2 Source-Layer Mapping

| Source ID | Source-Layer Name | Feature Type |
|-----------|-------------------|--------------|
| `siteintel-parcels` | `parcels` | Polygon |
| `siteintel-flood` | `flood_zones` | Polygon |
| `siteintel-flood` | `floodways` | Polygon |
| `siteintel-utilities` | `water_mains` | LineString |
| `siteintel-utilities` | `sewer_mains` | LineString |
| `siteintel-utilities` | `storm_drains` | LineString |
| `siteintel-zoning` | `zoning_districts` | Polygon |
| `siteintel-wetlands` | `nwi_wetlands` | Polygon |

### 6.3 Paint Properties by Layer

**Parcels:**

```typescript
{
  'siteintel-parcels-fill': {
    'fill-color': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      '#FF7A00',  // Feasibility Orange (selected)
      'transparent'
    ],
    'fill-opacity': 0.3
  },
  'siteintel-parcels-line': {
    'line-color': '#FF7A00',
    'line-width': 2
  }
}
```

**Flood Zones:**

```typescript
{
  'siteintel-flood-zone-fill': {
    'fill-color': [
      'match',
      ['get', 'FLD_ZONE'],
      'AE', '#EF4444',      // High risk - Red
      'A', '#F97316',       // High risk - Orange
      'AO', '#F97316',
      'VE', '#DC2626',      // Coastal high risk - Dark Red
      'X', '#3B82F6',       // Minimal risk - Blue
      '#9CA3AF'             // Default - Gray
    ],
    'fill-opacity': 0.4
  }
}
```

**Utilities:**

```typescript
{
  'siteintel-water-lines': {
    'line-color': '#1F6AE1',
    'line-width': 2.5,
    'line-dasharray': [1, 0]  // Solid
  },
  'siteintel-sewer-lines': {
    'line-color': '#7A4A2E',
    'line-width': 2.5,
    'line-dasharray': [4, 2]  // Dashed
  },
  'siteintel-storm-lines': {
    'line-color': '#1C7C7C',
    'line-width': 2,
    'line-dasharray': [2, 2]  // Dotted
  }
}
```

---

## 7. Preset System

### 7.1 Preset Definitions

**Location:** `src/lib/mapPresets.ts`

```typescript
type PresetAudience = 'DEVELOPER' | 'LENDER' | 'IC';

interface MapLayerPreset {
  id: string;
  label: string;
  audience: PresetAudience;
  purpose: string;
  description: string;
  defaultZoom: number;
  layersOn: string[];
  layersOff: string[];
  interactionRules: {
    syncWithKillFactors: boolean;
    highlightOnHover: boolean;
    clickAction: 'details' | 'select' | 'none';
  };
  visualPriority: string[];
}
```

### 7.2 Available Presets

| Preset ID | Label | Audience | Layers On |
|-----------|-------|----------|-----------|
| `decision` | Decision Mode | Developer | parcels, flood, wetlands, subject |
| `lender-risk` | Lender Risk View | Lender | flood, floodway, environmental, subject |
| `utilities` | Utilities Feasibility | Developer | water, sewer, storm, subject |
| `zoning` | Zoning & Entitlements | Developer | zoning, overlays, subject |
| `access-traffic` | Access & Traffic | Developer | roads, aadt, signals, subject |
| `market` | Market Context | IC | comps, submarket, demographics |

### 7.3 Preset Switching Flow

```
User clicks preset button
         │
         ▼
setPreset(newPresetId)
         │
         ▼
Clear existing highlights
         │
         ▼
Update layerVisibility state
         │
         ▼
MapLibreCanvas receives new visibility
         │
         ▼
For each layer:
  - setLayoutProperty('visibility', 'visible'/'none')
         │
         ▼
Update legend to show active layers
```

---

## 8. State Management

### 8.1 Map Instance State

```typescript
// Internal to MapLibreCanvas
const [map, setMap] = useState<MapLibreMap | null>(null);
const [mapLoaded, setMapLoaded] = useState(false);
const [styleLoaded, setStyleLoaded] = useState(false);
```

### 8.2 Layer Visibility State

```typescript
interface LayerVisibilityState {
  parcels?: boolean;
  flood?: boolean;
  floodway?: boolean;
  wetlands?: boolean;
  water?: boolean;
  sewer?: boolean;
  storm?: boolean;
  zoning?: boolean;
  transportation?: boolean;
  topography?: boolean;
  aerialImagery?: boolean;
}
```

### 8.3 Feature Selection State

```typescript
interface SelectedFeature {
  id: string;
  layerId: string;
  properties: Record<string, unknown>;
  geometry: GeoJSON.Geometry;
}

// Managed via feature-state API
map.setFeatureState(
  { source: 'siteintel-parcels', id: featureId },
  { selected: true }
);
```

---

## 9. Performance Optimization

### 9.1 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial load | < 1.5s | Time to interactive map |
| Pan/zoom | 60 fps | Chrome DevTools Performance |
| Tile load | < 500ms | Network waterfall |
| Memory usage | < 200MB | Chrome Task Manager |

### 9.2 Optimization Techniques

**1. Tile Simplification:**
```
- Zoom 10-12: 20% of vertices
- Zoom 13-15: 50% of vertices
- Zoom 16+: Full detail
```

**2. Layer Culling:**
```typescript
// Only render layers in viewport
map.on('moveend', () => {
  const bounds = map.getBounds();
  // Remove sources outside bounds + buffer
});
```

**3. Feature State over Repaint:**
```typescript
// ✅ Good - uses GPU-accelerated feature state
map.setFeatureState({ source, id }, { hover: true });

// ❌ Bad - forces full layer repaint
map.setPaintProperty(layerId, 'fill-color', newColor);
```

**4. Debounced Viewport Updates:**
```typescript
const debouncedFetch = useMemo(
  () => debounce(fetchParcelsForViewport, 300),
  []
);
```

### 9.3 Memory Management

```typescript
// Cleanup on unmount
useEffect(() => {
  return () => {
    if (map) {
      // Remove all layers
      map.getStyle().layers.forEach(layer => {
        if (layer.id.startsWith('siteintel-')) {
          map.removeLayer(layer.id);
        }
      });
      // Remove all sources
      Object.keys(map.getStyle().sources).forEach(source => {
        if (source.startsWith('siteintel-')) {
          map.removeSource(source);
        }
      });
      map.remove();
    }
  };
}, [map]);
```

---

## 10. Error Handling & Fallbacks

### 10.1 Tile Load Errors

```typescript
// In useVectorTileLayers
source.on('error', (e) => {
  if (e.error?.status === 403 || e.error?.status === 404) {
    setTileLoadFailed(true);
    // Trigger fallback to GeoJSON
    enableFallbackMode();
  }
});
```

### 10.2 Fallback Cascade

```
1. CloudFront Vector Tiles (Primary)
         │
         ▼ (on failure)
2. County ArcGIS Tiles (Secondary)
         │
         ▼ (on failure)
3. Supabase GeoJSON (Tertiary)
         │
         ▼ (on failure)
4. Error State with Retry Button
```

### 10.3 Error UI States

| Error Type | User Message | Recovery Action |
|------------|--------------|-----------------|
| Tile timeout | "Map data loading slowly..." | Auto-retry 3x |
| 403/404 | "Using backup data source" | Switch to fallback |
| Network error | "Connection lost" | Retry button |
| No data | "No parcels in this area" | Informational only |

---

## 11. Security Considerations

### 11.1 API Key Protection

- Google Maps API keys restricted by HTTP referrer
- MapTiler keys scoped to specific domains
- Supabase anon key used (RLS enforces access)

### 11.2 Data Access Control

```sql
-- RLS policy example for parcels
CREATE POLICY "Parcels are publicly viewable"
ON parcels FOR SELECT
USING (true);

-- Tile access logged for abuse detection
CREATE TABLE tile_access_logs (
  id uuid PRIMARY KEY,
  tile_path text,
  user_ip inet,
  timestamp timestamptz
);
```

### 11.3 Content Security Policy

```
Content-Security-Policy:
  default-src 'self';
  img-src 'self' https://*.google.com https://*.googleapis.com https://*.cloudfront.net;
  connect-src 'self' https://*.supabase.co https://*.cloudfront.net https://*.arcgis.com;
```

---

## Appendix A: File Reference

| File | Purpose |
|------|---------|
| `src/components/map/MapLibreCanvas.tsx` | Core map component |
| `src/components/report/DecisionMap.tsx` | Report map wrapper |
| `src/components/market-intelligence/TradeAreaMap.tsx` | H3 visualization |
| `src/hooks/useVectorTileLayers.ts` | Vector tile management |
| `src/hooks/useCountyTileOverlays.ts` | County layer loading |
| `src/hooks/useFallbackParcels.ts` | GeoJSON fallback |
| `src/hooks/useMapPresets.ts` | Preset state management |
| `src/lib/mapPresets.ts` | Preset definitions |
| `src/lib/map/utilityLayerConfig.ts` | Utility layer styling |

---

## Appendix B: External Resources

- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js-docs/)
- [Mapbox Vector Tile Specification](https://github.com/mapbox/vector-tile-spec)
- [Turf.js Documentation](https://turfjs.org/)
- [H3 Hexagonal Grid System](https://h3geo.org/)
