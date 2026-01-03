/**
 * SiteIntel™ Design Mode - Floating Map Controls (Google Earth Style)
 * 
 * Bottom-right vertical stack with compass, zoom, tilt controls.
 * Minimal chrome, always visible.
 */

import { useDesignStore } from "@/stores/useDesignStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Compass,
  Plus,
  Minus,
  RotateCcw,
  Mountain,
  Eye,
} from "lucide-react";
import { useState, useCallback } from "react";

interface FloatingMapControlsProps {
  className?: string;
  onResetNorth?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetView?: () => void;
  onTiltChange?: (tilt: number) => void;
  currentHeading?: number;
  currentTilt?: number;
}

export function FloatingMapControls({
  className,
  onResetNorth,
  onZoomIn,
  onZoomOut,
  onResetView,
  onTiltChange,
  currentHeading = 0,
  currentTilt = 45,
}: FloatingMapControlsProps) {
  const { canvasViewMode, isStreetViewMode, setIsStreetViewMode } = useDesignStore();
  const [localTilt, setLocalTilt] = useState(currentTilt);

  const handleTiltChange = useCallback(
    (value: number[]) => {
      const tilt = value[0];
      setLocalTilt(tilt);
      onTiltChange?.(tilt);
    },
    [onTiltChange]
  );

  // Only show 3D controls when in 3D mode
  const show3DControls = canvasViewMode === "3d" || canvasViewMode === "split";

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex flex-col items-center gap-2",
          className
        )}
      >
        {/* Compass - only in 3D */}
        {show3DControls && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full bg-background/95 backdrop-blur-md shadow-lg border"
                onClick={onResetNorth}
              >
                <Compass
                  className="h-5 w-5 text-muted-foreground transition-transform"
                  style={{ transform: `rotate(${-currentHeading}deg)` }}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Reset north (N)</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Zoom controls */}
        <div className="flex flex-col bg-background/95 backdrop-blur-md border shadow-lg rounded-full overflow-hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-none border-b"
                onClick={onZoomIn}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Zoom in (+)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-none"
                onClick={onZoomOut}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Zoom out (-)</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Tilt control - only in 3D */}
        {show3DControls && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full bg-background/95 backdrop-blur-md shadow-lg border"
              >
                <Mountain className="h-4 w-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="left" className="w-48">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tilt</span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(localTilt)}°
                  </span>
                </div>
                <Slider
                  value={[localTilt]}
                  onValueChange={handleTiltChange}
                  min={0}
                  max={90}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Top-down</span>
                  <span>Side</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Street View toggle - only in 3D */}
        {show3DControls && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-full bg-background/95 backdrop-blur-md shadow-lg border",
                  isStreetViewMode && "bg-primary text-primary-foreground"
                )}
                onClick={() => setIsStreetViewMode(!isStreetViewMode)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Street view (G)</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Reset view */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full bg-background/95 backdrop-blur-md shadow-lg border"
              onClick={onResetView}
            >
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Reset view (R)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
