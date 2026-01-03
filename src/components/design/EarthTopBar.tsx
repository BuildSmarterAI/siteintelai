/**
 * SiteIntel™ Design Mode - Google Earth-Style Top Bar
 * 
 * Floating top bar with search, tool icons, mode toggles, and primary actions.
 * Matches Google Earth's interaction patterns while preserving SiteIntel features.
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDesignStore } from "@/stores/useDesignStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Undo2,
  Redo2,
  PenTool,
  Ruler,
  Eraser,
  Columns2,
  Share2,
  Download,
  ArrowLeft,
  Map,
  Box,
  SplitSquareHorizontal,
  Loader2,
  ChevronDown,
  AlertTriangle,
  Wand2,
} from "lucide-react";
import { ShareModal } from "./ShareModal";
import { useWizardStore } from "@/stores/useWizardStore";

interface EarthTopBarProps {
  className?: string;
  onStartDrawing?: () => void;
  onClearDrawing?: () => void;
}

export function EarthTopBar({ 
  className, 
  onStartDrawing,
  onClearDrawing 
}: EarthTopBarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const {
    currentView,
    setCurrentView,
    canvasViewMode,
    setCanvasViewMode,
    isDrawing,
    setIsDrawing,
    measurementMode,
    setMeasurementMode,
    clearMeasurement,
    isSaving,
    activeVariantId,
    shareModalOpen,
    setShareModalOpen,
    session,
  } = useDesignStore();

  const { isOpen: isWizardOpen, openWizard, closeWizard } = useWizardStore();

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement geocoding fly-to
      console.log("Search for:", searchQuery);
    }
  };

  // Handle ESC to close search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSearchFocused) {
        searchRef.current?.blur();
        setIsSearchFocused(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchFocused]);

  const handleDrawClick = () => {
    if (isDrawing) {
      setIsDrawing(false);
    } else if (onStartDrawing) {
      onStartDrawing();
    }
  };

  const handleMeasureClick = () => {
    if (measurementMode) {
      clearMeasurement();
    } else {
      setMeasurementMode("distance");
    }
  };

  const handleEraseClick = () => {
    if (onClearDrawing) {
      onClearDrawing();
    }
  };

  return (
    <>
      <div
        className={cn(
          "fixed top-4 left-4 right-4 z-50 flex items-center justify-between gap-4",
          className
        )}
      >
        {/* Left section: Back, Search, Tools */}
        <div className="flex items-center gap-3">
          {/* Back button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="bg-background/95 backdrop-blur-md border shadow-lg rounded-full h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {/* Search pill */}
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                type="text"
                placeholder="Search address, place, parcel ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="w-[280px] pl-9 pr-4 h-10 bg-background/95 backdrop-blur-md border shadow-lg rounded-full"
              />
            </div>
            {/* Search dropdown - would show results here */}
            {isSearchFocused && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-md border shadow-xl rounded-xl p-2">
                <div className="text-xs text-muted-foreground p-2">
                  Press Enter to search...
                </div>
              </div>
            )}
          </form>

          {/* Tool icons */}
          <TooltipProvider>
            <div className="flex items-center gap-1 bg-background/95 backdrop-blur-md border shadow-lg rounded-full px-2 py-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-full",
                      isDrawing && "bg-primary text-primary-foreground"
                    )}
                    onClick={handleDrawClick}
                    disabled={!activeVariantId}
                  >
                    <PenTool className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Draw footprint (D)</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-full",
                      measurementMode && "bg-primary text-primary-foreground"
                    )}
                    onClick={handleMeasureClick}
                  >
                    <Ruler className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Measure (M)</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={handleEraseClick}
                    disabled={!activeVariantId}
                  >
                    <Eraser className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear footprint</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* Center section: View mode toggle */}
        <div className="flex items-center gap-1 bg-background/95 backdrop-blur-md border shadow-lg rounded-full px-1 py-1">
          <Button
            variant={canvasViewMode === "2d" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 rounded-full px-4"
            onClick={() => setCanvasViewMode("2d")}
          >
            <Map className="h-4 w-4 mr-1.5" />
            2D
          </Button>
          <Button
            variant={canvasViewMode === "3d" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 rounded-full px-4"
            onClick={() => setCanvasViewMode("3d")}
          >
            <Box className="h-4 w-4 mr-1.5" />
            3D
          </Button>
          <Button
            variant={canvasViewMode === "split" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 rounded-full px-4"
            onClick={() => setCanvasViewMode("split")}
          >
            <SplitSquareHorizontal className="h-4 w-4 mr-1.5" />
            Split
          </Button>
        </div>

        {/* Right section: Actions */}
        <div className="flex items-center gap-3">
          {/* Saving indicator */}
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/95 backdrop-blur-md border shadow-lg rounded-full px-3 py-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving...</span>
            </div>
          )}

          {/* Disclaimer badge - always visible */}
          <Badge
            variant="outline"
            className="bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 text-xs font-medium shadow-lg"
          >
            <AlertTriangle className="h-3 w-3 mr-1.5" />
            Conceptual Design
          </Badge>

          {/* Explore Designs wizard toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isWizardOpen ? "secondary" : "outline"}
                  size="sm"
                  className="h-10 bg-background/95 backdrop-blur-md shadow-lg rounded-full px-4"
                  onClick={() => isWizardOpen ? closeWizard() : openWizard()}
                >
                  <Wand2 className="h-4 w-4 mr-1.5" />
                  Explore Designs
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Design Wizard (W)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* View mode buttons */}
          <div className="flex items-center gap-1 bg-background/95 backdrop-blur-md border shadow-lg rounded-full px-1 py-1">
            <Button
              variant={currentView === "design" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 rounded-full px-4"
              onClick={() => setCurrentView("design")}
            >
              Design
            </Button>
            <Button
              variant={currentView === "compare" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 rounded-full px-4"
              onClick={() => setCurrentView("compare")}
            >
              <Columns2 className="h-4 w-4 mr-1.5" />
              Compare
            </Button>
          </div>

          {/* Share button */}
          <Button
            variant="outline"
            size="sm"
            className="h-10 bg-background/95 backdrop-blur-md shadow-lg rounded-full px-4"
            onClick={() => setShareModalOpen(true)}
          >
            <Share2 className="h-4 w-4 mr-1.5" />
            Share
          </Button>

          {/* Export button */}
          <Button
            size="sm"
            className="h-10 shadow-lg rounded-full px-4"
            onClick={() => setCurrentView("export")}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal sessionName={session?.name} />
    </>
  );
}
