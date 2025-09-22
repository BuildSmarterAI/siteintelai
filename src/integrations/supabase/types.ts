export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          access_priorities: string[] | null
          additional_notes: string | null
          administrative_area_level_2: string | null
          aerial_imagery_url: string | null
          attachments: Json | null
          best_time: string | null
          building_size_unit: string | null
          building_size_value: number | null
          company: string
          conclusion_output: string | null
          consent_contact: boolean
          consent_terms_privacy: boolean
          costs_output: string | null
          created_at: string
          desired_budget: number
          elevation: number | null
          email: string
          environmental_constraints: string[] | null
          executive_summary_output: string | null
          existing_improvements: string
          floodplain: string | null
          formatted_address: string | null
          full_name: string
          geo_lat: number | null
          geo_lng: number | null
          heard_about: string
          highest_best_use_output: string | null
          id: string
          known_risks: string[] | null
          locality: string | null
          lot_size_unit: string | null
          lot_size_value: number | null
          market_output: string | null
          marketing_opt_in: boolean
          nda_confidentiality: boolean
          neighborhood_raw: string | null
          overlay_district: string | null
          ownership_status: string
          page_url: string | null
          parcel_id_apn: string | null
          phone: string
          place_id: string | null
          preferred_contact: string | null
          project_type: string[]
          property_address: Json | null
          property_overview_output: string | null
          prototype_requirements: string | null
          quality_level: string
          report_url: string | null
          schedule_output: string | null
          sewer_lines: Json | null
          stories_height: string
          storm_lines: Json | null
          sublocality: string | null
          submarket: string
          submarket_enriched: string | null
          submission_timestamp: string
          tenant_requirements: string | null
          topography_map_url: string | null
          updated_at: string
          utilities_output: string | null
          utility_access: string[] | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          water_lines: Json | null
          zoning_classification: string | null
          zoning_code: string | null
          zoning_output: string | null
        }
        Insert: {
          access_priorities?: string[] | null
          additional_notes?: string | null
          administrative_area_level_2?: string | null
          aerial_imagery_url?: string | null
          attachments?: Json | null
          best_time?: string | null
          building_size_unit?: string | null
          building_size_value?: number | null
          company: string
          conclusion_output?: string | null
          consent_contact?: boolean
          consent_terms_privacy?: boolean
          costs_output?: string | null
          created_at?: string
          desired_budget: number
          elevation?: number | null
          email: string
          environmental_constraints?: string[] | null
          executive_summary_output?: string | null
          existing_improvements: string
          floodplain?: string | null
          formatted_address?: string | null
          full_name: string
          geo_lat?: number | null
          geo_lng?: number | null
          heard_about: string
          highest_best_use_output?: string | null
          id?: string
          known_risks?: string[] | null
          locality?: string | null
          lot_size_unit?: string | null
          lot_size_value?: number | null
          market_output?: string | null
          marketing_opt_in?: boolean
          nda_confidentiality?: boolean
          neighborhood_raw?: string | null
          overlay_district?: string | null
          ownership_status: string
          page_url?: string | null
          parcel_id_apn?: string | null
          phone: string
          place_id?: string | null
          preferred_contact?: string | null
          project_type: string[]
          property_address?: Json | null
          property_overview_output?: string | null
          prototype_requirements?: string | null
          quality_level: string
          report_url?: string | null
          schedule_output?: string | null
          sewer_lines?: Json | null
          stories_height: string
          storm_lines?: Json | null
          sublocality?: string | null
          submarket: string
          submarket_enriched?: string | null
          submission_timestamp?: string
          tenant_requirements?: string | null
          topography_map_url?: string | null
          updated_at?: string
          utilities_output?: string | null
          utility_access?: string[] | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          water_lines?: Json | null
          zoning_classification?: string | null
          zoning_code?: string | null
          zoning_output?: string | null
        }
        Update: {
          access_priorities?: string[] | null
          additional_notes?: string | null
          administrative_area_level_2?: string | null
          aerial_imagery_url?: string | null
          attachments?: Json | null
          best_time?: string | null
          building_size_unit?: string | null
          building_size_value?: number | null
          company?: string
          conclusion_output?: string | null
          consent_contact?: boolean
          consent_terms_privacy?: boolean
          costs_output?: string | null
          created_at?: string
          desired_budget?: number
          elevation?: number | null
          email?: string
          environmental_constraints?: string[] | null
          executive_summary_output?: string | null
          existing_improvements?: string
          floodplain?: string | null
          formatted_address?: string | null
          full_name?: string
          geo_lat?: number | null
          geo_lng?: number | null
          heard_about?: string
          highest_best_use_output?: string | null
          id?: string
          known_risks?: string[] | null
          locality?: string | null
          lot_size_unit?: string | null
          lot_size_value?: number | null
          market_output?: string | null
          marketing_opt_in?: boolean
          nda_confidentiality?: boolean
          neighborhood_raw?: string | null
          overlay_district?: string | null
          ownership_status?: string
          page_url?: string | null
          parcel_id_apn?: string | null
          phone?: string
          place_id?: string | null
          preferred_contact?: string | null
          project_type?: string[]
          property_address?: Json | null
          property_overview_output?: string | null
          prototype_requirements?: string | null
          quality_level?: string
          report_url?: string | null
          schedule_output?: string | null
          sewer_lines?: Json | null
          stories_height?: string
          storm_lines?: Json | null
          sublocality?: string | null
          submarket?: string
          submarket_enriched?: string | null
          submission_timestamp?: string
          tenant_requirements?: string | null
          topography_map_url?: string | null
          updated_at?: string
          utilities_output?: string | null
          utility_access?: string[] | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          water_lines?: Json | null
          zoning_classification?: string | null
          zoning_code?: string | null
          zoning_output?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
