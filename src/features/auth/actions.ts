"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncAdminProfile } from "@/lib/auth/sync-profile";

export async function signInWithEmail(
  locale: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "missing_fields" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "invalid_credentials" };
  }

  const sync = await syncAdminProfile(supabase, data.user, locale);

  if (!sync.ok) {
    await supabase.auth.signOut();
    return { error: sync.reason === "not_authorized" ? "not_authorized" : "invalid_credentials" };
  }

  redirect(`/${locale}/dashboard`);
}

export async function signOut(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/login`);
}
