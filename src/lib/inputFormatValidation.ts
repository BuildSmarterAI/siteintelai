/**
 * Input Format Validation - P2
 * Real-time validation for address, coordinates, APN, and intersection inputs
 */

export type InputFormat = 'address' | 'coordinates' | 'apn' | 'intersection' | 'unknown';

export interface ValidationResult {
  isValid: boolean;
  format: InputFormat;
  confidence: 'high' | 'medium' | 'low';
  hint?: string;
  example?: string;
  correctedValue?: string;
}

// Regex patterns for different input formats
const PATTERNS = {
  // Coordinates: "29.7604, -95.3698" or "29.7604 -95.3698"
  coordinates: /^-?\d{1,3}\.\d{2,8}\s*[,\s]\s*-?\d{1,3}\.\d{2,8}$/,
  
  // Intersection: "Main St & Oak Ave" or "Main St and Oak Ave"
  intersection: /^.+\s+(&|and)\s+.+$/i,
  
  // Harris County APN: 12-digit number (e.g., "123456789012")
  harrisApn: /^\d{12}$/,
  
  // Fort Bend County APN: Format like "R123456" or "1234-56-789-1234"
  fortBendApn: /^R?\d{6,}$|^\d{4}-\d{2}-\d{3}-\d{4}$/i,
  
  // Montgomery County APN: Various formats
  montgomeryApn: /^\d{2}-\d{2}-\d{3}-\d{6}$/,
  
  // General address: starts with number, contains street name
  address: /^\d+\s+\w+/,
};

// County-specific APN patterns with examples
export const COUNTY_APN_FORMATS: Record<string, { pattern: RegExp; example: string; name: string }> = {
  harris: {
    pattern: /^\d{12}$/,
    example: '123456789012',
    name: 'Harris County'
  },
  fortBend: {
    pattern: /^R?\d{6,}$|^\d{4}-\d{2}-\d{3}-\d{4}$/i,
    example: 'R123456 or 1234-56-789-1234',
    name: 'Fort Bend County'
  },
  montgomery: {
    pattern: /^\d{2}-\d{2}-\d{3}-\d{6}$/,
    example: '12-34-567-890123',
    name: 'Montgomery County'
  }
};

/**
 * Detect the input format from a query string
 */
export function detectInputFormat(query: string): InputFormat {
  const trimmed = query.trim();
  
  if (!trimmed) return 'unknown';
  
  // Check coordinates first (most specific pattern)
  if (PATTERNS.coordinates.test(trimmed)) {
    return 'coordinates';
  }
  
  // Check intersection
  if (PATTERNS.intersection.test(trimmed)) {
    return 'intersection';
  }
  
  // Check APNs
  if (PATTERNS.harrisApn.test(trimmed) || 
      PATTERNS.fortBendApn.test(trimmed) || 
      PATTERNS.montgomeryApn.test(trimmed)) {
    return 'apn';
  }
  
  // Check address
  if (PATTERNS.address.test(trimmed)) {
    return 'address';
  }
  
  return 'unknown';
}

/**
 * Validate coordinates format
 */
export function validateCoordinates(query: string): ValidationResult {
  const trimmed = query.trim();
  
  // Check if it matches the pattern
  if (PATTERNS.coordinates.test(trimmed)) {
    // Parse and validate range
    const parts = trimmed.split(/[,\s]+/).filter(Boolean);
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      
      // Texas latitude range: ~25.8 to ~36.5
      // Texas longitude range: ~-106.6 to ~-93.5
      const isValidLat = lat >= 25.5 && lat <= 37;
      const isValidLng = lng >= -107 && lng <= -93;
      
      if (isValidLat && isValidLng) {
        return {
          isValid: true,
          format: 'coordinates',
          confidence: 'high',
        };
      }
      
      return {
        isValid: false,
        format: 'coordinates',
        confidence: 'medium',
        hint: 'Coordinates appear to be outside Texas',
        example: '29.7604, -95.3698'
      };
    }
  }
  
  // Partial match - user might be typing coordinates
  if (/^-?\d{1,3}\.?\d*/.test(trimmed)) {
    return {
      isValid: false,
      format: 'coordinates',
      confidence: 'low',
      hint: 'Enter as: latitude, longitude',
      example: '29.7604, -95.3698'
    };
  }
  
  return {
    isValid: false,
    format: 'unknown',
    confidence: 'low',
  };
}

