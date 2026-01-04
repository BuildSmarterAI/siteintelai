/**
 * Design Intent Types
 * 
 * Canonical schema for wizard selections persisted per session.
 * Enables: resume mid-wizard, team collaboration, audit trail, deterministic regeneration.
 */

import type {
  UseType,
  RiskTolerance,
  SustainabilityLevel,
  ParkingType,
  ProgramBucket,
} from './wizard';

/**
 * Design Intent - persisted to design_sessions.design_intent
 * Captures all wizard decisions for reproducibility and audit
 */
export interface DesignIntent {
  /** Schema version for future migrations */
  version: 1;
  
  /** Wizard step state */
  wizard: {
    /** Current step when saved (1-7) */
    currentStep: number;
    /** Highest step reached */
    maxReachedStep: number;
    /** Whether site was confirmed in step 1 */
    siteConfirmed: boolean;
    /** Whether wizard is complete */
    isComplete: boolean;
    /** Timestamp of last wizard interaction */
    lastInteractionAt: string;
  };
  
  /** Selected use types (1-3) */
  selectedUseTypes: UseType[];
  
  /** Program targets per use type */
  programBuckets: ProgramBucket[];
  
  /** Parking configuration */
  parking: {
    enabled: boolean;
    type: ParkingType;
    ratio: number;
    estimatedStalls: number;
  };
  
  /** Selected template keys */
  selectedTemplateKeys: string[];
  
  /** Sustainability configuration */
  sustainability: {
    enabled: boolean;
    level: SustainabilityLevel;
  };
  
  /** Timestamps for audit trail */
  createdAt: string;
  updatedAt: string;
}

/**
 * Create an empty DesignIntent with defaults
 */
export function createEmptyDesignIntent(): DesignIntent {
  const now = new Date().toISOString();
  return {
    version: 1,
    wizard: {
      currentStep: 1,
      maxReachedStep: 1,
      siteConfirmed: false,
      isComplete: false,
      lastInteractionAt: now,
    },
    selectedUseTypes: [],
    programBuckets: [],
    parking: {
      enabled: false,
      type: 'surface',
      ratio: 3.5,
      estimatedStalls: 0,
    },
    selectedTemplateKeys: [],
    sustainability: {
      enabled: false,
      level: 'standard',
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create DesignIntent from wizard store state
 */
export function createDesignIntentFromWizard(params: {
  currentStep: number;
  maxReachedStep: number;
  siteConfirmed: boolean;
  selectedUseTypes: UseType[];
  programBuckets: ProgramBucket[];
  parkingConfig: { enabled: boolean; type: ParkingType; ratio: number; estimatedStalls: number };
  selectedTemplates: { templateKey: string }[];
  sustainabilityEnabled: boolean;
  sustainabilityLevel: SustainabilityLevel;
  isComplete?: boolean;
}): DesignIntent {
  const now = new Date().toISOString();
  return {
    version: 1,
    wizard: {
      currentStep: params.currentStep,
      maxReachedStep: params.maxReachedStep,
      siteConfirmed: params.siteConfirmed,
      isComplete: params.isComplete ?? false,
      lastInteractionAt: now,
    },
    selectedUseTypes: params.selectedUseTypes,
    programBuckets: params.programBuckets,
    parking: params.parkingConfig,
    selectedTemplateKeys: params.selectedTemplates.map(t => t.templateKey),
    sustainability: {
      enabled: params.sustainabilityEnabled,
      level: params.sustainabilityLevel,
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Merge existing DesignIntent with updates
 */
export function updateDesignIntent(
  existing: DesignIntent,
  updates: Partial<Omit<DesignIntent, 'version' | 'createdAt'>>
): DesignIntent {
  return {
    ...existing,
    ...updates,
    wizard: {
      ...existing.wizard,
      ...(updates.wizard || {}),
      lastInteractionAt: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Validate a DesignIntent object
 */
export function isValidDesignIntent(value: unknown): value is DesignIntent {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  
  // Check version
  if (v.version !== 1) return false;
  
  // Check required arrays
  if (!Array.isArray(v.selectedUseTypes)) return false;
  if (!Array.isArray(v.programBuckets)) return false;
  if (!Array.isArray(v.selectedTemplateKeys)) return false;
  
  // Check required objects
  if (!v.wizard || typeof v.wizard !== 'object') return false;
  if (!v.parking || typeof v.parking !== 'object') return false;
  if (!v.sustainability || typeof v.sustainability !== 'object') return false;
  
  return true;
}

/**
 * Generation job status for tracking atomic variant creation
 */
export type GenerationJobStatus = 'pending' | 'processing' | 'complete' | 'failed';

/**
 * Generation job record for tracking variant generation
 */
export interface GenerationJob {
  id: string;
  sessionId: string;
  status: GenerationJobStatus;
  inputHash: string;
  designIntent: DesignIntent;
  variantsCount: number | null;
  bestVariantId: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}
