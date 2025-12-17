import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface AddressSearchInputProps {
  onSelect: (lat: number, lng: number, address: string) => void;
  className?: string;
}

interface Suggestion {
  place_id: string;
  description: string;
  lat?: number;
  lng?: number;
}

// Houston area default suggestions as fallback
const DEFAULT_SUGGESTIONS: Suggestion[] = [
  { place_id: '1', description: 'Downtown Houston, TX', lat: 29.7604, lng: -95.3698 },
  { place_id: '2', description: 'The Woodlands, TX', lat: 30.1658, lng: -95.4613 },
  { place_id: '3', description: 'Sugar Land, TX', lat: 29.6196, lng: -95.6349 },
  { place_id: '4', description: 'Austin, TX', lat: 30.2672, lng: -97.7431 },
  { place_id: '5', description: 'Dallas, TX', lat: 32.7767, lng: -96.7970 },
];

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function AddressSearchInput({ onSelect, className }: AddressSearchInputProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(async (value: string) => {
    if (value.length < 3) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-places', {
        body: { input: value }
      });

      if (error) {
        console.error('Google Places error:', error);
        setSuggestions(DEFAULT_SUGGESTIONS.slice(0, 3));
        return;
      }

      if (data?.predictions && data.predictions.length > 0) {
        setSuggestions(data.predictions.map((p: any) => ({
          place_id: p.place_id,
          description: p.description,
        })));
      } else {
        // No results, show defaults
        setSuggestions(DEFAULT_SUGGESTIONS.slice(0, 3));
      }
    } catch (err) {
      console.error('Search error:', err);
      setSuggestions(DEFAULT_SUGGESTIONS.slice(0, 3));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value: string) => fetchSuggestions(value), 300),
    [fetchSuggestions]
  );

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setShowSuggestions(true);
    debouncedSearch(value);
  }, [debouncedSearch]);

  const handleSelect = async (suggestion: Suggestion) => {
    setQuery(suggestion.description);
    setShowSuggestions(false);

    // If already has coords (from defaults), use them directly
    if (suggestion.lat && suggestion.lng) {
      onSelect(suggestion.lat, suggestion.lng, suggestion.description);
      return;
    }

    // Otherwise, geocode the address
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-with-cache', {
        body: { query: suggestion.description, query_type: 'address' }
      });

      if (error) {
        console.error('Geocode error:', error);
        return;
      }

      if (data?.lat && data?.lng) {
        onSelect(data.lat, data.lng, suggestion.description);
      } else if (data?.latitude && data?.longitude) {
        // Handle alternate response format
        onSelect(data.latitude, data.longitude, suggestion.description);
      }
    } catch (err) {
      console.error('Geocode error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Search address or location..."
          className={cn(
            "w-full pl-10 pr-10 py-3 rounded-xl",
            "bg-white border border-slate-200",
            "text-slate-900 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--data-cyan))] focus:border-transparent",
            "transition-all"
          )}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 animate-spin" />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || query.length === 0) && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {query.length === 0 && (
            <div className="px-4 py-2 text-xs font-medium text-slate-500 bg-slate-50">
              Popular Locations
            </div>
          )}
          <ul>
            {(suggestions.length > 0 ? suggestions : DEFAULT_SUGGESTIONS).map((suggestion) => (
              <li key={suggestion.place_id}>
                <button
                  onClick={() => handleSelect(suggestion)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{suggestion.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Click outside to close */}
      {showSuggestions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSuggestions(false)} 
        />
      )}
    </div>
  );
}
