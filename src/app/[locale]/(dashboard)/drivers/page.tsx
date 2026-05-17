import { getTranslations, setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { ModuleListShell } from "@/components/dashboard/module-list-shell";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function DriversPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "drivers.view");
  const t = await getTranslations("pages.drivers");

  return (
    <ModuleListShell
      title={t("title")}
      subtitle={t("subtitle")}
      actions={
        <Button className="cursor-pointer rounded-lg" render={<Link href="/drivers/new" />}>
          {t("addDriver")}
        </Button>
      }
      tabs={[
        { id: "all", label: t("tabAll") },
        { id: "pending", label: t("tabPending") },
        { id: "on-duty", label: t("tabOnDuty") },
      ]}
      activeTabId="all"
      kpis={[
        { label: t("kpiTotal"), value: "—" },
        { label: t("kpiOnDuty"), value: "—" },
        { label: t("kpiSuspended"), value: "—" },
        { label: t("kpiPending"), value: "—" },
        { label: t("kpiOutsideZone"), value: "—" },
        { label: t("kpiDeliveries"), value: "—" },
      ]}
      columns={[t("colDriver"), t("colZone"), t("colStatus"), t("colDeliveries"), t("colEarnings")]}
      emptyTitle={t("emptyTitle")}
      emptyDescription={t("emptyDescription")}
    />
  );
}
