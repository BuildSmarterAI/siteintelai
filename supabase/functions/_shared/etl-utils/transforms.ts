// deno-lint-ignore-file no-explicit-any
// Shared transform functions for GIS ETL operations
// Version: 1.0.0

export const transformFunctions: Record<string, (val: any) => any> = {
  trim: (val) => typeof val === 'string' ? val.trim() : val,
  uppercase: (val) => typeof val === 'string' ? val.toUpperCase() : val,
  lowercase: (val) => typeof val === 'string' ? val.toLowerCase() : val,
  parse_int: (val) => {
    const num = parseInt(String(val), 10);
    return isNaN(num) ? null : num;
  },
  parse_float: (val) => {
    const num = parseFloat(String(val));
    return isNaN(num) ? null : num;
  },
  parse_bool: (val) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
      return ['true', 'yes', '1', 'y'].includes(val.toLowerCase());
    }
    return Boolean(val);
  },
  parse_date: (val) => {
    if (!val) return null;
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  },
  identity: (val) => val,
  sqft_to_acres: (val) => {
    const sqft = parseFloat(String(val));
    return isNaN(sqft) ? null : sqft / 43560;
  },
  meters_to_feet: (val) => {
    const meters = parseFloat(String(val));
    return isNaN(meters) ? null : meters * 3.28084;
  },
  ccn_status: (val) => {
    if (!val) return 'unknown';
    const s = String(val).toLowerCase().trim();
    if (s.includes('active') || s === 'a') return 'active';
    if (s.includes('inactive') || s === 'i') return 'inactive';
    if (s.includes('revoked') || s === 'r') return 'revoked';
    if (s.includes('proposed') || s === 'p') return 'proposed';
    return 'unknown';
  },
  pipeline_status: (val) => {
    if (!val) return 'unknown';
    const s = String(val).toLowerCase().trim();
    if (s.includes('active') || s === 'a' || s.includes('in service')) return 'active';
    if (s.includes('abandon') || s === 'abn') return 'abandoned';
    if (s.includes('inactive') || s.includes('idle')) return 'inactive';
    if (s.includes('proposed') || s === 'p') return 'proposed';
    return 'unknown';
  },
  route_prefix_to_class: (val) => {
    if (!val) return null;
    const prefix = String(val).toUpperCase().trim();
    if (['IH', 'US', 'PA', 'SH', 'SA', 'UA'].includes(prefix)) return 'arterial';
    if (['FM', 'RM', 'RR', 'FS', 'RS', 'UP'].includes(prefix)) return 'collector';
    if (['CS', 'CR', 'PV', 'PR'].includes(prefix)) return 'local';
    return null;
  },
  flood_zone_normalize: (val) => {
    if (!val) return 'X';
    const zone = String(val).toUpperCase().trim();
    // Normalize common variations
    if (zone.startsWith('AE') || zone === 'A') return zone;
    if (zone.startsWith('VE') || zone === 'V') return zone;
    if (zone === 'AO' || zone === 'AH') return zone;
    if (zone === 'X' || zone === 'ZONE X' || zone.includes('MINIMAL')) return 'X';
    return zone;
  },
  extract_year: (val) => {
    if (!val) return null;
    const match = String(val).match(/\d{4}/);
    return match ? parseInt(match[0], 10) : null;
  },
  coalesce: (val) => val ?? null,
};

// Apply field mappings to a GeoJSON feature
export function applyFieldMappings(
  feature: any,
  mappings: Array<{ source: string; target: string; transform?: string }>,
  constants: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const mapping of mappings) {
    const sourceValue = feature.properties?.[mapping.source];
    const transformFn = transformFunctions[mapping.transform || 'identity'];
    result[mapping.target] = transformFn(sourceValue);
  }

  for (const [key, value] of Object.entries(constants)) {
    result[key] = value;
  }

  return result;
}
