import { useState } from 'react';
import { Search, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MapSearchBarProps {
  onSearch: (lat: number, lng: number, address: string) => void;
  onNearMe: (lat: number, lng: number) => void;
}

export function MapSearchBar({ onSearch, onNearMe }: MapSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Use browser's geocoding API or Google Places
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data.length > 0) {
        const result = data[0];
        onSearch(parseFloat(result.lat), parseFloat(result.lon), result.display_name);
        toast.success(`Found: ${result.display_name}`);
      } else {
        toast.error('Location not found');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onNearMe(position.coords.latitude, position.coords.longitude);
        toast.success('Centered on your location');
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Unable to access your location');
      }
    );
  };

  return (
    <div className="absolute top-2 left-2 z-10 flex gap-2">
      <div className="flex gap-1 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
        <Input
          type="text"
          placeholder="Search address or place..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="w-64 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          disabled={isSearching}
        />
        <Button
          onClick={handleSearch}
          size="sm"
          variant="ghost"
          disabled={isSearching || !searchQuery.trim()}
          className="rounded-none"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      
      <Button
        onClick={handleNearMe}
        size="sm"
        variant="secondary"
        className="shadow-lg"
        title="Center map on your location"
      >
        <Navigation className="h-4 w-4" />
      </Button>
    </div>
  );
}
