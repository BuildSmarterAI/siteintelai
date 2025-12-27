/**
 * Parcel Selection Context
 * Manages the verification-locked parcel selection state.
 * No feasibility calls allowed until parcel is verified and locked.
 */

import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import type {
  ParcelSelectionState,
  ParcelSelectionAction,
  CandidateParcel,
  SelectedParcel,
  VerificationChecks,
  ParcelSelectionInputMode,
  CheckboxTimestamps,
  VerificationAuditData,
} from '@/types/parcelSelection';
import {
  createLockedParcel,
  persistLockedParcel,
  clearLockedParcel,
  retrieveLockedParcel,
  persistVerificationAudit,
} from '@/lib/parcelLock';

const initialState: ParcelSelectionState = {
  inputMode: 'address',
  candidates: [],
  selectedCandidate: null,
  isVerified: false,
  verificationChecks: {
    correctBoundary: false,
    locationMatches: false,
    understandsAnalysis: false,
  },
  checkboxTimestamps: {},
  lockedParcel: null,
  warnings: [],
  isLoading: false,
  error: null,
  typedConfirmationPhrase: '',
  rawInput: '',
  mapState: undefined,
};

/**
 * Simplified verification: selection = verification
 * User selects a parcel and clicks "Analyze" - that's the gate.
 */
function isParcelVerified(state: ParcelSelectionState): boolean {
  // Selection with geometry = verified
  return state.selectedCandidate !== null && state.selectedCandidate.geom !== null;
}

