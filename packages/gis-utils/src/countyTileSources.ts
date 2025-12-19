/**
 * County ArcGIS Tile Sources Configuration
 * 
 * These are direct ArcGIS MapServer/export endpoints that can render
 * parcel tiles on-the-fly without needing our own vector tile infrastructure.
 */

import type { CountyTileSource } from '@siteintel/types';

/**
 * All configured county tile sources
 * These use the ArcGIS MapServer/export endpoint to render tiles dynamically
 */
export const COUNTY_TILE_SOURCES: CountyTileSource[] = [
  {
    id: 'harris',
    name: 'Harris County',
    state: 'TX',
    mapServerUrl: 'https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer',
    featureServerUrl: 'https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer/0',
    layerId: 0,
    bounds: [-96.0, 29.4, -94.9, 30.2],
    minZoom: 13,
    maxZoom: 20,
    attribution: 'Harris County Appraisal District',
    isActive: true,
  },
  {
    id: 'fort-bend',
    name: 'Fort Bend County',
    state: 'TX',
    mapServerUrl: 'https://gisweb.fbcad.org/arcgis/rest/services/Hosted/FBCAD_Public_Data/MapServer',
    featureServerUrl: 'https://gisweb.fbcad.org/arcgis/rest/services/Hosted/FBCAD_Public_Data/FeatureServer/0',
    layerId: 0,
    bounds: [-96.1, 29.2, -95.4, 29.8],
    minZoom: 13,
    maxZoom: 20,
    attribution: 'Fort Bend Central Appraisal District',
    isActive: true,
  },
  {
    id: 'montgomery',
    name: 'Montgomery County',
    state: 'TX',
    mapServerUrl: 'https://gis.mctx.org/arcgis/rest/services/Parcels/MapServer',
    featureServerUrl: 'https://gis.mctx.org/arcgis/rest/services/Parcels/MapServer/0',
    layerId: 0,
    bounds: [-96.0, 30.0, -95.0, 30.7],
    minZoom: 13,
    maxZoom: 20,
    attribution: 'Montgomery County',
    isActive: true,
  },
  {
    id: 'travis',
    name: 'Travis County',
    state: 'TX',
    mapServerUrl: 'https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/TCAD_public/FeatureServer',
    featureServerUrl: 'https://services.arcgis.com/0L95CJ0VTaxqcmED/arcgis/rest/services/TCAD_public/FeatureServer/0',
    layerId: 0,
    bounds: [-98.2, 30.0, -97.3, 30.6],
    minZoom: 13,
    maxZoom: 20,
    attribution: 'Travis Central Appraisal District',
    isActive: true,
  },
  {
    id: 'dallas',
    name: 'Dallas County',
    state: 'TX',
    mapServerUrl: 'https://egis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/MapServer',
    featureServerUrl: 'https://egis.dallascityhall.com/arcgis/rest/services/Basemap/DallasTaxParcels/MapServer/0',
    layerId: 0,
    bounds: [-97.0, 32.5, -96.4, 33.1],
    minZoom: 13,
    maxZoom: 20,
    attribution: 'City of Dallas GIS',
    isActive: true,
  },
  {
    id: 'tarrant',
    name: 'Tarrant County',
    state: 'TX',
    mapServerUrl: 'https://gis.tad.org/arcgis/rest/services/Parcels/MapServer',
    featureServerUrl: 'https://gis.tad.org/arcgis/rest/services/Parcels/MapServer/0',
    layerId: 0,
    bounds: [-97.6, 32.5, -96.9, 33.0],
    minZoom: 13,
    maxZoom: 20,
    attribution: 'Tarrant Appraisal District',
    isActive: true,
  },
  {
    id: 'bexar',
    name: 'Bexar County',
    state: 'TX',
    mapServerUrl: 'https://gis.bexar.org/arcgis/rest/services/BCAD/Parcels/MapServer',
    featureServerUrl: 'https://gis.bexar.org/arcgis/rest/services/BCAD/Parcels/MapServer/0',
    layerId: 0,
    bounds: [-98.8, 29.1, -98.2, 29.8],
    minZoom: 13,
    maxZoom: 20,
    attribution: 'Bexar Appraisal District',
    isActive: true,
  },
  {
    id: 'williamson',
    name: 'Williamson County',
    state: 'TX',
    mapServerUrl: 'https://gis.wilco.org/arcgis/rest/services/Parcels/MapServer',
    featureServerUrl: 'https://gis.wilco.org/arcgis/rest/services/Parcels/MapServer/0',
    layerId: 0,
    bounds: [-98.0, 30.3, -97.2, 30.9],
    minZoom: 13,
    maxZoom: 20,
    attribution: 'Williamson County',
    isActive: true,
  },
];

/**
 * Build ArcGIS export tile URL for MapLibre raster source
 * Uses Web Mercator (EPSG:3857) for tile coordinates
 */
export function buildArcGISExportTileUrl(source: CountyTileSource): string {
  const baseUrl = source.mapServerUrl;
  // MapLibre provides {bbox-epsg-3857} placeholder for the tile bounds
  return `${baseUrl}/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png32&transparent=true&f=image&layers=show:${source.layerId}`;
}

/**
 * Find counties that intersect with a given bounding box
 */
export function findCountiesInBounds(
  bounds: [number, number, number, number] // [west, south, east, north]
): CountyTileSource[] {
  return COUNTY_TILE_SOURCES.filter(county => {
    if (!county.isActive) return false;
    
    const [cWest, cSouth, cEast, cNorth] = county.bounds;
    const [west, south, east, north] = bounds;
    
    // Check if bounding boxes overlap
    return !(cEast < west || cWest > east || cNorth < south || cSouth > north);
  });
}

/**
 * Find county by coordinates (point-in-bounds check)
 */
export function findCountyByCoordinates(lng: number, lat: number): CountyTileSource | null {
  return COUNTY_TILE_SOURCES.find(county => {
    if (!county.isActive) return false;
    const [west, south, east, north] = county.bounds;
    return lng >= west && lng <= east && lat >= south && lat <= north;
  }) || null;
}

/**
 * Get all active county sources
 */
export function getActiveCountySources(): CountyTileSource[] {
  return COUNTY_TILE_SOURCES.filter(c => c.isActive);
}
