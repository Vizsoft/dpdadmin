export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: number;
          app_name: string;
          app_subtitle: string;
          font_family: string;
          logo_url: string | null;
          logo_type: string;
          theme_id: string;
          maintenance_mode: boolean;
          super_admin_claimed: boolean;
          super_admin_user_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: number;
          app_name?: string;
          app_subtitle?: string;
          font_family?: string;
          logo_url?: string | null;
          logo_type?: string;
          theme_id?: string;
          maintenance_mode?: boolean;
          super_admin_claimed?: boolean;
          super_admin_user_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: number;
          app_name?: string;
          app_subtitle?: string;
          font_family?: string;
          logo_url?: string | null;
          logo_type?: string;
          theme_id?: string;
          maintenance_mode?: boolean;
          super_admin_claimed?: boolean;
          super_admin_user_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      app_themes: {
        Row: {
          id: string;
          name: string;
          base_preset: string;
          light_tokens: Json;
          dark_tokens: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          base_preset?: string;
          light_tokens?: Json;
          dark_tokens?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          base_preset?: string;
          light_tokens?: Json;
          dark_tokens?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_allowlist: {
        Row: {
          created_at: string;
          email: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Insert: {
          created_at?: string;
          email: string;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Update: {
          created_at?: string;
          email?: string;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Relationships: [];
      };
      admin_permissions: {
        Row: {
          slug: string;
          label: string;
          category: string;
        };
        Insert: {
          slug: string;
          label: string;
          category?: string;
        };
        Update: {
          slug?: string;
          label?: string;
          category?: string;
        };
        Relationships: [];
      };
      admin_roles: {
        Row: {
          id: string;
          slug: string;
          name: string;
          is_system: boolean;
          is_super_admin: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          is_system?: boolean;
          is_super_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          is_system?: boolean;
          is_super_admin?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_role_permissions: {
        Row: {
          role_id: string;
          permission_slug: string;
        };
        Insert: {
          role_id: string;
          permission_slug: string;
        };
        Update: {
          role_id?: string;
          permission_slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_role_permissions_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "admin_roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admin_role_permissions_permission_slug_fkey";
            columns: ["permission_slug"];
            isOneToOne: false;
            referencedRelation: "admin_permissions";
            referencedColumns: ["slug"];
          },
        ];
      };
      profiles: {
        Row: {
          archived_at: string | null;
          avatar_url: string | null;
          company_id: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          locale: string;
          phone: string | null;
          role: Database["public"]["Enums"]["app_role"];
          admin_role_id: string | null;
          approval_status: Database["public"]["Enums"]["admin_approval_status"];
          approved_at: string | null;
          approved_by: string | null;
          updated_at: string;
          zone_id: string | null;
        };
        Insert: {
          archived_at?: string | null;
          avatar_url?: string | null;
          company_id?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          locale?: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          admin_role_id?: string | null;
          approval_status?: Database["public"]["Enums"]["admin_approval_status"];
          approved_at?: string | null;
          approved_by?: string | null;
          updated_at?: string;
          zone_id?: string | null;
        };
        Update: {
          archived_at?: string | null;
          avatar_url?: string | null;
          company_id?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          locale?: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          admin_role_id?: string | null;
          approval_status?: Database["public"]["Enums"]["admin_approval_status"];
          approved_at?: string | null;
          approved_by?: string | null;
          updated_at?: string;
          zone_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_admin_role_id_fkey";
            columns: ["admin_role_id"];
            isOneToOne: false;
            referencedRelation: "admin_roles";
            referencedColumns: ["id"];
          },
        ];
      };
      locales: {
        Row: {
          code: string;
          name: string;
          native_name: string;
          dir: string;
          enabled: boolean;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          name: string;
          native_name: string;
          dir?: string;
          enabled?: boolean;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
          native_name?: string;
          dir?: string;
          enabled?: boolean;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      menu_configs: {
        Row: {
          id: string;
          role: string;
          scope: string;
          site_id: string | null;
          config: Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          role: string;
          scope?: string;
          site_id?: string | null;
          config?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          role?: string;
          scope?: string;
          site_id?: string | null;
          config?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      zones: {
        Row: {
          id: string;
          name: string;
          code: string;
          color: string;
          zone_type: "polygon" | "circle";
          geometry: Json | null;
          company_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          color?: string;
          zone_type?: "polygon" | "circle";
          geometry?: Json | null;
          company_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          color?: string;
          zone_type?: "polygon" | "circle";
          geometry?: Json | null;
          company_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "drivers_zone_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["zone_id"];
          },
        ];
      };
      driver_intakes: {
        Row: {
          id: string;
          phone: string;
          full_name: string;
          civil_id: string;
          driver_code: string;
          partner_id: string;
          zone_id: string;
          vehicle_id: string | null;
          assets_issued: Json;
          status: Database["public"]["Enums"]["driver_intake_status"];
          workflow_status: Database["public"]["Enums"]["driver_workflow_status"];
          linked: boolean;
          linked_profile_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          full_name: string;
          civil_id: string;
          driver_code: string;
          partner_id: string;
          zone_id: string;
          vehicle_id?: string | null;
          assets_issued?: Json;
          status?: Database["public"]["Enums"]["driver_intake_status"];
          workflow_status?: Database["public"]["Enums"]["driver_workflow_status"];
          linked?: boolean;
          linked_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          full_name?: string;
          civil_id?: string;
          driver_code?: string;
          partner_id?: string;
          zone_id?: string;
          vehicle_id?: string | null;
          assets_issued?: Json;
          status?: Database["public"]["Enums"]["driver_intake_status"];
          workflow_status?: Database["public"]["Enums"]["driver_workflow_status"];
          linked?: boolean;
          linked_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "driver_intakes_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "partners";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_intakes_zone_id_fkey";
            columns: ["zone_id"];
            isOneToOne: false;
            referencedRelation: "zones";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "driver_intakes_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      drivers: {
        Row: {
          id: string;
          driver_code: string;
          partner_id: string | null;
          zone_id: string | null;
          civil_id: string | null;
          status: Database["public"]["Enums"]["driver_status"];
          base_earnings_kwd: number | null;
          joined_at: string | null;
          is_on_duty: boolean;
          vehicle_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          driver_code: string;
          partner_id?: string | null;
          zone_id?: string | null;
          civil_id?: string | null;
          status?: Database["public"]["Enums"]["driver_status"];
          base_earnings_kwd?: number | null;
          joined_at?: string | null;
          is_on_duty?: boolean;
          vehicle_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          driver_code?: string;
          partner_id?: string | null;
          zone_id?: string | null;
          civil_id?: string | null;
          status?: Database["public"]["Enums"]["driver_status"];
          base_earnings_kwd?: number | null;
          joined_at?: string | null;
          is_on_duty?: boolean;
          vehicle_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "drivers_zone_id_fkey";
            columns: ["zone_id"];
            isOneToOne: false;
            referencedRelation: "zones";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "drivers_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "partners";
            referencedColumns: ["id"];
          },
        ];
      };
      vehicles: {
        Row: {
          id: string;
          bike_id: string;
          reg_number: string | null;
          make: string | null;
          model: string | null;
          project_type: Database["public"]["Enums"]["project_type"];
          status: Database["public"]["Enums"]["vehicle_status"];
          current_driver_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bike_id: string;
          reg_number?: string | null;
          make?: string | null;
          model?: string | null;
          project_type?: Database["public"]["Enums"]["project_type"];
          status?: Database["public"]["Enums"]["vehicle_status"];
          current_driver_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bike_id?: string;
          reg_number?: string | null;
          make?: string | null;
          model?: string | null;
          project_type?: Database["public"]["Enums"]["project_type"];
          status?: Database["public"]["Enums"]["vehicle_status"];
          current_driver_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      storage_config: {
        Row: {
          id: number;
          r2_account_id: string | null;
          r2_access_key_id: string | null;
          r2_secret_access_key: string | null;
          r2_bucket_name: string | null;
          r2_s3_endpoint: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: number;
          r2_account_id?: string | null;
          r2_access_key_id?: string | null;
          r2_secret_access_key?: string | null;
          r2_bucket_name?: string | null;
          r2_s3_endpoint?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: number;
          r2_account_id?: string | null;
          r2_access_key_id?: string | null;
          r2_secret_access_key?: string | null;
          r2_bucket_name?: string | null;
          r2_s3_endpoint?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      restaurants: {
        Row: {
          id: string;
          partner_id: string;
          name: string;
          external_merchant_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          partner_id: string;
          name: string;
          external_merchant_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          partner_id?: string;
          name?: string;
          external_merchant_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "restaurants_partner_id_fkey";
            columns: ["partner_id"];
            isOneToOne: false;
            referencedRelation: "partners";
            referencedColumns: ["id"];
          },
        ];
      };
      delivery_rules: {
        Row: {
          id: string;
          name: string;
          status: Database["public"]["Enums"]["rule_status"];
          scope_type: Database["public"]["Enums"]["rule_scope_type"];
          zone_id: string | null;
          partner_id: string | null;
          restaurant_id: string | null;
          start_date: string;
          end_date: string;
          priority: number;
          require_verified: boolean;
          must_match_driver_zone: boolean;
          must_match_partner: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          status?: Database["public"]["Enums"]["rule_status"];
          scope_type: Database["public"]["Enums"]["rule_scope_type"];
          zone_id?: string | null;
          partner_id?: string | null;
          restaurant_id?: string | null;
          start_date: string;
          end_date: string;
          priority?: number;
          require_verified?: boolean;
          must_match_driver_zone?: boolean;
          must_match_partner?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          status?: Database["public"]["Enums"]["rule_status"];
          scope_type?: Database["public"]["Enums"]["rule_scope_type"];
          zone_id?: string | null;
          partner_id?: string | null;
          restaurant_id?: string | null;
          start_date?: string;
          end_date?: string;
          priority?: number;
          require_verified?: boolean;
          must_match_driver_zone?: boolean;
          must_match_partner?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      incentive_rules: {
        Row: {
          id: string;
          name: string;
          status: Database["public"]["Enums"]["rule_status"];
          scope_type: Database["public"]["Enums"]["rule_scope_type"];
          zone_id: string | null;
          partner_id: string | null;
          restaurant_id: string | null;
          period: Database["public"]["Enums"]["incentive_period"];
          target_deliveries: number;
          reward_kwd: number;
          start_date: string;
          end_date: string;
          priority: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          status?: Database["public"]["Enums"]["rule_status"];
          scope_type: Database["public"]["Enums"]["rule_scope_type"];
          zone_id?: string | null;
          partner_id?: string | null;
          restaurant_id?: string | null;
          period: Database["public"]["Enums"]["incentive_period"];
          target_deliveries?: number;
          reward_kwd?: number;
          start_date: string;
          end_date: string;
          priority?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          status?: Database["public"]["Enums"]["rule_status"];
          scope_type?: Database["public"]["Enums"]["rule_scope_type"];
          zone_id?: string | null;
          partner_id?: string | null;
          restaurant_id?: string | null;
          period?: Database["public"]["Enums"]["incentive_period"];
          target_deliveries?: number;
          reward_kwd?: number;
          start_date?: string;
          end_date?: string;
          priority?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      deliveries: {
        Row: {
          id: string;
          driver_id: string;
          partner_id: string | null;
          zone_id: string | null;
          restaurant_id: string | null;
          external_order_id: string | null;
          order_proof_url: string | null;
          status: Database["public"]["Enums"]["delivery_status"];
          rejection_reason: string | null;
          delivered_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          partner_id?: string | null;
          zone_id?: string | null;
          restaurant_id?: string | null;
          external_order_id?: string | null;
          order_proof_url?: string | null;
          status?: Database["public"]["Enums"]["delivery_status"];
          rejection_reason?: string | null;
          delivered_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          driver_id?: string;
          partner_id?: string | null;
          zone_id?: string | null;
          restaurant_id?: string | null;
          external_order_id?: string | null;
          order_proof_url?: string | null;
          status?: Database["public"]["Enums"]["delivery_status"];
          rejection_reason?: string | null;
          delivered_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      driver_earnings_daily: {
        Row: {
          id: string;
          driver_id: string;
          earn_date: string;
          deliveries: number;
          base_kwd: number;
          incentive_kwd: number;
          loan_deduction_kwd: number;
          penalty_kwd: number;
          reimbursement_kwd: number;
          net_kwd: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          earn_date: string;
          deliveries?: number;
          base_kwd?: number;
          incentive_kwd?: number;
          loan_deduction_kwd?: number;
          penalty_kwd?: number;
          reimbursement_kwd?: number;
          net_kwd?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          driver_id?: string;
          earn_date?: string;
          deliveries?: number;
          base_kwd?: number;
          incentive_kwd?: number;
          loan_deduction_kwd?: number;
          penalty_kwd?: number;
          reimbursement_kwd?: number;
          net_kwd?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      partners: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      claim_super_admin: { Args: { p_user_id: string }; Returns: boolean };
      is_admin_panel_user: { Args: never; Returns: boolean };
      is_staff: { Args: never; Returns: boolean };
      is_super_admin_user: { Args: never; Returns: boolean };
      delivery_matches_rules: {
        Args: { p_delivery_id: string; p_on_date?: string };
        Returns: boolean;
      };
      recalculate_driver_earnings: {
        Args: { p_driver_id: string; p_earn_date: string };
        Returns: undefined;
      };
      preview_driver_earnings: { Args: { p_earn_date: string }; Returns: Json };
      recalculate_earnings_for_date: { Args: { p_earn_date: string }; Returns: number };
    };
    Enums: {
      app_role: "rider" | "staff";
      admin_approval_status: "pending" | "approved" | "rejected";
      zone_geometry_type: "polygon" | "circle";
      driver_intake_status: "awaiting_app_link" | "linked" | "cancelled";
      driver_workflow_status: "draft" | "pending" | "approved";
      driver_status: "active" | "suspended" | "pending";
      vehicle_status: "active" | "suspended" | "maintenance";
      project_type: "group" | "rent";
      document_type: "license" | "civil_id" | "work_permit" | "passport";
      asset_type: "gps" | "sim" | "phone" | "delivery_bag" | "helmet" | "uniform";
      delivery_status: "pending" | "verified" | "rejected";
      rule_scope_type: "zone" | "partner" | "restaurant";
      rule_status: "draft" | "active" | "ended";
      incentive_period: "daily" | "weekly" | "monthly";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type AppRole = Database["public"]["Enums"]["app_role"];
export type AdminApprovalStatus = Database["public"]["Enums"]["admin_approval_status"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
