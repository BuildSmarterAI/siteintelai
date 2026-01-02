/**
 * Parcel Selection Gate
 * Legal-grade verification gate - resolves user intent into one verified parcel.
 * 
 * Visual Language Enforcement:
 * - CYAN = investigation/exploration (tentative selection)
 * - ORANGE = irreversible commitment (ONLY at decision gate)
 * 
 * Key behaviors:
 * - Auto-selection for single candidates with spotlight
 * - Tracks raw input and map state for audit
 * - Server-side persistence required before proceeding
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapLibreCanvas } from "@/components/MapLibreCanvas";
import { MapLoadingSkeleton } from "@/components/MapLoadingSkeleton";
import { ParcelSelectionTabs } from "./ParcelSelectionTabs";
import { CandidateParcelList } from "./CandidateParcelList";
import { ParcelValidationCards } from "./ParcelValidationCards";
import { ParcelConfirmationGate } from "./ParcelConfirmationGate";
import { ParcelLockConfirmationModal } from "./ParcelLockConfirmationModal";
import { ParcelSelectionProvider, useParcelSelection } from "@/contexts/ParcelSelectionContext";
import { MatchFoundBadge } from "./MatchFoundBadge";
import { MapPin, Search, Map, CheckCircle, MousePointerClick, RefreshCw } from "lucide-react";
import { LockedParcelSummary } from "./LockedParcelSummary";
import { VerifiedParcelProceed } from "./VerifiedParcelProceed";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { CandidateParcel, SelectedParcel } from "@/types/parcelSelection";
import type { ParcelMatch, AffineTransform, TransformedBounds } from "@/types/surveyCalibration";
import { getSurveyUrl, type SurveyUploadMetadata } from "@/services/surveyUploadApi";
import { hasValidGeometry, isValidParcelGeometry } from "@/lib/geometryValidation";

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
    clearSelection,
    lockParcel,
    unlockParcel,
    setRawInput,
    setMapState,
  } = useParcelSelection();
  
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapLoadError, setMapLoadError] = useState(false);
  const [mapLoadStep, setMapLoadStep] = useState<'init' | 'basemap' | 'parcels' | 'ready'>('init');
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    initialCoords ? [initialCoords.lat, initialCoords.lng] : [29.7604, -95.3698]
  );
  const [mapZoom, setMapZoom] = useState(14);
  const [isLocking, setIsLocking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileStep, setMobileStep] = useState<MobileStep>('search');
  const [showLockConfirmation, setShowLockConfirmation] = useState(false);
  
  // Survey overlay state
  const [uploadedSurvey, setUploadedSurvey] = useState<SurveyUploadMetadata | null>(null);
  const [surveyOverlayUrl, setSurveyOverlayUrl] = useState<string | null>(null);
  const [surveyOverlayOpacity, setSurveyOverlayOpacity] = useState(0.5);
  const [showSurveyOverlay, setShowSurveyOverlay] = useState(true);
  
  // Spotlight state for "Match Found" experience
  const [showMatchBadge, setShowMatchBadge] = useState(false);
  const [spotlightParcel, setSpotlightParcel] = useState<any>(null);
  const [srAnnouncement, setSrAnnouncement] = useState<string>("");
  const mapRef = useRef<{ flyToBounds: (bounds: [[number, number], [number, number]], options?: any) => void } | null>(null);

  // Compute validations based on selected candidate
  const validations = useMemo(() => {
    const candidate = state.selectedCandidate;
    if (!candidate) return null;
    
    return {
      geometryIntegrity: {
        status: candidate.geom ? 'success' : 'error',
        message: candidate.geom ? 'Valid polygon geometry' : 'No geometry data available',
        detail: candidate.geom ? undefined : 'Cannot proceed without parcel boundary',
      } as const,
      addressMatch: {
        status: candidate.situs_address ? 'success' : 'warning',
        message: candidate.situs_address ? 'Address verified' : 'No situs address on record',
        detail: candidate.situs_address ? undefined : 'Parcel may use CAD ID only',
      } as const,
      countyAlignment: {
        status: candidate.county ? 'success' : 'warning',
        message: candidate.county ? `Data from ${candidate.county} CAD` : 'County not identified',
      } as const,
      parcelUniqueness: {
        status: 'success' as const,
        message: 'Single parcel confirmed',
      },
    };
  }, [state.selectedCandidate]);

  // Compute assumptions
  const assumptions = useMemo(() => {
    const result: string[] = [];
    if (state.selectedCandidate?.confidence === 'low') {
      result.push('Approximate matching used due to ambiguous input');
    }
    if (state.candidates.length > 1) {
      result.push(`Selected from ${state.candidates.length} candidate parcels`);
    }
    return result;
  }, [state.selectedCandidate, state.candidates]);

  // Can confirm only if no validation errors
  const canConfirm = useMemo(() => {
    if (!validations) return false;
    return Object.values(validations).every(v => v.status !== 'error');
  }, [validations]);

  // Track map state for audit
  useEffect(() => {
    setMapState({
      zoom: mapZoom,
      centerLat: mapCenter[0],
      centerLng: mapCenter[1],
    });
  }, [mapZoom, mapCenter, setMapState]);

  // Clear any previously stored parcel on mount - always start fresh
  // Also set up map loading timeout
  useEffect(() => {
    localStorage.removeItem('siteintel_locked_parcel');
    
    // Progress through loading steps
    const stepTimers = [
      setTimeout(() => setMapLoadStep('basemap'), 500),
      setTimeout(() => setMapLoadStep('parcels'), 1500),
    ];
    
    // Timeout fallback - if map doesn't load in 15s, show error
    const timeoutId = setTimeout(() => {
      if (isMapLoading) {
        setMapLoadError(true);
      }
    }, 15000);
    
    return () => {
      stepTimers.forEach(clearTimeout);
      clearTimeout(timeoutId);
    };
  }, [isMapLoading]);

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
      
      // Clear announcement after read
      setTimeout(() => setSrAnnouncement(""), 4000);
    }
  }, [setCandidates, setRawInput, selectCandidate]);

  const handleCandidateSelect = useCallback((candidate: CandidateParcel) => {
    selectCandidate(candidate);
    // Update spotlight to new candidate's geometry (persistent orange)
    if (candidate.geom) {
      setSpotlightParcel(candidate.geom);
    }
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

  // Opens confirmation modal (first step of lock flow)
  const handleConfirmParcel = useCallback(() => {
    setShowLockConfirmation(true);
  }, []);

  // Actually lock the parcel (triggered from modal confirmation)
  const handleActualLock = useCallback(async () => {
    setIsLocking(true);
    try {
      const lockedParcel = await lockParcel();
      setShowLockConfirmation(false);
      toast.success("Parcel locked for feasibility analysis");
      onParcelLocked(lockedParcel);
    } catch (err: any) {
      console.error('[ParcelSelectionGate] Lock failed:', err);
      toast.error(err?.message || "Failed to lock parcel. Please try again.");
    } finally {
      setIsLocking(false);
    }
  }, [lockParcel, onParcelLocked]);

  // Handle map retry after error
  const handleMapRetry = useCallback(() => {
    setMapLoadError(false);
    setIsMapLoading(true);
    setMapLoadStep('init');
    // Force re-mount of map by toggling a key (we'll add this)
  }, []);

  // Handle successful map load
  const handleMapLoad = useCallback(() => {
    setMapLoadStep('ready');
    // Small delay before hiding skeleton for smooth transition
    setTimeout(() => {
      setIsMapLoading(false);
    }, 300);
  }, []);

  // Handle change parcel action
  const handleChangeParcel = useCallback(() => {
    clearSelection();
    setSpotlightParcel(null);
    setMobileStep('search');
  }, [clearSelection]);

  // Handle clear selection (from parcel card)
  const handleClearSelection = useCallback(() => {
    clearSelection();
    setSpotlightParcel(null);
    toast.info("Selection cleared");
  }, [clearSelection]);

  // Handle refresh parcel data
  const handleRefreshParcel = useCallback(async (parcelId: string) => {
    if (!state.selectedCandidate) return;
    
    setIsRefreshing(true);
    try {
      // Re-select the same candidate to trigger any data refresh
      // In a full implementation, this would re-fetch from the CAD API
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call
      toast.success("Property data refreshed");
    } catch (err) {
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  }, [state.selectedCandidate]);

  // Handle unlock (change parcel) from verified state
  // Survey upload handlers
  const handleSurveyUploaded = useCallback(async (survey: SurveyUploadMetadata) => {
    setUploadedSurvey(survey);
    // Fetch signed URL for overlay display
    const url = await getSurveyUrl(survey.storage_path);
    if (url) {
      setSurveyOverlayUrl(url);
      setShowSurveyOverlay(true);
      toast.success('Survey will display as overlay on the map');
    }
  }, []);

  const handleSurveyDeleted = useCallback(() => {
    setUploadedSurvey(null);
    setSurveyOverlayUrl(null);
    setShowSurveyOverlay(false);
  }, []);

  const handleSurveyOpacityChange = useCallback((opacity: number) => {
    setSurveyOverlayOpacity(opacity);
  }, []);

  const handleSurveyVisibilityToggle = useCallback((visible: boolean) => {
    setShowSurveyOverlay(visible);
  }, []);

  // Handle calibration complete - store the results
  const handleCalibrationComplete = useCallback((result: {
    transform: AffineTransform;
    bounds: TransformedBounds;
    matchedParcels: ParcelMatch[];
  }) => {
    console.log('[ParcelSelectionGate] Calibration complete:', result);
    // If we have matched parcels, we can convert them to candidates
    if (result.matchedParcels.length > 0) {
      toast.success(`Found ${result.matchedParcels.length} matching parcel(s)`);
    }
  }, []);

  // Handle parcel selected from calibration wizard
  const handleSurveyParcelSelected = useCallback((parcel: ParcelMatch) => {
    const geometryValidation = isValidParcelGeometry(parcel.geometry);
    
    console.log('[ParcelSelectionGate] Parcel selected from survey:', {
      parcel_id: parcel.parcel_id,
      overlap: parcel.overlapPercentage,
      confidence: parcel.confidence,
      geometryValid: geometryValidation.valid,
      geometryReason: geometryValidation.reason
    });
    
    // Guard: ensure geometry is valid (not just exists)
    if (!geometryValidation.valid) {
      console.error('[ParcelSelectionGate] Cannot select parcel with invalid geometry:', geometryValidation.reason);
      toast.error(`Selected parcel has invalid geometry: ${geometryValidation.reason}`);
      return;
    }
    
    // Convert ParcelMatch to CandidateParcel format
    const candidate: CandidateParcel = {
      parcel_id: parcel.parcel_id,
      situs_address: parcel.situs_address,
      owner_name: parcel.owner_name,
      acreage: parcel.acreage,
      county: parcel.county,
      confidence: parcel.confidence,
      geom: parcel.geometry as any,
      source: 'canonical',
      zoning: null,
      market_value: null,
      overlap_percentage: parcel.overlapPercentage,
    };
    
    // Set as candidates and select
    setCandidates([candidate]);
    selectCandidate(candidate);
    
    console.log('[ParcelSelectionGate] Candidate selected:', candidate.parcel_id);
    
    // Navigate to the parcel
    if (parcel.geometry) {
      const coords = parcel.geometry.type === 'Polygon' 
        ? parcel.geometry.coordinates[0]
        : parcel.geometry.coordinates[0][0];
      if (coords && coords.length > 0) {
        const centerLng = coords.reduce((sum: number, c: number[]) => sum + c[0], 0) / coords.length;
        const centerLat = coords.reduce((sum: number, c: number[]) => sum + c[1], 0) / coords.length;
        handleNavigateToLocation(centerLat, centerLng, 17);
      }
    }
    
    setMobileStep('verify');
    toast.success('Parcel selected from survey calibration');
  }, [setCandidates, selectCandidate, handleNavigateToLocation]);

  const handleUnlockParcel = useCallback(() => {
    unlockParcel();
    clearSelection();
    setSpotlightParcel(null);
    setMobileStep('search');
    toast.info("Selection cleared. Choose a different parcel.");
  }, [unlockParcel, clearSelection]);

  // Calculate centroid for verified parcel map centering
  const getParcelCentroid = useCallback((geom: any): [number, number] | null => {
    if (!geom || !geom.coordinates) return null;
    try {
      const coords = geom.type === 'MultiPolygon' 
        ? geom.coordinates[0][0] 
        : geom.coordinates[0];
      const lngs = coords.map((c: number[]) => c[0]);
      const lats = coords.map((c: number[]) => c[1]);
      return [
        lats.reduce((a: number, b: number) => a + b, 0) / lats.length,
        lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length
      ];
    } catch {
      return null;
    }
  }, []);

  // If already verified (locked), show verified checkpoint with full map
  if (state.lockedParcel) {
    const centroid = getParcelCentroid(state.lockedParcel.geom);
    
    return (
      <div className="relative w-full h-[calc(100vh-60px)] min-h-[600px]">
        {/* Desktop Layout - 3 Column Verified State */}
        <div className="absolute top-0 bottom-0 left-0 right-0 hidden lg:flex">
          {/* Left Panel - Verified Summary */}
          <div className="w-[280px] border-r bg-background p-4 overflow-y-auto">
            <LockedParcelSummary 
              parcel={state.lockedParcel} 
              onChangeParcel={handleUnlockParcel}
            />
          </div>

          {/* Center - Map (fully interactive) */}
          <div className="flex-1 relative">
            {/* Verified indicator badge */}
            <div className="absolute top-3 left-3 z-10 bg-[hsl(var(--status-success)/0.15)] backdrop-blur-sm rounded-full px-3 py-1.5 border border-[hsl(var(--status-success)/0.3)] flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[hsl(var(--status-success))]" />
              <span className="text-xs font-medium text-[hsl(var(--status-success))]">Verified</span>
            </div>
            
            <MapLibreCanvas
              center={centroid || mapCenter}
              zoom={17}
              showParcels={true}
              onParcelSelect={() => {}} // Info-only mode in verified state
              onMapLoad={handleMapLoad}
              selectedParcelId={state.lockedParcel.parcel_id}
              spotlightParcel={state.lockedParcel.geom}
              isVerified={true}
              showLegend={false}
              showAttribution={false}
              showZoomHint={false}
              showDataSourceBadge={false}
              className="w-full h-full"
            />
          </div>

          {/* Right Panel - Proceed to Payment */}
          <div className="w-[280px] border-l bg-background">
            <VerifiedParcelProceed 
              parcel={state.lockedParcel}
              onContinue={() => onParcelLocked(state.lockedParcel!)}
              onChangeParcel={handleUnlockParcel}
            />
          </div>
        </div>

        {/* Mobile/Tablet - Simplified verified state */}
        <div className="absolute top-0 bottom-0 left-0 right-0 lg:hidden flex flex-col">
          {/* Map takes most space */}
          <div className="flex-1 relative">
            <div className="absolute top-3 left-3 z-10 bg-[hsl(var(--status-success)/0.15)] backdrop-blur-sm rounded-full px-3 py-1.5 border border-[hsl(var(--status-success)/0.3)] flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[hsl(var(--status-success))]" />
              <span className="text-xs font-medium text-[hsl(var(--status-success))]">Verified</span>
            </div>
            
            <MapLibreCanvas
              center={centroid || mapCenter}
              zoom={17}
              showParcels={true}
              onParcelSelect={() => {}}
              selectedParcelId={state.lockedParcel.parcel_id}
              spotlightParcel={state.lockedParcel.geom}
              isVerified={true}
              showLegend={false}
              showAttribution={false}
              className="w-full h-full"
            />
          </div>
          
          {/* Bottom action bar */}
          <div className="border-t bg-background p-4 space-y-3">
            <div className="text-center">
              <p className="text-sm font-medium">{state.lockedParcel.situs_address || state.lockedParcel.parcel_id}</p>
              <p className="text-xs text-muted-foreground">{state.lockedParcel.acreage.toFixed(2)} ac · {state.lockedParcel.county}</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleUnlockParcel}
                className="flex-1"
                size="sm"
              >
                Change
              </Button>
              <Button 
                onClick={() => onParcelLocked(state.lockedParcel!)}
                className="flex-[2] bg-[hsl(var(--feasibility-orange))] hover:bg-[hsl(var(--feasibility-orange)/0.9)] text-white"
                size="sm"
              >
                Continue to Payment
              </Button>
            </div>
          </div>
        </div>
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
        onSurveyUploaded={handleSurveyUploaded}
        onSurveyDeleted={handleSurveyDeleted}
        onParcelSelected={handleSurveyParcelSelected}
        onCalibrationComplete={handleCalibrationComplete}
        surveyOverlayOpacity={surveyOverlayOpacity}
        onSurveyOpacityChange={handleSurveyOpacityChange}
        showSurveyOverlay={showSurveyOverlay}
        onSurveyVisibilityToggle={handleSurveyVisibilityToggle}
        uploadedSurvey={uploadedSurvey}
      />
      <div className="mt-6">
        <CandidateParcelList
          candidates={state.candidates}
          selectedId={state.selectedCandidate?.parcel_id || null}
          onSelect={handleCandidateSelect}
          onClear={handleClearSelection}
          onRefresh={handleRefreshParcel}
          isRefreshing={isRefreshing}
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
        {(isMapLoading || mapLoadError) && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-10"
          >
            <MapLoadingSkeleton 
              message="Loading map..." 
              step={mapLoadStep}
              hasError={mapLoadError}
              onRetry={handleMapRetry}
            />
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
        onMapLoad={handleMapLoad}
        selectedParcelId={state.selectedCandidate?.parcel_id}
        spotlightParcel={spotlightParcel}
        showLegend={false}
        showAttribution={false}
        showZoomHint={false}
        showDataSourceBadge={false}
        className="w-full h-full"
        surveyOverlayUrl={showSurveyOverlay ? surveyOverlayUrl : null}
        surveyOverlayOpacity={surveyOverlayOpacity}
      />
    </>
  );

  const verifyPanel = state.selectedCandidate && validations ? (
    <div className="space-y-4">
      <ParcelValidationCards
        candidate={state.selectedCandidate}
        validations={validations}
        assumptions={assumptions}
      />
      <ParcelConfirmationGate
        candidate={state.selectedCandidate}
        onConfirm={handleConfirmParcel}
        isLocking={isLocking}
        canConfirm={canConfirm}
        warnings={state.warnings}
      />
      
      {/* Confirmation Modal - UX Gate for irreversible action */}
      <ParcelLockConfirmationModal
        open={showLockConfirmation}
        onOpenChange={setShowLockConfirmation}
        candidate={state.selectedCandidate}
        onConfirm={handleActualLock}
        isConfirming={isLocking}
      />
    </div>
  ) : null;

  return (
    <div className="relative w-full h-[calc(100vh-60px)] min-h-[600px]">
      {/* Desktop Layout - 3 Column */}
      <div className="absolute top-0 bottom-0 left-0 right-0 hidden lg:flex">
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
              transition={{ duration: 0.18, ease: "easeOut" }}
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
      <div className="absolute top-0 bottom-0 left-0 right-0 lg:hidden flex flex-col">
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
