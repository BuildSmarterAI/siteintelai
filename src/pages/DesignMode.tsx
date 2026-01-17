/**
 * SiteIntel™ Design Mode Page - Google Earth Style
 * 
 * Map-first overlay architecture matching Google Earth UX patterns.
 * Full-bleed canvas with floating overlay panels.
 */

import { useEffect, useCallback, useMemo, lazy, Suspense, useState } from "react";
import { cn } from "@/lib/utils";
import { useParams, useNavigate } from "react-router-dom";
import { useDesignStore } from "@/stores/useDesignStore";
import { supabase } from "@/integrations/supabase/client";
import { useRegulatoryEnvelope } from "@/hooks/useRegulatoryEnvelope";
import { useDesignSession } from "@/hooks/useDesignSession";
import { checkCompliance } from "@/lib/designCompliance";
import { calculateMetrics } from "@/lib/designMetrics";
import { EarthTopBar } from "@/components/design/EarthTopBar";
import { MapContentsPanel } from "@/components/design/MapContentsPanel";
import { ComplianceDock } from "@/components/design/ComplianceDock";
import { DesignWizardPanel } from "@/components/wizard";
import { useWizardStore } from "@/stores/useWizardStore";
import { ComplianceChip } from "@/components/design/ComplianceChip";
import { FloatingMapControls } from "@/components/design/FloatingMapControls";
import { DesignModeCanvas } from "@/components/design/DesignModeCanvas";

import { DesignMeasurementResultPanel } from "@/components/design/DesignMeasurementResultPanel";
import { CompareMode } from "@/components/design/CompareMode";
import { ExportPanel } from "@/components/design/ExportPanel";
import { SafeCesiumLoader } from "@/components/design/CesiumErrorBoundary";
import { CesiumLoadingFallback } from "@/components/design/CesiumLoadingFallback";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

// Lazy load Cesium components to isolate HMR issues
const CesiumViewerLazy = lazy(() =>
  import("@/components/design/CesiumViewer").then((module) => ({
    default: module.CesiumViewerComponent,
  }))
);
const SplitViewCanvasLazy = lazy(() =>
  import("@/components/design/SplitViewCanvas").then((module) => ({
    default: module.SplitViewCanvas,
  }))
);

