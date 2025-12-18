/**
 * Centralized Parcel Property Mapper
 * 
 * Normalizes parcel property names across different data sources:
 * - HCAD (Harris County Appraisal District)
 * - FBCAD (Fort Bend County Appraisal District)
 * - MCAD (Montgomery County Appraisal District)
 * - Vector Tiles (CloudFront CDN)
 * - Canonical Parcels (Supabase canonical_parcels table)
 */

export type ParcelSource = 'hcad' | 'fbcad' | 'mcad' | 'vectorTile' | 'canonical' | 'drawn' | 'auto';

export interface NormalizedParcel {
  parcelId: string;
  apn: string | null;
  situsAddress: string | null;
  ownerName: string | null;
  acreage: number | null;
  areaSqft: number | null;
  county: string;
  city: string | null;
  zipCode: string | null;
  zoning: string | null;
  marketValue: number | null;
  legalDescription: string | null;
  landUseCode: string | null;
  yearBuilt: number | null;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | null;
  source: ParcelSource;
  centroid: { lat: number; lng: number } | null;
}

// Field mappings per source - priority order (first match wins)
const FIELD_MAPPINGS: Record<string, Record<string, string[]>> = {
  hcad: {
    parcelId: ['ACCOUNT', 'HCAD_NUM', 'acct_num', 'account'],
    situsAddress: ['SITUS_ADDRESS', 'SITE_ADDR_1', 'LocAddr', 'situs_address', 'PROP_ADDR'],
    ownerName: ['OWNER_NAME', 'OWNER', 'CurrOwner', 'owner_name_1', 'ownername'],
    acreage: ['ACREAGE', 'CALC_ACRE', 'LAND_ACRES', 'acreage_1', 'acreage'],
    areaSqft: ['LAND_SQFT', 'land_sqft', 'LandSqFt'],
    county: ['COUNTY', 'SITE_COUNTY', 'site_county'],
    city: ['SITE_CITY', 'SITUS_CITY', 'city', 'City'],
    zipCode: ['SITE_ZIP', 'SITUS_ZIP', 'zip', 'ZipCode', 'postal_code'],
    zoning: ['ZONING', 'ZONE_CLASS', 'zoning_code', 'ZoneClass'],
    marketValue: ['TOTAL_MARKET_VAL', 'total_market_val', 'totalvalue', 'TotalValue', 'tot_market_val'],
    legalDescription: ['LEGAL_DESC', 'legal_desc', 'LegalDesc', 'legal_dscr_1'],
    landUseCode: ['LAND_USE', 'land_use_code', 'LandUse', 'prop_type'],
    yearBuilt: ['YEAR_BUILT', 'year_built', 'YrBuilt', 'effective_yr'],
  },
  fbcad: {
    parcelId: ['propnumber', 'PROPNO', 'GEO_ID', 'prop_id'],
    situsAddress: ['situs', 'SITUS', 'PROP_ADDR', 'situs_address'],
    ownerName: ['ownername', 'OWNERNAME', 'owner_name'],
    acreage: ['acreage', 'ACREAGE', 'acres'],
    areaSqft: ['landsqft', 'LAND_SQFT', 'land_sqft'],
    county: [], // Default to Fort Bend
    city: ['city', 'CITY', 'situs_city'],
    zipCode: ['zip', 'ZIP', 'situs_zip'],
    zoning: ['zoning', 'ZONING', 'zone_code'],
    marketValue: ['totalvalue', 'TOTALVALUE', 'total_value'],
    legalDescription: ['legal_desc', 'LEGAL_DESC'],
    landUseCode: ['landuse', 'LANDUSE', 'land_use'],
    yearBuilt: ['year_built', 'YEAR_BUILT'],
  },
  mcad: {
    parcelId: ['LOWPARCELID', 'GEO_ID', 'parcel_id', 'account'],
    situsAddress: ['site_str_num', 'SITUS_ADDR', 'situs_address'],
    ownerName: ['owner_name_1', 'OWNER', 'owner_name'],
    acreage: ['acreage_1', 'ACREAGE', 'acreage'],
    areaSqft: ['land_sqft', 'LAND_SQFT'],
    county: ['site_county'],
    city: ['site_city', 'CITY'],
    zipCode: ['site_zip', 'ZIP'],
    zoning: ['zoning', 'ZONING'],
    marketValue: ['total_market_val', 'TOTALVALUE'],
    legalDescription: ['legal_dscr_1', 'LEGAL_DESC'],
    landUseCode: ['prop_type', 'LANDUSE'],
    yearBuilt: ['effective_yr', 'YEAR_BUILT'],
  },
  vectorTile: {
    parcelId: ['ACCOUNT', 'HCAD_NUM', 'GEO_ID', 'id', 'parcel_id', 'propnumber'],
    situsAddress: ['SITUS_ADDRESS', 'SITE_ADDR_1', 'situs', 'address', 'PROP_ADDR'],
    ownerName: ['OWNER_NAME', 'OWNER', 'ownername', 'owner'],
    acreage: ['ACREAGE', 'acreage', 'acres', 'CALC_ACRE'],
    areaSqft: ['LAND_SQFT', 'land_sqft', 'sqft'],
    county: ['COUNTY', 'county', 'SITE_COUNTY'],
    city: ['SITE_CITY', 'city', 'CITY'],
    zipCode: ['SITE_ZIP', 'zip', 'ZIP', 'zipcode'],
    zoning: ['ZONING', 'zoning', 'zone'],
    marketValue: ['TOTAL_MARKET_VAL', 'totalvalue', 'value'],
    legalDescription: ['LEGAL_DESC', 'legal_desc'],
    landUseCode: ['LAND_USE', 'landuse', 'use_code'],
    yearBuilt: ['YEAR_BUILT', 'year_built'],
  },
  canonical: {
    parcelId: ['parcel_id', 'source_parcel_id', 'geo_id'],
    situsAddress: ['situs_address', 'address'],
    ownerName: ['owner_name', 'owner'],
    acreage: ['acreage', 'acres'],
    areaSqft: ['land_sqft', 'area_sqft'],
    county: ['county', 'jurisdiction'],
    city: ['city', 'situs_city'],
    zipCode: ['zip', 'postal_code'],
    zoning: ['zoning_code', 'zoning'],
    marketValue: ['market_value', 'appraised_value'],
    legalDescription: ['legal_description'],
    landUseCode: ['land_use_code', 'land_use'],
    yearBuilt: ['year_built'],
  },
};

