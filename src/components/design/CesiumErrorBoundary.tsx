/**
 * Error Boundary for Cesium/Resium Components
 * 
 * Catches React 18 HMR compatibility errors and provides recovery options
 * without crashing the entire Design Mode page.
 */

import { Component, ReactNode, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Map } from "lucide-react";

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
        <div className="h-full w-full flex items-center justify-center bg-muted/50">
          <div className="bg-card border rounded-lg p-6 max-w-sm text-center shadow-lg">
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">3D Viewer Error</h3>
            <p className="text-sm text-muted-foreground mb-4">
              A development hot-reload issue occurred. Click reload to fix.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={this.handleRetry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload 3D View
              </Button>
              {this.props.onFallbackTo2D && (
                <Button variant="outline" onClick={this.props.onFallbackTo2D} className="w-full">
                  <Map className="h-4 w-4 mr-2" />
                  Switch to 2D
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={this.handleFullReload} className="text-muted-foreground">
                Full Page Reload
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return <div key={this.state.retryCount}>{this.props.children}</div>;
  }
}

/**
 * Safe wrapper that catches errors during dynamic import/render of Cesium
 */
export function SafeCesiumLoader({ 
  children, 
  onFallbackTo2D,
  fallback 
}: { 
  children: ReactNode; 
  onFallbackTo2D?: () => void;
  fallback?: ReactNode;
}) {
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // Listen for unhandled errors from resium during HMR
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('recentlyCreatedOwnerStacks') || 
          event.message?.includes('resium')) {
        event.preventDefault();
        setLoadError(true);
      }
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (loadError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/50">
        <div className="bg-card border rounded-lg p-6 max-w-sm text-center shadow-lg">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">3D Viewer Error</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please reload the page to use 3D view.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>
            {onFallbackTo2D && (
              <Button variant="outline" onClick={onFallbackTo2D} className="w-full">
                <Map className="h-4 w-4 mr-2" />
                Switch to 2D
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <CesiumErrorBoundary onFallbackTo2D={onFallbackTo2D}>
      {children}
    </CesiumErrorBoundary>
  );
}
