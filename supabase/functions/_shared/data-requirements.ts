// Data validation rules for BuildSmarter Feasibility Platform
// Defines which data sources are CRITICAL vs OPTIONAL for report generation

export const CRITICAL_DATA_SOURCES = {
  // Core geospatial data (MUST have)
  geocode: true,           // Must have valid coordinates
  parcel: true,            // Must have parcel boundaries
  
  // Critical infrastructure (MUST have at least one)
  utilities: {
    water: true,           // Water lines required
    sewer: true,           // Sewer/wastewater required  
    storm: false,          // Storm drains optional but preferred
  },
  
  // Regulatory overlays (MUST have)
  zoning: true,            // Zoning classification required
  flood: true,             // FEMA flood zone required
  
  // Environmental data (OPTIONAL - nice to have)
  wetlands: false,         // NWI wetlands data
  epa_sites: false,        // EPA ECHO facilities
  
  // Market data (OPTIONAL)
  traffic: false,          // TxDOT AADT
  demographics: false,     // Census data
};

export interface DataValidationResult {
  isComplete: boolean;
  missingCritical: string[];
  missingOptional: string[];
  hasCriticalErrors: boolean;
}

export function validateApplicationData(app: any): DataValidationResult {
  const missingCritical: string[] = [];
  const missingOptional: string[] = [];
  
  // Check geocoding
  if (!app.geo_lat || !app.geo_lng) {
    missingCritical.push('geocode');
  }
  
  // Check parcel
  if (!app.parcel_id && !app.enrichment_metadata?.parcel_geometry) {
    missingCritical.push('parcel');
  }
  
  // Check utilities (need at least water AND sewer)
  const hasWater = (
    app.enrichment_metadata?.water_laterals_count > 0 ||
    app.enrichment_metadata?.water_count > 0
  );
  const hasSewer = (
    app.enrichment_metadata?.sewer_gravity_count > 0 ||
    app.enrichment_metadata?.sewer_force_count > 0 ||
    app.enrichment_metadata?.sewer_count > 0
  );
  
  if (!hasWater) missingCritical.push('utilities.water');
  if (!hasSewer) missingCritical.push('utilities.sewer');
  
  // Check zoning
  if (!app.zoning_category && !app.enrichment_metadata?.zoning) {
    missingCritical.push('zoning');
  }
  
  // Check flood zone
  if (!app.floodplain_zone && !app.enrichment_metadata?.flood_zone) {
    missingCritical.push('flood');
  }
  
  // Optional data checks
  if (!app.enrichment_metadata?.wetlands_type) {
    missingOptional.push('wetlands');
  }
  if (!app.enrichment_metadata?.epa_facilities_count) {
    missingOptional.push('epa_sites');
  }
  
  // Check for critical errors in data_flags
  const criticalFlags = [
    'geocode_failed',
    'parcel_not_found',
    'utilities_api_timeout',
    'zoning_unavailable',
    'flood_data_error'
  ];
  
  const hasCriticalErrors = (app.data_flags || []).some(
    (flag: string) => criticalFlags.includes(flag)
  );
  
  return {
    isComplete: missingCritical.length === 0 && !hasCriticalErrors,
    missingCritical,
    missingOptional,
    hasCriticalErrors
  };
}
