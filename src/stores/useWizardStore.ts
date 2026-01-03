/**
 * Wizard Store
 * Zustand store for "Explore Building Designs" wizard state
 */

import { create } from 'zustand';
import type {
  UseType,
  RiskTolerance,
  SustainabilityLevel,
  ParkingType,
  ProgramBucket,
  SelectedTemplate,
  WizardState,
} from '@/types/wizard';

interface WizardStore extends WizardState {
  isOpen: boolean;
  // Wizard controls
  openWizard: () => void;
  closeWizard: () => void;
  resetWizard: () => void;
  // Navigation
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  // Step 1: Site
  confirmSite: () => void;
  // Step 2: Use Types
  toggleUseType: (useType: UseType) => void;
  // Step 3: Program Targets
  updateProgramBucket: (useType: UseType, updates: Partial<ProgramBucket>) => void;
  // Step 4: Parking
  setParkingEnabled: (enabled: boolean) => void;
  setParkingType: (type: ParkingType) => void;
  setParkingRatio: (ratio: number) => void;
  updateParkingEstimate: (totalGfa: number) => void;
  // Step 5: Templates
  addTemplate: (template: SelectedTemplate) => void;
  removeTemplate: (templateKey: string) => void;
  setHoveredTemplate: (templateKey: string | null) => void;
  // Step 6: Sustainability
  setSustainabilityEnabled: (enabled: boolean) => void;
  setSustainabilityLevel: (level: SustainabilityLevel) => void;
  // Step 7: Generate
  setGenerating: (isGenerating: boolean) => void;
  setGenerationProgress: (progress: number) => void;
  setGeneratedVariantIds: (ids: string[]) => void;
}

const initialState: WizardState & { isOpen: boolean } = {
  isOpen: false,
  currentStep: 1,
  maxReachedStep: 1,
  siteConfirmed: false,
  selectedUseTypes: [],
  programBuckets: [],
  parkingConfig: { enabled: false, type: 'surface', ratio: 3.5, estimatedStalls: 0 },
  selectedTemplates: [],
  hoveredTemplateKey: null,
  sustainabilityEnabled: false,
  sustainabilityLevel: 'standard',
  isGenerating: false,
  generationProgress: 0,
  generatedVariantIds: [],
};

const DEFAULT_FLOOR_HEIGHTS: Record<UseType, number> = {
  industrial: 28, multifamily: 11, office: 13, retail: 14, medical: 12, hotel: 10,
};

export const useWizardStore = create<WizardStore>()((set, get) => ({
  ...initialState,
  
  openWizard: () => set({ isOpen: true }),
  closeWizard: () => set({ isOpen: false }),
  resetWizard: () => set(initialState),
  
  setStep: (step) => set((s) => ({ 
    currentStep: step, 
    maxReachedStep: Math.max(step, s.maxReachedStep) 
  })),
  nextStep: () => set((s) => {
    if (s.currentStep < 7) {
      const next = s.currentStep + 1;
      return { currentStep: next, maxReachedStep: Math.max(next, s.maxReachedStep) };
    }
    return {};
  }),
  prevStep: () => set((s) => s.currentStep > 1 ? { currentStep: s.currentStep - 1 } : {}),
  
  confirmSite: () => set({ siteConfirmed: true }),
  
  toggleUseType: (useType) => set((s) => {
    const idx = s.selectedUseTypes.indexOf(useType);
    if (idx >= 0) {
      return {
        selectedUseTypes: s.selectedUseTypes.filter(u => u !== useType),
        programBuckets: s.programBuckets.filter(b => b.useType !== useType),
      };
    } else if (s.selectedUseTypes.length < 3) {
      return {
        selectedUseTypes: [...s.selectedUseTypes, useType],
        programBuckets: [...s.programBuckets, {
          useType,
          targetGfa: 50000,
          targetStories: 2,
          riskTolerance: 'balanced' as RiskTolerance,
          floorToFloorFt: DEFAULT_FLOOR_HEIGHTS[useType],
        }],
      };
    }
    return {};
  }),
  
  updateProgramBucket: (useType, updates) => set((s) => ({
    programBuckets: s.programBuckets.map(b => 
      b.useType === useType ? { ...b, ...updates } : b
    ),
  })),
  
  setParkingEnabled: (enabled) => set((s) => ({ 
    parkingConfig: { ...s.parkingConfig, enabled } 
  })),
  setParkingType: (type) => set((s) => ({ 
    parkingConfig: { ...s.parkingConfig, type } 
  })),
  setParkingRatio: (ratio) => set((s) => ({ 
    parkingConfig: { ...s.parkingConfig, ratio } 
  })),
  updateParkingEstimate: (totalGfa) => set((s) => ({
    parkingConfig: {
      ...s.parkingConfig,
      estimatedStalls: s.parkingConfig.enabled 
        ? Math.ceil((totalGfa / 1000) * s.parkingConfig.ratio) 
        : 0,
    },
  })),
  
  addTemplate: (template) => set((s) => {
    if (s.selectedTemplates.find(t => t.templateKey === template.templateKey)) return {};
    return { selectedTemplates: [...s.selectedTemplates, template] };
  }),
  removeTemplate: (templateKey) => set((s) => ({
    selectedTemplates: s.selectedTemplates.filter(t => t.templateKey !== templateKey),
  })),
  setHoveredTemplate: (templateKey) => set({ hoveredTemplateKey: templateKey }),
  
  setSustainabilityEnabled: (enabled) => set({ sustainabilityEnabled: enabled }),
  setSustainabilityLevel: (level) => set({ sustainabilityLevel: level }),
  
  setGenerating: (isGenerating) => set({ isGenerating }),
  setGenerationProgress: (progress) => set({ generationProgress: progress }),
  setGeneratedVariantIds: (ids) => set({ generatedVariantIds: ids }),
}));

export const selectTotalProgramGfa = (state: WizardStore) =>
  state.programBuckets.reduce((sum, bucket) => sum + bucket.targetGfa, 0);

export const selectCanProceed = (state: WizardStore): boolean => {
  switch (state.currentStep) {
    case 1: return state.siteConfirmed;
    case 2: return state.selectedUseTypes.length > 0;
    case 3: return state.programBuckets.length > 0;
    case 4: return true;
    case 5: return state.selectedTemplates.length > 0;
    case 6: return true;
    case 7: return !state.isGenerating;
    default: return false;
  }
};
