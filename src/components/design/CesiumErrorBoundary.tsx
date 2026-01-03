/**
 * Error Boundary for Cesium/Resium Components
 * 
 * Catches React 18 HMR compatibility errors, timeout issues, and WebGL failures.
 * Provides recovery options without crashing the entire Design Mode page.
 */

import { Component, ReactNode, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Map, Clock } from "lucide-react";

interface CesiumErrorBoundaryProps {
  children: ReactNode;
  onFallbackTo2D?: () => void;
}

interface CesiumErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class CesiumErrorBoundary extends Component<
  CesiumErrorBoundaryProps,
  CesiumErrorBoundaryState
> {
  constructor(props: CesiumErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<CesiumErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[CesiumErrorBoundary] Caught error:", error.message);
    console.error("[CesiumErrorBoundary] Component stack:", errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  handleFullReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <CesiumErrorPanel
          errorMessage={this.state.error?.message || "Unknown error"}
          onRetry={this.handleRetry}
          onFallbackTo2D={this.props.onFallbackTo2D}
          onFullReload={this.handleFullReload}
        />
      );
    }
    return <div key={this.state.retryCount}>{this.props.children}</div>;
  }
}

/**
 * Reusable error panel for 3D viewer failures
 */
function CesiumErrorPanel({
  errorMessage,
  isTimeout = false,
  onRetry,
  onFallbackTo2D,
  onFullReload,
}: {
  errorMessage?: string;
  isTimeout?: boolean;
  onRetry?: () => void;
  onFallbackTo2D?: () => void;
  onFullReload?: () => void;
}) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-muted/50">
      <div className="bg-card border rounded-lg p-6 max-w-sm text-center shadow-lg">
        {isTimeout ? (
          <Clock className="h-10 w-10 text-amber-500 mx-auto mb-4" />
        ) : (
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
        )}
        <h3 className="font-semibold text-lg mb-2">
          {isTimeout ? "3D Viewer Timeout" : "3D Viewer Error"}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {isTimeout
            ? "The 3D viewer is taking too long to load. This may be due to slow network or WebGL issues."
            : "A problem occurred loading the 3D viewer."}
        </p>
        {errorMessage && !isTimeout && (
          <p className="text-xs text-destructive bg-destructive/10 rounded p-2 mb-4 font-mono break-all">
            {errorMessage}
          </p>
        )}
        <div className="flex flex-col gap-2">
          {onRetry && (
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry 3D View
            </Button>
          )}
          {onFallbackTo2D && (
            <Button variant="outline" onClick={onFallbackTo2D} className="w-full">
              <Map className="h-4 w-4 mr-2" />
              Switch to 2D
            </Button>
          )}
          {onFullReload && (
            <Button variant="ghost" size="sm" onClick={onFullReload} className="text-muted-foreground">
              Full Page Reload
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Safe wrapper that catches errors during dynamic import/render of Cesium
 * Includes timeout watchdog and global error listeners
 */
export function SafeCesiumLoader({ 
  children, 
  onFallbackTo2D,
  fallback,
  timeoutMs = 15000,
}: { 
  children: ReactNode; 
  onFallbackTo2D?: () => void;
  fallback?: ReactNode;
  timeoutMs?: number;
}) {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isTimeout, setIsTimeout] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Check WebGL availability
  useEffect(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      setLoadError("WebGL is not available in your browser. 3D view requires WebGL support.");
      console.error("[SafeCesiumLoader] WebGL not available");
    }
  }, []);

  // Timeout watchdog
  useEffect(() => {
    if (loadError || isLoaded) return;

    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current && !isLoaded) {
        console.error("[SafeCesiumLoader] 3D viewer load timeout after", timeoutMs, "ms");
        setIsTimeout(true);
        setLoadError("3D viewer took too long to initialize");
      }
    }, timeoutMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [timeoutMs, loadError, isLoaded]);

  // Mark as loaded when children render successfully
  useEffect(() => {
    // Give the viewer a moment to actually render
    const checkLoaded = setTimeout(() => {
      if (mountedRef.current) {
        setIsLoaded(true);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    }, 2000);

    return () => clearTimeout(checkLoaded);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Listen for unhandled errors from resium/cesium
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const msg = event.message || "";
      if (
        msg.includes("recentlyCreatedOwnerStacks") ||
        msg.includes("resium") ||
        msg.includes("cesium") ||
        msg.includes("Cesium") ||
        msg.includes("WebGL") ||
        msg.includes("Failed to fetch dynamically imported module") ||
        msg.includes("Loading chunk")
      ) {
        event.preventDefault();
        console.error("[SafeCesiumLoader] Caught global error:", msg);
        if (mountedRef.current) {
          setLoadError(msg);
        }
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason);
      if (
        reason.includes("cesium") ||
        reason.includes("Cesium") ||
        reason.includes("WebGL") ||
        reason.includes("chunk")
      ) {
        console.error("[SafeCesiumLoader] Caught unhandled rejection:", reason);
        if (mountedRef.current) {
          setLoadError(reason);
        }
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  const handleRetry = () => {
    setLoadError(null);
    setIsTimeout(false);
    setIsLoaded(false);
  };

  if (loadError) {
    return (
      <CesiumErrorPanel
        errorMessage={loadError}
        isTimeout={isTimeout}
        onRetry={handleRetry}
        onFallbackTo2D={onFallbackTo2D}
        onFullReload={() => window.location.reload()}
      />
    );
  }

  return (
    <CesiumErrorBoundary onFallbackTo2D={onFallbackTo2D}>
      {children}
    </CesiumErrorBoundary>
  );
}
