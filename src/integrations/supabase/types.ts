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
          acreage_cad: number | null
          additional_notes: string | null
          administrative_area_level_1: string | null
          aerial_imagery_url: string | null
          attachments: Json | null
          average_permit_time_months: number | null
          base_flood_elevation: number | null
          best_time: string | null
          broadband_providers: Json | null
          building_size_unit: string | null
          building_size_value: number | null
          city: string | null
          company: string
          conclusion_output: string | null
          consent_contact: boolean
          consent_terms_privacy: boolean
          costs_output: string | null
          county: string | null
          created_at: string
          data_flags: Json | null
          desired_budget: number | null
          distance_highway_ft: number | null
          distance_transit_ft: number | null
          drive_time_15min_population: number | null
          drive_time_30min_population: number | null
          elevation: number | null
          email: string
          employment_clusters: Json | null
          enterprise_zone: boolean | null
          entitlement_notes: string | null
          environmental_constraints: string[] | null
          environmental_sites: Json | null
          executive_summary_output: string | null
          existing_improvements: string
          fiber_available: boolean | null
          floodplain_zone: string | null
          foreign_trade_zone: boolean | null
          formatted_address: string | null
          full_name: string
          geo_lat: number | null
          geo_lng: number | null
          growth_rate_5yr: number | null
          heard_about: string
          highest_best_use_output: string | null
          historical_flood_events: number | null
          households_5mi: number | null
          id: string
          known_risks: string[] | null
          lot_size_unit: string | null
          lot_size_value: number | null
          market_output: string | null
          marketing_opt_in: boolean
          median_income: number | null
          nda_confidentiality: boolean
          nearest_highway: string | null
          nearest_transit_stop: string | null
          neighborhood: string | null
          opportunity_zone: boolean | null
          overlay_district: string | null
          ownership_status: string
          page_url: string | null
          parcel_id: string | null
          parcel_owner: string | null
          phone: string
          place_id: string | null
          population_1mi: number | null
          population_3mi: number | null
          population_5mi: number | null
          postal_code: string | null
          power_kv_nearby: number | null
          preferred_contact: string | null
          project_type: string[]
          property_address: Json | null
          property_overview_output: string | null
          prototype_requirements: string | null
          quality_level: string
          report_url: string | null
          schedule_output: string | null
          sewer_capacity_mgd: number | null
          sewer_lines: Json | null
          situs_address: string | null
          soil_drainage_class: string | null
          soil_series: string | null
          soil_slope_percent: number | null
          stories_height: string
          storm_lines: Json | null
          sublocality: string | null
          submarket_enriched: string | null
          submission_timestamp: string
          tax_rate_total: number | null
          taxing_jurisdictions: Json | null
          tenant_requirements: string | null
          topography_map_url: string | null
          traffic_aadt: number | null
          traffic_direction: string | null
          traffic_distance_ft: number | null
          traffic_map_url: string | null
          traffic_output: string | null
          traffic_road_name: string | null
          traffic_segment_id: string | null
          traffic_year: number | null
          updated_at: string
          utilities_output: string | null
          utility_access: string[] | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          water_capacity_mgd: number | null
          water_lines: Json | null
          wetlands_type: string | null
          zoning_code: string | null
          zoning_output: string | null
        }
        Insert: {
          access_priorities?: string[] | null
          acreage_cad?: number | null
          additional_notes?: string | null
          administrative_area_level_1?: string | null
          aerial_imagery_url?: string | null
          attachments?: Json | null
          average_permit_time_months?: number | null
          base_flood_elevation?: number | null
          best_time?: string | null
          broadband_providers?: Json | null
          building_size_unit?: string | null
          building_size_value?: number | null
          city?: string | null
          company: string
          conclusion_output?: string | null
          consent_contact?: boolean
          consent_terms_privacy?: boolean
          costs_output?: string | null
          county?: string | null
          created_at?: string
          data_flags?: Json | null
          desired_budget?: number | null
          distance_highway_ft?: number | null
          distance_transit_ft?: number | null
          drive_time_15min_population?: number | null
          drive_time_30min_population?: number | null
          elevation?: number | null
          email: string
          employment_clusters?: Json | null
          enterprise_zone?: boolean | null
          entitlement_notes?: string | null
          environmental_constraints?: string[] | null
          environmental_sites?: Json | null
          executive_summary_output?: string | null
          existing_improvements: string
          fiber_available?: boolean | null
          floodplain_zone?: string | null
          foreign_trade_zone?: boolean | null
          formatted_address?: string | null
          full_name: string
          geo_lat?: number | null
          geo_lng?: number | null
          growth_rate_5yr?: number | null
          heard_about: string
          highest_best_use_output?: string | null
          historical_flood_events?: number | null
          households_5mi?: number | null
          id?: string
          known_risks?: string[] | null
          lot_size_unit?: string | null
          lot_size_value?: number | null
          market_output?: string | null
          marketing_opt_in?: boolean
          median_income?: number | null
          nda_confidentiality?: boolean
          nearest_highway?: string | null
          nearest_transit_stop?: string | null
          neighborhood?: string | null
          opportunity_zone?: boolean | null
          overlay_district?: string | null
          ownership_status: string
          page_url?: string | null
          parcel_id?: string | null
          parcel_owner?: string | null
          phone: string
          place_id?: string | null
          population_1mi?: number | null
          population_3mi?: number | null
          population_5mi?: number | null
          postal_code?: string | null
          power_kv_nearby?: number | null
          preferred_contact?: string | null
          project_type: string[]
          property_address?: Json | null
          property_overview_output?: string | null
          prototype_requirements?: string | null
          quality_level: string
          report_url?: string | null
          schedule_output?: string | null
          sewer_capacity_mgd?: number | null
          sewer_lines?: Json | null
          situs_address?: string | null
          soil_drainage_class?: string | null
          soil_series?: string | null
          soil_slope_percent?: number | null
          stories_height: string
          storm_lines?: Json | null
          sublocality?: string | null
          submarket_enriched?: string | null
          submission_timestamp?: string
          tax_rate_total?: number | null
          taxing_jurisdictions?: Json | null
          tenant_requirements?: string | null
          topography_map_url?: string | null
          traffic_aadt?: number | null
          traffic_direction?: string | null
          traffic_distance_ft?: number | null
          traffic_map_url?: string | null
          traffic_output?: string | null
          traffic_road_name?: string | null
          traffic_segment_id?: string | null
          traffic_year?: number | null
          updated_at?: string
          utilities_output?: string | null
          utility_access?: string[] | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          water_capacity_mgd?: number | null
          water_lines?: Json | null
          wetlands_type?: string | null
          zoning_code?: string | null
          zoning_output?: string | null
        }
        Update: {
          access_priorities?: string[] | null
          acreage_cad?: number | null
          additional_notes?: string | null
          administrative_area_level_1?: string | null
          aerial_imagery_url?: string | null
          attachments?: Json | null
          average_permit_time_months?: number | null
          base_flood_elevation?: number | null
          best_time?: string | null
          broadband_providers?: Json | null
          building_size_unit?: string | null
          building_size_value?: number | null
          city?: string | null
          company?: string
          conclusion_output?: string | null
          consent_contact?: boolean
          consent_terms_privacy?: boolean
          costs_output?: string | null
          county?: string | null
          created_at?: string
          data_flags?: Json | null
          desired_budget?: number | null
          distance_highway_ft?: number | null
          distance_transit_ft?: number | null
          drive_time_15min_population?: number | null
          drive_time_30min_population?: number | null
          elevation?: number | null
          email?: string
          employment_clusters?: Json | null
          enterprise_zone?: boolean | null
          entitlement_notes?: string | null
          environmental_constraints?: string[] | null
          environmental_sites?: Json | null
          executive_summary_output?: string | null
          existing_improvements?: string
          fiber_available?: boolean | null
          floodplain_zone?: string | null
          foreign_trade_zone?: boolean | null
          formatted_address?: string | null
          full_name?: string
          geo_lat?: number | null
          geo_lng?: number | null
          growth_rate_5yr?: number | null
          heard_about?: string
          highest_best_use_output?: string | null
          historical_flood_events?: number | null
          households_5mi?: number | null
          id?: string
          known_risks?: string[] | null
          lot_size_unit?: string | null
          lot_size_value?: number | null
          market_output?: string | null
          marketing_opt_in?: boolean
          median_income?: number | null
          nda_confidentiality?: boolean
          nearest_highway?: string | null
          nearest_transit_stop?: string | null
          neighborhood?: string | null
          opportunity_zone?: boolean | null
          overlay_district?: string | null
          ownership_status?: string
          page_url?: string | null
          parcel_id?: string | null
          parcel_owner?: string | null
          phone?: string
          place_id?: string | null
          population_1mi?: number | null
          population_3mi?: number | null
          population_5mi?: number | null
          postal_code?: string | null
          power_kv_nearby?: number | null
          preferred_contact?: string | null
          project_type?: string[]
          property_address?: Json | null
          property_overview_output?: string | null
          prototype_requirements?: string | null
          quality_level?: string
          report_url?: string | null
          schedule_output?: string | null
          sewer_capacity_mgd?: number | null
          sewer_lines?: Json | null
          situs_address?: string | null
          soil_drainage_class?: string | null
          soil_series?: string | null
          soil_slope_percent?: number | null
          stories_height?: string
          storm_lines?: Json | null
          sublocality?: string | null
          submarket_enriched?: string | null
          submission_timestamp?: string
          tax_rate_total?: number | null
          taxing_jurisdictions?: Json | null
          tenant_requirements?: string | null
          topography_map_url?: string | null
          traffic_aadt?: number | null
          traffic_direction?: string | null
          traffic_distance_ft?: number | null
          traffic_map_url?: string | null
          traffic_output?: string | null
          traffic_road_name?: string | null
          traffic_segment_id?: string | null
          traffic_year?: number | null
          updated_at?: string
          utilities_output?: string | null
          utility_access?: string[] | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          water_capacity_mgd?: number | null
          water_lines?: Json | null
          wetlands_type?: string | null
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
