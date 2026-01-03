/**
 * Split View Canvas for Design Mode
 * 
 * Renders 2D MapLibre and 3D Cesium views side-by-side for comparison.
 */

import { Suspense, lazy } from "react";
import { DesignModeCanvas } from "./DesignModeCanvas";
import { SafeCesiumLoader } from "./CesiumErrorBoundary";
import { CesiumLoadingFallback } from "./CesiumLoadingFallback";
import { cn } from "@/lib/utils";

// Lazy load Cesium to isolate HMR errors
const CesiumViewerLazy = lazy(() =>
  import("./CesiumViewer").then(module => ({
    default: module.CesiumViewerComponent,
  }))
);

interface SplitViewCanvasProps {
  className?: string;
  onFootprintChange?: (geometry: GeoJSON.Polygon | null) => void;
}

export function SplitViewCanvas({ 
  className,
  onFootprintChange 
}: SplitViewCanvasProps) {
  return (
    <div className={cn("flex h-full w-full", className)}>
      {/* Left: 2D MapLibre View */}
      <div className="w-1/2 h-full border-r border-border relative">
        {/* View Label */}
        <div className="absolute top-3 left-3 z-20 bg-background/90 backdrop-blur-sm px-2.5 py-1 rounded-md border shadow-sm">
          <span className="text-xs font-medium">2D View</span>
        </div>
        <DesignModeCanvas 
          className="h-full w-full" 
          onFootprintChange={onFootprintChange}
        />
      </div>

      {/* Right: 3D Cesium View */}
      <div className="w-1/2 h-full relative">
        {/* View Label */}
        <div className="absolute top-3 left-3 z-20 bg-background/90 backdrop-blur-sm px-2.5 py-1 rounded-md border shadow-sm">
          <span className="text-xs font-medium">3D View</span>
        </div>
        <SafeCesiumLoader fallback={<CesiumLoadingFallback />}>
          <Suspense fallback={<CesiumLoadingFallback />}>
            <CesiumViewerLazy 
              className="h-full w-full" 
              onFootprintChange={onFootprintChange}
            />
          </Suspense>
        </SafeCesiumLoader>
      </div>
    </div>
  );
}
