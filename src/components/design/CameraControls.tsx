/**
 * SiteIntel™ Design Mode - Camera Controls
 * 
 * Provides camera preset buttons and orbit controls for the Cesium viewer.
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Compass,
  Play,
  Pause,
} from "lucide-react";
import { useDesignStore, CameraPreset } from "@/stores/useDesignStore";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CameraControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetCamera?: () => void;
  className?: string;
}

const CAMERA_PRESETS: { id: CameraPreset; label: string; icon?: React.ReactNode }[] = [
  { id: "parcel_fit", label: "Fit" },
  { id: "overhead", label: "Top" },
  { id: "perspective_ne", label: "NE" },
  { id: "perspective_sw", label: "SW" },
  { id: "street", label: "Street" },
];

export function CameraControls({
  onZoomIn,
  onZoomOut,
  onResetCamera,
  className,
}: CameraControlsProps) {
  const { cameraPreset, setCameraPreset, isOrbiting, setIsOrbiting } = useDesignStore();

  return (
    <TooltipProvider>
      <div className={cn(
        "absolute bottom-4 left-4 flex flex-col gap-2 z-10",
        className
      )}>
        {/* Camera Presets */}
        <div className="bg-background/90 backdrop-blur-sm rounded-lg border shadow-lg p-1 flex gap-1">
          {CAMERA_PRESETS.map((preset) => (
            <Tooltip key={preset.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={cameraPreset === preset.id ? "default" : "ghost"}
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => {
                    setCameraPreset(preset.id);
                    setIsOrbiting(false);
                  }}
                >
                  {preset.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{preset.label} View</p>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {/* Orbit Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isOrbiting ? "default" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  setIsOrbiting(!isOrbiting);
                  if (!isOrbiting) {
                    setCameraPreset("orbit");
                  }
                }}
              >
                {isOrbiting ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{isOrbiting ? "Stop Orbit" : "Auto Orbit"}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Zoom Controls */}
        <div className="bg-background/90 backdrop-blur-sm rounded-lg border shadow-lg p-1 flex flex-col gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onZoomIn}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Zoom In</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onZoomOut}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Zoom Out</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onResetCamera}
              >
                <Compass className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Reset Camera</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
