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
      address_points: {
        Row: {
          address_id: number
          city: string | null
          county_id: string | null
          created_at: string | null
          full_address: string | null
          geometry: unknown
          house_number: string | null
          source: string | null
          state: string | null
          street_name: string | null
          street_post_dir: string | null
          street_prefix: string | null
          street_suffix: string | null
          unit_number: string | null
          unit_type: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address_id?: number
          city?: string | null
          county_id?: string | null
          created_at?: string | null
          full_address?: string | null
          geometry: unknown
          house_number?: string | null
          source?: string | null
          state?: string | null
          street_name?: string | null
          street_post_dir?: string | null
          street_prefix?: string | null
          street_suffix?: string | null
          unit_number?: string | null
          unit_type?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address_id?: number
          city?: string | null
          county_id?: string | null
          created_at?: string | null
          full_address?: string | null
          geometry?: unknown
          house_number?: string | null
          source?: string | null
          state?: string | null
          street_name?: string | null
          street_post_dir?: string | null
          street_prefix?: string | null
          street_suffix?: string | null
          unit_number?: string | null
          unit_type?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "address_points_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["county_id"]
          },
        ]
      }
      api_health_snapshots: {
        Row: {
          avg_duration_ms: number | null
          created_at: string | null
          error_count: number | null
          hour: string
          id: string
          p95_duration_ms: number | null
          source: string
          successful_calls: number | null
          top_errors: Json | null
          total_calls: number | null
        }
        Insert: {
          avg_duration_ms?: number | null
          created_at?: string | null
          error_count?: number | null
          hour: string
          id?: string
          p95_duration_ms?: number | null
          source: string
          successful_calls?: number | null
          top_errors?: Json | null
          total_calls?: number | null
        }
        Update: {
          avg_duration_ms?: number | null
          created_at?: string | null
          error_count?: number | null
          hour?: string
          id?: string
          p95_duration_ms?: number | null
          source?: string
          successful_calls?: number | null
          top_errors?: Json | null
          total_calls?: number | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          key_hash: string
          last_used_at: string | null
          name: string
          rate_limit_per_hour: number | null
          scopes: string[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          last_used_at?: string | null
          name: string
          rate_limit_per_hour?: number | null
          scopes?: string[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          last_used_at?: string | null
          name?: string
          rate_limit_per_hour?: number | null
          scopes?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_logs: {
        Row: {
          application_id: string | null
          cache_key: string | null
          duration_ms: number
          endpoint: string
          error_message: string | null
          expires_at: string | null
          id: string
          source: string
          success: boolean
          timestamp: string
        }
        Insert: {
          application_id?: string | null
          cache_key?: string | null
          duration_ms: number
          endpoint: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          source: string
          success: boolean
          timestamp?: string
        }
        Update: {
          application_id?: string | null
          cache_key?: string | null
          duration_ms?: number
          endpoint?: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          source?: string
          success?: boolean
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_parcels"
            referencedColumns: ["application_id"]
          },
        ]
      }
      application_overrides: {
        Row: {
          application_draft_id: string | null
          application_id: string | null
          created_at: string
          delta_percent: number | null
          field_name: string
          id: string
          new_value: string | null
          original_value: string | null
          override_reason: string | null
          parcel_id: string | null
          source_dataset: string | null
          source_layer_id: string | null
        }
        Insert: {
          application_draft_id?: string | null
          application_id?: string | null
          created_at?: string
          delta_percent?: number | null
          field_name: string
          id?: string
          new_value?: string | null
          original_value?: string | null
          override_reason?: string | null
          parcel_id?: string | null
          source_dataset?: string | null
          source_layer_id?: string | null
        }
        Update: {
          application_draft_id?: string | null
          application_id?: string | null
          created_at?: string
          delta_percent?: number | null
          field_name?: string
          id?: string
          new_value?: string | null
          original_value?: string | null
          override_reason?: string | null
          parcel_id?: string | null
          source_dataset?: string | null
          source_layer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_overrides_application_draft_id_fkey"
            columns: ["application_draft_id"]
            isOneToOne: false
            referencedRelation: "applications_draft"
            referencedColumns: ["draft_id"]
          },
          {
            foreignKeyName: "application_overrides_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_overrides_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_parcels"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "application_overrides_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["parcel_uuid"]
          },
        ]
      }
      applications: {
        Row: {
          aadt_near: number | null
          aadt_road_name: string | null
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
          attempts: number
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
          cache_expires_at: string | null
          city: string | null
          company: string
          conclusion_output: string | null
          congestion_level: string | null
          consent_contact: boolean
          consent_terms_privacy: boolean
          costs_output: string | null
          county: string | null
          coverage_flags: string[] | null
          created_at: string
          data_flags: Json | null
          dataset_version: string | null
          dataset_version_summary: Json | null
          desired_budget: number | null
          disaster_declarations: string | null
          distance_highway_ft: number | null
          distance_transit_ft: number | null
          draft_saved_at: string | null
          drive_time_15min_population: number | null
          drive_time_30min_population: number | null
          drivetimes: Json | null
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
          epa_facilities_count: number | null
          error_code: string | null
          etj_provider: string | null
          executive_summary_output: string | null
          exemption_code: string | null
          existing_improvements: string
          fema_firm_panel: string | null
          fema_panel_id: string | null
          fiber_available: boolean | null
          financial_indicators: Json | null
          floodplain_zone: string | null
          foreign_trade_zone: boolean | null
          formatted_address: string | null
          full_name: string
          geo_lat: number | null
          geo_lng: number | null
          gis_provenance: Json | null
          growth_rate_5yr: number | null
          heard_about: string
          highest_best_use_output: string | null
          historical_flood_events: Json | null
          homestead: boolean | null
          households_5mi: number | null
          id: string
          imprv_val: number | null
          intent_type: string | null
          intent_weights: Json | null
          known_risks: string[] | null
          land_use_code: string | null
          land_use_description: string | null
          land_val: number | null
          last_api_refresh: Json | null
          layer_ids: string[] | null
          legal_dscr_1: string | null
          legal_dscr_2: string | null
          legal_dscr_3: string | null
          legal_dscr_4: string | null
          lot: string | null
          lot_size_unit: string | null
          lot_size_value: number | null
          mapserver_key: string | null
          market_context: Json | null
          market_output: string | null
          marketing_opt_in: boolean
          median_income: number | null
          mud_district: string | null
          nda_confidentiality: boolean
          nearby_places: Json | null
          nearest_facility_dist: number | null
          nearest_facility_type: string | null
          nearest_highway: string | null
          nearest_transit_stop: string | null
          neighborhood: string | null
          next_run_at: string | null
          nfip_claims_count: number | null
          nfip_claims_total_paid: number | null
          num_stories: number | null
          opportunity_zone: boolean | null
          overlay_district: string | null
          override_stats: Json | null
          ownership_status: string
          page_url: string | null
          parcel_id: string | null
          parcel_owner: string | null
          parcel_source: string | null
          parcel_source_id: string | null
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
          status: string
          status_percent: number | null
          status_rev: number
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
          tile_cache_hit: boolean | null
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
          utilities_summary: Json | null
          utility_access: string[] | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          water_capacity_mgd: number | null
          water_lines: Json | null
          wcid_district: string | null
          wetlands_area_pct: number | null
          wetlands_type: string | null
          year_built: number | null
          zoning_code: string | null
          zoning_output: string | null
        }
        Insert: {
          aadt_near?: number | null
          aadt_road_name?: string | null
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
          attempts?: number
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
          cache_expires_at?: string | null
          city?: string | null
          company: string
          conclusion_output?: string | null
          congestion_level?: string | null
          consent_contact?: boolean
          consent_terms_privacy?: boolean
          costs_output?: string | null
          county?: string | null
          coverage_flags?: string[] | null
          created_at?: string
          data_flags?: Json | null
          dataset_version?: string | null
          dataset_version_summary?: Json | null
          desired_budget?: number | null
          disaster_declarations?: string | null
          distance_highway_ft?: number | null
          distance_transit_ft?: number | null
          draft_saved_at?: string | null
          drive_time_15min_population?: number | null
          drive_time_30min_population?: number | null
          drivetimes?: Json | null
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
          epa_facilities_count?: number | null
          error_code?: string | null
          etj_provider?: string | null
          executive_summary_output?: string | null
          exemption_code?: string | null
          existing_improvements: string
          fema_firm_panel?: string | null
          fema_panel_id?: string | null
          fiber_available?: boolean | null
          financial_indicators?: Json | null
          floodplain_zone?: string | null
          foreign_trade_zone?: boolean | null
          formatted_address?: string | null
          full_name: string
          geo_lat?: number | null
          geo_lng?: number | null
          gis_provenance?: Json | null
          growth_rate_5yr?: number | null
          heard_about: string
          highest_best_use_output?: string | null
          historical_flood_events?: Json | null
          homestead?: boolean | null
          households_5mi?: number | null
          id?: string
          imprv_val?: number | null
          intent_type?: string | null
          intent_weights?: Json | null
          known_risks?: string[] | null
          land_use_code?: string | null
          land_use_description?: string | null
          land_val?: number | null
          last_api_refresh?: Json | null
          layer_ids?: string[] | null
          legal_dscr_1?: string | null
          legal_dscr_2?: string | null
          legal_dscr_3?: string | null
          legal_dscr_4?: string | null
          lot?: string | null
          lot_size_unit?: string | null
          lot_size_value?: number | null
          mapserver_key?: string | null
          market_context?: Json | null
          market_output?: string | null
          marketing_opt_in?: boolean
          median_income?: number | null
          mud_district?: string | null
          nda_confidentiality?: boolean
          nearby_places?: Json | null
          nearest_facility_dist?: number | null
          nearest_facility_type?: string | null
          nearest_highway?: string | null
          nearest_transit_stop?: string | null
          neighborhood?: string | null
          next_run_at?: string | null
          nfip_claims_count?: number | null
          nfip_claims_total_paid?: number | null
          num_stories?: number | null
          opportunity_zone?: boolean | null
          overlay_district?: string | null
          override_stats?: Json | null
          ownership_status: string
          page_url?: string | null
          parcel_id?: string | null
          parcel_owner?: string | null
          parcel_source?: string | null
          parcel_source_id?: string | null
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
          status?: string
          status_percent?: number | null
          status_rev?: number
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
          tile_cache_hit?: boolean | null
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
          utilities_summary?: Json | null
          utility_access?: string[] | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          water_capacity_mgd?: number | null
          water_lines?: Json | null
          wcid_district?: string | null
          wetlands_area_pct?: number | null
          wetlands_type?: string | null
          year_built?: number | null
          zoning_code?: string | null
          zoning_output?: string | null
        }
        Update: {
          aadt_near?: number | null
          aadt_road_name?: string | null
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
          attempts?: number
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
          cache_expires_at?: string | null
          city?: string | null
          company?: string
          conclusion_output?: string | null
          congestion_level?: string | null
          consent_contact?: boolean
          consent_terms_privacy?: boolean
          costs_output?: string | null
          county?: string | null
          coverage_flags?: string[] | null
          created_at?: string
          data_flags?: Json | null
          dataset_version?: string | null
          dataset_version_summary?: Json | null
          desired_budget?: number | null
          disaster_declarations?: string | null
          distance_highway_ft?: number | null
          distance_transit_ft?: number | null
          draft_saved_at?: string | null
          drive_time_15min_population?: number | null
          drive_time_30min_population?: number | null
          drivetimes?: Json | null
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
          epa_facilities_count?: number | null
          error_code?: string | null
          etj_provider?: string | null
          executive_summary_output?: string | null
          exemption_code?: string | null
          existing_improvements?: string
          fema_firm_panel?: string | null
          fema_panel_id?: string | null
          fiber_available?: boolean | null
          financial_indicators?: Json | null
          floodplain_zone?: string | null
          foreign_trade_zone?: boolean | null
          formatted_address?: string | null
          full_name?: string
          geo_lat?: number | null
          geo_lng?: number | null
          gis_provenance?: Json | null
          growth_rate_5yr?: number | null
          heard_about?: string
          highest_best_use_output?: string | null
          historical_flood_events?: Json | null
          homestead?: boolean | null
          households_5mi?: number | null
          id?: string
          imprv_val?: number | null
          intent_type?: string | null
          intent_weights?: Json | null
          known_risks?: string[] | null
          land_use_code?: string | null
          land_use_description?: string | null
          land_val?: number | null
          last_api_refresh?: Json | null
          layer_ids?: string[] | null
          legal_dscr_1?: string | null
          legal_dscr_2?: string | null
          legal_dscr_3?: string | null
          legal_dscr_4?: string | null
          lot?: string | null
          lot_size_unit?: string | null
          lot_size_value?: number | null
          mapserver_key?: string | null
          market_context?: Json | null
          market_output?: string | null
          marketing_opt_in?: boolean
          median_income?: number | null
          mud_district?: string | null
          nda_confidentiality?: boolean
          nearby_places?: Json | null
          nearest_facility_dist?: number | null
          nearest_facility_type?: string | null
          nearest_highway?: string | null
          nearest_transit_stop?: string | null
          neighborhood?: string | null
          next_run_at?: string | null
          nfip_claims_count?: number | null
          nfip_claims_total_paid?: number | null
          num_stories?: number | null
          opportunity_zone?: boolean | null
          overlay_district?: string | null
          override_stats?: Json | null
          ownership_status?: string
          page_url?: string | null
          parcel_id?: string | null
          parcel_owner?: string | null
          parcel_source?: string | null
          parcel_source_id?: string | null
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
          status?: string
          status_percent?: number | null
          status_rev?: number
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
          tile_cache_hit?: boolean | null
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
          utilities_summary?: Json | null
          utility_access?: string[] | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          water_capacity_mgd?: number | null
          water_lines?: Json | null
          wcid_district?: string | null
          wetlands_area_pct?: number | null
          wetlands_type?: string | null
          year_built?: number | null
          zoning_code?: string | null
          zoning_output?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_parcel_source_id_fkey"
            columns: ["parcel_source_id"]
            isOneToOne: false
            referencedRelation: "parcel_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      applications_draft: {
        Row: {
          application_id: string | null
          completed_steps: number[] | null
          contact_info: Json | null
          coverage_flags: string[] | null
          created_at: string
          current_step: number
          derived_max_far: number | null
          derived_max_height: number | null
          draft_id: string
          drawn_parcel_id: string | null
          final_questions: Json | null
          form_data: Json | null
          gis_provenance: Json | null
          initial_feasibility_score: number | null
          intent_type: Database["public"]["Enums"]["intent_type"] | null
          last_saved_at: string
          market_risks: Json | null
          parcel_id: string | null
          parcel_source_id: string | null
          profile_id: string | null
          project_intent: Json | null
          property_info: Json | null
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          completed_steps?: number[] | null
          contact_info?: Json | null
          coverage_flags?: string[] | null
          created_at?: string
          current_step?: number
          derived_max_far?: number | null
          derived_max_height?: number | null
          draft_id?: string
          drawn_parcel_id?: string | null
          final_questions?: Json | null
          form_data?: Json | null
          gis_provenance?: Json | null
          initial_feasibility_score?: number | null
          intent_type?: Database["public"]["Enums"]["intent_type"] | null
          last_saved_at?: string
          market_risks?: Json | null
          parcel_id?: string | null
          parcel_source_id?: string | null
          profile_id?: string | null
          project_intent?: Json | null
          property_info?: Json | null
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string | null
          completed_steps?: number[] | null
          contact_info?: Json | null
          coverage_flags?: string[] | null
          created_at?: string
          current_step?: number
          derived_max_far?: number | null
          derived_max_height?: number | null
          draft_id?: string
          drawn_parcel_id?: string | null
          final_questions?: Json | null
          form_data?: Json | null
          gis_provenance?: Json | null
          initial_feasibility_score?: number | null
          intent_type?: Database["public"]["Enums"]["intent_type"] | null
          last_saved_at?: string
          market_risks?: Json | null
          parcel_id?: string | null
          parcel_source_id?: string | null
          profile_id?: string | null
          project_intent?: Json | null
          property_info?: Json | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_draft_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_draft_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_parcels"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "applications_draft_drawn_parcel_id_fkey"
            columns: ["drawn_parcel_id"]
            isOneToOne: false
            referencedRelation: "drawn_parcels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_draft_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["parcel_uuid"]
          },
          {
            foreignKeyName: "applications_draft_parcel_source_id_fkey"
            columns: ["parcel_source_id"]
            isOneToOne: false
            referencedRelation: "parcel_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_draft_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_signups: {
        Row: {
          company: string | null
          email: string
          full_name: string | null
          id: string
          interests: string[]
          invite_sent: boolean | null
          invite_sent_at: string | null
          role: string
          source: string | null
          submitted_at: string | null
          use_case: string | null
        }
        Insert: {
          company?: string | null
          email: string
          full_name?: string | null
          id?: string
          interests?: string[]
          invite_sent?: boolean | null
          invite_sent_at?: string | null
          role: string
          source?: string | null
          submitted_at?: string | null
          use_case?: string | null
        }
        Update: {
          company?: string | null
          email?: string
          full_name?: string | null
          id?: string
          interests?: string[]
          invite_sent?: boolean | null
          invite_sent_at?: string | null
          role?: string
          source?: string | null
          submitted_at?: string | null
          use_case?: string | null
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
      counties: {
        Row: {
          cad_name: string
          county_id: string
          created_at: string | null
          data_source_type: string | null
          data_source_url: string | null
          display_name: string
          field_mappings: Json | null
          fips_code: string | null
          is_active: boolean | null
          last_sync_at: string | null
          max_record_count: number | null
          native_srid: number | null
          projection_srid: number | null
          state_code: string
          update_frequency: string | null
          updated_at: string | null
        }
        Insert: {
          cad_name: string
          county_id: string
          created_at?: string | null
          data_source_type?: string | null
          data_source_url?: string | null
          display_name: string
          field_mappings?: Json | null
          fips_code?: string | null
          is_active?: boolean | null
          last_sync_at?: string | null
          max_record_count?: number | null
          native_srid?: number | null
          projection_srid?: number | null
          state_code?: string
          update_frequency?: string | null
          updated_at?: string | null
        }
        Update: {
          cad_name?: string
          county_id?: string
          created_at?: string | null
          data_source_type?: string | null
          data_source_url?: string | null
          display_name?: string
          field_mappings?: Json | null
          fips_code?: string | null
          is_active?: boolean | null
          last_sync_at?: string | null
          max_record_count?: number | null
          native_srid?: number | null
          projection_srid?: number | null
          state_code?: string
          update_frequency?: string | null
          updated_at?: string | null
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
      cron_job_history: {
        Row: {
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          finished_at: string | null
          id: string
          job_name: string
          metadata: Json | null
          records_processed: number | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          finished_at?: string | null
          id?: string
          job_name: string
          metadata?: Json | null
          records_processed?: number | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          finished_at?: string | null
          id?: string
          job_name?: string
          metadata?: Json | null
          records_processed?: number | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      cross_street_index: {
        Row: {
          city: string | null
          county_id: string | null
          created_at: string | null
          geometry: unknown
          id: number
          intersection_type: string | null
          source: string | null
          street1_name: string
          street2_name: string
        }
        Insert: {
          city?: string | null
          county_id?: string | null
          created_at?: string | null
          geometry: unknown
          id?: number
          intersection_type?: string | null
          source?: string | null
          street1_name: string
          street2_name: string
        }
        Update: {
          city?: string | null
          county_id?: string | null
          created_at?: string | null
          geometry?: unknown
          id?: number
          intersection_type?: string | null
          source?: string | null
          street1_name?: string
          street2_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cross_street_index_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["county_id"]
          },
        ]
      }
      datasets: {
        Row: {
          created_at: string
          dataset_key: string
          dataset_type: Database["public"]["Enums"]["dataset_type"]
          dataset_version: string
          effective_from: string
          effective_to: string | null
          id: string
          jurisdiction: string
          layer_name: string
          mapserver_id: string | null
          metadata: Json | null
          record_count: number | null
          status: Database["public"]["Enums"]["dataset_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          dataset_key: string
          dataset_type: Database["public"]["Enums"]["dataset_type"]
          dataset_version: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          jurisdiction: string
          layer_name: string
          mapserver_id?: string | null
          metadata?: Json | null
          record_count?: number | null
          status?: Database["public"]["Enums"]["dataset_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          dataset_key?: string
          dataset_type?: Database["public"]["Enums"]["dataset_type"]
          dataset_version?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          jurisdiction?: string
          layer_name?: string
          mapserver_id?: string | null
          metadata?: Json | null
          record_count?: number | null
          status?: Database["public"]["Enums"]["dataset_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "datasets_mapserver_id_fkey"
            columns: ["mapserver_id"]
            isOneToOne: false
            referencedRelation: "map_servers"
            referencedColumns: ["id"]
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
      error_registry: {
        Row: {
          code: string
          created_at: string
          http_status: number | null
          human_message: string
          source: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          http_status?: number | null
          human_message: string
          source: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          http_status?: number | null
          human_message?: string
          source?: string
          updated_at?: string
        }
        Relationships: []
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
      fema_flood_canonical: {
        Row: {
          bfe: number | null
          bfe_unit: string | null
          coastal_flag: boolean | null
          county: string | null
          created_at: string | null
          dataset_version: string
          effective_date: string | null
          etl_job_id: string | null
          flood_zone: string
          flood_zone_subtype: string | null
          floodway_flag: boolean | null
          geom: unknown
          id: number
          jurisdiction: string | null
          mapserver_id: string | null
          panel_id: string | null
          source_dataset: string | null
          source_layer_id: string | null
          state: string | null
          static_bfe: number | null
          updated_at: string | null
        }
        Insert: {
          bfe?: number | null
          bfe_unit?: string | null
          coastal_flag?: boolean | null
          county?: string | null
          created_at?: string | null
          dataset_version: string
          effective_date?: string | null
          etl_job_id?: string | null
          flood_zone: string
          flood_zone_subtype?: string | null
          floodway_flag?: boolean | null
          geom: unknown
          id?: number
          jurisdiction?: string | null
          mapserver_id?: string | null
          panel_id?: string | null
          source_dataset?: string | null
          source_layer_id?: string | null
          state?: string | null
          static_bfe?: number | null
          updated_at?: string | null
        }
        Update: {
          bfe?: number | null
          bfe_unit?: string | null
          coastal_flag?: boolean | null
          county?: string | null
          created_at?: string | null
          dataset_version?: string
          effective_date?: string | null
          etl_job_id?: string | null
          flood_zone?: string
          flood_zone_subtype?: string | null
          floodway_flag?: boolean | null
          geom?: unknown
          id?: number
          jurisdiction?: string | null
          mapserver_id?: string | null
          panel_id?: string | null
          source_dataset?: string | null
          source_layer_id?: string | null
          state?: string | null
          static_bfe?: number | null
          updated_at?: string | null
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
      geocoder_cache: {
        Row: {
          confidence: number | null
          county_id: string | null
          created_at: string | null
          expires_at: string | null
          geometry: unknown
          input_hash: string
          input_query: string
          parcel_uuid: string | null
          query_type: string
          result_data: Json | null
          source: string
        }
        Insert: {
          confidence?: number | null
          county_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          geometry?: unknown
          input_hash: string
          input_query: string
          parcel_uuid?: string | null
          query_type: string
          result_data?: Json | null
          source: string
        }
        Update: {
          confidence?: number | null
          county_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          geometry?: unknown
          input_hash?: string
          input_query?: string
          parcel_uuid?: string | null
          query_type?: string
          result_data?: Json | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "geocoder_cache_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["county_id"]
          },
          {
            foreignKeyName: "geocoder_cache_parcel_uuid_fkey"
            columns: ["parcel_uuid"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["parcel_uuid"]
          },
        ]
      }
      gis_coverage_events: {
        Row: {
          application_draft_id: string | null
          application_id: string | null
          created_at: string
          event_type: string
          id: string
          jurisdiction: string
          location: unknown
          location_context: Json | null
          metadata: Json | null
          missing_layer_type: string | null
          priority: number | null
          requested_canonical_type: string | null
          resolution_notes: string | null
          resolution_status: string | null
          resolved_at: string | null
          resolved_by: string | null
          user_id: string | null
        }
        Insert: {
          application_draft_id?: string | null
          application_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          jurisdiction: string
          location?: unknown
          location_context?: Json | null
          metadata?: Json | null
          missing_layer_type?: string | null
          priority?: number | null
          requested_canonical_type?: string | null
          resolution_notes?: string | null
          resolution_status?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          user_id?: string | null
        }
        Update: {
          application_draft_id?: string | null
          application_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          jurisdiction?: string
          location?: unknown
          location_context?: Json | null
          metadata?: Json | null
          missing_layer_type?: string | null
          priority?: number | null
          requested_canonical_type?: string | null
          resolution_notes?: string | null
          resolution_status?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gis_coverage_events_application_draft_id_fkey"
            columns: ["application_draft_id"]
            isOneToOne: false
            referencedRelation: "applications_draft"
            referencedColumns: ["draft_id"]
          },
          {
            foreignKeyName: "gis_coverage_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gis_coverage_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_parcels"
            referencedColumns: ["application_id"]
          },
        ]
      }
      gis_fetch_logs: {
        Row: {
          bytes_processed: number | null
          created_at: string | null
          duration_ms: number | null
          error_details: Json | null
          error_message: string | null
          http_status: number | null
          id: string
          layer_id: string | null
          layer_version_id: string | null
          metadata: Json | null
          operation: string
          records_processed: number | null
          retry_count: number | null
          status: string
        }
        Insert: {
          bytes_processed?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          http_status?: number | null
          id?: string
          layer_id?: string | null
          layer_version_id?: string | null
          metadata?: Json | null
          operation: string
          records_processed?: number | null
          retry_count?: number | null
          status: string
        }
        Update: {
          bytes_processed?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          http_status?: number | null
          id?: string
          layer_id?: string | null
          layer_version_id?: string | null
          metadata?: Json | null
          operation?: string
          records_processed?: number | null
          retry_count?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "gis_fetch_logs_layer_id_fkey"
            columns: ["layer_id"]
            isOneToOne: false
            referencedRelation: "gis_layers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gis_fetch_logs_layer_version_id_fkey"
            columns: ["layer_version_id"]
            isOneToOne: false
            referencedRelation: "gis_layer_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      gis_layer_versions: {
        Row: {
          area_key: string | null
          bbox: Json | null
          checksum_sha256: string | null
          created_at: string | null
          etag: string | null
          expires_at: string | null
          fetched_at: string | null
          geojson: Json | null
          id: string
          is_active: boolean | null
          layer_id: string
          record_count: number | null
          size_bytes: number | null
          storage_path: string | null
          transform_status: string | null
          transformed_at: string | null
          version_tag: string | null
        }
        Insert: {
          area_key?: string | null
          bbox?: Json | null
          checksum_sha256?: string | null
          created_at?: string | null
          etag?: string | null
          expires_at?: string | null
          fetched_at?: string | null
          geojson?: Json | null
          id?: string
          is_active?: boolean | null
          layer_id: string
          record_count?: number | null
          size_bytes?: number | null
          storage_path?: string | null
          transform_status?: string | null
          transformed_at?: string | null
          version_tag?: string | null
        }
        Update: {
          area_key?: string | null
          bbox?: Json | null
          checksum_sha256?: string | null
          created_at?: string | null
          etag?: string | null
          expires_at?: string | null
          fetched_at?: string | null
          geojson?: Json | null
          id?: string
          is_active?: boolean | null
          layer_id?: string
          record_count?: number | null
          size_bytes?: number | null
          storage_path?: string | null
          transform_status?: string | null
          transformed_at?: string | null
          version_tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gis_layer_versions_layer_id_fkey"
            columns: ["layer_id"]
            isOneToOne: false
            referencedRelation: "gis_layers"
            referencedColumns: ["id"]
          },
        ]
      }
      gis_layers: {
        Row: {
          category: string
          created_at: string | null
          display_name: string
          field_mappings: Json | null
          geometry_type: string | null
          id: string
          layer_key: string
          license: string | null
          map_server_id: string | null
          native_srid: number | null
          provider: string
          source_url: string
          status: string | null
          update_policy: Json
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          display_name: string
          field_mappings?: Json | null
          geometry_type?: string | null
          id?: string
          layer_key: string
          license?: string | null
          map_server_id?: string | null
          native_srid?: number | null
          provider: string
          source_url: string
          status?: string | null
          update_policy?: Json
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          display_name?: string
          field_mappings?: Json | null
          geometry_type?: string | null
          id?: string
          layer_key?: string
          license?: string | null
          map_server_id?: string | null
          native_srid?: number | null
          provider?: string
          source_url?: string
          status?: string | null
          update_policy?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gis_layers_map_server_id_fkey"
            columns: ["map_server_id"]
            isOneToOne: false
            referencedRelation: "map_servers"
            referencedColumns: ["id"]
          },
        ]
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
      kill_factors: {
        Row: {
          category: string
          code: string
          created_at: string | null
          description: string
          severity: string | null
          threshold: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          description: string
          severity?: string | null
          threshold?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          description?: string
          severity?: string | null
          threshold?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      map_server_layers: {
        Row: {
          canonical_type: string
          coverage_geometry: unknown
          created_at: string
          dataset_version: string | null
          description: string | null
          display_field: string | null
          field_mappings: Json
          geometry_type: string | null
          id: string
          is_active: boolean | null
          last_data_update: string | null
          layer_id: number
          layer_key: string
          layer_name: string
          layer_type: string
          map_server_id: string
          max_scale: number | null
          metadata: Json | null
          min_scale: number | null
          priority: number | null
          query_fields: string[] | null
          record_count: number | null
          supports_query: boolean | null
          supports_statistics: boolean | null
          updated_at: string
        }
        Insert: {
          canonical_type: string
          coverage_geometry?: unknown
          created_at?: string
          dataset_version?: string | null
          description?: string | null
          display_field?: string | null
          field_mappings?: Json
          geometry_type?: string | null
          id?: string
          is_active?: boolean | null
          last_data_update?: string | null
          layer_id: number
          layer_key: string
          layer_name: string
          layer_type?: string
          map_server_id: string
          max_scale?: number | null
          metadata?: Json | null
          min_scale?: number | null
          priority?: number | null
          query_fields?: string[] | null
          record_count?: number | null
          supports_query?: boolean | null
          supports_statistics?: boolean | null
          updated_at?: string
        }
        Update: {
          canonical_type?: string
          coverage_geometry?: unknown
          created_at?: string
          dataset_version?: string | null
          description?: string | null
          display_field?: string | null
          field_mappings?: Json
          geometry_type?: string | null
          id?: string
          is_active?: boolean | null
          last_data_update?: string | null
          layer_id?: number
          layer_key?: string
          layer_name?: string
          layer_type?: string
          map_server_id?: string
          max_scale?: number | null
          metadata?: Json | null
          min_scale?: number | null
          priority?: number | null
          query_fields?: string[] | null
          record_count?: number | null
          supports_query?: boolean | null
          supports_statistics?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_server_layers_map_server_id_fkey"
            columns: ["map_server_id"]
            isOneToOne: false
            referencedRelation: "map_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      map_servers: {
        Row: {
          auth_config: Json | null
          auth_required: boolean | null
          base_url: string
          created_at: string
          health_status: string | null
          id: string
          is_active: boolean | null
          jurisdiction: string
          last_health_check: string | null
          last_sync_at: string | null
          max_record_count: number | null
          metadata: Json | null
          priority: number | null
          provider: string
          server_key: string
          service_type: string
          spatial_reference: number | null
          supports_geojson: boolean | null
          supports_pagination: boolean | null
          sync_frequency_hours: number | null
          updated_at: string
          version: string | null
        }
        Insert: {
          auth_config?: Json | null
          auth_required?: boolean | null
          base_url: string
          created_at?: string
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction: string
          last_health_check?: string | null
          last_sync_at?: string | null
          max_record_count?: number | null
          metadata?: Json | null
          priority?: number | null
          provider: string
          server_key: string
          service_type?: string
          spatial_reference?: number | null
          supports_geojson?: boolean | null
          supports_pagination?: boolean | null
          sync_frequency_hours?: number | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          auth_config?: Json | null
          auth_required?: boolean | null
          base_url?: string
          created_at?: string
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          jurisdiction?: string
          last_health_check?: string | null
          last_sync_at?: string | null
          max_record_count?: number | null
          metadata?: Json | null
          priority?: number | null
          provider?: string
          server_key?: string
          service_type?: string
          spatial_reference?: number | null
          supports_geojson?: boolean | null
          supports_pagination?: boolean | null
          sync_frequency_hours?: number | null
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      parcel_index: {
        Row: {
          county_id: string
          created_at: string | null
          id: number
          id_type: string
          identifier: string
          identifier_normalized: string
          parcel_uuid: string
        }
        Insert: {
          county_id: string
          created_at?: string | null
          id?: number
          id_type: string
          identifier: string
          identifier_normalized: string
          parcel_uuid: string
        }
        Update: {
          county_id?: string
          created_at?: string | null
          id?: number
          id_type?: string
          identifier?: string
          identifier_normalized?: string
          parcel_uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "parcel_index_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["county_id"]
          },
          {
            foreignKeyName: "parcel_index_parcel_uuid_fkey"
            columns: ["parcel_uuid"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["parcel_uuid"]
          },
        ]
      }
      parcel_sources: {
        Row: {
          confidence_score: number | null
          coverage_flags: string[] | null
          created_at: string
          dataset_id: string | null
          geometry_source: string | null
          id: string
          parcel_id: string | null
          source_type: Database["public"]["Enums"]["parcel_source_type"]
        }
        Insert: {
          confidence_score?: number | null
          coverage_flags?: string[] | null
          created_at?: string
          dataset_id?: string | null
          geometry_source?: string | null
          id?: string
          parcel_id?: string | null
          source_type?: Database["public"]["Enums"]["parcel_source_type"]
        }
        Update: {
          confidence_score?: number | null
          coverage_flags?: string[] | null
          created_at?: string
          dataset_id?: string | null
          geometry_source?: string | null
          id?: string
          parcel_id?: string | null
          source_type?: Database["public"]["Enums"]["parcel_source_type"]
        }
        Relationships: [
          {
            foreignKeyName: "parcel_sources_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcel_sources_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["parcel_uuid"]
          },
        ]
      }
      parcels: {
        Row: {
          acreage: number | null
          assessed_value: number | null
          bcad_prop_id: string | null
          block: string | null
          centroid: unknown
          county_id: string
          created_at: string | null
          dcad_acct: string | null
          fbcad_acct: string | null
          geometry: unknown
          hcad_num: string | null
          improvement_value: number | null
          land_use_code: string | null
          land_use_description: string | null
          land_value: number | null
          legal_description: string | null
          lot: string | null
          mcad_parcel_id: string | null
          owner_address: string | null
          owner_name: string | null
          parcel_uuid: string
          situs_address: string | null
          situs_city: string | null
          situs_zip: string | null
          source_updated_at: string | null
          sqft: number | null
          subdivision: string | null
          tad_account: string | null
          tcad_prop_id: string | null
          total_value: number | null
          updated_at: string | null
          wcad_parcel_id: string | null
          year_built: number | null
          zoning_code: string | null
        }
        Insert: {
          acreage?: number | null
          assessed_value?: number | null
          bcad_prop_id?: string | null
          block?: string | null
          centroid?: unknown
          county_id: string
          created_at?: string | null
          dcad_acct?: string | null
          fbcad_acct?: string | null
          geometry: unknown
          hcad_num?: string | null
          improvement_value?: number | null
          land_use_code?: string | null
          land_use_description?: string | null
          land_value?: number | null
          legal_description?: string | null
          lot?: string | null
          mcad_parcel_id?: string | null
          owner_address?: string | null
          owner_name?: string | null
          parcel_uuid?: string
          situs_address?: string | null
          situs_city?: string | null
          situs_zip?: string | null
          source_updated_at?: string | null
          sqft?: number | null
          subdivision?: string | null
          tad_account?: string | null
          tcad_prop_id?: string | null
          total_value?: number | null
          updated_at?: string | null
          wcad_parcel_id?: string | null
          year_built?: number | null
          zoning_code?: string | null
        }
        Update: {
          acreage?: number | null
          assessed_value?: number | null
          bcad_prop_id?: string | null
          block?: string | null
          centroid?: unknown
          county_id?: string
          created_at?: string | null
          dcad_acct?: string | null
          fbcad_acct?: string | null
          geometry?: unknown
          hcad_num?: string | null
          improvement_value?: number | null
          land_use_code?: string | null
          land_use_description?: string | null
          land_value?: number | null
          legal_description?: string | null
          lot?: string | null
          mcad_parcel_id?: string | null
          owner_address?: string | null
          owner_name?: string | null
          parcel_uuid?: string
          situs_address?: string | null
          situs_city?: string | null
          situs_zip?: string | null
          source_updated_at?: string | null
          sqft?: number | null
          subdivision?: string | null
          tad_account?: string | null
          tcad_prop_id?: string | null
          total_value?: number | null
          updated_at?: string | null
          wcad_parcel_id?: string | null
          year_built?: number | null
          zoning_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parcels_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["county_id"]
          },
        ]
      }
      parcels_canonical: {
        Row: {
          apn: string | null
          centroid: unknown
          city: string | null
          county: string | null
          created_at: string | null
          dataset_version: string
          etl_job_id: string | null
          geom: unknown
          id: number
          improvement_value: number | null
          jurisdiction: string
          land_use_code: string | null
          land_value: number | null
          lot_size_acres: number | null
          lot_size_sqft: number | null
          mapserver_id: string | null
          owner_address: string | null
          owner_name: string | null
          parcel_id: string
          situs_address: string | null
          source_dataset: string | null
          source_layer_id: string | null
          state: string | null
          total_value: number | null
          updated_at: string | null
          zip: string | null
          zoning_code: string | null
        }
        Insert: {
          apn?: string | null
          centroid?: unknown
          city?: string | null
          county?: string | null
          created_at?: string | null
          dataset_version: string
          etl_job_id?: string | null
          geom: unknown
          id?: number
          improvement_value?: number | null
          jurisdiction: string
          land_use_code?: string | null
          land_value?: number | null
          lot_size_acres?: number | null
          lot_size_sqft?: number | null
          mapserver_id?: string | null
          owner_address?: string | null
          owner_name?: string | null
          parcel_id: string
          situs_address?: string | null
          source_dataset?: string | null
          source_layer_id?: string | null
          state?: string | null
          total_value?: number | null
          updated_at?: string | null
          zip?: string | null
          zoning_code?: string | null
        }
        Update: {
          apn?: string | null
          centroid?: unknown
          city?: string | null
          county?: string | null
          created_at?: string | null
          dataset_version?: string
          etl_job_id?: string | null
          geom?: unknown
          id?: number
          improvement_value?: number | null
          jurisdiction?: string
          land_use_code?: string | null
          land_value?: number | null
          lot_size_acres?: number | null
          lot_size_sqft?: number | null
          mapserver_id?: string | null
          owner_address?: string | null
          owner_name?: string | null
          parcel_id?: string
          situs_address?: string | null
          source_dataset?: string | null
          source_layer_id?: string | null
          state?: string | null
          total_value?: number | null
          updated_at?: string | null
          zip?: string | null
          zoning_code?: string | null
        }
        Relationships: []
      }
      payment_history: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          payment_type: string
          product_name: string | null
          receipt_url: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          payment_type: string
          product_name?: string | null
          receipt_url?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          payment_type?: string
          product_name?: string | null
          receipt_url?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pipeline_phase_metrics: {
        Row: {
          application_id: string | null
          completed_at: string | null
          created_at: string | null
          data_sources: Json | null
          duration_ms: number | null
          error_message: string | null
          id: string
          metadata: Json | null
          phase: string
          started_at: string
          success: boolean | null
        }
        Insert: {
          application_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          data_sources?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          phase: string
          started_at?: string
          success?: boolean | null
        }
        Update: {
          application_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          data_sources?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          phase?: string
          started_at?: string
          success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_phase_metrics_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_phase_metrics_application_id_fkey"
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
          stripe_customer_id: string | null
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
          stripe_customer_id?: string | null
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
          stripe_customer_id?: string | null
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
          report_assets: Json | null
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
          report_assets?: Json | null
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
          report_assets?: Json | null
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
      risk_profiles: {
        Row: {
          application_id: string | null
          created_at: string
          dataset_versions_used: Json | null
          id: string
          kill_factors_triggered: string[] | null
          overall_risk_score: number | null
          parcel_id: string | null
          risk_annotations: Json | null
          risk_category: string | null
          source: Database["public"]["Enums"]["risk_source"]
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          dataset_versions_used?: Json | null
          id?: string
          kill_factors_triggered?: string[] | null
          overall_risk_score?: number | null
          parcel_id?: string | null
          risk_annotations?: Json | null
          risk_category?: string | null
          source?: Database["public"]["Enums"]["risk_source"]
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          dataset_versions_used?: Json | null
          id?: string
          kill_factors_triggered?: string[] | null
          overall_risk_score?: number | null
          parcel_id?: string | null
          risk_annotations?: Json | null
          risk_category?: string | null
          source?: Database["public"]["Enums"]["risk_source"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_profiles_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_profiles_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_parcels"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "risk_profiles_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["parcel_uuid"]
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
          stripe_price_id: string | null
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
          stripe_price_id?: string | null
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
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          resolved_at: string | null
          severity: string | null
          source: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string | null
          source?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string | null
          source?: string | null
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          dimensions: Json | null
          id: string
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          recorded_at: string | null
        }
        Insert: {
          dimensions?: Json | null
          id?: string
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          recorded_at?: string | null
        }
        Update: {
          dimensions?: Json | null
          id?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          recorded_at?: string | null
        }
        Relationships: []
      }
      tile_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_details: Json | null
          error_message: string | null
          fetch_bbox: Json | null
          fetch_completed_at: string | null
          fetch_where: string | null
          id: string
          input_records: number | null
          job_type: Database["public"]["Enums"]["tile_job_type"]
          max_retries: number | null
          mbtiles_path: string | null
          normalize_completed_at: string | null
          normalized_file_path: string | null
          output_tiles: number | null
          raw_file_path: string | null
          retry_count: number | null
          s3_prefix: string | null
          source_layer_ids: string[] | null
          source_map_server_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["tile_job_status"]
          tile_completed_at: string | null
          tileset_key: string
          tippecanoe_options: Json | null
          trigger_type: string | null
          triggered_by: string | null
          updated_at: string
          upload_completed_at: string | null
          worker_id: string | null
          worker_type: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          fetch_bbox?: Json | null
          fetch_completed_at?: string | null
          fetch_where?: string | null
          id?: string
          input_records?: number | null
          job_type?: Database["public"]["Enums"]["tile_job_type"]
          max_retries?: number | null
          mbtiles_path?: string | null
          normalize_completed_at?: string | null
          normalized_file_path?: string | null
          output_tiles?: number | null
          raw_file_path?: string | null
          retry_count?: number | null
          s3_prefix?: string | null
          source_layer_ids?: string[] | null
          source_map_server_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["tile_job_status"]
          tile_completed_at?: string | null
          tileset_key: string
          tippecanoe_options?: Json | null
          trigger_type?: string | null
          triggered_by?: string | null
          updated_at?: string
          upload_completed_at?: string | null
          worker_id?: string | null
          worker_type?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          fetch_bbox?: Json | null
          fetch_completed_at?: string | null
          fetch_where?: string | null
          id?: string
          input_records?: number | null
          job_type?: Database["public"]["Enums"]["tile_job_type"]
          max_retries?: number | null
          mbtiles_path?: string | null
          normalize_completed_at?: string | null
          normalized_file_path?: string | null
          output_tiles?: number | null
          raw_file_path?: string | null
          retry_count?: number | null
          s3_prefix?: string | null
          source_layer_ids?: string[] | null
          source_map_server_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["tile_job_status"]
          tile_completed_at?: string | null
          tileset_key?: string
          tippecanoe_options?: Json | null
          trigger_type?: string | null
          triggered_by?: string | null
          updated_at?: string
          upload_completed_at?: string | null
          worker_id?: string | null
          worker_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tile_jobs_source_map_server_id_fkey"
            columns: ["source_map_server_id"]
            isOneToOne: false
            referencedRelation: "map_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      tilesets: {
        Row: {
          attribution: string | null
          bounds: Json | null
          category: Database["public"]["Enums"]["tileset_category"]
          center: Json | null
          created_at: string
          description: string | null
          expires_at: string | null
          generated_at: string | null
          id: string
          is_active: boolean
          jurisdiction: string
          max_zoom: number
          min_zoom: number
          name: string
          record_count: number | null
          refresh_frequency_hours: number | null
          size_bytes: number | null
          source_layer_ids: string[] | null
          source_map_server_id: string | null
          source_version: string | null
          tile_count: number | null
          tile_url_template: string
          tileset_key: string
          tippecanoe_options: Json | null
          updated_at: string
          vector_layers: Json | null
        }
        Insert: {
          attribution?: string | null
          bounds?: Json | null
          category?: Database["public"]["Enums"]["tileset_category"]
          center?: Json | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          is_active?: boolean
          jurisdiction: string
          max_zoom?: number
          min_zoom?: number
          name: string
          record_count?: number | null
          refresh_frequency_hours?: number | null
          size_bytes?: number | null
          source_layer_ids?: string[] | null
          source_map_server_id?: string | null
          source_version?: string | null
          tile_count?: number | null
          tile_url_template: string
          tileset_key: string
          tippecanoe_options?: Json | null
          updated_at?: string
          vector_layers?: Json | null
        }
        Update: {
          attribution?: string | null
          bounds?: Json | null
          category?: Database["public"]["Enums"]["tileset_category"]
          center?: Json | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          is_active?: boolean
          jurisdiction?: string
          max_zoom?: number
          min_zoom?: number
          name?: string
          record_count?: number | null
          refresh_frequency_hours?: number | null
          size_bytes?: number | null
          source_layer_ids?: string[] | null
          source_map_server_id?: string | null
          source_version?: string | null
          tile_count?: number | null
          tile_url_template?: string
          tileset_key?: string
          tippecanoe_options?: Json | null
          updated_at?: string
          vector_layers?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tilesets_source_map_server_id_fkey"
            columns: ["source_map_server_id"]
            isOneToOne: false
            referencedRelation: "map_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      transform_configs: {
        Row: {
          config: Json
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: string
          last_run_at: string | null
          last_run_status: string | null
          layer_key: string
          priority: number | null
          target_table: string
          transform_id: string
          updated_at: string | null
          validation_rules: Json | null
          version: string | null
        }
        Insert: {
          config: Json
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          last_run_at?: string | null
          last_run_status?: string | null
          layer_key: string
          priority?: number | null
          target_table: string
          transform_id: string
          updated_at?: string | null
          validation_rules?: Json | null
          version?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          last_run_at?: string | null
          last_run_status?: string | null
          layer_key?: string
          priority?: number | null
          target_table?: string
          transform_id?: string
          updated_at?: string | null
          validation_rules?: Json | null
          version?: string | null
        }
        Relationships: []
      }
      transportation_canonical: {
        Row: {
          aadt: number | null
          aadt_year: number | null
          county: string | null
          created_at: string | null
          dataset_version: string
          etl_job_id: string | null
          geom: unknown
          id: number
          jurisdiction: string | null
          lanes: number | null
          mapserver_id: string | null
          road_class: string | null
          road_name: string | null
          route_number: string | null
          source_dataset: string | null
          source_layer_id: string | null
          speed_limit: number | null
          surface_type: string | null
          truck_percent: number | null
          updated_at: string | null
        }
        Insert: {
          aadt?: number | null
          aadt_year?: number | null
          county?: string | null
          created_at?: string | null
          dataset_version: string
          etl_job_id?: string | null
          geom: unknown
          id?: number
          jurisdiction?: string | null
          lanes?: number | null
          mapserver_id?: string | null
          road_class?: string | null
          road_name?: string | null
          route_number?: string | null
          source_dataset?: string | null
          source_layer_id?: string | null
          speed_limit?: number | null
          surface_type?: string | null
          truck_percent?: number | null
          updated_at?: string | null
        }
        Update: {
          aadt?: number | null
          aadt_year?: number | null
          county?: string | null
          created_at?: string | null
          dataset_version?: string
          etl_job_id?: string | null
          geom?: unknown
          id?: number
          jurisdiction?: string | null
          lanes?: number | null
          mapserver_id?: string | null
          road_class?: string | null
          road_name?: string | null
          route_number?: string | null
          source_dataset?: string | null
          source_layer_id?: string | null
          speed_limit?: number | null
          surface_type?: string | null
          truck_percent?: number | null
          updated_at?: string | null
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
          stripe_subscription_id: string | null
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
          stripe_subscription_id?: string | null
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
          stripe_subscription_id?: string | null
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
      utilities_canonical: {
        Row: {
          capacity: number | null
          capacity_unit: string | null
          created_at: string | null
          dataset_version: string
          depth: number | null
          diameter: number | null
          diameter_unit: string | null
          etl_job_id: string | null
          facility_id: string | null
          geom: unknown
          id: number
          install_date: string | null
          install_year: number | null
          jurisdiction: string
          length_ft: number | null
          line_id: string | null
          mapserver_id: string | null
          material: string | null
          operator: string | null
          owner: string | null
          pressure: number | null
          pressure_unit: string | null
          source_dataset: string | null
          source_layer_id: string | null
          status: string | null
          updated_at: string | null
          utility_type: string
        }
        Insert: {
          capacity?: number | null
          capacity_unit?: string | null
          created_at?: string | null
          dataset_version: string
          depth?: number | null
          diameter?: number | null
          diameter_unit?: string | null
          etl_job_id?: string | null
          facility_id?: string | null
          geom: unknown
          id?: number
          install_date?: string | null
          install_year?: number | null
          jurisdiction: string
          length_ft?: number | null
          line_id?: string | null
          mapserver_id?: string | null
          material?: string | null
          operator?: string | null
          owner?: string | null
          pressure?: number | null
          pressure_unit?: string | null
          source_dataset?: string | null
          source_layer_id?: string | null
          status?: string | null
          updated_at?: string | null
          utility_type: string
        }
        Update: {
          capacity?: number | null
          capacity_unit?: string | null
          created_at?: string | null
          dataset_version?: string
          depth?: number | null
          diameter?: number | null
          diameter_unit?: string | null
          etl_job_id?: string | null
          facility_id?: string | null
          geom?: unknown
          id?: number
          install_date?: string | null
          install_year?: number | null
          jurisdiction?: string
          length_ft?: number | null
          line_id?: string | null
          mapserver_id?: string | null
          material?: string | null
          operator?: string | null
          owner?: string | null
          pressure?: number | null
          pressure_unit?: string | null
          source_dataset?: string | null
          source_layer_id?: string | null
          status?: string | null
          updated_at?: string | null
          utility_type?: string
        }
        Relationships: []
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
      wetlands_canonical: {
        Row: {
          area_acres: number | null
          class: string | null
          created_at: string | null
          dataset_version: string
          etl_job_id: string | null
          geom: unknown
          id: number
          mapserver_id: string | null
          source_dataset: string | null
          source_layer_id: string | null
          special_modifier: string | null
          subclass: string | null
          subsystem: string | null
          system: string | null
          updated_at: string | null
          water_regime: string | null
          wetland_code: string
          wetland_type: string | null
        }
        Insert: {
          area_acres?: number | null
          class?: string | null
          created_at?: string | null
          dataset_version: string
          etl_job_id?: string | null
          geom: unknown
          id?: number
          mapserver_id?: string | null
          source_dataset?: string | null
          source_layer_id?: string | null
          special_modifier?: string | null
          subclass?: string | null
          subsystem?: string | null
          system?: string | null
          updated_at?: string | null
          water_regime?: string | null
          wetland_code: string
          wetland_type?: string | null
        }
        Update: {
          area_acres?: number | null
          class?: string | null
          created_at?: string | null
          dataset_version?: string
          etl_job_id?: string | null
          geom?: unknown
          id?: number
          mapserver_id?: string | null
          source_dataset?: string | null
          source_layer_id?: string | null
          special_modifier?: string | null
          subclass?: string | null
          subsystem?: string | null
          system?: string | null
          updated_at?: string | null
          water_regime?: string | null
          wetland_code?: string
          wetland_type?: string | null
        }
        Relationships: []
      }
      zoning_canonical: {
        Row: {
          conditional_uses: string | null
          corner_setback: number | null
          created_at: string | null
          dataset_version: string
          district_code: string
          district_name: string | null
          etl_job_id: string | null
          far: number | null
          front_setback: number | null
          geom: unknown
          height_limit: number | null
          height_limit_stories: number | null
          id: number
          jurisdiction: string
          lot_coverage: number | null
          mapserver_id: string | null
          min_lot_depth: number | null
          min_lot_size: number | null
          min_lot_width: number | null
          overlay_flags: string[] | null
          permitted_uses: string | null
          prohibited_uses: string | null
          rear_setback: number | null
          side_setback: number | null
          source_dataset: string | null
          source_layer_id: string | null
          updated_at: string | null
        }
        Insert: {
          conditional_uses?: string | null
          corner_setback?: number | null
          created_at?: string | null
          dataset_version: string
          district_code: string
          district_name?: string | null
          etl_job_id?: string | null
          far?: number | null
          front_setback?: number | null
          geom: unknown
          height_limit?: number | null
          height_limit_stories?: number | null
          id?: number
          jurisdiction: string
          lot_coverage?: number | null
          mapserver_id?: string | null
          min_lot_depth?: number | null
          min_lot_size?: number | null
          min_lot_width?: number | null
          overlay_flags?: string[] | null
          permitted_uses?: string | null
          prohibited_uses?: string | null
          rear_setback?: number | null
          side_setback?: number | null
          source_dataset?: string | null
          source_layer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          conditional_uses?: string | null
          corner_setback?: number | null
          created_at?: string | null
          dataset_version?: string
          district_code?: string
          district_name?: string | null
          etl_job_id?: string | null
          far?: number | null
          front_setback?: number | null
          geom?: unknown
          height_limit?: number | null
          height_limit_stories?: number | null
          id?: number
          jurisdiction?: string
          lot_coverage?: number | null
          mapserver_id?: string | null
          min_lot_depth?: number | null
          min_lot_size?: number | null
          min_lot_width?: number | null
          overlay_flags?: string[] | null
          permitted_uses?: string | null
          prohibited_uses?: string | null
          rear_setback?: number | null
          side_setback?: number | null
          source_dataset?: string | null
          source_layer_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
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
          intent_type: string | null
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
      v_reports_sanitized: {
        Row: {
          ai_completion_tokens: number | null
          ai_prompt_tokens: number | null
          application_id: string | null
          created_at: string | null
          error_message: string | null
          feasibility_score: number | null
          id: string | null
          json_data: Json | null
          pdf_url: string | null
          report_type: string | null
          score_band: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          validation_status: string | null
        }
        Insert: {
          ai_completion_tokens?: number | null
          ai_prompt_tokens?: number | null
          application_id?: string | null
          created_at?: string | null
          error_message?: string | null
          feasibility_score?: number | null
          id?: string | null
          json_data?: never
          pdf_url?: string | null
          report_type?: string | null
          score_band?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          validation_status?: string | null
        }
        Update: {
          ai_completion_tokens?: number | null
          ai_prompt_tokens?: number | null
          application_id?: string | null
          created_at?: string | null
          error_message?: string | null
          feasibility_score?: number | null
          id?: string | null
          json_data?: never
          pdf_url?: string | null
          report_type?: string | null
          score_band?: string | null
          status?: string | null
          updated_at?: string | null
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
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
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
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
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
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
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
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      calculate_acreage: { Args: { geom: unknown }; Returns: number }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      execute_canonical_insert: {
        Args: { p_record: Json; p_table_name: string }
        Returns: Json
      }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
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
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
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
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_active_datasets: {
        Args: { p_jurisdiction: string }
        Returns: {
          created_at: string
          dataset_key: string
          dataset_type: Database["public"]["Enums"]["dataset_type"]
          dataset_version: string
          effective_from: string
          effective_to: string | null
          id: string
          jurisdiction: string
          layer_name: string
          mapserver_id: string | null
          metadata: Json | null
          record_count: number | null
          status: Database["public"]["Enums"]["dataset_status"]
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "datasets"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_active_tile_jobs: {
        Args: never
        Returns: {
          duration_minutes: number
          id: string
          started_at: string
          status: Database["public"]["Enums"]["tile_job_status"]
          tileset_key: string
        }[]
      }
      get_all_constraints_for_parcel: {
        Args: {
          parcel_geom: unknown
          transportation_radius_ft?: number
          utility_radius_ft?: number
        }
        Returns: Json
      }
      get_flood_for_parcel: {
        Args: { parcel_geom: unknown }
        Returns: {
          bfe: number
          bfe_unit: string
          coastal_flag: boolean
          dataset_version: string
          effective_date: string
          flood_zone: string
          flood_zone_subtype: string
          floodway_flag: boolean
          most_restrictive: boolean
          panel_id: string
          static_bfe: number
          zone_area_sqft: number
          zone_pct: number
        }[]
      }
      get_latest_draft: {
        Args: { p_user_id: string }
        Returns: {
          application_id: string | null
          completed_steps: number[] | null
          contact_info: Json | null
          coverage_flags: string[] | null
          created_at: string
          current_step: number
          derived_max_far: number | null
          derived_max_height: number | null
          draft_id: string
          drawn_parcel_id: string | null
          final_questions: Json | null
          form_data: Json | null
          gis_provenance: Json | null
          initial_feasibility_score: number | null
          intent_type: Database["public"]["Enums"]["intent_type"] | null
          last_saved_at: string
          market_risks: Json | null
          parcel_id: string | null
          parcel_source_id: string | null
          profile_id: string | null
          project_intent: Json | null
          property_info: Json | null
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "applications_draft"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_override_stats: { Args: { p_application_id: string }; Returns: Json }
      get_stale_tilesets: {
        Args: never
        Returns: {
          hours_since_refresh: number
          jurisdiction: string
          name: string
          refresh_frequency_hours: number
          tileset_key: string
        }[]
      }
      get_transportation_for_parcel: {
        Args: { parcel_geom: unknown; search_radius_ft?: number }
        Returns: {
          aadt: number
          aadt_year: number
          dataset_version: string
          distance_ft: number
          lanes: number
          road_class: string
          road_name: string
          route_number: string
          speed_limit: number
          surface_type: string
          truck_percent: number
        }[]
      }
      get_utilities_for_parcel: {
        Args: { parcel_geom: unknown; search_radius_ft?: number }
        Returns: {
          capacity: number
          capacity_unit: string
          dataset_version: string
          diameter: number
          diameter_unit: string
          distance_ft: number
          facility_id: string
          install_year: number
          line_id: string
          material: string
          owner: string
          status: string
          utility_type: string
        }[]
      }
      get_wetlands_for_parcel: {
        Args: { parcel_geom: unknown }
        Returns: {
          class: string
          dataset_version: string
          overlap_area_acres: number
          overlap_area_sqft: number
          overlap_pct: number
          subclass: string
          subsystem: string
          system: string
          water_regime: string
          wetland_code: string
          wetland_type: string
        }[]
      }
      get_zoning_for_parcel: {
        Args: { parcel_geom: unknown }
        Returns: {
          corner_setback: number
          dataset_version: string
          district_code: string
          district_name: string
          far: number
          front_setback: number
          height_limit: number
          height_limit_stories: number
          intersection_area_sqft: number
          intersection_pct: number
          lot_coverage: number
          min_lot_size: number
          overlay_flags: string[]
          rear_setback: number
          side_setback: number
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      normalize_parcel_identifier: {
        Args: { identifier: string }
        Returns: string
      }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
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
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      sanitize_report_json: {
        Args: { report_json: Json; user_id: string }
        Returns: Json
      }
      save_drawn_parcel_with_acreage:
        | {
            Args: {
              p_application_id: string
              p_geometry: Json
              p_name: string
              p_parcel_id?: string
              p_user_id: string
            }
            Returns: {
              acreage_calc: number
              application_id: string
              created_at: string
              geometry: unknown
              id: string
              name: string
              source: string
              updated_at: string
              user_id: string
            }[]
          }
        | {
            Args: {
              p_application_id?: string
              p_geometry: string
              p_name: string
              p_user_id: string
            }
            Returns: Json
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
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
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
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
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
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
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
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
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
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
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
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
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
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
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
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
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
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
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
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
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
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
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
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
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
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
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
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
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
      validate_report_json_schema: { Args: { data: Json }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "enterprise"
      dataset_status: "active" | "stale" | "deprecated"
      dataset_type:
        | "parcels"
        | "zoning"
        | "flood"
        | "utilities"
        | "environmental"
        | "wetlands"
        | "topography"
        | "traffic"
        | "demographics"
        | "boundaries"
      intent_type: "build" | "buy" | "invest"
      parcel_source_type: "official" | "user_drawn" | "third_party"
      risk_source: "auto" | "user_annotation"
      tile_job_status:
        | "queued"
        | "fetching"
        | "normalizing"
        | "tiling"
        | "uploading"
        | "registering"
        | "complete"
        | "error"
        | "cancelled"
      tile_job_type: "full" | "incremental" | "repair"
      tileset_category:
        | "parcels"
        | "zoning"
        | "flood"
        | "utilities"
        | "environmental"
        | "transportation"
        | "jurisdiction"
        | "topography"
        | "addressing"
        | "demographics"
        | "other"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
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
      dataset_status: ["active", "stale", "deprecated"],
      dataset_type: [
        "parcels",
        "zoning",
        "flood",
        "utilities",
        "environmental",
        "wetlands",
        "topography",
        "traffic",
        "demographics",
        "boundaries",
      ],
      intent_type: ["build", "buy", "invest"],
      parcel_source_type: ["official", "user_drawn", "third_party"],
      risk_source: ["auto", "user_annotation"],
      tile_job_status: [
        "queued",
        "fetching",
        "normalizing",
        "tiling",
        "uploading",
        "registering",
        "complete",
        "error",
        "cancelled",
      ],
      tile_job_type: ["full", "incremental", "repair"],
      tileset_category: [
        "parcels",
        "zoning",
        "flood",
        "utilities",
        "environmental",
        "transportation",
        "jurisdiction",
        "topography",
        "addressing",
        "demographics",
        "other",
      ],
    },
  },
} as const
