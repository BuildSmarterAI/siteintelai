/**
 * SiteIntel™ Design Mode - Google Earth-Style Navigation Controls
 * 
 * Floating control panel with compass, zoom, tilt, and 2D/3D toggle.
 * Enhanced with smooth animations and Google Earth-like styling.
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
  Plus,
  Minus,
  Maximize2,
  ChevronUp,
  ChevronDown,
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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

  // Snap points for tilt
  const snapPoints = [0, 30, 45, 60, 90];
  const nearestSnap = snapPoints.reduce((prev, curr) => 
    Math.abs(curr - tilt) < Math.abs(prev - tilt) ? curr : prev
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn(
        "flex flex-col items-center gap-1.5 p-2 bg-background/95 backdrop-blur-md",
        "rounded-xl border shadow-xl",
        className
      )}>
        {/* Compass with Cardinal Directions */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-14 w-14 rounded-full bg-muted/50 hover:bg-muted overflow-hidden group"
              onClick={onResetNorth}
            >
              {/* Compass ring with degree markers */}
              <div className="absolute inset-1 rounded-full border border-border/50" />
              
              {/* Rotating compass face */}
              <motion.div
                className="relative w-full h-full flex items-center justify-center"
                animate={{ rotate: compassRotation }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
              >
                {/* Cardinal direction labels */}
                <span className="absolute top-1.5 text-[9px] font-bold text-red-500">N</span>
                <span className="absolute right-1.5 text-[8px] font-medium text-muted-foreground/70">E</span>
                <span className="absolute bottom-1.5 text-[8px] font-medium text-muted-foreground/70">S</span>
                <span className="absolute left-1.5 text-[8px] font-medium text-muted-foreground/70">W</span>
                
                {/* Compass needle */}
                <div className="relative w-6 h-6">
                  {/* North pointer (red triangle) */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 
                    border-l-[5px] border-r-[5px] border-b-[10px] 
                    border-l-transparent border-r-transparent border-b-red-500" />
                  {/* South pointer (gray triangle) */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 
                    border-l-[4px] border-r-[4px] border-t-[8px] 
                    border-l-transparent border-r-transparent border-t-muted-foreground/40" />
                </div>
              </motion.div>
              
              {/* Hover indicator */}
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 
                bg-primary/5 transition-opacity" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="flex flex-col">
            <span>Reset to North</span>
            <span className="text-[10px] text-muted-foreground">Press N</span>
          </TooltipContent>
        </Tooltip>

        {/* Heading display */}
        <div className="text-[10px] font-mono text-muted-foreground">
          {Math.round(currentHeading)}°
        </div>

        {/* Divider */}
        <div className="w-8 h-px bg-border" />

        {/* Zoom Controls */}
        <div className="flex flex-col gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg hover:bg-muted active:scale-95 transition-transform"
                onClick={onZoomIn}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="flex flex-col">
              <span>Zoom in</span>
              <span className="text-[10px] text-muted-foreground">Press +</span>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg hover:bg-muted active:scale-95 transition-transform"
                onClick={onZoomOut}
              >
                <Minus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="flex flex-col">
              <span>Zoom out</span>
              <span className="text-[10px] text-muted-foreground">Press -</span>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Divider */}
        <div className="w-8 h-px bg-border" />

        {/* Tilt Controls with Visual Feedback */}
        <div className="flex flex-col items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-muted active:scale-95 transition-transform"
                onClick={() => handleTiltChange([Math.min(tilt + 15, 90)])}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <span>Tilt up (overhead view)</span>
            </TooltipContent>
          </Tooltip>

          {/* Tilt indicator with perspective preview */}
          <div 
            className="relative w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center cursor-pointer
              hover:bg-muted/70 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {/* Visual tilt indicator - tilting rectangle */}
            <motion.div
              className="w-6 h-4 border-2 border-muted-foreground/60 rounded-sm"
              style={{
                transformStyle: "preserve-3d",
                perspective: "100px",
              }}
              animate={{
                rotateX: (90 - tilt) * 0.8,
              }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            />
            {/* Degree text */}
            <span className="absolute bottom-0.5 text-[9px] font-mono text-muted-foreground">
              {Math.round(tilt)}°
            </span>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-muted active:scale-95 transition-transform"
                onClick={() => handleTiltChange([Math.max(tilt - 15, 0)])}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <span>Tilt down (perspective view)</span>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Expanded Tilt Slider */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              className="px-2 py-2 w-full"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Slider
                value={[tilt]}
                onValueChange={handleTiltChange}
                min={0}
                max={90}
                step={1}
                className="w-full"
              />
              {/* Snap point indicators */}
              <div className="relative h-3 mt-1">
                {snapPoints.map((point) => (
                  <div
                    key={point}
                    className={cn(
                      "absolute top-0 w-0.5 h-1.5 rounded-full transition-colors",
                      Math.abs(point - tilt) < 5 ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                    style={{ left: `${(point / 90) * 100}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                <span>Side</span>
                <span>Top</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Divider */}
        <div className="w-8 h-px bg-border" />

        {/* Reset 3D View */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg hover:bg-muted active:scale-95 transition-transform"
              onClick={onReset3D}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="flex flex-col">
            <span>Reset 3D view</span>
            <span className="text-[10px] text-muted-foreground">Press R</span>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export default GoogleEarthControls;
