import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MapPin, 
  Hash, 
  Navigation, 
  PenTool, 
  Loader2, 
  X,
  Crosshair,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type SearchMode = 'address' | 'apn' | 'intersection' | 'coords' | 'auto';

interface SmartParcelSearchProps {
  onAddressSelect: (lat: number, lng: number, address: string) => void;
  onParcelSelect: (parcel: any) => void;
  onNavigateToLocation: (lat: number, lng: number, zoom?: number) => void;
  onStartDraw: () => void;
  mapCenter: [number, number];
  currentAddress?: string;
  isDrawMode?: boolean;
}

interface SearchSuggestion {
  type: SearchMode;
  label: string;
  description: string;
  lat?: number;
  lng?: number;
  parcel?: any;
}

// Patterns for auto-detection
const PATTERNS = {
  coords: /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/,
  intersection: /\s*(&|and)\s*/i,
  apn: /^[\d\-]{8,15}$|^\d{10,13}$/,
  apnWithPrefix: /^[A-Z]{1,2}\d{6,12}$/i,
};

// County APN patterns for smart detection
const COUNTY_PATTERNS: Record<string, { pattern: RegExp; name: string; hint: string }> = {
  harris: { 
    pattern: /^\d{13}$|^\d{3}-\d{3}-\d{3}-\d{4}$/, 
    name: 'Harris County',
    hint: '13 digits (e.g., 1234567890123)'
  },
  fort_bend: { 
    pattern: /^\d{6,12}$/, 
    name: 'Fort Bend County',
    hint: '6-12 digits'
  },
  montgomery: { 
    pattern: /^[A-Z]\d{6,10}$|^\d{8,12}$/, 
    name: 'Montgomery County',
    hint: 'Letter + 6-10 digits or 8-12 digits'
  },
  galveston: {
    pattern: /^\d{5,10}$/,
    name: 'Galveston County',
    hint: '5-10 digits'
  },
  brazoria: {
    pattern: /^\d{6,11}$/,
    name: 'Brazoria County',
    hint: '6-11 digits'
  },
  travis: {
    pattern: /^\d{6,10}$/,
    name: 'Travis County',
    hint: '6-10 digits'
  },
  williamson: {
    pattern: /^R\d{6,9}$/i,
    name: 'Williamson County',
    hint: 'R + 6-9 digits (e.g., R123456)'
  },
};

function detectSearchMode(query: string): SearchMode {
  const trimmed = query.trim();
  
  if (PATTERNS.coords.test(trimmed)) return 'coords';
  if (PATTERNS.intersection.test(trimmed)) return 'intersection';
  
  const cleanQuery = trimmed.replace(/[\s\-]/g, '');
  if (PATTERNS.apn.test(cleanQuery) || PATTERNS.apnWithPrefix.test(cleanQuery)) return 'apn';
  
  return 'address';
}

function detectCountyFromAPN(apn: string): string | null {
  const cleanAPN = apn.replace(/[\s\-]/g, '');
  
  for (const [county, config] of Object.entries(COUNTY_PATTERNS)) {
    if (config.pattern.test(cleanAPN) || config.pattern.test(apn)) {
      return county;
    }
  }
  return null;
}

