// deno-lint-ignore-file no-explicit-any
// Shared geometry utilities for GIS ETL operations
// Version: 1.0.0

export interface BBox {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

// Convert GeoJSON geometry to WKT for PostGIS
export function geometryToWKT(geometry: any): string | null {
  if (!geometry || !geometry.type) return null;

  try {
    switch (geometry.type) {
      case 'Point': {
        const [x, y] = geometry.coordinates;
        return `SRID=4326;POINT(${x} ${y})`;
      }
      case 'LineString': {
        const coords = geometry.coordinates.map((c: number[]) => `${c[0]} ${c[1]}`).join(', ');
        return `SRID=4326;LINESTRING(${coords})`;
      }
      case 'Polygon': {
        const rings = geometry.coordinates.map((ring: number[][]) => 
          '(' + ring.map((c: number[]) => `${c[0]} ${c[1]}`).join(', ') + ')'
        ).join(', ');
        return `SRID=4326;POLYGON(${rings})`;
      }
      case 'MultiPoint': {
        const points = geometry.coordinates.map((c: number[]) => `(${c[0]} ${c[1]})`).join(', ');
        return `SRID=4326;MULTIPOINT(${points})`;
      }
      case 'MultiLineString': {
        const lines = geometry.coordinates.map((line: number[][]) =>
          '(' + line.map((c: number[]) => `${c[0]} ${c[1]}`).join(', ') + ')'
        ).join(', ');
        return `SRID=4326;MULTILINESTRING(${lines})`;
      }
      case 'MultiPolygon': {
        const polygons = geometry.coordinates.map((poly: number[][][]) =>
          '(' + poly.map((ring: number[][]) =>
            '(' + ring.map((c: number[]) => `${c[0]} ${c[1]}`).join(', ') + ')'
          ).join(', ') + ')'
        ).join(', ');
        return `SRID=4326;MULTIPOLYGON(${polygons})`;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

// Build ArcGIS REST query URL with bbox
export function buildArcGISQueryUrl(
  baseUrl: string,
  bbox: BBox,
  offset: number,
  batchSize: number
): string {
  const queryParams = new URLSearchParams({
    where: '1=1',
    geometry: `${bbox.xmin},${bbox.ymin},${bbox.xmax},${bbox.ymax}`,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    outSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'true',
    f: 'geojson',
    resultOffset: String(offset),
    resultRecordCount: String(batchSize),
  });

  return `${baseUrl}/query?${queryParams.toString()}`;
}
