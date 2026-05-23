"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { syncAdminProfile } from "@/lib/auth/sync-profile";
import { getAppOpsSettings } from "@/lib/auth/app-settings";
import { logAdminAuthEvent } from "@/lib/audit/log-admin-activity";

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
    void logAdminAuthEvent({
      action: "auth",
      routeName: "signInWithEmail",
      success: false,
      context: { email },
      errorMessage: error.message,
    });
    return { error: "invalid_credentials" };
  }

  const sync = await syncAdminProfile(supabase, data.user, locale);

  if (!sync.ok) {
    await supabase.auth.signOut();
    void logAdminAuthEvent({
      action: "auth",
      routeName: "signInWithEmail",
      success: false,
      context: { email, reason: sync.reason },
      adminUserId: data.user.id,
    });
    return { error: sync.reason === "not_authorized" ? "not_authorized" : "invalid_credentials" };
  }

  void logAdminAuthEvent({
    action: "auth",
    routeName: "signInWithEmail",
    success: true,
    context: { email, approvalStatus: sync.approvalStatus },
    adminUserId: data.user.id,
  });

  const ops = await getAppOpsSettings();

  if (!ops.superAdminClaimed) {
    redirect(`/${locale}/setup/claim-super-admin`);
  }

  if (sync.approvalStatus === "pending") {
    redirect(`/${locale}/pending-approval`);
  }

  redirect(`/${locale}/dashboard`);
}

export async function signUp(
  locale: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!email || !password || !fullName) {
    return { error: "missing_fields" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: "signup_failed" };
  }

  if (!data.user) {
    return { error: "signup_failed" };
  }

  const sync = await syncAdminProfile(supabase, data.user, locale, fullName);

  if (!sync.ok) {
    return { error: "signup_failed" };
  }

  const ops = await getAppOpsSettings();

  if (!ops.superAdminClaimed) {
    redirect(`/${locale}/setup/claim-super-admin`);
  }

  redirect(`/${locale}/pending-approval`);
}

export async function claimSuperAdmin(locale: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "not_authenticated" };
  }

  const { data, error } = await supabase.rpc("claim_super_admin", {
    p_user_id: user.id,
  });

  if (error || !data) {
    return { error: "claim_failed" };
  }

  updateTag("app-settings");
  updateTag("app-ops-settings");
  updateTag("admin-roles");

  redirect(`/${locale}/dashboard`);
}

export async function requestPasswordReset(
  locale: string,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return { error: "missing_fields" };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/${locale}/reset-password`,
  });

  if (error) {
    return { error: "reset_failed" };
  }

  return { success: true };
}

export async function updatePassword(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { error: "weak_password" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "update_failed" };
  }

  return { success: true };
}

export async function signOut(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/login`);
}
