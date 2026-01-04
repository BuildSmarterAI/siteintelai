import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDesignStore } from "@/stores/useDesignStore";
import { toast } from "sonner";
import { useCallback, useEffect, useRef } from "react";

// ============================================================================
// Types
// ============================================================================

export interface BootstrapOptions {
  ensureEnvelope?: boolean;
  ensureSession?: boolean;
  includeVariants?: boolean;
  includeIntent?: boolean;
  createIfMissing?: boolean;
  forceRecomputeEnvelope?: boolean;
}

export interface EnvelopeData {
  id: string | null;
  status: "ready" | "pending" | "failed" | null;
  version: number | null;
  confidenceGrade: string | null;
  data: {
    heightCapFt: number;
    farCap: number;
    coverageCapPct: number;
    setbacks: Record<string, number>;
  } | null;
  sourceVersions: {
    parcelVersion: string | null;
    zoningVersion: string | null;
    overlaysVersion: string | null;
  } | null;
  job: {
    id: string | null;
    status: string | null;
    attempt: number;
    error: unknown | null;
  } | null;
}

export interface SessionData {
  id: string | null;
  status: string | null;
  activeVariantId: string | null;
  createdAt: string | null;
}

export interface VariantData {
  id: string;
  name: string;
  strategy: string | null;
  footprint: unknown;
  heightFt: number | null;
  floors: number | null;
  score: Record<string, number> | null;
  createdAt: string;
}

export interface BootstrapResult {
  ok: boolean;
  code?: string;
  message?: string;
  auth?: {
    userId: string;
    orgId: string | null;
    role: string | null;
  };
  application?: {
    id: string;
    parcelId: string | null;
    address: string | null;
    jurisdiction: string | null;
  };
  parcel?: {
    id: string | null;
    geometry: unknown | null;
    areaSqFt: number | null;
    areaAcres: number | null;
  };
  envelope?: EnvelopeData;
  session?: SessionData;
  intent?: {
    id: string | null;
    data: Record<string, unknown>;
    updatedAt: string | null;
  } | null;
  variants?: VariantData[];
  telemetry?: {
    bootstrapMs: number;
    cache: {
      envelopeHit: boolean;
      sessionHit: boolean;
    };
  };
}

// ============================================================================
// Hook
// ============================================================================

export function useDesignBootstrap(applicationId: string | undefined) {
  const queryClient = useQueryClient();
  const store = useDesignStore();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Main bootstrap query
  const {
    data: bootstrapData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["design-bootstrap", applicationId],
    queryFn: async (): Promise<BootstrapResult> => {
      if (!applicationId) {
        throw new Error("Application ID is required");
      }

      const { data, error } = await supabase.functions.invoke("design-mode-bootstrap", {
        body: {
          applicationId,
          client: {
            appVersion: "1.0.0",
            tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          options: {
            ensureEnvelope: true,
            ensureSession: true,
            includeVariants: true,
            includeIntent: true,
            createIfMissing: true,
          },
        },
      });

      if (error) {
        console.error("[useDesignBootstrap] Edge function error:", error);
        throw error;
      }

      if (!data?.ok) {
        throw new Error(data?.message || data?.code || "Bootstrap failed");
      }

      return data as BootstrapResult;
    },
    enabled: !!applicationId,
    staleTime: 30_000, // 30 seconds
    retry: 2,
  });

  // Sync bootstrap data to store - only set active variant ID
  // Full envelope/session sync is handled by the existing hooks
  useEffect(() => {
    if (!bootstrapData) return;

    // Update store with active variant ID
    if (bootstrapData.session?.activeVariantId) {
      store.setActiveVariantId(bootstrapData.session.activeVariantId);
    }
  }, [bootstrapData, store]);

  // Poll for envelope completion when pending
  useEffect(() => {
    const envelope = bootstrapData?.envelope;
    
    if (envelope?.status === "pending" && envelope?.job) {
      console.log("[useDesignBootstrap] Envelope pending, starting poll...");
      
      pollingRef.current = setInterval(() => {
        console.log("[useDesignBootstrap] Polling for envelope completion...");
        refetch();
      }, 3000); // Poll every 3 seconds
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [bootstrapData?.envelope?.status, refetch]);

  // Generate variants mutation
  const generateVariantsMutation = useMutation({
    mutationFn: async (intent: {
      selectedTemplates: string[];
      programBuckets: Record<string, number>;
      sustainabilityLevel: "standard" | "enhanced" | "premium";
    }) => {
      if (!bootstrapData?.session?.id || !bootstrapData?.envelope?.id) {
        throw new Error("Session and envelope required for generation");
      }

      const { data, error } = await supabase.functions.invoke("generate-variants", {
        body: {
          sessionId: bootstrapData.session.id,
          envelopeId: bootstrapData.envelope.id,
          intent,
          options: {
            maxVariants: 3,
            replaceExisting: true,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.ok) {
        throw new Error(data?.message || "Generation failed");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Variants generated successfully");
      // Refetch bootstrap to get new variants
      queryClient.invalidateQueries({ queryKey: ["design-bootstrap", applicationId] });
    },
    onError: (err) => {
      console.error("[useDesignBootstrap] Generation error:", err);
      toast.error("Failed to generate variants");
    },
  });

  // Recompute envelope mutation
  const recomputeEnvelopeMutation = useMutation({
    mutationFn: async () => {
      if (!applicationId) {
        throw new Error("Application ID required");
      }

      const { data, error } = await supabase.functions.invoke("design-mode-bootstrap", {
        body: {
          applicationId,
          options: {
            ensureEnvelope: true,
            ensureSession: false,
            forceRecomputeEnvelope: true,
            createIfMissing: true,
          },
        },
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Envelope recomputation started");
      queryClient.invalidateQueries({ queryKey: ["design-bootstrap", applicationId] });
    },
    onError: (err) => {
      console.error("[useDesignBootstrap] Recompute error:", err);
      toast.error("Failed to recompute envelope");
    },
  });

  // Helper to check if ready
  const isReady = useCallback(() => {
    return (
      bootstrapData?.ok === true &&
      bootstrapData?.envelope?.status === "ready" &&
      bootstrapData?.session?.id != null
    );
  }, [bootstrapData]);

  // Helper to check if envelope is pending
  const isEnvelopePending = useCallback(() => {
    return bootstrapData?.envelope?.status === "pending";
  }, [bootstrapData]);

  return {
    // Data
    data: bootstrapData,
    envelope: bootstrapData?.envelope ?? null,
    session: bootstrapData?.session ?? null,
    variants: bootstrapData?.variants ?? [],
    parcel: bootstrapData?.parcel ?? null,
    application: bootstrapData?.application ?? null,
    intent: bootstrapData?.intent ?? null,
    
    // State
    isLoading,
    isReady: isReady(),
    isEnvelopePending: isEnvelopePending(),
    error,
    
    // Actions
    refetch,
    generateVariants: generateVariantsMutation.mutateAsync,
    recomputeEnvelope: recomputeEnvelopeMutation.mutateAsync,
    
    // Mutation states
    isGenerating: generateVariantsMutation.isPending,
    isRecomputing: recomputeEnvelopeMutation.isPending,
  };
}
