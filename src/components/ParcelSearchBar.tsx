import { useState, useEffect } from 'react';
import { Search, Navigation, MapPin, Loader2, Clock, X, Hash, GitBranch } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export function ParcelSearchBar({ onAddressSelect, onParcelSelect, containerClassName }: ParcelSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      await fetchSearchResults(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const fetchSearchResults = async (query: string) => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-parcels', {
        body: { query }
      });

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

  const saveToHistory = (
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

    // Remove duplicates (same address)
    const filtered = recentSearches.filter(
      search => search.address.toLowerCase() !== address.toLowerCase()
    );

    // Add to beginning, limit to 5
    const updated = [newSearch, ...filtered].slice(0, 5);
    
    setRecentSearches(updated);
    localStorage.setItem('parcelSearchHistory', JSON.stringify(updated));
  };

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
        properties: result.parcel,
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
    <div className={`absolute left-4 z-20 w-96 ${containerClassName ?? 'top-4'}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex gap-2">
          <PopoverTrigger asChild>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
              )}
              <Input
                type="text"
                placeholder="Address, cross street, or parcel ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.length === 0 && recentSearches.length > 0) {
                    setIsOpen(true);
                  }
                }}
                className="pl-10 pr-10 bg-background/95 backdrop-blur-sm shadow-lg border-primary/20"
              />
            </div>
          </PopoverTrigger>

          <Button
            variant="secondary"
            size="icon"
            onClick={handleCurrentLocation}
            className="shadow-lg"
            title="Use current location"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>

        <PopoverContent
          className="w-96 p-0"
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
