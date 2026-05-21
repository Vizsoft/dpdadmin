import { setRequestLocale } from "next-intl/server";
import { EarningsCalculationPageShell } from "@/features/dpd/earnings-calculation-page-shell";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function EarningsCalculationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "earnings.view");

  return <EarningsCalculationPageShell />;
}
