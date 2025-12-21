/**
 * Cross Street Search Tab
 * Mode B: Find parcel by intersection of two streets with buffer query.
 */

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navigation, Loader2, AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useParcelSelection } from "@/contexts/ParcelSelectionContext";
import { searchResultToCandidate } from "@/lib/parcelLock";
import type { CandidateParcel } from "@/types/parcelSelection";

interface CrossStreetSearchTabProps {
  onCandidatesFound: (candidates: CandidateParcel[]) => void;
  onNavigateToLocation: (lat: number, lng: number, zoom?: number) => void;
  mapCenter: [number, number];
}

export function CrossStreetSearchTab({
  onCandidatesFound,
  onNavigateToLocation,
}: CrossStreetSearchTabProps) {
  const { setLoading, addWarning, clearWarnings } = useParcelSelection();
  const [streetA, setStreetA] = useState("");
  const [streetB, setStreetB] = useState("");
  const [city, setCity] = useState("Houston");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!streetA.trim() || !streetB.trim()) {
      toast.error("Please enter both street names");
      return;
    }

    clearWarnings();
    setIsSearching(true);
    setLoading(true);

    try {
      // Format as intersection query
      const intersection = `${streetA.trim()} & ${streetB.trim()}`;
      const fullQuery = city ? `${intersection}, ${city}, TX` : `${intersection}, TX`;

      // First geocode the intersection
      const { data: geoData, error: geoError } = await supabase.functions.invoke('geocode-intersection', {
        body: { intersection: fullQuery }
      });

      if (geoError || !geoData?.lat || !geoData?.lng) {
        toast.error("Could not locate intersection. Check street names.");
        return;
      }

      // Navigate to intersection
      onNavigateToLocation(geoData.lat, geoData.lng, 17);

      // Now search for parcels near intersection with buffer
      const { data: parcelData, error: parcelError } = await supabase.functions.invoke('search-parcels', {
        body: { 
          query: `${geoData.lat},${geoData.lng}`,
          type: 'point',
          radius: 100 // 100ft buffer
        }
      });

      if (parcelError) throw parcelError;

      let candidates: CandidateParcel[] = [];

      if (parcelData?.results?.length > 0) {
        candidates = parcelData.results
          .filter((r: any) => r.parcel)
          .map((r: any) => searchResultToCandidate(
            r.parcel,
            r.county || 'unknown',
            r.confidence || 0.75,
            'external'
          ));
      }

      // Expand to 250ft if no results
      if (candidates.length === 0) {
        const { data: expandedData } = await supabase.functions.invoke('search-parcels', {
          body: { 
            query: `${geoData.lat},${geoData.lng}`,
            type: 'point',
            radius: 250
          }
        });

        if (expandedData?.results?.length > 0) {
          candidates = expandedData.results
            .filter((r: any) => r.parcel)
            .map((r: any) => searchResultToCandidate(
              r.parcel,
              r.county || 'unknown',
              r.confidence || 0.65,
              'external'
            ));
          
          addWarning("Results found with expanded search radius (250 ft).");
        }
      }

      if (candidates.length === 0) {
        toast.error("No parcels found near this intersection.");
        addWarning("No parcels found. Try clicking on the map to select a parcel directly.");
      } else if (candidates.length > 1) {
        addWarning("Multiple parcels found near this intersection. Please verify the correct one.");
        toast.info(`Found ${candidates.length} parcels near intersection`);
      } else {
        toast.success("Found parcel near intersection");
      }

      onCandidatesFound(candidates);

    } catch (err) {
      console.error('[CrossStreetSearchTab] Search error:', err);
      toast.error("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  }, [streetA, streetB, city, onCandidatesFound, onNavigateToLocation, setLoading, addWarning, clearWarnings]);

  return (
    <div className="space-y-4">
      {/* Persistent Warning Banner */}
      <Alert className="bg-muted/50 border-muted-foreground/20">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Cross-street searches often return multiple parcels. You must verify the correct one.
        </AlertDescription>
      </Alert>

      {/* Street Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="streetA">Street A</Label>
          <Input
            id="streetA"
            placeholder="e.g., Main Street"
            value={streetA}
            onChange={(e) => setStreetA(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="streetB">Street B</Label>
          <Input
            id="streetB"
            placeholder="e.g., Oak Avenue"
            value={streetB}
            onChange={(e) => setStreetB(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
      </div>

      {/* Optional City */}
      <div className="space-y-2">
        <Label htmlFor="city">City (optional)</Label>
        <Input
          id="city"
          placeholder="Houston"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </div>

      {/* Search Button */}
      <Button
        onClick={handleSearch}
        disabled={isSearching || !streetA.trim() || !streetB.trim()}
        className="w-full"
      >
        {isSearching ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Finding Intersection...
          </>
        ) : (
          <>
            <Navigation className="h-4 w-4 mr-2" />
            Find Intersection
          </>
        )}
      </Button>

      {/* Help Text */}
      <p className="text-xs text-muted-foreground">
        Enter two intersecting street names. The system will find all parcels within 100 feet, expanding to 250 feet if needed.
      </p>
    </div>
  );
}
