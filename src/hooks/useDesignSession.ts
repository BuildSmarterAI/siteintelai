/**
 * SiteIntel™ Design Mode - Design Session Hook
 * 
 * Manages design sessions and variants CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDesignStore, type DesignVariant, type DesignSession, type DesignPreset } from "@/stores/useDesignStore";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";
import type { DesignMetrics } from "@/lib/designMetrics";

interface DesignSessionRow {
  id: string;
  user_id: string;
  envelope_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DesignVariantRow {
  id: string;
  session_id: string;
  name: string;
  footprint: unknown;
  height_ft: number;
  floors: number;
  preset_type: string | null;
  notes: string | null;
  metrics: unknown;
  compliance_status: string;
  is_baseline: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface DesignVariantUpdateRow {
  name?: string;
  footprint?: unknown;
  height_ft?: number;
  floors?: number;
  preset_type?: string | null;
  notes?: string | null;
  metrics?: Json;
  compliance_status?: string;
  sort_order?: number;
}

interface DesignPresetRow {
  id: string;
  name: string;
  description: string | null;
  preset_key: string;
  category: string;
  default_height_ft: number;
  default_floors: number;
  coverage_target_pct: number;
  far_target_pct: number;
  icon: string | null;
}

/**
 * Validate that a value is a complete DesignMetrics object
 */
