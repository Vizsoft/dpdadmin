import { getTranslations, setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { ModuleListShell } from "@/components/dashboard/module-list-shell";
import { Button } from "@/components/ui/button";

export default async function EarningsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "earnings.view");
  const t = await getTranslations("pages.earnings");

  return (
    <ModuleListShell
      title={t("title")}
      subtitle={t("subtitle")}
      actions={
        <Button className="cursor-pointer rounded-lg" disabled>
          {t("createOffer")}
        </Button>
      }
      tabs={[
        { id: "earnings", label: t("tabEarnings") },
        { id: "offers", label: t("tabOffers") },
      ]}
      activeTabId="earnings"
      kpis={[
        { label: t("kpiTotalPaid"), value: "—" },
        { label: t("kpiPending"), value: "—" },
        { label: t("kpiActiveOffers"), value: "—" },
        { label: t("kpiDrivers"), value: "—" },
        { label: t("kpiIncentives"), value: "—" },
        { label: t("kpiDeductions"), value: "—" },
      ]}
      columns={[t("colDriver"), t("colDate"), t("colDeliveries"), t("colNet"), t("colStatus")]}
      emptyTitle={t("emptyTitle")}
    />
  );
}
