import { getTranslations, setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { getSessionUser } from "@/lib/auth/get-session";
import { ProfileSettingsPanel } from "@/features/settings/profile-settings-panel";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "settings.view");
  const session = await getSessionUser();

  return (
    <ProfileSettingsPanel
        profile={{
          fullName: session?.profile.full_name ?? null,
          email: session?.email ?? null,
          phone: session?.profile.phone ?? null,
          role: session?.profile.role ?? "",
        }}
      />
  );
}
