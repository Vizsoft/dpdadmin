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
          updated_at?: string;
          zone_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin_panel_user: { Args: never; Returns: boolean };
      is_staff: { Args: never; Returns: boolean };
    };
    Enums: {
      app_role: "rider" | "staff";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type AppRole = Database["public"]["Enums"]["app_role"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
