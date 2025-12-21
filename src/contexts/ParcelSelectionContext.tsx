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
} from '@/types/parcelSelection';
import {
  createLockedParcel,
  persistLockedParcel,
  clearLockedParcel,
  retrieveLockedParcel,
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
  lockedParcel: null,
  warnings: [],
  isLoading: false,
  error: null,
};

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
        warnings: [],
      };

    case 'SET_CANDIDATES':
      return {
        ...state,
        candidates: action.candidates,
        selectedCandidate: null,
        isVerified: false,
        verificationChecks: initialState.verificationChecks,
      };

    case 'SELECT_CANDIDATE':
      return {
        ...state,
        selectedCandidate: action.candidate,
        isVerified: false,
        verificationChecks: initialState.verificationChecks,
      };

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedCandidate: null,
        isVerified: false,
        verificationChecks: initialState.verificationChecks,
      };

    case 'UPDATE_VERIFICATION_CHECK': {
      const newChecks = {
        ...state.verificationChecks,
        [action.check]: action.value,
      };
      // All three checks must be true to be verified
      const isVerified = 
        newChecks.correctBoundary && 
        newChecks.locationMatches && 
        newChecks.understandsAnalysis;
      
      return {
        ...state,
        verificationChecks: newChecks,
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
  // Locking
  lockParcel: () => Promise<void>;
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
    dispatch({ type: 'UPDATE_VERIFICATION_CHECK', check, value });
  }, []);

  // Can lock when all verification checks are complete and a candidate is selected
  const canLock = state.isVerified && state.selectedCandidate !== null && state.selectedCandidate.geom !== null;

  const lockParcel = useCallback(async () => {
    if (!state.selectedCandidate || !state.selectedCandidate.geom) {
      throw new Error('No candidate selected or candidate has no geometry');
    }
    if (!state.isVerified) {
      throw new Error('Parcel must be verified before locking');
    }

    const locked = await createLockedParcel(state.selectedCandidate, state.inputMode);
    persistLockedParcel(locked);
    dispatch({ type: 'LOCK_PARCEL', parcel: locked });
  }, [state.selectedCandidate, state.inputMode, state.isVerified]);

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
