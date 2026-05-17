import { getTranslations, setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { ModuleListShell } from "@/components/dashboard/module-list-shell";

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "attendance.view");
  const t = await getTranslations("pages.attendance");

  return (
    <ModuleListShell
      title={t("title")}
      subtitle={t("subtitle")}
      tabs={[
        { id: "live", label: t("tabLive") },
        { id: "logs", label: t("tabLogs") },
        { id: "exceptions", label: t("tabExceptions") },
      ]}
      activeTabId="live"
      kpis={[
        { label: t("kpiPresent"), value: "—" },
        { label: t("kpiLate"), value: "—" },
        { label: t("kpiAbsent"), value: "—" },
        { label: t("kpiOnLeave"), value: "—" },
        { label: t("kpiOutsideZone"), value: "—" },
        { label: t("kpiCompliance"), value: "—" },
      ]}
      columns={[t("colDriver"), t("colDate"), t("colCheckIn"), t("colCheckOut"), t("colStatus")]}
      emptyTitle={t("emptyTitle")}
    />
  );
}
