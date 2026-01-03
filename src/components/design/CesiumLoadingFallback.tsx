/**
 * Loading Fallback for Lazy-Loaded Cesium Viewer
 */

import { Loader2, Globe } from "lucide-react";

interface CesiumLoadingFallbackProps {
  className?: string;
}

export function CesiumLoadingFallback({ className }: CesiumLoadingFallbackProps) {
  return (
    <div className={`h-full w-full flex items-center justify-center bg-muted/30 ${className || ""}`}>
      <div className="text-center space-y-3">
        <div className="relative">
          <Globe className="h-12 w-12 text-muted-foreground/50 mx-auto" />
          <Loader2 className="h-6 w-6 animate-spin text-primary absolute -bottom-1 -right-1" />
        </div>
        <p className="text-sm text-muted-foreground">Loading 3D Viewer...</p>
      </div>
    </div>
  );
}
