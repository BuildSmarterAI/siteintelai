/**
 * Design Mode Measurement Tools
 * Toolbar for measuring distances, areas, and heights
 */

import { Button } from "@/components/ui/button";
import { useDesignStore, type CanvasViewMode } from "@/stores/useDesignStore";
import { Ruler, Square, ArrowUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DesignMeasurementToolsProps {
  className?: string;
}

export function DesignMeasurementTools({ className }: DesignMeasurementToolsProps) {
  const {
    measurementMode,
    setMeasurementMode,
    clearMeasurement,
    canvasViewMode,
  } = useDesignStore();

  const isActive = measurementMode !== null;

  return (
    <TooltipProvider>
      <div className={cn(
        "flex items-center gap-1 bg-card/90 backdrop-blur-sm border rounded-lg p-1 shadow-lg",
        className
      )}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={measurementMode === "distance" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMeasurementMode(measurementMode === "distance" ? null : "distance")}
              className="h-8 w-8 p-0"
            >
              <Ruler className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Measure Distance</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={measurementMode === "area" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMeasurementMode(measurementMode === "area" ? null : "area")}
              className="h-8 w-8 p-0"
            >
              <Square className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Measure Area</p>
          </TooltipContent>
        </Tooltip>

        {/* Height measurement only available in 3D mode */}
        {(canvasViewMode === "3d" || canvasViewMode === "split") && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={measurementMode === "height" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setMeasurementMode(measurementMode === "height" ? null : "height")}
                className="h-8 w-8 p-0"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Measure Height</p>
            </TooltipContent>
          </Tooltip>
        )}

        {isActive && (
          <>
            <div className="w-px h-5 bg-border mx-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearMeasurement}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Clear Measurement</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
