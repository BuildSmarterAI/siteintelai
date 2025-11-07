import { useState, useEffect } from 'react';
import { Search, Navigation, MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ParcelSearchBarProps {
  onAddressSelect: (lat: number, lng: number, address: string) => void;
  onParcelSelect?: (parcel: any) => void;
  containerClassName?: string;
}

export function ParcelSearchBar({ onAddressSelect, onParcelSelect, containerClassName }: ParcelSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      await fetchSuggestions(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSuggestions = async (query: string) => {
    setIsSearching(true);
    try {
      // Check if cross-street format (contains "&" or "and")
      if (query.match(/(&|and)/i)) {
        await handleCrossStreetSearch(query);
        return;
      }

      // Check if parcel ID format (10+ digits)
      if (/^\d{10,}$/.test(query)) {
        await searchByParcelId(query);
        return;
      }

      // Check if coordinate format (lat,lng)
      if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(query)) {
        const [lat, lng] = query.split(',').map(s => parseFloat(s.trim()));
        onAddressSelect(lat, lng, `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setIsOpen(false);
        return;
      }

      // Address autocomplete
      const { data, error } = await supabase.functions.invoke('google-places', {
        body: { input: query }
      });

      if (error) throw error;

      setSuggestions(data.predictions || []);
      setIsOpen(true);
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const searchByParcelId = async (parcelId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-hcad-parcels', {
        body: { parcelId }
      });

      if (error) throw error;

      if (data.features && data.features.length > 0) {
        const parcel = data.features[0];
        const coords = parcel.geometry.coordinates[0][0];
        const [lng, lat] = coords;
        
        onParcelSelect?.(parcel);
        onAddressSelect(lat, lng, parcel.properties.SITUS_ADDRESS || 'Parcel Found');
        setIsOpen(false);
        toast.success('Parcel found');
      } else {
        toast.error('Parcel not found');
      }
    } catch (err) {
      console.error('Parcel search error:', err);
      toast.error('Failed to find parcel');
    }
  };

  const handleCrossStreetSearch = async (intersection: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-intersection', {
        body: { intersection }
      });

      if (error) throw error;

      onAddressSelect(data.lat, data.lng, data.formatted_address);
      setIsOpen(false);
      toast.success('Location found');
    } catch (err) {
      console.error('Intersection search error:', err);
      toast.error('Intersection not found');
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onAddressSelect(
          position.coords.latitude,
          position.coords.longitude,
          'Current Location'
        );
        toast.success('Centered on your location');
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Unable to access location');
      }
    );
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
              <CommandEmpty>No results found</CommandEmpty>
              <CommandGroup>
                {suggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion.place_id}
                    onSelect={async () => {
                      try {
                        const { data } = await supabase.functions.invoke('google-place-details', {
                          body: { placeId: suggestion.place_id }
                        });

                        const { lat, lng } = data.result.geometry.location;
                        onAddressSelect(lat, lng, suggestion.description);
                        setIsOpen(false);
                        setSearchQuery('');
                      } catch (err) {
                        console.error('Place details error:', err);
                        toast.error('Failed to get location details');
                      }
                    }}
                  >
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    {suggestion.description}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
