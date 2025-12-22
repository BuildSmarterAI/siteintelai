/**
 * Address Search Tab
 * Mode A: Property address search with autocomplete and radius expansion.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { logger } from "@/lib/logger";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Loader2, MapPin, AlertTriangle, Crosshair } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useParcelSelection } from "@/contexts/ParcelSelectionContext";
import { searchResultToCandidate } from "@/lib/parcelLock";
import type { CandidateParcel } from "@/types/parcelSelection";
import { motion, AnimatePresence } from "framer-motion";

interface AddressSearchTabProps {
  onCandidatesFound: (candidates: CandidateParcel[]) => void;
  onNavigateToLocation: (lat: number, lng: number, zoom?: number) => void;
  mapCenter: [number, number];
}

interface Suggestion {
  label: string;
  description: string;
  lat?: number;
  lng?: number;
}

export function AddressSearchTab({
  onCandidatesFound,
  onNavigateToLocation,
  mapCenter,
}: AddressSearchTabProps) {
  const { setLoading, addWarning, clearWarnings } = useParcelSelection();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [precisionWarning, setPrecisionWarning] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced autocomplete
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length >= 3) {
      debounceRef.current = setTimeout(async () => {
        try {
          const { data, error } = await supabase.functions.invoke('search-parcels', {
            body: { query: query.trim(), type: 'address' }
          });

          if (!error && data?.results?.length > 0) {
            setSuggestions(data.results.slice(0, 5).map((r: any) => ({
              label: r.formatted_address,
              description: r.county ? `${r.county} County` : 'Texas',
              lat: r.lat,
              lng: r.lng,
            })));
            setShowSuggestions(true);
          }
        } catch (err) {
          logger.error('[AddressSearchTab] Autocomplete error:', err);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    clearWarnings();
    setPrecisionWarning(null);
    setIsSearching(true);
    setLoading(true);
    setShowSuggestions(false);

    try {
      // First search with 50m radius
      const { data, error } = await supabase.functions.invoke('search-parcels', {
        body: { query: q.trim(), type: 'address', radius: 50 }
      });

      if (error) throw error;

      // Check geocode precision
      if (data?.results?.[0]?.precision === 'approximate') {
        setPrecisionWarning("Address resolved approximately. Parcel verification required.");
        addWarning("Address resolved approximately. Parcel verification required.");
      }

      let candidates: CandidateParcel[] = [];

      if (data?.results?.length > 0) {
        // Navigate to first result
        const first = data.results[0];
        if (first.lat && first.lng) {
          onNavigateToLocation(first.lat, first.lng, 17);
        }

        // Convert results to candidates
        candidates = data.results
          .filter((r: any) => r.parcel)
          .map((r: any) => searchResultToCandidate(
            r.parcel,
            r.county || 'unknown',
            r.confidence || 0.8,
            'external'
          ));
      }

      // If no candidates found, try expanded radius (150m)
      if (candidates.length === 0) {
        logger.debug('AddressSearchTab', 'Expanding search radius to 150m');
        
        const { data: expandedData } = await supabase.functions.invoke('search-parcels', {
          body: { query: q.trim(), type: 'address', radius: 150 }
        });

        if (expandedData?.results?.[0]?.lat) {
          onNavigateToLocation(expandedData.results[0].lat, expandedData.results[0].lng, 17);
        }

        candidates = (expandedData?.results || [])
          .filter((r: any) => r.parcel)
          .map((r: any) => searchResultToCandidate(
            r.parcel,
            r.county || 'unknown',
            r.confidence || 0.7,
            'external'
          ));

        if (candidates.length > 0) {
          addWarning("Results found with expanded search radius.");
        }
      }

      if (candidates.length === 0) {
        toast.error("No parcels found. Try a different address or use CAD number.");
      } else {
        onCandidatesFound(candidates);
        toast.success(`Found ${candidates.length} parcel${candidates.length > 1 ? 's' : ''}`);
      }
    } catch (err) {
      logger.error('[AddressSearchTab] Search error:', err);
      toast.error("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  }, [query, onCandidatesFound, onNavigateToLocation, setLoading, addWarning, clearWarnings]);

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setQuery(suggestion.label);
    setShowSuggestions(false);
    handleSearch(suggestion.label);
  };

  const handleNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser.");
      return;
    }

    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onNavigateToLocation(latitude, longitude, 17);
        setIsSearching(false);
        toast.success("Map centered on your location");
      },
      () => {
        setIsSearching(false);
        toast.error("Unable to get your location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onNavigateToLocation]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              placeholder="Enter property address..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => handleSearch()}
              disabled={isSearching || !query.trim()}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNearMe}
            disabled={isSearching}
            title="Use my location"
          >
            <Crosshair className="h-4 w-4" />
          </Button>
        </div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-12 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-[200px] overflow-y-auto"
            >
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  className="w-full px-3 py-2 text-left hover:bg-accent/50 transition-colors flex items-start gap-2"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{suggestion.label}</p>
                    <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Precision Warning */}
      {precisionWarning && (
        <Alert variant="destructive" className="bg-warning/10 border-warning text-warning-foreground">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{precisionWarning}</AlertDescription>
        </Alert>
      )}

      {/* Help Text */}
      <p className="text-xs text-muted-foreground">
        Enter a full address including city and ZIP for best results. The system will find parcels within 50m, expanding to 150m if needed.
      </p>
    </div>
  );
}
