import { getTranslations, setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { ModuleListShell } from "@/components/dashboard/module-list-shell";
import { Button } from "@/components/ui/button";

export default async function ZonesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "zones.view");
  const t = await getTranslations("pages.zones");

  return (
    <ModuleListShell
      title={t("title")}
      subtitle={t("subtitle")}
      actions={
        <Button className="cursor-pointer rounded-lg" disabled>
          {t("addZone")}
        </Button>
      }
      kpis={[
        { label: "Total Zones", value: "—" },
        { label: "Active", value: "—" },
        { label: "Drivers Assigned", value: "—" },
        { label: "Deliveries Today", value: "—" },
        { label: "Outside Zone", value: "—" },
        { label: "Coverage", value: "—" },
      ]}
      columns={[t("colName"), t("colCode"), t("colDrivers"), "Status", "Actions"]}
      emptyTitle={t("emptyTitle")}
    />
  );
}
