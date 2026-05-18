"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { BrandingSettingsPanel } from "@/features/settings/branding-settings-panel";
import {
  AccessRequestsPanel,
  type PendingUser,
} from "@/features/settings/access-requests-panel";
import {
  RolesPermissionsPanel,
  type PermissionRow,
} from "@/features/settings/roles-permissions-panel";
import { MaintenancePanel } from "@/features/settings/maintenance-panel";
import { SettingsAdminLinks } from "@/features/settings/settings-admin-links";
import type { AdminRoleRow } from "@/lib/auth/get-role-permissions";

export function SettingsPanels({
  pendingUsers,
  assignableRoles,
  allRoles,
  permissions,
  maintenanceMode,
}: {
  pendingUsers: PendingUser[];
  assignableRoles: AdminRoleRow[];
  allRoles: AdminRoleRow[];
  permissions: PermissionRow[];
  maintenanceMode: boolean;
}) {
  const t = useTranslations("pages.settings");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SettingsAdminLinks />
      <MaintenancePanel maintenanceMode={maintenanceMode} />
      <AccessRequestsPanel pendingUsers={pendingUsers} assignableRoles={assignableRoles} />
      <RolesPermissionsPanel roles={allRoles} permissions={permissions} />
      <BrandingSettingsPanel />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("localeLabel")}</CardTitle>
        </CardHeader>
        <CardContent>
          <LocaleSwitcher />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("themeLabel")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>
    </div>
  );
}
