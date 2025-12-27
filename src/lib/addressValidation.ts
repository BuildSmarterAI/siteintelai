/**
 * Address Validation Library
 * Strict validation for address input flow - ensures complete addresses only.
 * This is the hard gate before parcel resolution.
 */

export interface AddressComponents {
  streetNumber?: string;
  streetName?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
}

export interface ValidationResult {
  valid: boolean;
  missing: string[];
  message: string;
}

/**
 * Parse an address string into components.
 * This is a fallback when we don't have structured Google data.
 */
export function parseAddressString(address: string): Partial<AddressComponents> {
  const components: Partial<AddressComponents> = {};
  
  if (!address) return components;
  
  // Try to extract street number (starts with digits)
  const streetNumberMatch = address.match(/^(\d+[\w-]*)\s+/);
  if (streetNumberMatch) {
    components.streetNumber = streetNumberMatch[1];
  }
  
  // Try to extract ZIP code (5 digits, optionally -4)
  const zipMatch = address.match(/\b(\d{5}(-\d{4})?)\b/);
  if (zipMatch) {
    components.zip = zipMatch[1];
  }
  
  // Try to extract state (TX, Texas)
  const stateMatch = address.match(/\b(TX|Texas)\b/i);
  if (stateMatch) {
    components.state = 'TX';
  }
  
  // Try to extract city (word before state)
  const cityMatch = address.match(/,\s*([^,]+),?\s*(TX|Texas)/i);
  if (cityMatch) {
    components.city = cityMatch[1].trim();
  }
  
  // Street name is between street number and city
  if (components.streetNumber && components.city) {
    const afterNumber = address.indexOf(components.streetNumber) + components.streetNumber.length;
    const beforeCity = address.indexOf(components.city);
    if (beforeCity > afterNumber) {
      const streetPart = address.substring(afterNumber, beforeCity).replace(/,/g, '').trim();
      if (streetPart) {
        components.streetName = streetPart;
      }
    }
  }
  
  return components;
}

/**
 * Validate that an address has all required components.
 * This is the HARD GATE - no exceptions.
 */
export function validateAddressComponents(
  components: Partial<AddressComponents>,
  lat?: number,
  lng?: number
): ValidationResult {
  const missing: string[] = [];
  
  // Check required components
  if (!components.streetNumber) {
    missing.push('street number');
  }
  
  if (!components.streetName) {
    missing.push('street name');
  }
  
  if (!components.city) {
    missing.push('city');
  }
  
  if (!components.state) {
    missing.push('state');
  }
  
  // Coordinates are critical
  if (lat === undefined || lng === undefined || lat === null || lng === null) {
    missing.push('coordinates');
  }
  
  // ZIP is strongly preferred but not a hard blocker
  // (some rural TX addresses don't have clear ZIP in autocomplete)
  
  const valid = missing.length === 0;
  
  let message = '';
  if (!valid) {
    if (missing.includes('coordinates')) {
      message = "Unable to locate this address. Please select a valid street address from the suggestions.";
    } else if (missing.includes('street number')) {
      message = "This looks incomplete. Please select a full street address including the street number.";
    } else {
      message = "This looks incomplete. Please select a full street address.";
    }
  }
  
  return { valid, missing, message };
}

/**
 * Check if a suggestion looks like a valid street address vs POI/business.
 */
export function isValidStreetAddress(description: string): boolean {
  if (!description) return false;
  
  // Must start with a number (street number)
  const startsWithNumber = /^\d+/.test(description.trim());
  
  // Reject obvious non-addresses
  const invalidPatterns = [
    /^(the|a|an)\s+/i,           // Articles suggest business names
    /\b(inc|llc|ltd|corp)\b/i,    // Business suffixes
    /\b(restaurant|hotel|shop|store|mall|center|plaza)\b/i,
    /\b(airport|station|terminal)\b/i,
    /^[A-Z][a-z]+\s+[A-Z][a-z]+$/,  // Just two proper nouns (likely a business)
  ];
  
  const hasInvalidPattern = invalidPatterns.some(pattern => pattern.test(description));
  
  return startsWithNumber && !hasInvalidPattern;
}

/**
 * Validate an address is in Texas.
 */
export function isInTexas(address: string): boolean {
  return /\b(TX|Texas)\b/i.test(address);
}
