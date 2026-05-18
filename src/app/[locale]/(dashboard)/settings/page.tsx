import { getTranslations, setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { getSessionUser } from "@/lib/auth/get-session";
import { getAppOpsSettings } from "@/lib/auth/app-settings";
import { getAllAdminRoles } from "@/lib/auth/get-role-permissions";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsPanels } from "@/features/settings/settings-panels";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "settings.view");
  const t = await getTranslations("pages.settings");
  const session = await getSessionUser();
  const supabase = await createClient();
  const ops = await getAppOpsSettings();
  const allRoles = await getAllAdminRoles();

  const { data: pendingUsers } = await supabase
    .from("profiles")
    .select("id, email, full_name, created_at")
    .eq("approval_status", "pending")
    .order("created_at", { ascending: false });

  const { data: permissions } = await supabase
    .from("admin_permissions")
    .select("slug, label, category")
    .order("category")
    .order("label");

  const assignableRoles = allRoles.filter((r) => !r.isSuperAdmin);

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <Card className="rounded-xl border-border shadow-sm">
        <CardHeader>
          <CardTitle>{t("profileLabel")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>{session?.profile.full_name ?? session?.email}</p>
          <p className="text-muted-foreground">{session?.email}</p>
          <p className="text-muted-foreground capitalize">{session?.profile.role}</p>
        </CardContent>
      </Card>
      <SettingsPanels
        pendingUsers={pendingUsers ?? []}
        assignableRoles={assignableRoles}
        allRoles={allRoles}
        permissions={permissions ?? []}
        maintenanceMode={ops.maintenanceMode}
      />
    </>
  );
}
