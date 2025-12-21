/**
 * Parcel Selection Tabs
 * Three-tab interface for Address, Cross Streets, and CAD/APN search.
 * All modes converge into the same candidate resolution pipeline.
 */

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapPin, Navigation, Hash } from "lucide-react";
import { useParcelSelection } from "@/contexts/ParcelSelectionContext";
import { AddressSearchTab } from "./AddressSearchTab";
import { CrossStreetSearchTab } from "./CrossStreetSearchTab";
import { CADSearchTab } from "./CADSearchTab";
import type { ParcelSelectionInputMode, CandidateParcel } from "@/types/parcelSelection";

interface ParcelSelectionTabsProps {
  onCandidatesFound: (candidates: CandidateParcel[]) => void;
  onNavigateToLocation: (lat: number, lng: number, zoom?: number) => void;
  mapCenter: [number, number];
}

export function ParcelSelectionTabs({
  onCandidatesFound,
  onNavigateToLocation,
  mapCenter,
}: ParcelSelectionTabsProps) {
  const { state, setInputMode } = useParcelSelection();

  const handleTabChange = (value: string) => {
    setInputMode(value as ParcelSelectionInputMode);
  };

  return (
    <div className="space-y-4">
      <Tabs value={state.inputMode} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="address" className="gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Address</span>
          </TabsTrigger>
          <TabsTrigger value="cross_streets" className="gap-2">
            <Navigation className="h-4 w-4" />
            <span className="hidden sm:inline">Cross Streets</span>
          </TabsTrigger>
          <TabsTrigger value="cad" className="gap-2">
            <Hash className="h-4 w-4" />
            <span className="hidden sm:inline">CAD / APN</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="address" className="mt-4">
          <AddressSearchTab
            onCandidatesFound={onCandidatesFound}
            onNavigateToLocation={onNavigateToLocation}
            mapCenter={mapCenter}
          />
        </TabsContent>

        <TabsContent value="cross_streets" className="mt-4">
          <CrossStreetSearchTab
            onCandidatesFound={onCandidatesFound}
            onNavigateToLocation={onNavigateToLocation}
            mapCenter={mapCenter}
          />
        </TabsContent>

        <TabsContent value="cad" className="mt-4">
          <CADSearchTab
            onCandidatesFound={onCandidatesFound}
            onNavigateToLocation={onNavigateToLocation}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
