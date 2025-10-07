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
          ai_context: Json | null
          api_meta: Json | null
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
          congestion_level: string | null
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
          enrichment_metadata: Json | null
          enrichment_status: string
          enterprise_zone: boolean | null
          entitlement_notes: string | null
          environmental_constraints: string[] | null
          environmental_sites: Json | null
          etj_provider: string | null
          executive_summary_output: string | null
          existing_improvements: string
          fema_panel_id: string | null
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
          historical_flood_events: Json | null
          households_5mi: number | null
          id: string
          known_risks: string[] | null
          lot_size_unit: string | null
          lot_size_value: number | null
          market_output: string | null
          marketing_opt_in: boolean
          median_income: number | null
          mud_district: string | null
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
          scoring_weights: Json | null
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
          truck_percent: number | null
          updated_at: string
          user_id: string | null
          utilities_map_url: string | null
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
          ai_context?: Json | null
          api_meta?: Json | null
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
          congestion_level?: string | null
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
          enrichment_metadata?: Json | null
          enrichment_status?: string
          enterprise_zone?: boolean | null
          entitlement_notes?: string | null
          environmental_constraints?: string[] | null
          environmental_sites?: Json | null
          etj_provider?: string | null
          executive_summary_output?: string | null
          existing_improvements: string
          fema_panel_id?: string | null
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
          historical_flood_events?: Json | null
          households_5mi?: number | null
          id?: string
          known_risks?: string[] | null
          lot_size_unit?: string | null
          lot_size_value?: number | null
          market_output?: string | null
          marketing_opt_in?: boolean
          median_income?: number | null
          mud_district?: string | null
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
          scoring_weights?: Json | null
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
          truck_percent?: number | null
          updated_at?: string
          user_id?: string | null
          utilities_map_url?: string | null
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
          ai_context?: Json | null
          api_meta?: Json | null
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
          congestion_level?: string | null
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
          enrichment_metadata?: Json | null
          enrichment_status?: string
          enterprise_zone?: boolean | null
          entitlement_notes?: string | null
          environmental_constraints?: string[] | null
          environmental_sites?: Json | null
          etj_provider?: string | null
          executive_summary_output?: string | null
          existing_improvements?: string
          fema_panel_id?: string | null
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
          historical_flood_events?: Json | null
          households_5mi?: number | null
          id?: string
          known_risks?: string[] | null
          lot_size_unit?: string | null
          lot_size_value?: number | null
          market_output?: string | null
          marketing_opt_in?: boolean
          median_income?: number | null
          mud_district?: string | null
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
          scoring_weights?: Json | null
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
          truck_percent?: number | null
          updated_at?: string
          user_id?: string | null
          utilities_map_url?: string | null
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
      county_boundaries: {
        Row: {
          county_name: string
          created_at: string
          geometry: Json
          id: string
          source: string
          updated_at: string
        }
        Insert: {
          county_name: string
          created_at?: string
          geometry: Json
          id?: string
          source: string
          updated_at?: string
        }
        Update: {
          county_name?: string
          created_at?: string
          geometry?: Json
          id?: string
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      credits_usage: {
        Row: {
          application_id: string | null
          cost: number
          created_at: string
          id: string
          report_type: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          cost: number
          created_at?: string
          id?: string
          report_type: string
          user_id: string
        }
        Update: {
          application_id?: string | null
          cost?: number
          created_at?: string
          id?: string
          report_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credits_usage_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credits_usage_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_parcels"
            referencedColumns: ["application_id"]
          },
        ]
      }
      feasibility_geospatial: {
        Row: {
          application_id: string | null
          county_boundary: Json | null
          created_at: string
          fema_flood_risk: Json | null
          geospatial_score: Json | null
          id: string
          location: Json
          parcel_id: string
          traffic_exposure: Json | null
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          county_boundary?: Json | null
          created_at?: string
          fema_flood_risk?: Json | null
          geospatial_score?: Json | null
          id?: string
          location: Json
          parcel_id: string
          traffic_exposure?: Json | null
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          county_boundary?: Json | null
          created_at?: string
          fema_flood_risk?: Json | null
          geospatial_score?: Json | null
          id?: string
          location?: Json
          parcel_id?: string
          traffic_exposure?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feasibility_geospatial_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feasibility_geospatial_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_parcels"
            referencedColumns: ["application_id"]
          },
        ]
      }
      fema_flood_zones: {
        Row: {
          created_at: string
          fema_id: string
          geometry: Json
          id: string
          source: string
          updated_at: string
          zone: string | null
        }
        Insert: {
          created_at?: string
          fema_id: string
          geometry: Json
          id?: string
          source: string
          updated_at?: string
          zone?: string | null
        }
        Update: {
          created_at?: string
          fema_id?: string
          geometry?: Json
          id?: string
          source?: string
          updated_at?: string
          zone?: string | null
        }
        Relationships: []
      }
      jobs_enrichment: {
        Row: {
          application_id: string
          error_message: string | null
          finished_at: string | null
          id: number
          job_status: string | null
          provider_calls: Json | null
          started_at: string | null
        }
        Insert: {
          application_id: string
          error_message?: string | null
          finished_at?: string | null
          id?: number
          job_status?: string | null
          provider_calls?: Json | null
          started_at?: string | null
        }
        Update: {
          application_id?: string
          error_message?: string | null
          finished_at?: string | null
          id?: number
          job_status?: string | null
          provider_calls?: Json | null
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_enrichment_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_enrichment_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_parcels"
            referencedColumns: ["application_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          ai_completion_tokens: number | null
          ai_prompt_tokens: number | null
          application_id: string
          created_at: string
          error_message: string | null
          feasibility_score: number | null
          id: string
          json_data: Json | null
          pdf_url: string | null
          report_type: string
          score_band: string | null
          status: string
          updated_at: string
          user_id: string | null
          validation_status: string | null
        }
        Insert: {
          ai_completion_tokens?: number | null
          ai_prompt_tokens?: number | null
          application_id: string
          created_at?: string
          error_message?: string | null
          feasibility_score?: number | null
          id?: string
          json_data?: Json | null
          pdf_url?: string | null
          report_type: string
          score_band?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          validation_status?: string | null
        }
        Update: {
          ai_completion_tokens?: number | null
          ai_prompt_tokens?: number | null
          application_id?: string
          created_at?: string
          error_message?: string | null
          feasibility_score?: number | null
          id?: string
          json_data?: Json | null
          pdf_url?: string | null
          report_type?: string
          score_band?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_reports_application"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reports_application"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_parcels"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "reports_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_parcels"
            referencedColumns: ["application_id"]
          },
        ]
      }
      subscription_tiers: {
        Row: {
          api_access: boolean | null
          created_at: string
          description: string | null
          id: string
          name: string
          price_monthly: number
          quickchecks_unlimited: boolean | null
          reports_per_month: number | null
        }
        Insert: {
          api_access?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price_monthly: number
          quickchecks_unlimited?: boolean | null
          reports_per_month?: number | null
        }
        Update: {
          api_access?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price_monthly?: number
          quickchecks_unlimited?: boolean | null
          reports_per_month?: number | null
        }
        Relationships: []
      }
      txdot_traffic_segments: {
        Row: {
          aadt: number | null
          created_at: string
          geometry: Json
          id: string
          roadway: string | null
          segment_id: string
          source: string
          updated_at: string
          year: number | null
        }
        Insert: {
          aadt?: number | null
          created_at?: string
          geometry: Json
          id?: string
          roadway?: string | null
          segment_id: string
          source: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          aadt?: number | null
          created_at?: string
          geometry?: Json
          id?: string
          roadway?: string | null
          segment_id?: string
          source?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          id: string
          period_end: string | null
          period_start: string
          quickchecks_used: number | null
          reports_used: number | null
          status: string
          tier_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string
          quickchecks_used?: number | null
          reports_used?: number | null
          status?: string
          tier_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string
          quickchecks_used?: number | null
          reports_used?: number | null
          status?: string
          tier_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      utility_endpoints: {
        Row: {
          geometry_type: string
          id: string
          notes: string | null
          out_fields: string[] | null
          provider_name: string
          provider_type: string
          url: string
        }
        Insert: {
          geometry_type: string
          id?: string
          notes?: string | null
          out_fields?: string[] | null
          provider_name: string
          provider_type: string
          url: string
        }
        Update: {
          geometry_type?: string
          id?: string
          notes?: string | null
          out_fields?: string[] | null
          provider_name?: string
          provider_type?: string
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_parcels: {
        Row: {
          acreage_cad: number | null
          application_id: string | null
          city: string | null
          county: string | null
          created_at: string | null
          elevation: number | null
          existing_improvements: string | null
          formatted_address: string | null
          geo_lat: number | null
          geo_lng: number | null
          lot_size_unit: string | null
          lot_size_value: number | null
          neighborhood: string | null
          overlay_district: string | null
          ownership_status: string | null
          parcel_id: string | null
          property_address: Json | null
          updated_at: string | null
          zoning_code: string | null
        }
        Insert: {
          acreage_cad?: number | null
          application_id?: string | null
          city?: string | null
          county?: string | null
          created_at?: string | null
          elevation?: number | null
          existing_improvements?: string | null
          formatted_address?: string | null
          geo_lat?: number | null
          geo_lng?: number | null
          lot_size_unit?: string | null
          lot_size_value?: number | null
          neighborhood?: string | null
          overlay_district?: string | null
          ownership_status?: string | null
          parcel_id?: string | null
          property_address?: Json | null
          updated_at?: string | null
          zoning_code?: string | null
        }
        Update: {
          acreage_cad?: number | null
          application_id?: string | null
          city?: string | null
          county?: string | null
          created_at?: string | null
          elevation?: number | null
          existing_improvements?: string | null
          formatted_address?: string | null
          geo_lat?: number | null
          geo_lng?: number | null
          lot_size_unit?: string | null
          lot_size_value?: number | null
          neighborhood?: string | null
          overlay_district?: string | null
          ownership_status?: string | null
          parcel_id?: string | null
          property_address?: Json | null
          updated_at?: string | null
          zoning_code?: string | null
        }
        Relationships: []
      }
      v_reports_public: {
        Row: {
          application_id: string | null
          city: string | null
          county: string | null
          created_at: string | null
          feasibility_score: number | null
          formatted_address: string | null
          id: string | null
          json_data: Json | null
          lot_size_unit: string | null
          lot_size_value: number | null
          pdf_url: string | null
          report_type: string | null
          score_band: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          zoning_code: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_reports_application"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reports_application"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_parcels"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "reports_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_parcels"
            referencedColumns: ["application_id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_report_json_schema: {
        Args: { data: Json }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "enterprise"
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
    Enums: {
      app_role: ["admin", "user", "enterprise"],
    },
  },
} as const
