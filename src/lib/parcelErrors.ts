/**
 * Parcel Error Messages
 * Verbatim error messages for the parcel selection flow.
 * These are the exact messages users will see - do not modify without product approval.
 */

export const PARCEL_ERRORS = {
  /** No parcel found for the given address */
  NOT_FOUND: "We couldn't match this address to a parcel. Try refining the address or use CAD/APN.",
  
  /** Multiple parcels overlap the address location */
  MULTIPLE_PARCELS: "Multiple parcels match this address. Please select the correct one.",
  
  /** Address is incomplete or invalid */
  INCOMPLETE_ADDRESS: "This looks incomplete. Please select a full street address.",
  
  /** Address must be selected from suggestions */
  SELECTION_REQUIRED: "Please select an address from the list.",
  
  /** Address not in Texas */
  NOT_IN_TEXAS: "We currently only support properties in Texas.",
  
  /** Parcel resolution failed */
  RESOLUTION_FAILED: "Unable to resolve parcel for this location. Please try again or use CAD/APN lookup.",
  
  /** No coordinates available */
  NO_COORDINATES: "Unable to locate this address. Please select a valid street address from the suggestions.",
  
  /** Validation failed at analysis start - regression guard */
  VALIDATION_REGRESSION: "Please complete the address selection and parcel confirmation before proceeding.",
  
  /** No geometry available */
  NO_GEOMETRY: "This parcel has no boundary data. Try a different address or use CAD/APN.",
} as const;

export type ParcelErrorKey = keyof typeof PARCEL_ERRORS;

/**
 * Get the appropriate error message for a parcel search result.
 */
export function getParcelErrorMessage(
  candidateCount: number,
  _confidence?: 'high' | 'medium' | 'low'
): string | null {
  if (candidateCount === 0) {
    return PARCEL_ERRORS.NOT_FOUND;
  }
  
  if (candidateCount > 1) {
    return PARCEL_ERRORS.MULTIPLE_PARCELS;
  }
  
  // Single match found - no error (confidence is internal, not user-facing)
  return null;
}
