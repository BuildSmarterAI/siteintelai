/**
 * SiteIntel™ Design Mode - Type Definitions
 * 
 * Extended types for design workflow, compliance, sharing, and variant management.
 */

// ============================================================================
// Variant Management Types
// ============================================================================

export type VariantSortMode = "recommended" | "newest" | "starred" | "compliance";

export type VariantTag = "ic-ready" | "needs-review" | "discard" | "finalist";

export interface VariantQuickActions {
  duplicate: () => void;
  star: () => void;
  pin: () => void;
  tag: (tags: VariantTag[]) => void;
  share: () => void;
  export: () => void;
  branchFromBest: () => void;
}

// ============================================================================
// Compliance Types
// ============================================================================

export type ComplianceFixType = 
  | "clamp_height" 
  | "shrink_footprint" 
  | "reduce_floors" 
  | "reset_to_pass";

export interface ComplianceFix {
  id: string;
  type: ComplianceFixType;
  label: string;
  description: string;
  estimatedReduction?: string;
  apply: () => void;
}

export interface ThresholdMeter {
  id: string;
  name: string;
  currentValue: number;
  maxValue: number;
  unit: string;
  percentUsed: number;
  isNearLimit: boolean; // >= 90%
  isOverLimit: boolean; // > 100%
}

// ============================================================================
// Sharing Types
// ============================================================================

export type ShareRole = "owner" | "editor" | "viewer";
export type LinkAccess = "restricted" | "anyone";
export type ShareExpiration = "none" | "7d" | "30d";

export interface ShareExportPackage {
  pdf: boolean;
  png: boolean;
  csv: boolean;
  complianceLog: boolean;
}

export interface ShareSettings {
  role: ShareRole;
  linkAccess: LinkAccess;
  expiration: ShareExpiration;
  exportPackage: ShareExportPackage;
}

export interface ShareInvite {
  email: string;
  role: ShareRole;
  invitedAt: string;
  lastViewedAt?: string;
}

// ============================================================================
// Tool State Types
// ============================================================================

export type ToolState = 
  | "idle" 
  | "drawing" 
  | "editing" 
  | "moving" 
  | "scaling" 
  | "height_adjust" 
  | "measuring";

export interface ToolConfig {
  id: ToolState;
  label: string;
  icon: string;
  shortcut?: string;
  requiresVariant: boolean;
  requiresEnvelope: boolean;
}

// ============================================================================
// Camera Types
// ============================================================================

export type CameraPresetExtended = 
  | "overhead" 
  | "perspective_ne" 
  | "perspective_sw" 
  | "street" 
  | "context" 
  | "parcel_fit";

export interface CameraConfig {
  preset: CameraPresetExtended;
  label: string;
  icon: string;
  shortcut: string;
  pitch: number;
  heading: number;
}

// ============================================================================
// Best Overall Calculation Types
// ============================================================================

export interface VariantScore {
  variantId: string;
  envelopeUtilization: number; // 0-100%
  riskProximityPenalty: number; // 0-30 penalty points
  complexityPenalty: number; // 0-20 penalty points
  constraintsProximity: number; // 0-100, lower is better
  finalScore: number;
  isEligible: boolean; // Must be PASS
}

// ============================================================================
// Micro Overlay Types
// ============================================================================

export interface MicroMetric {
  id: string;
  label: string;
  value: string;
  unit?: string;
  status?: "normal" | "warn" | "fail";
}

export interface MicroConstraint {
  id: string;
  label: string;
  currentValue: number;
  maxValue: number;
  unit: string;
  percentUsed: number;
}

// ============================================================================
// IC Mode Types
// ============================================================================

export interface ICModeConfig {
  enabled: boolean;
  lockedCamera: boolean;
  fixedViewpoints: CameraPresetExtended[];
  disclaimerVisible: boolean;
}
