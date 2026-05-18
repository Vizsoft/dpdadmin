"use server";

import { updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/get-session";
import { PERMISSIONS, type Permission } from "@/lib/auth/permissions";

async function requireRolesManager() {
  const session = await getSessionUser();
  if (!session?.isSuperAdmin) {
    return { error: "not_authorized" as const };
  }
  return { session };
}

export async function updateRolePermissions(
  roleId: string,
  permissionSlugs: string[],
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireRolesManager();
  if ("error" in auth) return auth;

  const valid = new Set(Object.values(PERMISSIONS));
  const filtered = permissionSlugs.filter((s) => valid.has(s as Permission));

  const supabase = await createClient();

  const { data: role } = await supabase
    .from("admin_roles")
    .select("is_super_admin, is_system")
    .eq("id", roleId)
    .maybeSingle();

  if (!role) {
    return { error: "role_not_found" };
  }

  if (role.is_super_admin) {
    return { error: "cannot_edit_super_admin" };
  }

  await supabase.from("admin_role_permissions").delete().eq("role_id", roleId);

  if (filtered.length > 0) {
    const { error } = await supabase.from("admin_role_permissions").insert(
      filtered.map((permission_slug) => ({
        role_id: roleId,
        permission_slug,
      })),
    );

    if (error) {
      return { error: "save_failed" };
    }
  }

  updateTag("admin-roles");
  return { success: true };
}

export async function createCustomRole(
  name: string,
  slug: string,
  permissionSlugs: string[],
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireRolesManager();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const { data: role, error } = await supabase
    .from("admin_roles")
    .insert({ name, slug, is_system: false, is_super_admin: false })
    .select("id")
    .single();

  if (error || !role) {
    return { error: "save_failed" };
  }

  return updateRolePermissions(role.id, permissionSlugs);
}