function isValidDesignMetrics(value: unknown): value is DesignMetrics {
  if (!value || typeof value !== "object") return false;
  const m = value as Record<string, unknown>;
  
  const requiredNumericFields = [
    "grossFloorAreaSf",
    "footprintSf", 
    "farUsed",
    "farUsedPct",
    "coveragePct",
    "heightUsedPct",
    "envelopeUtilizationPct",
    "violationCount",
    "efficiencyScore",
  ];
  
  for (const field of requiredNumericFields) {
    if (typeof m[field] !== "number" || !Number.isFinite(m[field] as number)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Normalize metrics from DB - returns null if invalid/incomplete
 */
function normalizeDesignMetrics(value: unknown): DesignMetrics | null {
  if (isValidDesignMetrics(value)) {
    return value;
  }
  return null;
}

export function useDesignSession(envelopeId: string | undefined) {
  const {
    setSession,
    setVariants,
    addVariant,
    updateVariant,
    removeVariant,
    setPresets,
    setIsSaving,
  } = useDesignStore();
  const queryClient = useQueryClient();

  // Fetch existing session for envelope
  const sessionQuery = useQuery({
    queryKey: ["design-session", envelopeId],
    queryFn: async () => {
      if (!envelopeId) return null;

      const { data, error } = await supabase
        .from("design_sessions")
        .select("*")
        .eq("envelope_id", envelopeId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        const row = data as DesignSessionRow;
        const session: DesignSession = {
          id: row.id,
          userId: row.user_id,
          envelopeId: row.envelope_id,
          name: row.name,
          description: row.description || "",
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
        setSession(session);
        return session;
      }

      return null;
    },
    enabled: !!envelopeId,
  });

  // Fetch variants for session
  const variantsQuery = useQuery({
    queryKey: ["design-variants", sessionQuery.data?.id],
    queryFn: async () => {
      if (!sessionQuery.data?.id) return [];

      const { data, error } = await supabase
        .from("design_variants")
        .select("*")
        .eq("session_id", sessionQuery.data.id)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      const variants: DesignVariant[] = (data as DesignVariantRow[]).map((row) => ({
        id: row.id,
        sessionId: row.session_id,
        name: row.name,
        footprint: row.footprint as GeoJSON.Polygon | null,
        heightFt: row.height_ft,
        floors: row.floors,
        presetType: row.preset_type,
        notes: row.notes || "",
        metrics: normalizeDesignMetrics(row.metrics),
        complianceStatus: row.compliance_status as DesignVariant["complianceStatus"],
        complianceResult: null, // Will be computed client-side
        isBaseline: row.is_baseline,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      setVariants(variants);
      return variants;
    },
    enabled: !!sessionQuery.data?.id,
  });

  // Fetch presets
  const presetsQuery = useQuery({
    queryKey: ["design-presets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("design_presets")
        .select("*")
        .eq("is_system", true)
        .order("category", { ascending: true });

      if (error) throw error;

      const presets: DesignPreset[] = (data as DesignPresetRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description || "",
        presetKey: row.preset_key,
        category: row.category,
        defaultHeightFt: row.default_height_ft,
        defaultFloors: row.default_floors,
        coverageTargetPct: row.coverage_target_pct,
        farTargetPct: row.far_target_pct,
        icon: row.icon || "Building",
      }));

      setPresets(presets);
      return presets;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async ({
      envelopeId,
      name = "Design Session",
    }: {
      envelopeId: string;
      name?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("design_sessions")
        .insert({
          envelope_id: envelopeId,
          user_id: userData.user.id,
          name,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DesignSessionRow;
    },
    onSuccess: (data) => {
      const session: DesignSession = {
        id: data.id,
        userId: data.user_id,
        envelopeId: data.envelope_id,
        name: data.name,
        description: data.description || "",
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      setSession(session);
      queryClient.invalidateQueries({ queryKey: ["design-session", envelopeId] });
      toast.success("Design session created");
    },
    onError: (error) => {
      console.error("Create session error:", error);
      toast.error("Failed to create design session");
    },
  });

  // Create variant mutation
  const createVariantMutation = useMutation({
    mutationFn: async ({
      sessionId,
      name,
      preset,
    }: {
      sessionId: string;
      name?: string;
      preset?: DesignPreset;
    }) => {
      setIsSaving(true);

      const variantName = name || `Variant ${String.fromCharCode(65 + (variantsQuery.data?.length || 0))}`;
      
      const { data, error } = await supabase
        .from("design_variants")
        .insert({
          session_id: sessionId,
          name: variantName,
          height_ft: preset?.defaultHeightFt || 24,
          floors: preset?.defaultFloors || 1,
          preset_type: preset?.presetKey || null,
          sort_order: (variantsQuery.data?.length || 0),
          compliance_status: "PENDING",
        })
        .select()
        .single();

      if (error) throw error;
      return data as DesignVariantRow;
    },
    onSuccess: (data) => {
      const variant: DesignVariant = {
        id: data.id,
        sessionId: data.session_id,
        name: data.name,
        footprint: data.footprint as GeoJSON.Polygon | null,
        heightFt: data.height_ft,
        floors: data.floors,
        presetType: data.preset_type,
        notes: data.notes || "",
        metrics: null,
        complianceStatus: "PENDING",
        complianceResult: null,
        isBaseline: data.is_baseline,
        sortOrder: data.sort_order,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      addVariant(variant);
      toast.success(`${variant.name} created`);
    },
    onError: (error) => {
      console.error("Create variant error:", error);
      toast.error("Failed to create variant");
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  // Update variant mutation
  const updateVariantMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: DesignVariantUpdateRow;
    }) => {
      setIsSaving(true);

      const { data, error } = await supabase
        .from("design_variants")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as DesignVariantRow;
    },
    onSuccess: (data) => {
      updateVariant(data.id, {
        name: data.name,
        footprint: data.footprint as GeoJSON.Polygon | null,
        heightFt: data.height_ft,
        floors: data.floors,
        presetType: data.preset_type,
        notes: data.notes || "",
        complianceStatus: data.compliance_status as DesignVariant["complianceStatus"],
        updatedAt: data.updated_at,
      });
    },
    onError: (error) => {
      console.error("Update variant error:", error);
      toast.error("Failed to save changes");
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  // Delete variant mutation
  const deleteVariantMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("design_variants")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      removeVariant(id);
      toast.success("Variant deleted");
    },
    onError: (error) => {
      console.error("Delete variant error:", error);
      toast.error("Failed to delete variant");
    },
  });

  // Duplicate variant
  const duplicateVariant = async (variant: DesignVariant) => {
    if (!sessionQuery.data?.id) return;

    const { data, error } = await supabase
      .from("design_variants")
      .insert({
        session_id: sessionQuery.data.id,
        name: `${variant.name} (Copy)`,
        footprint: variant.footprint,
        height_ft: variant.heightFt,
        floors: variant.floors,
        preset_type: variant.presetType,
        notes: variant.notes,
        sort_order: (variantsQuery.data?.length || 0),
        compliance_status: "PENDING",
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to duplicate variant");
      return;
    }

    const newVariant: DesignVariant = {
      id: data.id,
      sessionId: data.session_id,
      name: data.name,
      footprint: data.footprint as GeoJSON.Polygon | null,
      heightFt: data.height_ft,
      floors: data.floors,
      presetType: data.preset_type,
      notes: data.notes || "",
      metrics: null,
      complianceStatus: "PENDING",
      complianceResult: null,
      isBaseline: data.is_baseline,
      sortOrder: data.sort_order,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    addVariant(newVariant);
    toast.success(`${newVariant.name} created`);
  };

  return {
    session: sessionQuery.data,
    variants: variantsQuery.data || [],
    presets: presetsQuery.data || [],
    isLoading: sessionQuery.isLoading || variantsQuery.isLoading,
    createSession: createSessionMutation.mutate,
    createVariant: createVariantMutation.mutate,
    updateVariant: updateVariantMutation.mutate,
    deleteVariant: deleteVariantMutation.mutate,
    duplicateVariant,
    isCreatingSession: createSessionMutation.isPending,
    isCreatingVariant: createVariantMutation.isPending,
  };
}
