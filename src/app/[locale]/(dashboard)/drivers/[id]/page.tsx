import { getTranslations, setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { ModuleListShell } from "@/components/dashboard/module-list-shell";

export default async function DriverDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "drivers.view");
  const t = await getTranslations("pages.driverDetail");

  return (
    <ModuleListShell
      title={t("title")}
      subtitle={`${t("subtitle")} · ${id.slice(0, 8)}…`}
      tabs={[
        { id: "attendance", label: t("tabAttendance") },
        { id: "documents", label: t("tabDocuments") },
        { id: "assets", label: t("tabAssets") },
        { id: "earnings", label: t("tabEarnings") },
        { id: "deductions", label: t("tabDeductions") },
        { id: "loan", label: t("tabLoan") },
        { id: "complaint", label: t("tabComplaint") },
        { id: "wrong-actions", label: t("tabWrongActions") },
      ]}
      activeTabId="attendance"
      kpis={[
        { label: "Deliveries", value: "—" },
        { label: "Earnings", value: "—" },
        { label: "Wrong Actions", value: "—" },
        { label: "Loan Balance", value: "—" },
        { label: "Status", value: "—" },
        { label: "Zone", value: "—" },
      ]}
      columns={["Date", "Type", "Amount", "Status"]}
      emptyTitle={t("emptyTitle")}
    />
  );
}
