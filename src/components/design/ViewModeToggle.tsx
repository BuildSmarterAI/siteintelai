/**
 * 2D/3D View Mode Toggle for Design Mode
 * 
 * Allows switching between MapLibre (2D) and Cesium (3D) canvas views.
 */

import { Map, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDesignStore, type CanvasViewMode } from "@/stores/useDesignStore";
import { cn } from "@/lib/utils";

interface ViewModeToggleProps {
  className?: string;
}

export function ViewModeToggle({ className }: ViewModeToggleProps) {
  const { canvasViewMode, setCanvasViewMode } = useDesignStore();

  const handleModeChange = (mode: CanvasViewMode) => {
    setCanvasViewMode(mode);
  };

  return (
    <div className={cn("flex items-center gap-1 border rounded-lg p-1 bg-muted/50", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={canvasViewMode === "2d" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => handleModeChange("2d")}
            className="h-7 px-2"
          >
            <Map className="h-4 w-4 mr-1" />
            2D
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>2D Map View (MapLibre)</p>
          <p className="text-xs text-muted-foreground">Press T to toggle</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={canvasViewMode === "3d" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => handleModeChange("3d")}
            className="h-7 px-2"
          >
            <Box className="h-4 w-4 mr-1" />
            3D
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>3D Globe View (Cesium)</p>
          <p className="text-xs text-muted-foreground">Press T to toggle</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
