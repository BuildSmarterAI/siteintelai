/**
 * SiteIntel™ Design Mode - Global State Store
 * 
 * Manages design session state using Zustand.
 * Enhanced with UX overhaul features: hover preview, sharing, IC mode, best overall.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ComplianceResult } from "@/lib/designCompliance";
import type { DesignMetrics } from "@/lib/designMetrics";
import type { 
  VariantSortMode, 
  VariantTag, 
  ToolState,
  ShareSettings,
  ShareInvite 
} from "@/types/design";

export type DesignModeView = "design" | "compare" | "export";

export type CameraPreset = "overhead" | "perspective_ne" | "perspective_sw" | "street" | "orbit" | "context" | "parcel_fit";

export type CanvasViewMode = "2d" | "3d" | "split";

export type BasemapType = "osm" | "satellite" | "satellite-labels" | "terrain" | "google-3d";

export type Buildings3DSource = "osm" | "google" | "none";

export type DesignMeasurementMode = "distance" | "area" | "height" | null;

// Google Earth-style left panel states
export type LeftPanelState = "expanded" | "collapsed" | "hidden";

export interface DesignMeasurementResult {
  miles?: number;
  feet?: number;
  acres?: number;
  sqft?: number;
  heightFt?: number;
}

// Snap point info for visual feedback
export interface SnapPointInfo {
  point: [number, number];
  type: "vertex" | "edge";
  source: "parcel" | "buildable" | "building";
}

// Snap settings
export interface MeasurementSnapSettings {
  snapToParcel: boolean;
  snapToBuildable: boolean;
  snapToBuildings: boolean;
  snapThresholdFeet: number;
}

// Persistent measurement annotation
export interface MeasurementAnnotation {
  id: string;
  type: "distance" | "area" | "height";
  points: [number, number][];
  result: DesignMeasurementResult;
  label: string;
  color: string;
  visible: boolean;
  createdAt: string;
}

// Shadow comparison time slot
export interface ShadowComparisonTime {
  id: string;
  hour: number;
  label: string;
  color: string;
  visible: boolean;
}

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

  // ========== NEW: Best Overall Calculation ==========
  bestOverallVariantId: string | null;
  computeBestOverall: () => void;

  // ========== NEW: Variant Quick Actions State ==========
  starredVariantIds: string[];
  pinnedVariantIds: string[];
  variantTags: Record<string, VariantTag[]>;
  toggleStarVariant: (id: string) => void;
  togglePinVariant: (id: string) => void;
  setVariantTags: (id: string, tags: VariantTag[]) => void;

  // ========== NEW: Sorting & Search ==========
  variantSortMode: VariantSortMode;
  setVariantSortMode: (mode: VariantSortMode) => void;
  variantSearchQuery: string;
  setVariantSearchQuery: (query: string) => void;
  getSortedVariants: () => DesignVariant[];

  // ========== NEW: Hover Preview State ==========
  hoveredVariantId: string | null;
  setHoveredVariantId: (id: string | null) => void;

  // ========== NEW: Share Modal State ==========
  shareModalOpen: boolean;
  setShareModalOpen: (open: boolean) => void;
  shareSettings: ShareSettings;
  setShareSettings: (settings: Partial<ShareSettings>) => void;
  shareInvites: ShareInvite[];
  addShareInvite: (invite: ShareInvite) => void;
  removeShareInvite: (email: string) => void;

  // ========== NEW: IC Mode ==========
  isICMode: boolean;
  setIsICMode: (enabled: boolean) => void;

  // ========== NEW: Tool State ==========
  currentToolState: ToolState;
  setCurrentToolState: (state: ToolState) => void;

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

  // 3D Camera state
  cameraPreset: CameraPreset;
  setCameraPreset: (preset: CameraPreset) => void;
  isOrbiting: boolean;
  setIsOrbiting: (orbiting: boolean) => void;

  // Canvas view mode (2D/3D/Split)
  canvasViewMode: CanvasViewMode;
  setCanvasViewMode: (mode: CanvasViewMode) => void;

  // Basemap selection
  basemap: BasemapType;
  setBasemap: (basemap: BasemapType) => void;

  // 3D Buildings source
  buildings3dSource: Buildings3DSource;
  setBuildings3dSource: (source: Buildings3DSource) => void;

  // Shadow analysis
  shadowsEnabled: boolean;
  setShadowsEnabled: (enabled: boolean) => void;
  shadowDateTime: Date;
  setShadowDateTime: (date: Date | ((prev: Date) => Date)) => void;
  isShadowAnimating: boolean;
  setIsShadowAnimating: (animating: boolean) => void;
  shadowPlaybackSpeed: 0.5 | 1 | 2 | 4;
  setShadowPlaybackSpeed: (speed: 0.5 | 1 | 2 | 4) => void;

  // Street View Mode
  isStreetViewMode: boolean;
  setIsStreetViewMode: (enabled: boolean) => void;
  streetViewSettings: {
    walkSpeed: "slow" | "medium" | "fast";
    eyeHeightMeters: number;
    mouseSensitivity: number;
  };
  setStreetViewSettings: (settings: Partial<{
    walkSpeed: "slow" | "medium" | "fast";
    eyeHeightMeters: number;
    mouseSensitivity: number;
  }>) => void;

  // Measurement tools
  measurementMode: DesignMeasurementMode;
  setMeasurementMode: (mode: DesignMeasurementMode) => void;
  measurementResult: DesignMeasurementResult | null;
  setMeasurementResult: (result: DesignMeasurementResult | null) => void;
  measurementPoints: [number, number][];
  setMeasurementPoints: (points: [number, number][]) => void;
  clearMeasurement: () => void;

  // Measurement snapping
  measurementSnappingEnabled: boolean;
  setMeasurementSnappingEnabled: (enabled: boolean) => void;
  measurementSnapSettings: MeasurementSnapSettings;
  setMeasurementSnapSettings: (settings: Partial<MeasurementSnapSettings>) => void;
  currentSnapPoint: SnapPointInfo | null;
  setCurrentSnapPoint: (snap: SnapPointInfo | null) => void;
  lastSnappedSource: string | null;
  setLastSnappedSource: (source: string | null) => void;

  // Measurement annotations (persistent)
  measurementAnnotations: MeasurementAnnotation[];
  addMeasurementAnnotation: (annotation: MeasurementAnnotation) => void;
  updateMeasurementAnnotation: (id: string, updates: Partial<MeasurementAnnotation>) => void;
  removeMeasurementAnnotation: (id: string) => void;
  toggleAnnotationVisibility: (id: string) => void;

  // Shadow comparison mode
  shadowComparisonMode: boolean;
  setShadowComparisonMode: (enabled: boolean) => void;
  shadowComparisonTimes: ShadowComparisonTime[];
  setShadowComparisonTimes: (times: ShadowComparisonTime[]) => void;
  toggleShadowComparisonTime: (id: string) => void;
  updateShadowComparisonTime: (id: string, updates: Partial<ShadowComparisonTime>) => void;

  // Google Earth-style panel states
  leftPanelState: LeftPanelState;
  setLeftPanelState: (state: LeftPanelState) => void;

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
  cameraPreset: "perspective_ne" as CameraPreset,
  isOrbiting: false,
  canvasViewMode: "3d" as CanvasViewMode,
  basemap: "osm" as BasemapType,
  buildings3dSource: "osm" as Buildings3DSource,
  shadowsEnabled: false,
  shadowDateTime: (() => {
    const date = new Date();
    date.setHours(12, 0, 0, 0); // Default to noon
    return date;
  })(),
  isShadowAnimating: false,
  shadowPlaybackSpeed: 1 as 0.5 | 1 | 2 | 4,
  isStreetViewMode: false,
  streetViewSettings: {
    walkSpeed: "medium" as const,
    eyeHeightMeters: 1.7,
    mouseSensitivity: 1.0,
  },
  measurementMode: null as DesignMeasurementMode,
  measurementResult: null as DesignMeasurementResult | null,
  measurementPoints: [] as [number, number][],
  // Measurement snapping
  measurementSnappingEnabled: true,
  measurementSnapSettings: {
    snapToParcel: true,
    snapToBuildable: true,
    snapToBuildings: true,
    snapThresholdFeet: 15,
  } as MeasurementSnapSettings,
  currentSnapPoint: null as SnapPointInfo | null,
  lastSnappedSource: null as string | null,
  // Measurement annotations (persistent)
  measurementAnnotations: [] as MeasurementAnnotation[],
  // Shadow comparison mode
  shadowComparisonMode: false,
  shadowComparisonTimes: [
    { id: "9am", hour: 9, label: "9 AM", color: "#3B82F6", visible: true },
    { id: "12pm", hour: 12, label: "12 PM", color: "#EAB308", visible: true },
    { id: "3pm", hour: 15, label: "3 PM", color: "#F97316", visible: true },
    { id: "6pm", hour: 18, label: "6 PM", color: "#EF4444", visible: true },
  ] as ShadowComparisonTime[],
  // NEW: UX Overhaul State
  bestOverallVariantId: null as string | null,
  starredVariantIds: [] as string[],
  pinnedVariantIds: [] as string[],
  variantTags: {} as Record<string, VariantTag[]>,
  variantSortMode: "recommended" as VariantSortMode,
  variantSearchQuery: "",
  hoveredVariantId: null as string | null,
  shareModalOpen: false,
  shareSettings: {
    role: "viewer" as const,
    linkAccess: "restricted" as const,
    expiration: "none" as const,
    exportPackage: {
      pdf: true,
      png: true,
      csv: false,
      complianceLog: false,
    },
  } as ShareSettings,
  shareInvites: [] as ShareInvite[],
  isICMode: false,
  currentToolState: "idle" as ToolState,
  // Google Earth-style panel states
  leftPanelState: "expanded" as LeftPanelState,
};

export const useDesignStore = create<DesignState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setCurrentView: (view) => set({ currentView: view }),

      setSession: (session) => set({ session }),

      setEnvelope: (envelope) => set({ envelope }),

      setVariants: (variants) => {
        set({ variants });
        // Recompute best overall when variants change
        get().computeBestOverall();
      },

      addVariant: (variant) =>
        set((state) => {
          const newVariants = [...state.variants, variant];
          return {
            variants: newVariants,
            activeVariantId: variant.id,
          };
        }),

      updateVariant: (id, updates) =>
        set((state) => {
          const newVariants = state.variants.map((v) =>
            v.id === id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
          );
          return { variants: newVariants };
        }),

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
            starredVariantIds: state.starredVariantIds.filter((vid) => vid !== id),
            pinnedVariantIds: state.pinnedVariantIds.filter((vid) => vid !== id),
          };
        }),

      setActiveVariantId: (id) => set({ activeVariantId: id }),

      getActiveVariant: () => {
        const state = get();
        return state.variants.find((v) => v.id === state.activeVariantId) || null;
      },

      // ========== Best Overall Calculation ==========
      computeBestOverall: () => {
        const state = get();
        const passVariants = state.variants.filter(v => v.complianceStatus === "PASS");
        
        if (passVariants.length === 0) {
          set({ bestOverallVariantId: null });
          return;
        }

        // Score each variant
        const scores = passVariants.map(v => {
          const envelope = state.envelope;
          if (!envelope || !v.metrics) {
            return { id: v.id, score: 0 };
          }

          // Envelope utilization (sweet spot is 70-90%)
          const farUtil = (v.metrics.farUsed / envelope.farCap) * 100;
          const utilizationScore = farUtil >= 70 && farUtil <= 90 
            ? 100 
            : farUtil > 90 
              ? 100 - (farUtil - 90) * 2 // Penalize over-optimization
              : farUtil * (100 / 70); // Scale up if under 70%

          // Risk proximity penalty (based on how close to WARN thresholds)
          const heightUtil = (v.heightFt / envelope.heightCapFt) * 100;
          const coverageUtil = v.metrics.coveragePct 
            ? (v.metrics.coveragePct / envelope.coverageCapPct) * 100 
            : 0;
          
          const riskPenalty = 
            (heightUtil > 90 ? (heightUtil - 90) * 0.5 : 0) +
            (coverageUtil > 90 ? (coverageUtil - 90) * 0.5 : 0) +
            (farUtil > 90 ? (farUtil - 90) * 0.5 : 0);

          // Final score
          const finalScore = utilizationScore - riskPenalty;

          return { id: v.id, score: finalScore };
        });

        // Find best
        const best = scores.reduce((a, b) => a.score > b.score ? a : b);
        set({ bestOverallVariantId: best.id });
      },

      // ========== Variant Quick Actions ==========
      toggleStarVariant: (id) =>
        set((state) => ({
          starredVariantIds: state.starredVariantIds.includes(id)
            ? state.starredVariantIds.filter((vid) => vid !== id)
            : [...state.starredVariantIds, id],
        })),

      togglePinVariant: (id) =>
        set((state) => ({
          pinnedVariantIds: state.pinnedVariantIds.includes(id)
            ? state.pinnedVariantIds.filter((vid) => vid !== id)
            : [...state.pinnedVariantIds, id],
        })),

      setVariantTags: (id, tags) =>
        set((state) => ({
          variantTags: { ...state.variantTags, [id]: tags },
        })),

      // ========== Sorting & Search ==========
      setVariantSortMode: (mode) => set({ variantSortMode: mode }),
      setVariantSearchQuery: (query) => set({ variantSearchQuery: query }),

      getSortedVariants: () => {
        const state = get();
        let filtered = state.variants;

        // Apply search filter
        if (state.variantSearchQuery.trim()) {
          const query = state.variantSearchQuery.toLowerCase();
          filtered = filtered.filter(v => 
            v.name.toLowerCase().includes(query) ||
            v.presetType?.toLowerCase().includes(query)
          );
        }

        // Apply sorting
        const sorted = [...filtered].sort((a, b) => {
          // Pinned always first
          const aPinned = state.pinnedVariantIds.includes(a.id);
          const bPinned = state.pinnedVariantIds.includes(b.id);
          if (aPinned && !bPinned) return -1;
          if (!aPinned && bPinned) return 1;

          switch (state.variantSortMode) {
            case "recommended":
              // Best Overall first, then PASS, WARN, FAIL, then by score
              if (a.id === state.bestOverallVariantId) return -1;
              if (b.id === state.bestOverallVariantId) return 1;
              const statusOrder = { PASS: 0, WARN: 1, FAIL: 2, PENDING: 3 };
              const statusDiff = statusOrder[a.complianceStatus] - statusOrder[b.complianceStatus];
              if (statusDiff !== 0) return statusDiff;
              return a.sortOrder - b.sortOrder;

            case "newest":
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

            case "starred":
              const aStarred = state.starredVariantIds.includes(a.id);
              const bStarred = state.starredVariantIds.includes(b.id);
              if (aStarred && !bStarred) return -1;
              if (!aStarred && bStarred) return 1;
              return a.sortOrder - b.sortOrder;

            case "compliance":
              const compOrder = { PASS: 0, WARN: 1, FAIL: 2, PENDING: 3 };
              return compOrder[a.complianceStatus] - compOrder[b.complianceStatus];

            default:
              return a.sortOrder - b.sortOrder;
          }
        });

        return sorted;
      },

      // ========== Hover Preview ==========
      setHoveredVariantId: (id) => set({ hoveredVariantId: id }),

      // ========== Share Modal ==========
      setShareModalOpen: (open) => set({ shareModalOpen: open }),
      setShareSettings: (settings) =>
        set((state) => ({
          shareSettings: { ...state.shareSettings, ...settings },
        })),
      addShareInvite: (invite) =>
        set((state) => ({
          shareInvites: [...state.shareInvites, invite],
        })),
      removeShareInvite: (email) =>
        set((state) => ({
          shareInvites: state.shareInvites.filter((i) => i.email !== email),
        })),

      // ========== IC Mode ==========
      setIsICMode: (enabled) => set({ isICMode: enabled }),

      // ========== Tool State ==========
      setCurrentToolState: (state) => set({ currentToolState: state }),

      // ========== Compare Mode ==========
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

      setIsDrawing: (drawing) => set({ 
        isDrawing: drawing,
        currentToolState: drawing ? "drawing" : "idle",
      }),

      setPresets: (presets) => set({ presets }),

      toggleCompliancePanel: () =>
        set((state) => ({ showCompliancePanel: !state.showCompliancePanel })),

      toggleMetricsPanel: () =>
        set((state) => ({ showMetricsPanel: !state.showMetricsPanel })),

      setIsLoadingEnvelope: (loading) => set({ isLoadingEnvelope: loading }),

      setIsSaving: (saving) => set({ isSaving: saving }),

      setCameraPreset: (preset) => set({ cameraPreset: preset }),

      setIsOrbiting: (orbiting) => set({ isOrbiting: orbiting }),

      setCanvasViewMode: (mode) => set({ canvasViewMode: mode }),

      setBasemap: (basemap) => set({ basemap }),

      setBuildings3dSource: (source) => set({ buildings3dSource: source }),

      setShadowsEnabled: (enabled) => set({ shadowsEnabled: enabled }),

      setShadowDateTime: (dateOrFn) => set((state) => ({
        shadowDateTime: typeof dateOrFn === 'function' ? dateOrFn(state.shadowDateTime) : dateOrFn
      })),

      setIsShadowAnimating: (animating) => set({ isShadowAnimating: animating }),
      
      setShadowPlaybackSpeed: (speed) => set({ shadowPlaybackSpeed: speed }),

      setIsStreetViewMode: (enabled) => set({ isStreetViewMode: enabled }),
      
      setStreetViewSettings: (settings) => set((state) => ({
        streetViewSettings: { ...state.streetViewSettings, ...settings }
      })),

      setMeasurementMode: (mode) => set({ 
        measurementMode: mode,
        measurementResult: null,
        measurementPoints: [],
        currentToolState: mode ? "measuring" : "idle",
        currentSnapPoint: null,
        lastSnappedSource: null,
      }),

      setMeasurementResult: (result) => set({ measurementResult: result }),

      setMeasurementPoints: (points) => set({ measurementPoints: points }),

      clearMeasurement: () => set({
        measurementMode: null,
        measurementResult: null,
        measurementPoints: [],
        currentToolState: "idle",
        currentSnapPoint: null,
        lastSnappedSource: null,
      }),

      // Measurement snapping
      setMeasurementSnappingEnabled: (enabled) => set({ measurementSnappingEnabled: enabled }),

      setMeasurementSnapSettings: (settings) =>
        set((state) => ({
          measurementSnapSettings: { ...state.measurementSnapSettings, ...settings },
        })),

      setCurrentSnapPoint: (snap) => set({ currentSnapPoint: snap }),

      setLastSnappedSource: (source) => set({ lastSnappedSource: source }),

      // Measurement annotations
      addMeasurementAnnotation: (annotation) =>
        set((state) => ({
          measurementAnnotations: [...state.measurementAnnotations, annotation],
        })),

      updateMeasurementAnnotation: (id, updates) =>
        set((state) => ({
          measurementAnnotations: state.measurementAnnotations.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

      removeMeasurementAnnotation: (id) =>
        set((state) => ({
          measurementAnnotations: state.measurementAnnotations.filter((a) => a.id !== id),
        })),

      toggleAnnotationVisibility: (id) =>
        set((state) => ({
          measurementAnnotations: state.measurementAnnotations.map((a) =>
            a.id === id ? { ...a, visible: !a.visible } : a
          ),
        })),

      // Shadow comparison mode
      setShadowComparisonMode: (enabled) => set({ 
        shadowComparisonMode: enabled,
        // Disable shadow animation when entering comparison mode
        isShadowAnimating: enabled ? false : undefined,
      }),

      setShadowComparisonTimes: (times) => set({ shadowComparisonTimes: times }),

      toggleShadowComparisonTime: (id) =>
        set((state) => ({
          shadowComparisonTimes: state.shadowComparisonTimes.map((t) =>
            t.id === id ? { ...t, visible: !t.visible } : t
          ),
        })),

      updateShadowComparisonTime: (id, updates) =>
        set((state) => ({
          shadowComparisonTimes: state.shadowComparisonTimes.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      // Google Earth-style panel states
      setLeftPanelState: (leftPanelState) => set({ leftPanelState }),

      reset: () => set(initialState),
    }),
    { name: "design-store" }
  )
);
