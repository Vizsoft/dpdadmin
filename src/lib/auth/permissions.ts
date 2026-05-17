import type { AppRole } from "@/types/database";

export const PERMISSIONS = {
  "dashboard.view": "dashboard.view",
  "users.view": "users.view",
  "users.manage": "users.manage",
  "orders.view": "orders.view",
  "reports.view": "reports.view",
  "settings.view": "settings.view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  staff: [
    PERMISSIONS["dashboard.view"],
    PERMISSIONS["users.view"],
    PERMISSIONS["users.manage"],
    PERMISSIONS["orders.view"],
    PERMISSIONS["reports.view"],
    PERMISSIONS["settings.view"],
  ],
  rider: [PERMISSIONS["dashboard.view"]],
};

export function hasPermission(role: AppRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAccessAdminPanel(role: AppRole, archivedAt: string | null): boolean {
  return role === "staff" && archivedAt === null;
}
