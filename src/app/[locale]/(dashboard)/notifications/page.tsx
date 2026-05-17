import { getTranslations, setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { ModuleListShell } from "@/components/dashboard/module-list-shell";
import { Button } from "@/components/ui/button";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "notifications.view");
  const t = await getTranslations("pages.notifications");

  return (
    <ModuleListShell
      title={t("title")}
      subtitle={t("subtitle")}
      actions={
        <Button className="cursor-pointer rounded-lg" disabled>
          {t("createNotification")}
        </Button>
      }
      tabs={[
        { id: "recent", label: t("tabRecent") },
        { id: "hygiene", label: t("tabHygiene") },
        { id: "history", label: t("tabHistory") },
      ]}
      activeTabId="recent"
      kpis={[
        { label: t("kpiSent"), value: "—" },
        { label: t("kpiScheduled"), value: "—" },
        { label: t("kpiHygiene"), value: "—" },
        { label: t("kpiRecipients"), value: "—" },
        { label: t("kpiOpenRate"), value: "—" },
        { label: t("kpiFailed"), value: "—" },
      ]}
      columns={[t("colTitle"), t("colAudience"), t("colStatus"), t("colSent")]}
      emptyTitle={t("emptyTitle")}
    />
  );
}