/**
 * Extract a field value from properties using priority-ordered field names
 */
function extractField(props: Record<string, any>, fieldNames: string[]): string | null {
  for (const name of fieldNames) {
    const value = props[name];
    if (value !== undefined && value !== null && value !== '') {
      return String(value).trim();
    }
  }
  return null;
}

/**
 * Extract a numeric field value from properties
 */
function extractNumericField(props: Record<string, any>, fieldNames: string[]): number | null {
  for (const name of fieldNames) {
    const value = props[name];
    if (value !== undefined && value !== null) {
      const num = typeof value === 'number' ? value : parseFloat(String(value));
      if (!isNaN(num)) {
        return num;
      }
    }
  }
  return null;
}

/**
 * Detect county from properties
 */
function detectCountyFromProps(props: Record<string, any>): string {
  const countyFields = ['COUNTY', 'county', 'SITE_COUNTY', 'site_county', 'jurisdiction'];
  for (const field of countyFields) {
    const value = props[field];
    if (value) {
      const normalized = String(value).toUpperCase().trim();
      if (normalized.includes('HARRIS')) return 'Harris';
      if (normalized.includes('FORT BEND') || normalized.includes('FORTBEND')) return 'Fort Bend';
      if (normalized.includes('MONTGOMERY')) return 'Montgomery';
      if (normalized.includes('BRAZORIA')) return 'Brazoria';
      if (normalized.includes('GALVESTON')) return 'Galveston';
      return String(value).trim();
    }
  }
  return 'Unknown';
}

/**
 * Auto-detect parcel source from property names
 */
function detectParcelSource(props: Record<string, any>): ParcelSource {
  // Check for HCAD-specific fields
  if (props.HCAD_NUM || props.LocAddr || props.CurrOwner) return 'hcad';
  
  // Check for FBCAD-specific fields
  if (props.propnumber || props.PROPNO) return 'fbcad';
  
  // Check for MCAD-specific fields
  if (props.LOWPARCELID || props.site_county === 'MONTGOMERY') return 'mcad';
  
  // Check for canonical parcel fields
  if (props.source_parcel_id || props.ingestion_run_id) return 'canonical';
  
  // Default to vector tile (generic)
  return 'vectorTile';
}

