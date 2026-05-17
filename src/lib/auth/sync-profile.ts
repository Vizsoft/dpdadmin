import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { canAccessAdminPanel } from "./permissions";

type Supabase = SupabaseClient<Database>;

export async function syncAdminProfile(
  supabase: Supabase,
  user: { id: string; email?: string | null },
  locale = "en",
): Promise<{ ok: true } | { ok: false; reason: "not_authorized" | "no_profile" }> {
  if (!user.email) {
    return { ok: false, reason: "not_authorized" };
  }

  const email = user.email.toLowerCase();

  const { data: allowlist } = await supabase
    .from("admin_allowlist")
    .select("role")
    .eq("email", email)
    .maybeSingle();

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!allowlist && existingProfile?.role !== "staff") {
    return { ok: false, reason: "not_authorized" };
  }

  const role = allowlist?.role ?? existingProfile?.role ?? "staff";

  const { error: upsertError } = await supabase.from("profiles").upsert({
    id: user.id,
    email,
    full_name: existingProfile?.full_name ?? null,
    avatar_url: existingProfile?.avatar_url ?? null,
    role,
    locale: existingProfile?.locale ?? locale,
    updated_at: new Date().toISOString(),
  });

  if (upsertError) {
    return { ok: false, reason: "no_profile" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, archived_at")
    .eq("id", user.id)
    .single();

  if (!profile || !canAccessAdminPanel(profile.role, profile.archived_at)) {
    return { ok: false, reason: "not_authorized" };
  }

  return { ok: true };
}
