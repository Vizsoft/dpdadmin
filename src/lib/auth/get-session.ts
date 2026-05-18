import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { canAccessAdminPanel, type AdminApprovalStatus } from "@/lib/auth/permissions";
import {
  enrichSessionPermissions,
  resolveIsSuperAdmin,
  toAuthProfile,
  type EnrichedProfile,
} from "@/lib/auth/profile-auth";

export type SessionUser = {
  id: string;
  email: string | null;
  profile: EnrichedProfile;
  permissions: Set<string>;
  isSuperAdmin: boolean;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "*, admin_role_id, approval_status, approved_at, approved_by",
    )
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  const enriched = profile as EnrichedProfile & Profile;
  const isSuperAdmin = await resolveIsSuperAdmin(enriched.admin_role_id);
  const authProfile = toAuthProfile(enriched, isSuperAdmin);

  if (!canAccessAdminPanel(authProfile) && enriched.approval_status !== "pending") {
    if (enriched.approval_status === "rejected") {
      return null;
    }
  }

  const permissions = await enrichSessionPermissions(
    enriched.admin_role_id,
    isSuperAdmin,
  );

  return {
    id: user.id,
    email: user.email ?? enriched.email,
    profile: enriched,
    permissions,
    isSuperAdmin,
  };
}

export async function getProfileForUser(userId: string): Promise<EnrichedProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*, admin_role_id, approval_status, approved_at, approved_by")
    .eq("id", userId)
    .maybeSingle();

  return (data as EnrichedProfile | null) ?? null;
}

export type { AdminApprovalStatus };
