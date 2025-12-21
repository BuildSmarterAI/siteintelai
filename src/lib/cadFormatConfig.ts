/**
 * Texas County CAD/APN Format Configuration
 * Strict format validation for each supported county.
 */

import type { CADFormatConfig } from '@/types/parcelSelection';

export const CAD_FORMAT_CONFIG: Record<string, CADFormatConfig> = {
  harris: {
    pattern: /^\d{13}$|^\d{3}-\d{3}-\d{3}-\d{4}$/,
    name: 'Harris County',
    hint: '13 digits or ###-###-###-####',
    example: '1234567890123',
  },
  fort_bend: {
    pattern: /^R?\d{6,12}$/i,
    name: 'Fort Bend County',
    hint: 'R + 6-12 digits or 6-12 digits',
    example: 'R123456789',
  },
  montgomery: {
    pattern: /^[A-Z]\d{6,10}$|^\d{8,12}$/i,
    name: 'Montgomery County',
    hint: 'Letter + 6-10 digits or 8-12 digits',
    example: 'R01234567',
  },
  galveston: {
    pattern: /^\d{5,10}$/,
    name: 'Galveston County',
    hint: '5-10 digits',
    example: '12345678',
  },
  brazoria: {
    pattern: /^\d{6,11}$/,
    name: 'Brazoria County',
    hint: '6-11 digits',
    example: '123456789',
  },
  travis: {
    pattern: /^\d{6,10}$|^\d{2}-\d{7}$/,
    name: 'Travis County',
    hint: '6-10 digits or ##-#######',
    example: '12-3456789',
  },
  williamson: {
    pattern: /^R\d{6,9}$/i,
    name: 'Williamson County',
    hint: 'R + 6-9 digits',
    example: 'R123456',
  },
  bexar: {
    pattern: /^\d{8,12}$/,
    name: 'Bexar County',
    hint: '8-12 digits',
    example: '12345678901',
  },
  dallas: {
    pattern: /^\d{10,13}$/,
    name: 'Dallas County',
    hint: '10-13 digits',
    example: '1234567890123',
  },
  tarrant: {
    pattern: /^\d{11,13}$/,
    name: 'Tarrant County',
    hint: '11-13 digits',
    example: '12345678901',
  },
  collin: {
    pattern: /^\d{6,12}$/,
    name: 'Collin County',
    hint: '6-12 digits',
    example: '123456789',
  },
  denton: {
    pattern: /^\d{6,12}$/,
    name: 'Denton County',
    hint: '6-12 digits',
    example: '123456789',
  },
  hays: {
    pattern: /^R\d{6,9}$/i,
    name: 'Hays County',
    hint: 'R + 6-9 digits',
    example: 'R123456',
  },
};

export const TEXAS_COUNTIES = Object.entries(CAD_FORMAT_CONFIG).map(([key, config]) => ({
  value: key,
  label: config.name,
}));

/**
 * Validate a CAD/APN number against a county's format.
 */
export function validateCADFormat(apn: string, county: string): { valid: boolean; error?: string } {
  const config = CAD_FORMAT_CONFIG[county.toLowerCase()];
  
  if (!config) {
    return { valid: false, error: 'Unsupported county' };
  }
  
  const cleanAPN = apn.trim().replace(/\s/g, '');
  
  if (!cleanAPN) {
    return { valid: false, error: 'CAD/APN is required' };
  }
  
  if (!config.pattern.test(cleanAPN)) {
    return { valid: false, error: `Invalid format. Expected: ${config.hint}` };
  }
  
  return { valid: true };
}

/**
 * Detect county from APN format (best-effort).
 */
export function detectCountyFromAPN(apn: string): string | null {
  const cleanAPN = apn.trim().replace(/[\s\-]/g, '');
  
  for (const [county, config] of Object.entries(CAD_FORMAT_CONFIG)) {
    if (config.pattern.test(cleanAPN)) {
      return county;
    }
  }
  
  return null;
}

/**
 * Normalize a CAD/APN number for lookup.
 */
export function normalizeAPN(apn: string): string {
  return apn.trim().replace(/[\s\-]/g, '').toUpperCase();
}
