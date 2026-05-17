import { getTranslations, setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "reports.view");
  const t = await getTranslations("pages.reports");

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">{t("placeholder")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
