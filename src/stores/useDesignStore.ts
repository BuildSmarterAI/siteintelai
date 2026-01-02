/**
 * SiteIntel™ Design Mode - Global State Store
 * 
 * Manages design session state using Zustand.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ComplianceResult } from "@/lib/designCompliance";
import type { DesignMetrics } from "@/lib/designMetrics";

export type DesignModeView = "design" | "compare" | "export";

export interface DesignPreset {
  id: string;
  name: string;
  description: string;
  presetKey: string;
  category: string;
  defaultHeightFt: number;
  defaultFloors: number;
  coverageTargetPct: number;
  farTargetPct: number;
  icon: string;
}

export interface DesignVariant {
  id: string;
  sessionId: string;
  name: string;
  footprint: GeoJSON.Polygon | null;
  heightFt: number;
  floors: number;
  presetType: string | null;
  notes: string;
  metrics: DesignMetrics | null;
  complianceStatus: "PASS" | "WARN" | "FAIL" | "PENDING";
  complianceResult: ComplianceResult | null;
  isBaseline: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface RegulatoryEnvelope {
  id: string;
  applicationId: string;
  parcelGeometry: GeoJSON.Polygon;
  buildableFootprint2d: GeoJSON.Polygon;
  farCap: number;
  heightCapFt: number;
  coverageCapPct: number;
  setbacks: {
    front: number;
    rear: number;
    left: number;
    right: number;
  };
  exclusionZones: unknown[];
  constraintsVersion: string;
  computedAt: string;
}

export interface DesignSession {
  id: string;
  userId: string;
  envelopeId: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DesignState {
  // Current mode/view
  currentView: DesignModeView;
  setCurrentView: (view: DesignModeView) => void;

  // Session state
  session: DesignSession | null;
  setSession: (session: DesignSession | null) => void;

  // Envelope (immutable reference)
  envelope: RegulatoryEnvelope | null;
  setEnvelope: (envelope: RegulatoryEnvelope | null) => void;

  // Variants
  variants: DesignVariant[];
  setVariants: (variants: DesignVariant[]) => void;
  addVariant: (variant: DesignVariant) => void;
  updateVariant: (id: string, updates: Partial<DesignVariant>) => void;
  removeVariant: (id: string) => void;

  // Active variant (being edited)
  activeVariantId: string | null;
  setActiveVariantId: (id: string | null) => void;
  getActiveVariant: () => DesignVariant | null;

  // Compare mode selection
  compareVariantIds: string[];
  toggleCompareVariant: (id: string) => void;
  clearCompareSelection: () => void;

  // Drawing state
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;

  // Presets
  presets: DesignPreset[];
  setPresets: (presets: DesignPreset[]) => void;

  // UI state
  showCompliancePanel: boolean;
  toggleCompliancePanel: () => void;
  showMetricsPanel: boolean;
  toggleMetricsPanel: () => void;

  // Loading states
  isLoadingEnvelope: boolean;
  setIsLoadingEnvelope: (loading: boolean) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  currentView: "design" as DesignModeView,
  session: null,
  envelope: null,
  variants: [],
  activeVariantId: null,
  compareVariantIds: [],
  isDrawing: false,
  presets: [],
  showCompliancePanel: true,
  showMetricsPanel: true,
  isLoadingEnvelope: false,
  isSaving: false,
};

export const useDesignStore = create<DesignState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setCurrentView: (view) => set({ currentView: view }),

      setSession: (session) => set({ session }),

      setEnvelope: (envelope) => set({ envelope }),

      setVariants: (variants) => set({ variants }),

      addVariant: (variant) =>
        set((state) => ({
          variants: [...state.variants, variant],
          activeVariantId: variant.id,
        })),

      updateVariant: (id, updates) =>
        set((state) => ({
          variants: state.variants.map((v) =>
            v.id === id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
          ),
        })),

      removeVariant: (id) =>
        set((state) => {
          const newVariants = state.variants.filter((v) => v.id !== id);
          return {
            variants: newVariants,
            activeVariantId:
              state.activeVariantId === id
                ? newVariants[0]?.id || null
                : state.activeVariantId,
            compareVariantIds: state.compareVariantIds.filter((vid) => vid !== id),
          };
        }),

      setActiveVariantId: (id) => set({ activeVariantId: id }),

      getActiveVariant: () => {
        const state = get();
        return state.variants.find((v) => v.id === state.activeVariantId) || null;
      },

      toggleCompareVariant: (id) =>
        set((state) => {
          const isSelected = state.compareVariantIds.includes(id);
          if (isSelected) {
            return {
              compareVariantIds: state.compareVariantIds.filter((vid) => vid !== id),
            };
          }
          // Max 4 variants for comparison
          if (state.compareVariantIds.length >= 4) {
            return state;
          }
          return {
            compareVariantIds: [...state.compareVariantIds, id],
          };
        }),

      clearCompareSelection: () => set({ compareVariantIds: [] }),

      setIsDrawing: (drawing) => set({ isDrawing: drawing }),

      setPresets: (presets) => set({ presets }),

      toggleCompliancePanel: () =>
        set((state) => ({ showCompliancePanel: !state.showCompliancePanel })),

      toggleMetricsPanel: () =>
        set((state) => ({ showMetricsPanel: !state.showMetricsPanel })),

      setIsLoadingEnvelope: (loading) => set({ isLoadingEnvelope: loading }),

      setIsSaving: (saving) => set({ isSaving: saving }),

      reset: () => set(initialState),
    }),
    { name: "design-store" }
  )
);
