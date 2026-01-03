/**
 * 2D/3D/Split View Mode Toggle for Design Mode
 * 
 * Allows switching between MapLibre (2D), Cesium (3D), and Split canvas views.
 */

import { Map, Box, Columns } from "lucide-react";
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
          <p className="text-xs text-muted-foreground">Press T to cycle views</p>
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
          <p className="text-xs text-muted-foreground">Press T to cycle views</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={canvasViewMode === "split" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => handleModeChange("split")}
            className="h-7 px-2"
          >
            <Columns className="h-4 w-4 mr-1" />
            Split
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Side-by-Side Comparison</p>
          <p className="text-xs text-muted-foreground">Press T to cycle views</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
