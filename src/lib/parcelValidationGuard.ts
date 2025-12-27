/**
 * Parcel Validation Guard
 * Regression guard that runs before any analysis can proceed.
 * This is the final checkpoint - no exceptions.
 */

import type { SelectedParcel, ParcelSelectionState } from '@/types/parcelSelection';
import { PARCEL_ERRORS } from './parcelErrors';

export interface ValidationGuardResult {
  valid: boolean;
  error: string | null;
  /** If invalid, which step should we return to */
  returnToStep: 'address' | 'parcel' | 'confirmation' | null;
}

/**
 * Validate that all requirements are met before analysis can proceed.
 * This is the REGRESSION GUARD - prevents any bypass.
 */
export function validateBeforeAnalysis(state: ParcelSelectionState): ValidationGuardResult {
  // Check 1: Must have a locked parcel
  if (!state.lockedParcel) {
    return {
      valid: false,
      error: PARCEL_ERRORS.VALIDATION_REGRESSION,
      returnToStep: state.selectedCandidate ? 'confirmation' : 'address',
    };
  }
  
  // Check 2: Locked parcel must have valid ID
  if (!state.lockedParcel.parcel_id) {
    return {
      valid: false,
      error: PARCEL_ERRORS.NOT_FOUND,
      returnToStep: 'address',
    };
  }
  
  // Check 3: Must have geometry
  if (!state.lockedParcel.geom) {
    return {
      valid: false,
      error: PARCEL_ERRORS.RESOLUTION_FAILED,
      returnToStep: 'address',
    };
  }
  
  // Check 4: Verification must be complete
  if (!state.isVerified) {
    return {
      valid: false,
      error: PARCEL_ERRORS.VALIDATION_REGRESSION,
      returnToStep: 'confirmation',
    };
  }
  
  // Check 5: All verification checks must be true
  const { correctBoundary, locationMatches, understandsAnalysis } = state.verificationChecks;
  if (!correctBoundary || !locationMatches || !understandsAnalysis) {
    return {
      valid: false,
      error: PARCEL_ERRORS.VALIDATION_REGRESSION,
      returnToStep: 'confirmation',
    };
  }
  
  // Check 6: Must have a geometry hash (immutability proof)
  if (!state.lockedParcel.geometry_hash) {
    return {
      valid: false,
      error: PARCEL_ERRORS.RESOLUTION_FAILED,
      returnToStep: 'address',
    };
  }
  
  // All checks passed
  return {
    valid: true,
    error: null,
    returnToStep: null,
  };
}

/**
 * Validate a locked parcel object directly (for use outside of context).
 */
export function validateLockedParcel(parcel: SelectedParcel | null): ValidationGuardResult {
  if (!parcel) {
    return {
      valid: false,
      error: PARCEL_ERRORS.VALIDATION_REGRESSION,
      returnToStep: 'address',
    };
  }
  
  if (!parcel.parcel_id || !parcel.geom || !parcel.geometry_hash) {
    return {
      valid: false,
      error: PARCEL_ERRORS.RESOLUTION_FAILED,
      returnToStep: 'address',
    };
  }
  
  if (!parcel.verification_timestamp) {
    return {
      valid: false,
      error: PARCEL_ERRORS.VALIDATION_REGRESSION,
      returnToStep: 'confirmation',
    };
  }
  
  return {
    valid: true,
    error: null,
    returnToStep: null,
  };
}
