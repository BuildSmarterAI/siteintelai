/**
 * useAddressValidation Hook
 * 
 * Provides consistent address validation across all address inputs.
 * Uses Google Address Validation API via edge function for authoritative validation.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  parseAddressString, 
  validateAddressComponents, 
  isValidStreetAddress,
  isInTexas 
} from '@/lib/addressValidation';

export interface ValidationResult {
  valid: boolean;
  verdict: 'CONFIRMED' | 'UNCONFIRMED' | 'INVALID' | 'ERROR' | 'PENDING';
  confidence: number;
  standardizedAddress?: string;
  components?: {
    streetNumber?: string;
    streetName?: string;
    city?: string;
    state?: string;
    zip?: string;
    county?: string;
  };
  geocode?: {
    lat: number;
    lng: number;
    accuracy: string;
  };
  error?: string;
  issues?: string[];
}

export interface UseAddressValidationReturn {
  validateAddress: (address: string, lat?: number, lng?: number) => Promise<ValidationResult>;
  validateAddressLocal: (address: string, lat?: number, lng?: number) => ValidationResult;
  isValidating: boolean;
  lastResult: ValidationResult | null;
  isValidStreetAddress: (description: string) => boolean;
  isInTexas: (address: string) => boolean;
}

/**
 * Hook for address validation with both local and server-side validation
 */
export function useAddressValidation(): UseAddressValidationReturn {
  const [isValidating, setIsValidating] = useState(false);
  const [lastResult, setLastResult] = useState<ValidationResult | null>(null);

  /**
   * Local validation using client-side parsing (fast, no API call)
   * Use for filtering suggestions or quick checks before server validation
   */
  const validateAddressLocal = useCallback((
    address: string,
    lat?: number,
    lng?: number
  ): ValidationResult => {
    const components = parseAddressString(address);
    const validation = validateAddressComponents(components, lat, lng);
    
    return {
      valid: validation.valid,
      verdict: validation.valid ? 'CONFIRMED' : 'INVALID',
      confidence: validation.valid ? 0.7 : 0.3,
      standardizedAddress: address,
      components: {
        streetNumber: components.streetNumber,
        streetName: components.streetName,
        city: components.city,
        state: components.state,
        zip: components.zip
      },
      geocode: lat !== undefined && lng !== undefined ? {
        lat,
        lng,
        accuracy: 'CLIENT'
      } : undefined,
      issues: validation.missing.length > 0 ? validation.missing.map(m => `Missing ${m}`) : undefined,
      error: !validation.valid ? validation.message : undefined
    };
  }, []);

  /**
   * Server-side validation using Google Address Validation API
   * Use for final validation before proceeding with parcel search
   */
  const validateAddress = useCallback(async (
    address: string,
    lat?: number,
    lng?: number
  ): Promise<ValidationResult> => {
    setIsValidating(true);
    
    try {
      // First do local validation as a quick filter
      const localResult = validateAddressLocal(address, lat, lng);
      
      // If local validation fails on critical issues, don't bother with API
      if (localResult.issues?.includes('Missing coordinates') && !lat && !lng) {
        setLastResult(localResult);
        return localResult;
      }

      // Call Google Address Validation API
      const { data, error } = await supabase.functions.invoke('validate-address-google', {
        body: { address, lat, lng }
      });

      if (error) {
        console.error('[useAddressValidation] API error:', error);
        // Fall back to local validation
        setLastResult(localResult);
        return localResult;
      }

      const result: ValidationResult = {
        valid: data.valid,
        verdict: data.verdict,
        confidence: data.confidence,
        standardizedAddress: data.standardizedAddress,
        components: data.components,
        geocode: data.geocode,
        issues: data.issues,
        error: data.error
      };

      setLastResult(result);
      return result;
    } catch (err) {
      console.error('[useAddressValidation] Validation error:', err);
      // Fall back to local validation on any error
      const localResult = validateAddressLocal(address, lat, lng);
      setLastResult(localResult);
      return localResult;
    } finally {
      setIsValidating(false);
    }
  }, [validateAddressLocal]);

  return {
    validateAddress,
    validateAddressLocal,
    isValidating,
    lastResult,
    isValidStreetAddress,
    isInTexas
  };
}

/**
 * Error messages for validation failures
 */
export const VALIDATION_ERRORS = {
  NO_STREET_NUMBER: "This looks incomplete. Please select a full street address including the street number.",
  INCOMPLETE_ADDRESS: "This looks incomplete. Please select a full street address.",
  NO_COORDINATES: "Unable to locate this address. Please select a valid street address from the suggestions.",
  NOT_IN_TEXAS: "SiteIntel currently only supports Texas addresses.",
  NOT_STREET_ADDRESS: "Please select a street address, not a business or point of interest.",
  VALIDATION_FAILED: "Unable to validate this address. Please try another address."
} as const;