export function SmartParcelSearch({
  onAddressSelect,
  onParcelSelect,
  onNavigateToLocation,
  onStartDraw,
  mapCenter,
  currentAddress,
  isDrawMode = false,
}: SmartParcelSearchProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [detectedMode, setDetectedMode] = useState<SearchMode>('auto');
  const [detectedCounty, setDetectedCounty] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Update detected mode as user types
  useEffect(() => {
    if (query.trim().length > 2) {
      const mode = detectSearchMode(query);
      setDetectedMode(mode);
      
      if (mode === 'apn') {
        const county = detectCountyFromAPN(query);
        setDetectedCounty(county);
      } else {
        setDetectedCounty(null);
      }
    } else {
      setDetectedMode('auto');
      setDetectedCounty(null);
    }
  }, [query]);

  // Debounced search for suggestions
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length >= 3 && detectedMode === 'address') {
      debounceRef.current = setTimeout(async () => {
        try {
          const { data, error } = await supabase.functions.invoke('search-parcels', {
            body: { query: query.trim(), type: 'address' }
          });

          if (!error && data?.results) {
            setSuggestions(data.results.map((r: any) => ({
              type: r.type,
              label: r.formatted_address,
              description: r.county ? `${r.county} County` : 'Texas',
              lat: r.lat,
              lng: r.lng,
              parcel: r.parcel,
            })));
            setShowSuggestions(true);
          }
        } catch (err) {
          console.error('[SmartParcelSearch] Suggestion error:', err);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, detectedMode]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const { data, error } = await supabase.functions.invoke('search-parcels', {
        body: { 
          query: query.trim(),
          type: detectedMode === 'auto' ? undefined : detectedMode,
          county: detectedCounty || undefined
        }
      });

      if (error) throw error;

      if (data?.results?.length > 0) {
        const result = data.results[0];
        
        // Save to recent searches
        setRecentSearches(prev => {
          const updated = [query, ...prev.filter(s => s !== query)].slice(0, 5);
          return updated;
        });

        if (result.parcel) {
          onParcelSelect(result.parcel);
          toast({
            title: "Parcel Found",
            description: result.formatted_address,
          });
        } else if (result.lat && result.lng) {
          onAddressSelect(result.lat, result.lng, result.formatted_address);
          toast({
            title: "Location Found",
            description: result.formatted_address,
          });
        }
      } else {
        // No results - offer fallback options
        toast({
          title: "No Results Found",
          description: "Try a different search or draw a custom boundary.",
          variant: "destructive",
          action: (
            <Button variant="outline" size="sm" onClick={onStartDraw}>
              Draw Parcel
            </Button>
          ),
        });
      }
    } catch (error) {
      console.error('[SmartParcelSearch] Search error:', error);
      toast({
        title: "Search Error",
        description: "Please try again or use a different search method.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [query, detectedMode, detectedCounty, onAddressSelect, onParcelSelect, onStartDraw, toast]);

  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    setShowSuggestions(false);
    setQuery(suggestion.label);

    if (suggestion.parcel) {
      onParcelSelect(suggestion.parcel);
    } else if (suggestion.lat && suggestion.lng) {
      onAddressSelect(suggestion.lat, suggestion.lng, suggestion.label);
    }
  }, [onAddressSelect, onParcelSelect]);

  const handleNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onNavigateToLocation(latitude, longitude, 16);
        setIsLoading(false);
        toast({
          title: "Located",
          description: "Map centered on your location.",
        });
      },
      (error) => {
        setIsLoading(false);
        toast({
          title: "Location Error",
          description: "Unable to get your location. Please enable location services.",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onNavigateToLocation, toast]);

  const getModeIcon = (mode: SearchMode) => {
    switch (mode) {
      case 'apn': return <Hash className="h-3 w-3" />;
      case 'intersection': return <Navigation className="h-3 w-3" />;
      case 'coords': return <Crosshair className="h-3 w-3" />;
      default: return <MapPin className="h-3 w-3" />;
    }
  };

  const getModeLabel = (mode: SearchMode) => {
    switch (mode) {
      case 'apn': return 'APN';
      case 'intersection': return 'Cross-St';
      case 'coords': return 'Coords';
      default: return 'Address';
    }
  };

  // Collapsed state when we have an address
  if (currentAddress && !isExpanded) {
    return (
      <Card className="bg-background/95 backdrop-blur-sm shadow-2xl border-border/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentAddress}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(true)}>
              <ChevronDown className="h-4 w-4 mr-1" />
              Change
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-background/95 backdrop-blur-sm shadow-2xl border-border/50">
      <CardContent className="p-4">
        {/* Header with collapse */}
        {currentAddress && (
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="truncate max-w-[200px]">{currentAddress}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsExpanded(false)}>
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Smart Search Input */}
        <div className="space-y-3">
          <div className="relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  placeholder="Search address, APN, or cross-streets..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="pr-24"
                />
                
                {/* Detection Badge */}
                {query.length > 2 && (
                  <div className="absolute right-12 top-1/2 -translate-y-1/2">
                    <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0">
                      {getModeIcon(detectedMode)}
                      {getModeLabel(detectedMode)}
                    </Badge>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={handleSearch}
                  disabled={isLoading || !query.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-[200px] overflow-y-auto"
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

          {/* County Detection Hint for APN */}
          {detectedMode === 'apn' && detectedCounty && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px]">
                {COUNTY_PATTERNS[detectedCounty]?.name || detectedCounty}
              </Badge>
              <span>format detected</span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={handleNearMe}
              disabled={isLoading}
            >
              <Crosshair className="h-3 w-3" />
              Near Me
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn("text-xs gap-1.5", isDrawMode && "bg-primary text-primary-foreground")}
              onClick={onStartDraw}
            >
              <PenTool className="h-3 w-3" />
              Draw Boundary
            </Button>
          </div>

          {/* Search Hints */}
          <p className="text-[11px] text-muted-foreground">
            {detectedMode === 'apn' ? (
              <>Enter CAD account number to find parcel</>
            ) : detectedMode === 'intersection' ? (
              <>Cross-street format: "Main St & Oak Ave"</>
            ) : detectedMode === 'coords' ? (
              <>Coordinates format: "29.7604, -95.3698"</>
            ) : (
              <>Try address, APN #, cross-streets, or click map</>
            )}
          </p>

          {/* Recent Searches */}
          {recentSearches.length > 0 && !query && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">Recent</p>
              <div className="flex flex-wrap gap-1">
                {recentSearches.slice(0, 3).map((search, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6 px-2"
                    onClick={() => setQuery(search)}
                  >
                    {search.length > 20 ? search.substring(0, 20) + '...' : search}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
