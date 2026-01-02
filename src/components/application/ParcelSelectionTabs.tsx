/**
 * Parcel Selection Tabs
 * Four-tab interface for Address, Cross Streets, CAD/APN, and Survey upload.
 * All modes converge into the same candidate resolution pipeline.
 */

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapPin, Navigation, Hash, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useParcelSelection } from "@/contexts/ParcelSelectionContext";
import { AddressSearchTab } from "./AddressSearchTab";
import { CrossStreetSearchTab } from "./CrossStreetSearchTab";
import { CADSearchTab } from "./CADSearchTab";
import { SurveyUploadTab } from "./SurveyUploadTab";
import type { ParcelSelectionInputMode, CandidateParcel } from "@/types/parcelSelection";
import type { SurveyUploadMetadata } from "@/services/surveyUploadApi";
import type { ParcelMatch, AffineTransform, TransformedBounds } from "@/types/surveyCalibration";

interface ParcelSelectionTabsProps {
  onCandidatesFound: (candidates: CandidateParcel[]) => void;
  onNavigateToLocation: (lat: number, lng: number, zoom?: number) => void;
  mapCenter: [number, number];
  onSurveyUploaded?: (survey: SurveyUploadMetadata) => void;
  onSurveyDeleted?: (surveyId: string) => void;
  onParcelSelected?: (parcel: ParcelMatch) => void;
  onCalibrationComplete?: (result: {
    transform: AffineTransform;
    bounds: TransformedBounds;
    matchedParcels: ParcelMatch[];
  }) => void;
  draftId?: string;
  // Survey overlay controls
  surveyOverlayOpacity?: number;
  onSurveyOpacityChange?: (opacity: number) => void;
  showSurveyOverlay?: boolean;
  onSurveyVisibilityToggle?: (visible: boolean) => void;
  uploadedSurvey?: SurveyUploadMetadata | null;
}

export function ParcelSelectionTabs({
  onCandidatesFound,
  onNavigateToLocation,
  mapCenter,
  onSurveyUploaded,
  onSurveyDeleted,
  onParcelSelected,
  onCalibrationComplete,
  draftId,
  surveyOverlayOpacity,
  onSurveyOpacityChange,
  showSurveyOverlay,
  onSurveyVisibilityToggle,
  uploadedSurvey,
}: ParcelSelectionTabsProps) {
  const { state, setInputMode } = useParcelSelection();

  const handleTabChange = (value: string) => {
    setInputMode(value as ParcelSelectionInputMode);
  };

  return (
    <div className="space-y-4">
      <Tabs value={state.inputMode} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="address" className="gap-1 min-h-[44px] px-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="text-xs">Addr</span>
          </TabsTrigger>
          <TabsTrigger value="cross_streets" className="gap-1 min-h-[44px] px-2">
            <Navigation className="h-4 w-4 shrink-0" />
            <span className="text-xs">Cross</span>
          </TabsTrigger>
          <TabsTrigger value="cad" className="gap-1 min-h-[44px] px-2">
            <Hash className="h-4 w-4 shrink-0" />
            <span className="text-xs">CAD</span>
          </TabsTrigger>
          <TabsTrigger value="survey_upload" className="gap-1 min-h-[44px] px-2 relative">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="text-xs">Survey</span>
            <Badge 
              variant="outline" 
              className="absolute -top-1 -right-1 text-[8px] px-1 py-0 h-4 bg-background"
            >
              Adv
            </Badge>
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

        <TabsContent value="survey_upload" className="mt-4">
          <SurveyUploadTab
            onSurveyUploaded={onSurveyUploaded}
            onSurveyDeleted={onSurveyDeleted}
            onParcelSelected={onParcelSelected}
            onCalibrationComplete={onCalibrationComplete}
            draftId={draftId}
            surveyOverlayOpacity={surveyOverlayOpacity}
            onSurveyOpacityChange={onSurveyOpacityChange}
            showSurveyOverlay={showSurveyOverlay}
            onSurveyVisibilityToggle={onSurveyVisibilityToggle}
            uploadedSurvey={uploadedSurvey}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}