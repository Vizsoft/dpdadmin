import { setRequestLocale } from "next-intl/server";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { getAllAdminRoles } from "@/lib/auth/get-role-permissions";
import { createClient } from "@/lib/supabase/server";
import { RolesPermissionsPanel } from "@/features/settings/roles-permissions-panel";

export default async function RolesPermissionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireSuperAdmin(locale);
  const supabase = await createClient();
  const allRoles = await getAllAdminRoles();

  const { data: permissions } = await supabase
    .from("admin_permissions")
    .select("slug, label, category")
    .order("category")
    .order("label");

  return <RolesPermissionsPanel roles={allRoles} permissions={permissions ?? []} />;
}
