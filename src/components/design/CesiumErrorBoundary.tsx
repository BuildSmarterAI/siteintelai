/**
 * Error Boundary for Cesium/Resium Components
 * 
 * Catches React 18 HMR compatibility errors and provides recovery options
 * without crashing the entire Design Mode page.
 */

import { Component, ReactNode } from "react";
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
    // Log for debugging - common HMR errors
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
      const isHMRError = this.state.error?.message?.includes("recentlyCreatedOwnerStacks") ||
        this.state.error?.message?.includes("Cannot read properties of undefined");

      return (
        <div className="h-full w-full flex items-center justify-center bg-muted/50">
          <div className="bg-card border rounded-lg p-6 max-w-sm text-center shadow-lg">
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">3D Viewer Error</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isHMRError
                ? "A development hot-reload issue occurred. This resolves with a quick reload."
                : "The 3D viewer encountered an unexpected error."}
            </p>

            <div className="flex flex-col gap-2">
              <Button onClick={this.handleRetry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload 3D View
              </Button>

              {this.props.onFallbackTo2D && (
                <Button
                  variant="outline"
                  onClick={this.props.onFallbackTo2D}
                  className="w-full"
                >
                  <Map className="h-4 w-4 mr-2" />
                  Switch to 2D
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={this.handleFullReload}
                className="text-muted-foreground"
              >
                Full Page Reload
              </Button>
            </div>

            {this.state.retryCount > 0 && (
              <p className="text-xs text-muted-foreground mt-3">
                Retry attempt: {this.state.retryCount}
              </p>
            )}
          </div>
        </div>
      );
    }

    // Use key to force remount on retry
    return <div key={this.state.retryCount}>{this.props.children}</div>;
  }
}
