import { setRequestLocale } from "next-intl/server";
import { EarningsCalculationPageShell } from "@/features/dpd/earnings-calculation-page-shell";
import { requirePermission } from "@/lib/auth/require-permission";
import { logAdminPageView } from "@/lib/audit/log-admin-activity";

export default async function EarningsCalculationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "earnings.view");
  void logAdminPageView("/earnings-calculation", "EarningsCalculationPage");

  return <EarningsCalculationPageShell />;
}
