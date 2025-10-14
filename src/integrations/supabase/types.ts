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
          acct_num: string | null
          acreage_cad: number | null
          additional_notes: string | null
          administrative_area_level_1: string | null
          aerial_imagery_url: string | null
          ag_use: boolean | null
          ai_context: Json | null
          api_meta: Json | null
          attachments: Json | null
          average_permit_time_months: number | null
          base_flood_elevation: number | null
          base_flood_elevation_source: string | null
          best_time: string | null
          bldg_sqft: number | null
          bldg_style_cd: string | null
          block: string | null
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
          draft_saved_at: string | null
          drive_time_15min_population: number | null
          drive_time_30min_population: number | null
          effective_yr: number | null
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
          exemption_code: string | null
          existing_improvements: string
          fema_firm_panel: string | null
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
          homestead: boolean | null
          households_5mi: number | null
          id: string
          imprv_val: number | null
          known_risks: string[] | null
          land_use_code: string | null
          land_use_description: string | null
          land_val: number | null
          legal_dscr_1: string | null
          legal_dscr_2: string | null
          legal_dscr_3: string | null
          legal_dscr_4: string | null
          lot: string | null
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
          num_stories: number | null
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
          prop_type: string | null
          property_address: Json | null
          property_category: string | null
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
          state_class: string | null
          stories_height: string
          storm_lines: Json | null
          subdivision: string | null
          sublocality: string | null
          submarket_enriched: string | null
          submission_timestamp: string
          tax_rate_total: number | null
          taxable_value: number | null
          taxing_jurisdictions: Json | null
          tenant_requirements: string | null
          topography_map_url: string | null
          tot_appr_val: number | null
          tot_market_val: number | null
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
          user_id: string
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
          year_built: number | null
          zoning_code: string | null
          zoning_output: string | null
        }
        Insert: {
          access_priorities?: string[] | null
          acct_num?: string | null
          acreage_cad?: number | null
          additional_notes?: string | null
          administrative_area_level_1?: string | null
          aerial_imagery_url?: string | null
          ag_use?: boolean | null
          ai_context?: Json | null
          api_meta?: Json | null
          attachments?: Json | null
          average_permit_time_months?: number | null
          base_flood_elevation?: number | null
          base_flood_elevation_source?: string | null
          best_time?: string | null
          bldg_sqft?: number | null
          bldg_style_cd?: string | null
          block?: string | null
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
          draft_saved_at?: string | null
          drive_time_15min_population?: number | null
          drive_time_30min_population?: number | null
          effective_yr?: number | null
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
          exemption_code?: string | null
          existing_improvements: string
          fema_firm_panel?: string | null
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
          homestead?: boolean | null
          households_5mi?: number | null
          id?: string
          imprv_val?: number | null
          known_risks?: string[] | null
          land_use_code?: string | null
          land_use_description?: string | null
          land_val?: number | null
          legal_dscr_1?: string | null
          legal_dscr_2?: string | null
          legal_dscr_3?: string | null
          legal_dscr_4?: string | null
          lot?: string | null
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
          num_stories?: number | null
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
          prop_type?: string | null
          property_address?: Json | null
          property_category?: string | null
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
          state_class?: string | null
          stories_height: string
          storm_lines?: Json | null
          subdivision?: string | null
          sublocality?: string | null
          submarket_enriched?: string | null
          submission_timestamp?: string
          tax_rate_total?: number | null
          taxable_value?: number | null
          taxing_jurisdictions?: Json | null
          tenant_requirements?: string | null
          topography_map_url?: string | null
          tot_appr_val?: number | null
          tot_market_val?: number | null
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
          user_id: string
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
          year_built?: number | null
          zoning_code?: string | null
          zoning_output?: string | null
        }
        Update: {
          access_priorities?: string[] | null
          acct_num?: string | null
          acreage_cad?: number | null
          additional_notes?: string | null
          administrative_area_level_1?: string | null
          aerial_imagery_url?: string | null
          ag_use?: boolean | null
          ai_context?: Json | null
          api_meta?: Json | null
          attachments?: Json | null
          average_permit_time_months?: number | null
          base_flood_elevation?: number | null
          base_flood_elevation_source?: string | null
          best_time?: string | null
          bldg_sqft?: number | null
          bldg_style_cd?: string | null
          block?: string | null
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
          draft_saved_at?: string | null
          drive_time_15min_population?: number | null
          drive_time_30min_population?: number | null
          effective_yr?: number | null
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
          exemption_code?: string | null
          existing_improvements?: string
          fema_firm_panel?: string | null
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
          homestead?: boolean | null
          households_5mi?: number | null
          id?: string
          imprv_val?: number | null
          known_risks?: string[] | null
          land_use_code?: string | null
          land_use_description?: string | null
          land_val?: number | null
          legal_dscr_1?: string | null
          legal_dscr_2?: string | null
          legal_dscr_3?: string | null
          legal_dscr_4?: string | null
          lot?: string | null
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
          num_stories?: number | null
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
          prop_type?: string | null
          property_address?: Json | null
          property_category?: string | null
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
          state_class?: string | null
          stories_height?: string
          storm_lines?: Json | null
          subdivision?: string | null
          sublocality?: string | null
          submarket_enriched?: string | null
          submission_timestamp?: string
          tax_rate_total?: number | null
          taxable_value?: number | null
          taxing_jurisdictions?: Json | null
          tenant_requirements?: string | null
          topography_map_url?: string | null
          tot_appr_val?: number | null
          tot_market_val?: number | null
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
          user_id?: string
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
          year_built?: number | null
          zoning_code?: string | null
          zoning_output?: string | null
        }
        Relationships: []
      }
      cost_schedule_data: {
        Row: {
          complexity_factor: number | null
          cost_per_sqft: number
          created_at: string
          data_source: string
          effective_date: string
          id: string
          permitting_timeline_months: number
          project_type: string
          quality_level: string
          region: string
        }
        Insert: {
          complexity_factor?: number | null
          cost_per_sqft: number
          created_at?: string
          data_source: string
          effective_date: string
          id?: string
          permitting_timeline_months: number
          project_type: string
          quality_level: string
          region?: string
        }
        Update: {
          complexity_factor?: number | null
          cost_per_sqft?: number
          created_at?: string
          data_source?: string
          effective_date?: string
          id?: string
          permitting_timeline_months?: number
          project_type?: string
          quality_level?: string
          region?: string
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
      drawn_parcels: {
        Row: {
          acreage_calc: number | null
          application_id: string | null
          created_at: string
          geometry: unknown
          id: string
          name: string
          source: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acreage_calc?: number | null
          application_id?: string | null
          created_at?: string
          geometry: unknown
          id?: string
          name: string
          source?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acreage_calc?: number | null
          application_id?: string | null
          created_at?: string
          geometry?: unknown
          id?: string
          name?: string
          source?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drawn_parcels_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drawn_parcels_application_id_fkey"
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
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          flag_name: string
          id: string
          rollout_percentage: number | null
          updated_at: string
          user_whitelist: string[] | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag_name: string
          id?: string
          rollout_percentage?: number | null
          updated_at?: string
          user_whitelist?: string[] | null
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag_name?: string
          id?: string
          rollout_percentage?: number | null
          updated_at?: string
          user_whitelist?: string[] | null
        }
        Relationships: []
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
          user_id: string
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
          user_id: string
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
          user_id?: string
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
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
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
      user_onboarding: {
        Row: {
          checklist_completed: Json | null
          created_at: string | null
          first_login_at: string | null
          id: string
          onboarding_complete: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          checklist_completed?: Json | null
          created_at?: string | null
          first_login_at?: string | null
          id?: string
          onboarding_complete?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          checklist_completed?: Json | null
          created_at?: string | null
          first_login_at?: string | null
          id?: string
          onboarding_complete?: boolean | null
          updated_at?: string | null
          user_id?: string
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
      visualization_cache_3d: {
        Row: {
          application_id: string
          building_model: Json
          created_at: string
          id: string
          rendering_params: Json | null
          scenario_name: string
          thumbnail_url: string | null
        }
        Insert: {
          application_id: string
          building_model: Json
          created_at?: string
          id?: string
          rendering_params?: Json | null
          scenario_name: string
          thumbnail_url?: string | null
        }
        Update: {
          application_id?: string
          building_model?: Json
          created_at?: string
          id?: string
          rendering_params?: Json | null
          scenario_name?: string
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visualization_cache_3d_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visualization_cache_3d_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_parcels"
            referencedColumns: ["application_id"]
          },
        ]
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown | null
          f_table_catalog: unknown | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown | null
          f_table_catalog: string | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
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
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_scripts_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_bestsrid: {
        Args: { "": unknown }
        Returns: number
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_pointoutside: {
        Args: { "": unknown }
        Returns: unknown
      }
      _st_sortablehash: {
        Args: { geom: unknown }
        Returns: number
      }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      addauth: {
        Args: { "": string }
        Returns: boolean
      }
      addgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
          | {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
          | {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
        Returns: string
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      box: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box3d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3dtobox: {
        Args: { "": unknown }
        Returns: unknown
      }
      bytea: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      calculate_acreage: {
        Args: { geom: unknown }
        Returns: number
      }
      disablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      dropgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
          | { column_name: string; schema_name: string; table_name: string }
          | { column_name: string; table_name: string }
        Returns: string
      }
      dropgeometrytable: {
        Args:
          | { catalog_name: string; schema_name: string; table_name: string }
          | { schema_name: string; table_name: string }
          | { table_name: string }
        Returns: string
      }
      enablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geography: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      geography_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geography_gist_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_gist_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_send: {
        Args: { "": unknown }
        Returns: string
      }
      geography_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geography_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry: {
        Args:
          | { "": string }
          | { "": string }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
        Returns: unknown
      }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_sortsupport_2d: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_hash: {
        Args: { "": unknown }
        Returns: number
      }
      geometry_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_recv: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_send: {
        Args: { "": unknown }
        Returns: string
      }
      geometry_sortsupport: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_spgist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_3d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geometry_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometrytype: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      get_proj4_from_srid: {
        Args: { "": number }
        Returns: string
      }
      gettransactionid: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      gidx_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gidx_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      json: {
        Args: { "": unknown }
        Returns: Json
      }
      jsonb: {
        Args: { "": unknown }
        Returns: Json
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      longtransactionsenabled: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      path: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_asflatgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_geometry_clusterintersecting_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_clusterwithin_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_collect_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_makeline_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_polygonize_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      point: {
        Args: { "": unknown }
        Returns: unknown
      }
      polygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      populate_geometry_columns: {
        Args:
          | { tbl_oid: unknown; use_typmod?: boolean }
          | { use_typmod?: boolean }
        Returns: string
      }
      postgis_addbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_dropbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_extensions_upgrade: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_full_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_geos_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_geos_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_getbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_hasbbox: {
        Args: { "": unknown }
        Returns: boolean
      }
      postgis_index_supportfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_lib_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_revision: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libjson_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_liblwgeom_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libprotobuf_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libxml_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_proj_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_installed: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_released: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_svn_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_typmod_dims: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_srid: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_type: {
        Args: { "": number }
        Returns: string
      }
      postgis_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_wagyu_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      spheroid_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      spheroid_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlength: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dperimeter: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle: {
        Args:
          | { line1: unknown; line2: unknown }
          | { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
        Returns: number
      }
      st_area: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_area2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_asbinary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_asewkt: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asgeojson: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; options?: number }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
          | {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
        Returns: string
      }
      st_asgml: {
        Args:
          | { "": string }
          | {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
          | {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
          | {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_ashexewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_askml: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
          | { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
        Returns: string
      }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: {
        Args: { format?: string; geom: unknown }
        Returns: string
      }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; rel?: number }
          | { geom: unknown; maxdecimaldigits?: number; rel?: number }
        Returns: string
      }
      st_astext: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_astwkb: {
        Args:
          | {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
          | {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
        Returns: string
      }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_boundary: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer: {
        Args:
          | { geom: unknown; options?: string; radius: number }
          | { geom: unknown; quadsegs: number; radius: number }
        Returns: unknown
      }
      st_buildarea: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_centroid: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      st_cleangeometry: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_clusterintersecting: {
        Args: { "": unknown[] }
        Returns: unknown[]
      }
      st_collect: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collectionextract: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_collectionhomogenize: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_convexhull: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_coorddim: {
        Args: { geometry: unknown }
        Returns: number
      }
      st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_dimension: {
        Args: { "": unknown }
        Returns: number
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance: {
        Args:
          | { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_distancesphere: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; radius: number }
        Returns: number
      }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dump: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumppoints: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumprings: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumpsegments: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_endpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_envelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_expand: {
        Args:
          | { box: unknown; dx: number; dy: number }
          | { box: unknown; dx: number; dy: number; dz?: number }
          | { dm?: number; dx: number; dy: number; dz?: number; geom: unknown }
        Returns: unknown
      }
      st_exteriorring: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_flipcoordinates: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force3d: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_forcecollection: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcecurve: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygonccw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygoncw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcerhr: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcesfs: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_generatepoints: {
        Args:
          | { area: unknown; npoints: number }
          | { area: unknown; npoints: number; seed: number }
        Returns: unknown
      }
      st_geogfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geogfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geographyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geohash: {
        Args:
          | { geog: unknown; maxchars?: number }
          | { geom: unknown; maxchars?: number }
        Returns: string
      }
      st_geomcollfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomcollfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometrytype: {
        Args: { "": unknown }
        Returns: string
      }
      st_geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromgeojson: {
        Args: { "": Json } | { "": Json } | { "": string }
        Returns: unknown
      }
      st_geomfromgml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromkml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfrommarc21: {
        Args: { marc21xml: string }
        Returns: unknown
      }
      st_geomfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromtwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_gmltosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_hasarc: {
        Args: { geometry: unknown }
        Returns: boolean
      }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_isclosed: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_iscollection: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isempty: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygonccw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygoncw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isring: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_issimple: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvalid: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
      }
      st_isvalidreason: {
        Args: { "": unknown }
        Returns: string
      }
      st_isvalidtrajectory: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_length: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_length2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_letters: {
        Args: { font?: Json; letters: string }
        Returns: unknown
      }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefrommultipoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_linefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linemerge: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linestringfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linetocurve: {
        Args: { geometry: unknown }
        Returns: unknown
      }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_m: {
        Args: { "": unknown }
        Returns: number
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makepolygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { "": unknown } | { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_maximuminscribedcircle: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_memsize: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_minimumboundingradius: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_minimumclearance: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumclearanceline: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_mlinefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mlinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multi: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_multilinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multilinestringfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_ndims: {
        Args: { "": unknown }
        Returns: number
      }
      st_node: {
        Args: { g: unknown }
        Returns: unknown
      }
      st_normalize: {
        Args: { geom: unknown }
        Returns: unknown
      }
      st_npoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_nrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numgeometries: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorring: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpatches: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_orientedenvelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { "": unknown } | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_perimeter2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_pointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointonsurface: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_points: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonize: {
        Args: { "": unknown[] }
        Returns: unknown
      }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: string
      }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_reverse: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid: {
        Args: { geog: unknown; srid: number } | { geom: unknown; srid: number }
        Returns: unknown
      }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shiftlongitude: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid: {
        Args: { geog: unknown } | { geom: unknown }
        Returns: number
      }
      st_startpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_summary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_transform: {
        Args:
          | { from_proj: string; geom: unknown; to_proj: string }
          | { from_proj: string; geom: unknown; to_srid: number }
          | { geom: unknown; to_proj: string }
        Returns: unknown
      }
      st_triangulatepolygon: {
        Args: { g1: unknown }
        Returns: unknown
      }
      st_union: {
        Args:
          | { "": unknown[] }
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; gridsize: number }
        Returns: unknown
      }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_wkbtosql: {
        Args: { wkb: string }
        Returns: unknown
      }
      st_wkttosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      st_x: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmin: {
        Args: { "": unknown }
        Returns: number
      }
      st_y: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymax: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymin: {
        Args: { "": unknown }
        Returns: number
      }
      st_z: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmflag: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmin: {
        Args: { "": unknown }
        Returns: number
      }
      text: {
        Args: { "": unknown }
        Returns: string
      }
      unlockrows: {
        Args: { "": string }
        Returns: number
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      validate_report_json_schema: {
        Args: { data: Json }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "user" | "enterprise"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown | null
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown | null
      }
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