function parcelSelectionReducer(
  state: ParcelSelectionState,
  action: ParcelSelectionAction
): ParcelSelectionState {
  switch (action.type) {
    case 'SET_INPUT_MODE':
      return {
        ...state,
        inputMode: action.mode,
        // Clear candidates when switching modes
        candidates: [],
        selectedCandidate: null,
        isVerified: false,
        verificationChecks: initialState.verificationChecks,
        checkboxTimestamps: {},
        warnings: [],
        typedConfirmationPhrase: '',
      };

    case 'SET_CANDIDATES':
      return {
        ...state,
        candidates: action.candidates,
        selectedCandidate: null,
        isVerified: false,
        verificationChecks: initialState.verificationChecks,
        checkboxTimestamps: {},
      };

    case 'SELECT_CANDIDATE':
      return {
        ...state,
        selectedCandidate: action.candidate,
        isVerified: false,
        verificationChecks: initialState.verificationChecks,
        checkboxTimestamps: {},
        typedConfirmationPhrase: '',
      };

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedCandidate: null,
        isVerified: false,
        verificationChecks: initialState.verificationChecks,
        checkboxTimestamps: {},
        typedConfirmationPhrase: '',
      };

    case 'UPDATE_VERIFICATION_CHECK': {
      const newChecks = {
        ...state.verificationChecks,
        [action.check]: action.value,
      };
      // Track timestamp when checkbox is checked (not when unchecked)
      const newTimestamps = { ...state.checkboxTimestamps };
      if (action.value) {
        newTimestamps[action.check] = action.timestamp;
      }
      
      // All three checks must be true to be verified
      const isVerified = 
        newChecks.correctBoundary && 
        newChecks.locationMatches && 
        newChecks.understandsAnalysis;
      
      return {
        ...state,
        verificationChecks: newChecks,
        checkboxTimestamps: newTimestamps,
        isVerified,
      };
    }

    case 'LOCK_PARCEL':
      return {
        ...state,
        lockedParcel: action.parcel,
        isVerified: true,
      };

    case 'UNLOCK_PARCEL':
      return {
        ...state,
        lockedParcel: null,
        isVerified: false,
        verificationChecks: initialState.verificationChecks,
        checkboxTimestamps: {},
        typedConfirmationPhrase: '',
      };

    case 'ADD_WARNING':
      return {
        ...state,
        warnings: [...state.warnings, action.warning],
      };

    case 'CLEAR_WARNINGS':
      return {
        ...state,
        warnings: [],
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
        isLoading: false,
      };

    case 'SET_TYPED_CONFIRMATION':
      return {
        ...state,
        typedConfirmationPhrase: action.phrase,
      };

    case 'SET_RAW_INPUT':
      return {
        ...state,
        rawInput: action.input,
      };

    case 'SET_MAP_STATE':
      return {
        ...state,
        mapState: action.state,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

interface ParcelSelectionContextValue {
  state: ParcelSelectionState;
  // Input mode
  setInputMode: (mode: ParcelSelectionInputMode) => void;
  // Candidates
  setCandidates: (candidates: CandidateParcel[]) => void;
  selectCandidate: (candidate: CandidateParcel) => void;
  clearSelection: () => void;
  // Verification
  updateVerificationCheck: (check: keyof VerificationChecks, value: boolean) => void;
  canLock: boolean;
  // Typed confirmation (for low confidence)
  setTypedConfirmation: (phrase: string) => void;
  // Raw input tracking
  setRawInput: (input: string) => void;
  // Map state tracking
  setMapState: (state: { zoom: number; centerLat: number; centerLng: number }) => void;
  // Locking
  lockParcel: () => Promise<SelectedParcel>;
  unlockParcel: () => void;
  // Warnings
  addWarning: (warning: string) => void;
  clearWarnings: () => void;
  // Loading/error
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  // Reset
  reset: () => void;
  // Recovery
  recoverFromStorage: () => SelectedParcel | null;
}

const ParcelSelectionContext = createContext<ParcelSelectionContextValue | null>(null);

interface ParcelSelectionProviderProps {
  children: ReactNode;
}

export function ParcelSelectionProvider({ children }: ParcelSelectionProviderProps) {
  const [state, dispatch] = useReducer(parcelSelectionReducer, initialState);

  const setInputMode = useCallback((mode: ParcelSelectionInputMode) => {
    dispatch({ type: 'SET_INPUT_MODE', mode });
  }, []);

  const setCandidates = useCallback((candidates: CandidateParcel[]) => {
    dispatch({ type: 'SET_CANDIDATES', candidates });
  }, []);

  const selectCandidate = useCallback((candidate: CandidateParcel) => {
    dispatch({ type: 'SELECT_CANDIDATE', candidate });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  const updateVerificationCheck = useCallback((check: keyof VerificationChecks, value: boolean) => {
    dispatch({ type: 'UPDATE_VERIFICATION_CHECK', check, value, timestamp: new Date().toISOString() });
  }, []);

  const setTypedConfirmation = useCallback((phrase: string) => {
    dispatch({ type: 'SET_TYPED_CONFIRMATION', phrase });
  }, []);

  const setRawInput = useCallback((input: string) => {
    dispatch({ type: 'SET_RAW_INPUT', input });
  }, []);

  const setMapState = useCallback((mapState: { zoom: number; centerLat: number; centerLng: number }) => {
    dispatch({ type: 'SET_MAP_STATE', state: mapState });
  }, []);

  // Simplified: can lock when a candidate with geometry is selected
  const canLock = isParcelVerified(state);

  const lockParcel = useCallback(async (): Promise<SelectedParcel> => {
    if (!state.selectedCandidate || !state.selectedCandidate.geom) {
      throw new Error('No candidate selected or candidate has no geometry');
    }
    // Simplified: selection with geometry = can lock
    if (!isParcelVerified(state)) {
      throw new Error('Please select a parcel with valid geometry');
    }

    const locked = await createLockedParcel(state.selectedCandidate, state.inputMode);
    
    // Build audit data (simplified - no checkbox timestamps needed)
    const auditData: VerificationAuditData = {
      parcel_id: locked.parcel_id,
      county: locked.county,
      geometry_hash: locked.geometry_hash,
      input_method: state.inputMode,
      raw_input: state.rawInput,
      geocode_confidence: state.selectedCandidate.confidence,
      candidate_count: state.candidates.length,
      candidates_presented: state.candidates,
      warnings_shown: state.warnings,
      // Keep checkbox fields for backward compatibility but they won't be populated
      checkbox_correct_boundary_at: undefined,
      checkbox_location_matches_at: undefined,
      checkbox_understands_analysis_at: undefined,
      typed_confirmation_phrase: undefined,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      map_zoom_level: state.mapState?.zoom,
      map_center_lat: state.mapState?.centerLat,
      map_center_lng: state.mapState?.centerLng,
    };

    // Persist to server (required for audit trail)
    const serverPersisted = await persistVerificationAudit(auditData);
    if (!serverPersisted) {
      throw new Error('Failed to save verification to server. Please try again.');
    }

    // Also persist to localStorage as fallback
    persistLockedParcel(locked);
    dispatch({ type: 'LOCK_PARCEL', parcel: locked });
    return locked;
  }, [state.selectedCandidate, state.inputMode, state.rawInput, state.candidates, state.warnings, state.mapState]);

  const unlockParcel = useCallback(() => {
    clearLockedParcel();
    dispatch({ type: 'UNLOCK_PARCEL' });
  }, []);

  const addWarning = useCallback((warning: string) => {
    dispatch({ type: 'ADD_WARNING', warning });
  }, []);

  const clearWarnings = useCallback(() => {
    dispatch({ type: 'CLEAR_WARNINGS' });
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    dispatch({ type: 'SET_LOADING', isLoading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', error });
  }, []);

  const reset = useCallback(() => {
    clearLockedParcel();
    dispatch({ type: 'RESET' });
  }, []);

  const recoverFromStorage = useCallback((): SelectedParcel | null => {
    const stored = retrieveLockedParcel();
    if (stored) {
      dispatch({ type: 'LOCK_PARCEL', parcel: stored });
    }
    return stored;
  }, []);

  const value: ParcelSelectionContextValue = {
    state,
    setInputMode,
    setCandidates,
    selectCandidate,
    clearSelection,
    updateVerificationCheck,
    canLock,
    setTypedConfirmation,
    setRawInput,
    setMapState,
    lockParcel,
    unlockParcel,
    addWarning,
    clearWarnings,
    setLoading,
    setError,
    reset,
    recoverFromStorage,
  };

  return (
    <ParcelSelectionContext.Provider value={value}>
      {children}
    </ParcelSelectionContext.Provider>
  );
}

export function useParcelSelection(): ParcelSelectionContextValue {
  const context = useContext(ParcelSelectionContext);
  if (!context) {
    throw new Error('useParcelSelection must be used within a ParcelSelectionProvider');
  }
  return context;
}
