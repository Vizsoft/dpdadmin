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
      drivers: {
        Row: {
          id: string;
          driver_code: string;
          zone_id: string | null;
          partner_id: string | null;
        };
        Insert: {
          id: string;
          driver_code: string;
          zone_id?: string | null;
          partner_id?: string | null;
        };
        Update: {
          id?: string;
          driver_code?: string;
          zone_id?: string | null;
          partner_id?: string | null;
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
      partners: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
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
    };
    Enums: {
      app_role: "rider" | "staff";
      admin_approval_status: "pending" | "approved" | "rejected";
      zone_geometry_type: "polygon" | "circle";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type AppRole = Database["public"]["Enums"]["app_role"];
export type AdminApprovalStatus = Database["public"]["Enums"]["admin_approval_status"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
