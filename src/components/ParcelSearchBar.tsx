import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Navigation, MapPin, Loader2, Clock, X, Hash, GitBranch, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface RecentSearch {
  address: string;
  lat: number;
  lng: number;
  timestamp: number;
  type?: 'address' | 'cad' | 'intersection' | 'point';
  county?: string;
}

interface SearchResult {
  type: 'address' | 'cad' | 'intersection' | 'point';
  confidence: number;
  lat: number;
  lng: number;
  formatted_address: string;
  county?: string;
  parcel?: {
    parcel_id: string;
    owner_name: string | null;
    acreage: number | null;
    situs_address: string | null;
    market_value: number | null;
    geometry?: unknown;
  };
}

interface ParcelSearchBarProps {
  onAddressSelect: (lat: number, lng: number, address: string) => void;
  onParcelSelect?: (parcel: unknown) => void;
  containerClassName?: string;
  initialCounty?: string;
}

const TYPE_ICONS = {
  address: MapPin,
  cad: Hash,
  intersection: GitBranch,
  point: Navigation,
};

const TYPE_LABELS = {
  address: 'Address',
  cad: 'CAD #',
  intersection: 'Cross St',
  point: 'Coords',
};

const COUNTY_OPTIONS = [
  { value: 'all', label: 'All Counties' },
  { value: 'harris', label: 'Harris County' },
  { value: 'fortbend', label: 'Fort Bend County' },
  { value: 'montgomery', label: 'Montgomery County' },
  { value: 'travis', label: 'Travis County' },
  { value: 'dallas', label: 'Dallas County' },
  { value: 'tarrant', label: 'Tarrant County' },
  { value: 'bexar', label: 'Bexar County' },
  { value: 'williamson', label: 'Williamson County' },
];

const COUNTY_LABELS: Record<string, string> = {
  harris: 'Harris',
  montgomery: 'Montgomery',
  travis: 'Travis',
  bexar: 'Bexar',
  dallas: 'Dallas',
  tarrant: 'Tarrant',
  williamson: 'Williamson',
  fortbend: 'Fort Bend',
};

const PLACEHOLDER_EXAMPLES = [
  "123 Main Street, Houston TX",
  "1234567890 (Parcel ID)",
  "Main St & Oak Ave",
  "29.7604, -95.3698"
];

