import React, { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

/**
 * API Error Boundary Component (J-05)
 * Gracefully handle API errors in UI
 */

interface ApiError {
  message: string;
  code?: string;
  traceId?: string;
  timestamp: string;
}

interface ErrorBoundaryContextType {
  error: ApiError | null;
  setError: (error: Error | ApiError | null) => void;
  clearError: () => void;
}

const ErrorBoundaryContext = createContext<ErrorBoundaryContextType | null>(null);

export function useApiError() {
  const context = useContext(ErrorBoundaryContext);
  if (!context) {
    throw new Error('useApiError must be used within an ApiErrorBoundary');
  }
  return context;
}

interface ApiErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: ApiError) => void;
  showToast?: boolean;
  retryLabel?: string;
}

export function ApiErrorBoundary({
  children,
  fallback,
  onError,
  showToast = true,
  retryLabel = 'Try Again',
}: ApiErrorBoundaryProps) {
  const [error, setErrorState] = useState<ApiError | null>(null);

  const setError = useCallback((err: Error | ApiError | null) => {
    if (err === null) {
      setErrorState(null);
      return;
    }

    const apiError: ApiError = {
      message: err.message || 'An unexpected error occurred',
      code: 'code' in err ? (err.code as string) : undefined,
      traceId: 'traceId' in err ? (err.traceId as string) : undefined,
      timestamp: new Date().toISOString(),
    };

    setErrorState(apiError);
    onError?.(apiError);

    if (showToast) {
      toast.error(apiError.message, {
        description: apiError.code ? `Error code: ${apiError.code}` : undefined,
      });
    }

    console.error('[ApiErrorBoundary] Error caught:', apiError);
  }, [onError, showToast]);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  if (error) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-2">{error.message}</p>
          {error.code && (
            <p className="text-sm opacity-75 mb-2">Error code: {error.code}</p>
          )}
          {error.traceId && (
            <p className="text-xs opacity-50 mb-3 font-mono">Trace ID: {error.traceId}</p>
          )}
          <Button
            onClick={clearError}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            {retryLabel}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <ErrorBoundaryContext.Provider value={{ error, setError, clearError }}>
      {children}
    </ErrorBoundaryContext.Provider>
  );
}

// HOC for wrapping components with error boundary
export function withApiErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ApiErrorBoundaryProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <ApiErrorBoundary {...options}>
        <Component {...props} />
      </ApiErrorBoundary>
    );
  };
}

// Utility hook for API calls with error handling
export function useApiCall<T>(
  apiCall: () => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
) {
  const { setError } = useApiError();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await apiCall();
      setData(result);
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options?.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, setError, options]);

  return { execute, isLoading, data };
}
