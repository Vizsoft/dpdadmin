import { getTranslations, setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { getSessionUser } from "@/lib/auth/get-session";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsPanels } from "@/features/settings/settings-panels";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "settings.view");
  const t = await getTranslations("pages.settings");
  const session = await getSessionUser();

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <Card>
        <CardHeader>
          <CardTitle>{t("profileLabel")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>{session?.profile.full_name ?? session?.email}</p>
          <p className="text-muted-foreground">{session?.email}</p>
          <p className="text-muted-foreground capitalize">{session?.profile.role}</p>
        </CardContent>
      </Card>
      <SettingsPanels />
    </div>
  );
}
