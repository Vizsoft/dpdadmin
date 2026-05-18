import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";

export type MenuNodeType = "item" | "group";

export interface MenuNode {
  id: string;
  type: MenuNodeType;
  label: string;
  icon: string;
  hidden?: boolean;
  displayMode?: "inline" | "panel";
  children?: MenuNode[];
}

export async function getMenuConfig(role: string): Promise<MenuNode[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("menu_configs")
    .select("config")
    .eq("role", role)
    .eq("scope", "global")
    .is("site_id", null)
    .maybeSingle();

  if (error) {
    console.error("getMenuConfig", error);
    return [];
  }
  const cfg = data?.config as unknown;
  return Array.isArray(cfg) ? (cfg as MenuNode[]) : [];
}

export async function saveMenuConfig(role: string, config: MenuNode[]): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: existing } = await supabase
    .from("menu_configs")
    .select("id")
    .eq("role", role)
    .eq("scope", "global")
    .is("site_id", null)
    .maybeSingle();

  const payload = {
    role,
    scope: "global" as const,
    site_id: null,
    config: config as unknown as Json,
    updated_at: new Date().toISOString(),
    updated_by: user?.id ?? null,
  };

  const { error } = existing
    ? await supabase.from("menu_configs").update(payload).eq("id", existing.id)
    : await supabase.from("menu_configs").insert(payload);

  if (error) throw error;
}

export async function resetMenuConfig(role: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("menu_configs")
    .delete()
    .eq("role", role)
    .eq("scope", "global")
    .is("site_id", null);
  if (error) throw error;
}