/**
 * Calculate centroid from geometry
 */
function calculateCentroid(geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | null): { lat: number; lng: number } | null {
  if (!geometry) return null;
  
  try {
    let coords: number[][];
    
    if (geometry.type === 'Polygon' && geometry.coordinates?.[0]) {
      coords = geometry.coordinates[0] as number[][];
    } else if (geometry.type === 'MultiPolygon' && geometry.coordinates?.[0]?.[0]) {
      coords = geometry.coordinates[0][0] as number[][];
    } else {
      return null;
    }
    
    if (!coords || coords.length === 0) return null;
    
    // Simple centroid: average of all vertices
    let sumLng = 0, sumLat = 0;
    for (const coord of coords) {
      sumLng += coord[0];
      sumLat += coord[1];
    }
    
    return {
      lng: sumLng / coords.length,
      lat: sumLat / coords.length,
    };
  } catch (e) {
    console.warn('[parcelPropertyMapper] Failed to calculate centroid:', e);
    return null;
  }
}

/**
 * Normalize parcel properties from any source to a standard format
 */
export function normalizeParcel(
  props: Record<string, any>,
  geometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon | null,
  source?: ParcelSource
): NormalizedParcel {
  // Auto-detect source if not provided
  const detectedSource = source === 'auto' || !source 
    ? detectParcelSource(props) 
    : source;
  
  const mapping = FIELD_MAPPINGS[detectedSource] || FIELD_MAPPINGS.vectorTile;
  
  // Detect county with defaults per source
  let county = extractField(props, mapping.county || []);
  if (!county) {
    if (detectedSource === 'fbcad') {
      county = 'Fort Bend';
    } else if (detectedSource === 'mcad') {
      county = 'Montgomery';
    } else if (detectedSource === 'hcad') {
      county = 'Harris';
    } else {
      county = detectCountyFromProps(props);
    }
  }
  
  // Handle combined address fields (e.g., site_str_num + site_str_name)
  let situsAddress = extractField(props, mapping.situsAddress);
  if (!situsAddress && detectedSource === 'mcad') {
    const num = props.site_str_num || props.SITE_STR_NUM;
    const name = props.site_str_name || props.SITE_STR_NAME;
    if (num && name) {
      situsAddress = `${num} ${name}`.trim();
    }
  }
  
  const geom = geometry || null;
  
  return {
    parcelId: extractField(props, mapping.parcelId) || '',
    apn: extractField(props, ['APN', 'apn', 'GEO_ID', 'geo_id']),
    situsAddress,
    ownerName: extractField(props, mapping.ownerName),
    acreage: extractNumericField(props, mapping.acreage),
    areaSqft: extractNumericField(props, mapping.areaSqft),
    county,
    city: extractField(props, mapping.city),
    zipCode: extractField(props, mapping.zipCode),
    zoning: extractField(props, mapping.zoning),
    marketValue: extractNumericField(props, mapping.marketValue),
    legalDescription: extractField(props, mapping.legalDescription),
    landUseCode: extractField(props, mapping.landUseCode),
    yearBuilt: extractNumericField(props, mapping.yearBuilt),
    geometry: geom,
    source: detectedSource,
    centroid: calculateCentroid(geom),
  };
}

/**
 * Quick extraction of display-friendly parcel summary
 */
export function getParcelSummary(props: Record<string, any>): {
  id: string;
  address: string;
  acres: string;
  owner: string;
} {
  const normalized = normalizeParcel(props);
  return {
    id: normalized.parcelId || 'Unknown',
    address: normalized.situsAddress || 'Unknown Address',
    acres: normalized.acreage ? normalized.acreage.toFixed(2) : '—',
    owner: normalized.ownerName || 'Unknown',
  };
}

/**
 * Check if properties represent a drawn/custom parcel
 */
export function isDrawnParcel(props: Record<string, any>): boolean {
  return props._source === 'user_drawn' || 
         props.parcel_type === 'drawn' || 
         (typeof props.parcelId === 'string' && props.parcelId.startsWith('CUSTOM-'));
}
