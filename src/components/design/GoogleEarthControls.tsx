/**
 * SiteIntel™ Design Mode - Google Earth-Style Navigation Controls
 * 
 * Floating control panel with compass, zoom, tilt, and 2D/3D toggle.
 */

import React, { useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Compass,
  Plus,
  Minus,
  RotateCcw,
  Maximize2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GoogleEarthControlsProps {
  className?: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetNorth: () => void;
  onTiltChange: (degrees: number) => void;
  onReset3D: () => void;
  currentHeading?: number;
  currentTilt?: number;
}

export function GoogleEarthControls({
  className,
  onZoomIn,
  onZoomOut,
  onResetNorth,
  onTiltChange,
  onReset3D,
  currentHeading = 0,
  currentTilt = 45,
}: GoogleEarthControlsProps) {
  const [tilt, setTilt] = useState(currentTilt);
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync with external tilt changes
  useEffect(() => {
    setTilt(currentTilt);
  }, [currentTilt]);

  const handleTiltChange = useCallback((value: number[]) => {
    const newTilt = value[0];
    setTilt(newTilt);
    onTiltChange(newTilt);
  }, [onTiltChange]);

  // Convert heading to CSS rotation
  const compassRotation = -currentHeading;

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn(
        "flex flex-col items-center gap-2 p-2 bg-background/95 backdrop-blur-sm",
        "rounded-xl border shadow-lg",
        className
      )}>
        {/* Compass */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-12 w-12 rounded-full bg-muted/50 hover:bg-muted"
              onClick={onResetNorth}
            >
              <div
                className="transition-transform duration-300 ease-out"
                style={{ transform: `rotate(${compassRotation}deg)` }}
              >
                <Compass className="h-7 w-7 text-muted-foreground" />
                {/* North indicator */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-red-500" />
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Reset to North (N)</p>
          </TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className="w-6 h-px bg-border" />

        {/* Zoom Controls */}
        <div className="flex flex-col gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg hover:bg-muted"
                onClick={onZoomIn}
              >
                <Plus className="h-5 w-5" />
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
                className="h-9 w-9 rounded-lg hover:bg-muted"
                onClick={onZoomOut}
              >
                <Minus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Zoom out (-)</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Divider */}
        <div className="w-6 h-px bg-border" />

        {/* Tilt Controls */}
        <div className="flex flex-col items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-muted"
                onClick={() => handleTiltChange([Math.min(tilt + 15, 90)])}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Tilt up (more overhead)</p>
            </TooltipContent>
          </Tooltip>

          {/* Tilt indicator */}
          <div 
            className="relative w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className="text-[10px] font-medium text-muted-foreground">
              {Math.round(tilt)}°
            </span>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-muted"
                onClick={() => handleTiltChange([Math.max(tilt - 15, 0)])}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Tilt down (more perspective)</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Expanded Tilt Slider */}
        {isExpanded && (
          <div className="px-2 py-1 w-full">
            <Slider
              value={[tilt]}
              onValueChange={handleTiltChange}
              min={0}
              max={90}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Perspective</span>
              <span>Overhead</span>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="w-6 h-px bg-border" />

        {/* Reset 3D View */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg hover:bg-muted"
              onClick={onReset3D}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Reset 3D view (R)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export default GoogleEarthControls;
