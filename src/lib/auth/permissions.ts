import type { AppRole } from "@/types/database";

export const PERMISSIONS = {
  "dashboard.view": "dashboard.view",
  "drivers.view": "drivers.view",
  "drivers.manage": "drivers.manage",
  "vehicles.view": "vehicles.view",
  "vehicles.manage": "vehicles.manage",
  "deliveries.view": "deliveries.view",
  "deliveries.manage": "deliveries.manage",
  "zones.view": "zones.view",
  "zones.manage": "zones.manage",
  "attendance.view": "attendance.view",
  "requests.view": "requests.view",
  "requests.manage": "requests.manage",
  "wrong_actions.view": "wrong_actions.view",
  "wrong_actions.manage": "wrong_actions.manage",
  "earnings.view": "earnings.view",
  "earnings.manage": "earnings.manage",
  "notifications.view": "notifications.view",
  "notifications.manage": "notifications.manage",
  "support.view": "support.view",
  "support.manage": "support.manage",
  "settings.view": "settings.view",
  "settings.manage": "settings.manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const STAFF_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  staff: STAFF_PERMISSIONS,
  rider: [PERMISSIONS["dashboard.view"]],
};

export function hasPermission(role: AppRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAccessAdminPanel(role: AppRole, archivedAt: string | null): boolean {
  return role === "staff" && archivedAt === null;
}
