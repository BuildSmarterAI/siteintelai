/**
 * Application Types
 * Types for feasibility applications and related data.
 */

export type IntentType = 
  | 'land_acquisition'
  | 'site_selection'
  | 'development_feasibility'
  | 'due_diligence'
  | 'lending_underwriting'
  | 'portfolio_analysis';

export type EnrichmentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'partial';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'enriching'
  | 'generating'
  | 'complete'
  | 'error';

export interface ApplicationDraft {
  draft_id: string;
  user_id: string;
  application_id?: string | null;
  current_step: number;
  completed_steps?: number[] | null;
  contact_info?: Record<string, any> | null;
  property_info?: Record<string, any> | null;
  project_intent?: Record<string, any> | null;
  final_questions?: Record<string, any> | null;
  form_data?: Record<string, any> | null;
  parcel_id?: string | null;
  drawn_parcel_id?: string | null;
  parcel_source_id?: string | null;
  coverage_flags?: string[] | null;
  gis_provenance?: Record<string, any> | null;
  intent_type?: IntentType | null;
  initial_feasibility_score?: number | null;
  market_risks?: Record<string, any> | null;
  derived_max_far?: number | null;
  derived_max_height?: number | null;
  created_at: string;
  updated_at: string;
  last_saved_at: string;
  submitted_at?: string | null;
}

export interface ScoringWeights {
  location: number;
  zoning: number;
  infrastructure: number;
  environmental: number;
  market: number;
  financial: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  location: 0.20,
  zoning: 0.15,
  infrastructure: 0.20,
  environmental: 0.15,
  market: 0.15,
  financial: 0.15,
};