export default function DesignMode() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const {
    currentView,
    setCurrentView,
    envelope,
    session,
    variants,
    activeVariantId,
    updateVariant,
    isDrawing,
    setIsDrawing,
    canvasViewMode,
    setCanvasViewMode,
    measurementMode,
    setMeasurementMode,
    clearMeasurement,
    reset,
    leftPanelState,
    setLeftPanelState,
    setPropertyAddress,
  } = useDesignStore();

  const isWizardOpen = useWizardStore((s) => s.isOpen);

  // Fetch or compute envelope
  const {
    isLoading: isLoadingEnvelope,
    isComputing,
    computeEnvelope,
  } = useRegulatoryEnvelope(applicationId);

  // Fetch session and variants
  const {
    session: fetchedSession,
    isLoading: isLoadingSession,
    createSession,
    updateVariant: saveVariant,
  } = useDesignSession(envelope?.id);

  // State for auth check
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Compute envelope on mount if needed - with auth check
  useEffect(() => {
    // Skip if envelope already exists, or loading, or already computing
    if (envelope || isLoadingEnvelope || isComputing || !applicationId) return;
    
    const checkAuthAndCompute = async () => {
      setIsCheckingAuth(true);
      setAuthError(null);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setAuthError("Please sign in to access Design Mode");
          return;
        }
        
        // Authenticated - compute envelope
        computeEnvelope(applicationId);
      } catch (error) {
        console.error("Auth check failed:", error);
        setAuthError("Failed to verify authentication");
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuthAndCompute();
  }, [applicationId, envelope, isLoadingEnvelope, isComputing, computeEnvelope]);

  // Create session if envelope exists but no session
  useEffect(() => {
    if (envelope && !fetchedSession && !isLoadingSession) {
      createSession({ envelopeId: envelope.id });
    }
  }, [envelope, fetchedSession, isLoadingSession, createSession]);

  // Fetch property address when envelope loads
  useEffect(() => {
    if (!envelope?.applicationId) return;

    const fetchAddress = async () => {
      const { data } = await supabase
        .from("applications")
        .select("formatted_address")
        .eq("id", envelope.applicationId)
        .single();

      if (data?.formatted_address) {
        setPropertyAddress(data.formatted_address);
      }
    };

    fetchAddress();
  }, [envelope?.applicationId, setPropertyAddress]);

  // Reset on unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  // Get active variant
  const activeVariant = useMemo(
    () => variants.find((v) => v.id === activeVariantId),
    [variants, activeVariantId]
  );

  // Run compliance checks when variant changes
  useEffect(() => {
    if (!activeVariant?.footprint || !envelope) return;

    const constraints = {
      envelopeGeometry: envelope.buildableFootprint2d,
      parcelGeometry: envelope.parcelGeometry,
      farCap: envelope.farCap,
      heightCapFt: envelope.heightCapFt,
      coverageCapPct: envelope.coverageCapPct,
      parcelAcres: 1, // TODO: Get from application
    };

    const result = checkCompliance(
      activeVariant.footprint,
      activeVariant.heightFt,
      activeVariant.floors,
      constraints
    );

    const metrics = calculateMetrics(
      activeVariant.footprint,
      activeVariant.floors,
      activeVariant.heightFt,
      constraints,
      result.violations.length
    );

    // Update local state
    updateVariant(activeVariant.id, {
      complianceStatus: result.overall,
      complianceResult: result,
      metrics,
    });

    // Persist to database
    saveVariant({
      id: activeVariant.id,
      updates: {
        compliance_status: result.overall,
      },
    });
  }, [
    activeVariant?.footprint,
    activeVariant?.heightFt,
    activeVariant?.floors,
    envelope,
  ]);

  // Keyboard shortcuts - Google Earth patterns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "d":
          handleStartDrawing();
          break;
        case "t":
          // Cycle through 2D → 3D → Split → 2D
          const modes: ("2d" | "3d" | "split")[] = ["2d", "3d", "split"];
          const currentIndex = modes.indexOf(canvasViewMode);
          const nextIndex = (currentIndex + 1) % modes.length;
          setCanvasViewMode(modes[nextIndex]);
          break;
        case "m":
          // Toggle measurement mode (cycle through distance → area → off)
          if (!measurementMode) {
            setMeasurementMode("distance");
          } else if (measurementMode === "distance") {
            setMeasurementMode("area");
          } else {
            clearMeasurement();
          }
          break;
        case "[":
          // Toggle left panel
          if (leftPanelState === "expanded") {
            setLeftPanelState("collapsed");
          } else if (leftPanelState === "collapsed") {
            setLeftPanelState("hidden");
          } else {
            setLeftPanelState("expanded");
          }
          break;
        case "n":
          // Reset north (handled by map controls)
          break;
        case "r":
          // Reset view (handled by map controls)
          break;
        case "w":
          const wizardStore = useWizardStore.getState();
          if (wizardStore.isOpen) {
            wizardStore.closeWizard();
          } else {
            wizardStore.openWizard();
          }
          break;
        case "escape":
          setIsDrawing(false);
          clearMeasurement();
          useWizardStore.getState().closeWizard();
          break;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          const idx = parseInt(e.key) - 1;
          if (variants[idx]) {
            useDesignStore.getState().setActiveVariantId(variants[idx].id);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    variants,
    canvasViewMode,
    setCanvasViewMode,
    measurementMode,
    setMeasurementMode,
    clearMeasurement,
    setIsDrawing,
    leftPanelState,
    setLeftPanelState,
  ]);

  // Handlers
  const handleStartDrawing = useCallback(() => {
    if (!activeVariant) {
      toast.error("Select a variant first");
      return;
    }
    setIsDrawing(true);
  }, [activeVariant, setIsDrawing]);

  const handleClearDrawing = useCallback(() => {
    if (!activeVariant) return;
    updateVariant(activeVariant.id, {
      footprint: null,
      metrics: null,
      complianceStatus: "PENDING",
      complianceResult: null,
    });
    saveVariant({
      id: activeVariant.id,
      updates: {
        footprint: null,
        compliance_status: "PENDING",
      },
    });
  }, [activeVariant, updateVariant, saveVariant]);

  // Auth error state - show login prompt
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-xl font-semibold">Authentication Required</h2>
          <p className="text-muted-foreground">{authError}</p>
          <Button onClick={() => navigate("/auth")}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoadingEnvelope || isComputing || isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">
            {isCheckingAuth ? "Verifying session..." : isComputing ? "Computing regulatory envelope..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // No envelope error
  if (!envelope && !isLoadingEnvelope) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-xl font-semibold">Unable to Load Design Mode</h2>
          <p className="text-muted-foreground">
            Could not compute the regulatory envelope for this property. Please
            ensure the feasibility analysis is complete.
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Compare/Export views
  if (currentView === "compare") {
    return (
      <>
        <EarthTopBar />
        <div className="h-screen pt-20">
          <CompareMode className="h-full" />
        </div>
      </>
    );
  }

  if (currentView === "export") {
    return (
      <>
        <EarthTopBar />
        <div className="h-screen pt-20 flex justify-center">
          <ExportPanel className="max-w-2xl w-full" />
        </div>
      </>
    );
  }

  // Main design view - Google Earth style full-bleed canvas
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-muted">
      {/* Full-bleed canvas - absolutely positioned behind overlays */}
      <div className="absolute inset-0 z-0">
        {canvasViewMode === "split" ? (
          <SafeCesiumLoader
            onFallbackTo2D={() => setCanvasViewMode("2d")}
            fallback={<CesiumLoadingFallback />}
          >
            <Suspense fallback={<CesiumLoadingFallback />}>
              <SplitViewCanvasLazy className="absolute inset-0" />
            </Suspense>
          </SafeCesiumLoader>
        ) : canvasViewMode === "3d" ? (
          <SafeCesiumLoader
            onFallbackTo2D={() => setCanvasViewMode("2d")}
            fallback={<CesiumLoadingFallback />}
          >
            <Suspense fallback={<CesiumLoadingFallback />}>
              <CesiumViewerLazy className="absolute inset-0" />
            </Suspense>
          </SafeCesiumLoader>
        ) : (
          <DesignModeCanvas className="absolute inset-0" />
        )}
      </div>

      {/* Google Earth-style overlay components */}

      {/* Top bar */}
      <EarthTopBar />

      {/* Left panel - Map Contents (Variants + Layers) */}
      <MapContentsPanel
        sessionId={session?.id}
        panelState={leftPanelState}
        setPanelState={setLeftPanelState}
      />

      {/* Right panel - Compliance Dock (hidden when wizard is open) */}
      {!isWizardOpen && <ComplianceDock />}

      {/* Design Wizard Panel */}
      <DesignWizardPanel />

      {/* Measurement tools are now integrated into EarthTopBar */}

      {/* Measurement results - shifts right when wizard open */}
      <DesignMeasurementResultPanel 
        className={cn(
          "fixed bottom-24 z-30 w-48 transition-all duration-300",
          isWizardOpen ? "right-[540px]" : "right-20"
        )} 
      />

      {/* Bottom left - Collapsible compliance chip */}
      <ComplianceChip className="fixed bottom-4 left-4 z-30 min-w-48" />

      {/* Bottom right - Floating map controls - shifts left when wizard open */}
      <FloatingMapControls 
        className={cn(
          "fixed bottom-4 z-40 transition-all duration-300",
          isWizardOpen ? "right-[540px]" : "right-4"
        )} 
      />
    </div>
  );
}
