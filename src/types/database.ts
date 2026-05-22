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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_allowlist: {
        Row: {
          created_at: string
          email: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          email: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          email?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      admin_permissions: {
        Row: {
          category: string
          label: string
          slug: string
        }
        Insert: {
          category?: string
          label: string
          slug: string
        }
        Update: {
          category?: string
          label?: string
          slug?: string
        }
        Relationships: []
      }
      admin_role_permissions: {
        Row: {
          permission_slug: string
          role_id: string
        }
        Insert: {
          permission_slug: string
          role_id: string
        }
        Update: {
          permission_slug?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_role_permissions_permission_slug_fkey"
            columns: ["permission_slug"]
            isOneToOne: false
            referencedRelation: "admin_permissions"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "admin_role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "admin_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_roles: {
        Row: {
          created_at: string
          id: string
          is_super_admin: boolean
          is_system: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_super_admin?: boolean
          is_system?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_super_admin?: boolean
          is_system?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      app_page_registry: {
        Row: {
          admin_permission: string | null
          admin_route: string | null
          admin_sidebar_id: string | null
          created_at: string
          description: string | null
          driver_bottom_nav: string | null
          driver_route: string | null
          id: string
          key_columns: Json
          logic_summary: string | null
          page_key: string
          page_title: string
          platform: string
          realtime_channels: string[]
          rls_notes: string | null
          sort_order: number
          status_flow: Json | null
          storage_buckets: string[]
          tables_read: string[]
          tables_write: string[]
          updated_at: string
        }
        Insert: {
          admin_permission?: string | null
          admin_route?: string | null
          admin_sidebar_id?: string | null
          created_at?: string
          description?: string | null
          driver_bottom_nav?: string | null
          driver_route?: string | null
          id?: string
          key_columns?: Json
          logic_summary?: string | null
          page_key: string
          page_title: string
          platform: string
          realtime_channels?: string[]
          rls_notes?: string | null
          sort_order?: number
          status_flow?: Json | null
          storage_buckets?: string[]
          tables_read?: string[]
          tables_write?: string[]
          updated_at?: string
        }
        Update: {
          admin_permission?: string | null
          admin_route?: string | null
          admin_sidebar_id?: string | null
          created_at?: string
          description?: string | null
          driver_bottom_nav?: string | null
          driver_route?: string | null
          id?: string
          key_columns?: Json
          logic_summary?: string | null
          page_key?: string
          page_title?: string
          platform?: string
          realtime_channels?: string[]
          rls_notes?: string | null
          sort_order?: number
          status_flow?: Json | null
          storage_buckets?: string[]
          tables_read?: string[]
          tables_write?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          app_name: string
          app_subtitle: string
          driver_app_login_hint: string
          driver_app_logo_url: string | null
          driver_app_maintenance_message: string
          driver_app_maintenance_mode: boolean
          driver_app_splash_url: string | null
          driver_app_title: string
          font_family: string
          id: number
          logo_type: string
          logo_url: string | null
          maintenance_mode: boolean
          super_admin_claimed: boolean
          super_admin_user_id: string | null
          theme_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          app_name?: string
          app_subtitle?: string
          driver_app_login_hint?: string
          driver_app_logo_url?: string | null
          driver_app_maintenance_message?: string
          driver_app_maintenance_mode?: boolean
          driver_app_splash_url?: string | null
          driver_app_title?: string
          font_family?: string
          id?: number
          logo_type?: string
          logo_url?: string | null
          maintenance_mode?: boolean
          super_admin_claimed?: boolean
          super_admin_user_id?: string | null
          theme_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          app_name?: string
          app_subtitle?: string
          driver_app_login_hint?: string
          driver_app_logo_url?: string | null
          driver_app_maintenance_message?: string
          driver_app_maintenance_mode?: boolean
          driver_app_splash_url?: string | null
          driver_app_title?: string
          font_family?: string
          id?: number
          logo_type?: string
          logo_url?: string | null
          maintenance_mode?: boolean
          super_admin_claimed?: boolean
          super_admin_user_id?: string | null
          theme_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      app_themes: {
        Row: {
          base_preset: string
          created_at: string
          dark_tokens: Json
          id: string
          light_tokens: Json
          name: string
          updated_at: string
        }
        Insert: {
          base_preset?: string
          created_at?: string
          dark_tokens?: Json
          id: string
          light_tokens?: Json
          name: string
          updated_at?: string
        }
        Update: {
          base_preset?: string
          created_at?: string
          dark_tokens?: Json
          id?: string
          light_tokens?: Json
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointment_slots: {
        Row: {
          capacity: number
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          slot_name: string
          start_time: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          slot_name: string
          start_time: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          slot_name?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          reason: string | null
          scheduled_for: string
          slot_id: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          reason?: string | null
          scheduled_for: string
          slot_id: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          reason?: string | null
          scheduled_for?: string
          slot_id?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "appointment_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_logs: {
        Row: {
          check_in_at: string | null
          check_out_at: string | null
          created_at: string
          driver_id: string
          id: string
          log_date: string
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
          zone_compliance: Database["public"]["Enums"]["zone_compliance"] | null
        }
        Insert: {
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string
          driver_id: string
          id?: string
          log_date: string
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          zone_compliance?:
            | Database["public"]["Enums"]["zone_compliance"]
            | null
        }
        Update: {
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          log_date?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          zone_compliance?:
            | Database["public"]["Enums"]["zone_compliance"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_logs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          created_at: string
          delivered_at: string
          delivered_lat: number | null
          delivered_lng: number | null
          driver_id: string
          external_order_id: string | null
          id: string
          order_proof_url: string | null
          partner_id: string | null
          rejection_reason: string | null
          restaurant_id: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          delivered_at?: string
          delivered_lat?: number | null
          delivered_lng?: number | null
          driver_id: string
          external_order_id?: string | null
          id?: string
          order_proof_url?: string | null
          partner_id?: string | null
          rejection_reason?: string | null
          restaurant_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          delivered_at?: string
          delivered_lat?: number | null
          delivered_lng?: number | null
          driver_id?: string
          external_order_id?: string | null
          id?: string
          order_proof_url?: string | null
          partner_id?: string | null
          rejection_reason?: string | null
          restaurant_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_verifications: {
        Row: {
          created_at: string
          created_by: string | null
          driver_id: string
          id: string
          import_batch_id: string | null
          matched_count: number
          notes: string | null
          partner_id: string
          reconciled_at: string | null
          reported_count: number
          restaurant_id: string
          service_date: string
          shortfall_count: number
          source: Database["public"]["Enums"]["verification_source"]
          status: Database["public"]["Enums"]["verification_status"]
          under_review_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          driver_id: string
          id?: string
          import_batch_id?: string | null
          matched_count?: number
          notes?: string | null
          partner_id: string
          reconciled_at?: string | null
          reported_count: number
          restaurant_id: string
          service_date: string
          shortfall_count?: number
          source?: Database["public"]["Enums"]["verification_source"]
          status?: Database["public"]["Enums"]["verification_status"]
          under_review_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          driver_id?: string
          id?: string
          import_batch_id?: string | null
          matched_count?: number
          notes?: string | null
          partner_id?: string
          reconciled_at?: string | null
          reported_count?: number
          restaurant_id?: string
          service_date?: string
          shortfall_count?: number
          source?: Database["public"]["Enums"]["verification_source"]
          status?: Database["public"]["Enums"]["verification_status"]
          under_review_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_verifications_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_verifications_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "verification_import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_verifications_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_verifications_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_rule_scopes: {
        Row: {
          created_at: string
          delivery_rule_id: string
          id: string
          partner_id: string | null
          restaurant_id: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          delivery_rule_id: string
          id?: string
          partner_id?: string | null
          restaurant_id?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          delivery_rule_id?: string
          id?: string
          partner_id?: string | null
          restaurant_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_rule_scopes_delivery_rule_id_fkey"
            columns: ["delivery_rule_id"]
            isOneToOne: false
            referencedRelation: "delivery_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_rule_scopes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_rule_scopes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_rule_scopes_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_rules: {
        Row: {
          created_at: string
          end_date: string
          id: string
          must_match_driver_zone: boolean
          must_match_partner: boolean
          name: string
          partner_id: string | null
          priority: number
          require_verified: boolean
          restaurant_id: string | null
          scope_type: Database["public"]["Enums"]["rule_scope_type"]
          start_date: string
          status: Database["public"]["Enums"]["rule_status"]
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          must_match_driver_zone?: boolean
          must_match_partner?: boolean
          name: string
          partner_id?: string | null
          priority?: number
          require_verified?: boolean
          restaurant_id?: string | null
          scope_type: Database["public"]["Enums"]["rule_scope_type"]
          start_date: string
          status?: Database["public"]["Enums"]["rule_status"]
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          must_match_driver_zone?: boolean
          must_match_partner?: boolean
          name?: string
          partner_id?: string | null
          priority?: number
          require_verified?: boolean
          restaurant_id?: string | null
          scope_type?: Database["public"]["Enums"]["rule_scope_type"]
          start_date?: string
          status?: Database["public"]["Enums"]["rule_status"]
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_rules_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_rules_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_rules_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_assets: {
        Row: {
          asset: Database["public"]["Enums"]["asset_type"]
          created_at: string
          driver_id: string
          id: string
          issued: boolean
          updated_at: string
        }
        Insert: {
          asset: Database["public"]["Enums"]["asset_type"]
          created_at?: string
          driver_id: string
          id?: string
          issued?: boolean
          updated_at?: string
        }
        Update: {
          asset?: Database["public"]["Enums"]["asset_type"]
          created_at?: string
          driver_id?: string
          id?: string
          issued?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_assets_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_documents: {
        Row: {
          created_at: string
          doc_type: Database["public"]["Enums"]["document_type"]
          driver_id: string
          expires_at: string | null
          file_url: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc_type: Database["public"]["Enums"]["document_type"]
          driver_id: string
          expires_at?: string | null
          file_url: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["document_type"]
          driver_id?: string
          expires_at?: string | null
          file_url?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_earnings_daily: {
        Row: {
          base_kwd: number
          created_at: string
          deliveries: number
          driver_id: string
          earn_date: string
          id: string
          incentive_kwd: number
          loan_deduction_kwd: number
          net_kwd: number
          penalty_kwd: number
          reimbursement_kwd: number
          updated_at: string
        }
        Insert: {
          base_kwd?: number
          created_at?: string
          deliveries?: number
          driver_id: string
          earn_date: string
          id?: string
          incentive_kwd?: number
          loan_deduction_kwd?: number
          net_kwd?: number
          penalty_kwd?: number
          reimbursement_kwd?: number
          updated_at?: string
        }
        Update: {
          base_kwd?: number
          created_at?: string
          deliveries?: number
          driver_id?: string
          earn_date?: string
          id?: string
          incentive_kwd?: number
          loan_deduction_kwd?: number
          net_kwd?: number
          penalty_kwd?: number
          reimbursement_kwd?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_earnings_daily_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_intake_restaurants: {
        Row: {
          created_at: string
          intake_id: string
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          intake_id: string
          restaurant_id: string
        }
        Update: {
          created_at?: string
          intake_id?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_intake_restaurants_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "driver_intakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_intake_restaurants_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_intakes: {
        Row: {
          archived_at: string | null
          assets_issued: Json
          civil_id: string
          created_at: string
          driver_code: string
          full_name: string
          id: string
          linked: boolean
          linked_profile_id: string | null
          otp_code: string | null
          partner_id: string
          phone: string
          restaurant_id: string | null
          status: Database["public"]["Enums"]["driver_intake_status"]
          updated_at: string
          vehicle_id: string | null
          workflow_status: Database["public"]["Enums"]["driver_workflow_status"]
          zone_id: string
        }
        Insert: {
          archived_at?: string | null
          assets_issued?: Json
          civil_id: string
          created_at?: string
          driver_code: string
          full_name: string
          id?: string
          linked?: boolean
          linked_profile_id?: string | null
          otp_code?: string | null
          partner_id: string
          phone: string
          restaurant_id?: string | null
          status?: Database["public"]["Enums"]["driver_intake_status"]
          updated_at?: string
          vehicle_id?: string | null
          workflow_status?: Database["public"]["Enums"]["driver_workflow_status"]
          zone_id: string
        }
        Update: {
          archived_at?: string | null
          assets_issued?: Json
          civil_id?: string
          created_at?: string
          driver_code?: string
          full_name?: string
          id?: string
          linked?: boolean
          linked_profile_id?: string | null
          otp_code?: string | null
          partner_id?: string
          phone?: string
          restaurant_id?: string | null
          status?: Database["public"]["Enums"]["driver_intake_status"]
          updated_at?: string
          vehicle_id?: string | null
          workflow_status?: Database["public"]["Enums"]["driver_workflow_status"]
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_intakes_linked_profile_id_fkey"
            columns: ["linked_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_intakes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_intakes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_intakes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_intakes_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_restaurants: {
        Row: {
          created_at: string
          driver_id: string
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          restaurant_id: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_restaurants_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_restaurants_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_sessions: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          is_online: boolean
          updated_at: string
          went_offline_at: string | null
          went_online_at: string | null
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          is_online?: boolean
          updated_at?: string
          went_offline_at?: string | null
          went_online_at?: string | null
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          is_online?: boolean
          updated_at?: string
          went_offline_at?: string | null
          went_online_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_sessions_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          app_passcode: string | null
          archived_at: string | null
          base_earnings_kwd: number | null
          civil_id: string | null
          created_at: string
          current_lat: number | null
          current_lng: number | null
          driver_code: string
          employee_id: string | null
          id: string
          is_on_duty: boolean
          joined_at: string | null
          partner_id: string | null
          restaurant_id: string | null
          status: Database["public"]["Enums"]["driver_status"]
          updated_at: string
          vehicle_id: string | null
          zone_id: string | null
        }
        Insert: {
          app_passcode?: string | null
          archived_at?: string | null
          base_earnings_kwd?: number | null
          civil_id?: string | null
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          driver_code: string
          employee_id?: string | null
          id: string
          is_on_duty?: boolean
          joined_at?: string | null
          partner_id?: string | null
          restaurant_id?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          updated_at?: string
          vehicle_id?: string | null
          zone_id?: string | null
        }
        Update: {
          app_passcode?: string | null
          archived_at?: string | null
          base_earnings_kwd?: number | null
          civil_id?: string | null
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          driver_code?: string
          employee_id?: string | null
          id?: string
          is_on_duty?: boolean
          joined_at?: string | null
          partner_id?: string | null
          restaurant_id?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          updated_at?: string
          vehicle_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      hygiene_submissions: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          info: string | null
          penalty_kwd: number | null
          photo_url: string | null
          status: Database["public"]["Enums"]["hygiene_submission_status"]
          task_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          info?: string | null
          penalty_kwd?: number | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["hygiene_submission_status"]
          task_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          info?: string | null
          penalty_kwd?: number | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["hygiene_submission_status"]
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hygiene_submissions_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hygiene_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "hygiene_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      hygiene_tasks: {
        Row: {
          audience_filter: Json
          created_at: string
          id: string
          status: Database["public"]["Enums"]["hygiene_task_status"]
          title: string
          updated_at: string
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          audience_filter?: Json
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["hygiene_task_status"]
          title: string
          updated_at?: string
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          audience_filter?: Json
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["hygiene_task_status"]
          title?: string
          updated_at?: string
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      incentive_rule_scopes: {
        Row: {
          created_at: string
          id: string
          incentive_rule_id: string
          partner_id: string | null
          restaurant_id: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          incentive_rule_id: string
          partner_id?: string | null
          restaurant_id?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          incentive_rule_id?: string
          partner_id?: string | null
          restaurant_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incentive_rule_scopes_incentive_rule_id_fkey"
            columns: ["incentive_rule_id"]
            isOneToOne: false
            referencedRelation: "incentive_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incentive_rule_scopes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incentive_rule_scopes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incentive_rule_scopes_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      incentive_rule_tiers: {
        Row: {
          created_at: string
          id: string
          incentive_rule_id: string
          reward_kwd: number | null
          reward_mode: Database["public"]["Enums"]["incentive_reward_mode"]
          reward_per_delivery_kwd: number | null
          sort_order: number
          threshold_deliveries: number
        }
        Insert: {
          created_at?: string
          id?: string
          incentive_rule_id: string
          reward_kwd?: number | null
          reward_mode?: Database["public"]["Enums"]["incentive_reward_mode"]
          reward_per_delivery_kwd?: number | null
          sort_order?: number
          threshold_deliveries: number
        }
        Update: {
          created_at?: string
          id?: string
          incentive_rule_id?: string
          reward_kwd?: number | null
          reward_mode?: Database["public"]["Enums"]["incentive_reward_mode"]
          reward_per_delivery_kwd?: number | null
          sort_order?: number
          threshold_deliveries?: number
        }
        Relationships: [
          {
            foreignKeyName: "incentive_rule_tiers_incentive_rule_id_fkey"
            columns: ["incentive_rule_id"]
            isOneToOne: false
            referencedRelation: "incentive_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      incentive_rules: {
        Row: {
          base_minimum_deliveries: number
          created_at: string
          end_date: string
          id: string
          name: string
          overrides_others: boolean
          partner_id: string | null
          payout_mode: Database["public"]["Enums"]["incentive_payout_mode"]
          period: Database["public"]["Enums"]["incentive_period"]
          priority: number
          restaurant_id: string | null
          reward_kwd: number
          reward_mode: Database["public"]["Enums"]["incentive_reward_mode"]
          reward_per_delivery_kwd: number | null
          scope_type: Database["public"]["Enums"]["rule_scope_type"]
          start_date: string
          status: Database["public"]["Enums"]["rule_status"]
          target_deliveries: number | null
          target_mode: Database["public"]["Enums"]["incentive_target_mode"]
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          base_minimum_deliveries?: number
          created_at?: string
          end_date: string
          id?: string
          name: string
          overrides_others?: boolean
          partner_id?: string | null
          payout_mode?: Database["public"]["Enums"]["incentive_payout_mode"]
          period: Database["public"]["Enums"]["incentive_period"]
          priority?: number
          restaurant_id?: string | null
          reward_kwd?: number
          reward_mode?: Database["public"]["Enums"]["incentive_reward_mode"]
          reward_per_delivery_kwd?: number | null
          scope_type: Database["public"]["Enums"]["rule_scope_type"]
          start_date: string
          status?: Database["public"]["Enums"]["rule_status"]
          target_deliveries?: number | null
          target_mode?: Database["public"]["Enums"]["incentive_target_mode"]
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          base_minimum_deliveries?: number
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          overrides_others?: boolean
          partner_id?: string | null
          payout_mode?: Database["public"]["Enums"]["incentive_payout_mode"]
          period?: Database["public"]["Enums"]["incentive_period"]
          priority?: number
          restaurant_id?: string | null
          reward_kwd?: number
          reward_mode?: Database["public"]["Enums"]["incentive_reward_mode"]
          reward_per_delivery_kwd?: number | null
          scope_type?: Database["public"]["Enums"]["rule_scope_type"]
          start_date?: string
          status?: Database["public"]["Enums"]["rule_status"]
          target_deliveries?: number | null
          target_mode?: Database["public"]["Enums"]["incentive_target_mode"]
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incentive_rules_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incentive_rules_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incentive_rules_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_terms: {
        Row: {
          created_at: string
          deduction_kwd: number
          id: string
          installment_remaining: number
          months: number
          request_id: string
          total_kwd: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deduction_kwd: number
          id?: string
          installment_remaining: number
          months: number
          request_id: string
          total_kwd: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deduction_kwd?: number
          id?: string
          installment_remaining?: number
          months?: number
          request_id?: string
          total_kwd?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_terms_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      locales: {
        Row: {
          code: string
          created_at: string
          dir: string
          enabled: boolean
          is_default: boolean
          name: string
          native_name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          dir?: string
          enabled?: boolean
          is_default?: boolean
          name: string
          native_name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          dir?: string
          enabled?: boolean
          is_default?: boolean
          name?: string
          native_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      menu_configs: {
        Row: {
          config: Json
          id: string
          role: string
          scope: string
          site_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config?: Json
          id?: string
          role: string
          scope?: string
          site_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          id?: string
          role?: string
          scope?: string
          site_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          created_at: string
          end_date: string
          id: string
          name: string
          offer_type: Database["public"]["Enums"]["offer_type"]
          reward_kwd: number
          start_date: string
          status: Database["public"]["Enums"]["offer_status"]
          target_deliveries: number
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          name: string
          offer_type: Database["public"]["Enums"]["offer_type"]
          reward_kwd?: number
          start_date: string
          status?: Database["public"]["Enums"]["offer_status"]
          target_deliveries?: number
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          offer_type?: Database["public"]["Enums"]["offer_type"]
          reward_kwd?: number
          start_date?: string
          status?: Database["public"]["Enums"]["offer_status"]
          target_deliveries?: number
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone_1: string | null
          contact_phone_2: string | null
          contact_role: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone_1?: string | null
          contact_phone_2?: string | null
          contact_role?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone_1?: string | null
          contact_phone_2?: string | null
          contact_role?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_role_id: string | null
          approval_status: Database["public"]["Enums"]["admin_approval_status"]
          approved_at: string | null
          approved_by: string | null
          archived_at: string | null
          avatar_url: string | null
          company_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          locale: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          admin_role_id?: string | null
          approval_status?: Database["public"]["Enums"]["admin_approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          locale?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          admin_role_id?: string | null
          approval_status?: Database["public"]["Enums"]["admin_approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          locale?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_admin_role_id_fkey"
            columns: ["admin_role_id"]
            isOneToOne: false
            referencedRelation: "admin_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          amount_kwd: number | null
          attachment_url: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_reason: string | null
          details: string | null
          driver_id: string
          end_date: string | null
          id: string
          request_code: string
          request_type: Database["public"]["Enums"]["request_type"]
          start_date: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          amount_kwd?: number | null
          attachment_url?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          details?: string | null
          driver_id: string
          end_date?: string | null
          id?: string
          request_code: string
          request_type: Database["public"]["Enums"]["request_type"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          amount_kwd?: number | null
          attachment_url?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          details?: string | null
          driver_id?: string
          end_date?: string | null
          id?: string
          request_code?: string
          request_type?: Database["public"]["Enums"]["request_type"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          created_at: string
          created_by: string | null
          external_merchant_id: string | null
          id: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          map_link: string | null
          name: string
          partner_id: string
          restaurant_code: string
          status: Database["public"]["Enums"]["restaurant_status"]
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          external_merchant_id?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          map_link?: string | null
          name: string
          partner_id: string
          restaurant_code?: string
          status?: Database["public"]["Enums"]["restaurant_status"]
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          external_merchant_id?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          map_link?: string | null
          name?: string
          partner_id?: string
          restaurant_code?: string
          status?: Database["public"]["Enums"]["restaurant_status"]
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurants_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurants_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_uploads: {
        Row: {
          bucket: string
          confirmed_at: string | null
          content_type: string | null
          entity_id: string | null
          entity_type: string | null
          expires_at: string | null
          id: string
          object_key: string
          size_bytes: number | null
          status: string
          uploaded_at: string
          uploaded_by: string | null
          uploaded_via: string
        }
        Insert: {
          bucket: string
          confirmed_at?: string | null
          content_type?: string | null
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          object_key: string
          size_bytes?: number | null
          status?: string
          uploaded_at?: string
          uploaded_by?: string | null
          uploaded_via?: string
        }
        Update: {
          bucket?: string
          confirmed_at?: string | null
          content_type?: string | null
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          object_key?: string
          size_bytes?: number | null
          status?: string
          uploaded_at?: string
          uploaded_by?: string | null
          uploaded_via?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          attachment_url: string | null
          body: string
          created_at: string
          id: string
          sender: Database["public"]["Enums"]["message_sender"]
          sent_at: string
          thread_id: string
        }
        Insert: {
          attachment_url?: string | null
          body: string
          created_at?: string
          id?: string
          sender: Database["public"]["Enums"]["message_sender"]
          sent_at?: string
          thread_id: string
        }
        Update: {
          attachment_url?: string | null
          body?: string
          created_at?: string
          id?: string
          sender?: Database["public"]["Enums"]["message_sender"]
          sent_at?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "support_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      support_threads: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          status: Database["public"]["Enums"]["thread_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          status?: Database["public"]["Enums"]["thread_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          status?: Database["public"]["Enums"]["thread_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_threads_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          driver_id: string
          id: string
          issue: string
          status: Database["public"]["Enums"]["support_ticket_status"]
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          driver_id: string
          id?: string
          issue: string
          status?: Database["public"]["Enums"]["support_ticket_status"]
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          driver_id?: string
          id?: string
          issue?: string
          status?: Database["public"]["Enums"]["support_ticket_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          bike_id: string
          created_at: string
          created_by: string | null
          current_driver_id: string | null
          id: string
          make: string | null
          model: string | null
          project_type: Database["public"]["Enums"]["project_type"]
          reg_number: string | null
          status: Database["public"]["Enums"]["vehicle_status"]
          updated_at: string
        }
        Insert: {
          bike_id: string
          created_at?: string
          created_by?: string | null
          current_driver_id?: string | null
          id?: string
          make?: string | null
          model?: string | null
          project_type?: Database["public"]["Enums"]["project_type"]
          reg_number?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          updated_at?: string
        }
        Update: {
          bike_id?: string
          created_at?: string
          created_by?: string | null
          current_driver_id?: string | null
          id?: string
          make?: string | null
          model?: string | null
          project_type?: Database["public"]["Enums"]["project_type"]
          reg_number?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_current_driver_id_fkey"
            columns: ["current_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_balances: {
        Row: {
          balance_count: number
          driver_id: string
          last_verification_id: string | null
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          balance_count?: number
          driver_id: string
          last_verification_id?: string | null
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          balance_count?: number
          driver_id?: string
          last_verification_id?: string | null
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_balances_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_balances_last_verification_id_fkey"
            columns: ["last_verification_id"]
            isOneToOne: false
            referencedRelation: "delivery_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_balances_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_import_batches: {
        Row: {
          applied_count: number
          file_name: string
          id: string
          mapping: Json
          reverted_at: string | null
          reverted_by: string | null
          row_count: number
          skipped_count: number
          status: Database["public"]["Enums"]["verification_import_batch_status"]
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          applied_count?: number
          file_name: string
          id?: string
          mapping?: Json
          reverted_at?: string | null
          reverted_by?: string | null
          row_count?: number
          skipped_count?: number
          status?: Database["public"]["Enums"]["verification_import_batch_status"]
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          applied_count?: number
          file_name?: string
          id?: string
          mapping?: Json
          reverted_at?: string | null
          reverted_by?: string | null
          row_count?: number
          skipped_count?: number
          status?: Database["public"]["Enums"]["verification_import_batch_status"]
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      wrong_actions: {
        Row: {
          action_type: Database["public"]["Enums"]["wrong_action_type"]
          created_at: string
          details: string | null
          driver_id: string
          id: string
          occurred_at: string
          severity: Database["public"]["Enums"]["severity_level"]
          source: Database["public"]["Enums"]["wrong_action_source"]
          updated_at: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["wrong_action_type"]
          created_at?: string
          details?: string | null
          driver_id: string
          id?: string
          occurred_at?: string
          severity?: Database["public"]["Enums"]["severity_level"]
          source?: Database["public"]["Enums"]["wrong_action_source"]
          updated_at?: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["wrong_action_type"]
          created_at?: string
          details?: string | null
          driver_id?: string
          id?: string
          occurred_at?: string
          severity?: Database["public"]["Enums"]["severity_level"]
          source?: Database["public"]["Enums"]["wrong_action_source"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wrong_actions_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          code: string
          color: string
          company_id: string | null
          created_at: string
          geometry: Json | null
          id: string
          name: string
          updated_at: string
          zone_type: Database["public"]["Enums"]["zone_geometry_type"]
        }
        Insert: {
          code: string
          color?: string
          company_id?: string | null
          created_at?: string
          geometry?: Json | null
          id?: string
          name: string
          updated_at?: string
          zone_type?: Database["public"]["Enums"]["zone_geometry_type"]
        }
        Update: {
          code?: string
          color?: string
          company_id?: string | null
          created_at?: string
          geometry?: Json | null
          id?: string
          name?: string
          updated_at?: string
          zone_type?: Database["public"]["Enums"]["zone_geometry_type"]
        }
        Relationships: [
          {
            foreignKeyName: "zones_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allocate_driver_code: { Args: never; Returns: string }
      archive_driver_intake: { Args: { p_intake_id: string }; Returns: Json }
      claim_super_admin: { Args: { p_user_id: string }; Returns: boolean }
      compute_incentive_amount: {
        Args: { p_eligible_count: number; p_rule_id: string }
        Returns: number
      }
      count_eligible_deliveries: {
        Args: {
          p_driver_id: string
          p_earn_date: string
          p_incentive_rule_id: string
        }
        Returns: number
      }
      delivery_matches_rules: {
        Args: { p_delivery_id: string; p_on_date?: string }
        Returns: boolean
      }
      driver_app_lookup_by_passcode: {
        Args: { p_driver_code: string; p_passcode: string }
        Returns: Json
      }
      driver_check_order_id_available: {
        Args: { p_external_order_id: string }
        Returns: boolean
      }
      driver_create_delivery: {
        Args: {
          p_delivered_lat?: number
          p_delivered_lng?: number
          p_external_order_id: string
          p_order_proof_url?: string
        }
        Returns: {
          created_at: string
          delivered_at: string
          delivered_lat: number | null
          delivered_lng: number | null
          driver_id: string
          external_order_id: string | null
          id: string
          order_proof_url: string | null
          partner_id: string | null
          rejection_reason: string | null
          restaurant_id: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          updated_at: string
          zone_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "deliveries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      generate_driver_app_passcode: { Args: never; Returns: string }
      is_admin_panel_user: { Args: never; Returns: boolean }
      is_current_driver: { Args: { driver_uuid: string }; Returns: boolean }
      is_rider: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      is_super_admin_user: { Args: never; Returns: boolean }
      kuwait_month_start: { Args: { p_date: string }; Returns: string }
      kuwait_week_start: { Args: { p_date: string }; Returns: string }
      mark_driver_intake_linked: {
        Args: { p_phone: string; p_profile_id: string }
        Returns: boolean
      }
      next_restaurant_code: { Args: never; Returns: string }
      normalize_external_order_id: { Args: { p_raw: string }; Returns: string }
      preview_driver_earnings: { Args: { p_earn_date: string }; Returns: Json }
      recalculate_driver_earnings: {
        Args: { p_driver_id: string; p_earn_date: string }
        Returns: undefined
      }
      reconcile_delivery_verification: {
        Args: { p_verification_id: string }
        Returns: undefined
      }
      recalculate_earnings_for_date: {
        Args: { p_earn_date: string }
        Returns: number
      }
      regenerate_driver_app_passcode: {
        Args: { p_driver_id: string }
        Returns: Json
      }
      register_or_sync_rider_profile: {
        Args: { p_full_name: string }
        Returns: Json
      }
    }
    Enums: {
      admin_approval_status: "pending" | "approved" | "rejected"
      app_role: "rider" | "staff"
      appointment_status: "scheduled" | "completed" | "cancelled"
      asset_type:
        | "gps"
        | "sim"
        | "phone"
        | "delivery_bag"
        | "helmet"
        | "uniform"
      attendance_status: "present" | "late" | "absent" | "on_leave"
      delivery_status: "pending" | "verified" | "rejected" | "under_review"
      delivery_verification_status: "pending" | "verified"
      document_type: "license" | "civil_id" | "work_permit" | "passport"
      driver_intake_status: "awaiting_app_link" | "linked" | "cancelled"
      driver_status: "active" | "suspended" | "pending"
      driver_workflow_status: "draft" | "pending" | "approved"
      fuel_expense_status: "pending" | "approved" | "refused"
      hygiene_submission_status: "pending" | "completed" | "rejected"
      hygiene_task_status: "draft" | "active" | "ended"
      incentive_payout_mode: "milestone" | "cumulative"
      incentive_period: "daily" | "weekly" | "monthly"
      incentive_reward_mode: "fixed" | "per_delivery"
      incentive_target_mode: "single" | "tiered"
      message_sender: "driver" | "staff"
      notification_click_action:
        | "hygiene_task"
        | "home"
        | "deliveries"
        | "vehicle"
        | "profile"
        | "custom_link"
      notification_status: "draft" | "scheduled" | "sent"
      offer_status: "draft" | "active" | "ended"
      offer_type: "daily" | "weekly" | "monthly"
      project_type: "group" | "rent"
      request_status: "pending" | "approved" | "rejected"
      request_type: "loan" | "leave" | "fuel" | "complaint" | "document"
      restaurant_status: "draft" | "published" | "archived"
      rule_scope_type: "zone" | "partner" | "restaurant"
      rule_status: "draft" | "active" | "ended"
      severity_level: "low" | "medium" | "high"
      support_ticket_status: "open" | "resolved"
      thread_status: "active" | "resolved"
      verification_import_batch_status: "previewed" | "applied" | "reverted"
      verification_source: "manual" | "import"
      verification_status:
        | "pending"
        | "matched"
        | "surplus"
        | "deficit"
        | "conflict"
        | "reverted"
      vehicle_document_type: "rc" | "permit" | "insurance"
      vehicle_status: "active" | "suspended" | "maintenance"
      wrong_action_source: "system" | "admin"
      wrong_action_type:
        | "delay"
        | "zone_breach"
        | "hygiene_failed"
        | "uniform"
        | "other"
      zone_compliance: "inside" | "outside"
      zone_geometry_type: "polygon" | "circle"
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
      admin_approval_status: ["pending", "approved", "rejected"],
      app_role: ["rider", "staff"],
      appointment_status: ["scheduled", "completed", "cancelled"],
      asset_type: ["gps", "sim", "phone", "delivery_bag", "helmet", "uniform"],
      attendance_status: ["present", "late", "absent", "on_leave"],
      delivery_status: ["pending", "verified", "rejected", "under_review"],
      delivery_verification_status: ["pending", "verified"],
      document_type: ["license", "civil_id", "work_permit", "passport"],
      driver_intake_status: ["awaiting_app_link", "linked", "cancelled"],
      driver_status: ["active", "suspended", "pending"],
      driver_workflow_status: ["draft", "pending", "approved"],
      fuel_expense_status: ["pending", "approved", "refused"],
      hygiene_submission_status: ["pending", "completed", "rejected"],
      hygiene_task_status: ["draft", "active", "ended"],
      incentive_payout_mode: ["milestone", "cumulative"],
      incentive_period: ["daily", "weekly", "monthly"],
      incentive_reward_mode: ["fixed", "per_delivery"],
      incentive_target_mode: ["single", "tiered"],
      message_sender: ["driver", "staff"],
      notification_click_action: [
        "hygiene_task",
        "home",
        "deliveries",
        "vehicle",
        "profile",
        "custom_link",
      ],
      notification_status: ["draft", "scheduled", "sent"],
      offer_status: ["draft", "active", "ended"],
      offer_type: ["daily", "weekly", "monthly"],
      project_type: ["group", "rent"],
      request_status: ["pending", "approved", "rejected"],
      request_type: ["loan", "leave", "fuel", "complaint", "document"],
      restaurant_status: ["draft", "published", "archived"],
      rule_scope_type: ["zone", "partner", "restaurant"],
      rule_status: ["draft", "active", "ended"],
      severity_level: ["low", "medium", "high"],
      support_ticket_status: ["open", "resolved"],
      thread_status: ["active", "resolved"],
      vehicle_document_type: ["rc", "permit", "insurance"],
      vehicle_status: ["active", "suspended", "maintenance"],
      verification_import_batch_status: ["previewed", "applied", "reverted"],
      verification_source: ["manual", "import"],
      verification_status: [
        "pending",
        "matched",
        "surplus",
        "deficit",
        "conflict",
        "reverted",
      ],
      wrong_action_source: ["system", "admin"],
      wrong_action_type: [
        "delay",
        "zone_breach",
        "hygiene_failed",
        "uniform",
        "other",
      ],
      zone_compliance: ["inside", "outside"],
      zone_geometry_type: ["polygon", "circle"],
    },
  },
} as const

export type AppRole = Database["public"]["Enums"]["app_role"];
export type AdminApprovalStatus = Database["public"]["Enums"]["admin_approval_status"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
