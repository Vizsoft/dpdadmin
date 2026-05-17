import { getTranslations, setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "dashboard.view");
  const t = await getTranslations("pages.dashboard");

  const kpis = [
    { label: t("kpiDeliveries"), value: "—" },
    { label: t("kpiActiveRiders"), value: "—" },
    { label: t("kpiPendingFuel"), value: "—" },
    { label: t("kpiZones"), value: "—" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("chartPlaceholder")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}
