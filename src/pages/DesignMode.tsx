/**
 * SiteIntel™ Design Mode Page
 * 
 * Main entry point for conceptual design exploration.
 * Per PRD: "Lets you explore what's legally possible — not how to build it."
 */

import { useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useDesignStore } from "@/stores/useDesignStore";
import { useRegulatoryEnvelope } from "@/hooks/useRegulatoryEnvelope";
import { useDesignSession } from "@/hooks/useDesignSession";
import { checkCompliance } from "@/lib/designCompliance";
import { calculateMetrics } from "@/lib/designMetrics";
import { DesignDisclaimerBadge } from "@/components/design/DesignDisclaimerBadge";
import { DesignMetricsBar } from "@/components/design/DesignMetricsBar";
import { CompliancePanel } from "@/components/design/CompliancePanel";
import { DesignVariantList } from "@/components/design/DesignVariantList";
import { DesignToolbar } from "@/components/design/DesignToolbar";
import { CesiumViewerComponent } from "@/components/design/CesiumViewer";
import { DesignModeCanvas } from "@/components/design/DesignModeCanvas";
import { ViewModeToggle } from "@/components/design/ViewModeToggle";
import { CompareMode } from "@/components/design/CompareMode";
import { ExportPanel } from "@/components/design/ExportPanel";
import { KeyboardShortcutsHelp } from "@/components/design/KeyboardShortcutsHelp";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Maximize2, 
  Columns2, 
  Download,
  Loader2
} from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function DesignMode() {
  const { applicationId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    currentView,
    setCurrentView,
    envelope,
    session,
    variants,
    activeVariantId,
    updateVariant,
    setIsDrawing,
    canvasViewMode,
    setCanvasViewMode,
    reset,
  } = useDesignStore();

  // Fetch or compute envelope
  const { 
    isLoading: isLoadingEnvelope, 
    isComputing,
    computeEnvelope 
  } = useRegulatoryEnvelope(applicationId);

  // Fetch session and variants
  const { 
    session: fetchedSession,
    isLoading: isLoadingSession,
    createSession,
    updateVariant: saveVariant,
  } = useDesignSession(envelope?.id);

  // Compute envelope on mount if needed
  useEffect(() => {
    if (applicationId && !envelope && !isLoadingEnvelope && !isComputing) {
      computeEnvelope(applicationId);
    }
  }, [applicationId, envelope, isLoadingEnvelope, isComputing, computeEnvelope]);

  // Create session if envelope exists but no session
  useEffect(() => {
    if (envelope && !fetchedSession && !isLoadingSession) {
      createSession({ envelopeId: envelope.id });
    }
  }, [envelope, fetchedSession, isLoadingSession, createSession]);

  // Reset on unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  // Get active variant
  const activeVariant = useMemo(() => 
    variants.find(v => v.id === activeVariantId),
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "d":
          handleStartDrawing();
          break;
        case "t":
          // Toggle between 2D and 3D views
          setCanvasViewMode(canvasViewMode === "2d" ? "3d" : "2d");
          break;
        case "escape":
          setIsDrawing(false);
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
  }, [variants, canvasViewMode, setCanvasViewMode]);

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

  const handleResetToEnvelope = useCallback(() => {
    if (!activeVariant || !envelope) return;
    // Set footprint to envelope geometry
    updateVariant(activeVariant.id, {
      footprint: envelope.buildableFootprint2d,
    });
    saveVariant({
      id: activeVariant.id,
      updates: {
        footprint: envelope.buildableFootprint2d as unknown,
      },
    });
    toast.success("Footprint set to maximum buildable area");
  }, [activeVariant, envelope, updateVariant, saveVariant]);

  const handleHeightChange = useCallback((height: number) => {
    if (!activeVariant) return;
    updateVariant(activeVariant.id, { heightFt: height });
    saveVariant({
      id: activeVariant.id,
      updates: { height_ft: height },
    });
  }, [activeVariant, updateVariant, saveVariant]);

  const handleFloorsChange = useCallback((floors: number) => {
    if (!activeVariant) return;
    updateVariant(activeVariant.id, { floors });
    saveVariant({
      id: activeVariant.id,
      updates: { floors },
    });
  }, [activeVariant, updateVariant, saveVariant]);

  // Loading state
  if (isLoadingEnvelope || isComputing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">
            {isComputing ? "Computing regulatory envelope..." : "Loading..."}
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
            Could not compute the regulatory envelope for this property.
            Please ensure the feasibility analysis is complete.
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Design Mode
            </h1>
            <p className="text-xs text-muted-foreground">
              {session?.name || "Loading session..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ViewModeToggle />
          <div className="h-6 w-px bg-border" />
          <KeyboardShortcutsHelp />
          <DesignDisclaimerBadge />

          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={currentView === "design" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setCurrentView("design")}
            >
              <Maximize2 className="h-4 w-4 mr-1.5" />
              Design
            </Button>
            <Button
              variant={currentView === "compare" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setCurrentView("compare")}
            >
              <Columns2 className="h-4 w-4 mr-1.5" />
              Compare
            </Button>
            <Button
              variant={currentView === "export" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setCurrentView("export")}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      {currentView === "design" ? (
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left sidebar - Variants */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <DesignVariantList sessionId={session?.id} />
          </ResizablePanel>

          <ResizableHandle />

          {/* Center - Map canvas */}
          <ResizablePanel defaultSize={55}>
            <div className="h-full flex flex-col">
              {/* Toolbar */}
              <div className="p-3 border-b">
                <DesignToolbar
                  onStartDrawing={handleStartDrawing}
                  onClearDrawing={handleClearDrawing}
                  onResetToEnvelope={handleResetToEnvelope}
                  onHeightChange={handleHeightChange}
                  onFloorsChange={handleFloorsChange}
                />
              </div>

              {/* Canvas - 2D or 3D based on toggle */}
              <div id="design-canvas" className="flex-1 relative bg-muted">
                {canvasViewMode === "3d" ? (
                  <CesiumViewerComponent className="absolute inset-0" />
                ) : (
                  <DesignModeCanvas className="absolute inset-0" />
                )}

                {/* Envelope info overlay */}
                {envelope && (
                  <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm border rounded-lg p-3 text-sm max-w-xs z-10">
                    <h4 className="font-medium mb-2">Regulatory Envelope</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>FAR Cap:</span>
                        <span className="font-medium text-foreground">{envelope.farCap}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Height Cap:</span>
                        <span className="font-medium text-foreground">{envelope.heightCapFt}'</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Coverage Cap:</span>
                        <span className="font-medium text-foreground">{envelope.coverageCapPct}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Metrics bar */}
              <div className="p-3 border-t">
                <DesignMetricsBar />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right sidebar - Compliance */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <div className="h-full p-4 overflow-y-auto">
              <CompliancePanel />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : currentView === "compare" ? (
        <CompareMode className="flex-1" />
      ) : (
        <ExportPanel className="flex-1 max-w-2xl mx-auto" />
      )}
    </div>
  );
}