/**
 * Validate APN format and detect county
 */
export function validateApn(query: string): ValidationResult & { county?: string } {
  const trimmed = query.trim().toUpperCase();
  
  // Check each county pattern
  for (const [county, config] of Object.entries(COUNTY_APN_FORMATS)) {
    if (config.pattern.test(trimmed)) {
      return {
        isValid: true,
        format: 'apn',
        confidence: 'high',
        county: config.name,
      };
    }
  }
  
  // Partial match - might be typing an APN
  if (/^[R\d][\d-]*$/i.test(trimmed) && trimmed.length >= 3) {
    // Suggest based on pattern
    if (trimmed.startsWith('R') || trimmed.includes('-')) {
      return {
        isValid: false,
        format: 'apn',
        confidence: 'medium',
        hint: 'Complete the APN number',
        example: COUNTY_APN_FORMATS.fortBend.example,
        county: 'Fort Bend County'
      };
    }
    
    return {
      isValid: false,
      format: 'apn',
      confidence: 'medium',
      hint: 'Harris County APN: 12 digits',
      example: COUNTY_APN_FORMATS.harris.example,
    };
  }
  
  return {
    isValid: false,
    format: 'unknown',
    confidence: 'low',
  };
}

/**
 * Validate intersection format
 */
export function validateIntersection(query: string): ValidationResult {
  const trimmed = query.trim();
  
  if (PATTERNS.intersection.test(trimmed)) {
    // Check for minimum street name length
    const parts = trimmed.split(/\s+(?:&|and)\s+/i);
    if (parts.length === 2 && parts[0].length >= 3 && parts[1].length >= 3) {
      return {
        isValid: true,
        format: 'intersection',
        confidence: 'high',
      };
    }
    
    return {
      isValid: false,
      format: 'intersection',
      confidence: 'medium',
      hint: 'Enter complete street names',
      example: 'Main St & Oak Ave'
    };
  }
  
  // Partial match
  if (/\s+&\s*$/.test(trimmed) || /\s+and\s*$/i.test(trimmed)) {
    return {
      isValid: false,
      format: 'intersection',
      confidence: 'medium',
      hint: 'Add the second street name',
      example: 'Main St & Oak Ave'
    };
  }
  
  return {
    isValid: false,
    format: 'unknown',
    confidence: 'low',
  };
}

/**
 * Validate address format
 */
export function validateAddress(query: string): ValidationResult {
  const trimmed = query.trim();
  
  if (!trimmed) {
    return {
      isValid: false,
      format: 'unknown',
      confidence: 'low',
    };
  }
  
  // Full address with city/state
  if (/^\d+\s+\w+.*,\s*\w+/.test(trimmed)) {
    return {
      isValid: true,
      format: 'address',
      confidence: 'high',
    };
  }
  
  // Street address without city
  if (PATTERNS.address.test(trimmed)) {
    if (trimmed.length >= 10) {
      return {
        isValid: true,
        format: 'address',
        confidence: 'medium',
        hint: 'Add city for better results',
        example: '123 Main St, Houston, TX'
      };
    }
    
    return {
      isValid: false,
      format: 'address',
      confidence: 'low',
      hint: 'Enter complete street address',
      example: '123 Main St, Houston, TX'
    };
  }
  
  return {
    isValid: false,
    format: 'unknown',
    confidence: 'low',
  };
}

/**
 * Main validation function - auto-detects format and validates
 */
export function validateInput(query: string): ValidationResult {
  const format = detectInputFormat(query);
  
  switch (format) {
    case 'coordinates':
      return validateCoordinates(query);
    case 'apn':
      return validateApn(query);
    case 'intersection':
      return validateIntersection(query);
    case 'address':
      return validateAddress(query);
    default:
      // Try to provide helpful hints for unknown format
      if (query.length > 0 && query.length < 5) {
        return {
          isValid: false,
          format: 'unknown',
          confidence: 'low',
          hint: 'Start typing an address, APN, or coordinates',
        };
      }
      return {
        isValid: false,
        format: 'unknown',
        confidence: 'low',
      };
  }
}
