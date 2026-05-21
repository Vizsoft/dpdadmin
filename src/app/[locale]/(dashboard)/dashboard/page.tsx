import { getTranslations, setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { AppPage } from "@/components/app/app-page";
import { AppPageHeader } from "@/components/app/app-page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
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
    { label: t("kpiOnDuty"), value: "—" },
    { label: t("kpiSuspended"), value: "—" },
  ];

  return (
    <AppPage>
      <AppPageHeader title={t("title")} description={t("subtitle")} />
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} />
          ))}
        </div>
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">{t("chartPlaceholder")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    </AppPage>
  );
}
