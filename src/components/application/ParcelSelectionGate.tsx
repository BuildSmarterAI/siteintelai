/**
 * Parcel Selection Gate
 * The truth gate - resolves user intent into one verified parcel before any analysis.
 * 
 * Key behaviors:
 * - NO auto-selection for single candidates - user must explicitly click
 * - Tracks raw input and map state for audit
 * - Server-side persistence required before proceeding
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapLibreCanvas } from "@/components/MapLibreCanvas";
import { MapLoadingSkeleton } from "@/components/MapLoadingSkeleton";
import { ParcelSelectionTabs } from "./ParcelSelectionTabs";
import { CandidateParcelList } from "./CandidateParcelList";
import { ParcelVerificationPanel } from "./ParcelVerificationPanel";
import { ParcelSelectionProvider, useParcelSelection } from "@/contexts/ParcelSelectionContext";
import { MatchFoundBadge } from "./MatchFoundBadge";
import { Shield, AlertTriangle, Lock, ArrowRight, Search, Map, CheckCircle, MousePointerClick } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { CandidateParcel, SelectedParcel } from "@/types/parcelSelection";

interface ParcelSelectionGateProps {
  onParcelLocked: (parcel: SelectedParcel) => void;
  initialAddress?: string;
  initialCoords?: { lat: number; lng: number };
}

type MobileStep = 'search' | 'map' | 'verify';

function ParcelSelectionGateInner({ onParcelLocked, initialCoords }: ParcelSelectionGateProps) {
  const { 
    state, 
    setCandidates, 
    selectCandidate, 
    lockParcel,
    recoverFromStorage,
    setRawInput,
    setMapState,
  } = useParcelSelection();
  
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    initialCoords ? [initialCoords.lat, initialCoords.lng] : [29.7604, -95.3698]
  );
  const [mapZoom, setMapZoom] = useState(14);
  const [isLocking, setIsLocking] = useState(false);
  const [mobileStep, setMobileStep] = useState<MobileStep>('search');
  
  // Spotlight state for "Match Found" experience
  const [showMatchBadge, setShowMatchBadge] = useState(false);
  const [spotlightParcel, setSpotlightParcel] = useState<any>(null);
  const [srAnnouncement, setSrAnnouncement] = useState<string>("");
  const mapRef = useRef<{ flyToBounds: (bounds: [[number, number], [number, number]], options?: any) => void } | null>(null);

  // Track map state for audit
  useEffect(() => {
    setMapState({
      zoom: mapZoom,
      centerLat: mapCenter[0],
      centerLng: mapCenter[1],
    });
  }, [mapZoom, mapCenter, setMapState]);

  // Clear any previously stored parcel on mount - always start fresh
  useEffect(() => {
    localStorage.removeItem('siteintel_locked_parcel');
  }, []);

  // Auto-advance mobile step when candidate is selected
  useEffect(() => {
    if (state.selectedCandidate) {
      setMobileStep('verify');
    }
  }, [state.selectedCandidate]);

  const handleNavigateToLocation = useCallback((lat: number, lng: number, zoom?: number) => {
    setMapCenter([lat, lng]);
    setMapZoom(zoom || 17);
  }, []);

  const handleCandidatesFound = useCallback((candidates: CandidateParcel[], rawInput?: string) => {
    setCandidates(candidates);
    // Track raw input for audit
    if (rawInput) {
      setRawInput(rawInput);
    }
    // AUTO-SELECT single parcel with spotlight experience
    if (candidates.length === 1) {
      const single = candidates[0];
      selectCandidate(single);
      
      // Trigger spotlight experience
      setSpotlightParcel(single.geom);
      setShowMatchBadge(true);
      
      // Screen reader announcement
      const address = single.situs_address || single.parcel_id;
      setSrAnnouncement(`Match found. ${address}. Parcel boundary now highlighted on map.`);
      
      // Navigate to parcel centroid
      if (single.centroid) {
        setMapCenter([single.centroid.lat, single.centroid.lng]);
        setMapZoom(17);
      }
      
      // Auto-hide badge after 2.5s
      setTimeout(() => setShowMatchBadge(false), 2500);
      
      // Clear spotlight after 3s
      setTimeout(() => setSpotlightParcel(null), 3000);
      
      // Clear announcement after read
      setTimeout(() => setSrAnnouncement(""), 4000);
    }
  }, [setCandidates, setRawInput, selectCandidate]);

  const handleCandidateSelect = useCallback((candidate: CandidateParcel) => {
    selectCandidate(candidate);
    // Navigate to candidate centroid
    if (candidate.centroid) {
      setMapCenter([candidate.centroid.lat, candidate.centroid.lng]);
      setMapZoom(17);
    }
  }, [selectCandidate]);

  const handleMapParcelClick = useCallback((parcel: any) => {
    // Fallback parcels hook provides flat object, but also check for nested properties 
    // in case it comes from a different source (e.g., vector tiles)
    const props = parcel.properties || parcel;
    
    // Determine source and confidence based on data origin
    const isCanonical = props.source === 'canonical';
    
    const candidate: CandidateParcel = {
      // Prioritize normalized field names over legacy HCAD names
      parcel_id: props.parcel_id || props.ACCOUNT || props.parcelId || props.apn || 'UNKNOWN',
      county: props.jurisdiction || props.COUNTY || props.county || 'unknown',
      source: isCanonical ? 'canonical' : 'external',
      geom: parcel.geometry,
      acreage: props.acreage || props.ACREAGE || null,
      confidence: isCanonical ? 'high' : 'medium',
      situs_address: props.situs_address || props.SITUS_ADDR || null,
      owner_name: props.owner_name || props.OWNER_NAME || null,
      zoning: props.land_use_desc || props.ZONING || props.zoning || null,
      market_value: props.market_value || null,
    };
    
    // Add to candidates if not already there
    const exists = state.candidates.some(c => c.parcel_id === candidate.parcel_id);
    if (!exists) {
      setCandidates([...state.candidates, candidate]);
    }
    selectCandidate(candidate);
  }, [state.candidates, setCandidates, selectCandidate]);

  const handleConfirmParcel = useCallback(async () => {
    setIsLocking(true);
    try {
      const lockedParcel = await lockParcel();
      toast.success("Parcel locked for feasibility analysis");
      onParcelLocked(lockedParcel);
    } catch (err: any) {
      console.error('[ParcelSelectionGate] Lock failed:', err);
      toast.error(err?.message || "Failed to lock parcel. Please try again.");
    } finally {
      setIsLocking(false);
    }
  }, [lockParcel, onParcelLocked]);

  // If already locked, show locked state
  if (state.lockedParcel) {
    return (
      <div className="min-h-[600px] flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Parcel Locked</CardTitle>
            <CardDescription>
              {state.lockedParcel.situs_address || state.lockedParcel.parcel_id}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center gap-2">
              <Badge>{state.lockedParcel.county}</Badge>
              <Badge variant="outline">{state.lockedParcel.acreage.toFixed(2)} ac</Badge>
            </div>
            <Button onClick={() => onParcelLocked(state.lockedParcel!)} className="w-full">
              Continue to Payment <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Shared components for both layouts
  const searchPanel = (
    <>
      <ParcelSelectionTabs
        onCandidatesFound={(candidates) => handleCandidatesFound(candidates)}
        onNavigateToLocation={handleNavigateToLocation}
        mapCenter={mapCenter}
      />
      <div className="mt-6">
        <CandidateParcelList
          candidates={state.candidates}
          selectedId={state.selectedCandidate?.parcel_id || null}
          onSelect={handleCandidateSelect}
        />
        {/* Prompt for single candidate */}
        {state.candidates.length === 1 && !state.selectedCandidate && (
          <Alert className="mt-4 bg-primary/5 border-primary/20">
            <MousePointerClick className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              <strong>1 parcel found.</strong> Click the parcel above to select and verify it.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </>
  );

  const mapPanel = (
    <>
      <AnimatePresence>
        {isMapLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10"
          >
            <MapLoadingSkeleton message="Loading map..." />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Match Found Badge */}
      <MatchFoundBadge 
        show={showMatchBadge} 
        address={state.selectedCandidate?.situs_address || undefined}
      />
      
      {/* Screen Reader Announcement */}
      <VisuallyHidden>
        <div aria-live="polite" aria-atomic="true">
          {srAnnouncement}
        </div>
      </VisuallyHidden>
      
      <MapLibreCanvas
        center={mapCenter}
        zoom={mapZoom}
        showParcels={true}
        onParcelSelect={handleMapParcelClick}
        onMapLoad={() => setIsMapLoading(false)}
        selectedParcelId={state.selectedCandidate?.parcel_id}
        spotlightParcel={spotlightParcel}
        showLegend={false}
        showAttribution={false}
        showZoomHint={false}
        showDataSourceBadge={false}
        className="w-full h-full"
      />
    </>
  );

  const verifyPanel = state.selectedCandidate ? (
    <ParcelVerificationPanel
      candidate={state.selectedCandidate}
      onConfirm={handleConfirmParcel}
      isLocking={isLocking}
      warnings={state.warnings}
    />
  ) : null;

  return (
    <div className="relative w-full h-[calc(100vh-120px)] min-h-[600px]">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Confirm Your Parcel
            </h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Select the correct parcel to continue
            </p>
          </div>
          {state.warnings.length > 0 && (
            <Badge variant="outline" className="bg-warning/10 text-warning-foreground border-warning/30">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {state.warnings.length} warning{state.warnings.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Desktop Layout - 3 Column */}
      <div className="absolute top-[73px] bottom-0 left-0 right-0 hidden lg:flex">
        {/* Left Panel - Input */}
        <div className="w-[360px] border-r bg-background p-4 overflow-y-auto">
          {searchPanel}
        </div>

        {/* Center - Map (expands when no selection) */}
        <div className="flex-1 relative">
          {mapPanel}
        </div>

        {/* Right Panel - Only visible when parcel selected */}
        <AnimatePresence>
          {state.selectedCandidate && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="border-l bg-background overflow-hidden"
            >
              <div className="w-[320px] p-4 overflow-y-auto h-full">
                {verifyPanel}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile/Tablet Layout - Step-based */}
      <div className="absolute top-[73px] bottom-0 left-0 right-0 lg:hidden flex flex-col">
        {/* Step content */}
        <div className="flex-1 overflow-hidden">
          {mobileStep === 'search' && (
            <div className="h-full overflow-y-auto p-4">
              {searchPanel}
            </div>
          )}
          {mobileStep === 'map' && (
            <div className="h-full relative">
              {mapPanel}
            </div>
          )}
          {mobileStep === 'verify' && (
            <div className="h-full overflow-y-auto p-4">
              {verifyPanel}
            </div>
          )}
        </div>
        
        {/* Bottom tab navigation */}
        <div className="border-t bg-background p-2 flex gap-2 shrink-0">
          <Button
            variant={mobileStep === 'search' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setMobileStep('search')}
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button
            variant={mobileStep === 'map' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setMobileStep('map')}
          >
            <Map className="h-4 w-4 mr-2" />
            Map
          </Button>
          <Button
            variant={mobileStep === 'verify' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setMobileStep('verify')}
            disabled={!state.selectedCandidate}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ParcelSelectionGate(props: ParcelSelectionGateProps) {
  return (
    <ParcelSelectionProvider>
      <ParcelSelectionGateInner {...props} />
    </ParcelSelectionProvider>
  );
}
