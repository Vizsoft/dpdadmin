import { getTranslations, setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { AppPage } from "@/components/app/app-page";
import { AppPageHeader } from "@/components/app/app-page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "dashboard.view");
  const t = await getTranslations("pages.reports");

  return (
    <AppPage>
      <AppPageHeader title={t("title")} description={t("subtitle")} />
      <Card className="rounded-xl border-border shadow-sm">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">{t("placeholder")}</p>
        </CardContent>
      </Card>
    </AppPage>
  );
}
