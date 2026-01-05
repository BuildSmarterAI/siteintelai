/**
 * CityEngine Integration Types
 * 
 * Defines the data contract between SiteIntel and CityEngine 2025.1
 * for automated massing generation and facade skinning.
 */

import type { GeoJSON } from "geojson";

// ============================================================================
// Core Payload Types
// ============================================================================

export type UseType = "hotel" | "medical" | "office" | "retail" | "mixed" | "multifamily" | "industrial";
export type FacadePreset = "hotel_v1" | "medical_v1" | "ti_v1" | "office_v1" | "multifamily_v1";
export type FacadeStyle = "modern" | "traditional" | "contemporary";
export type ExportFormat = "glb" | "obj" | "png";
export type ViewType = "axon" | "top" | "street";
export type OptioningStrategy = "sweep" | "single" | "optimized";

export interface CityEngineSetbacks {
  front: number;
  rear: number;
  left: number;
  right: number;
}

export interface CityEngineSite {
  /** Coordinate reference system */
  crs: "EPSG:4326";
  /** Regulatory envelope polygon (buildable area after setbacks) */
  envelope_geojson: GeoJSON.Polygon;
  /** Original parcel boundary */
  parcel_geojson: GeoJSON.Polygon;
  /** Buildable area in square feet */
  buildable_area_sf: number;
  /** Frontage edge identifiers */
  frontage_edges?: string[];
  /** Access points for entry placement */
  access_points?: Array<{
    name: string;
    lng: number;
    lat: number;
  }>;
}

export interface CityEngineConstraints {
  /** Maximum building height in feet */
  max_height_ft: number;
  /** Maximum floor count */
  max_floors?: number;
  /** Floor Area Ratio cap */
  far_cap: number;
  /** Site coverage percentage cap */
  coverage_cap_pct: number;
  /** Setbacks in feet per side */
  setbacks_ft: CityEngineSetbacks;
  /** Parking ratio (spaces per 1000 SF) */
  parking_ratio?: number;
  /** Impervious coverage cap percentage */
  impervious_cap_pct?: number;
}

export interface CityEngineProgram {
  /** Primary use type */
  use_type: UseType;
  /** Target gross floor area in SF */
  target_gsf: number;
  /** Floor-to-floor height in feet */
  floor_to_floor_ft: number;
  /** Template key from design library */
  template_key?: string;
  /** Core type for corridor layout */
  core_type?: "single_loaded" | "double_loaded" | "point";
  /** Whether ground floor should be retail/active */
  ground_floor_active?: boolean;
  /** Target unit/key count (for hotel/multifamily) */
  target_units?: number;
}

export interface CityEngineOptioning {
  /** Generation strategy */
  strategy: OptioningStrategy;
  /** Number of variants to generate (1-6) */
  count: number;
  /** Variables to sweep for variant generation */
  variables?: {
    floors?: number[];
    rotation_deg?: number[];
    plate_depth_ft?: number[];
    podium?: number[];
  };
}

export interface CityEngineFacade {
  /** Facade preset name */
  preset: FacadePreset;
  /** Architectural style */
  style: FacadeStyle;
  /** Window-to-wall ratio (0-1) */
  window_to_wall: number;
  /** Primary material */
  primary_material?: string;
  /** Accent material */
  accent_material?: string;
}

export interface CityEngineExport {
  /** Export formats to generate */
  formats: ExportFormat[];
  /** View types to render */
  views: ViewType[];
  /** PNG render size [width, height] */
  png_size: [number, number];
  /** Include parameter manifest */
  include_manifest?: boolean;
}

/**
 * Complete CityEngine generation payload
 * This is the single contract that drives a CityEngine run.
 */
export interface CityEnginePayload {
  /** Unique job identifier */
  job_id: string;
  /** SiteIntel parcel identifier */
  parcel_id: string;
  /** Application ID for linkage */
  application_id?: string;
  /** Design session ID for linkage */
  session_id?: string;
  /** Design variant ID for linkage */
  variant_id?: string;
  
  /** Site geometry and metadata */
  site: CityEngineSite;
  /** Regulatory constraints */
  constraints: CityEngineConstraints;
  /** Program requirements */
  program: CityEngineProgram;
  /** Variant generation options */
  optioning: CityEngineOptioning;
  /** Facade configuration */
  facade: CityEngineFacade;
  /** Export settings */
  export: CityEngineExport;
}

// ============================================================================
// Job Status Types
// ============================================================================

export type CityEngineJobStatus = 
  | "queued" 
  | "processing" 
  | "exporting" 
  | "uploading" 
  | "complete" 
  | "failed" 
  | "cancelled";

export interface CityEngineOutputManifest {
  /** Version of the manifest schema */
  version: string;
  /** Generation timestamp */
  generated_at: string;
  /** Generator identifier */
  generator: string;
  
  /** Site summary */
  site: {
    parcel_id: string;
    address?: string;
    buildable_area_sf: number;
  };
  
  /** Applied constraints */
  constraints: CityEngineConstraints;
  
  /** Resulting design metrics */
  design: {
    use_type: UseType;
    floors: number;
    height_ft: number;
    gfa_sf: number;
    far_achieved: number;
    coverage_pct: number;
    template: string;
    facade_preset: FacadePreset;
  };
  
  /** Export file paths (Supabase Storage paths) */
  exports: {
    model_glb?: string;
    model_obj?: string;
    view_axon?: string;
    view_top?: string;
    view_street?: string;
    manifest?: string;
  };
  
  /** Legal disclaimer */
  disclaimer: string;
}

export interface CityEngineJob {
  id: string;
  application_id: string | null;
  session_id: string | null;
  variant_id: string | null;
  user_id: string;
  status: CityEngineJobStatus;
  input_payload: CityEnginePayload;
  input_hash: string;
  output_manifest: CityEngineOutputManifest | null;
  attempt: number;
  max_attempts: number;
  error_message: string | null;
  error_code: string | null;
  processing_time_ms: number | null;
  progress: number;
  current_stage: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface QueueCityEngineJobRequest {
  /** Application ID to generate for */
  application_id?: string;
  /** Design session ID */
  session_id?: string;
  /** Design variant ID */
  variant_id?: string;
  /** Override payload (optional, will be built from linked entities if not provided) */
  payload?: Partial<CityEnginePayload>;
  /** Force regeneration even if cached result exists */
  force?: boolean;
}

export interface QueueCityEngineJobResponse {
  /** Job ID */
  job_id: string;
  /** Current status */
  status: CityEngineJobStatus;
  /** Whether this is a cached result */
  cached: boolean;
  /** Output manifest if complete */
  output_manifest?: CityEngineOutputManifest;
  /** Error message if failed */
  error?: string;
}

export interface CityEngineJobStatusResponse {
  /** Job details */
  job: CityEngineJob;
  /** Signed URLs for exports (only if complete) */
  signed_urls?: {
    model_glb?: string;
    model_obj?: string;
    view_axon?: string;
    view_top?: string;
    view_street?: string;
  };
}

// ============================================================================
// Validation Types
// ============================================================================

export interface CityEngineValidationResult {
  /** Whether all hard constraints pass */
  valid: boolean;
  /** Hard constraint violations (must fix) */
  errors: string[];
  /** Soft constraint warnings (should review) */
  warnings: string[];
}

export interface CityEngineComplianceCheck {
  /** Check identifier */
  id: string;
  /** Human-readable label */
  label: string;
  /** Pass/fail status */
  passed: boolean;
  /** Current value */
  current: number;
  /** Limit value */
  limit: number;
  /** Unit label */
  unit: string;
  /** Severity if failed */
  severity: "error" | "warning";
}
