/**
 * SiteIntel™ Design Mode - Regulatory Envelope Hook
 * 
 * Fetches or computes regulatory envelope for an application.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDesignStore } from "@/stores/useDesignStore";
import { toast } from "sonner";

interface SetbacksJson {
  front?: number;
  rear?: number;
  left?: number;
  right?: number;
}

interface RegulatoryEnvelopeRow {
  id: string;
  application_id: string;
  parcel_geometry: unknown;
  buildable_footprint_2d: unknown;
  far_cap: number;
  height_cap_ft: number;
  coverage_cap_pct: number;
  setbacks: SetbacksJson | null;
  exclusion_zones: unknown[] | null;
  constraints_version: string;
  computed_at: string;
}

export function useRegulatoryEnvelope(applicationId: string | undefined) {
  const { setEnvelope, setIsLoadingEnvelope } = useDesignStore();
  const queryClient = useQueryClient();

  // Query existing envelope using GeoJSON view to get proper geometry format
  const envelopeQuery = useQuery({
    queryKey: ["regulatory-envelope", applicationId],
    queryFn: async () => {
      if (!applicationId) return null;

      // Use the GeoJSON view to get geometries as proper GeoJSON objects
      const { data, error } = await supabase
        .from("regulatory_envelopes_geojson")
        .select("*")
        .eq("application_id", applicationId)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[EnvelopeQuery] Error fetching envelope:", error);
        throw error;
      }

      if (data) {
        const rawSetbacks = data.setbacks as SetbacksJson | null;
        const constraintsSource = data.constraints_source as { geometry_source?: string } | null;
        
        // The view returns parcel_geometry_geojson and buildable_footprint_2d_geojson as JSONB
        const parcelGeom = data.parcel_geometry_geojson as unknown as GeoJSON.Polygon | null;
        const buildableGeom = data.buildable_footprint_2d_geojson as unknown as GeoJSON.Polygon | null;
        
        const envelope = {
          id: data.id,
          applicationId: data.application_id,
          parcelGeometry: parcelGeom,
          buildableFootprint2d: buildableGeom,
          farCap: data.far_cap,
          heightCapFt: data.height_cap_ft,
          coverageCapPct: data.coverage_cap_pct,
          setbacks: {
            front: rawSetbacks?.front ?? 25,
            rear: rawSetbacks?.rear ?? 15,
            left: rawSetbacks?.left ?? 10,
            right: rawSetbacks?.right ?? 10,
          },
          exclusionZones: (data.exclusion_zones as unknown[]) || [],
          constraintsVersion: data.constraints_version,
          constraintsSource: constraintsSource,
          computedAt: data.computed_at,
        };
        setEnvelope(envelope);
        return envelope;
      }

      return null;
    },
    enabled: !!applicationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation to compute envelope
  const computeEnvelopeMutation = useMutation({
    mutationFn: async (appId: string) => {
      setIsLoadingEnvelope(true);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke(
        "compute-regulatory-envelope",
        {
          body: { application_id: appId },
        }
      );

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      if (data?.envelope) {
        const row = data.envelope;
        const rawSetbacks = row.setbacks as SetbacksJson | null;
        const envelope = {
          id: row.id,
          applicationId: row.application_id,
          parcelGeometry: row.parcel_geometry as GeoJSON.Polygon,
          buildableFootprint2d: row.buildable_footprint_2d as GeoJSON.Polygon,
          farCap: row.far_cap,
          heightCapFt: row.height_cap_ft,
          coverageCapPct: row.coverage_cap_pct,
          setbacks: {
            front: rawSetbacks?.front ?? 25,
            rear: rawSetbacks?.rear ?? 15,
            left: rawSetbacks?.left ?? 10,
            right: rawSetbacks?.right ?? 10,
          },
          exclusionZones: (row.exclusion_zones as unknown[]) || [],
          constraintsVersion: row.constraints_version,
          computedAt: row.computed_at,
        };
        setEnvelope(envelope);
        queryClient.invalidateQueries({
          queryKey: ["regulatory-envelope", applicationId],
        });
        
        if (data.cached) {
          toast.info("Using cached regulatory envelope");
        } else {
          toast.success("Regulatory envelope computed");
        }
      }
    },
    onError: (error: Error) => {
      console.error("Envelope computation error:", error);
      const errorMessage = error?.message || "Unknown error";
      toast.error("Failed to compute regulatory envelope", {
        description: errorMessage,
        duration: 6000,
      });
    },
    onSettled: () => {
      setIsLoadingEnvelope(false);
    },
  });

  return {
    envelope: envelopeQuery.data,
    isLoading: envelopeQuery.isLoading,
    isComputing: computeEnvelopeMutation.isPending,
    error: envelopeQuery.error,
    computeEnvelope: (appId: string) => computeEnvelopeMutation.mutate(appId),
  };
}
