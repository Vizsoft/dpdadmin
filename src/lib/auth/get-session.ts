import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { canAccessAdminPanel } from "./permissions";

export type SessionUser = {
  id: string;
  email: string | null;
  profile: Profile;
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
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  if (!canAccessAdminPanel(profile.role, profile.archived_at)) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? profile.email,
    profile,
  };
}