export function ParcelSearchBar({ 
  onAddressSelect, 
  onParcelSelect, 
  containerClassName,
  initialCounty 
}: ParcelSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [selectedCounty, setSelectedCounty] = useState(initialCounty || 'all');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Animated placeholder cycling
  useEffect(() => {
    if (isFocused || searchQuery.length > 0) return;
    
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isFocused, searchQuery]);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      await fetchSearchResults(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCounty]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('parcelSearchHistory');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentSearches(parsed);
      } catch (err) {
        console.error('Failed to parse search history:', err);
      }
    }
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('[data-parcel-search-input]');
        input?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchSearchResults = async (query: string) => {
    setIsSearching(true);
    try {
      const body: { query: string; county?: string } = { query };
      if (selectedCounty !== 'all') {
        body.county = selectedCounty;
      }

      const { data, error } = await supabase.functions.invoke('search-parcels', { body });

      if (error) throw error;

      setSearchResults(data.results || []);
      setIsOpen(true);
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const address = 'Current Location';
        saveToHistory(position.coords.latitude, position.coords.longitude, address, 'point');
        onAddressSelect(
          position.coords.latitude,
          position.coords.longitude,
          address
        );
        toast.success('Centered on your location');
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Unable to access location');
      }
    );
  };

  const saveToHistory = useCallback((
    lat: number, 
    lng: number, 
    address: string, 
    type?: 'address' | 'cad' | 'intersection' | 'point',
    county?: string
  ) => {
    const newSearch: RecentSearch = {
      address,
      lat,
      lng,
      timestamp: Date.now(),
      type,
      county,
    };

    setRecentSearches(prev => {
      // Remove duplicates (same address)
      const filtered = prev.filter(
        search => search.address.toLowerCase() !== address.toLowerCase()
      );

      // Add to beginning, limit to 5
      const updated = [newSearch, ...filtered].slice(0, 5);
      localStorage.setItem('parcelSearchHistory', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromHistory = (timestamp: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(search => search.timestamp !== timestamp);
    setRecentSearches(updated);
    localStorage.setItem('parcelSearchHistory', JSON.stringify(updated));
    toast.success('Removed from history');
  };

  const handleResultSelect = (result: SearchResult) => {
    saveToHistory(result.lat, result.lng, result.formatted_address, result.type, result.county);
    
    if (result.parcel && onParcelSelect) {
      onParcelSelect({
        type: 'Feature',
        geometry: result.parcel.geometry,
        properties: {
          ...result.parcel,
          county: result.county,
        },
      });
    }
    
    onAddressSelect(result.lat, result.lng, result.formatted_address);
    setIsOpen(false);
    setSearchQuery('');
    toast.success('Location selected');
  };

  const TypeIcon = ({ type }: { type: 'address' | 'cad' | 'intersection' | 'point' }) => {
    const Icon = TYPE_ICONS[type];
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className={`absolute left-4 z-20 w-[480px] ${containerClassName ?? 'top-4'}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex gap-2">
          {/* County Filter */}
          <Select value={selectedCounty} onValueChange={setSelectedCounty}>
            <SelectTrigger className="w-[130px] h-14 bg-background/95 backdrop-blur-sm shadow-xl border-primary/20 rounded-xl">
              <Filter className="h-4 w-4 mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTY_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <PopoverTrigger asChild>
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
              {isSearching && (
                <Loader2 className="absolute right-12 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-spin z-10" />
              )}
              <Input
                ref={inputRef}
                type="text"
                placeholder=""
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  setIsFocused(true);
                  if (searchQuery.length === 0 && recentSearches.length > 0) {
                    setIsOpen(true);
                  }
                }}
                onBlur={() => setIsFocused(false)}
                className="h-14 pl-12 pr-16 text-base bg-background/95 backdrop-blur-sm shadow-xl border-primary/20 rounded-xl ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/50 transition-shadow"
                data-parcel-search-input
                aria-label="Property search input"
              />
              {/* Animated placeholder */}
              {!isFocused && searchQuery.length === 0 && (
                <div className="absolute inset-0 flex items-center pointer-events-none pl-12">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={placeholderIndex}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 0.5, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                      className="text-muted-foreground"
                    >
                      {PLACEHOLDER_EXAMPLES[placeholderIndex]}
                    </motion.span>
                  </AnimatePresence>
                </div>
              )}
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70 hidden md:flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md">
                ⌘K
              </span>
            </div>
          </PopoverTrigger>

          <Button
            variant="secondary"
            size="icon"
            onClick={handleCurrentLocation}
            className="h-14 w-14 shadow-xl rounded-xl"
            title="Use current location"
          >
            <Navigation className="h-5 w-5" />
          </Button>
        </div>

        <PopoverContent
          className="w-[420px] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command>
            <CommandList>
              {/* Recent Searches Section - Only show when no query */}
              {searchQuery.length === 0 && recentSearches.length > 0 && (
                <CommandGroup heading="Recent Searches">
                  {recentSearches.map((search) => (
                    <CommandItem
                      key={search.timestamp}
                      onSelect={() => {
                        onAddressSelect(search.lat, search.lng, search.address);
                        setIsOpen(false);
                        toast.success('Location selected from history');
                      }}
                      className="group"
                    >
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="flex-1 truncate">{search.address}</span>
                      {search.type && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {TYPE_LABELS[search.type]}
                        </Badge>
                      )}
                      {search.county && (
                        <Badge variant="outline" className="ml-1 text-xs">
                          {COUNTY_LABELS[search.county] || search.county}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                        onClick={(e) => removeFromHistory(search.timestamp, e)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Search Results Section */}
              {searchResults.length > 0 && (
                <>
                  <CommandEmpty>No results found</CommandEmpty>
                  <CommandGroup heading="Search Results">
                    {searchResults.map((result, index) => (
                      <CommandItem
                        key={`${result.type}-${result.lat}-${result.lng}-${index}`}
                        onSelect={() => handleResultSelect(result)}
                        className="flex items-center"
                      >
                        <TypeIcon type={result.type} />
                        <span className="flex-1 ml-2 truncate">{result.formatted_address}</span>
                        <div className="flex items-center gap-1 ml-2">
                          <Badge variant="secondary" className="text-xs">
                            {TYPE_LABELS[result.type]}
                          </Badge>
                          {result.county && (
                            <Badge variant="outline" className="text-xs">
                              {COUNTY_LABELS[result.county] || result.county}
                            </Badge>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Parcel Details Preview */}
              {searchResults.length > 0 && searchResults[0].parcel && (
                <CommandGroup heading="Parcel Preview">
                  <div className="px-3 py-2 text-sm">
                    <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                      <span>Parcel ID:</span>
                      <span className="font-mono">{searchResults[0].parcel.parcel_id}</span>
                      {searchResults[0].parcel.owner_name && (
                        <>
                          <span>Owner:</span>
                          <span className="truncate">{searchResults[0].parcel.owner_name}</span>
                        </>
                      )}
                      {searchResults[0].parcel.acreage && (
                        <>
                          <span>Acreage:</span>
                          <span>{searchResults[0].parcel.acreage.toFixed(2)} ac</span>
                        </>
                      )}
                      {searchResults[0].parcel.market_value && (
                        <>
                          <span>Market Value:</span>
                          <span>${searchResults[0].parcel.market_value.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </CommandGroup>
              )}

              {/* Empty State */}
              {searchQuery.length === 0 && recentSearches.length === 0 && (
                <CommandEmpty>
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    <p>Search by:</p>
                    <p className="mt-1">• Address (123 Main St)</p>
                    <p>• Cross street (Main & Oak)</p>
                    <p>• Parcel ID (1234567890)</p>
                    <p>• Coordinates (29.76,-95.36)</p>
                  </div>
                </CommandEmpty>
              )}

              {/* No Results State */}
              {searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
                <CommandEmpty>No results found for "{searchQuery}"</CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
