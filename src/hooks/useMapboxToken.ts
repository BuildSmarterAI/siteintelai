import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseMapboxTokenResult {
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// Cache token at module level to avoid re-fetching
let cachedToken: string | null = null;

export function useMapboxToken(): UseMapboxTokenResult {
  const [token, setToken] = useState<string | null>(cachedToken);
  const [isLoading, setIsLoading] = useState(!cachedToken);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Return cached token if available
    if (cachedToken) {
      setToken(cachedToken);
      setIsLoading(false);
      return;
    }

    const fetchToken = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("get-mapbox-token");
        
        if (fnError) {
          throw new Error(fnError.message);
        }
        
        if (data?.token) {
          cachedToken = data.token;
          setToken(data.token);
        } else {
          throw new Error("No token returned");
        }
      } catch (err) {
        console.error("Failed to fetch Mapbox token:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch token");
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, []);

  return { token, isLoading, error };
}
