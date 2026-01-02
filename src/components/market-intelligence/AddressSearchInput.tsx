import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from "@/lib/logger";
import { Search, MapPin, Loader2, AlertCircle } from 'lucide-react';
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

// Expanded Texas city defaults for CRE markets
const DEFAULT_SUGGESTIONS: Suggestion[] = [
  // Houston Metro
  { place_id: 'houston', description: 'Downtown Houston, TX', lat: 29.7604, lng: -95.3698 },
  { place_id: 'woodlands', description: 'The Woodlands, TX', lat: 30.1658, lng: -95.4613 },
  { place_id: 'sugarland', description: 'Sugar Land, TX', lat: 29.6196, lng: -95.6349 },
  { place_id: 'katy', description: 'Katy, TX', lat: 29.7858, lng: -95.8245 },
  { place_id: 'pearland', description: 'Pearland, TX', lat: 29.5636, lng: -95.2860 },
  { place_id: 'cypress', description: 'Cypress, TX', lat: 29.9691, lng: -95.6970 },
  { place_id: 'conroe', description: 'Conroe, TX', lat: 30.3119, lng: -95.4560 },
  // Austin Metro
  { place_id: 'austin', description: 'Austin, TX', lat: 30.2672, lng: -97.7431 },
  { place_id: 'roundrock', description: 'Round Rock, TX', lat: 30.5083, lng: -97.6789 },
  { place_id: 'cedarpark', description: 'Cedar Park, TX', lat: 30.5052, lng: -97.8203 },
  { place_id: 'georgetown', description: 'Georgetown, TX', lat: 30.6333, lng: -97.6780 },
  // San Antonio Metro
  { place_id: 'sanantonio', description: 'San Antonio, TX', lat: 29.4241, lng: -98.4936 },
  { place_id: 'newbraunfels', description: 'New Braunfels, TX', lat: 29.7030, lng: -98.1245 },
  // Dallas-Fort Worth Metro
  { place_id: 'dallas', description: 'Dallas, TX', lat: 32.7767, lng: -96.7970 },
  { place_id: 'fortworth', description: 'Fort Worth, TX', lat: 32.7555, lng: -97.3308 },
  { place_id: 'plano', description: 'Plano, TX', lat: 33.0198, lng: -96.6989 },
  { place_id: 'frisco', description: 'Frisco, TX', lat: 33.1507, lng: -96.8236 },
  { place_id: 'arlington', description: 'Arlington, TX', lat: 32.7357, lng: -97.1081 },
  { place_id: 'mckinney', description: 'McKinney, TX', lat: 33.1972, lng: -96.6397 },
  { place_id: 'denton', description: 'Denton, TX', lat: 33.2148, lng: -97.1331 },
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
  const [isOfflineMode, setIsOfflineMode] = useState(false);
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
      // NOMINATIM-FIRST STRATEGY: Try free Nominatim first to reduce Google costs
      const { data: nominatimData, error: nominatimError } = await supabase.functions.invoke('nominatim-autocomplete', {
        body: { input: value }
      });

      if (!nominatimError && nominatimData?.predictions && nominatimData.predictions.length > 0) {
        setIsOfflineMode(false);
        setSuggestions(nominatimData.predictions.map((p: any) => ({
          place_id: p.place_id,
          description: p.description,
          lat: p.lat,
          lng: p.lng,
        })));
        logger.log('Nominatim returned results, skipping Google API');
        return;
      }

      // Fallback to Google only if Nominatim returned no results
      logger.log('Nominatim returned no results, falling back to Google');
      const { data, error } = await supabase.functions.invoke('google-places', {
        body: { input: value }
      });

      if (!error && data?.predictions && data.predictions.length > 0 && data?.status !== 'REQUEST_DENIED') {
        setIsOfflineMode(false);
        setSuggestions(data.predictions.map((p: any) => ({
          place_id: p.place_id,
          description: p.description,
        })));
        return;
      }

      // Both APIs returned no results - use defaults
      logger.warn('Both Nominatim and Google returned no results, using defaults');
      setIsOfflineMode(true);
      const filtered = DEFAULT_SUGGESTIONS.filter(s => 
        s.description.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.length > 0 ? filtered : DEFAULT_SUGGESTIONS.slice(0, 5));
    } catch (err) {
      logger.error('Search error:', err);
      setIsOfflineMode(true);
      const filtered = DEFAULT_SUGGESTIONS.filter(s => 
        s.description.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.length > 0 ? filtered : DEFAULT_SUGGESTIONS.slice(0, 5));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search - 400ms to reduce API calls
  const debouncedSearch = useCallback(
    debounce((value: string) => fetchSuggestions(value), 400),
    [fetchSuggestions]
  );

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setShowSuggestions(true);
    debouncedSearch(value);
  }, [debouncedSearch]);

  // Direct geocode on Enter key
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.length >= 3) {
      e.preventDefault();
      setShowSuggestions(false);
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase.functions.invoke('geocode-with-cache', {
          body: { query: query, query_type: 'address' }
        });

        if (!error && data) {
          const lat = data.lat || data.latitude;
          const lng = data.lng || data.longitude;
          if (lat && lng) {
            onSelect(lat, lng, query);
          }
        }
      } catch (err) {
        logger.error('Direct geocode error:', err);
      } finally {
        setIsLoading(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

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
        logger.error('Geocode error:', error);
        return;
      }

      if (data?.lat && data?.lng) {
        onSelect(data.lat, data.lng, suggestion.description);
      } else if (data?.latitude && data?.longitude) {
        onSelect(data.latitude, data.longitude, suggestion.description);
      }
    } catch (err) {
      logger.error('Geocode error:', err);
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
          onKeyDown={handleKeyDown}
          placeholder="Search address or select a city..."
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

      {/* Offline mode indicator */}
      {isOfflineMode && query.length >= 3 && (
        <div className="flex items-center gap-1.5 mt-1 px-2 text-xs text-amber-600">
          <AlertCircle className="h-3 w-3" />
          <span>Using preset locations. Press Enter to search any address.</span>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || query.length === 0) && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-h-80 overflow-y-auto">
          {query.length === 0 && (
            <div className="px-4 py-2 text-xs font-medium text-slate-500 bg-slate-50">
              Texas CRE Markets
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
          {query.length >= 3 && (
            <div className="px-4 py-2 text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
              Press Enter to search "{query}"
            </div>
          )}
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
