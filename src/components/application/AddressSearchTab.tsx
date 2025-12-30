/**
 * Address Search Tab — STRICT INPUT FLOW
 * 
 * Non-negotiable behavior:
 * 1. User MUST select a suggestion (typing alone does nothing)
 * 2. Only street addresses accepted (no POIs, businesses, cities)
 * 3. Selected address MUST pass validation before search proceeds
 * 4. Clear visual feedback for selection state
 * 
 * NO EXCEPTIONS.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { logger } from "@/lib/logger";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Loader2, MapPin, Crosshair, Check, X, Star, Clock, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useParcelSelection } from "@/contexts/ParcelSelectionContext";
import { searchResultToCandidate } from "@/lib/parcelLock";
import type { CandidateParcel } from "@/types/parcelSelection";
import { motion, AnimatePresence } from "framer-motion";
import { 
  parseAddressString, 
  validateAddressComponents, 
  isValidStreetAddress,
  isInTexas 
} from "@/lib/addressValidation";
import { PARCEL_ERRORS } from "@/lib/parcelErrors";
import { useSearchHistory, SavedLocation } from "@/hooks/useSearchHistory";

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
  place_id?: string;
  addressDetails?: {
    county?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    neighborhood?: string;
  };
}

// Selection state for visual feedback
type SelectionState = 'empty' | 'typing' | 'validated' | 'error';

export function AddressSearchTab({
  onCandidatesFound,
  onNavigateToLocation,
  mapCenter,
}: AddressSearchTabProps) {
  const { setLoading, addWarning, clearWarnings, setRawInput } = useParcelSelection();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  // Search history hook
  const { 
    recentSearches, 
    favorites, 
    addSearch, 
    toggleFavorite, 
    clearHistory,
    isLoading: historyLoading 
  } = useSearchHistory({ maxRecent: 5, maxFavorites: 10 });
  
  // CRITICAL: Track selection state
  const [hasSelectedSuggestion, setHasSelectedSuggestion] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [selectionState, setSelectionState] = useState<SelectionState>('empty');
  
  // Keyboard navigation
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Combined items for history dropdown (favorites first, then recent)
  const historyItems = [...favorites, ...recentSearches];

  // Debounced autocomplete - only when NOT selected
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // CRITICAL: Don't fetch suggestions if user has already selected
    if (hasSelectedSuggestion) {
      return;
    }

    if (query.trim().length >= 3) {
      debounceRef.current = setTimeout(async () => {
        try {
          const { data, error } = await supabase.functions.invoke('search-parcels', {
            body: { query: query.trim(), type: 'address' }
          });

          console.debug('[AddressSearchTab] API response:', { 
            query: query.trim(), 
            resultsCount: data?.results?.length || 0,
            results: data?.results?.slice(0, 3)
          });

          if (!error && data?.results?.length > 0) {
            // Filter to only valid street addresses
            const allResults = data.results.slice(0, 8);
            const addressSuggestions = allResults
              .filter((r: any) => isValidStreetAddress(r.formatted_address))
              .slice(0, 5)
              .map((r: any) => ({
                label: r.formatted_address?.replace(/^[,\s]+/, '').trim() || r.formatted_address,
                description: r.county ? `${r.county} County` : 'Texas',
                lat: r.lat,
                lng: r.lng,
              }));
            
            console.debug('[AddressSearchTab] Filtered suggestions:', {
              beforeFilter: allResults.length,
              afterFilter: addressSuggestions.length,
              suggestions: addressSuggestions
            });
            
            setSuggestions(addressSuggestions);
            setShowSuggestions(true);
            setHighlightedIndex(-1);
            
            // Show feedback if all results were filtered out
            if (addressSuggestions.length === 0 && allResults.length > 0) {
              setErrorMessage("No valid street addresses found. Try entering a complete address with street number.");
            }
          } else if (!error && data?.results?.length === 0) {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } catch (err) {
          logger.error('[AddressSearchTab] Autocomplete error:', err);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setErrorMessage(null);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, hasSelectedSuggestion]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // CRITICAL: Never allow Enter to bypass selection requirement
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (showSuggestions && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        // Select highlighted suggestion
        handleSuggestionClick(suggestions[highlightedIndex]);
      } else if (!hasSelectedSuggestion) {
        // Show error - must select from list
        setErrorMessage(PARCEL_ERRORS.SELECTION_REQUIRED);
        setSelectionState('error');
      } else if (hasSelectedSuggestion && selectedSuggestion) {
        // Already selected, trigger search
        handleSearch();
      }
      return;
    }

    if (!showSuggestions || suggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // When user types, reset selection state
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setErrorMessage(null);
    
    // CRITICAL: Typing clears any previous selection
    if (hasSelectedSuggestion) {
      setHasSelectedSuggestion(false);
      setSelectedSuggestion(null);
    }
    
    setSelectionState(newValue.length > 0 ? 'typing' : 'empty');
    setShowSuggestions(true);
  };

  // Handle suggestion click - this is the ONLY valid path forward
  const handleSuggestionClick = async (suggestion: Suggestion) => {
    console.debug('[AddressSearchTab] Suggestion clicked:', suggestion);
    
    setQuery(suggestion.label);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    setErrorMessage(null);
    clearWarnings();

    // Validate address components
    const components = parseAddressString(suggestion.label);
    console.debug('[AddressSearchTab] Parsed components:', components);
    
    const validation = validateAddressComponents(
      components, 
      suggestion.lat, 
      suggestion.lng
    );
    console.debug('[AddressSearchTab] Validation result:', validation);

    if (!validation.valid) {
      // HARD GATE: Always block invalid addresses - no exceptions
      setErrorMessage(validation.message);
      setSelectionState('error');
      setHasSelectedSuggestion(false);
      setQuery(''); // Clear input to force re-selection
      return;
    }

    // Check if in Texas - but Nominatim may not include "TX" in address
    // If we have coordinates in Texas bounding box, allow it
    const isTexasByCoords = suggestion.lat && suggestion.lng && 
      suggestion.lat >= 25.8 && suggestion.lat <= 36.5 &&
      suggestion.lng >= -106.6 && suggestion.lng <= -93.5;
    
    if (!isInTexas(suggestion.label) && !isTexasByCoords) {
      setErrorMessage(PARCEL_ERRORS.NOT_IN_TEXAS);
      setSelectionState('error');
      setHasSelectedSuggestion(false);
      return;
    }

    // VALID SELECTION
    setSelectedSuggestion(suggestion);
    setHasSelectedSuggestion(true);
    setSelectionState('validated');
    setRawInput(suggestion.label);

    // Navigate map to location
    if (suggestion.lat && suggestion.lng) {
      onNavigateToLocation(suggestion.lat, suggestion.lng, 17);
    }

    // AUTO-TRIGGER SEARCH after valid selection
    setTimeout(() => {
      handleSearchWithSuggestion(suggestion);
    }, 100);
  };

  // Search for parcels - called directly with suggestion for auto-trigger
  const handleSearchWithSuggestion = useCallback(async (suggestion: Suggestion) => {
    if (!suggestion.lat || !suggestion.lng) {
      setErrorMessage(PARCEL_ERRORS.NO_COORDINATES);
      return;
    }

    setIsSearching(true);
    setLoading(true);
    setErrorMessage(null);

    try {
      // First search with 50m radius
      const { data, error } = await supabase.functions.invoke('search-parcels', {
        body: { 
          query: suggestion.label, 
          type: 'address', 
          radius: 50,
          lat: suggestion.lat,
          lng: suggestion.lng
        }
      });

      if (error) throw error;

      let candidates: CandidateParcel[] = [];

      if (data?.results?.length > 0) {
        // Deduplicate by parcel_id (defensive layer - server should also dedupe)
        const seenParcelIds = new Set<string>();
        candidates = data.results
          .filter((r: any) => r.parcel)
          .filter((r: any) => {
            if (seenParcelIds.has(r.parcel.parcel_id)) return false;
            seenParcelIds.add(r.parcel.parcel_id);
            return true;
          })
          .map((r: any) => searchResultToCandidate(
            r.parcel,
            r.county || 'unknown',
            r.confidence || 0.8,
            'external'
          ));
      }

      // Fallback: Expand radius to 150m if no results
      if (candidates.length === 0) {
        logger.debug('AddressSearchTab', 'Expanding search radius to 150m');
        
        const { data: expandedData } = await supabase.functions.invoke('search-parcels', {
          body: { 
            query: suggestion.label, 
            type: 'address', 
            radius: 150,
            lat: suggestion.lat,
            lng: suggestion.lng
          }
        });

        // Deduplicate by parcel_id (defensive layer)
        const seenParcelIds = new Set<string>();
        candidates = (expandedData?.results || [])
          .filter((r: any) => r.parcel)
          .filter((r: any) => {
            if (seenParcelIds.has(r.parcel.parcel_id)) return false;
            seenParcelIds.add(r.parcel.parcel_id);
            return true;
          })
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

      // Handle results with VERBATIM messages
      if (candidates.length === 0) {
        setErrorMessage(PARCEL_ERRORS.NOT_FOUND);
        onCandidatesFound([]);
      } else if (candidates.length === 1) {
        // Single parcel found - save to history
        addSearch({
          label: suggestion.label,
          query: suggestion.label,
          queryType: 'address',
          lat: suggestion.lat,
          lng: suggestion.lng,
          county: suggestion.addressDetails?.county,
        });
        onCandidatesFound(candidates);
      } else {
        // Multiple parcels - still save to history (user will pick one)
        addSearch({
          label: suggestion.label,
          query: suggestion.label,
          queryType: 'address',
          lat: suggestion.lat,
          lng: suggestion.lng,
          county: suggestion.addressDetails?.county,
        });
        setErrorMessage(PARCEL_ERRORS.MULTIPLE_PARCELS);
        onCandidatesFound(candidates);
      }

    } catch (err) {
      logger.error('[AddressSearchTab] Search error:', err);
      setErrorMessage(PARCEL_ERRORS.RESOLUTION_FAILED);
      onCandidatesFound([]);
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  }, [onCandidatesFound, setLoading, addWarning, addSearch]);

  // Wrapper for button click (uses state)
  const handleSearch = useCallback(() => {
    if (!hasSelectedSuggestion || !selectedSuggestion) {
      setErrorMessage(PARCEL_ERRORS.SELECTION_REQUIRED);
      return;
    }
    handleSearchWithSuggestion(selectedSuggestion);
  }, [hasSelectedSuggestion, selectedSuggestion, handleSearchWithSuggestion]);

  // Near me functionality
  const handleNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation not supported by your browser.");
      return;
    }

    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onNavigateToLocation(latitude, longitude, 17);
        setIsSearching(false);
      },
      () => {
        setIsSearching(false);
        setErrorMessage("Unable to get your location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onNavigateToLocation]);

  // Clear selection and reset
  const handleClear = () => {
    setQuery('');
    setHasSelectedSuggestion(false);
    setSelectedSuggestion(null);
    setSelectionState('empty');
    setErrorMessage(null);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  // Handle click on history item (recent or favorite)
  const handleHistoryItemClick = (item: SavedLocation) => {
    const suggestion: Suggestion = {
      label: item.label,
      description: item.county ? `${item.county} County` : 'Texas',
      lat: item.lat,
      lng: item.lng,
    };
    handleSuggestionClick(suggestion);
  };

  // Toggle star on history item (prevent propagation)
  const handleToggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleFavorite(id);
  };

  // Show history dropdown when focused and query is short
  const showHistoryDropdown = isFocused && query.length < 3 && !hasSelectedSuggestion && historyItems.length > 0;

  // Get input border class based on state
  const getInputBorderClass = () => {
    switch (selectionState) {
      case 'validated':
        return 'border-green-500 focus-visible:ring-green-500';
      case 'error':
        return 'border-destructive focus-visible:ring-destructive';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              placeholder="Type address, e.g. 1234 Main St, Houston TX"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setIsFocused(true);
                if (suggestions.length > 0 && !hasSelectedSuggestion) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                // Delay to allow click on suggestion/history item
                setTimeout(() => {
                  setShowSuggestions(false);
                  setIsFocused(false);
                }, 200);
              }}
              className={`pr-16 ${getInputBorderClass()}`}
              autoComplete="off"
            />
            
            {/* Right side indicators */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {selectionState === 'validated' && (
                <Check className="h-4 w-4 text-green-500" />
              )}
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
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

        {/* History Dropdown (Favorites + Recent) - shown when input focused and query is short */}
        <AnimatePresence>
          {showHistoryDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden"
            >
              <div className="max-h-[280px] overflow-y-auto">
                {/* Favorites Section */}
                {favorites.length > 0 && (
                  <div>
                    <div className="px-3 py-2 flex items-center gap-2 border-b border-border/50 bg-muted/20">
                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-medium text-muted-foreground">Favorites</span>
                    </div>
                    <ul className="py-1">
                      {favorites.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            title={item.label}
                            className="w-full px-3 py-2.5 text-left transition-colors flex items-start gap-3 hover:bg-muted/50 group"
                            onClick={() => handleHistoryItemClick(item)}
                          >
                            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground line-clamp-1">{item.label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.county ? `${item.county} County` : 'Texas'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleToggleFavorite(e, item.id)}
                              className="p-1 hover:bg-muted rounded shrink-0"
                              title="Remove from favorites"
                            >
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            </button>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recent Searches Section */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="px-3 py-2 flex items-center justify-between border-b border-border/50 bg-muted/20">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Recent Searches</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearHistory();
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Clear
                      </button>
                    </div>
                    <ul className="py-1">
                      {recentSearches.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            title={item.label}
                            className="w-full px-3 py-2.5 text-left transition-colors flex items-start gap-3 hover:bg-muted/50 group"
                            onClick={() => handleHistoryItemClick(item)}
                          >
                            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground line-clamp-1">{item.label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.county ? `${item.county} County` : 'Texas'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleToggleFavorite(e, item.id)}
                              className="p-1 hover:bg-muted rounded shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Add to favorites"
                            >
                              <Star className="h-4 w-4 text-muted-foreground hover:text-yellow-500" />
                            </button>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Empty state */}
                {historyItems.length === 0 && !historyLoading && (
                  <div className="px-3 py-4 text-center">
                    <p className="text-xs text-muted-foreground">Your recent searches will appear here</p>
                  </div>
                )}
              </div>
              
              {/* Tip at bottom */}
              <div className="px-3 py-1.5 border-t border-border/50 bg-muted/30">
                <p className="text-[10px] text-muted-foreground text-center">
                  <Star className="h-3 w-3 inline mr-1" />
                  Star addresses to keep them pinned
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestions Dropdown (from API) */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden"
            >
              <ul className="py-1 max-h-[220px] overflow-y-auto">
                {suggestions.map((suggestion, idx) => {
                  const fullAddress = suggestion.description || suggestion.label;
                  const secondaryText = suggestion.addressDetails?.county 
                    ? `${suggestion.addressDetails.county} County${suggestion.addressDetails?.zipCode ? ` • ${suggestion.addressDetails.zipCode}` : ''}`
                    : suggestion.description;
                  
                  return (
                    <li key={idx}>
                      <button
                        type="button"
                        title={fullAddress}
                        className={`w-full px-3 py-2.5 text-left transition-colors flex items-start gap-3 ${
                          idx === highlightedIndex ? 'bg-primary/10' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                      >
                        <MapPin className={`h-4 w-4 mt-0.5 shrink-0 transition-colors ${
                          idx === highlightedIndex ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground line-clamp-2">{suggestion.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{secondaryText}</p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {/* Keyboard navigation hint */}
              <div className="px-3 py-1.5 border-t border-border/50 bg-muted/30">
                <p className="text-[10px] text-muted-foreground text-center">
                  <kbd className="px-1 py-0.5 bg-background rounded text-[9px] font-mono">↑</kbd>
                  <kbd className="px-1 py-0.5 bg-background rounded text-[9px] font-mono ml-0.5">↓</kbd>
                  <span className="mx-1.5">navigate</span>
                  <kbd className="px-1 py-0.5 bg-background rounded text-[9px] font-mono">↵</kbd>
                  <span className="ml-1.5">select</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error/Warning Alert */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert variant={
              errorMessage === PARCEL_ERRORS.MULTIPLE_PARCELS
                ? 'default'
                : 'destructive'
            }>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Again Button - only shown after search or if no results */}
      {hasSelectedSuggestion && !isSearching && (
        <Button
          onClick={handleSearch}
          variant="outline"
          className="w-full"
        >
          <Search className="mr-2 h-4 w-4" />
          Search Again
        </Button>
      )}

      {/* Loading indicator during auto-search */}
      {isSearching && (
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Locating parcel boundaries...</span>
        </div>
      )}

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground text-center">
        {!hasSelectedSuggestion 
          ? "e.g. 1616 Post Oak Blvd, Houston TX"
          : ""
        }
      </p>
    </div>
  );
}
