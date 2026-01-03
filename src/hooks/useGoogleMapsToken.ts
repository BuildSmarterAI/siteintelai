import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseGoogleMapsTokenResult {
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// Module-level cache to avoid re-fetching
let cachedToken: string | null = null;
let fetchPromise: Promise<string | null> | null = null;

export function useGoogleMapsToken(): UseGoogleMapsTokenResult {
  const [token, setToken] = useState<string | null>(cachedToken);
  const [isLoading, setIsLoading] = useState(!cachedToken);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Already have token from cache, skip fetch
    if (cachedToken) {
      return;
    }

    let mounted = true;

    const fetchToken = async () => {
      try {
        // If already fetching, reuse the promise
        if (fetchPromise) {
          const result = await fetchPromise;
          if (mounted) {
            setToken(result);
            setIsLoading(false);
          }
          return;
        }

        // Create shared promise for this fetch
        fetchPromise = (async () => {
          const { data, error: fnError } = await supabase.functions.invoke("get-google-maps-token");
          
          if (fnError) {
            throw new Error(fnError.message);
          }
          
          if (!data?.token) {
            throw new Error("No token returned");
          }
          
          cachedToken = data.token;
          return data.token;
        })();

        const result = await fetchPromise;
        if (mounted) {
          setToken(result);
        }
      } catch (err) {
        console.error("Failed to fetch Google Maps token:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch token");
        }
      } finally {
        fetchPromise = null;
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchToken();

    return () => {
      mounted = false;
    };
  }, []);

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(() => ({ 
    token, 
    isLoading, 
    error 
  }), [token, isLoading, error]);
}
