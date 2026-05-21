import { setRequestLocale } from "next-intl/server";
import { DpdPageShell } from "@/features/dpd/dpd-page-shell";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function DpdPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "earnings.view");

  return <DpdPageShell />;
}
