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
          attachments: Json | null
          best_time: string | null
          building_size_unit: string | null
          building_size_value: number | null
          company: string
          consent_contact: boolean
          consent_terms_privacy: boolean
          created_at: string
          desired_budget: number
          email: string
          environmental_constraints: string[] | null
          existing_improvements: string
          full_name: string
          heard_about: string
          id: string
          known_risks: string[] | null
          lot_size_unit: string | null
          lot_size_value: number | null
          marketing_opt_in: boolean
          nda_confidentiality: boolean
          ownership_status: string
          page_url: string | null
          parcel_id_apn: string | null
          phone: string
          preferred_contact: string | null
          project_type: string[]
          property_address: Json | null
          prototype_requirements: string | null
          quality_level: string
          report_url: string | null
          stories_height: string
          submarket: string
          submission_timestamp: string
          tenant_requirements: string | null
          updated_at: string
          utility_access: string[] | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          zoning_classification: string | null
        }
        Insert: {
          access_priorities?: string[] | null
          additional_notes?: string | null
          attachments?: Json | null
          best_time?: string | null
          building_size_unit?: string | null
          building_size_value?: number | null
          company: string
          consent_contact?: boolean
          consent_terms_privacy?: boolean
          created_at?: string
          desired_budget: number
          email: string
          environmental_constraints?: string[] | null
          existing_improvements: string
          full_name: string
          heard_about: string
          id?: string
          known_risks?: string[] | null
          lot_size_unit?: string | null
          lot_size_value?: number | null
          marketing_opt_in?: boolean
          nda_confidentiality?: boolean
          ownership_status: string
          page_url?: string | null
          parcel_id_apn?: string | null
          phone: string
          preferred_contact?: string | null
          project_type: string[]
          property_address?: Json | null
          prototype_requirements?: string | null
          quality_level: string
          report_url?: string | null
          stories_height: string
          submarket: string
          submission_timestamp?: string
          tenant_requirements?: string | null
          updated_at?: string
          utility_access?: string[] | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          zoning_classification?: string | null
        }
        Update: {
          access_priorities?: string[] | null
          additional_notes?: string | null
          attachments?: Json | null
          best_time?: string | null
          building_size_unit?: string | null
          building_size_value?: number | null
          company?: string
          consent_contact?: boolean
          consent_terms_privacy?: boolean
          created_at?: string
          desired_budget?: number
          email?: string
          environmental_constraints?: string[] | null
          existing_improvements?: string
          full_name?: string
          heard_about?: string
          id?: string
          known_risks?: string[] | null
          lot_size_unit?: string | null
          lot_size_value?: number | null
          marketing_opt_in?: boolean
          nda_confidentiality?: boolean
          ownership_status?: string
          page_url?: string | null
          parcel_id_apn?: string | null
          phone?: string
          preferred_contact?: string | null
          project_type?: string[]
          property_address?: Json | null
          prototype_requirements?: string | null
          quality_level?: string
          report_url?: string | null
          stories_height?: string
          submarket?: string
          submission_timestamp?: string
          tenant_requirements?: string | null
          updated_at?: string
          utility_access?: string[] | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          zoning_classification?: string | null
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
