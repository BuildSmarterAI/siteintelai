import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Navigation, 
  Crosshair, 
  Loader2,
  X,
  Check,
  ArrowLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface DrawNavigationBarProps {
  onNavigate: (lat: number, lng: number, zoom?: number) => void;
  onConfirmLocation: () => void;
  onCancel: () => void;
  currentCenter: [number, number];
}

type NavMode = 'address' | 'intersection' | 'ready';

export function DrawNavigationBar({
  onNavigate,
  onConfirmLocation,
  onCancel,
  currentCenter,
}: DrawNavigationBarProps) {
  const { toast } = useToast();
  const [navMode, setNavMode] = useState<NavMode>('address');
  const [addressQuery, setAddressQuery] = useState("");
  const [intersectionQuery, setIntersectionQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  const handleAddressNavigate = useCallback(async () => {
    if (!addressQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-parcels', {
        body: { query: addressQuery.trim(), type: 'address' }
      });

      if (error) throw error;

      if (data?.results?.length > 0) {
        const result = data.results[0];
        onNavigate(result.lat, result.lng, 17);
        setHasNavigated(true);
        toast({
          title: "Navigated",
          description: `Map centered on ${result.formatted_address}`,
        });
      } else {
        toast({
          title: "Address Not Found",
          description: "Try a different address or use cross-streets.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[DrawNavigationBar] Address navigate error:', error);
      toast({
        title: "Navigation Error",
        description: "Failed to find address. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addressQuery, onNavigate, toast]);

  const handleIntersectionNavigate = useCallback(async () => {
    if (!intersectionQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-parcels', {
        body: { query: intersectionQuery.trim(), type: 'intersection' }
      });

      if (error) throw error;

      if (data?.results?.length > 0) {
        const result = data.results[0];
        onNavigate(result.lat, result.lng, 18);
        setHasNavigated(true);
        toast({
          title: "Navigated",
          description: `Map centered on intersection`,
        });
      } else {
        toast({
          title: "Intersection Not Found",
          description: "Try format: 'Main St & Oak Ave' or 'FM 1960 and Highway 249'",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[DrawNavigationBar] Intersection navigate error:', error);
      toast({
        title: "Navigation Error",
        description: "Failed to find intersection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [intersectionQuery, onNavigate, toast]);

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
        onNavigate(latitude, longitude, 17);
        setHasNavigated(true);
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
          description: "Unable to get your location.",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onNavigate, toast]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="bg-background/95 backdrop-blur-sm shadow-2xl border-border/50">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">Navigate to Drawing Area</span>
            </div>
            {hasNavigated && (
              <Button size="sm" onClick={onConfirmLocation} className="gap-1.5">
                <Check className="h-3 w-3" />
                Ready to Draw
              </Button>
            )}
          </div>

          {/* Navigation Options */}
          <div className="space-y-3">
            {/* Address Navigation */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Navigate by Address</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Enter address near your parcel..."
                    value={addressQuery}
                    onChange={(e) => setAddressQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddressNavigate()}
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={handleAddressNavigate}
                    disabled={isLoading || !addressQuery.trim()}
                  >
                    {isLoading && navMode === 'address' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Cross-Street Navigation */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Navigate by Cross-Streets</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="e.g., Main St & Oak Ave"
                    value={intersectionQuery}
                    onChange={(e) => setIntersectionQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleIntersectionNavigate()}
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={handleIntersectionNavigate}
                    disabled={isLoading || !intersectionQuery.trim()}
                  >
                    {isLoading && navMode === 'intersection' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs gap-1.5"
                onClick={handleNearMe}
                disabled={isLoading}
              >
                <Crosshair className="h-3 w-3" />
                Use My Location
              </Button>
            </div>

            {/* Instructions */}
            <p className="text-[11px] text-muted-foreground pt-2 border-t border-border/50">
              Navigate to the area where you want to draw your parcel boundary, then click "Ready to Draw" to start drawing.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
