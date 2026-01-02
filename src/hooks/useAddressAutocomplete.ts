import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  fetchAutocompleteSuggestions, 
  AutocompletePrediction, 
  AutocompleteResponse,
  generateSessionToken,
  resetSessionToken
} from '@/services/addressAutocomplete';

interface UseAddressAutocompleteOptions {
  debounceMs?: number;
  minChars?: number;
  limit?: number;
  preferredProvider?: 'auto' | 'nominatim' | 'google';
  onError?: (error: string) => void;
}

interface UseAddressAutocompleteReturn {
  query: string;
  setQuery: (q: string) => void;
  suggestions: AutocompletePrediction[];
  isLoading: boolean;
  error: string | null;
  cacheHit: boolean;
  provider: 'nominatim' | 'google' | 'none' | null;
  traceId: string | null;
  requestCost: number;
  totalCost: number;
  clear: () => void;
  selectSuggestion: (suggestion: AutocompletePrediction) => void;
  selectedSuggestion: AutocompletePrediction | null;
}

export function useAddressAutocomplete(
  options: UseAddressAutocompleteOptions = {}
): UseAddressAutocompleteReturn {
  const {
    debounceMs = 400,
    minChars = 3,
    limit = 5,
    preferredProvider = 'auto',
    onError
  } = options;

  const { user } = useAuth();
  
  const [query, setQueryState] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheHit, setCacheHit] = useState(false);
  const [provider, setProvider] = useState<'nominatim' | 'google' | 'none' | null>(null);
  const [traceId, setTraceId] = useState<string | null>(null);
  const [requestCost, setRequestCost] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AutocompletePrediction | null>(null);
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>('');

  // Session token for Google billing optimization
  const sessionToken = useMemo(() => generateSessionToken(), []);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.length < minChars) {
      setSuggestions([]);
      setProvider(null);
      return;
    }

    // Skip if same query
    if (input === lastQueryRef.current) {
      return;
    }
    lastQueryRef.current = input;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const response: AutocompleteResponse = await fetchAutocompleteSuggestions({
        input,
        sessionToken,
        userId: user?.id,
        preferredProvider,
        limit
      });

      // Check if this is still the current request
      if (input !== lastQueryRef.current) {
        return;
      }

      if (response.error) {
        setError(response.error);
        onError?.(response.error);
        setSuggestions([]);
      } else {
        setSuggestions(response.predictions);
        setCacheHit(response.cacheHit);
        setProvider(response.provider);
        setTraceId(response.traceId);
        setRequestCost(response.requestCost);
        setTotalCost(prev => prev + response.requestCost);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch suggestions';
      setError(message);
      onError?.(message);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [minChars, sessionToken, user?.id, preferredProvider, limit, onError]);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
    setSelectedSuggestion(null);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce the fetch
    debounceTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(q);
    }, debounceMs);
  }, [debounceMs, fetchSuggestions]);

  const clear = useCallback(() => {
    setQueryState('');
    setSuggestions([]);
    setError(null);
    setProvider(null);
    setTraceId(null);
    setRequestCost(0);
    setSelectedSuggestion(null);
    lastQueryRef.current = '';
    
    // Reset session token for next search session
    resetSessionToken();
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  const selectSuggestion = useCallback((suggestion: AutocompletePrediction) => {
    setSelectedSuggestion(suggestion);
    setQueryState(suggestion.description);
    setSuggestions([]);
    
    // Reset session token after selection (for Google billing)
    resetSessionToken();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    error,
    cacheHit,
    provider,
    traceId,
    requestCost,
    totalCost,
    clear,
    selectSuggestion,
    selectedSuggestion
  };
}
