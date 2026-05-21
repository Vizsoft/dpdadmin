export const PERMISSIONS = {
  "dashboard.view": "dashboard.view",
  "drivers.view": "drivers.view",
  "drivers.manage": "drivers.manage",
  "partners.view": "partners.view",
  "partners.manage": "partners.manage",
  "restaurants.view": "restaurants.view",
  "restaurants.manage": "restaurants.manage",
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
  "users.manage": "users.manage",
  "roles.manage": "roles.manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type AdminApprovalStatus = "pending" | "approved" | "rejected";

export type AuthProfile = {
  id: string;
  role: "rider" | "staff";
  adminRoleId: string | null;
  approvalStatus: AdminApprovalStatus;
  isSuperAdmin: boolean;
  archivedAt: string | null;
};

export function hasPermissionInSet(
  permissions: ReadonlySet<string>,
  permission: Permission,
  isSuperAdmin: boolean,
): boolean {
  if (isSuperAdmin) return true;
  return permissions.has(permission);
}

/** View restaurants on /restaurants or legacy DPD earnings screens. */
export const RESTAURANTS_VIEW_PERMISSIONS = [
  "restaurants.view",
  "earnings.view",
] as const satisfies readonly Permission[];

/** Create/update/delete restaurants. */
export const RESTAURANTS_MANAGE_PERMISSIONS = [
  "restaurants.manage",
  "earnings.manage",
] as const satisfies readonly Permission[];

export function hasAnyPermissionInSet(
  permissions: ReadonlySet<string>,
  permissionList: readonly Permission[],
  isSuperAdmin: boolean,
): boolean {
  if (isSuperAdmin) return true;
  return permissionList.some((p) => permissions.has(p));
}

export function canViewRestaurants(
  permissions: ReadonlySet<string>,
  isSuperAdmin: boolean,
): boolean {
  return hasAnyPermissionInSet(
    permissions,
    RESTAURANTS_VIEW_PERMISSIONS,
    isSuperAdmin,
  );
}

export function canManageRestaurants(
  permissions: ReadonlySet<string>,
  isSuperAdmin: boolean,
): boolean {
  return hasAnyPermissionInSet(
    permissions,
    RESTAURANTS_MANAGE_PERMISSIONS,
    isSuperAdmin,
  );
}

export function canAccessAdminPanel(profile: AuthProfile): boolean {
  return (
    profile.role === "staff" &&
    profile.archivedAt === null &&
    profile.approvalStatus === "approved" &&
    profile.adminRoleId !== null
  );
}

export function needsPendingApproval(profile: AuthProfile): boolean {
  return profile.approvalStatus === "pending";
}

export function isRejected(profile: AuthProfile): boolean {
  return profile.approvalStatus === "rejected";
}
