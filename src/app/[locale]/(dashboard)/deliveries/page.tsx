import { getTranslations, setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { ModuleListShell } from "@/components/dashboard/module-list-shell";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function DeliveriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "deliveries.view");
  const t = await getTranslations("pages.deliveries");

  return (
    <ModuleListShell
      title={t("title")}
      subtitle={t("subtitle")}
      actions={
        <Button variant="outline" className="cursor-pointer rounded-lg" render={<Link href="/deliveries/zones" />}>
          Zones
        </Button>
      }
      tabs={[
        { id: "all", label: t("tabAll") },
        { id: "on-duty", label: t("tabOnDuty") },
        { id: "off-duty", label: t("tabOffDuty") },
        { id: "deliveries", label: t("tabDeliveries") },
        { id: "outside-zone", label: t("tabOutsideZone") },
      ]}
      activeTabId="all"
      kpis={[
        { label: t("kpiOnDuty"), value: "—" },
        { label: t("kpiOffDuty"), value: "—" },
        { label: t("kpiDeliveries"), value: "—" },
        { label: t("kpiPending"), value: "—" },
        { label: t("kpiOutsideZone"), value: "—" },
        { label: t("kpiZones"), value: "—" },
      ]}
      columns={[t("colDriver"), t("colZone"), t("colStatus"), t("colOrder"), t("colTime")]}
      emptyTitle={t("emptyTitle")}
      emptyDescription={t("emptyDescription")}
    />
  );
}
