/**
 * SiteIntel™ Design Mode - Google Earth-Style Top Bar
 * 
 * Unified top bar matching Google Earth's clean toolbar design.
 * Single container with vertical dividers, flat icons, and collapse functionality.
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDesignStore } from "@/stores/useDesignStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Share2,
  Download,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Wand2,
  ChevronUp,
} from "lucide-react";
import { ShareModal } from "./ShareModal";
import { useWizardStore } from "@/stores/useWizardStore";

interface EarthTopBarProps {
  className?: string;
}

/** Vertical divider between toolbar sections */
const ToolbarDivider = () => (
  <div className="h-6 w-px bg-white/20 mx-1" />
);

export function EarthTopBar({ className }: EarthTopBarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const {
    setCurrentView,
    isSaving,
    setShareModalOpen,
    session,
  } = useDesignStore();

  const { isOpen: isWizardOpen, openWizard, closeWizard } = useWizardStore();

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
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

  return (
    <>
      {/* Unified Google Earth-style toolbar with SiteIntel branding */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50",
          "bg-[hsl(222_82%_11%)] border-b border-white/10 shadow-md",
          className
        )}
      >
        <div className="flex items-center h-12 px-2">
          {/* Left section: Back + Search */}
          <div className="flex items-center gap-1">
            {/* Back button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="h-8 w-8 rounded-md text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <ArrowLeft className="h-[18px] w-[18px]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Go back</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Search input */}
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  ref={searchRef}
                  type="text"
                  placeholder="Search address, place, parcel ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  className="w-[240px] pl-8 pr-3 h-8 bg-white/10 border border-white/20 rounded-md text-sm text-white placeholder:text-white/50 focus-visible:ring-1 focus-visible:ring-[hsl(27_100%_50%)]"
                />
              </div>
              {/* Search dropdown */}
              {isSearchFocused && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border shadow-lg rounded-md p-2 z-50">
                  <div className="text-xs text-muted-foreground p-1.5">
                    Press Enter to search...
                  </div>
                </div>
              )}
            </form>
          </div>

          <ToolbarDivider />

          {/* Center section: Tools (collapsed hides these) */}
          {!isCollapsed && (
            <>
              {/* Saving indicator */}
              {isSaving && (
                <div className="flex items-center gap-1.5 text-xs text-white/60 px-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </div>
              )}

              {/* Explore Designs wizard toggle */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 rounded-md px-3 text-sm gap-1.5",
                        isWizardOpen
                          ? "bg-[hsl(27_100%_50%)] text-white hover:bg-[hsl(27_100%_45%)]"
                          : "text-white/80 hover:text-white hover:bg-white/10"
                      )}
                      onClick={() => {
                        if (isWizardOpen) {
                          closeWizard();
                          useDesignStore.getState().clearPreviewGeometry();
                        } else {
                          openWizard();
                        }
                      }}
                    >
                      <Wand2 className="h-4 w-4" />
                      Explore
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Design Wizard (W)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <ToolbarDivider />

              {/* Conceptual Design indicator */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-[hsl(27_100%_50%)] px-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs font-medium">Conceptual</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>This is a conceptual design for illustration purposes</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <ToolbarDivider />
            </>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right section: Actions */}
          {!isCollapsed && (
            <>
              {/* Share button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-md px-3 text-sm gap-1.5 text-white/80 hover:text-white hover:bg-white/10"
                      onClick={() => setShareModalOpen(true)}
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Share this design</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Export button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-md px-3 text-sm gap-1.5 text-white/80 hover:text-white hover:bg-white/10"
                      onClick={() => setCurrentView("export")}
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Export report</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <ToolbarDivider />
            </>
          )}

          {/* Collapse/Expand chevron */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md text-white/60 hover:text-white hover:bg-white/10"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                >
                  <ChevronUp
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isCollapsed && "rotate-180"
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{isCollapsed ? "Expand toolbar" : "Collapse toolbar"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal sessionName={session?.name} />
    </>
  );
}
