import type { Profile } from "@/types/database";
import {
  type AdminApprovalStatus,
  type AuthProfile,
  canAccessAdminPanel,
} from "@/lib/auth/permissions";
import { getPermissionsForRole, getRoleById } from "@/lib/auth/get-role-permissions";

export type EnrichedProfile = Profile & {
  admin_role_id: string | null;
  approval_status: AdminApprovalStatus;
  approved_at: string | null;
  approved_by: string | null;
};

export function toAuthProfile(
  profile: EnrichedProfile,
  isSuperAdmin: boolean,
): AuthProfile {
  return {
    id: profile.id,
    role: profile.role,
    adminRoleId: profile.admin_role_id,
    approvalStatus: profile.approval_status,
    isSuperAdmin,
    archivedAt: profile.archived_at,
  };
}

export async function enrichSessionPermissions(adminRoleId: string | null, isSuperAdmin: boolean) {
  if (!adminRoleId) {
    return new Set<string>();
  }
  const perms = await getPermissionsForRole(adminRoleId);
  if (isSuperAdmin) {
    return new Set(perms);
  }
  return new Set(perms);
}

export async function resolveIsSuperAdmin(adminRoleId: string | null): Promise<boolean> {
  if (!adminRoleId) return false;
  const role = await getRoleById(adminRoleId);
  return role?.isSuperAdmin ?? false;
}

export { canAccessAdminPanel };
