/**
 * Texas County Bounds for Address Validation
 * 
 * Simplified bounding boxes for Texas counties to enable
 * county detection and routing to appropriate validation services.
 */

export interface CountyBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// Texas state bounds
export const TEXAS_BOUNDS: CountyBounds = {
  minLat: 25.84,
  maxLat: 36.50,
  minLng: -106.65,
  maxLng: -93.51,
};

// Houston metro region (City of Houston proper)
export const HOUSTON_CITY_BOUNDS: CountyBounds = {
  minLat: 29.52,
  maxLat: 30.15,
  minLng: -95.95,
  maxLng: -95.01,
};

// Core Houston-area county bounds (most accurate for our primary service area)
export const TEXAS_COUNTY_BOUNDS: Record<string, CountyBounds> = {
  // Primary service area - Houston metro
  'Harris': { minLat: 29.49, maxLat: 30.17, minLng: -95.91, maxLng: -94.91 },
  'Fort Bend': { minLat: 29.37, maxLat: 29.81, minLng: -96.05, maxLng: -95.52 },
  'Montgomery': { minLat: 30.07, maxLat: 30.67, minLng: -95.86, maxLng: -95.07 },
  'Brazoria': { minLat: 28.93, maxLat: 29.58, minLng: -95.90, maxLng: -95.05 },
  'Galveston': { minLat: 29.08, maxLat: 29.64, minLng: -95.30, maxLng: -94.51 },
  'Liberty': { minLat: 29.75, maxLat: 30.50, minLng: -95.10, maxLng: -94.46 },
  'Chambers': { minLat: 29.47, maxLat: 29.95, minLng: -95.00, maxLng: -94.38 },
  'Waller': { minLat: 29.77, maxLat: 30.25, minLng: -96.25, maxLng: -95.75 },
  'Austin': { minLat: 29.59, maxLat: 30.07, minLng: -96.54, maxLng: -95.92 },
  
  // DFW metro
  'Dallas': { minLat: 32.55, maxLat: 33.02, minLng: -97.03, maxLng: -96.46 },
  'Tarrant': { minLat: 32.55, maxLat: 33.00, minLng: -97.54, maxLng: -97.03 },
  'Collin': { minLat: 33.00, maxLat: 33.45, minLng: -96.85, maxLng: -96.29 },
  'Denton': { minLat: 33.00, maxLat: 33.56, minLng: -97.39, maxLng: -96.83 },
  'Rockwall': { minLat: 32.77, maxLat: 32.99, minLng: -96.52, maxLng: -96.29 },
  'Ellis': { minLat: 32.21, maxLat: 32.58, minLng: -97.11, maxLng: -96.52 },
  'Kaufman': { minLat: 32.27, maxLat: 32.79, minLng: -96.52, maxLng: -96.01 },
  
  // Austin metro
  'Travis': { minLat: 30.02, maxLat: 30.63, minLng: -98.17, maxLng: -97.37 },
  'Williamson': { minLat: 30.39, maxLat: 30.93, minLng: -98.03, maxLng: -97.31 },
  'Hays': { minLat: 29.79, maxLat: 30.24, minLng: -98.30, maxLng: -97.73 },
  'Bastrop': { minLat: 29.93, maxLat: 30.43, minLng: -97.61, maxLng: -97.01 },
  'Caldwell': { minLat: 29.62, maxLat: 29.98, minLng: -98.01, maxLng: -97.40 },
  
  // San Antonio metro
  'Bexar': { minLat: 29.10, maxLat: 29.75, minLng: -98.81, maxLng: -98.23 },
  'Comal': { minLat: 29.56, maxLat: 29.93, minLng: -98.55, maxLng: -98.01 },
  'Guadalupe': { minLat: 29.42, maxLat: 29.87, minLng: -98.23, maxLng: -97.69 },
  'Kendall': { minLat: 29.76, maxLat: 30.15, minLng: -99.06, maxLng: -98.55 },
  'Medina': { minLat: 29.09, maxLat: 29.67, minLng: -99.44, maxLng: -98.80 },
  
  // Other major counties
  'El Paso': { minLat: 31.33, maxLat: 32.00, minLng: -106.65, maxLng: -106.19 },
  'Jefferson': { minLat: 29.67, maxLat: 30.19, minLng: -94.40, maxLng: -93.85 },
  'Nueces': { minLat: 27.42, maxLat: 27.94, minLng: -97.90, maxLng: -97.14 },
  'Hidalgo': { minLat: 26.04, maxLat: 26.80, minLng: -98.60, maxLng: -97.99 },
  'Cameron': { minLat: 25.84, maxLat: 26.40, minLng: -97.85, maxLng: -97.14 },
  'Webb': { minLat: 27.26, maxLat: 28.18, minLng: -100.11, maxLng: -99.08 },
  'McLennan': { minLat: 31.31, maxLat: 31.72, minLng: -97.44, maxLng: -96.84 },
  'Lubbock': { minLat: 33.37, maxLat: 33.83, minLng: -102.09, maxLng: -101.56 },
  'Smith': { minLat: 32.14, maxLat: 32.58, minLng: -95.59, maxLng: -94.98 },
};

/**
 * Check if coordinates are within Texas
 */
export function isInTexas(lat: number, lng: number): boolean {
  return (
    lat >= TEXAS_BOUNDS.minLat &&
    lat <= TEXAS_BOUNDS.maxLat &&
    lng >= TEXAS_BOUNDS.minLng &&
    lng <= TEXAS_BOUNDS.maxLng
  );
}

/**
 * Check if coordinates are within Houston city limits
 */
export function isInHoustonCity(lat: number, lng: number): boolean {
  return (
    lat >= HOUSTON_CITY_BOUNDS.minLat &&
    lat <= HOUSTON_CITY_BOUNDS.maxLat &&
    lng >= HOUSTON_CITY_BOUNDS.minLng &&
    lng <= HOUSTON_CITY_BOUNDS.maxLng
  );
}

/**
 * Detect Texas county from coordinates
 * Returns null if not in Texas or county not found in our bounds
 */
export function detectTexasCounty(lat: number, lng: number): string | null {
  if (!isInTexas(lat, lng)) return null;
  
  for (const [county, bounds] of Object.entries(TEXAS_COUNTY_BOUNDS)) {
    if (
      lat >= bounds.minLat &&
      lat <= bounds.maxLat &&
      lng >= bounds.minLng &&
      lng <= bounds.maxLng
    ) {
      return county;
    }
  }
  
  // In Texas but not in a known county bounds - return generic
  return 'Other Texas';
}

/**
 * Get the validation tier for a Texas county
 * Tier 1: County CADs (HCAD, FBCAD, MCAD) - highest accuracy
 * Tier 2: Houston City (COH Address Points)
 * Tier 3: TNRIS Statewide
 * Tier 4: TAMU Geocoder (fallback)
 */
export function getValidationTier(county: string | null): 1 | 2 | 3 | 4 {
  if (!county) return 4;
  
  const tier1Counties = ['Harris', 'Fort Bend', 'Montgomery'];
  const tier2Houston = isInHoustonCity ? 2 : 3;
  
  if (tier1Counties.includes(county)) return 1;
  if (county === 'Other Texas') return 3;
  
  // All other known Texas counties go to TNRIS
  return 3;
}
