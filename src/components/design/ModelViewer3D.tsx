import React, { useEffect, useRef, useState } from "react";
import "@google/model-viewer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  Camera,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export interface ModelViewer3DProps {
  /** URL to the GLB file (signed URL from Supabase) */
  src: string;
  /** Poster image to show while loading */
  poster?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Additional CSS classes */
  className?: string;
  /** Aspect ratio */
  aspectRatio?: "16:9" | "4:3" | "1:1" | "auto";
  /** Enable auto-rotate by default */
  autoRotate?: boolean;
  /** Show control toolbar */
  showControls?: boolean;
  /** Callback when model loads */
  onLoad?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

const aspectRatioClasses = {
  "16:9": "aspect-video",
  "4:3": "aspect-[4/3]",
  "1:1": "aspect-square",
  auto: "",
};

export function ModelViewer3D({
  src,
  poster,
  alt = "3D Model",
  className,
  aspectRatio = "16:9",
  autoRotate = true,
  showControls = true,
  onLoad,
  onError,
}: ModelViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelViewerRef = useRef<HTMLElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRotating, setIsRotating] = useState(autoRotate);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const modelViewer = modelViewerRef.current;
    if (!modelViewer) return;

    const handleLoad = () => {
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    };

    const handleError = (event: Event) => {
      setIsLoading(false);
      setHasError(true);
      const error = new Error("Failed to load 3D model");
      setErrorMessage("Unable to load the 3D model. Please try again.");
      onError?.(error);
    };

    const handleProgress = (event: Event) => {
      // Progress tracking if needed
    };

    modelViewer.addEventListener("load", handleLoad);
    modelViewer.addEventListener("error", handleError);
    modelViewer.addEventListener("progress", handleProgress);

    return () => {
      modelViewer.removeEventListener("load", handleLoad);
      modelViewer.removeEventListener("error", handleError);
      modelViewer.removeEventListener("progress", handleProgress);
    };
  }, [onLoad, onError]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleAutoRotate = () => {
    setIsRotating((prev) => !prev);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  const captureScreenshot = () => {
    const modelViewer = modelViewerRef.current as any;
    if (!modelViewer?.toDataURL) {
      toast.error("Screenshot not available");
      return;
    }

    try {
      const dataURL = modelViewer.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "model-screenshot.png";
      link.href = dataURL;
      link.click();
      toast.success("Screenshot saved");
    } catch (err) {
      toast.error("Failed to capture screenshot");
    }
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");
    // Force reload by updating the src
    const modelViewer = modelViewerRef.current as any;
    if (modelViewer) {
      modelViewer.src = "";
      setTimeout(() => {
        modelViewer.src = src;
      }, 100);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative rounded-lg overflow-hidden bg-secondary/30 border border-border",
        aspectRatioClasses[aspectRatio],
        isFullscreen && "!aspect-auto h-screen w-screen",
        className
      )}
    >
      {/* Loading State */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-secondary/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              Loading 3D model...
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-secondary/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 text-center px-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <span className="text-sm text-muted-foreground">
              {errorMessage}
            </span>
            <Button size="sm" variant="outline" onClick={handleRetry}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Model Viewer */}
      <model-viewer
        ref={modelViewerRef as any}
        src={src}
        alt={alt}
        poster={poster}
        loading="eager"
        camera-controls
        auto-rotate={isRotating || undefined}
        rotation-per-second="30deg"
        shadow-intensity="1"
        shadow-softness="0.5"
        exposure="1"
        interaction-prompt="auto"
        interaction-prompt-style="basic"
        touch-action="pan-y"
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "transparent",
          "--poster-color": "transparent",
        } as React.CSSProperties}
      />

      {/* Control Toolbar */}
      {showControls && !hasError && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 rounded-lg bg-background/80 backdrop-blur-sm border border-border shadow-lg">
          <Button
            size="icon"
            variant={isRotating ? "default" : "ghost"}
            className="h-8 w-8"
            onClick={toggleAutoRotate}
            title={isRotating ? "Stop rotation" : "Auto-rotate"}
          >
            <RotateCcw
              className={cn("h-4 w-4", isRotating && "animate-spin")}
              style={{ animationDuration: "3s" }}
            />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={captureScreenshot}
            title="Capture screenshot"
          >
            <Camera className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default ModelViewer3D;
