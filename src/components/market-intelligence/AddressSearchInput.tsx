import { useState, useCallback } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

// Houston area default suggestions
const DEFAULT_SUGGESTIONS: Suggestion[] = [
  { place_id: '1', description: 'Downtown Houston, TX', lat: 29.7604, lng: -95.3698 },
  { place_id: '2', description: 'The Woodlands, TX', lat: 30.1658, lng: -95.4613 },
  { place_id: '3', description: 'Sugar Land, TX', lat: 29.6196, lng: -95.6349 },
  { place_id: '4', description: 'Katy, TX', lat: 29.7858, lng: -95.8245 },
  { place_id: '5', description: 'Pearland, TX', lat: 29.5636, lng: -95.2860 },
];

export function AddressSearchInput({ onSelect, className }: AddressSearchInputProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = useCallback(async (value: string) => {
    setQuery(value);
    
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    // Filter default suggestions based on query
    const filtered = DEFAULT_SUGGESTIONS.filter(s => 
      s.description.toLowerCase().includes(value.toLowerCase())
    );
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 200));
    
    setSuggestions(filtered.length > 0 ? filtered : DEFAULT_SUGGESTIONS.slice(0, 3));
    setIsLoading(false);
    setShowSuggestions(true);
  }, []);

  const handleSelect = (suggestion: Suggestion) => {
    if (suggestion.lat && suggestion.lng) {
      setQuery(suggestion.description);
      setShowSuggestions(false);
      onSelect(suggestion.lat, suggestion.lng, suggestion.description);
    }
  };

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
